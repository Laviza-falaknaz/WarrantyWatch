import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, decimal, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Spare units available in the pool to cover warranty claims
export const spareUnit = pgTable("spare_unit", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serialNumber: varchar("serial_number", { length: 100 }).notNull(),
  areaId: varchar("area_id", { length: 50 }).notNull(),
  itemId: varchar("item_id", { length: 50 }).notNull(),
  // Specification fields for filtering
  make: varchar("make", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  processor: varchar("processor", { length: 100 }),
  generation: varchar("generation", { length: 50 }),
  ram: varchar("ram", { length: 50 }),
  hdd: varchar("hdd", { length: 50 }),
  displaySize: varchar("display_size", { length: 50 }),
  touchscreen: boolean("touchscreen").default(false),
  category: varchar("category", { length: 50 }),
  // Pool management fields
  reservedForCase: varchar("reserved_for_case", { length: 100 }), // formerly allocatedOrder
  retiredOrder: varchar("retired_order", { length: 100 }), // formerly soldOrder
  currentHolder: varchar("current_holder", { length: 200 }), // formerly customer
  retiredDate: timestamp("retired_date"), // formerly soldDate
  productDescription: text("product_description"),
  productNumber: varchar("product_number", { length: 100 }),
  createdOn: timestamp("created_on").notNull().defaultNow(),
  modifiedOn: timestamp("modified_on").notNull().defaultNow(),
}, (table) => ({
  uniqueKey: uniqueIndex("spare_unit_unique_key").on(table.serialNumber, table.areaId, table.itemId),
}));

// Units deployed in the field under warranty coverage (need potential replacement)
export const coveredUnit = pgTable("covered_unit", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serialNumber: varchar("serial_number", { length: 100 }).notNull(),
  areaId: varchar("area_id", { length: 50 }).notNull(),
  itemId: varchar("item_id", { length: 50 }).notNull(),
  // Specification fields for filtering (must match spare units for pool matching)
  make: varchar("make", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  processor: varchar("processor", { length: 100 }),
  generation: varchar("generation", { length: 50 }),
  ram: varchar("ram", { length: 50 }),
  hdd: varchar("hdd", { length: 50 }),
  displaySize: varchar("display_size", { length: 50 }),
  touchscreen: boolean("touchscreen").default(false),
  category: varchar("category", { length: 50 }),
  // Coverage period fields
  coverageStartDate: timestamp("coverage_start_date").notNull(),
  coverageEndDate: timestamp("coverage_end_date").notNull(),
  coverageDescription: text("coverage_description"),
  coverageDurationDays: integer("coverage_duration_days").notNull(),
  isCoverageActive: boolean("is_coverage_active").notNull().default(true),
  // Customer and order details
  customerName: varchar("customer_name", { length: 200 }),
  customerEmail: varchar("customer_email", { length: 200 }),
  customerPhone: varchar("customer_phone", { length: 50 }),
  orderNumber: varchar("order_number", { length: 100 }),
  orderDate: timestamp("order_date"),
  // Deployment information
  currentHolder: varchar("current_holder", { length: 200 }), // customer/location
  productDescription: text("product_description"),
  productNumber: varchar("product_number", { length: 100 }),
  createdOn: timestamp("created_on").notNull().defaultNow(),
  modifiedOn: timestamp("modified_on").notNull().defaultNow(),
}, (table) => ({
  uniqueKey: uniqueIndex("covered_unit_unique_key").on(table.serialNumber, table.areaId, table.itemId, table.orderNumber),
}));

// Coverage pool groups showing spare/covered ratios by specifications
export const coveragePool = pgTable("coverage_pool", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  filterCriteria: text("filter_criteria").notNull(), // JSON string of filter criteria (applies to both spare and covered units)
  createdOn: timestamp("created_on").notNull().defaultNow(),
  modifiedOn: timestamp("modified_on").notNull().defaultNow(),
});

