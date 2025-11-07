import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import MetricCard from "@/components/MetricCard";
import RiskAnalysisTable from "@/components/RiskAnalysisTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor coverage, high-risk combinations, and pool status
          </p>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.25fr)_minmax(0,0.5fr)_minmax(0,0.25fr)] gap-6">
          <div className="space-y-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="page-dashboard">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor coverage, high-risk combinations, and pool status
        </p>
      </div>

      {/* 3-Column Layout: 25% - 50% - 25% */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.25fr)_minmax(0,0.5fr)_minmax(0,0.25fr)] gap-6">
        
        {/* Left Column: Summary Cards & Charts */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4">
            <MetricCard
              title="Active Warranty"
              value={analytics?.activeCoverage || 0}
              icon={Shield}
              subtitle="Non-expired coverage"
              data-testid="card-active-warranty"
            />
            <MetricCard
              title="Replacement Pool"
              value={analytics?.totalSpareUnits || 0}
              icon={Package}
              subtitle="All spare units"
              data-testid="card-total-replacement-pool"
            />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <h3 className="text-sm font-medium">Coverage Trend</h3>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
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

          <Card>
            <CardHeader className="pb-2">
              <h3 className="text-sm font-medium">Coverage by Make</h3>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={coverageRatioByMake.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="make"
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
                    formatter={(value: any) => [`${value}%`, 'Coverage']}
                  />
                  <Bar dataKey="coverageRatio" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Center Column: Risk Analysis Table */}
        <div>
          <RiskAnalysisTable />
        </div>

        {/* Right Column: Compact Pool Summary */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Coverage Pools</CardTitle>
              <CardDescription className="text-xs">Active pool status</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <div className="space-y-3 p-6 pt-0">
                  {poolCoverageStats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Package className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground">No pools yet</p>
                    </div>
                  ) : (
                    poolCoverageStats.map((pool: any) => (
                      <Link key={pool.id} href={`/pools/${pool.id}`}>
                        <Card className="hover-elevate cursor-pointer" data-testid={`pool-card-${pool.id}`}>
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium truncate">{pool.name}</h4>
                                <p className="text-xs text-muted-foreground truncate">
                                  {pool.specifications.slice(0, 2).join(' • ')}
                                </p>
                              </div>
                              <Badge 
                                variant={pool.coverage < 50 ? 'destructive' : pool.coverage < 75 ? 'default' : 'outline'}
                                className="ml-2 shrink-0"
                              >
                                {pool.coverage}%
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-3">
                                <div>
                                  <div className="text-muted-foreground">Covered</div>
                                  <div className="font-medium">{pool.coveredCount}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Spare</div>
                                  <div className="font-medium">{pool.spareCount}</div>
                                </div>
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
      </div>
    </div>
  );
}
