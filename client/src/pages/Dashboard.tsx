import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import MetricCard from "@/components/MetricCard";
import RiskAnalysisTable from "@/components/RiskAnalysisTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Package, TrendingUp, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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

  // Generate coverage ratio by make data
  const coverageRatioByMake = (() => {
    if (!replacementUnits || !stockUnderWarranty || !Array.isArray(replacementUnits) || !Array.isArray(stockUnderWarranty)) return [];
    
    const makeGroups: any = {};
    
    replacementUnits.forEach((unit: any) => {
      if (!makeGroups[unit.make]) {
        makeGroups[unit.make] = { replacementCount: 0, warrantyStockCount: 0 };
      }
      if (!unit.retiredOrder && !unit.reservedForCase) {
        makeGroups[unit.make].replacementCount++;
      }
    });
    
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
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor coverage, high-risk combinations, and pool status
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.3fr)_minmax(0,0.7fr)] gap-6">
          <div className="space-y-6">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
          <Skeleton className="h-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="page-dashboard">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Monitor coverage, high-risk combinations, and pool status
        </p>
      </div>

      {/* Top Row: Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Warranty"
          value={analytics?.activeCoverage || 0}
          icon={Shield}
          subtitle="Non-expired coverage"
          variant="primary"
        />
        <MetricCard
          title="Replacement Pool"
          value={analytics?.totalSpareUnits || 0}
          icon={Package}
          subtitle="All spare units"
          variant="secondary"
        />
        <MetricCard
          title="Coverage Ratio"
          value={`${(analytics?.averageCoverageRatio || 0).toFixed(1)}%`}
          icon={TrendingUp}
          subtitle="Average pool coverage"
          variant="accent"
        />
        <MetricCard
          title="Expiring Soon"
          value={analytics?.expiringCoverage || 0}
          icon={AlertCircle}
          subtitle={`Within ${analytics?.expiringCoverageDays || 30} days`}
        />
      </div>

      {/* Main Content: 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.3fr)_minmax(0,0.7fr)] gap-6">
        
        {/* Left Column: Charts & Pool Cards */}
        <div className="space-y-6">
          {/* Coverage Trend Chart */}
          <Card className="rounded-2xl border border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Coverage Trend</CardTitle>
              <CardDescription className="text-sm">Warranties expiring over time</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={coverageExpirationData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="month"
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "12px",
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

          {/* Coverage Pools Summary */}
          <Card className="rounded-2xl border border-border">
            <CardHeader className="pb-4 border-b border-border">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg font-semibold">Coverage Pools</CardTitle>
                  <CardDescription className="text-sm">Pool status with metrics</CardDescription>
                </div>
                <Link href="/coverage-pools">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 p-6 pt-4">
                  {poolCoverageStats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Package className="h-10 w-10 text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground">No pools configured yet</p>
                    </div>
                  ) : (
                    poolCoverageStats.map((pool: any) => (
                      <Link key={pool.id} href={`/pools/${pool.id}`}>
                        <Card className="transition-shadow hover:shadow-sm cursor-pointer border border-border" data-testid={`pool-card-${pool.id}`}>
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold truncate">{pool.name}</h4>
                                <p className="text-xs text-muted-foreground truncate mt-1">
                                  {pool.specifications.slice(0, 2).join(' • ')}
                                </p>
                              </div>
                              <Badge 
                                variant={pool.coverage < 50 ? 'destructive' : pool.coverage < 75 ? 'default' : 'outline'}
                                className="shrink-0"
                              >
                                {pool.coverage}%
                              </Badge>
                            </div>
                            <div className="grid grid-cols-4 gap-3 text-center">
                              <div>
                                <div className="text-muted-foreground text-xs">Covered</div>
                                <div className="font-semibold text-sm mt-1">{pool.coveredCount}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground text-xs">Spare</div>
                                <div className="font-semibold text-sm mt-1">{pool.spareCount}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground text-xs">Run Rate</div>
                                <div className="font-semibold text-sm mt-1">{pool.runRate || '0'}/mo</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground text-xs">Available</div>
                                <div className="font-semibold text-sm mt-1">{pool.availableStockCount || '0'}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Risk Analysis Table (70%) */}
        <div>
          <RiskAnalysisTable />
        </div>
      </div>
    </div>
  );
}