// All available stock units (outside the pool, can supplement if needed)
export const availableStock = pgTable("available_stock", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serialNumber: varchar("serial_number", { length: 100 }).notNull(),
  areaId: varchar("area_id", { length: 50 }).notNull(),
  itemId: varchar("item_id", { length: 50 }).notNull(),
  // Specification fields (matching spare/covered units for pool analysis)
  make: varchar("make", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  processor: varchar("processor", { length: 100 }),
  generation: varchar("generation", { length: 50 }),
  ram: varchar("ram", { length: 50 }),
  hdd: varchar("hdd", { length: 50 }),
  displaySize: varchar("display_size", { length: 50 }),
  touchscreen: boolean("touchscreen").default(false),
  category: varchar("category", { length: 50 }),
  // Reservation fields
  reservedSegregationGroup: varchar("reserved_segregation_group", { length: 100 }),
  reservedForCase: varchar("reserved_for_case", { length: 100 }),
  // Product details
  productDescription: text("product_description"),
  productNumber: varchar("product_number", { length: 100 }),
  createdOn: timestamp("created_on").notNull().defaultNow(),
  modifiedOn: timestamp("modified_on").notNull().defaultNow(),
}, (table) => ({
  uniqueKey: uniqueIndex("available_stock_unique_key").on(table.serialNumber, table.areaId, table.itemId),
}));

// Claimed units (warranty returns)
export const claim = pgTable("claim", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serialNumber: varchar("serial_number", { length: 100 }).notNull(),
  areaId: varchar("area_id", { length: 50 }).notNull(),
  itemId: varchar("item_id", { length: 50 }).notNull(),
  rma: varchar("rma", { length: 100 }).notNull(),
  // Specification fields
  make: varchar("make", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  processor: varchar("processor", { length: 100 }),
  generation: varchar("generation", { length: 50 }),
  ram: varchar("ram", { length: 50 }),
  hdd: varchar("hdd", { length: 50 }),
  displaySize: varchar("display_size", { length: 50 }),
  touchscreen: boolean("touchscreen").default(false),
  category: varchar("category", { length: 50 }),
  // Product details
  productDescription: text("product_description"),
  productNumber: varchar("product_number", { length: 100 }),
  // Claim specific
  claimDate: timestamp("claim_date").notNull(),
  createdOn: timestamp("created_on").notNull().defaultNow(),
  modifiedOn: timestamp("modified_on").notNull().defaultNow(),
}, (table) => ({
  uniqueKey: uniqueIndex("claim_unique_key").on(table.serialNumber, table.areaId, table.itemId, table.rma),
}));

// Replacement units (sent as replacements)
export const replacement = pgTable("replacement", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serialNumber: varchar("serial_number", { length: 100 }).notNull(),
  areaId: varchar("area_id", { length: 50 }).notNull(),
  itemId: varchar("item_id", { length: 50 }).notNull(),
  rma: varchar("rma", { length: 100 }).notNull(),
  // Specification fields
  make: varchar("make", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  processor: varchar("processor", { length: 100 }),
  generation: varchar("generation", { length: 50 }),
  ram: varchar("ram", { length: 50 }),
  hdd: varchar("hdd", { length: 50 }),
  displaySize: varchar("display_size", { length: 50 }),
  touchscreen: boolean("touchscreen").default(false),
  category: varchar("category", { length: 50 }),
  // Product details
  productDescription: text("product_description"),
  productNumber: varchar("product_number", { length: 100 }),
  // Replacement specific
  replacedDate: timestamp("replaced_date").notNull(),
  createdOn: timestamp("created_on").notNull().defaultNow(),
  modifiedOn: timestamp("modified_on").notNull().defaultNow(),
}, (table) => ({
  uniqueKey: uniqueIndex("replacement_unique_key").on(table.serialNumber, table.areaId, table.itemId, table.rma),
}));

