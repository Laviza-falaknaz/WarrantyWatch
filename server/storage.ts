import { 
  type SpareUnit, 
  type InsertSpareUnit, 
  type CoveredUnit, 
  type InsertCoveredUnit,
  type BulkInsertCoveredUnit, 
  type CoveragePool, 
  type InsertCoveragePool,
  type AppConfiguration,
  type InsertAppConfiguration,
  spareUnit,
  coveredUnit,
  coveragePool,
  appConfiguration
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, or, sql, desc, inArray } from "drizzle-orm";

export interface IStorage {
  // Spare Unit methods (units in pool available to cover warranties)
  getSpareUnits(filters?: {
    make?: string[];
    model?: string[];
    processor?: string[];
    ram?: string[];
    category?: string[];
    search?: string;
  }): Promise<SpareUnit[]>;
  getSpareUnitById(id: string): Promise<SpareUnit | undefined>;
  createSpareUnit(data: InsertSpareUnit): Promise<SpareUnit>;
  updateSpareUnit(id: string, data: Partial<InsertSpareUnit>): Promise<SpareUnit | undefined>;
  bulkReplaceSpareUnits(data: InsertSpareUnit[]): Promise<number>;
  
  // Covered Unit methods (units in field under warranty coverage)
  getCoveredUnits(filters?: {
    make?: string[];
    model?: string[];
    processor?: string[];
    ram?: string[];
    category?: string[];
    status?: string[];
    search?: string;
  }): Promise<CoveredUnit[]>;
  getCoveredUnitById(id: string): Promise<CoveredUnit | undefined>;
  createCoveredUnit(data: InsertCoveredUnit): Promise<CoveredUnit>;
  updateCoveredUnit(id: string, data: Partial<InsertCoveredUnit>): Promise<CoveredUnit | undefined>;
  bulkReplaceCoveredUnits(data: BulkInsertCoveredUnit[]): Promise<number>;
  
  // Coverage Pool methods
  getCoveragePools(): Promise<CoveragePool[]>;
  getCoveragePoolById(id: string): Promise<CoveragePool | undefined>;
  createCoveragePool(data: InsertCoveragePool): Promise<CoveragePool>;
  updateCoveragePool(id: string, data: Partial<InsertCoveragePool>): Promise<CoveragePool | undefined>;
  deleteCoveragePool(id: string): Promise<boolean>;
  
  // Filter options
  getFilterOptions(): Promise<{
    makes: string[];
    models: string[];
    processors: string[];
    rams: string[];
    categories: string[];
  }>;
  
  // Analytics
  getAnalytics(): Promise<{
    totalSpareUnits: number;
    totalCoveredUnits: number;
    activeCoverage: number;
    expiringCoverage: number;
    averageCoverageRatio: number;
    lowCoverageThresholdPercent: number;
    expiringCoverageDays: number;
  }>;
  
  // Configuration
  getConfiguration(): Promise<AppConfiguration>;
  updateConfiguration(data: Partial<InsertAppConfiguration>): Promise<AppConfiguration>;
}

export class DatabaseStorage implements IStorage {
  async getSpareUnits(filters?: {
    make?: string[];
    model?: string[];
    processor?: string[];
    ram?: string[];
    category?: string[];
    search?: string;
  }): Promise<SpareUnit[]> {
    let query = db.select().from(spareUnit);
    
    const conditions = [];
    
    if (filters?.make && filters.make.length > 0) {
      conditions.push(inArray(spareUnit.make, filters.make));
    }
    
    if (filters?.model && filters.model.length > 0) {
      conditions.push(inArray(spareUnit.model, filters.model));
    }
    
    if (filters?.processor && filters.processor.length > 0) {
      conditions.push(inArray(spareUnit.processor, filters.processor));
    }
    
    if (filters?.ram && filters.ram.length > 0) {
      conditions.push(inArray(spareUnit.ram, filters.ram));
    }
    
    if (filters?.category && filters.category.length > 0) {
      conditions.push(inArray(spareUnit.category, filters.category));
    }
    
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(spareUnit.serialNumber, searchTerm),
          like(spareUnit.make, searchTerm),
          like(spareUnit.model, searchTerm),
          like(spareUnit.productDescription, searchTerm)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return query.orderBy(desc(spareUnit.createdOn));
  }

