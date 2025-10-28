import { 
  type Inventory, 
  type InsertInventory, 
  type Warranty, 
  type InsertWarranty, 
  type PoolGroup, 
  type InsertPoolGroup,
  inventory,
  warranty,
  poolGroup
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, or, sql, desc, inArray } from "drizzle-orm";

export interface IStorage {
  // Inventory methods
  getInventory(filters?: {
    make?: string[];
    model?: string[];
    processor?: string[];
    ram?: string[];
    category?: string[];
    search?: string;
  }): Promise<Inventory[]>;
  getInventoryById(id: string): Promise<Inventory | undefined>;
  createInventory(data: InsertInventory): Promise<Inventory>;
  updateInventory(id: string, data: Partial<InsertInventory>): Promise<Inventory | undefined>;
  
  // Warranty methods
  getWarranties(filters?: {
    status?: string[];
    search?: string;
  }): Promise<Warranty[]>;
  getWarrantyById(id: string): Promise<Warranty | undefined>;
  createWarranty(data: InsertWarranty): Promise<Warranty>;
  updateWarranty(id: string, data: Partial<InsertWarranty>): Promise<Warranty | undefined>;
  
  // Pool Group methods
  getPoolGroups(): Promise<PoolGroup[]>;
  getPoolGroupById(id: string): Promise<PoolGroup | undefined>;
  createPoolGroup(data: InsertPoolGroup): Promise<PoolGroup>;
  updatePoolGroup(id: string, data: Partial<InsertPoolGroup>): Promise<PoolGroup | undefined>;
  deletePoolGroup(id: string): Promise<boolean>;
  
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
    totalInventory: number;
    activeWarranties: number;
    expiringWarranties: number;
    averageCoverage: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getInventory(filters?: {
    make?: string[];
    model?: string[];
    processor?: string[];
    ram?: string[];
    category?: string[];
    search?: string;
  }): Promise<Inventory[]> {
    let query = db.select().from(inventory);
    
    const conditions = [];
    
    if (filters?.make && filters.make.length > 0) {
      conditions.push(inArray(inventory.make, filters.make));
    }
    
    if (filters?.model && filters.model.length > 0) {
      conditions.push(inArray(inventory.model, filters.model));
    }
    
    if (filters?.processor && filters.processor.length > 0) {
      conditions.push(inArray(inventory.processor, filters.processor));
    }
    
    if (filters?.ram && filters.ram.length > 0) {
      conditions.push(inArray(inventory.ram, filters.ram));
    }
    
    if (filters?.category && filters.category.length > 0) {
      conditions.push(inArray(inventory.category, filters.category));
    }
    
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(inventory.serialNumber, searchTerm),
          like(inventory.make, searchTerm),
          like(inventory.model, searchTerm),
          like(inventory.productDescription, searchTerm)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return query.orderBy(desc(inventory.createdOn));
  }

  async getInventoryById(id: string): Promise<Inventory | undefined> {
    const [item] = await db.select().from(inventory).where(eq(inventory.id, id));
    return item || undefined;
  }

  async createInventory(data: InsertInventory): Promise<Inventory> {
    const [item] = await db.insert(inventory).values(data).returning();
    return item;
  }

  async updateInventory(id: string, data: Partial<InsertInventory>): Promise<Inventory | undefined> {
    const [item] = await db
      .update(inventory)
      .set({ ...data, modifiedOn: new Date() })
      .where(eq(inventory.id, id))
      .returning();
    return item || undefined;
  }

  async getWarranties(filters?: {
    status?: string[];
    search?: string;
  }): Promise<Warranty[]> {
    let query = db.select().from(warranty);
    
    const conditions = [];
    
    if (filters?.status && filters.status.length > 0) {
      if (filters.status.includes("Active")) {
        conditions.push(eq(warranty.isActive, true));
      } else if (filters.status.includes("Inactive")) {
        conditions.push(eq(warranty.isActive, false));
      }
    }
    
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(warranty.serialNumber, searchTerm),
          like(warranty.warrantyDescription, searchTerm)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return query.orderBy(desc(warranty.createdOn));
  }

  async getWarrantyById(id: string): Promise<Warranty | undefined> {
    const [item] = await db.select().from(warranty).where(eq(warranty.id, id));
    return item || undefined;
  }

  async createWarranty(data: InsertWarranty): Promise<Warranty> {
    const [item] = await db.insert(warranty).values(data).returning();
    return item;
  }

  async updateWarranty(id: string, data: Partial<InsertWarranty>): Promise<Warranty | undefined> {
    const [item] = await db
      .update(warranty)
      .set({ ...data, modifiedOn: new Date() })
      .where(eq(warranty.id, id))
      .returning();
    return item || undefined;
  }

  async getPoolGroups(): Promise<PoolGroup[]> {
    return db.select().from(poolGroup).orderBy(desc(poolGroup.createdOn));
  }

  async getPoolGroupById(id: string): Promise<PoolGroup | undefined> {
    const [item] = await db.select().from(poolGroup).where(eq(poolGroup.id, id));
    return item || undefined;
  }

  async createPoolGroup(data: InsertPoolGroup): Promise<PoolGroup> {
    const [item] = await db.insert(poolGroup).values(data).returning();
    return item;
  }

  async updatePoolGroup(id: string, data: Partial<InsertPoolGroup>): Promise<PoolGroup | undefined> {
    const [item] = await db
      .update(poolGroup)
      .set({ ...data, modifiedOn: new Date() })
      .where(eq(poolGroup.id, id))
      .returning();
    return item || undefined;
  }

  async deletePoolGroup(id: string): Promise<boolean> {
    const result = await db.delete(poolGroup).where(eq(poolGroup.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getFilterOptions(): Promise<{
    makes: string[];
    models: string[];
    processors: string[];
    rams: string[];
    categories: string[];
  }> {
    const items = await db.select({
      make: inventory.make,
      model: inventory.model,
      processor: inventory.processor,
      ram: inventory.ram,
      category: inventory.category,
    }).from(inventory);
    
    const makes = Array.from(new Set(items.map(i => i.make).filter(Boolean) as string[])).sort();
    const models = Array.from(new Set(items.map(i => i.model).filter(Boolean) as string[])).sort();
    const processors = Array.from(new Set(items.map(i => i.processor).filter(Boolean) as string[])).sort();
    const rams = Array.from(new Set(items.map(i => i.ram).filter(Boolean) as string[])).sort();
    const categories = Array.from(new Set(items.map(i => i.category).filter(Boolean) as string[])).sort();
    
    return { makes, models, processors, rams, categories };
  }

  async getAnalytics(): Promise<{
    totalInventory: number;
    activeWarranties: number;
    expiringWarranties: number;
    averageCoverage: number;
  }> {
    const [inventoryCount] = await db.select({ count: sql<number>`count(*)` }).from(inventory);
    const [activeWarrantyCount] = await db.select({ count: sql<number>`count(*)` }).from(warranty).where(eq(warranty.isActive, true));
    
    // Count warranties expiring in next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const [expiringCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(warranty)
      .where(
        and(
          eq(warranty.isActive, true),
          sql`${warranty.warrantyEndDate} <= ${thirtyDaysFromNow}`
        )
      );
    
    return {
      totalInventory: Number(inventoryCount?.count || 0),
      activeWarranties: Number(activeWarrantyCount?.count || 0),
      expiringWarranties: Number(expiringCount?.count || 0),
      averageCoverage: 0, // Will calculate based on pool groups
    };
  }
}

export const storage = new DatabaseStorage();
