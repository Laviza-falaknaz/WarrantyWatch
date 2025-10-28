import { type Inventory, type InsertInventory, type Warranty, type InsertWarranty, type PoolGroup, type InsertPoolGroup } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // Inventory methods
  getInventory(): Promise<Inventory[]>;
  getInventoryById(id: string): Promise<Inventory | undefined>;
  
  // Warranty methods
  getWarranties(): Promise<Warranty[]>;
  getWarrantyById(id: string): Promise<Warranty | undefined>;
  
  // Pool Group methods
  getPoolGroups(): Promise<PoolGroup[]>;
  getPoolGroupById(id: string): Promise<PoolGroup | undefined>;
}

export class MemStorage implements IStorage {
  private inventory: Map<string, Inventory>;
  private warranties: Map<string, Warranty>;
  private poolGroups: Map<string, PoolGroup>;

  constructor() {
    this.inventory = new Map();
    this.warranties = new Map();
    this.poolGroups = new Map();
  }

  async getInventory(): Promise<Inventory[]> {
    return Array.from(this.inventory.values());
  }

  async getInventoryById(id: string): Promise<Inventory | undefined> {
    return this.inventory.get(id);
  }

  async getWarranties(): Promise<Warranty[]> {
    return Array.from(this.warranties.values());
  }

  async getWarrantyById(id: string): Promise<Warranty | undefined> {
    return this.warranties.get(id);
  }

  async getPoolGroups(): Promise<PoolGroup[]> {
    return Array.from(this.poolGroups.values());
  }

  async getPoolGroupById(id: string): Promise<PoolGroup | undefined> {
    return this.poolGroups.get(id);
  }
}

export const storage = new MemStorage();
