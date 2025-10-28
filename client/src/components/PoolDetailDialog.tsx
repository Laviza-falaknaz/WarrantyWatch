import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SpareUnit, CoveredUnit } from "@shared/schema";

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
  const criteria = useMemo(() => {
    try {
      return JSON.parse(filterCriteria);
    } catch {
      return {};
    }
  }, [filterCriteria]);

  // Fetch spare units
  const { data: spareUnits, isLoading: spareLoading } = useQuery<SpareUnit[]>({
    queryKey: ["/api/spare-units"],
    enabled: open,
  });

  // Fetch covered units
  const { data: coveredUnits, isLoading: coveredLoading } = useQuery<CoveredUnit[]>({
    queryKey: ["/api/covered-units"],
    enabled: open,
  });

  // Filter units based on criteria
  const filterUnits = <T extends Record<string, any>>(units: T[] | undefined): T[] => {
    if (!units) return [];
    
    return units.filter(unit => {
      // Check each filter criteria
      for (const [key, value] of Object.entries(criteria)) {
        if (!value) continue;
        
        const values = Array.isArray(value) ? value : [value];
        const unitValue = unit[key];
        
        if (!unitValue) return false;
        if (!values.includes(unitValue)) return false;
      }
      return true;
    });
  };

  const filteredSpareUnits = filterUnits(spareUnits);
  const filteredCoveredUnits = filterUnits(coveredUnits);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{poolName} - Pool Details</DialogTitle>
          <DialogDescription>
            View all spare units and covered units in this coverage pool
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
                filteredSpareUnits.map((unit) => (
                  <Card key={unit.id} className="hover-elevate" data-testid={`spare-unit-${unit.serialNumber}`}>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Serial: </span>
                          <span className="font-mono">{unit.serialNumber}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Item ID: </span>
                          <span className="font-mono">{unit.itemId || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Make/Model: </span>
                          <span>{unit.make} {unit.model}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Processor: </span>
                          <span>{unit.processor}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">RAM: </span>
                          <span>{unit.ram}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Current Holder: </span>
                          <span>{unit.currentHolder || "Available"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
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
                filteredCoveredUnits.map((unit) => (
                  <Card key={unit.id} className="hover-elevate" data-testid={`covered-unit-${unit.serialNumber}`}>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Serial: </span>
                          <span className="font-mono">{unit.serialNumber}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Customer: </span>
                          <span>{unit.customerName || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Make/Model: </span>
                          <span>{unit.make} {unit.model}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Processor: </span>
                          <span>{unit.processor}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">RAM: </span>
                          <span>{unit.ram}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Order: </span>
                          <span className="font-mono">{unit.orderNumber || "N/A"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
