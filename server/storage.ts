import { 
  type SpareUnit, 
  type InsertSpareUnit, 
  type CoveredUnit, 
  type InsertCoveredUnit, 
  type CoveragePool, 
  type InsertCoveragePool,
  spareUnit,
  coveredUnit,
  coveragePool
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
  bulkReplaceCoveredUnits(data: InsertCoveredUnit[]): Promise<number>;
  
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
  }>;
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
    // Start a transaction: truncate then insert
    await db.delete(spareUnit);
    
    if (data.length === 0) {
      return 0;
    }
    
    // Insert in batches of 500 to avoid query size limits
    const batchSize = 500;
    let totalInserted = 0;
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      await db.insert(spareUnit).values(batch);
      totalInserted += batch.length;
    }
    
    return totalInserted;
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

  async bulkReplaceCoveredUnits(data: InsertCoveredUnit[]): Promise<number> {
    // Start a transaction: truncate then insert
    await db.delete(coveredUnit);
    
    if (data.length === 0) {
      return 0;
    }
    
    // Calculate coverage duration days for each item
    const dataWithDuration = data.map(item => {
      const startDate = item.coverageStartDate instanceof Date ? item.coverageStartDate : new Date(item.coverageStartDate);
      const endDate = item.coverageEndDate instanceof Date ? item.coverageEndDate : new Date(item.coverageEndDate);
      const coverageDurationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        ...item,
        coverageDurationDays
      };
    });
    
    // Insert in batches of 500 to avoid query size limits
    const batchSize = 500;
    let totalInserted = 0;
    
    for (let i = 0; i < dataWithDuration.length; i += batchSize) {
      const batch = dataWithDuration.slice(i, i + batchSize);
      await db.insert(coveredUnit).values(batch);
      totalInserted += batch.length;
    }
    
    return totalInserted;
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
  }> {
    const [spareCount] = await db.select({ count: sql<number>`count(*)` }).from(spareUnit);
    const [coveredCount] = await db.select({ count: sql<number>`count(*)` }).from(coveredUnit);
    const [activeCoverageCount] = await db.select({ count: sql<number>`count(*)` }).from(coveredUnit).where(eq(coveredUnit.isCoverageActive, true));
    
    // Count coverage expiring in next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const [expiringCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(coveredUnit)
      .where(
        and(
          eq(coveredUnit.isCoverageActive, true),
          sql`${coveredUnit.coverageEndDate} <= ${thirtyDaysFromNow}`
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
    };
  }
}

export const storage = new DatabaseStorage();
