import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const inventory = pgTable("inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serialNumber: varchar("serial_number", { length: 100 }).notNull(),
  areaId: varchar("area_id", { length: 50 }).notNull(),
  itemId: varchar("item_id", { length: 50 }).notNull(),
  make: varchar("make", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  processor: varchar("processor", { length: 100 }),
  generation: varchar("generation", { length: 50 }),
  ram: varchar("ram", { length: 50 }),
  hdd: varchar("hdd", { length: 50 }),
  displaySize: varchar("display_size", { length: 50 }),
  touchscreen: boolean("touchscreen").default(false),
  category: varchar("category", { length: 50 }),
  allocatedOrder: varchar("allocated_order", { length: 100 }),
  soldOrder: varchar("sold_order", { length: 100 }),
  customer: varchar("customer", { length: 200 }),
  soldDate: timestamp("sold_date"),
  productDescription: text("product_description"),
  productNumber: varchar("product_number", { length: 100 }),
  createdOn: timestamp("created_on").notNull().defaultNow(),
  modifiedOn: timestamp("modified_on").notNull().defaultNow(),
});

export const warranty = pgTable("warranty", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serialNumber: varchar("serial_number", { length: 100 }).notNull(),
  areaId: varchar("area_id", { length: 50 }).notNull(),
  itemId: varchar("item_id", { length: 50 }).notNull(),
  warrantyStartDate: timestamp("warranty_start_date").notNull(),
  warrantyEndDate: timestamp("warranty_end_date").notNull(),
  warrantyDescription: text("warranty_description"),
  durationInDays: integer("duration_in_days").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdOn: timestamp("created_on").notNull().defaultNow(),
  modifiedOn: timestamp("modified_on").notNull().defaultNow(),
});

export const poolGroup = pgTable("pool_group", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  filterCriteria: text("filter_criteria").notNull(), // JSON string of filter criteria
  createdOn: timestamp("created_on").notNull().defaultNow(),
  modifiedOn: timestamp("modified_on").notNull().defaultNow(),
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  createdOn: true,
  modifiedOn: true,
});

export const insertWarrantySchema = createInsertSchema(warranty).omit({
  id: true,
  createdOn: true,
  modifiedOn: true,
});

export const insertPoolGroupSchema = createInsertSchema(poolGroup).omit({
  id: true,
  createdOn: true,
  modifiedOn: true,
});

export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = typeof inventory.$inferSelect;

export type InsertWarranty = z.infer<typeof insertWarrantySchema>;
export type Warranty = typeof warranty.$inferSelect;

export type InsertPoolGroup = z.infer<typeof insertPoolGroupSchema>;
export type PoolGroup = typeof poolGroup.$inferSelect;

// Combined types for joins
export type InventoryWithWarranty = Inventory & {
  warranty?: Warranty;
};

export type PoolGroupWithStats = PoolGroup & {
  inventoryCount: number;
  poolCount: number;
  coveragePercentage: number;
};
