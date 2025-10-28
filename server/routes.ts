import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInventorySchema, insertWarrantySchema, insertPoolGroupSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Inventory routes
  app.get("/api/inventory", async (req, res) => {
    try {
      const filters = {
        make: req.query.make ? (Array.isArray(req.query.make) ? req.query.make as string[] : [req.query.make as string]) : undefined,
        model: req.query.model ? (Array.isArray(req.query.model) ? req.query.model as string[] : [req.query.model as string]) : undefined,
        processor: req.query.processor ? (Array.isArray(req.query.processor) ? req.query.processor as string[] : [req.query.processor as string]) : undefined,
        ram: req.query.ram ? (Array.isArray(req.query.ram) ? req.query.ram as string[] : [req.query.ram as string]) : undefined,
        category: req.query.category ? (Array.isArray(req.query.category) ? req.query.category as string[] : [req.query.category as string]) : undefined,
        search: req.query.search as string | undefined,
      };
      
      const inventory = await storage.getInventory(filters);
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  app.get("/api/inventory/:id", async (req, res) => {
    try {
      const item = await storage.getInventoryById(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Inventory item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error fetching inventory item:", error);
      res.status(500).json({ error: "Failed to fetch inventory item" });
    }
  });

  app.post("/api/inventory", async (req, res) => {
    try {
      const data = insertInventorySchema.parse(req.body);
      const item = await storage.createInventory(data);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating inventory:", error);
      res.status(500).json({ error: "Failed to create inventory" });
    }
  });

  app.patch("/api/inventory/:id", async (req, res) => {
    try {
      const item = await storage.updateInventory(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ error: "Inventory item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error updating inventory:", error);
      res.status(500).json({ error: "Failed to update inventory" });
    }
  });

  // Warranty routes
  app.get("/api/warranties", async (req, res) => {
    try {
      const filters = {
        status: req.query.status ? (Array.isArray(req.query.status) ? req.query.status as string[] : [req.query.status as string]) : undefined,
        search: req.query.search as string | undefined,
      };
      
      const warranties = await storage.getWarranties(filters);
      res.json(warranties);
    } catch (error) {
      console.error("Error fetching warranties:", error);
      res.status(500).json({ error: "Failed to fetch warranties" });
    }
  });

  app.get("/api/warranties/:id", async (req, res) => {
    try {
      const item = await storage.getWarrantyById(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Warranty not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error fetching warranty:", error);
      res.status(500).json({ error: "Failed to fetch warranty" });
    }
  });

  app.post("/api/warranties", async (req, res) => {
    try {
      const data = insertWarrantySchema.parse(req.body);
      const item = await storage.createWarranty(data);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating warranty:", error);
      res.status(500).json({ error: "Failed to create warranty" });
    }
  });

  app.patch("/api/warranties/:id", async (req, res) => {
    try {
      const item = await storage.updateWarranty(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ error: "Warranty not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error updating warranty:", error);
      res.status(500).json({ error: "Failed to update warranty" });
    }
  });

  // Pool Group routes
  app.get("/api/pool-groups", async (req, res) => {
    try {
      const poolGroups = await storage.getPoolGroups();
      res.json(poolGroups);
    } catch (error) {
      console.error("Error fetching pool groups:", error);
      res.status(500).json({ error: "Failed to fetch pool groups" });
    }
  });

  app.get("/api/pool-groups/:id", async (req, res) => {
    try {
      const item = await storage.getPoolGroupById(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Pool group not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error fetching pool group:", error);
      res.status(500).json({ error: "Failed to fetch pool group" });
    }
  });

  app.post("/api/pool-groups", async (req, res) => {
    try {
      const data = insertPoolGroupSchema.parse(req.body);
      const item = await storage.createPoolGroup(data);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating pool group:", error);
      res.status(500).json({ error: "Failed to create pool group" });
    }
  });

  app.patch("/api/pool-groups/:id", async (req, res) => {
    try {
      const item = await storage.updatePoolGroup(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ error: "Pool group not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error updating pool group:", error);
      res.status(500).json({ error: "Failed to update pool group" });
    }
  });

  app.delete("/api/pool-groups/:id", async (req, res) => {
    try {
      const success = await storage.deletePoolGroup(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Pool group not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting pool group:", error);
      res.status(500).json({ error: "Failed to delete pool group" });
    }
  });

  // Filter options route
  app.get("/api/filters", async (req, res) => {
    try {
      const options = await storage.getFilterOptions();
      res.json(options);
    } catch (error) {
      console.error("Error fetching filter options:", error);
      res.status(500).json({ error: "Failed to fetch filter options" });
    }
  });

  // Analytics route
  app.get("/api/analytics", async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Combined inventory with warranty info
  app.get("/api/inventory-with-warranty", async (req, res) => {
    try {
      const filters = {
        make: req.query.make ? (Array.isArray(req.query.make) ? req.query.make as string[] : [req.query.make as string]) : undefined,
        model: req.query.model ? (Array.isArray(req.query.model) ? req.query.model as string[] : [req.query.model as string]) : undefined,
        processor: req.query.processor ? (Array.isArray(req.query.processor) ? req.query.processor as string[] : [req.query.processor as string]) : undefined,
        ram: req.query.ram ? (Array.isArray(req.query.ram) ? req.query.ram as string[] : [req.query.ram as string]) : undefined,
        category: req.query.category ? (Array.isArray(req.query.category) ? req.query.category as string[] : [req.query.category as string]) : undefined,
        search: req.query.search as string | undefined,
      };
      
      const inventory = await storage.getInventory(filters);
      const warranties = await storage.getWarranties();
      
      // Create a map of warranties by serial number, area id, and item id
      const warrantyMap = new Map();
      warranties.forEach(w => {
        const key = `${w.serialNumber}-${w.areaId}-${w.itemId}`;
        warrantyMap.set(key, w);
      });
      
      // Combine inventory with warranty data
      const inventoryWithWarranty = inventory.map(item => {
        const key = `${item.serialNumber}-${item.areaId}-${item.itemId}`;
        return {
          ...item,
          warranty: warrantyMap.get(key) || null,
        };
      });
      
      res.json(inventoryWithWarranty);
    } catch (error) {
      console.error("Error fetching inventory with warranty:", error);
      res.status(500).json({ error: "Failed to fetch inventory with warranty" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