// Application configuration settings (single row table for system-wide settings)
export const appConfiguration = pgTable("app_configuration", {
  id: varchar("id").primaryKey().default(sql`'system'`), // Always 'system' - single row
  // Coverage threshold settings
  lowCoverageThresholdPercent: decimal("low_coverage_threshold_percent", { precision: 5, scale: 2 }).notNull().default('10.00'), // e.g., 6.00 for 6%
  // Expiry settings
  expiringCoverageDays: integer("expiring_coverage_days").notNull().default(30), // Days before coverage end to show "expiring soon"
  poolInactivityDays: integer("pool_inactivity_days").notNull().default(90), // Days of no activity before pool is considered inactive
  // Run rate calculation settings
  runRatePeriodMonths: integer("run_rate_period_months").notNull().default(6), // Period in months for calculating run rate
  // Analytics settings
  analyticsTimeRangeMonths: integer("analytics_time_range_months").notNull().default(12), // Default time range for trend analysis
  analyticsForecastMonths: integer("analytics_forecast_months").notNull().default(3), // Default forecast period for demand prediction
  targetCoveragePercent: decimal("target_coverage_percent", { precision: 5, scale: 2 }).notNull().default('20.00'), // Target coverage ratio (e.g., 20% spare units to covered units)
  // Alert settings
  enableLowCoverageAlerts: boolean("enable_low_coverage_alerts").notNull().default(true),
  enableExpiringAlerts: boolean("enable_expiring_alerts").notNull().default(true),
  alertWebhookUrl: text("alert_webhook_url").default('https://01f7d87362b64cf3a95fbd0a0c6bc1.28.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/e588982081fa4405b395f6a4d567c323/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Cd5dTN0ndNEbjqLeRT7yeDOKO0KHA0_BG0uwyDuPjjw'), // Power Automate webhook URL
  // Display settings
  dashboardRefreshMinutes: integer("dashboard_refresh_minutes").notNull().default(5),
  // Audit
  modifiedOn: timestamp("modified_on").notNull().defaultNow(),
  modifiedBy: varchar("modified_by", { length: 200 }).default('system'),
});

// Helper for date validation - handles both Date objects and ISO strings
const dateSchema = z.union([
  z.date(),
  z.string().transform((str, ctx) => {
    const date = new Date(str);
    if (isNaN(date.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid date string",
      });
      return z.NEVER;
    }
    return date;
  })
]);

export const insertSpareUnitSchema = createInsertSchema(spareUnit).omit({
  id: true,
  createdOn: true,
  modifiedOn: true,
}).extend({
  // Allow date strings from JSON (ADF sends dates as strings)
  retiredDate: dateSchema.optional().nullable(),
});

export const insertCoveredUnitSchema = createInsertSchema(coveredUnit).omit({
  id: true,
  createdOn: true,
  modifiedOn: true,
  coverageDurationDays: true, // Will be auto-calculated from dates
}).extend({
  // Allow date strings from JSON (ADF sends dates as strings)
  coverageStartDate: dateSchema,
  coverageEndDate: dateSchema,
  orderDate: dateSchema.optional().nullable(),
}).refine(
  (data) => {
    const start = data.coverageStartDate instanceof Date ? data.coverageStartDate : new Date(data.coverageStartDate);
    const end = data.coverageEndDate instanceof Date ? data.coverageEndDate : new Date(data.coverageEndDate);
    return start <= end;
  },
  {
    message: "Coverage start date must be before or equal to end date",
    path: ["coverageEndDate"],
  }
);

// Optimized schema for bulk operations - skips expensive refine validation
// Use this for bulk uploads where data is pre-validated by the source system
export const bulkInsertCoveredUnitSchema = createInsertSchema(coveredUnit).omit({
  id: true,
  createdOn: true,
  modifiedOn: true,
  coverageDurationDays: true,
}).extend({
  // Simpler date handling for bulk operations - accept strings or dates
  coverageStartDate: z.union([z.date(), z.string()]),
  coverageEndDate: z.union([z.date(), z.string()]),
  orderDate: z.union([z.date(), z.string()]).optional().nullable(),
});

export const insertCoveragePoolSchema = createInsertSchema(coveragePool).omit({
  id: true,
  createdOn: true,
  modifiedOn: true,
});

export const insertAvailableStockSchema = createInsertSchema(availableStock).omit({
  id: true,
  createdOn: true,
  modifiedOn: true,
});

export const insertClaimSchema = createInsertSchema(claim).omit({
  id: true,
  createdOn: true,
  modifiedOn: true,
}).extend({
  claimDate: dateSchema,
});

export const insertReplacementSchema = createInsertSchema(replacement).omit({
  id: true,
  createdOn: true,
  modifiedOn: true,
}).extend({
  replacedDate: dateSchema,
});

export const insertAppConfigurationSchema = createInsertSchema(appConfiguration).omit({
  id: true,
  modifiedOn: true,
}).extend({
  lowCoverageThresholdPercent: z.coerce.number().min(0).max(100),
  expiringCoverageDays: z.coerce.number().int().min(1).max(365),
  poolInactivityDays: z.coerce.number().int().min(1).max(365),
  runRatePeriodMonths: z.coerce.number().int().min(1).max(24),
  analyticsTimeRangeMonths: z.coerce.number().int().min(1).max(36),
  analyticsForecastMonths: z.coerce.number().int().min(1).max(12),
  targetCoveragePercent: z.coerce.number().min(0).max(100),
  dashboardRefreshMinutes: z.coerce.number().int().min(1).max(60),
});

