import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MetricCard from "@/components/MetricCard";
import PoolCoverageCard from "@/components/PoolCoverageCard";
import { PoolDetailDialog } from "@/components/PoolDetailDialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Shield, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { CoveragePoolWithStats } from "@shared/schema";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

  const { data: stockUnderWarranty, isLoading: stockUnderWarrantyLoading } = useQuery({
    queryKey: ["/api/covered-units"],
  });

  const { data: replacementUnits, isLoading: replacementUnitsLoading } = useQuery({
    queryKey: ["/api/spare-units"],
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

  // Generate coverage expiration trend data
  const coverageExpirationData = (() => {
    if (!stockUnderWarranty || !Array.isArray(stockUnderWarranty)) return [];
    
    const months = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
    const now = new Date();
    
    return months.map((month, index) => {
      const targetDate = new Date(now);
      targetDate.setMonth(targetDate.getMonth() + index);
      targetDate.setDate(1);
      
      const nextMonth = new Date(targetDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      const expiring = stockUnderWarranty.filter((c: any) => {
        const endDate = new Date(c.coverageEndDate);
        return endDate >= targetDate && endDate < nextMonth && c.isCoverageActive;
      }).length;
      
      return { month, expiring };
    });
  })();

  // Generate coverage ratio by make data (replacement units / stock under warranty)
  const coverageRatioByMake = (() => {
    if (!replacementUnits || !stockUnderWarranty || !Array.isArray(replacementUnits) || !Array.isArray(stockUnderWarranty)) return [];
    
    const makeGroups: any = {};
    
    // Count replacement units by make
    replacementUnits.forEach((unit: any) => {
      if (!makeGroups[unit.make]) {
        makeGroups[unit.make] = { replacementCount: 0, warrantyStockCount: 0 };
      }
      if (!unit.retiredOrder && !unit.reservedForCase) {
        makeGroups[unit.make].replacementCount++;
      }
    });
    
    // Count stock under warranty by make
    stockUnderWarranty.forEach((unit: any) => {
      if (!makeGroups[unit.make]) {
        makeGroups[unit.make] = { replacementCount: 0, warrantyStockCount: 0 };
      }
      if (unit.isCoverageActive) {
        makeGroups[unit.make].warrantyStockCount++;
      }
    });
    
    return Object.entries(makeGroups).map(([make, data]: [string, any]) => ({
      make,
      coverageRatio: data.warrantyStockCount > 0 ? ((data.replacementCount / data.warrantyStockCount) * 100).toFixed(1) : 0,
      replacementCount: data.replacementCount,
      warrantyStockCount: data.warrantyStockCount,
    }));
  })();

  // Generate coverage status distribution
  const statusDistribution = (() => {
    if (!stockUnderWarranty || !Array.isArray(stockUnderWarranty)) return [];
    
    return [
      { 
        name: "Active Coverage", 
        value: stockUnderWarranty.filter((c: any) => c.isCoverageActive).length, 
        color: "hsl(var(--chart-1))" 
      },
      { 
        name: "Expiring Soon", 
        value: stockUnderWarranty.filter((c: any) => {
          if (!c.isCoverageActive) return false;
          const daysRemaining = Math.floor((new Date(c.coverageEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          return daysRemaining < 30;
        }).length, 
        color: "hsl(var(--chart-4))" 
      },
      { 
        name: "Inactive Coverage", 
        value: stockUnderWarranty.filter((c: any) => !c.isCoverageActive).length, 
        color: "hsl(var(--chart-3))" 
      },
    ];
  })();

  if (analyticsLoading || statsLoading || stockUnderWarrantyLoading || replacementUnitsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor coverage and pool status across all replacement pool units
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-96" />
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-base font-medium">Coverage Expiration Trend</h3>
            <p className="text-xs text-muted-foreground">
              Stock under warranty with expiring coverage per month
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={coverageExpirationData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="month"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  label={{
                    value: "Stock under Warranty",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "hsl(var(--muted-foreground))" },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="expiring"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-1))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-base font-medium">Coverage Ratio by Make</h3>
            <p className="text-xs text-muted-foreground">
              Ratio of replacement units to stock under warranty by manufacturer
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={coverageRatioByMake}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="make"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  label={{
                    value: "Coverage Ratio %",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "hsl(var(--muted-foreground))" },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === 'coverageRatio') return [`${value}%`, 'Coverage Ratio'];
                    return [value, name];
                  }}
                />
                <Bar dataKey="coverageRatio" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-base font-medium">Coverage Status Distribution</h3>
            <p className="text-xs text-muted-foreground">
              Current status breakdown across all stock under warranty in field
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="hsl(var(--chart-1))"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