  async getSpareUnitById(id: string): Promise<SpareUnit | undefined> {
    const [item] = await db.select().from(spareUnit).where(eq(spareUnit.id, id));
    return item || undefined;
  }

  async createSpareUnit(data: InsertSpareUnit): Promise<SpareUnit> {
    const [item] = await db.insert(spareUnit).values(data).returning();
    return item;
  }

  async updateSpareUnit(id: string, data: Partial<InsertSpareUnit>): Promise<SpareUnit | undefined> {
    const [item] = await db
      .update(spareUnit)
      .set({ ...data, modifiedOn: new Date() })
      .where(eq(spareUnit.id, id))
      .returning();
    return item || undefined;
  }

  async bulkReplaceSpareUnits(data: InsertSpareUnit[]): Promise<number> {
    // Upsert based on composite key (serialNumber + areaId + itemId)
    // Using ON CONFLICT to update if exists, insert if not
    if (data.length === 0) {
      return 0;
    }
    
    // Deduplicate records by composite key (serialNumber + areaId + itemId)
    // Keep the last occurrence of each duplicate
    const uniqueRecords = new Map<string, InsertSpareUnit>();
    for (const record of data) {
      const key = `${record.serialNumber}|${record.areaId}|${record.itemId}`;
      uniqueRecords.set(key, record);
    }
    const deduplicatedData = Array.from(uniqueRecords.values());
    
    if (deduplicatedData.length < data.length) {
      console.log(`[bulk-upload] Deduplicated ${data.length - deduplicatedData.length} duplicate spare unit records (${data.length} -> ${deduplicatedData.length})`);
    }
    
    // Process in batches of 500 to handle large datasets
    const batchSize = 500;
    let totalProcessed = 0;
    
    for (let i = 0; i < deduplicatedData.length; i += batchSize) {
      const batch = deduplicatedData.slice(i, i + batchSize);
      
      // Execute batch in a transaction for atomicity
      await db.transaction(async (tx) => {
        await tx.insert(spareUnit)
          .values(batch)
          .onConflictDoUpdate({
            target: [spareUnit.serialNumber, spareUnit.areaId, spareUnit.itemId],
            set: {
              make: sql`excluded.make`,
              model: sql`excluded.model`,
              processor: sql`excluded.processor`,
              generation: sql`excluded.generation`,
              ram: sql`excluded.ram`,
              hdd: sql`excluded.hdd`,
              displaySize: sql`excluded.display_size`,
              touchscreen: sql`excluded.touchscreen`,
              category: sql`excluded.category`,
              reservedForCase: sql`excluded.reserved_for_case`,
              retiredOrder: sql`excluded.retired_order`,
              currentHolder: sql`excluded.current_holder`,
              retiredDate: sql`excluded.retired_date`,
              productDescription: sql`excluded.product_description`,
              productNumber: sql`excluded.product_number`,
              modifiedOn: sql`now()`,
            },
          });
      });
      
      totalProcessed += batch.length;
    }
    
    return totalProcessed;
  }

