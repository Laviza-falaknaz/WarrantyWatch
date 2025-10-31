import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Warehouse, ClipboardList, TrendingUp } from "lucide-react";
import DataTable, { Column } from "@/components/DataTable";
import type { SpareUnit, CoveredUnit, AvailableStock, Claim, AppConfiguration } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface PoolDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poolName: string;
  filterCriteria: string;
}

export function PoolDetailDialog({
  open,
  onOpenChange,
  poolName,
  filterCriteria,
}: PoolDetailDialogProps) {
  const { toast } = useToast();
  
  const criteria = useMemo(() => {
    try {
      return JSON.parse(filterCriteria);
    } catch {
      return {};
    }
  }, [filterCriteria]);

  // Fetch spare units (with high limit to get all records)
  const { data: spareUnits, isLoading: spareLoading } = useQuery<SpareUnit[]>({
    queryKey: ["/api/spare-units", { limit: 10000 }],
    enabled: open,
    refetchOnMount: true,
    staleTime: 0,
  });

  // Fetch covered units (with high limit to get all records)
  const { data: coveredUnits, isLoading: coveredLoading } = useQuery<CoveredUnit[]>({
    queryKey: ["/api/covered-units", { limit: 10000 }],
    enabled: open,
    refetchOnMount: true,
    staleTime: 0,
  });

  // Fetch available stock (with high limit to get all records)
  const { data: availableStock, isLoading: availableLoading } = useQuery<AvailableStock[]>({
    queryKey: ["/api/available-stock", { limit: 10000 }],
    enabled: open,
    refetchOnMount: true,
    staleTime: 0,
  });

  // Fetch claims (with high limit to get all records)
  const { data: claims, isLoading: claimsLoading } = useQuery<Claim[]>({
    queryKey: ["/api/claims", { limit: 10000 }],
    enabled: open,
    refetchOnMount: true,
    staleTime: 0,
  });

  // Fetch configuration for run rate period
  const { data: config } = useQuery<AppConfiguration>({
    queryKey: ["/api/configuration"],
    enabled: open,
  });

  // Filter units based on criteria (case-insensitive and trimmed for robustness)
  const filterUnits = <T extends Record<string, any>>(units: T[] | undefined): T[] => {
    if (!units) return [];
    
    return units.filter(unit => {
      // Check each filter criteria
      for (const [key, value] of Object.entries(criteria)) {
        if (!value) continue;
        
        const values = Array.isArray(value) ? value : [value];
        const unitValue = unit[key];
        
        // If unit doesn't have the field, exclude it
        if (!unitValue) return false;
        
        // Case-insensitive and trimmed comparison
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
    try {
      // Create a new workbook
      const workbook = XLSX.utils.book_new();

      // Prepare spare units data
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

      // Prepare covered units data
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

      // Create worksheets
      const spareSheet = XLSX.utils.json_to_sheet(spareData);
      const coveredSheet = XLSX.utils.json_to_sheet(coveredData);

      // Add worksheets to workbook
      XLSX.utils.book_append_sheet(workbook, spareSheet, "Spare Units");
      XLSX.utils.book_append_sheet(workbook, coveredSheet, "Covered Units");

      // Generate filename with pool name and timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${poolName.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.xlsx`;

      // Write the file
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle>{poolName} - Pool Details</DialogTitle>
              <DialogDescription>
                View all spare units and covered units in this coverage pool
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportToExcel}
              disabled={filteredSpareUnits.length === 0 && filteredCoveredUnits.length === 0}
              data-testid="button-export-excel"
            >
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pool Statistics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
                {Object.entries(criteria).map(([key, value]) => {
                  if (!value) return null;
                  const values = Array.isArray(value) ? value : [value];
                  return values.map((v, idx) => (
                    <Badge key={`${key}-${idx}`} variant="secondary">
                      {key}: {v}
                    </Badge>
                  ));
                })}
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

            <TabsContent value="spare" className="space-y-2">
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
                <div className="border rounded-md overflow-x-auto max-h-[50vh] overflow-y-auto">
                  <DataTable
                    columns={spareColumns}
                    data={filteredSpareUnits}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="covered" className="space-y-2">
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
                <div className="border rounded-md overflow-x-auto max-h-[50vh] overflow-y-auto">
                  <DataTable
                    columns={coveredColumns}
                    data={filteredCoveredUnits}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
