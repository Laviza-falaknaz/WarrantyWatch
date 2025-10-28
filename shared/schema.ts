import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, decimal } from "drizzle-orm/pg-core";
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
});

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
});

// Coverage pool groups showing spare/covered ratios by specifications
export const coveragePool = pgTable("coverage_pool", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  filterCriteria: text("filter_criteria").notNull(), // JSON string of filter criteria (applies to both spare and covered units)
  createdOn: timestamp("created_on").notNull().defaultNow(),
  modifiedOn: timestamp("modified_on").notNull().defaultNow(),
});

export const insertSpareUnitSchema = createInsertSchema(spareUnit).omit({
  id: true,
  createdOn: true,
  modifiedOn: true,
});

export const insertCoveredUnitSchema = createInsertSchema(coveredUnit).omit({
  id: true,
  createdOn: true,
  modifiedOn: true,
});

export const insertCoveragePoolSchema = createInsertSchema(coveragePool).omit({
  id: true,
  createdOn: true,
  modifiedOn: true,
});

export type InsertSpareUnit = z.infer<typeof insertSpareUnitSchema>;
export type SpareUnit = typeof spareUnit.$inferSelect;

export type InsertCoveredUnit = z.infer<typeof insertCoveredUnitSchema>;
export type CoveredUnit = typeof coveredUnit.$inferSelect;

export type InsertCoveragePool = z.infer<typeof insertCoveragePoolSchema>;
export type CoveragePool = typeof coveragePool.$inferSelect;

// Combined types for joins
export type SpareUnitWithCoverage = SpareUnit & {
  coveredUnit?: CoveredUnit;
};

export type CoveragePoolWithStats = CoveragePool & {
  spareCount: number; // spare units available in pool
  coveredCount: number; // units in field under coverage
  coverageRatio: number; // spareCount / coveredCount
};