  async getCoveredUnits(filters?: {
    make?: string[];
    model?: string[];
    processor?: string[];
    ram?: string[];
    category?: string[];
    status?: string[];
    search?: string;
  }): Promise<CoveredUnit[]> {
    let query = db.select().from(coveredUnit);
    
    const conditions = [];
    
    if (filters?.make && filters.make.length > 0) {
      conditions.push(inArray(coveredUnit.make, filters.make));
    }
    
    if (filters?.model && filters.model.length > 0) {
      conditions.push(inArray(coveredUnit.model, filters.model));
    }
    
    if (filters?.processor && filters.processor.length > 0) {
      conditions.push(inArray(coveredUnit.processor, filters.processor));
    }
    
    if (filters?.ram && filters.ram.length > 0) {
      conditions.push(inArray(coveredUnit.ram, filters.ram));
    }
    
    if (filters?.category && filters.category.length > 0) {
      conditions.push(inArray(coveredUnit.category, filters.category));
    }
    
    if (filters?.status && filters.status.length > 0) {
      if (filters.status.includes("Active")) {
        conditions.push(eq(coveredUnit.isCoverageActive, true));
      } else if (filters.status.includes("Inactive")) {
        conditions.push(eq(coveredUnit.isCoverageActive, false));
      }
    }
    
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(coveredUnit.serialNumber, searchTerm),
          like(coveredUnit.make, searchTerm),
          like(coveredUnit.model, searchTerm),
          like(coveredUnit.coverageDescription, searchTerm)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return query.orderBy(desc(coveredUnit.createdOn));
  }

  async getCoveredUnitById(id: string): Promise<CoveredUnit | undefined> {
    const [item] = await db.select().from(coveredUnit).where(eq(coveredUnit.id, id));
    return item || undefined;
  }

  async createCoveredUnit(data: InsertCoveredUnit): Promise<CoveredUnit> {
    // Calculate coverage duration days
    const startDate = data.coverageStartDate instanceof Date ? data.coverageStartDate : new Date(data.coverageStartDate);
    const endDate = data.coverageEndDate instanceof Date ? data.coverageEndDate : new Date(data.coverageEndDate);
    const coverageDurationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const [item] = await db.insert(coveredUnit).values({ 
      ...data, 
      coverageDurationDays 
    }).returning();
    return item;
  }

  async updateCoveredUnit(id: string, data: Partial<InsertCoveredUnit>): Promise<CoveredUnit | undefined> {
    const [item] = await db
      .update(coveredUnit)
      .set({ ...data, modifiedOn: new Date() })
      .where(eq(coveredUnit.id, id))
      .returning();
    return item || undefined;
  }

