import { 
  type SpareUnit, 
  type InsertSpareUnit, 
  type CoveredUnit, 
  type InsertCoveredUnit,
  type BulkInsertCoveredUnit, 
  type CoveragePool, 
  type InsertCoveragePool,
  type AvailableStock,
  type InsertAvailableStock,
  type Claim,
  type InsertClaim,
  type Replacement,
  type InsertReplacement,
  type AppConfiguration,
  type InsertAppConfiguration,
  spareUnit,
  coveredUnit,
  coveragePool,
  availableStock,
  claim,
  replacement,
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
    limit?: number;
    offset?: number;
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
    limit?: number;
    offset?: number;
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
  
  // Statistics endpoints (query full dataset for summary cards)
  getCoveredUnitsStats(filters?: {
    make?: string[];
    model?: string[];
    processor?: string[];
    ram?: string[];
    category?: string[];
    status?: string[];
    search?: string;
  }): Promise<{
    total: number;
    active: number;
    expiring: number;
    expired: number;
  }>;
  
  getSpareUnitsStats(filters?: {
    make?: string[];
    model?: string[];
    processor?: string[];
    ram?: string[];
    category?: string[];
    search?: string;
  }): Promise<{
    total: number;
  }>;
  
  // Available Stock methods
  getAvailableStock(filters?: {
    make?: string[];
    model?: string[];
    processor?: string[];
    ram?: string[];
    category?: string[];
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<AvailableStock[]>;
  bulkReplaceAvailableStock(data: InsertAvailableStock[]): Promise<number>;
  
  // Claim methods
  getClaims(filters?: {
    make?: string[];
    model?: string[];
    processor?: string[];
    ram?: string[];
    category?: string[];
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Claim[]>;
  bulkReplaceClaims(data: InsertClaim[]): Promise<{ inserted: number; duplicatesRemoved: number }>;
  
  // Replacement methods
  getReplacements(filters?: {
    make?: string[];
    model?: string[];
    processor?: string[];
    ram?: string[];
    category?: string[];
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Replacement[]>;
  bulkReplaceReplacements(data: InsertReplacement[]): Promise<{ inserted: number; duplicatesRemoved: number }>;
  
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
    limit?: number;
    offset?: number;
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
    
    // Apply limit with default of 10,000 to prevent crashes with large datasets
    const limit = filters?.limit ?? 10000;
    const offset = filters?.offset ?? 0;
    
    return query.orderBy(desc(spareUnit.createdOn)).limit(limit).offset(offset);
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
    // Transaction: Truncate all existing spare units and insert new data in batches
    const BATCH_SIZE = 500;
    
    return await db.transaction(async (tx) => {
      // Truncate table - delete all existing spare units
      await tx.execute(sql`TRUNCATE TABLE ${spareUnit} RESTART IDENTITY CASCADE`);
      
      // Insert new data in batches
      let totalInserted = 0;
      for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE);
        await tx.insert(spareUnit).values(batch);
        totalInserted += batch.length;
      }
      
      return totalInserted;
    });
  }

  async getCoveredUnits(filters?: {
    make?: string[];
    model?: string[];
    processor?: string[];
    ram?: string[];
    category?: string[];
    status?: string[];
    search?: string;
    limit?: number;
    offset?: number;
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
    
    // Apply limit with default of 10,000 to prevent crashes with large datasets
    const limit = filters?.limit ?? 10000;
    const offset = filters?.offset ?? 0;
    
    return query.orderBy(desc(coveredUnit.coverageStartDate)).limit(limit).offset(offset);
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
    
    // Deduplicate records by composite key (serialNumber + areaId + itemId + orderNumber)
    // Keep the last occurrence of each duplicate
    const uniqueRecords = new Map<string, BulkInsertCoveredUnit>();
    for (const record of data) {
      const key = `${record.serialNumber}|${record.areaId}|${record.itemId}|${record.orderNumber || ''}`;
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
            target: [coveredUnit.serialNumber, coveredUnit.areaId, coveredUnit.itemId, coveredUnit.orderNumber],
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
    storageSizes: string[];
    generations: string[];
  }> {
    // Get filter options from both spare units and covered units
    const spareItems = await db.select({
      make: spareUnit.make,
      model: spareUnit.model,
      processor: spareUnit.processor,
      ram: spareUnit.ram,
      category: spareUnit.category,
      hdd: spareUnit.hdd,
      generation: spareUnit.generation,
    }).from(spareUnit);
    
    const coveredItems = await db.select({
      make: coveredUnit.make,
      model: coveredUnit.model,
      processor: coveredUnit.processor,
      ram: coveredUnit.ram,
      category: coveredUnit.category,
      hdd: coveredUnit.hdd,
      generation: coveredUnit.generation,
    }).from(coveredUnit);
    
    const allItems = [...spareItems, ...coveredItems];
    
    const makes = Array.from(new Set(allItems.map(i => i.make).filter(Boolean) as string[])).sort();
    const models = Array.from(new Set(allItems.map(i => i.model).filter(Boolean) as string[])).sort();
    const processors = Array.from(new Set(allItems.map(i => i.processor).filter(Boolean) as string[])).sort();
    const rams = Array.from(new Set(allItems.map(i => i.ram).filter(Boolean) as string[])).sort();
    const categories = Array.from(new Set(allItems.map(i => i.category).filter(Boolean) as string[])).sort();
    const storageSizes = Array.from(new Set(allItems.map(i => i.hdd).filter(Boolean) as string[])).sort();
    const generations = Array.from(new Set(allItems.map(i => i.generation).filter(Boolean) as string[])).sort();
    
    return { makes, models, processors, rams, categories, storageSizes, generations };
  }

  async getAnalytics(): Promise<{
    totalSpareUnits: number;
    totalCoveredUnits: number;
    activeCoverage: number;
    expiringCoverage: number;
    unallocatedSpareUnits: number;
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
    
    // Count unallocated spare units (not reserved for any case)
    const [unallocatedCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(spareUnit)
      .where(
        or(
          eq(spareUnit.reservedForCase, ''),
          sql`${spareUnit.reservedForCase} IS NULL`
        )
      );
    
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
      unallocatedSpareUnits: Number(unallocatedCount?.count || 0),
      averageCoverageRatio,
      lowCoverageThresholdPercent: lowCoverageThreshold,
      expiringCoverageDays: expiringDays,
    };
  }

  async getCoveredUnitsStats(filters?: {
    make?: string[];
    model?: string[];
    processor?: string[];
    ram?: string[];
    category?: string[];
    status?: string[];
    search?: string;
  }): Promise<{
    total: number;
    active: number;
    expiring: number;
    expired: number;
  }> {
    // Get configuration for dynamic thresholds
    const config = await this.getConfiguration();
    const expiringDays = config.expiringCoverageDays;
    
    // Build filter conditions (same as getCoveredUnits but for COUNT queries)
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
    
    // Base query for total count
    let totalQuery = db.select({ count: sql<number>`count(*)` }).from(coveredUnit);
    if (conditions.length > 0) {
      totalQuery = totalQuery.where(and(...conditions)) as any;
    }
    const [totalResult] = await totalQuery;
    const total = Number(totalResult?.count || 0);
    
    // Active coverage count (with filters)
    const activeConditions = [...conditions, eq(coveredUnit.isCoverageActive, true)];
    const [activeResult] = await db.select({ count: sql<number>`count(*)` })
      .from(coveredUnit)
      .where(and(...activeConditions));
    const active = Number(activeResult?.count || 0);
    
    // Expiring coverage count (active + expiring within configured days)
    const expiringDate = new Date();
    expiringDate.setDate(expiringDate.getDate() + expiringDays);
    const expiringConditions = [
      ...conditions,
      eq(coveredUnit.isCoverageActive, true),
      sql`${coveredUnit.coverageEndDate} <= ${expiringDate}`
    ];
    const [expiringResult] = await db.select({ count: sql<number>`count(*)` })
      .from(coveredUnit)
      .where(and(...expiringConditions));
    const expiring = Number(expiringResult?.count || 0);
    
    // Expired count (inactive coverage)
    const expiredConditions = [...conditions, eq(coveredUnit.isCoverageActive, false)];
    const [expiredResult] = await db.select({ count: sql<number>`count(*)` })
      .from(coveredUnit)
      .where(and(...expiredConditions));
    const expired = Number(expiredResult?.count || 0);
    
    return { total, active, expiring, expired };
  }

  async getSpareUnitsStats(filters?: {
    make?: string[];
    model?: string[];
    processor?: string[];
    ram?: string[];
    category?: string[];
    search?: string;
  }): Promise<{
    total: number;
  }> {
    // Build filter conditions (same as getSpareUnits but for COUNT query)
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
    
    // Total count query
    let totalQuery = db.select({ count: sql<number>`count(*)` }).from(spareUnit);
    if (conditions.length > 0) {
      totalQuery = totalQuery.where(and(...conditions)) as any;
    }
    const [totalResult] = await totalQuery;
    const total = Number(totalResult?.count || 0);
    
    return { total };
  }

  async getAvailableStock(filters?: {
    make?: string[];
    model?: string[];
    processor?: string[];
    ram?: string[];
    category?: string[];
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<AvailableStock[]> {
    let query = db.select().from(availableStock);
    
    const conditions = [];
    
    if (filters?.make && filters.make.length > 0) {
      conditions.push(inArray(availableStock.make, filters.make));
    }
    
    if (filters?.model && filters.model.length > 0) {
      conditions.push(inArray(availableStock.model, filters.model));
    }
    
    if (filters?.processor && filters.processor.length > 0) {
      conditions.push(inArray(availableStock.processor, filters.processor));
    }
    
    if (filters?.ram && filters.ram.length > 0) {
      conditions.push(inArray(availableStock.ram, filters.ram));
    }
    
    if (filters?.category && filters.category.length > 0) {
      conditions.push(inArray(availableStock.category, filters.category));
    }
    
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(availableStock.serialNumber, searchTerm),
          like(availableStock.make, searchTerm),
          like(availableStock.model, searchTerm),
          like(availableStock.productDescription, searchTerm)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.orderBy(desc(availableStock.createdOn)) as any;
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    
    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }
    
    return await query;
  }

  async bulkReplaceAvailableStock(data: InsertAvailableStock[]): Promise<number> {
    // Transaction: Truncate all existing stock and insert new data in batches
    const BATCH_SIZE = 500;
    
    return await db.transaction(async (tx) => {
      // Truncate table - delete all existing available stock
      await tx.execute(sql`TRUNCATE TABLE ${availableStock} RESTART IDENTITY CASCADE`);
      
      // Insert new data in batches
      let totalInserted = 0;
      for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE);
        await tx.insert(availableStock).values(batch);
        totalInserted += batch.length;
      }
      
      return totalInserted;
    });
  }

  async getClaims(filters?: {
    make?: string[];
    model?: string[];
    processor?: string[];
    ram?: string[];
    category?: string[];
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Claim[]> {
    let query = db.select().from(claim);
    
    const conditions = [];
    
    if (filters?.make && filters.make.length > 0) {
      conditions.push(inArray(claim.make, filters.make));
    }
    
    if (filters?.model && filters.model.length > 0) {
      conditions.push(inArray(claim.model, filters.model));
    }
    
    if (filters?.processor && filters.processor.length > 0) {
      conditions.push(inArray(claim.processor, filters.processor));
    }
    
    if (filters?.ram && filters.ram.length > 0) {
      conditions.push(inArray(claim.ram, filters.ram));
    }
    
    if (filters?.category && filters.category.length > 0) {
      conditions.push(inArray(claim.category, filters.category));
    }
    
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(claim.serialNumber, searchTerm),
          like(claim.make, searchTerm),
          like(claim.model, searchTerm),
          like(claim.rma, searchTerm)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.orderBy(desc(claim.claimDate)) as any;
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    
    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }
    
    return await query;
  }

  async bulkReplaceClaims(data: InsertClaim[]): Promise<{ inserted: number; duplicatesRemoved: number }> {
    // Transaction: Truncate all existing claims and insert new data in batches
    const BATCH_SIZE = 500;
    
    console.log(`[bulk-claims] Starting bulk replace with ${data.length} claims`);
    
    // First, normalize all dates to Date objects for consistent comparison
    const normalizedData = data.map(item => ({
      ...item,
      claimDate: item.claimDate instanceof Date ? item.claimDate : new Date(item.claimDate),
    }));
    
    // Deduplicate claims based on composite key (serialNumber + areaId + itemId + rma)
    // Keep only the claim with the most recent claimDate for each unique key
    const claimsMap = new Map<string, typeof normalizedData[0]>();
    
    for (const item of normalizedData) {
      const compositeKey = `${item.serialNumber}|${item.areaId}|${item.itemId}|${item.rma}`;
      
      const existing = claimsMap.get(compositeKey);
      if (existing) {
        // Both dates are now guaranteed to be Date objects - safe ordinal comparison
        if (item.claimDate > existing.claimDate) {
          claimsMap.set(compositeKey, item);
        }
      } else {
        claimsMap.set(compositeKey, item);
      }
    }
    
    const deduplicatedData = Array.from(claimsMap.values());
    const duplicatesRemoved = data.length - deduplicatedData.length;
    
    if (duplicatesRemoved > 0) {
      console.log(`[bulk-claims] Removed ${duplicatesRemoved} duplicate claims, keeping most recent by claim date`);
    }
    
    return await db.transaction(async (tx) => {
      // Truncate table - delete all existing claims
      await tx.execute(sql`TRUNCATE TABLE ${claim} RESTART IDENTITY CASCADE`);
      
      // Insert new data in batches (dates already normalized, no need to re-parse)
      let totalInserted = 0;
      for (let i = 0; i < deduplicatedData.length; i += BATCH_SIZE) {
        const batch = deduplicatedData.slice(i, i + BATCH_SIZE);
        await tx.insert(claim).values(batch);
        totalInserted += batch.length;
      }
      
      console.log(`[bulk-claims] Successfully inserted ${totalInserted} claims`);
      return { inserted: totalInserted, duplicatesRemoved };
    });
  }

  async getReplacements(filters?: {
    make?: string[];
    model?: string[];
    processor?: string[];
    ram?: string[];
    category?: string[];
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Replacement[]> {
    let query = db.select().from(replacement);
    
    const conditions = [];
    
    if (filters?.make && filters.make.length > 0) {
      conditions.push(inArray(replacement.make, filters.make));
    }
    
    if (filters?.model && filters.model.length > 0) {
      conditions.push(inArray(replacement.model, filters.model));
    }
    
    if (filters?.processor && filters.processor.length > 0) {
      conditions.push(inArray(replacement.processor, filters.processor));
    }
    
    if (filters?.ram && filters.ram.length > 0) {
      conditions.push(inArray(replacement.ram, filters.ram));
    }
    
    if (filters?.category && filters.category.length > 0) {
      conditions.push(inArray(replacement.category, filters.category));
    }
    
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(replacement.serialNumber, searchTerm),
          like(replacement.make, searchTerm),
          like(replacement.model, searchTerm),
          like(replacement.rma, searchTerm)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.orderBy(desc(replacement.replacedDate)) as any;
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    
    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }
    
    return await query;
  }

  async bulkReplaceReplacements(data: InsertReplacement[]): Promise<{ inserted: number; duplicatesRemoved: number }> {
    // Transaction: Truncate all existing replacements and insert new data in batches
    const BATCH_SIZE = 500;
    
    console.log(`[bulk-replacements] Starting bulk replace with ${data.length} replacements`);
    
    // First, normalize all dates to Date objects for consistent comparison
    const normalizedData = data.map(item => ({
      ...item,
      replacedDate: item.replacedDate instanceof Date ? item.replacedDate : new Date(item.replacedDate),
    }));
    
    // Deduplicate replacements based on composite key (serialNumber + areaId + itemId + rma)
    // Keep only the replacement with the most recent replacedDate for each unique key
    const replacementsMap = new Map<string, typeof normalizedData[0]>();
    
    for (const item of normalizedData) {
      const compositeKey = `${item.serialNumber}|${item.areaId}|${item.itemId}|${item.rma}`;
      
      const existing = replacementsMap.get(compositeKey);
      if (existing) {
        // Both dates are now guaranteed to be Date objects - safe ordinal comparison
        if (item.replacedDate > existing.replacedDate) {
          replacementsMap.set(compositeKey, item);
        }
      } else {
        replacementsMap.set(compositeKey, item);
      }
    }
    
    const deduplicatedData = Array.from(replacementsMap.values());
    const duplicatesRemoved = data.length - deduplicatedData.length;
    
    if (duplicatesRemoved > 0) {
      console.log(`[bulk-replacements] Removed ${duplicatesRemoved} duplicate replacements, keeping most recent by replaced date`);
    }
    
    return await db.transaction(async (tx) => {
      // Truncate table - delete all existing replacements
      await tx.execute(sql`TRUNCATE TABLE ${replacement} RESTART IDENTITY CASCADE`);
      
      // Insert new data in batches (dates already normalized, no need to re-parse)
      let totalInserted = 0;
      for (let i = 0; i < deduplicatedData.length; i += BATCH_SIZE) {
        const batch = deduplicatedData.slice(i, i + BATCH_SIZE);
        await tx.insert(replacement).values(batch);
        totalInserted += batch.length;
      }
      
      console.log(`[bulk-replacements] Successfully inserted ${totalInserted} replacements`);
      return { inserted: totalInserted, duplicatesRemoved };
    });
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
