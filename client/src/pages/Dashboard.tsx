import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Package, TrendingUp, AlertCircle, ArrowRight, BarChart3, Layers, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CoveragePoolWithStats } from "@shared/schema";
import RiskAnalysisTable from "@/components/RiskAnalysisTable";
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
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

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
    
    return Object.entries(makeGroups)
      .map(([make, data]: [string, any]) => ({
        make,
        coverageRatio: data.warrantyStockCount > 0 ? ((data.replacementCount / data.warrantyStockCount) * 100) : 0,
        replacementCount: data.replacementCount,
        warrantyStockCount: data.warrantyStockCount,
      }))
      .slice(0, 5);
  })();

  // Generate coverage status distribution
  const statusDistribution = (() => {
    if (!stockUnderWarranty || !Array.isArray(stockUnderWarranty)) return [];
    
    return [
      { 
        name: "Active", 
        value: stockUnderWarranty.filter((c: any) => c.isCoverageActive).length, 
        color: "hsl(var(--primary))" 
      },
      { 
        name: "Expiring", 
        value: stockUnderWarranty.filter((c: any) => {
          if (!c.isCoverageActive) return false;
          const daysRemaining = Math.floor((new Date(c.coverageEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          return daysRemaining < 30;
        }).length, 
        color: "hsl(var(--destructive))" 
      },
      { 
        name: "Inactive", 
        value: stockUnderWarranty.filter((c: any) => !c.isCoverageActive).length, 
        color: "hsl(var(--muted-foreground))" 
      },
    ];
  })();

  if (analyticsLoading || statsLoading || stockUnderWarrantyLoading || replacementUnitsLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="border-b bg-background px-8 py-6">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex-1 p-8">
          <div className="grid grid-cols-12 gap-6 h-full">
            <Skeleton className="col-span-3 h-48" />
            <Skeleton className="col-span-3 h-48" />
            <Skeleton className="col-span-6 row-span-2 h-96" />
            <Skeleton className="col-span-6 row-span-2 h-96" />
            <Skeleton className="col-span-6 h-96" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-background to-muted/20 px-8 py-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3" data-testid="page-dashboard">
            <Activity className="h-9 w-9 text-primary" />
            Coverage Overview
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Real-time monitoring of warranty coverage, pool performance, and risk indicators
          </p>
        </div>
      </div>

      {/* Bento Box Grid Layout */}
      <div className="flex-1 overflow-auto p-8">
        <div className="grid grid-cols-12 gap-6 auto-rows-fr">
          
          {/* Active Warranty - Large Stat Card */}
          <Card className="col-span-12 md:col-span-6 lg:col-span-3 rounded-2xl border hover-elevate transition-all">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Shield className="h-7 w-7 text-primary" />
                </div>
                <Badge variant="outline">Active</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Active Warranties</p>
                <p className="text-5xl font-bold tracking-tight">{analytics?.activeCoverage?.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground">Non-expired coverage units</p>
              </div>
            </CardContent>
          </Card>

          {/* Replacement Pool - Large Stat Card */}
          <Card className="col-span-12 md:col-span-6 lg:col-span-3 rounded-2xl border hover-elevate transition-all">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-secondary/10 rounded-xl">
                  <Package className="h-7 w-7 text-secondary" />
                </div>
                <Badge variant="outline">Inventory</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Spare Units</p>
                <p className="text-5xl font-bold tracking-tight">{analytics?.totalSpareUnits?.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground">Available replacement pool</p>
              </div>
            </CardContent>
          </Card>

          {/* Coverage Distribution Pie Chart - Wider Card */}
          <Card className="col-span-12 md:col-span-6 lg:col-span-6 lg:row-span-2 rounded-2xl border">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Layers className="h-6 w-6 text-primary" />
                    Coverage Status Distribution
                  </CardTitle>
                  <CardDescription className="mt-1">Breakdown by warranty status</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
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
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  {statusDistribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <span className="text-2xl font-bold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coverage Ratio - Large Stat Card */}
          <Card className="col-span-12 md:col-span-6 lg:col-span-3 rounded-2xl border hover-elevate transition-all ">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-accent/10 rounded-2xl">
                  <TrendingUp className="h-7 w-7 text-accent" />
                </div>
                <Badge variant="outline" className="bg-background/80">Avg Ratio</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Coverage Ratio</p>
                <p className="text-5xl font-bold tracking-tight">{(analytics?.averageCoverageRatio || 0).toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Average pool coverage</p>
              </div>
            </CardContent>
          </Card>

          {/* Expiring Soon - Alert Card */}
          <Card className="col-span-12 md:col-span-6 lg:col-span-3 rounded-2xl border border-destructive/20 hover-elevate transition-all ">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-destructive/10 rounded-2xl">
                  <AlertCircle className="h-7 w-7 text-destructive" />
                </div>
                <Badge variant="destructive" className="bg-destructive/80">Alert</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Expiring Soon</p>
                <p className="text-5xl font-bold tracking-tight text-destructive">{analytics?.expiringCoverage || 0}</p>
                <p className="text-xs text-muted-foreground">Within {analytics?.expiringCoverageDays || 30} days</p>
              </div>
            </CardContent>
          </Card>

          {/* Coverage Pools - Scrollable List */}
          <Card className="col-span-12 lg:col-span-6 lg:row-span-2 rounded-2xl border">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Package className="h-6 w-6 text-primary" />
                    Coverage Pools
                  </CardTitle>
                  <CardDescription className="mt-1">Active pool configurations</CardDescription>
                </div>
                <Link href="/coverage-pools">
                  <Button variant="ghost" size="sm" className="gap-2">
                    View All
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[440px]">
                <div className="p-6 space-y-3">
                  {poolCoverageStats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="p-4 bg-muted rounded-full mb-4">
                        <Package className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium">No pools configured</p>
                      <p className="text-sm text-muted-foreground mt-1">Create a pool to start tracking coverage</p>
                    </div>
                  ) : (
                    poolCoverageStats.map((pool: any) => (
                      <Link key={pool.id} href={`/pools/${pool.id}`}>
                        <Card className="hover-elevate active-elevate-2 transition-all cursor-pointer border" data-testid={`pool-card-${pool.id}`}>
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-base truncate mb-1">{pool.name}</h4>
                                <p className="text-sm text-muted-foreground truncate">
                                  {pool.specifications.slice(0, 2).join(' • ')}
                                </p>
                              </div>
                              <Badge 
                                variant={pool.coverage < 50 ? 'destructive' : 'default'}
                                className="text-lg px-3 py-1 shrink-0"
                              >
                                {pool.coverage}%
                              </Badge>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              <div className="text-center p-2 rounded-lg bg-muted/50">
                                <div className="text-xs text-muted-foreground mb-1">Covered</div>
                                <div className="font-bold text-base">{pool.coveredCount}</div>
                              </div>
                              <div className="text-center p-2 rounded-lg bg-muted/50">
                                <div className="text-xs text-muted-foreground mb-1">Spare</div>
                                <div className="font-bold text-base">{pool.spareCount}</div>
                              </div>
                              <div className="text-center p-2 rounded-lg bg-muted/50">
                                <div className="text-xs text-muted-foreground mb-1">Run Rate</div>
                                <div className="font-bold text-base">{pool.runRate || '0'}/mo</div>
                              </div>
                              <div className="text-center p-2 rounded-lg bg-muted/50">
                                <div className="text-xs text-muted-foreground mb-1">Stock</div>
                                <div className="font-bold text-base">{pool.availableStockCount || '0'}</div>
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

          {/* Coverage by Manufacturer - Bar Chart */}
          <Card className="col-span-12 lg:col-span-6 rounded-2xl border">
            <CardHeader className="border-b">
              <CardTitle className="text-2xl flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                Coverage by Manufacturer
              </CardTitle>
              <CardDescription>Top 5 makes by coverage ratio</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={coverageRatioByMake}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="make" 
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    label={{ value: 'Coverage %', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))' } }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Coverage Ratio']}
                  />
                  <Bar 
                    dataKey="coverageRatio" 
                    fill="hsl(var(--primary))" 
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Expiration Trend - Line Chart */}
          <Card className="col-span-12 lg:col-span-6 rounded-2xl border">
            <CardHeader className="border-b">
              <CardTitle className="text-2xl flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                Expiration Forecast
              </CardTitle>
              <CardDescription>Warranties expiring over next 6 months</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={coverageExpirationData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    label={{ value: 'Units', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))' } }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expiring"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--destructive))", r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* High-Risk Combinations - Full Width */}
          <div className="col-span-12">
            <RiskAnalysisTable />
          </div>
        </div>
      </div>
    </div>
  );
}
