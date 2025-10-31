import { useMemo, useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Package, Target, Calendar, ArrowUpRight, ArrowDownRight, Minus, HelpCircle, Download, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import DataTable, { Column } from "@/components/DataTable";
import * as XLSX from "xlsx";
import type { CoveragePoolAnalytics, MonthlyAnalytics } from "@shared/schema";

export default function PoolDetail() {
  const [, params] = useRoute("/pools/:poolId");
  const poolId = params?.poolId;
  const { toast } = useToast();

  // Fetch pool analytics
  const { data: analytics, isLoading } = useQuery<CoveragePoolAnalytics>({
    queryKey: [`/api/coverage-pools/${poolId}/analytics`],
    enabled: !!poolId,
  });

  // Fetch pool details for filter criteria
  const { data: poolData } = useQuery<{ filterCriteria: string }>({
    queryKey: [`/api/coverage-pools/${poolId}`],
    enabled: !!poolId,
  });

  // Loading state
  if (isLoading || !analytics) {
    return (
      <main className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  // Prepare chart data combining historical and forecast
  const chartData = [
    ...analytics.monthlyData.map(m => ({
      month: m.monthLabel,
      claims: m.claims,
      replacements: m.replacements,
      type: 'actual' as const,
    })),
    ...analytics.forecast.map(f => ({
      month: f.monthLabel,
      claims: f.forecastClaims,
      replacements: f.forecastClaims, // Forecast replacements to match forecast claims (assuming target fulfillment)
      type: 'forecast' as const,
      confidenceLower: f.confidenceLower,
      confidenceUpper: f.confidenceUpper,
    })),
  ];

  // Monthly breakdown table columns
  const monthlyColumns: Column<MonthlyAnalytics>[] = [
    {
      key: "monthLabel",
      header: "Month",
      render: (row) => <span className="font-medium">{row.monthLabel}</span>,
    },
    {
      key: "claims",
      header: "Claims",
      render: (row) => (
        <div className="flex items-center gap-2">
          <span>{row.claims}</span>
          {row.claimsGrowthMoM !== undefined && (
            <Badge variant={row.claimsGrowthMoM > 0 ? "destructive" : "secondary"} className="text-xs">
              {row.claimsGrowthMoM > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : row.claimsGrowthMoM < 0 ? <ArrowDownRight className="w-3 h-3 mr-1" /> : <Minus className="w-3 h-3 mr-1" />}
              {Math.abs(row.claimsGrowthMoM).toFixed(1)}%
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "replacements",
      header: "Replacements",
      render: (row) => row.replacements,
    },
    {
      key: "fulfillmentRate",
      header: "Fulfillment Rate",
      render: (row) => (
        <Badge variant={row.fulfillmentRate >= 100 ? "default" : row.fulfillmentRate >= 80 ? "secondary" : "destructive"}>
          {row.fulfillmentRate.toFixed(1)}%
        </Badge>
      ),
    },
    {
      key: "netBacklog",
      header: "Net Backlog",
      render: (row) => (
        <span className={row.netBacklog > 0 ? "text-destructive font-medium" : row.netBacklog < 0 ? "text-muted-foreground" : ""}>
          {row.netBacklog > 0 ? "+" : ""}{row.netBacklog}
        </span>
      ),
    },
    {
      key: "coverageRatio",
      header: "Coverage %",
      render: (row) => `${row.coverageRatio.toFixed(1)}%`,
    },
  ];

  // Determine recommendation status
  const isOnTarget = analytics.currentCoverageRatio >= analytics.targetCoverageRatio;
  const hasGoodRunway = analytics.inventoryRunwayMonths >= 3;

  // Export functions
  const handleExport = async (type: 'spare' | 'covered' | 'claims' | 'replacements') => {
    try {
      if (!poolData || !analytics) {
        toast({
          title: "Export Failed",
          description: "Pool data not loaded yet. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const filterCriteria = JSON.parse(poolData.filterCriteria);
      
      let endpoint = '';
      let filename = '';
      let dataType = '';
      
      switch (type) {
        case 'spare':
          endpoint = '/api/spare-units';
          filename = `${analytics.poolName}_SpareUnits.xlsx`;
          dataType = 'Spare Units';
          break;
        case 'covered':
          endpoint = '/api/covered-units';
          filename = `${analytics.poolName}_CoveredUnits.xlsx`;
          dataType = 'Covered Units';
          break;
        case 'claims':
          endpoint = '/api/claims';
          filename = `${analytics.poolName}_Claims.xlsx`;
          dataType = 'Claims';
          break;
        case 'replacements':
          endpoint = '/api/replacements';
          filename = `${analytics.poolName}_Replacements.xlsx`;
          dataType = 'Replacements';
          break;
      }
      
      // Build query params from filter criteria
      const params = new URLSearchParams();
      if (filterCriteria.make?.length) params.append('make', filterCriteria.make.join(','));
      if (filterCriteria.model?.length) params.append('model', filterCriteria.model.join(','));
      if (filterCriteria.processor?.length) params.append('processor', filterCriteria.processor.join(','));
      if (filterCriteria.ram?.length) params.append('ram', filterCriteria.ram.join(','));
      if (filterCriteria.category?.length) params.append('category', filterCriteria.category.join(','));
      
      const response = await fetch(`${endpoint}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        toast({
          title: "No Data",
          description: `No ${dataType.toLowerCase()} found matching the pool criteria.`,
        });
        return;
      }
      
      // Create worksheet and workbook
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, type.charAt(0).toUpperCase() + type.slice(1));
      
      // Download file
      XLSX.writeFile(wb, filename);
      
      toast({
        title: "Export Successful",
        description: `Downloaded ${data.length} ${dataType.toLowerCase()} to ${filename}`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <main className="container mx-auto p-6 space-y-6" data-testid="page-pool-detail">
      {/* Breadcrumb & Actions */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Link href="/coverage-pools">
            <Button variant="ghost" size="icon" data-testid="button-back-to-pools">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold" data-testid="text-pool-name">{analytics.poolName}</h1>
          <Badge variant="outline" className="text-xs">
            <Calendar className="w-3 h-3 mr-1" />
            {analytics.timeRangeMonths} months
          </Badge>
        </div>
        
        {/* Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" data-testid="button-export-dropdown">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport('spare')} data-testid="menu-export-spare">
              Export Spare Units ({analytics.currentSpareCount})
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('covered')} data-testid="menu-export-covered">
              Export Covered Units ({analytics.currentCoveredCount})
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleExport('claims')} data-testid="menu-export-claims">
              Export Claims ({analytics.totalClaims})
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('replacements')} data-testid="menu-export-replacements">
              Export Replacements ({analytics.totalReplacements})
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Recommendations Alert */}
      {!isOnTarget && (
        <Alert variant="destructive" data-testid="alert-recommendations">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Action Required</AlertTitle>
          <AlertDescription>{analytics.recommendedAction}</AlertDescription>
        </Alert>
      )}

      {isOnTarget && !hasGoodRunway && (
        <Alert data-testid="alert-recommendations">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Low Inventory Runway</AlertTitle>
          <AlertDescription>{analytics.recommendedAction}</AlertDescription>
        </Alert>
      )}

      {isOnTarget && hasGoodRunway && (
        <Alert data-testid="alert-recommendations" className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-800 dark:text-green-200">On Track</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">{analytics.recommendedAction}</AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Coverage Ratio */}
        <Card data-testid="card-coverage-ratio">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Coverage Ratio</CardTitle>
              <UITooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Percentage of covered units protected by spare units. Formula: (Spare Units / Covered Units) × 100%</p>
                </TooltipContent>
              </UITooltip>
            </div>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="value-coverage-ratio">
              {analytics.currentCoverageRatio.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Target: {analytics.targetCoverageRatio}% 
              {analytics.currentCoverageRatio >= analytics.targetCoverageRatio ? (
                <CheckCircle2 className="inline w-3 h-3 ml-1 text-green-600" />
              ) : (
                <AlertTriangle className="inline w-3 h-3 ml-1 text-destructive" />
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {analytics.currentSpareCount} spare / {analytics.currentCoveredCount} covered
            </p>
          </CardContent>
        </Card>

        {/* Fulfillment Rate */}
        <Card data-testid="card-fulfillment-rate">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Avg Fulfillment</CardTitle>
              <UITooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Average rate of warranty claims fulfilled with replacement units. Higher percentages indicate better service.</p>
                </TooltipContent>
              </UITooltip>
            </div>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="value-fulfillment-rate">
              {analytics.averageFulfillmentRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.totalReplacements} of {analytics.totalClaims} claims fulfilled
            </p>
            <p className="text-xs text-muted-foreground">
              Net backlog: {analytics.totalNetBacklog > 0 ? "+" : ""}{analytics.totalNetBacklog}
            </p>
          </CardContent>
        </Card>

        {/* Claims Growth */}
        <Card data-testid="card-claims-growth">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Claims Growth</CardTitle>
              <UITooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Month-over-month percentage change in warranty claims. Positive (red) means increasing claims, negative (green) means decreasing.</p>
                </TooltipContent>
              </UITooltip>
            </div>
            {analytics.claimsGrowthMoM > 0 ? (
              <TrendingUp className="h-4 w-4 text-destructive" />
            ) : analytics.claimsGrowthMoM < 0 ? (
              <TrendingDown className="h-4 w-4 text-green-600" />
            ) : (
              <Minus className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${analytics.claimsGrowthMoM > 0 ? 'text-destructive' : analytics.claimsGrowthMoM < 0 ? 'text-green-600' : ''}`} data-testid="value-claims-growth">
              {analytics.claimsGrowthMoM > 0 ? "+" : ""}{analytics.claimsGrowthMoM.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Month-over-month
            </p>
            {analytics.claimsGrowthYoY !== undefined && (
              <p className="text-xs text-muted-foreground">
                YoY: {analytics.claimsGrowthYoY > 0 ? "+" : ""}{analytics.claimsGrowthYoY.toFixed(1)}%
              </p>
            )}
          </CardContent>
        </Card>

        {/* Inventory Runway */}
        <Card data-testid="card-inventory-runway">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Inventory Runway</CardTitle>
              <UITooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Months of spare unit coverage at current claim rate. Indicates how long inventory will last before restocking needed.</p>
                </TooltipContent>
              </UITooltip>
            </div>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="value-inventory-runway">
              {analytics.inventoryRunwayMonths >= 999 ? "∞" : analytics.inventoryRunwayMonths.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.inventoryRunwayMonths >= 999 ? "No claims in period" : "months at current rate"}
            </p>
            <p className="text-xs text-muted-foreground">
              {analytics.unitsNeededForTarget > 0 ? (
                <span className="text-destructive">Need {analytics.unitsNeededForTarget} more units</span>
              ) : (
                <span className="text-green-600">Meets target coverage</span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Available Stock */}
        <Card data-testid="card-available-stock" className="border-blue-200 dark:border-blue-900">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Available Stock</CardTitle>
              <UITooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Units matching pool criteria available outside the warranty pool. Can be allocated on-demand to address coverage deficits or urgent requirements.</p>
                </TooltipContent>
              </UITooltip>
            </div>
            <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="value-available-stock">
              {analytics.currentAvailableStockCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              units ready to allocate
            </p>
            <p className="text-xs text-muted-foreground">
              {analytics.currentAvailableStockCount > 0 ? (
                <span className="text-blue-600 dark:text-blue-400">Can supplement spare pool</span>
              ) : (
                <span className="text-muted-foreground">No matching units available</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Claims vs Replacements Trend Chart */}
      <Card data-testid="card-trend-chart">
        <CardHeader>
          <CardTitle>Claims vs Replacements Trend</CardTitle>
          <CardDescription>
            Historical data ({analytics.timeRangeMonths} months) with 3-month forecast
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold mb-1">{data.month}</p>
                        {data.type === 'actual' ? (
                          <>
                            <p className="text-sm text-destructive">Claims: {data.claims}</p>
                            <p className="text-sm text-green-600">Replacements: {data.replacements}</p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-muted-foreground font-medium">Forecast</p>
                            <p className="text-sm text-destructive">Claims: {data.claims}</p>
                            <p className="text-sm text-green-600">Replacements: {data.replacements}</p>
                            {data.confidenceLower !== undefined && (
                              <p className="text-xs text-muted-foreground">
                                Confidence: {data.confidenceLower} - {data.confidenceUpper}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    );
                  }}
                />
                <Legend />
                <ReferenceLine x={analytics.monthlyData[analytics.monthlyData.length - 1]?.monthLabel} stroke="#888" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="claims"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Claims"
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="replacements"
                  stroke="hsl(142, 76%, 36%)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Replacements"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Breakdown Table */}
      <Card data-testid="card-monthly-breakdown">
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
          <CardDescription>
            Detailed month-by-month analysis of claims, replacements, and coverage metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={analytics.monthlyData}
            columns={monthlyColumns}
          />
        </CardContent>
      </Card>
    </main>
  );
}
