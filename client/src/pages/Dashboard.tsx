import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MetricCard from "@/components/MetricCard";
import PoolCoverageCard from "@/components/PoolCoverageCard";
import { PoolDetailDialog } from "@/components/PoolDetailDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, AlertTriangle, TrendingUp, Package, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { CoveragePoolWithStats } from "@shared/schema";

export default function Dashboard() {
  const [selectedPool, setSelectedPool] = useState<{ name: string; filterCriteria: string } | null>(null);
  const { data: analytics, isLoading: analyticsLoading } = useQuery<{
    totalSpareUnits: number;
    totalCoveredUnits: number;
    activeCoverage: number;
    expiringCoverage: number;
    unallocatedSpareUnits: number;
    averageCoverageRatio: number;
    lowCoverageThresholdPercent: number;
    expiringCoverageDays: number;
  }>({
    queryKey: ["/api/analytics"],
  });

  const { data: coveragePoolsWithStats, isLoading: statsLoading } = useQuery<CoveragePoolWithStats[]>({
    queryKey: ["/api/coverage-pools-with-stats"],
  });

  // Map coverage pool stats for display
  const poolCoverageStats = coveragePoolsWithStats?.map((pool: any) => {
    try {
      const criteria = JSON.parse(pool.filterCriteria || "{}");
      
      return {
        ...pool,
        inventoryRequired: pool.coveredCount,
        poolUnits: pool.spareCount,
        coverage: pool.coverageRatio,
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

  // Calculate low coverage alerts using configured threshold
  const threshold = analytics?.lowCoverageThresholdPercent || 10;
  const lowCoverageCount = poolCoverageStats.filter((stat: any) => stat.coverage < threshold).length;

  if (analyticsLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor coverage and pool status across all replacement pool units
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
          Monitor coverage and pool status across all replacement pool units
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Total Warranty Stock"
          value={analytics?.totalCoveredUnits || 0}
          icon={Shield}
          subtitle="All units under warranty"
          data-testid="card-total-warranty-stock"
        />
        <MetricCard
          title="Active Warranty"
          value={analytics?.activeCoverage || 0}
          icon={Shield}
          subtitle="Non-expired coverage"
          data-testid="card-active-warranty"
        />
        <MetricCard
          title="Total Replacement Pool"
          value={analytics?.totalSpareUnits || 0}
          icon={Package}
          subtitle="All spare units"
          data-testid="card-total-replacement-pool"
        />
        <MetricCard
          title="Unallocated Pool"
          value={analytics?.unallocatedSpareUnits || 0}
          icon={Package}
          subtitle="Not reserved"
          data-testid="card-unallocated-pool"
        />
        <MetricCard
          title="Expiring Warranty Stock"
          value={analytics?.expiringCoverage || 0}
          icon={TrendingUp}
          subtitle={`Next ${analytics?.expiringCoverageDays || 30} days`}
          data-testid="card-expiring-warranty-stock"
        />
        <MetricCard
          title="Low Coverage Groups"
          value={lowCoverageCount}
          icon={AlertTriangle}
          subtitle={`Below ${threshold}% threshold`}
          data-testid="card-low-coverage-groups"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-medium mb-4">Pool Coverage Status</h2>
          {poolCoverageStats.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-48 text-center p-6">
                <Package className="h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="font-medium mb-1">No Coverage Pools Yet</h3>
                <p className="text-sm text-muted-foreground">
                  Create coverage pools to organize and monitor replacement pool unit allocation
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
                  onExpand={() => setSelectedPool({ name: group.name, filterCriteria: group.filterCriteria })}
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
                    {analytics?.totalSpareUnits || 0} total replacement pool units in system
                  </p>
                  <p className="text-xs text-muted-foreground">Up to date</p>
                </div>
              </div>
              <div className="flex gap-3 pb-4 border-b">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-green-500" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm">
                    {analytics?.activeCoverage || 0} stock under active warranty
                  </p>
                  <p className="text-xs text-muted-foreground">Current status</p>
                </div>
              </div>
              {lowCoverageCount > 0 && (
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-red-500" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">
                      {lowCoverageCount} coverage pools below {threshold}% coverage ratio
                    </p>
                    <p className="text-xs text-muted-foreground">Action needed</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pool Detail Dialog */}
      {selectedPool && (
        <PoolDetailDialog
          open={!!selectedPool}
          onOpenChange={(open) => !open && setSelectedPool(null)}
          poolName={selectedPool.name}
          filterCriteria={selectedPool.filterCriteria}
        />
      )}
    </div>
  );
}
