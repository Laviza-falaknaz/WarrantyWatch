import { useQuery } from "@tanstack/react-query";
import MetricCard from "@/components/MetricCard";
import PoolCoverageCard from "@/components/PoolCoverageCard";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, AlertTriangle, TrendingUp, Package, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/analytics"],
  });

  const { data: poolGroups, isLoading: poolGroupsLoading } = useQuery({
    queryKey: ["/api/pool-groups"],
  });

  const { data: inventoryWithWarranty, isLoading: inventoryLoading } = useQuery({
    queryKey: ["/api/inventory-with-warranty"],
  });

  // Calculate pool coverage stats
  const poolCoverageStats = poolGroups?.map((group: any) => {
    try {
      const criteria = JSON.parse(group.filterCriteria || "{}");
      
      // Filter inventory based on criteria
      const matchingInventory = inventoryWithWarranty?.filter((item: any) => {
        let matches = true;
        if (criteria.make && item.make !== criteria.make) matches = false;
        if (criteria.model && item.model !== criteria.model) matches = false;
        if (criteria.processor && item.processor !== criteria.processor) matches = false;
        if (criteria.ram && item.ram !== criteria.ram) matches = false;
        return matches && item.warranty?.isActive;
      }) || [];

      // Count items in pool (not sold)
      const poolItems = matchingInventory.filter((item: any) => !item.soldOrder);
      
      const coverage = matchingInventory.length > 0 
        ? (poolItems.length / matchingInventory.length) * 100 
        : 0;

      return {
        ...group,
        inventoryRequired: matchingInventory.length,
        poolUnits: poolItems.length,
        coverage,
        specifications: [
          criteria.make,
          criteria.model,
          criteria.processor,
          criteria.ram,
        ].filter(Boolean),
      };
    } catch {
      return null;
    }
  }).filter(Boolean) || [];

  // Calculate low coverage alerts
  const lowCoverageCount = poolCoverageStats.filter((stat: any) => stat.coverage < 10).length;

  if (analyticsLoading || poolGroupsLoading || inventoryLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor warranty coverage and pool status across all inventory
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor warranty coverage and pool status across all inventory
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Warranties"
          value={analytics?.activeWarranties || 0}
          icon={Shield}
          subtitle="Across all inventory"
        />
        <MetricCard
          title="Total Inventory"
          value={analytics?.totalInventory || 0}
          icon={Package}
          subtitle="All units"
        />
        <MetricCard
          title="Expiring Soon"
          value={analytics?.expiringWarranties || 0}
          icon={TrendingUp}
          subtitle="Next 30 days"
        />
        <MetricCard
          title="Low Coverage Alerts"
          value={lowCoverageCount}
          icon={AlertTriangle}
          subtitle="Below 10% threshold"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-medium mb-4">Pool Coverage Status</h2>
          {poolCoverageStats.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-48 text-center p-6">
                <Package className="h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="font-medium mb-1">No Pool Groups Yet</h3>
                <p className="text-sm text-muted-foreground">
                  Create pool groups to organize and monitor warranty coverage
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {poolCoverageStats.slice(0, 6).map((group: any) => (
                <PoolCoverageCard
                  key={group.id}
                  groupName={group.name}
                  specifications={group.specifications}
                  inventoryRequired={group.inventoryRequired}
                  poolUnits={group.poolUnits}
                  coveragePercentage={group.coverage}
                  onExpand={() => console.log(`Expand pool: ${group.name}`)}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-medium mb-4">System Status</h2>
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex gap-3 pb-4 border-b">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-500" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm">
                    {analytics?.totalInventory || 0} total inventory units in system
                  </p>
                  <p className="text-xs text-muted-foreground">Up to date</p>
                </div>
              </div>
              <div className="flex gap-3 pb-4 border-b">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-green-500" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm">
                    {analytics?.activeWarranties || 0} active warranties tracked
                  </p>
                  <p className="text-xs text-muted-foreground">Current status</p>
                </div>
              </div>
              {lowCoverageCount > 0 && (
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-red-500" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">
                      {lowCoverageCount} pool groups below 10% coverage
                    </p>
                    <p className="text-xs text-muted-foreground">Action needed</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