export type InsertSpareUnit = z.infer<typeof insertSpareUnitSchema>;
export type SpareUnit = typeof spareUnit.$inferSelect;

export type InsertCoveredUnit = z.infer<typeof insertCoveredUnitSchema>;
export type BulkInsertCoveredUnit = z.infer<typeof bulkInsertCoveredUnitSchema>;
export type CoveredUnit = typeof coveredUnit.$inferSelect;

export type InsertCoveragePool = z.infer<typeof insertCoveragePoolSchema>;
export type CoveragePool = typeof coveragePool.$inferSelect;

export type InsertAvailableStock = z.infer<typeof insertAvailableStockSchema>;
export type AvailableStock = typeof availableStock.$inferSelect;

export type InsertClaim = z.infer<typeof insertClaimSchema>;
export type Claim = typeof claim.$inferSelect;

export type InsertReplacement = z.infer<typeof insertReplacementSchema>;
export type Replacement = typeof replacement.$inferSelect;

export type InsertAppConfiguration = z.infer<typeof insertAppConfigurationSchema>;
export type AppConfiguration = typeof appConfiguration.$inferSelect;

// Combined types for joins
export type SpareUnitWithCoverage = SpareUnit & {
  coveredUnit?: CoveredUnit;
};

export type CoveragePoolWithStats = CoveragePool & {
  spareCount: number; // spare units available in pool
  coveredCount: number; // units in field under coverage
  coverageRatio: number; // spareCount / coveredCount
  availableStockCount?: number; // available stock matching pool criteria
  claimsLast6Months?: number; // claims in last 6 months matching pool criteria
  runRate?: number; // claims per month
};

// Monthly analytics data point
export interface MonthlyAnalytics {
  month: string; // YYYY-MM format
  monthLabel: string; // Human-readable (e.g., "Jan 2025")
  claims: number;
  replacements: number;
  netBacklog: number; // claims - replacements
  spareCount: number; // spare units available at end of month
  coveredCount: number; // covered units at end of month
  availableStockCount: number; // available stock at end of month
  coverageRatio: number; // (spareCount / coveredCount) * 100
  fulfillmentRate: number; // (replacements / claims) * 100, or 0 if no claims
  claimsGrowthMoM?: number; // Month-over-month growth percentage
  claimsGrowthYoY?: number; // Year-over-year growth percentage
}

// Forecast data point
export interface ForecastPoint {
  month: string; // YYYY-MM format
  monthLabel: string; // Human-readable (e.g., "Jan 2025")
  forecastClaims: number; // Predicted claims
  confidenceLower: number; // Lower bound of forecast range
  confidenceUpper: number; // Upper bound of forecast range
}

// Coverage pool analytics response
export interface CoveragePoolAnalytics {
  poolId: string;
  poolName: string;
  analysisStartDate: string; // ISO date
  analysisEndDate: string; // ISO date
  timeRangeMonths: number;
  
  // Current state KPIs
  currentSpareCount: number;
  currentCoveredCount: number;
  currentAvailableStockCount: number;
  currentCoverageRatio: number; // percentage
  targetCoverageRatio: number; // percentage (from configuration)
  
  // Aggregate metrics for the period
  totalClaims: number;
  totalReplacements: number;
  totalNetBacklog: number; // total claims - total replacements
  averageFulfillmentRate: number; // percentage
  averageMonthlyClaimRate: number; // average claims per month
  
  // Growth metrics
  claimsGrowthMoM: number; // Latest month vs previous month
  claimsGrowthYoY?: number; // Latest month vs same month last year (if 12+ months data)
  
  // Inventory recommendations
  unitsNeededForTarget: number; // How many more spare units needed to reach target coverage
  inventoryRunwayMonths: number; // Months of spare inventory at current claim rate
  recommendedAction: string; // Human-readable recommendation
  
  // Time series data
  monthlyData: MonthlyAnalytics[];
  
  // Forecast (next 3 months by default)
  forecast: ForecastPoint[];
}
