import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertSpareUnitSchema, 
  insertCoveredUnitSchema, 
  bulkInsertCoveredUnitSchema, 
  insertCoveragePoolSchema,
  insertAvailableStockSchema,
  insertClaimSchema,
  insertReplacementSchema,
  spareUnit, 
  coveredUnit,
  availableStock,
  claim,
  replacement
} from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { eq, and, inArray, sql as drizzleSql } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Spare Unit routes (units in pool available to cover warranties)
  
  // Stats endpoint (must come before :id route to avoid matching "stats" as an id)
  app.get("/api/spare-units/stats", async (req, res) => {
    try {
      const filters = {
        make: req.query.make ? (Array.isArray(req.query.make) ? req.query.make as string[] : [req.query.make as string]) : undefined,
        model: req.query.model ? (Array.isArray(req.query.model) ? req.query.model as string[] : [req.query.model as string]) : undefined,
        processor: req.query.processor ? (Array.isArray(req.query.processor) ? req.query.processor as string[] : [req.query.processor as string]) : undefined,
        ram: req.query.ram ? (Array.isArray(req.query.ram) ? req.query.ram as string[] : [req.query.ram as string]) : undefined,
        category: req.query.category ? (Array.isArray(req.query.category) ? req.query.category as string[] : [req.query.category as string]) : undefined,
        search: req.query.search as string | undefined,
      };
      
      const stats = await storage.getSpareUnitsStats(filters);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching spare units stats:", error);
      res.status(500).json({ error: "Failed to fetch spare units stats" });
    }
  });
  
  app.get("/api/spare-units", async (req, res) => {
    try {
      // Validate and clamp limit parameter to prevent memory exhaustion
      let limit: number | undefined = undefined;
      if (req.query.limit) {
        const parsedLimit = parseInt(req.query.limit as string, 10);
        if (isNaN(parsedLimit) || parsedLimit < 1) {
          return res.status(400).json({ error: "Invalid limit parameter: must be a positive integer" });
        }
        // Enforce maximum limit of 10,000 to prevent crashes with large datasets
        limit = Math.min(parsedLimit, 10000);
      }
      
      // Validate offset parameter
      let offset: number | undefined = undefined;
      if (req.query.offset) {
        const parsedOffset = parseInt(req.query.offset as string, 10);
        if (isNaN(parsedOffset) || parsedOffset < 0) {
          return res.status(400).json({ error: "Invalid offset parameter: must be a non-negative integer" });
        }
        offset = parsedOffset;
      }
      
      const filters = {
        make: req.query.make ? (Array.isArray(req.query.make) ? req.query.make as string[] : [req.query.make as string]) : undefined,
        model: req.query.model ? (Array.isArray(req.query.model) ? req.query.model as string[] : [req.query.model as string]) : undefined,
        processor: req.query.processor ? (Array.isArray(req.query.processor) ? req.query.processor as string[] : [req.query.processor as string]) : undefined,
        ram: req.query.ram ? (Array.isArray(req.query.ram) ? req.query.ram as string[] : [req.query.ram as string]) : undefined,
        category: req.query.category ? (Array.isArray(req.query.category) ? req.query.category as string[] : [req.query.category as string]) : undefined,
        search: req.query.search as string | undefined,
        limit,
        offset,
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

  // Bulk upsert spare units (insert or update based on composite key)
  app.post("/api/spare-units/bulk", async (req, res) => {
    try {
      // Validate that body is an array
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ error: "Request body must be an array of spare units" });
      }

      // Validate each item in the array
      const validatedData = z.array(insertSpareUnitSchema).parse(req.body);
      
      const count = await storage.bulkReplaceSpareUnits(validatedData);
      
      res.status(200).json({ 
        message: `Successfully processed ${count} spare units`, 
        count,
        processed: count 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data format", details: error.errors });
      }
      console.error("Error bulk upserting spare units:", error);
      res.status(500).json({ error: "Failed to bulk upsert spare units" });
    }
  });

  // Covered Unit routes (units in field under warranty coverage)
  
  // Stats endpoint (must come before :id route to avoid matching "stats" as an id)
  app.get("/api/covered-units/stats", async (req, res) => {
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
      
      const stats = await storage.getCoveredUnitsStats(filters);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching covered units stats:", error);
      res.status(500).json({ error: "Failed to fetch covered units stats" });
    }
  });
  
  app.get("/api/covered-units", async (req, res) => {
    try {
      // Validate and clamp limit parameter to prevent memory exhaustion
      let limit: number | undefined = undefined;
      if (req.query.limit) {
        const parsedLimit = parseInt(req.query.limit as string, 10);
        if (isNaN(parsedLimit) || parsedLimit < 1) {
          return res.status(400).json({ error: "Invalid limit parameter: must be a positive integer" });
        }
        // Enforce maximum limit of 10,000 to prevent crashes with large datasets
        limit = Math.min(parsedLimit, 10000);
      }
      
      // Validate offset parameter
      let offset: number | undefined = undefined;
      if (req.query.offset) {
        const parsedOffset = parseInt(req.query.offset as string, 10);
        if (isNaN(parsedOffset) || parsedOffset < 0) {
          return res.status(400).json({ error: "Invalid offset parameter: must be a non-negative integer" });
        }
        offset = parsedOffset;
      }
      
      const filters = {
        make: req.query.make ? (Array.isArray(req.query.make) ? req.query.make as string[] : [req.query.make as string]) : undefined,
        model: req.query.model ? (Array.isArray(req.query.model) ? req.query.model as string[] : [req.query.model as string]) : undefined,
        processor: req.query.processor ? (Array.isArray(req.query.processor) ? req.query.processor as string[] : [req.query.processor as string]) : undefined,
        ram: req.query.ram ? (Array.isArray(req.query.ram) ? req.query.ram as string[] : [req.query.ram as string]) : undefined,
        category: req.query.category ? (Array.isArray(req.query.category) ? req.query.category as string[] : [req.query.category as string]) : undefined,
        status: req.query.status ? (Array.isArray(req.query.status) ? req.query.status as string[] : [req.query.status as string]) : undefined,
        search: req.query.search as string | undefined,
        limit,
        offset,
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

  // Bulk upsert covered units (insert or update based on composite key)
  app.post("/api/covered-units/bulk", async (req, res) => {
    try {
      console.log(`[bulk-upload] Starting covered units bulk upload. Received ${req.body?.length || 0} records`);
      const startTime = Date.now();
      
      // Validate that body is an array
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ error: "Request body must be an array of covered units" });
      }

      // Use optimized schema for bulk operations (skips expensive refine validation)
      console.log(`[bulk-upload] Validating ${req.body.length} covered units...`);
      const validationStart = Date.now();
      const validatedData = z.array(bulkInsertCoveredUnitSchema).parse(req.body);
      console.log(`[bulk-upload] Validation completed in ${Date.now() - validationStart}ms`);
      
      console.log(`[bulk-upload] Processing ${validatedData.length} covered units...`);
      const processingStart = Date.now();
      const count = await storage.bulkReplaceCoveredUnits(validatedData);
      console.log(`[bulk-upload] Processing completed in ${Date.now() - processingStart}ms`);
      
      const totalTime = Date.now() - startTime;
      console.log(`[bulk-upload] Covered units bulk upload completed. Total time: ${totalTime}ms, Records: ${count}`);
      
      res.status(200).json({ 
        message: "Covered units upserted successfully", 
        count,
        processed: count,
        timeMs: totalTime 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data format", details: error.errors });
      }
      
      // Return validation errors from storage layer with 400 status
      if (error instanceof Error && error.message.includes("Invalid date")) {
        console.error("Validation error in covered units bulk upload:", error.message);
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.message 
        });
      }
      
      console.error("Error bulk upserting covered units:", error);
      res.status(500).json({ error: "Failed to bulk upsert covered units" });
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

  // Coverage pool analytics endpoint
  app.get("/api/coverage-pools/:id/analytics", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validate and parse query parameters
      let timeRangeMonths: number | undefined;
      let forecastMonths: number | undefined;
      
      if (req.query.timeRangeMonths) {
        const parsed = parseInt(req.query.timeRangeMonths as string);
        if (isNaN(parsed) || parsed < 1 || parsed > 36) {
          return res.status(400).json({ error: "timeRangeMonths must be a number between 1 and 36" });
        }
        timeRangeMonths = parsed;
      }
      
      if (req.query.forecastMonths) {
        const parsed = parseInt(req.query.forecastMonths as string);
        if (isNaN(parsed) || parsed < 1 || parsed > 12) {
          return res.status(400).json({ error: "forecastMonths must be a number between 1 and 12" });
        }
        forecastMonths = parsed;
      }
      
      const analytics = await storage.getCoveragePoolAnalytics(id, {
        timeRangeMonths,
        forecastMonths,
      });
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching pool analytics:", error);
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to fetch pool analytics" });
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

  // Risk combinations analysis endpoint
  app.get("/api/risk-combinations", async (req, res) => {
    try {
      const sortBy = (req.query.sortBy as string) || 'riskScore';
      const sortOrder = (req.query.sortOrder as string) || 'desc';
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const search = (req.query.search as string) || '';
      
      const combinations = await storage.getRiskCombinations({
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
        limit,
        offset,
        search,
      });
      
      res.json(combinations);
    } catch (error) {
      console.error("Error fetching risk combinations:", error);
      res.status(500).json({ error: "Failed to fetch risk combinations" });
    }
  });

  // Send alert for high-risk combination(s) to Power Automate webhook
  app.post("/api/risk-combinations/send-alert", async (req, res) => {
    try {
      const config = await storage.getConfiguration();
      
      if (!config.alertWebhookUrl) {
        return res.status(400).json({ error: "Alert webhook URL not configured" });
      }

      // Always expect an array in req.body.combinations
      const combinations = req.body.combinations;
      
      if (!Array.isArray(combinations) || combinations.length === 0) {
        return res.status(400).json({ error: "Invalid request: combinations array required" });
      }

      // Transform to webhook format - always send as array
      const alertData = {
        combinations: combinations.map(combo => ({
          make: combo.make,
          model: combo.model,
          processor: combo.processor,
          generation: combo.generation,
          coveredCount: combo.covered_count,
          spareCount: combo.spare_count,
          availableStockCount: combo.available_stock_count,
          claimsLast6Months: combo.claims_last_6_months,
          replacementsLast6Months: combo.replacements_last_6_months,
          coverageRatio: combo.coverage_ratio,
          runRate: combo.run_rate,
          fulfillmentRate: combo.fulfillment_rate,
          coverageOfRunRate: combo.coverage_of_run_rate,
          riskLevel: combo.risk_level,
          riskScore: combo.risk_score,
        })),
        count: combinations.length,
        timestamp: new Date().toISOString(),
      };

      // Send to Power Automate webhook
      const response = await fetch(config.alertWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData),
      });

      if (!response.ok) {
        throw new Error(`Webhook responded with status ${response.status}`);
      }

      res.json({ success: true, message: `Alert sent successfully for ${combinations.length} item(s)` });
    } catch (error) {
      console.error("Error sending alert:", error);
      res.status(500).json({ error: "Failed to send alert to webhook" });
    }
  });

  // Combined endpoint for coverage pools with statistics
  app.get("/api/coverage-pools-with-stats", async (req, res) => {
    try {
      const pools = await storage.getCoveragePools();
      const config = await storage.getConfiguration();
      
      // Calculate date range for run rate (claims from last N months)
      const runRatePeriodMonths = config.runRatePeriodMonths || 6;
      const runRateStartDate = new Date();
      runRateStartDate.setMonth(runRateStartDate.getMonth() - runRatePeriodMonths);
      
      const poolsWithStats = await Promise.all(pools.map(async (pool) => {
        const filterCriteria = JSON.parse(pool.filterCriteria);
        
        // Build conditions for filtering
        const spareConditions: any[] = [];
        const coveredConditions: any[] = [];
        const availableStockConditions: any[] = [];
        const claimConditions: any[] = [];
        
        // Helper to add filter conditions - converts single values to arrays for consistency
        const addFilterCondition = (
          value: string | string[] | undefined,
          spareField: any,
          coveredField: any,
          availableField: any,
          claimField: any
        ) => {
          if (value) {
            // Convert single value to array for backward compatibility
            const values = Array.isArray(value) ? value : [value];
            if (values.length > 0) {
              if (spareField) {
                spareConditions.push(inArray(spareField, values));
              }
              if (coveredField) {
                coveredConditions.push(inArray(coveredField, values));
              }
              if (availableField) {
                availableStockConditions.push(inArray(availableField, values));
              }
              if (claimField) {
                claimConditions.push(inArray(claimField, values));
              }
            }
          }
        };
        
        // Apply filters for common fields
        addFilterCondition(filterCriteria.make, spareUnit.make, coveredUnit.make, availableStock.make, claim.make);
        addFilterCondition(filterCriteria.model, spareUnit.model, coveredUnit.model, availableStock.model, claim.model);
        addFilterCondition(filterCriteria.processor, spareUnit.processor, coveredUnit.processor, availableStock.processor, claim.processor);
        addFilterCondition(filterCriteria.ram, spareUnit.ram, coveredUnit.ram, availableStock.ram, claim.ram);
        addFilterCondition(filterCriteria.category, spareUnit.category, coveredUnit.category, availableStock.category, claim.category);
        addFilterCondition(filterCriteria.hdd, spareUnit.hdd, coveredUnit.hdd, availableStock.hdd, claim.hdd);
        addFilterCondition(filterCriteria.generation, spareUnit.generation, coveredUnit.generation, availableStock.generation, claim.generation);
        
        // Count spare units matching filter
        let spareQuery = db.select({ count: drizzleSql<number>`count(*)::int` }).from(spareUnit);
        if (spareConditions.length > 0) {
          spareQuery = spareQuery.where(and(...spareConditions)) as any;
        }
        const [spareResult] = await spareQuery;
        const spareCount = spareResult?.count || 0;
        
        // Count covered units matching filter
        let coveredQuery = db.select({ count: drizzleSql<number>`count(*)::int` }).from(coveredUnit);
        if (coveredConditions.length > 0) {
          coveredQuery = coveredQuery.where(and(...coveredConditions)) as any;
        }
        const [coveredResult] = await coveredQuery;
        const coveredCount = coveredResult?.count || 0;
        
        // Count available stock matching filter
        let availableStockQuery = db.select({ count: drizzleSql<number>`count(*)::int` }).from(availableStock);
        if (availableStockConditions.length > 0) {
          availableStockQuery = availableStockQuery.where(and(...availableStockConditions)) as any;
        }
        const [availableStockResult] = await availableStockQuery;
        const availableStockCount = availableStockResult?.count || 0;
        
        // Count claims in run rate period matching filter
        const claimDateConditions = [...claimConditions, drizzleSql`${claim.claimDate} >= ${runRateStartDate}`];
        let claimQuery = db.select({ count: drizzleSql<number>`count(*)::int` }).from(claim);
        if (claimDateConditions.length > 0) {
          claimQuery = claimQuery.where(and(...claimDateConditions)) as any;
        }
        const [claimResult] = await claimQuery;
        const claimsInPeriod = claimResult?.count || 0;
        
        // Calculate run rate (claims per month)
        const runRate = runRatePeriodMonths > 0 ? claimsInPeriod / runRatePeriodMonths : 0;
        
        const coverageRatio = coveredCount > 0 ? (spareCount / coveredCount) * 100 : 0;
        
        return {
          ...pool,
          spareCount,
          coveredCount,
          coverageRatio,
          availableStockCount,
          claimsLast6Months: claimsInPeriod, // Actually uses configured period
          runRate: Number(runRate.toFixed(2)),
        };
      }));
      
      res.json(poolsWithStats);
    } catch (error) {
      console.error("Error fetching coverage pools with stats:", error);
      res.status(500).json({ error: "Failed to fetch coverage pools with stats" });
    }
  });

  // Available Stock routes (stock outside pool that can supplement if needed)
  app.get("/api/available-stock", async (req, res) => {
    try {
      let limit: number | undefined = undefined;
      if (req.query.limit) {
        const parsedLimit = parseInt(req.query.limit as string, 10);
        if (isNaN(parsedLimit) || parsedLimit < 1) {
          return res.status(400).json({ error: "Invalid limit parameter: must be a positive integer" });
        }
        limit = Math.min(parsedLimit, 10000);
      }
      
      let offset: number | undefined = undefined;
      if (req.query.offset) {
        const parsedOffset = parseInt(req.query.offset as string, 10);
        if (isNaN(parsedOffset) || parsedOffset < 0) {
          return res.status(400).json({ error: "Invalid offset parameter: must be a non-negative integer" });
        }
        offset = parsedOffset;
      }
      
      const filters = {
        make: req.query.make ? (Array.isArray(req.query.make) ? req.query.make as string[] : [req.query.make as string]) : undefined,
        model: req.query.model ? (Array.isArray(req.query.model) ? req.query.model as string[] : [req.query.model as string]) : undefined,
        processor: req.query.processor ? (Array.isArray(req.query.processor) ? req.query.processor as string[] : [req.query.processor as string]) : undefined,
        ram: req.query.ram ? (Array.isArray(req.query.ram) ? req.query.ram as string[] : [req.query.ram as string]) : undefined,
        category: req.query.category ? (Array.isArray(req.query.category) ? req.query.category as string[] : [req.query.category as string]) : undefined,
        search: req.query.search as string | undefined,
        limit,
        offset,
      };
      
      const units = await storage.getAvailableStock(filters);
      res.json(units);
    } catch (error) {
      console.error("Error fetching available stock:", error);
      res.status(500).json({ error: "Failed to fetch available stock" });
    }
  });

  // Get available stock stats
  app.get("/api/available-stock/stats", async (req, res) => {
    try {
      const filters = {
        search: req.query.search as string | undefined,
      };
      
      const units = await storage.getAvailableStock(filters);
      const total = units.length;
      const reserved = units.filter(u => u.reservedForCase).length;
      const available = total - reserved;
      
      res.json({ total, reserved, available });
    } catch (error) {
      console.error("Error fetching available stock stats:", error);
      res.status(500).json({ error: "Failed to fetch available stock stats" });
    }
  });

  // Bulk replace available stock (clear all + batch insert for 80k+ units)
  app.post("/api/available-stock/bulk", async (req, res) => {
    try {
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ error: "Request body must be an array of available stock units" });
      }

      const validatedData = z.array(insertAvailableStockSchema).parse(req.body);
      
      const count = await storage.bulkReplaceAvailableStock(validatedData);
      res.json({ message: `Successfully replaced all available stock with ${count} units`, count });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error bulk replacing available stock:", error);
      res.status(500).json({ error: "Failed to bulk replace available stock" });
    }
  });

  // Claims routes (warranty returns)
  app.get("/api/claims", async (req, res) => {
    try {
      let limit: number | undefined = undefined;
      if (req.query.limit) {
        const parsedLimit = parseInt(req.query.limit as string, 10);
        if (isNaN(parsedLimit) || parsedLimit < 1) {
          return res.status(400).json({ error: "Invalid limit parameter: must be a positive integer" });
        }
        limit = Math.min(parsedLimit, 10000);
      }
      
      let offset: number | undefined = undefined;
      if (req.query.offset) {
        const parsedOffset = parseInt(req.query.offset as string, 10);
        if (isNaN(parsedOffset) || parsedOffset < 0) {
          return res.status(400).json({ error: "Invalid offset parameter: must be a non-negative integer" });
        }
        offset = parsedOffset;
      }
      
      const filters = {
        make: req.query.make ? (Array.isArray(req.query.make) ? req.query.make as string[] : [req.query.make as string]) : undefined,
        model: req.query.model ? (Array.isArray(req.query.model) ? req.query.model as string[] : [req.query.model as string]) : undefined,
        processor: req.query.processor ? (Array.isArray(req.query.processor) ? req.query.processor as string[] : [req.query.processor as string]) : undefined,
        ram: req.query.ram ? (Array.isArray(req.query.ram) ? req.query.ram as string[] : [req.query.ram as string]) : undefined,
        category: req.query.category ? (Array.isArray(req.query.category) ? req.query.category as string[] : [req.query.category as string]) : undefined,
        search: req.query.search as string | undefined,
        limit,
        offset,
      };
      
      const claims = await storage.getClaims(filters);
      res.json(claims);
    } catch (error) {
      console.error("Error fetching claims:", error);
      res.status(500).json({ error: "Failed to fetch claims" });
    }
  });

  // Get claims stats
  app.get("/api/claims/stats", async (req, res) => {
    try {
      const filters = {
        search: req.query.search as string | undefined,
      };
      
      const claims = await storage.getClaims(filters);
      const total = claims.length;
      
      res.json({ total });
    } catch (error) {
      console.error("Error fetching claims stats:", error);
      res.status(500).json({ error: "Failed to fetch claims stats" });
    }
  });

  // Bulk upsert claims (15k units, composite key: serialNumber + areaId + itemId + rma)
  app.post("/api/claims/bulk", async (req, res) => {
    try {
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ error: "Request body must be an array of claims" });
      }

      const validatedData = z.array(insertClaimSchema).parse(req.body);
      
      const result = await storage.bulkReplaceClaims(validatedData);
      
      let message = `Successfully processed ${result.inserted} claims`;
      if (result.duplicatesRemoved > 0) {
        message += ` (removed ${result.duplicatesRemoved} duplicates, kept most recent by claim date)`;
      }
      
      res.json({ 
        message, 
        count: result.inserted,
        inserted: result.inserted,
        duplicatesRemoved: result.duplicatesRemoved,
        totalReceived: validatedData.length
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error bulk upserting claims:", error);
      res.status(500).json({ error: "Failed to bulk upsert claims" });
    }
  });

  // Replacements routes (sent as replacements)
  app.get("/api/replacements", async (req, res) => {
    try {
      let limit: number | undefined = undefined;
      if (req.query.limit) {
        const parsedLimit = parseInt(req.query.limit as string, 10);
        if (isNaN(parsedLimit) || parsedLimit < 1) {
          return res.status(400).json({ error: "Invalid limit parameter: must be a positive integer" });
        }
        limit = Math.min(parsedLimit, 10000);
      }
      
      let offset: number | undefined = undefined;
      if (req.query.offset) {
        const parsedOffset = parseInt(req.query.offset as string, 10);
        if (isNaN(parsedOffset) || parsedOffset < 0) {
          return res.status(400).json({ error: "Invalid offset parameter: must be a non-negative integer" });
        }
        offset = parsedOffset;
      }
      
      const filters = {
        make: req.query.make ? (Array.isArray(req.query.make) ? req.query.make as string[] : [req.query.make as string]) : undefined,
        model: req.query.model ? (Array.isArray(req.query.model) ? req.query.model as string[] : [req.query.model as string]) : undefined,
        processor: req.query.processor ? (Array.isArray(req.query.processor) ? req.query.processor as string[] : [req.query.processor as string]) : undefined,
        ram: req.query.ram ? (Array.isArray(req.query.ram) ? req.query.ram as string[] : [req.query.ram as string]) : undefined,
        category: req.query.category ? (Array.isArray(req.query.category) ? req.query.category as string[] : [req.query.category as string]) : undefined,
        search: req.query.search as string | undefined,
        limit,
        offset,
      };
      
      const replacements = await storage.getReplacements(filters);
      res.json(replacements);
    } catch (error) {
      console.error("Error fetching replacements:", error);
      res.status(500).json({ error: "Failed to fetch replacements" });
    }
  });

  // Get replacements stats
  app.get("/api/replacements/stats", async (req, res) => {
    try {
      const filters = {
        search: req.query.search as string | undefined,
      };
      
      const replacements = await storage.getReplacements(filters);
      const total = replacements.length;
      
      res.json({ total });
    } catch (error) {
      console.error("Error fetching replacements stats:", error);
      res.status(500).json({ error: "Failed to fetch replacements stats" });
    }
  });

  // Bulk upsert replacements (15k units, composite key: serialNumber + areaId + itemId + rma)
  app.post("/api/replacements/bulk", async (req, res) => {
    try {
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ error: "Request body must be an array of replacements" });
      }

      const validatedData = z.array(insertReplacementSchema).parse(req.body);
      
      const result = await storage.bulkReplaceReplacements(validatedData);
      
      let message = `Successfully processed ${result.inserted} replacements`;
      if (result.duplicatesRemoved > 0) {
        message += ` (removed ${result.duplicatesRemoved} duplicates, kept most recent by replaced date)`;
      }
      
      res.json({ 
        message, 
        count: result.inserted,
        inserted: result.inserted,
        duplicatesRemoved: result.duplicatesRemoved,
        totalReceived: validatedData.length
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error bulk upserting replacements:", error);
      res.status(500).json({ error: "Failed to bulk upsert replacements" });
    }
  });

  // Configuration routes
  app.get("/api/configuration", async (req, res) => {
    try {
      const config = await storage.getConfiguration();
      res.json(config);
    } catch (error) {
      console.error("Error fetching configuration:", error);
      res.status(500).json({ error: "Failed to fetch configuration" });
    }
  });

  app.patch("/api/configuration", async (req, res) => {
    try {
      // Password protection for configuration updates
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const providedPassword = req.body.password;
      
      if (providedPassword !== adminPassword) {
        return res.status(401).json({ error: "Invalid password" });
      }

      // Remove password from the update data
      const { password, ...updateData } = req.body;
      const config = await storage.updateConfiguration(updateData);
      res.json(config);
    } catch (error) {
      console.error("Error updating configuration:", error);
      res.status(500).json({ error: "Failed to update configuration" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