  async bulkReplaceCoveredUnits(data: BulkInsertCoveredUnit[]): Promise<number> {
    // Upsert based on composite key (serialNumber + areaId + itemId)
    // Using ON CONFLICT to update if exists, insert if not
    if (data.length === 0) {
      return 0;
    }
    
    // Deduplicate records by composite key (serialNumber + areaId + itemId)
    // Keep the last occurrence of each duplicate
    const uniqueRecords = new Map<string, BulkInsertCoveredUnit>();
    for (const record of data) {
      const key = `${record.serialNumber}|${record.areaId}|${record.itemId}`;
      uniqueRecords.set(key, record);
    }
    const deduplicatedData = Array.from(uniqueRecords.values());
    
    if (deduplicatedData.length < data.length) {
      console.log(`[bulk-upload] Deduplicated ${data.length - deduplicatedData.length} duplicate records (${data.length} -> ${deduplicatedData.length})`);
    }
    
    // Process in batches of 500 to handle large datasets
    const batchSize = 500;
    let totalProcessed = 0;
    
    for (let i = 0; i < deduplicatedData.length; i += batchSize) {
      const batch = deduplicatedData.slice(i, i + batchSize);
      
      // Precompute coverage duration days and convert dates for all items in batch
      // Also validate date integrity (start <= end) to maintain data quality
      const enrichedBatch = batch.map((item, idx) => {
        const startDate = item.coverageStartDate instanceof Date ? item.coverageStartDate : new Date(item.coverageStartDate);
        const endDate = item.coverageEndDate instanceof Date ? item.coverageEndDate : new Date(item.coverageEndDate);
        const orderDate = item.orderDate ? (item.orderDate instanceof Date ? item.orderDate : new Date(item.orderDate)) : null;
        
        // Validate date integrity - start date must be <= end date
        if (startDate > endDate) {
          throw new Error(`Invalid date range in batch item ${i + idx}: coverageStartDate (${startDate.toISOString()}) must be <= coverageEndDate (${endDate.toISOString()})`);
        }
        
        // Validate dates are valid (not NaN)
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error(`Invalid date format in batch item ${i + idx}: dates must be valid ISO 8601 strings or Date objects`);
        }
        
        const coverageDurationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return { 
          ...item, 
          coverageStartDate: startDate,
          coverageEndDate: endDate,
          orderDate,
          coverageDurationDays 
        };
      });
      
      // Execute batch in a transaction for atomicity
      await db.transaction(async (tx) => {
        await tx.insert(coveredUnit)
          .values(enrichedBatch)
          .onConflictDoUpdate({
            target: [coveredUnit.serialNumber, coveredUnit.areaId, coveredUnit.itemId],
            set: {
              make: sql`excluded.make`,
              model: sql`excluded.model`,
              processor: sql`excluded.processor`,
              generation: sql`excluded.generation`,
              ram: sql`excluded.ram`,
              hdd: sql`excluded.hdd`,
              displaySize: sql`excluded.display_size`,
              touchscreen: sql`excluded.touchscreen`,
              category: sql`excluded.category`,
              coverageStartDate: sql`excluded.coverage_start_date`,
              coverageEndDate: sql`excluded.coverage_end_date`,
              coverageDescription: sql`excluded.coverage_description`,
              coverageDurationDays: sql`excluded.coverage_duration_days`,
              isCoverageActive: sql`excluded.is_coverage_active`,
              customerName: sql`excluded.customer_name`,
              customerEmail: sql`excluded.customer_email`,
              customerPhone: sql`excluded.customer_phone`,
              orderNumber: sql`excluded.order_number`,
              orderDate: sql`excluded.order_date`,
              currentHolder: sql`excluded.current_holder`,
              productDescription: sql`excluded.product_description`,
              productNumber: sql`excluded.product_number`,
              modifiedOn: sql`now()`,
            },
          });
      });
      
      totalProcessed += batch.length;
    }
    
