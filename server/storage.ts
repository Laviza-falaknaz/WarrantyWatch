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
  type CoveragePoolAnalytics,
  type MonthlyAnalytics,
  type ForecastPoint,
  spareUnit,
  coveredUnit,
  coveragePool,
  availableStock,
  claim,
  replacement,
  appConfiguration
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, or, sql, desc, inArray, gte, lte, isNotNull } from "drizzle-orm";

// Helper: Returns SQL condition to filter out expired covered units
// Only includes units where coverageEndDate >= today
function nonExpiredCoveredUnitsCondition() {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  return gte(coveredUnit.coverageEndDate, today);
}

// Helper: Creates case-insensitive IN condition using UPPER()
// Normalizes values to uppercase and deduplicates before building SQL
// Guards against NULL columns to preserve NULL row semantics
function caseInsensitiveIn(column: any, values: string[]) {
  if (!values || values.length === 0) {
    return undefined;
  }
  
  // Filter out falsy/whitespace-only values and normalize to uppercase (locale-aware)
  const normalizedValues = values
    .filter(v => v && typeof v === 'string' && v.trim().length > 0)
    .map(v => v.toLocaleUpperCase('en-US'));
  
  // Deduplicate
  const upperValues = Array.from(new Set(normalizedValues));
  
  if (upperValues.length === 0) {
    return undefined;
  }
  
  // Build UPPER(column) IN (val1, val2, ...) using sql.join
  const sqlValues = upperValues.map(v => sql`${v}`);
  const inClause = sql`UPPER(${column}) IN (${sql.join(sqlValues, sql`, `)})`;
  
  // Combine with isNotNull check to preserve NULL row semantics
  return and(isNotNull(column), inClause);
}

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
    customerName?: string[];
    orderNumber?: string[];
    coverageDescription?: string[];
    coverageStartDateFrom?: string;
    coverageStartDateTo?: string;
    coverageEndDateFrom?: string;
    coverageEndDateTo?: string;
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
  
  getCoveredUnitsFilterOptions(): Promise<{
    makes: string[];
    models: string[];
    customers: string[];
    orders: string[];
    coverageDescriptions: string[];
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
    customerName?: string[];
    orderNumber?: string[];
    coverageDescription?: string[];
    coverageStartDateFrom?: string;
    coverageStartDateTo?: string;
    coverageEndDateFrom?: string;
    coverageEndDateTo?: string;
    search?: string;
  }): Promise<{
    total: number;
    active: number;
    expiring: number;
    expired: number;
  }>;
  
  // Warranty Explorer Analytics (server-side aggregation for large datasets)
  getCoveredUnitsAnalytics(filters?: {
    make?: string[];
    model?: string[];
    processor?: string[];
    ram?: string[];
    category?: string[];
    status?: string[];
    customerName?: string[];
    orderNumber?: string[];
    coverageDescription?: string[];
    coverageStartDateFrom?: string;
    coverageStartDateTo?: string;
    coverageEndDateFrom?: string;
    coverageEndDateTo?: string;
    search?: string;
  }): Promise<{
    timeline: Array<{ month: string; starts: number; ends: number }>;
    expirationRisk: Array<{ range: string; count: number }>;
    topCustomers: Array<{ name: string; count: number }>;
    manufacturerDistribution: Array<{ make: string; count: number }>;
    uniqueCustomersCount: number;
    processors: string[];
    rams: string[];
    categories: string[];
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
  
  // Analytics
  getCoveragePoolAnalytics(poolId: string, options?: {
    timeRangeMonths?: number;
    forecastMonths?: number;
  }): Promise<CoveragePoolAnalytics>;
  
  // Heatmap Data
  getWarrantyExpirations(filters: {
    startDate: string;
    endDate: string;
    make?: string;
    model?: string;
    customerName?: string;
    orderNumber?: string;
  }): Promise<Array<{ date: string; count: number }>>;

  // Risk Analysis
  getRiskCombinations(options?: {
    sortBy?: 'riskScore' | 'riskLevel' | 'runRate' | 'coverageRatio' | 'coveredCount' | 'coverageOfRunRate';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
    search?: string;
    excludeZeroCovered?: boolean;
    status?: 'active' | 'inactive' | 'all';
    riskLevels?: string[];
    runRateMin?: number;
    runRateMax?: number;
    coverageRatioMin?: number;
    coverageRatioMax?: number;
    spareRateMin?: number;
    spareRateMax?: number;
    coveredCountMin?: number;
    coveredCountMax?: number;
  }): Promise<{ 
    data: any[]; 
    total: number;
    stats: {
      critical: number;
      high: number;
      medium: number;
      low: number;
      worstDeficit: number | null;
    };
  }>; // Returns paginated data with total count and aggregated stats
  
  // Model Statistics - Comprehensive stats for all models (filtered to 60 or fewer days of supply)
  getAllModelStats(options?: {
    sortBy?: 'make' | 'model' | 'runRate' | 'spareRate' | 'daysOfSupply' | 'coveredCount' | 'spareCount' | 'coverageRatio';
    sortOrder?: 'asc' | 'desc';
  }): Promise<Array<{
    make: string;
    model: string;
    processor: string | null;
    generation: string | null;
    coveredCount: number;
    spareCount: number;
    availableStockCount: number;
    ukAvailableCount: number;
    uaeAvailableCount: number;
    runRate: number;
    spareRate: number | null;
    daysOfSupply: number | null;
    coverageRatio: number | null;
    unitsNeededFor2Months: number;
    riskLevel: string;
  }>>;
  
  // Configuration
  getConfiguration(): Promise<AppConfiguration>;
  updateConfiguration(data: Partial<InsertAppConfiguration>): Promise<AppConfiguration>;
  
  // Explore Dashboard Analytics
  getTopModelsByWarranties(filters?: {
    make?: string[];
    model?: string[];
    customer?: string[];
    order?: string[];
    limit?: number;
  }): Promise<Array<{ model: string; count: number }>>;
  
  getWarrantyDescriptions(filters?: {
    make?: string[];
    model?: string[];
    customer?: string[];
    order?: string[];
  }): Promise<Array<{ description: string; count: number }>>;
  
  getWarrantiesByCategory(filters?: {
    make?: string[];
    model?: string[];
    customer?: string[];
    order?: string[];
  }): Promise<Array<{ category: string; month: string; count: number }>>;
  
  getTopCustomersByCoveredUnits(filters?: {
    make?: string[];
    model?: string[];
    customer?: string[];
    order?: string[];
    limit?: number;
  }): Promise<Array<{ customer: string; count: number }>>;
  
  getClaimsByModel(filters?: {
    make?: string[];
    model?: string[];
    customer?: string[];
    order?: string[];
  }): Promise<Array<{ model: string; count: number }>>;
  
  getReplacementsByModel(filters?: {
    make?: string[];
    model?: string[];
    customer?: string[];
    order?: string[];
  }): Promise<Array<{ model: string; count: number }>>;
  
  getSparePoolByModel(filters?: {
    make?: string[];
    model?: string[];
    customer?: string[];
    order?: string[];
  }): Promise<Array<{ model: string; count: number }>>;
  
  getMonthlyClaimsReplacements(filters?: {
    make?: string[];
    model?: string[];
    customer?: string[];
    order?: string[];
  }): Promise<Array<{ month: string; claims: number; replacements: number }>>;
  
  getMonthlyWarrantyStarts(filters?: {
    make?: string[];
    model?: string[];
    customer?: string[];
    order?: string[];
  }): Promise<Array<{ month: string; count: number }>>;
  
  // Filter options for Explore dashboard
  getExploreFilterOptions(): Promise<{
    makes: string[];
    models: string[];
    customers: string[];
    orders: string[];
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
    customerName?: string[];
    orderNumber?: string[];
    coverageDescription?: string[];
    coverageStartDateFrom?: string;
    coverageStartDateTo?: string;
    coverageEndDateFrom?: string;
    coverageEndDateTo?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<CoveredUnit[]> {
    let query = db.select().from(coveredUnit);
    
    const conditions = [];
    
    // Note: Expired units are now included in results to enable comprehensive filtering
    // Users can filter by status or date ranges to control whether expired units appear
    // Case-insensitive filtering using helper function
    
    const makeCondition = caseInsensitiveIn(coveredUnit.make, filters?.make || []);
    if (makeCondition) conditions.push(makeCondition);
    
    const modelCondition = caseInsensitiveIn(coveredUnit.model, filters?.model || []);
    if (modelCondition) conditions.push(modelCondition);
    
    const processorCondition = caseInsensitiveIn(coveredUnit.processor, filters?.processor || []);
    if (processorCondition) conditions.push(processorCondition);
    
    const ramCondition = caseInsensitiveIn(coveredUnit.ram, filters?.ram || []);
    if (ramCondition) conditions.push(ramCondition);
    
    const categoryCondition = caseInsensitiveIn(coveredUnit.category, filters?.category || []);
    if (categoryCondition) conditions.push(categoryCondition);
    
    const customerCondition = caseInsensitiveIn(coveredUnit.customerName, filters?.customerName || []);
    if (customerCondition) conditions.push(customerCondition);
    
    const orderCondition = caseInsensitiveIn(coveredUnit.orderNumber, filters?.orderNumber || []);
    if (orderCondition) conditions.push(orderCondition);
    
    const descriptionCondition = caseInsensitiveIn(coveredUnit.coverageDescription, filters?.coverageDescription || []);
    if (descriptionCondition) conditions.push(descriptionCondition);
    
    if (filters?.coverageStartDateFrom) {
      const startDate = new Date(filters.coverageStartDateFrom);
      startDate.setUTCHours(0, 0, 0, 0); // Start of day in UTC
      conditions.push(gte(coveredUnit.coverageStartDate, startDate));
    }
    
    if (filters?.coverageStartDateTo) {
      const endDate = new Date(filters.coverageStartDateTo);
      endDate.setUTCHours(23, 59, 59, 999); // End of day in UTC
      conditions.push(lte(coveredUnit.coverageStartDate, endDate));
    }
    
    if (filters?.coverageEndDateFrom) {
      const startDate = new Date(filters.coverageEndDateFrom);
      startDate.setUTCHours(0, 0, 0, 0); // Start of day in UTC
      conditions.push(gte(coveredUnit.coverageEndDate, startDate));
    }
    
    if (filters?.coverageEndDateTo) {
      const endDate = new Date(filters.coverageEndDateTo);
      endDate.setUTCHours(23, 59, 59, 999); // End of day in UTC
      conditions.push(lte(coveredUnit.coverageEndDate, endDate));
    }
    
    if (filters?.status && filters.status.length > 0) {
      const hasActive = filters.status.includes("Active");
      const hasInactive = filters.status.includes("Inactive");
      
      // Only apply filter if one status is selected (not both)
      if (hasActive && !hasInactive) {
        conditions.push(eq(coveredUnit.isCoverageActive, true));
      } else if (hasInactive && !hasActive) {
        conditions.push(eq(coveredUnit.isCoverageActive, false));
      }
      // If both are selected, don't add any filter (show all)
    }
    
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(coveredUnit.serialNumber, searchTerm),
          like(coveredUnit.make, searchTerm),
          like(coveredUnit.model, searchTerm),
          like(coveredUnit.coverageDescription, searchTerm),
          like(coveredUnit.customerName, searchTerm),
          like(coveredUnit.orderNumber, searchTerm)
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
  
  async getCoveredUnitsFilterOptions(): Promise<{
    makes: string[];
    models: string[];
    customers: string[];
    orders: string[];
    coverageDescriptions: string[];
  }> {
    // Get filter options from ALL covered units (not just non-expired)
    const items = await db.select({
      make: coveredUnit.make,
      model: coveredUnit.model,
      customerName: coveredUnit.customerName,
      orderNumber: coveredUnit.orderNumber,
      coverageDescription: coveredUnit.coverageDescription,
    }).from(coveredUnit);
    
    // Helper to get unique values case-insensitively, preserving original case
    const getUniqueValues = (values: (string | null)[]) => {
      const uniqueMap = new Map<string, string>();
      values.forEach(val => {
        if (val) {
          const key = val.toUpperCase();
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, val); // Keep the first occurrence's original case
          }
        }
      });
      return Array.from(uniqueMap.values()).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    };
    
    const makes = getUniqueValues(items.map(i => i.make));
    const models = getUniqueValues(items.map(i => i.model));
    const customers = getUniqueValues(items.map(i => i.customerName));
    const orders = getUniqueValues(items.map(i => i.orderNumber));
    const coverageDescriptions = getUniqueValues(items.map(i => i.coverageDescription));
    
    return { makes, models, customers, orders, coverageDescriptions };
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
    // Only count non-expired covered units
    const [coveredCount] = await db.select({ count: sql<number>`count(*)` }).from(coveredUnit).where(nonExpiredCoveredUnitsCondition());
    const [activeCoverageCount] = await db.select({ count: sql<number>`count(*)` }).from(coveredUnit).where(and(eq(coveredUnit.isCoverageActive, true), nonExpiredCoveredUnitsCondition()));
    
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
    customerName?: string[];
    orderNumber?: string[];
    coverageDescription?: string[];
    coverageStartDateFrom?: string;
    coverageStartDateTo?: string;
    coverageEndDateFrom?: string;
    coverageEndDateTo?: string;
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
    
    // Build filter conditions (same as getCoveredUnits but for COUNT queries) - case-insensitive
    const conditions = [];
    
    const makeCondition = caseInsensitiveIn(coveredUnit.make, filters?.make || []);
    if (makeCondition) conditions.push(makeCondition);
    
    const modelCondition = caseInsensitiveIn(coveredUnit.model, filters?.model || []);
    if (modelCondition) conditions.push(modelCondition);
    
    const processorCondition = caseInsensitiveIn(coveredUnit.processor, filters?.processor || []);
    if (processorCondition) conditions.push(processorCondition);
    
    const ramCondition = caseInsensitiveIn(coveredUnit.ram, filters?.ram || []);
    if (ramCondition) conditions.push(ramCondition);
    
    const categoryCondition = caseInsensitiveIn(coveredUnit.category, filters?.category || []);
    if (categoryCondition) conditions.push(categoryCondition);
    
    const customerCondition = caseInsensitiveIn(coveredUnit.customerName, filters?.customerName || []);
    if (customerCondition) conditions.push(customerCondition);
    
    const orderCondition = caseInsensitiveIn(coveredUnit.orderNumber, filters?.orderNumber || []);
    if (orderCondition) conditions.push(orderCondition);
    
    const descriptionCondition = caseInsensitiveIn(coveredUnit.coverageDescription, filters?.coverageDescription || []);
    if (descriptionCondition) conditions.push(descriptionCondition);
    
    if (filters?.coverageStartDateFrom) {
      const startDate = new Date(filters.coverageStartDateFrom);
      startDate.setUTCHours(0, 0, 0, 0); // Start of day in UTC
      conditions.push(gte(coveredUnit.coverageStartDate, startDate));
    }
    
    if (filters?.coverageStartDateTo) {
      const endDate = new Date(filters.coverageStartDateTo);
      endDate.setUTCHours(23, 59, 59, 999); // End of day in UTC
      conditions.push(lte(coveredUnit.coverageStartDate, endDate));
    }
    
    if (filters?.coverageEndDateFrom) {
      const startDate = new Date(filters.coverageEndDateFrom);
      startDate.setUTCHours(0, 0, 0, 0); // Start of day in UTC
      conditions.push(gte(coveredUnit.coverageEndDate, startDate));
    }
    
    if (filters?.coverageEndDateTo) {
      const endDate = new Date(filters.coverageEndDateTo);
      endDate.setUTCHours(23, 59, 59, 999); // End of day in UTC
      conditions.push(lte(coveredUnit.coverageEndDate, endDate));
    }
    
    if (filters?.status && filters.status.length > 0) {
      const hasActive = filters.status.includes("Active");
      const hasInactive = filters.status.includes("Inactive");
      
      // Only apply filter if one status is selected (not both)
      if (hasActive && !hasInactive) {
        conditions.push(eq(coveredUnit.isCoverageActive, true));
      } else if (hasInactive && !hasActive) {
        conditions.push(eq(coveredUnit.isCoverageActive, false));
      }
      // If both are selected, don't add any filter (show all)
    }
    
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(coveredUnit.serialNumber, searchTerm),
          like(coveredUnit.make, searchTerm),
          like(coveredUnit.model, searchTerm),
          like(coveredUnit.coverageDescription, searchTerm),
          like(coveredUnit.customerName, searchTerm),
          like(coveredUnit.orderNumber, searchTerm)
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

  async getCoveredUnitsAnalytics(filters?: {
    make?: string[];
    model?: string[];
    processor?: string[];
    ram?: string[];
    category?: string[];
    status?: string[];
    customerName?: string[];
    orderNumber?: string[];
    coverageDescription?: string[];
    coverageStartDateFrom?: string;
    coverageStartDateTo?: string;
    coverageEndDateFrom?: string;
    coverageEndDateTo?: string;
    search?: string;
  }): Promise<{
    timeline: Array<{ month: string; starts: number; ends: number }>;
    expirationRisk: Array<{ range: string; count: number }>;
    topCustomers: Array<{ name: string; count: number }>;
    manufacturerDistribution: Array<{ make: string; count: number }>;
    uniqueCustomersCount: number;
    processors: string[];
    rams: string[];
    categories: string[];
  }> {
    // Build the same filter conditions as getCoveredUnitsStats
    const conditions = [];
    
    const makeCondition = caseInsensitiveIn(coveredUnit.make, filters?.make || []);
    if (makeCondition) conditions.push(makeCondition);
    
    const modelCondition = caseInsensitiveIn(coveredUnit.model, filters?.model || []);
    if (modelCondition) conditions.push(modelCondition);
    
    const processorCondition = caseInsensitiveIn(coveredUnit.processor, filters?.processor || []);
    if (processorCondition) conditions.push(processorCondition);
    
    const ramCondition = caseInsensitiveIn(coveredUnit.ram, filters?.ram || []);
    if (ramCondition) conditions.push(ramCondition);
    
    const categoryCondition = caseInsensitiveIn(coveredUnit.category, filters?.category || []);
    if (categoryCondition) conditions.push(categoryCondition);
    
    const customerCondition = caseInsensitiveIn(coveredUnit.customerName, filters?.customerName || []);
    if (customerCondition) conditions.push(customerCondition);
    
    const orderCondition = caseInsensitiveIn(coveredUnit.orderNumber, filters?.orderNumber || []);
    if (orderCondition) conditions.push(orderCondition);
    
    const descriptionCondition = caseInsensitiveIn(coveredUnit.coverageDescription, filters?.coverageDescription || []);
    if (descriptionCondition) conditions.push(descriptionCondition);
    
    if (filters?.coverageStartDateFrom) {
      const startDate = new Date(filters.coverageStartDateFrom);
      startDate.setUTCHours(0, 0, 0, 0);
      conditions.push(gte(coveredUnit.coverageStartDate, startDate));
    }
    
    if (filters?.coverageStartDateTo) {
      const endDate = new Date(filters.coverageStartDateTo);
      endDate.setUTCHours(23, 59, 59, 999);
      conditions.push(lte(coveredUnit.coverageStartDate, endDate));
    }
    
    if (filters?.coverageEndDateFrom) {
      const startDate = new Date(filters.coverageEndDateFrom);
      startDate.setUTCHours(0, 0, 0, 0);
      conditions.push(gte(coveredUnit.coverageEndDate, startDate));
    }
    
    if (filters?.coverageEndDateTo) {
      const endDate = new Date(filters.coverageEndDateTo);
      endDate.setUTCHours(23, 59, 59, 999);
      conditions.push(lte(coveredUnit.coverageEndDate, endDate));
    }
    
    if (filters?.status && filters.status.length > 0) {
      const hasActive = filters.status.includes("Active");
      const hasInactive = filters.status.includes("Inactive");
      
      // Only apply filter if one status is selected (not both)
      if (hasActive && !hasInactive) {
        conditions.push(eq(coveredUnit.isCoverageActive, true));
      } else if (hasInactive && !hasActive) {
        conditions.push(eq(coveredUnit.isCoverageActive, false));
      }
      // If both are selected, don't add any filter (show all)
    }
    
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(coveredUnit.serialNumber, searchTerm),
          like(coveredUnit.make, searchTerm),
          like(coveredUnit.model, searchTerm),
          like(coveredUnit.coverageDescription, searchTerm),
          like(coveredUnit.customerName, searchTerm),
          like(coveredUnit.orderNumber, searchTerm)
        )
      );
    }
    
    // Build where clause for the CTE
    let whereClause = sql`1=1`;
    if (conditions.length > 0) {
      whereClause = and(...conditions) as any;
    }
    
    // Single SQL query with CTE for all aggregations
    const result = await db.execute(sql`
      WITH filtered_units AS (
        SELECT * FROM ${coveredUnit}
        WHERE ${whereClause}
      ),
      timeline_starts AS (
        SELECT 
          TO_CHAR(coverage_start_date, 'YYYY-MM') as month,
          COUNT(*) as count
        FROM filtered_units
        WHERE coverage_start_date IS NOT NULL
        GROUP BY TO_CHAR(coverage_start_date, 'YYYY-MM')
      ),
      timeline_ends AS (
        SELECT 
          TO_CHAR(coverage_end_date, 'YYYY-MM') as month,
          COUNT(*) as count
        FROM filtered_units
        WHERE coverage_end_date IS NOT NULL
        GROUP BY TO_CHAR(coverage_end_date, 'YYYY-MM')
      ),
      expiration_buckets AS (
        SELECT 
          CASE 
            WHEN EXTRACT(EPOCH FROM (coverage_end_date - CURRENT_TIMESTAMP))/86400 BETWEEN 0 AND 30 THEN '0-30 days'
            WHEN EXTRACT(EPOCH FROM (coverage_end_date - CURRENT_TIMESTAMP))/86400 BETWEEN 31 AND 90 THEN '31-90 days'
            WHEN EXTRACT(EPOCH FROM (coverage_end_date - CURRENT_TIMESTAMP))/86400 BETWEEN 91 AND 180 THEN '91-180 days'
            WHEN EXTRACT(EPOCH FROM (coverage_end_date - CURRENT_TIMESTAMP))/86400 > 180 THEN '180+ days'
          END as range,
          COUNT(*) as count
        FROM filtered_units
        WHERE coverage_end_date >= CURRENT_DATE AND is_coverage_active = true
        GROUP BY range
      ),
      top_customers AS (
        SELECT 
          MIN(customer_name) as name,
          COUNT(*) as count
        FROM filtered_units
        WHERE customer_name IS NOT NULL AND customer_name != ''
        GROUP BY UPPER(customer_name)
        ORDER BY count DESC
        LIMIT 10
      ),
      manufacturer_dist AS (
        SELECT 
          MIN(make) as make,
          COUNT(*) as count
        FROM filtered_units
        WHERE make IS NOT NULL
        GROUP BY UPPER(make)
        ORDER BY count DESC
      ),
      unique_values AS (
        SELECT 
          array_agg(DISTINCT processor ORDER BY processor) FILTER (WHERE processor IS NOT NULL AND processor != '') as processors,
          array_agg(DISTINCT ram ORDER BY ram) FILTER (WHERE ram IS NOT NULL AND ram != '') as rams,
          array_agg(DISTINCT category ORDER BY category) FILTER (WHERE category IS NOT NULL AND category != '') as categories
        FROM filtered_units
      ),
      unique_customers_count AS (
        SELECT COUNT(DISTINCT UPPER(customer_name)) as count
        FROM filtered_units
        WHERE customer_name IS NOT NULL AND customer_name != ''
      )
      SELECT json_build_object(
        'timeline', COALESCE((
          SELECT json_agg(json_build_object(
            'month', COALESCE(s.month, e.month),
            'starts', COALESCE(s.count, 0),
            'ends', COALESCE(e.count, 0)
          ) ORDER BY COALESCE(s.month, e.month))
          FROM timeline_starts s
          FULL OUTER JOIN timeline_ends e ON s.month = e.month
        ), '[]'::json),
        'expirationRisk', COALESCE((
          SELECT json_agg(json_build_object('range', range, 'count', count) ORDER BY 
            CASE range
              WHEN '0-30 days' THEN 1
              WHEN '31-90 days' THEN 2
              WHEN '91-180 days' THEN 3
              WHEN '180+ days' THEN 4
            END
          )
          FROM expiration_buckets
          WHERE range IS NOT NULL
        ), '[]'::json),
        'topCustomers', COALESCE((
          SELECT json_agg(json_build_object('name', name, 'count', count))
          FROM top_customers
        ), '[]'::json),
        'manufacturerDistribution', COALESCE((
          SELECT json_agg(json_build_object('make', make, 'count', count))
          FROM manufacturer_dist
        ), '[]'::json),
        'uniqueCustomersCount', COALESCE((SELECT count FROM unique_customers_count), 0),
        'processors', COALESCE((SELECT processors FROM unique_values), ARRAY[]::text[]),
        'rams', COALESCE((SELECT rams FROM unique_values), ARRAY[]::text[]),
        'categories', COALESCE((SELECT categories FROM unique_values), ARRAY[]::text[])
      ) as result
    `);
    
    const data = (result.rows[0] as any).result;
    return {
      timeline: data.timeline || [],
      expirationRisk: data.expirationRisk || [],
      topCustomers: data.topCustomers || [],
      manufacturerDistribution: data.manufacturerDistribution || [],
      uniqueCustomersCount: data.uniqueCustomersCount || 0,
      processors: data.processors || [],
      rams: data.rams || [],
      categories: data.categories || [],
    };
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

  async getCoveragePoolAnalytics(poolId: string, options?: {
    timeRangeMonths?: number;
    forecastMonths?: number;
  }): Promise<CoveragePoolAnalytics> {
    console.log(`[analytics] Generating analytics for pool ${poolId}`);
    
    // Get the pool and configuration
    const pool = await this.getCoveragePoolById(poolId);
    if (!pool) {
      throw new Error(`Pool not found: ${poolId}`);
    }
    
    const config = await this.getConfiguration();
    
    // Defensively clamp values to safe ranges
    const timeRangeMonths = Math.max(1, Math.min(36, options?.timeRangeMonths ?? config.analyticsTimeRangeMonths));
    const forecastMonths = Math.max(1, Math.min(12, options?.forecastMonths ?? 3));
    const targetCoveragePercent = Number(config.targetCoveragePercent);
    
    // Parse filter criteria
    const filterCriteria = JSON.parse(pool.filterCriteria);
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - timeRangeMonths);
    
    // Build filter conditions for pool matching
    const buildFilterConditions = (table: typeof claim | typeof replacement | typeof spareUnit | typeof coveredUnit | typeof availableStock) => {
      const conditions = [];
      // Handle both string and array formats for filter criteria
      if (filterCriteria.make) {
        const makeArray = Array.isArray(filterCriteria.make) ? filterCriteria.make : [filterCriteria.make];
        conditions.push(inArray(table.make, makeArray));
      }
      if (filterCriteria.model) {
        const modelArray = Array.isArray(filterCriteria.model) ? filterCriteria.model : [filterCriteria.model];
        conditions.push(inArray(table.model, modelArray));
      }
      if (filterCriteria.processor) {
        const processorArray = Array.isArray(filterCriteria.processor) ? filterCriteria.processor : [filterCriteria.processor];
        conditions.push(inArray(table.processor, processorArray));
      }
      if (filterCriteria.ram) {
        const ramArray = Array.isArray(filterCriteria.ram) ? filterCriteria.ram : [filterCriteria.ram];
        conditions.push(inArray(table.ram, ramArray));
      }
      if (filterCriteria.category) {
        const categoryArray = Array.isArray(filterCriteria.category) ? filterCriteria.category : [filterCriteria.category];
        conditions.push(inArray(table.category, categoryArray));
      }
      return conditions;
    };
    
    // Get monthly aggregated claims
    const claimConditions = buildFilterConditions(claim);
    claimConditions.push(gte(claim.claimDate, startDate));
    claimConditions.push(lte(claim.claimDate, endDate));
    
    const monthlyClaims = await db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${claim.claimDate}), 'YYYY-MM')`,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(claim)
      .where(and(...claimConditions))
      .groupBy(sql`date_trunc('month', ${claim.claimDate})`)
      .orderBy(sql`date_trunc('month', ${claim.claimDate})`);
    
    // Get monthly aggregated replacements
    const replacementConditions = buildFilterConditions(replacement);
    replacementConditions.push(gte(replacement.replacedDate, startDate));
    replacementConditions.push(lte(replacement.replacedDate, endDate));
    
    const monthlyReplacements = await db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${replacement.replacedDate}), 'YYYY-MM')`,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(replacement)
      .where(and(...replacementConditions))
      .groupBy(sql`date_trunc('month', ${replacement.replacedDate})`)
      .orderBy(sql`date_trunc('month', ${replacement.replacedDate})`);
    
    // Get current counts
    const spareConditions = buildFilterConditions(spareUnit);
    const [currentSpareResult] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(spareUnit)
      .where(spareConditions.length > 0 ? and(...spareConditions) : undefined);
    
    const coveredConditions = buildFilterConditions(coveredUnit);
    // Add active warranty filter (coverageEndDate >= today)
    coveredConditions.push(nonExpiredCoveredUnitsCondition());
    const [currentCoveredResult] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(coveredUnit)
      .where(coveredConditions.length > 0 ? and(...coveredConditions) : undefined);
    
    const availableConditions = buildFilterConditions(availableStock);
    
    // Get UK available stock (only UK and UAE are considered for inventory)
    const ukConditions = [sql`UPPER(${availableStock.areaId}) = 'UK'`, ...availableConditions];
    const [ukAvailableResult] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(availableStock)
      .where(and(...ukConditions));
    
    // Get UAE available stock (only UK and UAE are considered for inventory)
    const uaeConditions = [sql`UPPER(${availableStock.areaId}) = 'UAE'`, ...availableConditions];
    const [uaeAvailableResult] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(availableStock)
      .where(and(...uaeConditions));
    
    const currentSpareCount = currentSpareResult?.count || 0;
    const currentCoveredCount = currentCoveredResult?.count || 0;
    const currentUkAvailableCount = ukAvailableResult?.count || 0;
    const currentUaeAvailableCount = uaeAvailableResult?.count || 0;
    // Total available stock is UK + UAE only (no other area IDs considered)
    const currentAvailableStockCount = currentUkAvailableCount + currentUaeAvailableCount;
    const currentCoverageRatio = currentCoveredCount > 0 ? (currentSpareCount / currentCoveredCount) * 100 : 0;
    
    // Generate monthly data array with all months in range
    const monthlyDataMap = new Map<string, MonthlyAnalytics>();
    
    // Initialize all months in range
    const currentMonth = new Date(startDate);
    while (currentMonth <= endDate) {
      const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      monthlyDataMap.set(monthKey, {
        month: monthKey,
        monthLabel,
        claims: 0,
        replacements: 0,
        netBacklog: 0,
        spareCount: currentSpareCount, // Simplified: use current count for all months
        coveredCount: currentCoveredCount,
        availableStockCount: currentAvailableStockCount,
        coverageRatio: currentCoverageRatio,
        fulfillmentRate: 0,
      });
      
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }
    
    // Fill in actual claims data
    for (const row of monthlyClaims) {
      const monthData = monthlyDataMap.get(row.month);
      if (monthData) {
        monthData.claims = row.count;
      }
    }
    
    // Fill in actual replacements data
    for (const row of monthlyReplacements) {
      const monthData = monthlyDataMap.get(row.month);
      if (monthData) {
        monthData.replacements = row.count;
      }
    }
    
    // Calculate derived metrics for each month
    const monthlyData = Array.from(monthlyDataMap.values());
    for (let i = 0; i < monthlyData.length; i++) {
      const month = monthlyData[i];
      month.netBacklog = month.claims - month.replacements;
      month.fulfillmentRate = month.claims > 0 ? (month.replacements / month.claims) * 100 : 0;
      
      // Calculate MoM growth
      if (i > 0) {
        const prevMonth = monthlyData[i - 1];
        if (prevMonth.claims > 0) {
          month.claimsGrowthMoM = ((month.claims - prevMonth.claims) / prevMonth.claims) * 100;
        }
      }
      
      // Calculate YoY growth (if we have 12+ months of data)
      if (i >= 12) {
        const sameMonthLastYear = monthlyData[i - 12];
        if (sameMonthLastYear.claims > 0) {
          month.claimsGrowthYoY = ((month.claims - sameMonthLastYear.claims) / sameMonthLastYear.claims) * 100;
        }
      }
    }
    
    // Calculate aggregate metrics
    const totalClaims = monthlyData.reduce((sum, m) => sum + m.claims, 0);
    const totalReplacements = monthlyData.reduce((sum, m) => sum + m.replacements, 0);
    const totalNetBacklog = totalClaims - totalReplacements;
    const averageFulfillmentRate = totalClaims > 0 ? (totalReplacements / totalClaims) * 100 : 0;
    const averageMonthlyClaimRate = monthlyData.length > 0 ? totalClaims / monthlyData.length : 0;
    
    // Get latest month's growth metrics
    const latestMonth = monthlyData[monthlyData.length - 1];
    const claimsGrowthMoM = latestMonth?.claimsGrowthMoM || 0;
    const claimsGrowthYoY = latestMonth?.claimsGrowthYoY;
    
    // Generate forecast using 3-month moving average
    const forecast: ForecastPoint[] = [];
    const lastThreeMonths = monthlyData.slice(-3);
    const avgClaims = lastThreeMonths.length > 0
      ? lastThreeMonths.reduce((sum, m) => sum + m.claims, 0) / lastThreeMonths.length
      : 0;
    
    // Calculate standard deviation for confidence interval
    const variance = lastThreeMonths.length > 1
      ? lastThreeMonths.reduce((sum, m) => sum + Math.pow(m.claims - avgClaims, 2), 0) / lastThreeMonths.length
      : 0;
    const stdDev = Math.sqrt(variance);
    
    for (let i = 1; i <= forecastMonths; i++) {
      const forecastDate = new Date(endDate);
      forecastDate.setMonth(forecastDate.getMonth() + i);
      const monthKey = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = forecastDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      forecast.push({
        month: monthKey,
        monthLabel,
        forecastClaims: Math.round(avgClaims),
        confidenceLower: Math.max(0, Math.round(avgClaims - 1.96 * stdDev)), // 95% confidence interval
        confidenceUpper: Math.round(avgClaims + 1.96 * stdDev),
      });
    }
    
    // Calculate inventory recommendations
    const targetSpareCount = Math.ceil(currentCoveredCount * (targetCoveragePercent / 100));
    const unitsNeededForTarget = Math.max(0, targetSpareCount - currentSpareCount);
    const inventoryRunwayMonths = averageMonthlyClaimRate > 0 ? currentSpareCount / averageMonthlyClaimRate : 999;
    
    let recommendedAction = '';
    if (currentCoverageRatio < targetCoveragePercent) {
      recommendedAction = `Add ${unitsNeededForTarget} spare units to reach target coverage of ${targetCoveragePercent}%`;
    } else if (inventoryRunwayMonths < 3) {
      recommendedAction = `Low inventory runway (${inventoryRunwayMonths.toFixed(1)} months). Consider adding more spare units.`;
    } else {
      recommendedAction = `Coverage is adequate. Monitor claim trends for changes.`;
    }
    
    console.log(`[analytics] Completed analytics for pool ${poolId}: ${monthlyData.length} months, ${totalClaims} total claims`);
    
    return {
      poolId: pool.id,
      poolName: pool.name,
      analysisStartDate: startDate.toISOString(),
      analysisEndDate: endDate.toISOString(),
      timeRangeMonths,
      
      // Current state
      currentSpareCount,
      currentCoveredCount,
      currentAvailableStockCount,
      currentUkAvailableCount,
      currentUaeAvailableCount,
      currentCoverageRatio,
      targetCoverageRatio: targetCoveragePercent,
      
      // Aggregate metrics
      totalClaims,
      totalReplacements,
      totalNetBacklog,
      averageFulfillmentRate,
      averageMonthlyClaimRate,
      
      // Growth metrics
      claimsGrowthMoM,
      claimsGrowthYoY,
      
      // Recommendations
      unitsNeededForTarget,
      inventoryRunwayMonths,
      recommendedAction,
      
      // Time series data
      monthlyData,
      forecast,
    };
  }

  async getWarrantyExpirations(filters: {
    startDate: string;
    endDate: string;
    make?: string;
    model?: string;
    customerName?: string;
    orderNumber?: string;
  }): Promise<Array<{ date: string; count: number }>> {
    const conditions = [
      sql`is_coverage_active = true`,
      sql`coverage_end_date >= ${filters.startDate}::timestamp`,
      sql`coverage_end_date <= ${filters.endDate}::timestamp`
    ];

    if (filters?.make) {
      conditions.push(sql`UPPER(make) = UPPER(${filters.make})`);
    }
    if (filters?.model) {
      conditions.push(sql`UPPER(model) = UPPER(${filters.model})`);
    }
    if (filters?.customerName) {
      conditions.push(sql`UPPER(customer_name) = UPPER(${filters.customerName})`);
    }
    if (filters?.orderNumber) {
      conditions.push(sql`UPPER(order_number) = UPPER(${filters.orderNumber})`);
    }

    const whereClause = and(...conditions);

    const result = await db.execute(sql`
      SELECT 
        DATE(coverage_end_date) as date,
        COUNT(*) as count
      FROM ${coveredUnit}
      WHERE ${whereClause}
      GROUP BY DATE(coverage_end_date)
      ORDER BY date
    `);

    return result.rows.map((row: any) => ({
      date: row.date,
      count: parseInt(row.count)
    }));
  }

  async getRiskCombinations(options?: {
    sortBy?: 'riskScore' | 'riskLevel' | 'runRate' | 'coverageRatio' | 'coveredCount' | 'coverageOfRunRate' | 'daysOfSupply';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
    search?: string;
    excludeZeroCovered?: boolean;
    status?: 'active' | 'inactive' | 'all';
    riskLevels?: string[];
    runRateMin?: number;
    runRateMax?: number;
    coverageRatioMin?: number;
    coverageRatioMax?: number;
    spareRateMin?: number;
    spareRateMax?: number;
    coveredCountMin?: number;
    coveredCountMax?: number;
  }): Promise<{ data: any[]; total: number; stats: { critical: number; high: number; medium: number; low: number; worstDeficit: number | null } }> {
    // Calculate date 6 months ago
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // Optimized query - get each metric separately and join, avoiding cartesian product
    const combinations = await db.execute(sql`
      WITH base_combinations AS (
        WITH all_combinations AS (
        -- Get all unique combinations from covered units, claims, spares, and available stock
        SELECT DISTINCT make, model, processor, generation FROM ${coveredUnit}
        UNION
        SELECT DISTINCT make, model, processor, generation FROM ${claim}
        UNION
        SELECT DISTINCT make, model, processor, generation FROM ${spareUnit}
        UNION
        SELECT DISTINCT make, model, processor, generation FROM ${availableStock}
      ),
      covered_metrics AS (
        SELECT 
          make, model, processor, generation,
          COUNT(*) as covered_count
        FROM ${coveredUnit}
        WHERE coverage_end_date >= CURRENT_DATE
          ${options?.status === 'active' ? sql`AND is_coverage_active = true` : sql``}
          ${options?.status === 'inactive' ? sql`AND is_coverage_active = false` : sql``}
        GROUP BY make, model, processor, generation
      ),
      spare_metrics AS (
        SELECT 
          make, model, processor, generation,
          COUNT(*) as spare_count
        FROM ${spareUnit}
        GROUP BY make, model, processor, generation
      ),
      available_metrics AS (
        SELECT 
          make, model, processor, generation,
          COUNT(*) as available_count,
          COUNT(*) FILTER (WHERE UPPER(area_id) = 'UK') as uk_available_count,
          COUNT(*) FILTER (WHERE UPPER(area_id) = 'UAE') as uae_available_count
        FROM ${availableStock}
        GROUP BY make, model, processor, generation
      ),
      claims_metrics AS (
        SELECT 
          make, model, processor, generation,
          COUNT(*) as claims_count
        FROM ${claim}
        WHERE claim_date >= ${sixMonthsAgo}
        GROUP BY make, model, processor, generation
      ),
      replacement_metrics AS (
        SELECT 
          make, model, processor, generation,
          COUNT(*) as replacement_count
        FROM ${replacement}
        WHERE replaced_date >= ${sixMonthsAgo}
        GROUP BY make, model, processor, generation
      )
      SELECT
        c.make,
        c.model,
        c.processor,
        c.generation,
        COALESCE(cov.covered_count, 0)::int as covered_count,
        COALESCE(sp.spare_count, 0)::int as spare_count,
        COALESCE(av.available_count, 0)::int as available_stock_count,
        COALESCE(av.uk_available_count, 0)::int as uk_available_count,
        COALESCE(av.uae_available_count, 0)::int as uae_available_count,
        COALESCE(cl.claims_count, 0)::int as claims_last_6_months,
        COALESCE(rep.replacement_count, 0)::int as replacements_last_6_months,
        CASE 
          WHEN COALESCE(cov.covered_count, 0) > 0 
          THEN ROUND((COALESCE(sp.spare_count, 0)::numeric / cov.covered_count::numeric) * 100, 2) 
          ELSE 0 
        END as coverage_ratio,
        ROUND(COALESCE(cl.claims_count, 0)::numeric / 6.0, 2) as run_rate,
        CASE 
          WHEN COALESCE(cl.claims_count, 0) > 0 
          THEN ROUND((COALESCE(rep.replacement_count, 0)::numeric / cl.claims_count::numeric) * 100, 2) 
          ELSE 100 
        END as fulfillment_rate,
        CASE 
          WHEN COALESCE(cl.claims_count, 0)::numeric / 6.0 > 0 
          THEN ROUND((COALESCE(sp.spare_count, 0)::numeric / (COALESCE(cl.claims_count, 0)::numeric / 6.0)) * 100, 2) 
          ELSE 0 
        END as coverage_of_run_rate,
        -- Days of supply: spare_count / (run_rate / 30) = days until stock depletes
        CASE 
          WHEN COALESCE(cl.claims_count, 0)::numeric / 6.0 > 0 
          THEN ROUND((COALESCE(sp.spare_count, 0)::numeric / (COALESCE(cl.claims_count, 0)::numeric / 6.0)) * 30, 1) 
          ELSE NULL 
        END as days_of_supply,
        CASE
          -- Only units with run_rate >= 1 are categorized by days of supply
          -- Critical: Run rate >= 1 AND less than 30 days of supply (won't last a month)
          WHEN COALESCE(cl.claims_count, 0)::numeric / 6.0 >= 1 AND 
               (COALESCE(sp.spare_count, 0)::numeric / (COALESCE(cl.claims_count, 0)::numeric / 6.0)) * 30 < 30
          THEN 'critical'
          -- High: Run rate >= 1 AND 30-60 days of supply (1-2 months)
          WHEN COALESCE(cl.claims_count, 0)::numeric / 6.0 >= 1 AND 
               (COALESCE(sp.spare_count, 0)::numeric / (COALESCE(cl.claims_count, 0)::numeric / 6.0)) * 30 BETWEEN 30 AND 60
          THEN 'high'
          -- Medium: Run rate >= 1 AND 60-120 days of supply (2-4 months)
          WHEN COALESCE(cl.claims_count, 0)::numeric / 6.0 >= 1 AND 
               (COALESCE(sp.spare_count, 0)::numeric / (COALESCE(cl.claims_count, 0)::numeric / 6.0)) * 30 BETWEEN 60 AND 120
          THEN 'medium'
          -- Low: Either run_rate >= 1 with sufficient supply (120+ days) OR run_rate < 1 (no demand)
          ELSE 'low'
        END as risk_level,
        CASE
          -- Critical: Run rate >= 1 AND less than 30 days
          WHEN COALESCE(cl.claims_count, 0)::numeric / 6.0 >= 1 AND 
               (COALESCE(sp.spare_count, 0)::numeric / (COALESCE(cl.claims_count, 0)::numeric / 6.0)) * 30 < 30
          THEN 95
          -- High: Run rate >= 1 AND 30-60 days
          WHEN COALESCE(cl.claims_count, 0)::numeric / 6.0 >= 1 AND 
               (COALESCE(sp.spare_count, 0)::numeric / (COALESCE(cl.claims_count, 0)::numeric / 6.0)) * 30 BETWEEN 30 AND 60
          THEN 75
          -- Medium: Run rate >= 1 AND 60-120 days
          WHEN COALESCE(cl.claims_count, 0)::numeric / 6.0 >= 1 AND 
               (COALESCE(sp.spare_count, 0)::numeric / (COALESCE(cl.claims_count, 0)::numeric / 6.0)) * 30 BETWEEN 60 AND 120
          THEN 50
          ELSE 20
        END as risk_score
        FROM all_combinations c
        LEFT JOIN covered_metrics cov USING (make, model, processor, generation)
        LEFT JOIN spare_metrics sp USING (make, model, processor, generation)
        LEFT JOIN available_metrics av USING (make, model, processor, generation)
        LEFT JOIN claims_metrics cl USING (make, model, processor, generation)
        LEFT JOIN replacement_metrics rep USING (make, model, processor, generation)
        WHERE (COALESCE(cl.claims_count, 0) > 0 OR COALESCE(cov.covered_count, 0) > 0 OR COALESCE(sp.spare_count, 0) > 0)
          ${options?.excludeZeroCovered ? sql`AND COALESCE(cov.covered_count, 0) > 0` : sql``}
          ${options?.search ? sql`AND (
            LOWER(c.make) LIKE LOWER(${'%' + options.search + '%'}) OR
            LOWER(c.model) LIKE LOWER(${'%' + options.search + '%'}) OR
            LOWER(COALESCE(c.processor, '')) LIKE LOWER(${'%' + options.search + '%'}) OR
            LOWER(COALESCE(c.generation, '')) LIKE LOWER(${'%' + options.search + '%'})
          )` : sql``}
      ),
      filtered_combinations AS (
        SELECT *, COUNT(*) OVER() as total_count FROM base_combinations
        WHERE 1=1
          ${options?.riskLevels && options.riskLevels.length > 0 ? 
            sql`AND risk_level IN (${sql.join(options.riskLevels.map(level => sql`${level}`), sql`, `)})` 
          : sql``}
          ${options?.runRateMin !== undefined && !isNaN(options.runRateMin) ? 
            sql`AND run_rate >= ${options.runRateMin}` 
          : sql``}
          ${options?.runRateMax !== undefined && !isNaN(options.runRateMax) ? 
            sql`AND run_rate <= ${options.runRateMax}` 
          : sql``}
          ${options?.coverageRatioMin !== undefined && !isNaN(options.coverageRatioMin) ? 
            sql`AND coverage_ratio >= ${options.coverageRatioMin}` 
          : sql``}
          ${options?.coverageRatioMax !== undefined && !isNaN(options.coverageRatioMax) ? 
            sql`AND coverage_ratio <= ${options.coverageRatioMax}` 
          : sql``}
          ${options?.spareRateMin !== undefined && !isNaN(options.spareRateMin) ? 
            sql`AND coverage_of_run_rate >= ${options.spareRateMin}` 
          : sql``}
          ${options?.spareRateMax !== undefined && !isNaN(options.spareRateMax) ? 
            sql`AND coverage_of_run_rate <= ${options.spareRateMax}` 
          : sql``}
          ${options?.coveredCountMin !== undefined && !isNaN(options.coveredCountMin) ? 
            sql`AND covered_count >= ${options.coveredCountMin}` 
          : sql``}
          ${options?.coveredCountMax !== undefined && !isNaN(options.coveredCountMax) ? 
            sql`AND covered_count <= ${options.coveredCountMax}` 
          : sql``}
      ),
      stats_agg AS (
        SELECT 
          COUNT(CASE WHEN risk_level = 'critical' THEN 1 END)::int as critical_count,
          COUNT(CASE WHEN risk_level = 'high' THEN 1 END)::int as high_count,
          COUNT(CASE WHEN risk_level = 'medium' THEN 1 END)::int as medium_count,
          COUNT(CASE WHEN risk_level = 'low' THEN 1 END)::int as low_count,
          MIN(coverage_ratio) as worst_deficit
        FROM filtered_combinations
      )
      SELECT 
        fc.*,
        sa.critical_count,
        sa.high_count,
        sa.medium_count,
        sa.low_count,
        sa.worst_deficit
      FROM filtered_combinations fc
      CROSS JOIN stats_agg sa
      ORDER BY ${sql.raw(
        options?.sortBy === 'runRate' ? 'fc.run_rate' : 
        options?.sortBy === 'coverageRatio' ? 'fc.coverage_ratio' : 
        options?.sortBy === 'coveredCount' ? 'fc.covered_count' :
        options?.sortBy === 'coverageOfRunRate' ? 'fc.coverage_of_run_rate' :
        options?.sortBy === 'daysOfSupply' ? 'fc.days_of_supply' :
        options?.sortBy === 'riskLevel' ? `CASE fc.risk_level WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END` :
        'fc.days_of_supply'
      )} ${sql.raw(options?.sortOrder === 'asc' ? 'ASC' : 'DESC')} ${sql.raw(
        options?.sortBy === 'daysOfSupply' || !options?.sortBy ? 'NULLS LAST' : ''
      )}
      ${options?.limit !== undefined ? sql`LIMIT ${options.limit}` : sql``}
      ${options?.offset !== undefined && options?.offset > 0 ? sql`OFFSET ${options.offset}` : sql``}
    `);
    
    const total = combinations.rows.length > 0 ? parseInt(String((combinations.rows[0] as any).total_count)) : 0;
    
    // Extract stats from the first row (same for all rows due to CROSS JOIN)
    const stats = combinations.rows.length > 0 ? {
      critical: parseInt(String((combinations.rows[0] as any).critical_count)) || 0,
      high: parseInt(String((combinations.rows[0] as any).high_count)) || 0,
      medium: parseInt(String((combinations.rows[0] as any).medium_count)) || 0,
      low: parseInt(String((combinations.rows[0] as any).low_count)) || 0,
      worstDeficit: (combinations.rows[0] as any).worst_deficit !== null 
        ? Number((combinations.rows[0] as any).worst_deficit)
        : null
    } : {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      worstDeficit: null
    };
    
    // Remove stats and total_count columns from data rows
    const data = combinations.rows.map((row: any) => {
      const { total_count, critical_count, high_count, medium_count, low_count, worst_deficit, ...rest } = row;
      return rest;
    });
    
    return { data, total, stats };
  }

  async getAllModelStats(options?: {
    sortBy?: 'make' | 'model' | 'runRate' | 'spareRate' | 'daysOfSupply' | 'coveredCount' | 'spareCount' | 'coverageRatio';
    sortOrder?: 'asc' | 'desc';
  }): Promise<Array<{
    make: string;
    model: string;
    processor: string | null;
    generation: string | null;
    coveredCount: number;
    spareCount: number;
    availableStockCount: number;
    ukAvailableCount: number;
    uaeAvailableCount: number;
    runRate: number;
    spareRate: number | null;
    daysOfSupply: number | null;
    coverageRatio: number | null;
    unitsNeededFor2Months: number;
    riskLevel: string;
  }>> {
    // Calculate date 6 months ago for run rate calculation
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // Aggregate all model statistics using CTEs
    const result = await db.execute(sql`
      WITH all_combinations AS (
        -- Get all unique combinations from all tables
        SELECT DISTINCT make, model, processor, generation FROM ${coveredUnit}
        UNION
        SELECT DISTINCT make, model, processor, generation FROM ${claim}
        UNION
        SELECT DISTINCT make, model, processor, generation FROM ${spareUnit}
        UNION
        SELECT DISTINCT make, model, processor, generation FROM ${availableStock}
      ),
      covered_metrics AS (
        SELECT 
          make, model, processor, generation,
          COUNT(*) as covered_count
        FROM ${coveredUnit}
        WHERE coverage_end_date >= CURRENT_DATE
        GROUP BY make, model, processor, generation
      ),
      spare_metrics AS (
        SELECT 
          make, model, processor, generation,
          COUNT(*) as spare_count
        FROM ${spareUnit}
        GROUP BY make, model, processor, generation
      ),
      available_metrics AS (
        SELECT 
          make, model, processor, generation,
          COUNT(*) as available_count,
          COUNT(*) FILTER (WHERE UPPER(area_id) = 'UK') as uk_available_count,
          COUNT(*) FILTER (WHERE UPPER(area_id) = 'UAE') as uae_available_count
        FROM ${availableStock}
        GROUP BY make, model, processor, generation
      ),
      claims_metrics AS (
        SELECT 
          make, model, processor, generation,
          COUNT(*) as claims_count
        FROM ${claim}
        WHERE claim_date >= ${sixMonthsAgo}
        GROUP BY make, model, processor, generation
      )
      SELECT
        c.make,
        c.model,
        c.processor,
        c.generation,
        COALESCE(cov.covered_count, 0)::int as covered_count,
        COALESCE(sp.spare_count, 0)::int as spare_count,
        COALESCE(av.available_count, 0)::int as available_stock_count,
        COALESCE(av.uk_available_count, 0)::int as uk_available_count,
        COALESCE(av.uae_available_count, 0)::int as uae_available_count,
        -- Run rate: average claims per month over last 6 months
        ROUND(COALESCE(cl.claims_count, 0)::numeric / 6.0, 2) as run_rate,
        -- Spare rate: (spare_count / run_rate) * 100
        CASE 
          WHEN COALESCE(cl.claims_count, 0)::numeric / 6.0 > 0 
          THEN ROUND((COALESCE(sp.spare_count, 0)::numeric / (COALESCE(cl.claims_count, 0)::numeric / 6.0)) * 100, 2) 
          ELSE NULL 
        END as spare_rate,
        -- Days of supply: (spare_count / run_rate_per_month) * 30
        CASE 
          WHEN COALESCE(cl.claims_count, 0)::numeric / 6.0 > 0 
          THEN ROUND((COALESCE(sp.spare_count, 0)::numeric / (COALESCE(cl.claims_count, 0)::numeric / 6.0)) * 30, 1) 
          ELSE NULL 
        END as days_of_supply,
        -- Coverage ratio: (spare_count / covered_count) * 100
        CASE 
          WHEN COALESCE(cov.covered_count, 0) > 0 
          THEN ROUND((COALESCE(sp.spare_count, 0)::numeric / cov.covered_count::numeric) * 100, 2) 
          ELSE NULL 
        END as coverage_ratio,
        -- Units needed for 2 months: MAX(0, (run_rate * 2) - spare_count)
        CASE 
          WHEN COALESCE(cl.claims_count, 0)::numeric / 6.0 > 0 
          THEN GREATEST(0, ROUND((COALESCE(cl.claims_count, 0)::numeric / 6.0) * 2, 0)::int - COALESCE(sp.spare_count, 0))
          ELSE 0 
        END as units_needed_for_2_months,
        -- Risk level based on days of supply
        CASE
          WHEN COALESCE(cl.claims_count, 0)::numeric / 6.0 >= 1 AND 
               (COALESCE(sp.spare_count, 0)::numeric / (COALESCE(cl.claims_count, 0)::numeric / 6.0)) * 30 < 30
          THEN 'critical'
          WHEN COALESCE(cl.claims_count, 0)::numeric / 6.0 >= 1 AND 
               (COALESCE(sp.spare_count, 0)::numeric / (COALESCE(cl.claims_count, 0)::numeric / 6.0)) * 30 BETWEEN 30 AND 60
          THEN 'high'
          WHEN COALESCE(cl.claims_count, 0)::numeric / 6.0 >= 1 AND 
               (COALESCE(sp.spare_count, 0)::numeric / (COALESCE(cl.claims_count, 0)::numeric / 6.0)) * 30 BETWEEN 60 AND 120
          THEN 'medium'
          ELSE 'low'
        END as risk_level
      FROM all_combinations c
      LEFT JOIN covered_metrics cov USING (make, model, processor, generation)
      LEFT JOIN spare_metrics sp USING (make, model, processor, generation)
      LEFT JOIN available_metrics av USING (make, model, processor, generation)
      LEFT JOIN claims_metrics cl USING (make, model, processor, generation)
      WHERE (COALESCE(cl.claims_count, 0) > 0 OR COALESCE(cov.covered_count, 0) > 0 OR COALESCE(sp.spare_count, 0) > 0)
        -- Filter for models with meaningful demand (run_rate >= 1.0) AND 60 or fewer days of supply
        AND (
          (COALESCE(cl.claims_count, 0)::numeric / 6.0 >= 1.0 AND 
           (COALESCE(sp.spare_count, 0)::numeric / (COALESCE(cl.claims_count, 0)::numeric / 6.0)) * 30 <= 60)
        )
      ORDER BY 
        ${options?.sortBy === 'make' ? sql`c.make` : 
          options?.sortBy === 'model' ? sql`c.model` :
          options?.sortBy === 'runRate' ? sql`run_rate` :
          options?.sortBy === 'spareRate' ? sql`spare_rate` :
          options?.sortBy === 'daysOfSupply' ? sql`days_of_supply` :
          options?.sortBy === 'coveredCount' ? sql`covered_count` :
          options?.sortBy === 'spareCount' ? sql`spare_count` :
          options?.sortBy === 'coverageRatio' ? sql`coverage_ratio` :
          sql`c.make, c.model`}
        ${options?.sortOrder === 'desc' ? sql`DESC` : sql`ASC`}
    `);
    
    return result.rows.map((row: any) => ({
      make: row.make,
      model: row.model,
      processor: row.processor || null,
      generation: row.generation || null,
      coveredCount: parseInt(row.covered_count),
      spareCount: parseInt(row.spare_count),
      availableStockCount: parseInt(row.available_stock_count),
      ukAvailableCount: parseInt(row.uk_available_count),
      uaeAvailableCount: parseInt(row.uae_available_count),
      runRate: parseFloat(row.run_rate),
      spareRate: row.spare_rate !== null ? parseFloat(row.spare_rate) : null,
      daysOfSupply: row.days_of_supply !== null ? parseFloat(row.days_of_supply) : null,
      coverageRatio: row.coverage_ratio !== null ? parseFloat(row.coverage_ratio) : null,
      unitsNeededFor2Months: parseInt(row.units_needed_for_2_months),
      riskLevel: row.risk_level,
    }));
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
    
    // Convert number to string for decimal fields if present
    const updateData: any = { ...data, modifiedOn: new Date() };
    if (updateData.lowCoverageThresholdPercent !== undefined) {
      updateData.lowCoverageThresholdPercent = String(updateData.lowCoverageThresholdPercent);
    }
    if (updateData.targetCoveragePercent !== undefined) {
      updateData.targetCoveragePercent = String(updateData.targetCoveragePercent);
    }
    
    // Update configuration
    const [updated] = await db
      .update(appConfiguration)
      .set(updateData)
      .where(eq(appConfiguration.id, 'system'))
      .returning();
    
    return updated;
  }

  // Explore Dashboard Analytics Methods
  
  // Helper: Build common WHERE clauses for explore filters (case-insensitive)
  private buildExploreFilterConditions(filters?: {
    make?: string[];
    model?: string[];
    customer?: string[];
    order?: string[];
  }) {
    const conditions: any[] = [];
    
    if (filters?.make && filters.make.length > 0) {
      const upperMakes = filters.make.map(m => m.toUpperCase());
      conditions.push(sql`UPPER(${coveredUnit.make}) IN ${upperMakes}`);
    }
    if (filters?.model && filters.model.length > 0) {
      const upperModels = filters.model.map(m => m.toUpperCase());
      conditions.push(sql`UPPER(${coveredUnit.model}) IN ${upperModels}`);
    }
    if (filters?.customer && filters.customer.length > 0) {
      const upperCustomers = filters.customer.map(c => c.toUpperCase());
      conditions.push(sql`UPPER(${coveredUnit.customerName}) IN ${upperCustomers}`);
    }
    if (filters?.order && filters.order.length > 0) {
      const upperOrders = filters.order.map(o => o.toUpperCase());
      conditions.push(sql`UPPER(${coveredUnit.orderNumber}) IN ${upperOrders}`);
    }
    
    return conditions;
  }

  async getTopModelsByWarranties(filters?: {
    make?: string[];
    model?: string[];
    customer?: string[];
    order?: string[];
    limit?: number;
  }): Promise<Array<{ model: string; count: number }>> {
    const conditions = this.buildExploreFilterConditions(filters);
    conditions.push(nonExpiredCoveredUnitsCondition());
    
    const result = await db
      .select({
        model: coveredUnit.model,
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(coveredUnit)
      .where(and(...conditions))
      .groupBy(coveredUnit.model)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(filters?.limit || 10);
    
    return result.map(r => ({ model: r.model, count: Number(r.count) }));
  }

  async getWarrantyDescriptions(filters?: {
    make?: string[];
    model?: string[];
    customer?: string[];
    order?: string[];
  }): Promise<Array<{ description: string; count: number }>> {
    const conditions = this.buildExploreFilterConditions(filters);
    conditions.push(nonExpiredCoveredUnitsCondition());
    
    const result = await db
      .select({
        description: coveredUnit.coverageDescription,
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(coveredUnit)
      .where(and(...conditions))
      .groupBy(coveredUnit.coverageDescription)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(20);
    
    return result.map(r => ({ description: r.description || 'N/A', count: Number(r.count) }));
  }

  async getWarrantiesByCategory(filters?: {
    make?: string[];
    model?: string[];
    customer?: string[];
    order?: string[];
  }): Promise<Array<{ category: string; month: string; count: number }>> {
    const conditions = this.buildExploreFilterConditions(filters);
    conditions.push(nonExpiredCoveredUnitsCondition());
    
    const result = await db
      .select({
        category: coveredUnit.category,
        month: sql<string>`TO_CHAR(${coveredUnit.coverageStartDate}, 'YYYY-MM')`.as('month'),
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(coveredUnit)
      .where(and(...conditions))
      .groupBy(coveredUnit.category, sql`TO_CHAR(${coveredUnit.coverageStartDate}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${coveredUnit.coverageStartDate}, 'YYYY-MM')`);
    
    return result.map(r => ({ category: r.category || 'Unknown', month: r.month, count: Number(r.count) }));
  }

  async getTopCustomersByCoveredUnits(filters?: {
    make?: string[];
    model?: string[];
    customer?: string[];
    order?: string[];
    limit?: number;
  }): Promise<Array<{ customer: string; count: number }>> {
    const conditions = this.buildExploreFilterConditions(filters);
    
    const result = await db
      .select({
        customer: coveredUnit.customerName,
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(coveredUnit)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(coveredUnit.customerName)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(filters?.limit || 10);
    
    return result.map(r => ({ customer: r.customer || 'Unknown', count: Number(r.count) }));
  }

  async getClaimsByModel(filters?: {
    make?: string[];
    model?: string[];
    customer?: string[];
    order?: string[];
  }): Promise<Array<{ model: string; count: number }>> {
    const conditions: any[] = [];
    
    // Claims table only has make and model, no customer or order fields (case-insensitive)
    if (filters?.make && filters.make.length > 0) {
      const upperMakes = filters.make.map(m => m.toUpperCase());
      conditions.push(sql`UPPER(${claim.make}) IN ${upperMakes}`);
    }
    if (filters?.model && filters.model.length > 0) {
      const upperModels = filters.model.map(m => m.toUpperCase());
      conditions.push(sql`UPPER(${claim.model}) IN ${upperModels}`);
    }
    
    const result = await db
      .select({
        model: claim.model,
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(claim)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(claim.model)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(15);
    
    return result.map(r => ({ model: r.model, count: Number(r.count) }));
  }

  async getReplacementsByModel(filters?: {
    make?: string[];
    model?: string[];
    customer?: string[];
    order?: string[];
  }): Promise<Array<{ model: string; count: number }>> {
    const conditions: any[] = [];
    
    // Replacements table only has make and model, no customer or order fields (case-insensitive)
    if (filters?.make && filters.make.length > 0) {
      const upperMakes = filters.make.map(m => m.toUpperCase());
      conditions.push(sql`UPPER(${replacement.make}) IN ${upperMakes}`);
    }
    if (filters?.model && filters.model.length > 0) {
      const upperModels = filters.model.map(m => m.toUpperCase());
      conditions.push(sql`UPPER(${replacement.model}) IN ${upperModels}`);
    }
    
    const result = await db
      .select({
        model: replacement.model,
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(replacement)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(replacement.model)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(15);
    
    return result.map(r => ({ model: r.model, count: Number(r.count) }));
  }

  async getSparePoolByModel(filters?: {
    make?: string[];
    model?: string[];
    customer?: string[];
    order?: string[];
  }): Promise<Array<{ model: string; count: number }>> {
    const conditions: any[] = [];
    
    // Spare units filtering with case-insensitive matching
    if (filters?.make && filters.make.length > 0) {
      const upperMakes = filters.make.map(m => m.toUpperCase());
      conditions.push(sql`UPPER(${spareUnit.make}) IN ${upperMakes}`);
    }
    if (filters?.model && filters.model.length > 0) {
      const upperModels = filters.model.map(m => m.toUpperCase());
      conditions.push(sql`UPPER(${spareUnit.model}) IN ${upperModels}`);
    }
    
    const result = await db
      .select({
        model: spareUnit.model,
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(spareUnit)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(spareUnit.model)
      .orderBy(desc(sql`COUNT(*)`));
    
    return result.map(r => ({ model: r.model, count: Number(r.count) }));
  }

  async getMonthlyClaimsReplacements(filters?: {
    make?: string[];
    model?: string[];
    customer?: string[];
    order?: string[];
  }): Promise<Array<{ month: string; claims: number; replacements: number }>> {
    const claimConditions: any[] = [];
    const replacementConditions: any[] = [];
    
    // Claims and replacements tables only have make and model (case-insensitive)
    if (filters?.make && filters.make.length > 0) {
      const upperMakes = filters.make.map(m => m.toUpperCase());
      claimConditions.push(sql`UPPER(${claim.make}) IN ${upperMakes}`);
      replacementConditions.push(sql`UPPER(${replacement.make}) IN ${upperMakes}`);
    }
    if (filters?.model && filters.model.length > 0) {
      const upperModels = filters.model.map(m => m.toUpperCase());
      claimConditions.push(sql`UPPER(${claim.model}) IN ${upperModels}`);
      replacementConditions.push(sql`UPPER(${replacement.model}) IN ${upperModels}`);
    }
    
    const claims = await db
      .select({
        month: sql<string>`TO_CHAR(${claim.claimDate}, 'YYYY-MM')`.as('month'),
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(claim)
      .where(claimConditions.length > 0 ? and(...claimConditions) : undefined)
      .groupBy(sql`TO_CHAR(${claim.claimDate}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${claim.claimDate}, 'YYYY-MM')`);
    
    const replacements = await db
      .select({
        month: sql<string>`TO_CHAR(${replacement.replacedDate}, 'YYYY-MM')`.as('month'),
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(replacement)
      .where(replacementConditions.length > 0 ? and(...replacementConditions) : undefined)
      .groupBy(sql`TO_CHAR(${replacement.replacedDate}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${replacement.replacedDate}, 'YYYY-MM')`);
    
    const monthMap = new Map<string, { claims: number; replacements: number }>();
    
    claims.forEach(c => {
      monthMap.set(c.month, { claims: Number(c.count), replacements: 0 });
    });
    
    replacements.forEach(r => {
      const existing = monthMap.get(r.month);
      if (existing) {
        existing.replacements = Number(r.count);
      } else {
        monthMap.set(r.month, { claims: 0, replacements: Number(r.count) });
      }
    });
    
    return Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, data]) => ({ month, claims: data.claims, replacements: data.replacements }));
  }

  async getMonthlyWarrantyStarts(filters?: {
    make?: string[];
    model?: string[];
    customer?: string[];
    order?: string[];
  }): Promise<Array<{ month: string; count: number }>> {
    const conditions = this.buildExploreFilterConditions(filters);
    
    const result = await db
      .select({
        month: sql<string>`TO_CHAR(${coveredUnit.coverageStartDate}, 'YYYY-MM')`.as('month'),
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(coveredUnit)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(sql`TO_CHAR(${coveredUnit.coverageStartDate}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${coveredUnit.coverageStartDate}, 'YYYY-MM')`);
    
    return result.map(r => ({ month: r.month, count: Number(r.count) }));
  }

  async getExploreFilterOptions(): Promise<{
    makes: string[];
    models: string[];
    customers: string[];
    orders: string[];
  }> {
    const makes = await db
      .selectDistinct({ value: sql<string>`UPPER(${coveredUnit.make})`.as('value') })
      .from(coveredUnit)
      .where(sql`${coveredUnit.make} IS NOT NULL AND ${coveredUnit.make} != ''`)
      .orderBy(sql`UPPER(${coveredUnit.make})`);
    
    const models = await db
      .selectDistinct({ value: sql<string>`UPPER(${coveredUnit.model})`.as('value') })
      .from(coveredUnit)
      .where(sql`${coveredUnit.model} IS NOT NULL AND ${coveredUnit.model} != ''`)
      .orderBy(sql`UPPER(${coveredUnit.model})`);
    
    const customers = await db
      .selectDistinct({ value: sql<string>`UPPER(${coveredUnit.customerName})`.as('value') })
      .from(coveredUnit)
      .where(sql`${coveredUnit.customerName} IS NOT NULL AND ${coveredUnit.customerName} != ''`)
      .orderBy(sql`UPPER(${coveredUnit.customerName})`);
    
    const orders = await db
      .selectDistinct({ value: sql<string>`UPPER(${coveredUnit.orderNumber})`.as('value') })
      .from(coveredUnit)
      .where(sql`${coveredUnit.orderNumber} IS NOT NULL AND ${coveredUnit.orderNumber} != ''`)
      .orderBy(sql`UPPER(${coveredUnit.orderNumber})`);
    
    return {
      makes: makes.map(m => m.value).filter(Boolean) as string[],
      models: models.map(m => m.value).filter(Boolean) as string[],
      customers: customers.map(c => c.value).filter(Boolean) as string[],
      orders: orders.map(o => o.value).filter(Boolean) as string[],
    };
  }
}

export const storage = new DatabaseStorage();
