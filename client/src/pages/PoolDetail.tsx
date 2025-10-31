import { useMemo } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Warehouse, ClipboardList, TrendingUp, ChevronLeft } from "lucide-react";
import DataTable, { Column } from "@/components/DataTable";
import type { SpareUnit, CoveredUnit, AvailableStock, Claim, AppConfiguration, CoveragePool } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function PoolDetail() {
  const [, params] = useRoute("/pools/:poolId");
  const poolId = params?.poolId;
  const { toast } = useToast();

  // Fetch pool details
  const { data: pool, isLoading: poolLoading } = useQuery<CoveragePool>({
    queryKey: [`/api/coverage-pools/${poolId}`],
    enabled: !!poolId,
  });

  const criteria = useMemo(() => {
    if (!pool?.filterCriteria) return {};
    try {
      return JSON.parse(pool.filterCriteria);
    } catch {
      return {};
    }
  }, [pool?.filterCriteria]);

  // Fetch spare units (with high limit to get all records)
  const { data: spareUnits, isLoading: spareLoading } = useQuery<SpareUnit[]>({
    queryKey: ["/api/spare-units", { limit: 10000 }],
    enabled: !!poolId,
  });

  // Fetch covered units (with high limit to get all records)
  const { data: coveredUnits, isLoading: coveredLoading } = useQuery<CoveredUnit[]>({
    queryKey: ["/api/covered-units", { limit: 10000 }],
    enabled: !!poolId,
  });

  // Fetch available stock (with high limit to get all records)
  const { data: availableStock, isLoading: availableLoading } = useQuery<AvailableStock[]>({
    queryKey: ["/api/available-stock", { limit: 10000 }],
    enabled: !!poolId,
  });

  // Fetch claims (with high limit to get all records)
  const { data: claims, isLoading: claimsLoading } = useQuery<Claim[]>({
    queryKey: ["/api/claims", { limit: 10000 }],
    enabled: !!poolId,
  });

  // Fetch configuration for run rate period
  const { data: config } = useQuery<AppConfiguration>({
    queryKey: ["/api/configuration"],
  });

  // Filter units based on criteria (case-insensitive and trimmed for robustness)
  const filterUnits = <T extends Record<string, any>>(units: T[] | undefined): T[] => {
    if (!units) return [];
    
    return units.filter(unit => {
      for (const [key, value] of Object.entries(criteria)) {
        if (!value) continue;
        
        const values = Array.isArray(value) ? value : [value];
        const unitValue = unit[key];
        
        if (!unitValue) return false;
        
        const normalizedUnitValue = String(unitValue).trim().toLowerCase();
        const normalizedValues = values.map(v => String(v).trim().toLowerCase());
        
        if (!normalizedValues.includes(normalizedUnitValue)) return false;
      }
      return true;
    });
  };

  const filteredSpareUnits = filterUnits(spareUnits);
  const filteredCoveredUnits = filterUnits(coveredUnits);
  const filteredAvailableStock = filterUnits(availableStock);
  const filteredClaims = filterUnits(claims);

  // Calculate run rate (claims per month over configured period)
  const runRate = useMemo(() => {
    const periodMonths = config?.runRatePeriodMonths || 6;
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - periodMonths);
    
    if (!filteredClaims.length) return 0;
    
    const recentClaims = filteredClaims.filter(claim => {
      if (!claim.claimDate) return false;
      const claimDate = new Date(claim.claimDate);
      return claimDate >= cutoffDate;
    });
    
    return recentClaims.length / periodMonths;
  }, [filteredClaims, config]);

  // Column definitions for spare units
  const spareColumns: Column<SpareUnit>[] = useMemo(() => [
    {
      key: "serialNumber",
      header: "Serial Number",
      render: (unit) => (
        <span className="font-mono text-sm">{unit.serialNumber}</span>
      ),
    },
    {
      key: "itemId",
      header: "Item ID",
      render: (unit) => (
        <span className="font-mono text-sm">{unit.itemId || "—"}</span>
      ),
    },
    {
      key: "make",
      header: "Make",
    },
    {
      key: "model",
      header: "Model",
    },
    {
      key: "processor",
      header: "Processor",
    },
    {
      key: "ram",
      header: "RAM",
    },
    {
      key: "category",
      header: "Category",
    },
    {
      key: "hdd",
      header: "Storage",
    },
    {
      key: "generation",
      header: "Generation",
    },
    {
      key: "areaId",
      header: "Area ID",
    },
    {
      key: "currentHolder",
      header: "Current Holder",
      render: (unit) => unit.currentHolder || "Available",
    },
  ], []);

  // Column definitions for covered units
  const coveredColumns: Column<CoveredUnit>[] = useMemo(() => [
    {
      key: "serialNumber",
      header: "Serial Number",
      render: (unit) => (
        <span className="font-mono text-sm">{unit.serialNumber}</span>
      ),
    },
    {
      key: "customerName",
      header: "Customer Name",
    },
    {
      key: "make",
      header: "Make",
    },
    {
      key: "model",
      header: "Model",
    },
    {
      key: "processor",
      header: "Processor",
    },
    {
      key: "ram",
      header: "RAM",
    },
    {
      key: "category",
      header: "Category",
    },
    {
      key: "hdd",
      header: "Storage",
    },
    {
      key: "generation",
      header: "Generation",
    },
    {
      key: "areaId",
      header: "Area ID",
    },
    {
      key: "orderNumber",
      header: "Order Number",
      render: (unit) => (
        <span className="font-mono text-sm">{unit.orderNumber || "—"}</span>
      ),
    },
  ], []);

  // Export to Excel function
  const handleExportToExcel = () => {
    if (!pool) return;
    
    try {
      const workbook = XLSX.utils.book_new();

      const spareData = filteredSpareUnits.map(unit => ({
        "Serial Number": unit.serialNumber,
        "Item ID": unit.itemId || "",
        "Make": unit.make,
        "Model": unit.model,
        "Processor": unit.processor,
        "RAM": unit.ram,
        "Category": unit.category || "",
        "Storage Size": unit.hdd || "",
        "Generation": unit.generation || "",
        "Area ID": unit.areaId,
        "Current Holder": unit.currentHolder || "Available",
        "Reserved For Case": unit.reservedForCase || "",
      }));

      const coveredData = filteredCoveredUnits.map(unit => ({
        "Serial Number": unit.serialNumber,
        "Customer Name": unit.customerName || "",
        "Make": unit.make,
        "Model": unit.model,
        "Processor": unit.processor,
        "RAM": unit.ram,
        "Category": unit.category || "",
        "Storage Size": unit.hdd || "",
        "Generation": unit.generation || "",
        "Area ID": unit.areaId,
        "Order Number": unit.orderNumber || "",
        "Coverage Start": unit.coverageStartDate ? new Date(unit.coverageStartDate).toLocaleDateString() : "",
        "Coverage End": unit.coverageEndDate ? new Date(unit.coverageEndDate).toLocaleDateString() : "",
      }));

      const spareSheet = XLSX.utils.json_to_sheet(spareData);
      const coveredSheet = XLSX.utils.json_to_sheet(coveredData);

      XLSX.utils.book_append_sheet(workbook, spareSheet, "Spare Units");
      XLSX.utils.book_append_sheet(workbook, coveredSheet, "Covered Units");

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${pool.name.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.xlsx`;

      XLSX.writeFile(workbook, filename);

      toast({
        title: "Export Successful",
        description: `Downloaded ${filteredSpareUnits.length} spare units and ${filteredCoveredUnits.length} covered units to Excel`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting to Excel. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (poolLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Pool not found</p>
            <div className="mt-4 flex justify-center">
              <Button asChild variant="outline">
                <Link href="/coverage-pools" data-testid="link-back-to-pools">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to Coverage Pools
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Breadcrumb and Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/coverage-pools" className="hover:text-foreground" data-testid="link-breadcrumb-pools">
              Coverage Pools
            </Link>
            <span>/</span>
            <span className="text-foreground">{pool.name}</span>
          </div>
          <h1 className="text-3xl font-bold" data-testid="heading-pool-name">
            {pool.name}
          </h1>
          <p className="text-muted-foreground">
            View all spare units and covered units in this coverage pool
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExportToExcel}
          disabled={filteredSpareUnits.length === 0 && filteredCoveredUnits.length === 0}
          data-testid="button-export-excel"
        >
          <Download className="h-4 w-4 mr-2" />
          Export to Excel
        </Button>
      </div>

      {/* Pool Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Stock</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {availableLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-available-stock-count">
                {filteredAvailableStock.length}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Units matching pool criteria
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Claims History</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {claimsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-claims-count">
                {filteredClaims.length}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Total claims for this pool
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Run Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {claimsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-run-rate">
                {runRate != null ? runRate.toFixed(2) : "—"}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Claims per month ({config?.runRatePeriodMonths || 6} month period)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Criteria Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Filter Criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.keys(criteria).length === 0 ? (
              <Badge variant="outline">All Units (No Filters)</Badge>
            ) : (
              Object.entries(criteria).map(([key, value]) => {
                if (!value) return null;
                const values = Array.isArray(value) ? value : [value];
                return values.map((v, idx) => (
                  <Badge key={`${key}-${idx}`} variant="secondary">
                    {key}: {v}
                  </Badge>
                ));
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Spare Units and Covered Units */}
      <Tabs defaultValue="spare" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="spare" data-testid="tab-spare-units">
            Spare Units ({filteredSpareUnits.length})
          </TabsTrigger>
          <TabsTrigger value="covered" data-testid="tab-covered-units">
            Covered Units ({filteredCoveredUnits.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="spare" className="space-y-4 mt-4">
          {spareLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : filteredSpareUnits.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No spare units match this pool's criteria
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="border rounded-md overflow-auto">
              <DataTable
                columns={spareColumns}
                data={filteredSpareUnits}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="covered" className="space-y-4 mt-4">
          {coveredLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : filteredCoveredUnits.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No covered units match this pool's criteria
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="border rounded-md overflow-auto">
              <DataTable
                columns={coveredColumns}
                data={filteredCoveredUnits}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