    return totalProcessed;
  }

  async getCoveragePools(): Promise<CoveragePool[]> {
    return db.select().from(coveragePool).orderBy(desc(coveragePool.createdOn));
  }

  async getCoveragePoolById(id: string): Promise<CoveragePool | undefined> {
    const [item] = await db.select().from(coveragePool).where(eq(coveragePool.id, id));
    return item || undefined;
  }

  async createCoveragePool(data: InsertCoveragePool): Promise<CoveragePool> {
    const [item] = await db.insert(coveragePool).values(data).returning();
    return item;
  }

  async updateCoveragePool(id: string, data: Partial<InsertCoveragePool>): Promise<CoveragePool | undefined> {
    const [item] = await db
      .update(coveragePool)
      .set({ ...data, modifiedOn: new Date() })
      .where(eq(coveragePool.id, id))
      .returning();
    return item || undefined;
  }

  async deleteCoveragePool(id: string): Promise<boolean> {
    const result = await db.delete(coveragePool).where(eq(coveragePool.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getFilterOptions(): Promise<{
    makes: string[];
    models: string[];
    processors: string[];
    rams: string[];
    categories: string[];
    customers: string[];
    orderNumbers: string[];
  }> {
    // Get filter options from both spare units and covered units
    const spareItems = await db.select({
      make: spareUnit.make,
      model: spareUnit.model,
      processor: spareUnit.processor,
      ram: spareUnit.ram,
      category: spareUnit.category,
    }).from(spareUnit);
    
    const coveredItems = await db.select({
      make: coveredUnit.make,
      model: coveredUnit.model,
      processor: coveredUnit.processor,
      ram: coveredUnit.ram,
      category: coveredUnit.category,
      customerName: coveredUnit.customerName,
      orderNumber: coveredUnit.orderNumber,
    }).from(coveredUnit);
    
    const allItems = [...spareItems, ...coveredItems];
    
    const makes = Array.from(new Set(allItems.map(i => i.make).filter(Boolean) as string[])).sort();
    const models = Array.from(new Set(allItems.map(i => i.model).filter(Boolean) as string[])).sort();
    const processors = Array.from(new Set(allItems.map(i => i.processor).filter(Boolean) as string[])).sort();
    const rams = Array.from(new Set(allItems.map(i => i.ram).filter(Boolean) as string[])).sort();
    const categories = Array.from(new Set(allItems.map(i => i.category).filter(Boolean) as string[])).sort();
    const customers = Array.from(new Set(coveredItems.map(i => i.customerName).filter(Boolean) as string[])).sort();
    const orderNumbers = Array.from(new Set(coveredItems.map(i => i.orderNumber).filter(Boolean) as string[])).sort();
    
    return { makes, models, processors, rams, categories, customers, orderNumbers };
  }

  async getAnalytics(): Promise<{
    totalSpareUnits: number;
    totalCoveredUnits: number;
    activeCoverage: number;
    expiringCoverage: number;
    averageCoverageRatio: number;
    lowCoverageThresholdPercent: number;
    expiringCoverageDays: number;
  }> {
    // Get configuration for dynamic thresholds
    const config = await this.getConfiguration();
    const expiringDays = config.expiringCoverageDays;
    const lowCoverageThreshold = Number(config.lowCoverageThresholdPercent);
    
    const [spareCount] = await db.select({ count: sql<number>`count(*)` }).from(spareUnit);
    const [coveredCount] = await db.select({ count: sql<number>`count(*)` }).from(coveredUnit);
    const [activeCoverageCount] = await db.select({ count: sql<number>`count(*)` }).from(coveredUnit).where(eq(coveredUnit.isCoverageActive, true));
    
    // Count coverage expiring in configured days
    const expiringDate = new Date();
    expiringDate.setDate(expiringDate.getDate() + expiringDays);
    
    const [expiringCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(coveredUnit)
      .where(
        and(
          eq(coveredUnit.isCoverageActive, true),
          sql`${coveredUnit.coverageEndDate} <= ${expiringDate}`
        )
      );
    
    // Calculate average coverage ratio
    const totalSpare = Number(spareCount?.count || 0);
    const totalCovered = Number(coveredCount?.count || 0);
    const averageCoverageRatio = totalCovered > 0 ? (totalSpare / totalCovered) * 100 : 0;
    
    return {
      totalSpareUnits: totalSpare,
      totalCoveredUnits: totalCovered,
      activeCoverage: Number(activeCoverageCount?.count || 0),
      expiringCoverage: Number(expiringCount?.count || 0),
      averageCoverageRatio,
      lowCoverageThresholdPercent: lowCoverageThreshold,
      expiringCoverageDays: expiringDays,
    };
  }

  async getConfiguration(): Promise<AppConfiguration> {
    // Get or create configuration (single row with id='system')
    const [config] = await db.select().from(appConfiguration).where(eq(appConfiguration.id, 'system'));
    
    if (!config) {
      // Create default configuration if it doesn't exist
      const [newConfig] = await db.insert(appConfiguration).values({
        id: 'system',
      }).returning();
      return newConfig;
    }
    
    return config;
  }

  async updateConfiguration(data: Partial<InsertAppConfiguration>): Promise<AppConfiguration> {
    // Ensure configuration exists first
    await this.getConfiguration();
    
    // Convert number to string for decimal field if present
    const updateData: any = { ...data, modifiedOn: new Date() };
    if (updateData.lowCoverageThresholdPercent !== undefined) {
      updateData.lowCoverageThresholdPercent = String(updateData.lowCoverageThresholdPercent);
    }
    
    // Update configuration
    const [updated] = await db
      .update(appConfiguration)
      .set(updateData)
      .where(eq(appConfiguration.id, 'system'))
      .returning();
    
    return updated;
  }
}

export const storage = new DatabaseStorage();
