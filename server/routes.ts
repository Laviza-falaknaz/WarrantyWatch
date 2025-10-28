import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSpareUnitSchema, insertCoveredUnitSchema, insertCoveragePoolSchema, spareUnit, coveredUnit } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { eq, and, inArray } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Spare Unit routes (units in pool available to cover warranties)
  app.get("/api/spare-units", async (req, res) => {
    try {
      const filters = {
        make: req.query.make ? (Array.isArray(req.query.make) ? req.query.make as string[] : [req.query.make as string]) : undefined,
        model: req.query.model ? (Array.isArray(req.query.model) ? req.query.model as string[] : [req.query.model as string]) : undefined,
        processor: req.query.processor ? (Array.isArray(req.query.processor) ? req.query.processor as string[] : [req.query.processor as string]) : undefined,
        ram: req.query.ram ? (Array.isArray(req.query.ram) ? req.query.ram as string[] : [req.query.ram as string]) : undefined,
        category: req.query.category ? (Array.isArray(req.query.category) ? req.query.category as string[] : [req.query.category as string]) : undefined,
        search: req.query.search as string | undefined,
      };
      
      const units = await storage.getSpareUnits(filters);
      res.json(units);
    } catch (error) {
      console.error("Error fetching spare units:", error);
      res.status(500).json({ error: "Failed to fetch spare units" });
    }
  });

  app.get("/api/spare-units/:id", async (req, res) => {
    try {
      const item = await storage.getSpareUnitById(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Spare unit not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error fetching spare unit:", error);
      res.status(500).json({ error: "Failed to fetch spare unit" });
    }
  });

  app.post("/api/spare-units", async (req, res) => {
    try {
      const data = insertSpareUnitSchema.parse(req.body);
      const item = await storage.createSpareUnit(data);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating spare unit:", error);
      res.status(500).json({ error: "Failed to create spare unit" });
    }
  });

  app.patch("/api/spare-units/:id", async (req, res) => {
    try {
      const item = await storage.updateSpareUnit(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ error: "Spare unit not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error updating spare unit:", error);
      res.status(500).json({ error: "Failed to update spare unit" });
    }
  });

  // Covered Unit routes (units in field under warranty coverage)
  app.get("/api/covered-units", async (req, res) => {
    try {
      const filters = {
        make: req.query.make ? (Array.isArray(req.query.make) ? req.query.make as string[] : [req.query.make as string]) : undefined,
        model: req.query.model ? (Array.isArray(req.query.model) ? req.query.model as string[] : [req.query.model as string]) : undefined,
        processor: req.query.processor ? (Array.isArray(req.query.processor) ? req.query.processor as string[] : [req.query.processor as string]) : undefined,
        ram: req.query.ram ? (Array.isArray(req.query.ram) ? req.query.ram as string[] : [req.query.ram as string]) : undefined,
        category: req.query.category ? (Array.isArray(req.query.category) ? req.query.category as string[] : [req.query.category as string]) : undefined,
        status: req.query.status ? (Array.isArray(req.query.status) ? req.query.status as string[] : [req.query.status as string]) : undefined,
        search: req.query.search as string | undefined,
      };
      
      const units = await storage.getCoveredUnits(filters);
      res.json(units);
    } catch (error) {
      console.error("Error fetching covered units:", error);
      res.status(500).json({ error: "Failed to fetch covered units" });
    }
  });

  app.get("/api/covered-units/:id", async (req, res) => {
    try {
      const item = await storage.getCoveredUnitById(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Covered unit not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error fetching covered unit:", error);
      res.status(500).json({ error: "Failed to fetch covered unit" });
    }
  });

  app.post("/api/covered-units", async (req, res) => {
    try {
      const data = insertCoveredUnitSchema.parse(req.body);
      const item = await storage.createCoveredUnit(data);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating covered unit:", error);
      res.status(500).json({ error: "Failed to create covered unit" });
    }
  });

  app.patch("/api/covered-units/:id", async (req, res) => {
    try {
      const item = await storage.updateCoveredUnit(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ error: "Covered unit not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error updating covered unit:", error);
      res.status(500).json({ error: "Failed to update covered unit" });
    }
  });

  // Coverage Pool routes
  app.get("/api/coverage-pools", async (req, res) => {
    try {
      const pools = await storage.getCoveragePools();
      res.json(pools);
    } catch (error) {
      console.error("Error fetching coverage pools:", error);
      res.status(500).json({ error: "Failed to fetch coverage pools" });
    }
  });

  app.get("/api/coverage-pools/:id", async (req, res) => {
    try {
      const item = await storage.getCoveragePoolById(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Coverage pool not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error fetching coverage pool:", error);
      res.status(500).json({ error: "Failed to fetch coverage pool" });
    }
  });

  app.post("/api/coverage-pools", async (req, res) => {
    try {
      const data = insertCoveragePoolSchema.parse(req.body);
      const item = await storage.createCoveragePool(data);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating coverage pool:", error);
      res.status(500).json({ error: "Failed to create coverage pool" });
    }
  });

  app.patch("/api/coverage-pools/:id", async (req, res) => {
    try {
      const item = await storage.updateCoveragePool(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ error: "Coverage pool not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error updating coverage pool:", error);
      res.status(500).json({ error: "Failed to update coverage pool" });
    }
  });

  app.delete("/api/coverage-pools/:id", async (req, res) => {
    try {
      const success = await storage.deleteCoveragePool(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Coverage pool not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting coverage pool:", error);
      res.status(500).json({ error: "Failed to delete coverage pool" });
    }
  });

  // Filter options endpoint
  app.get("/api/filters", async (req, res) => {
    try {
      const options = await storage.getFilterOptions();
      res.json(options);
    } catch (error) {
      console.error("Error fetching filter options:", error);
      res.status(500).json({ error: "Failed to fetch filter options" });
    }
  });

  // Analytics endpoint
  app.get("/api/analytics", async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Combined endpoint for coverage pools with statistics
  app.get("/api/coverage-pools-with-stats", async (req, res) => {
    try {
      const pools = await storage.getCoveragePools();
      
      const poolsWithStats = await Promise.all(pools.map(async (pool) => {
        const filterCriteria = JSON.parse(pool.filterCriteria);
        
        // Build conditions for filtering
        const spareConditions = [];
        const coveredConditions = [];
        
        if (filterCriteria.make) {
          spareConditions.push(eq(spareUnit.make, filterCriteria.make));
          coveredConditions.push(eq(coveredUnit.make, filterCriteria.make));
        }
        if (filterCriteria.model) {
          spareConditions.push(eq(spareUnit.model, filterCriteria.model));
          coveredConditions.push(eq(coveredUnit.model, filterCriteria.model));
        }
        if (filterCriteria.processor) {
          spareConditions.push(eq(spareUnit.processor, filterCriteria.processor));
          coveredConditions.push(eq(coveredUnit.processor, filterCriteria.processor));
        }
        if (filterCriteria.ram) {
          spareConditions.push(eq(spareUnit.ram, filterCriteria.ram));
          coveredConditions.push(eq(coveredUnit.ram, filterCriteria.ram));
        }
        
        // Count spare units matching filter
        let spareQuery = db.select().from(spareUnit);
        if (spareConditions.length > 0) {
          spareQuery = spareQuery.where(and(...spareConditions)) as any;
        }
        const spareItems = await spareQuery;
        
        // Count covered units matching filter
        let coveredQuery = db.select().from(coveredUnit);
        if (coveredConditions.length > 0) {
          coveredQuery = coveredQuery.where(and(...coveredConditions)) as any;
        }
        const coveredItems = await coveredQuery;
        
        const spareCount = spareItems.length;
        const coveredCount = coveredItems.length;
        const coverageRatio = coveredCount > 0 ? (spareCount / coveredCount) * 100 : 0;
        
        return {
          ...pool,
          spareCount,
          coveredCount,
          coverageRatio,
        };
      }));
      
      res.json(poolsWithStats);
    } catch (error) {
      console.error("Error fetching coverage pools with stats:", error);
      res.status(500).json({ error: "Failed to fetch coverage pools with stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
