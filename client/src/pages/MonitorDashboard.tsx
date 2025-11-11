import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  AlertTriangle,
  Filter,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronRightIcon,
  Package,
  Shield,
  TrendingDown,
  X,
  Bell,
  FolderPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addMonths, subMonths, eachDayOfInterval } from "date-fns";
import type { CoveragePoolWithStats } from "@shared/schema";
import type { RiskCombination, RiskLevel } from "@shared/risk-analysis-types";
import { formatRiskLevel } from "@shared/risk-analysis-types";

interface CoveredUnit {
  id: string;
  coverageEndDate: string;
  isCoverageActive: boolean;
  orderNumber?: string;
  customerName?: string;
  make?: string;
  model?: string;
}

interface HeatmapCell {
  date: Date;
  count: number;
  units: CoveredUnit[];
}

// Helper to create stable identifier for risk combinations
const getRiskComboKey = (combo: RiskCombination): string => {
  return `${combo.make}|${combo.model}|${combo.processor || 'null'}|${combo.generation || 'null'}`;
};

const riskBadgeClass = (level: RiskLevel) => {
  switch (level) {
    case 'critical': 
      return 'border bg-red-600 text-white border-red-700 dark:bg-red-700 dark:border-red-800 font-bold rounded-full shadow-sm';
    case 'high': 
      return 'border bg-orange-500 text-white border-orange-600 dark:bg-orange-600 dark:border-orange-700 font-bold rounded-full shadow-sm';
    case 'medium': 
      return 'border bg-amber-300 text-amber-900 border-amber-400 dark:bg-amber-400 dark:text-amber-950 dark:border-amber-500 font-semibold rounded-full';
    case 'low': 
      return 'border bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-100 dark:border-green-700 font-medium rounded-full';
    default: 
      return 'border bg-muted text-muted-foreground border-border rounded-full';
  }
};

function HeatmapDay({
  cell,
  maxCount,
}: {
  cell: HeatmapCell;
  maxCount: number;
}) {
  const intensity = maxCount > 0 ? (cell.count / maxCount) * 100 : 0;

  const getBgColor = () => {
    if (intensity === 0) return "bg-muted/10";
    if (intensity < 20) return "bg-accent/20";
    if (intensity < 40) return "bg-amber-400/30";
    if (intensity < 60) return "bg-orange-500/40";
    if (intensity < 80) return "bg-destructive/50";
    return "bg-destructive/70";
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.15 }}
          className={cn(
            "w-3 h-3 rounded-sm border border-border/40 transition-all cursor-pointer",
            getBgColor(),
            cell.count > 0 && "hover:ring-2 hover:ring-primary/50"
          )}
          data-testid={`heatmap-day-${format(cell.date, 'yyyy-MM-dd')}`}
        />
      </TooltipTrigger>
      <TooltipContent side="top" align="start">
        <div className="space-y-2">
          <p className="text-sm font-semibold">
            {format(cell.date, 'MMM d, yyyy')}
          </p>
          <div className="flex items-center gap-2">
            <Badge variant={cell.count > 5 ? "destructive" : cell.count > 0 ? "secondary" : "outline"}>
              {cell.count} {cell.count === 1 ? 'unit' : 'units'} expiring
            </Badge>
          </div>
          {cell.count > 0 && cell.count <= 5 && (
            <div className="text-xs text-muted-foreground space-y-1 max-w-xs">
              {cell.units.slice(0, 5).map((unit, i) => (
                <div key={i} className="truncate">
                  {unit.orderNumber || 'N/A'} - {unit.make} {unit.model}
                </div>
              ))}
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export default function MonitorDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const riskCombinationsRef = useRef<HTMLDivElement>(null);
  const [startDate, setStartDate] = useState(() => subMonths(new Date(), 1));
  const [filters, setFilters] = useState({
    orderNumber: "",
    customerName: "",
    make: "",
    model: "",
  });
  const [selectedRiskItems, setSelectedRiskItems] = useState<Set<string>>(new Set());
  const [excludeZeroCovered, setExcludeZeroCovered] = useState(true);
  const [riskFilters, setRiskFilters] = useState({
    search: "",
    riskLevel: "all",
  });

  const endDate = useMemo(() => addMonths(startDate, 6), [startDate]);
  const hasBulkSelection = selectedRiskItems.size > 1;

  const { data: coveredUnits, isLoading } = useQuery<CoveredUnit[]>({
    queryKey: ["/api/covered-units"],
  });

  const { data: pools } = useQuery<CoveragePoolWithStats[]>({
    queryKey: ["/api/coverage-pools-with-stats"],
  });

  const { data: riskCombinations } = useQuery<RiskCombination[]>({
    queryKey: ['/api/risk-combinations', { 
      sortBy: 'riskScore', 
      sortOrder: 'desc', 
      limit: 10,
      offset: 0,
      excludeZeroCovered: excludeZeroCovered,
    }],
  });

  const filteredRiskCombinations = useMemo(() => {
    if (!riskCombinations) return [];
    
    return riskCombinations.filter((combo) => {
      const searchLower = riskFilters.search.toLowerCase();
      const matchesSearch = !riskFilters.search || 
        combo.make?.toLowerCase().includes(searchLower) ||
        combo.model?.toLowerCase().includes(searchLower) ||
        combo.processor?.toLowerCase().includes(searchLower);
      
      const matchesRiskLevel = !riskFilters.riskLevel || 
        riskFilters.riskLevel === "all" ||
        combo.risk_level === riskFilters.riskLevel;
      
      return matchesSearch && matchesRiskLevel;
    });
  }, [riskCombinations, riskFilters]);

  // Mutations for creating pools and sending alerts
  const createPoolMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; filterCriteria: string }) => {
      const res = await apiRequest("POST", "/api/coverage-pools", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/coverage-pools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coverage-pools-with-stats"] });
      toast({
        title: "Pool Created Successfully",
        description: `Coverage pool "${data.name}" has been created.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Pool Creation Failed",
        description: error.message || "Failed to create coverage pool. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendAlertMutation = useMutation({
    mutationFn: async (combinations: RiskCombination[]) => {
      const res = await apiRequest("POST", "/api/risk-combinations/send-alert", { combinations });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Alert Sent Successfully",
        description: data.message || "High-risk alert sent to configured webhook.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Alert Failed",
        description: error.message || "Failed to send alert. Please check your webhook configuration.",
        variant: "destructive",
      });
    },
  });

  // Action handlers
  const handleCreatePool = (combo: RiskCombination) => {
    const poolName = `${combo.make} ${combo.model}${combo.processor ? ` (${combo.processor})` : ''}`;
    const filterCriteria = JSON.stringify({
      make: combo.make,
      model: combo.model,
      processor: combo.processor ? [combo.processor] : undefined,
      generation: combo.generation ? [combo.generation] : undefined,
    });
    
    createPoolMutation.mutate({
      name: poolName,
      description: `Automatically created pool for ${combo.make} ${combo.model} - Risk Level: ${combo.risk_level}`,
      filterCriteria,
    });
  };

  const handleSendAlert = (combo: RiskCombination) => {
    sendAlertMutation.mutate([combo]);
  };

  const handleCreateCombinedPool = () => {
    if (selectedRiskItems.size === 0) return;
    
    const selectedCombinations = filteredRiskCombinations?.filter(combo => 
      selectedRiskItems.has(getRiskComboKey(combo))
    ) || [];
    
    if (selectedCombinations.length === 0) return;
    
    // Create a combined filter criteria with arrays of makes, models, etc.
    const makes = Array.from(new Set(selectedCombinations.map(c => c.make)));
    const models = Array.from(new Set(selectedCombinations.map(c => c.model)));
    const processors = Array.from(new Set(selectedCombinations.map(c => c.processor).filter(Boolean)));
    const generations = Array.from(new Set(selectedCombinations.map(c => c.generation).filter(Boolean)));
    
    const poolName = `Combined Risk Pool (${selectedCombinations.length} combinations)`;
    const filterCriteria = JSON.stringify({
      make: makes.length > 0 ? makes : undefined,
      model: models.length > 0 ? models : undefined,
      processor: processors.length > 0 ? processors : undefined,
      generation: generations.length > 0 ? generations : undefined,
    });
    
    createPoolMutation.mutate(
      {
        name: poolName,
        description: `Combined pool covering ${makes.join(", ")} with ${selectedCombinations.length} risk combinations`,
        filterCriteria,
      },
      {
        onSuccess: () => {
          setSelectedRiskItems(new Set()); // Clear selection after success
        },
      }
    );
  };

  const handleSendCombinedAlert = () => {
    if (selectedRiskItems.size === 0) return;
    
    const selectedCombinations = filteredRiskCombinations?.filter(combo => 
      selectedRiskItems.has(getRiskComboKey(combo))
    ) || [];
    
    if (selectedCombinations.length === 0) return;
    
    sendAlertMutation.mutate(selectedCombinations, {
      onSuccess: () => {
        setSelectedRiskItems(new Set()); // Clear selection after success
      },
    });
  };

  // Filter and map warranty expiration data
  const heatmapData = useMemo(() => {
    if (!coveredUnits) return [];

    const filtered = coveredUnits.filter((unit) => {
      if (!unit.isCoverageActive) return false;
      const endDate = new Date(unit.coverageEndDate);
      if (endDate < startDate || endDate > addMonths(startDate, 6)) return false;

      if (filters.orderNumber && !unit.orderNumber?.toLowerCase().includes(filters.orderNumber.toLowerCase())) return false;
      if (filters.customerName && !unit.customerName?.toLowerCase().includes(filters.customerName.toLowerCase())) return false;
      if (filters.make && !unit.make?.toLowerCase().includes(filters.make.toLowerCase())) return false;
      if (filters.model && !unit.model?.toLowerCase().includes(filters.model.toLowerCase())) return false;

      return true;
    });

    const days = eachDayOfInterval({ start: startDate, end: addMonths(startDate, 6) });
    
    return days.map((date) => {
      const unitsExpiringOnDay = filtered.filter((unit) => {
        const endDate = new Date(unit.coverageEndDate);
        return (
          endDate.getFullYear() === date.getFullYear() &&
          endDate.getMonth() === date.getMonth() &&
          endDate.getDate() === date.getDate()
        );
      });

      return {
        date,
        count: unitsExpiringOnDay.length,
        units: unitsExpiringOnDay,
      };
    });
  }, [coveredUnits, startDate, filters]);

  const maxCount = useMemo(
    () => Math.max(...heatmapData.map((d) => d.count), 1),
    [heatmapData]
  );

  const totalExpiring = useMemo(
    () => heatmapData.reduce((sum, cell) => sum + cell.count, 0),
    [heatmapData]
  );

  const peakDay = useMemo(
    () => heatmapData.reduce((max, cell) => (cell.count > max.count ? cell : max), heatmapData[0] || { count: 0, date: new Date(), units: [] }),
    [heatmapData]
  );

  const highRiskDays = useMemo(
    () => heatmapData.filter((cell) => cell.count > 5).length,
    [heatmapData]
  );

  const heatmapWeeks = useMemo(() => {
    const weeks: HeatmapCell[][] = [];
    let currentWeek: HeatmapCell[] = [];
    
    const firstDay = heatmapData[0];
    if (firstDay) {
      const dayOfWeek = firstDay.date.getDay();
      for (let i = 0; i < dayOfWeek; i++) {
        currentWeek.push({ date: new Date(), count: -1, units: [] });
      }
    }

    heatmapData.forEach((cell) => {
      currentWeek.push(cell);
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: new Date(), count: -1, units: [] });
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [heatmapData]);

  const monthHeaders = useMemo(() => {
    const headers: { weekIndex: number; month: string }[] = [];
    let lastMonth = -1;

    heatmapWeeks.forEach((week, weekIndex) => {
      const firstRealDay = week.find(cell => cell.count !== -1);
      if (firstRealDay) {
        const month = firstRealDay.date.getMonth();
        if (month !== lastMonth) {
          headers.push({
            weekIndex,
            month: format(firstRealDay.date, 'MMM'),
          });
          lastMonth = month;
        }
      }
    });

    return headers;
  }, [heatmapWeeks]);

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter(v => v).length,
    [filters]
  );

  const clearFilter = (key: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [key]: "" }));
  };

  const sortedPools = useMemo(() => {
    if (!pools) return [];
    return [...pools]
      .sort((a, b) => a.coverageRatio - b.coverageRatio)
      .slice(0, 4);
  }, [pools]);

  const moveTimeWindow = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setStartDate(prev => subMonths(prev, 1));
    } else {
      setStartDate(prev => addMonths(prev, 1));
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-12 w-96" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-9 space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-96" />
            <Skeleton className="h-64" />
          </div>
          <div className="lg:col-span-3">
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="p-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div>
            <h1 className="text-3xl font-bold mb-2">Monitor</h1>
            <p className="text-muted-foreground">
              Track warranty expirations and high-risk combinations
            </p>
          </div>
        </motion.div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: lg:col-span-9 - Insights + Heatmap + Coverage Pools */}
          <div className="lg:col-span-9 space-y-6">
            {/* Insight Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Expiring</p>
                      <p className="text-2xl font-bold" data-testid="text-total-expiring">{totalExpiring}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-destructive/10 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Peak Day</p>
                      <p className="text-2xl font-bold" data-testid="text-peak-count">{peakDay.count}</p>
                      <p className="text-xs text-muted-foreground">
                        {peakDay.date && format(peakDay.date, 'MMM d')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">High-Risk Days</p>
                      <p className="text-2xl font-bold" data-testid="text-high-risk-days">{highRiskDays}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Heatmap Timeline */}
            <Card className="rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Warranty Expiration Timeline</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => moveTimeWindow('prev')}
                      data-testid="button-prev-month"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground min-w-[200px] text-center">
                      {format(startDate, 'MMM yyyy')} - {format(endDate, 'MMM yyyy')}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => moveTimeWindow('next')}
                      data-testid="button-next-month"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Inline Filter Toolbar */}
                <div className="border-t pt-4 pb-2">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Input
                      placeholder="Order #"
                      className="max-w-[150px]"
                      value={filters.orderNumber}
                      onChange={(e) => setFilters(prev => ({ ...prev, orderNumber: e.target.value }))}
                      data-testid="input-filter-order"
                    />
                    <Input
                      placeholder="Customer"
                      className="max-w-[150px]"
                      value={filters.customerName}
                      onChange={(e) => setFilters(prev => ({ ...prev, customerName: e.target.value }))}
                      data-testid="input-filter-customer"
                    />
                    <Input
                      placeholder="Make"
                      className="max-w-[120px]"
                      value={filters.make}
                      onChange={(e) => setFilters(prev => ({ ...prev, make: e.target.value }))}
                      data-testid="input-filter-make"
                    />
                    <Input
                      placeholder="Model"
                      className="max-w-[120px]"
                      value={filters.model}
                      onChange={(e) => setFilters(prev => ({ ...prev, model: e.target.value }))}
                      data-testid="input-filter-model"
                    />
                  </div>

                  {/* Active Filter Chips */}
                  {activeFilterCount > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {filters.orderNumber && (
                        <Badge variant="secondary" className="gap-1">
                          Order: {filters.orderNumber}
                          <X
                            className="w-3 h-3 cursor-pointer hover-elevate"
                            onClick={() => clearFilter('orderNumber')}
                            data-testid="button-clear-order-filter"
                          />
                        </Badge>
                      )}
                      {filters.customerName && (
                        <Badge variant="secondary" className="gap-1">
                          Customer: {filters.customerName}
                          <X
                            className="w-3 h-3 cursor-pointer hover-elevate"
                            onClick={() => clearFilter('customerName')}
                            data-testid="button-clear-customer-filter"
                          />
                        </Badge>
                      )}
                      {filters.make && (
                        <Badge variant="secondary" className="gap-1">
                          Make: {filters.make}
                          <X
                            className="w-3 h-3 cursor-pointer hover-elevate"
                            onClick={() => clearFilter('make')}
                            data-testid="button-clear-make-filter"
                          />
                        </Badge>
                      )}
                      {filters.model && (
                        <Badge variant="secondary" className="gap-1">
                          Model: {filters.model}
                          <X
                            className="w-3 h-3 cursor-pointer hover-elevate"
                            onClick={() => clearFilter('model')}
                            data-testid="button-clear-model-filter"
                          />
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilters({ orderNumber: "", customerName: "", make: "", model: "" })}
                        className="h-6 text-xs"
                        data-testid="button-clear-filters"
                      >
                        Clear all
                      </Button>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto mt-4">
                  {/* Month Headers */}
                  <div className="flex gap-1 mb-1">
                    {monthHeaders.map((header, index) => (
                      <div
                        key={index}
                        className="text-xs font-semibold text-muted-foreground"
                        style={{
                          marginLeft: index === 0 ? 0 : `${(header.weekIndex - (monthHeaders[index - 1]?.weekIndex || 0)) * 16}px`,
                        }}
                      >
                        {header.month}
                      </div>
                    ))}
                  </div>

                  {/* Grid */}
                  <div className="flex gap-1">
                    {heatmapWeeks.map((week, weekIndex) => (
                      <div key={weekIndex} className="flex flex-col gap-1">
                        {week.map((cell, dayIndex) => (
                          <div key={dayIndex}>
                            {cell.count === -1 ? (
                              <div className="w-3 h-3" data-testid="heatmap-padding" />
                            ) : (
                              <HeatmapDay cell={cell} maxCount={maxCount} />
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-2 mt-6 text-xs text-muted-foreground">
                    <span>Less</span>
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded-sm bg-muted/10 border border-border/40" />
                      <div className="w-3 h-3 rounded-sm bg-accent/20 border border-border/40" />
                      <div className="w-3 h-3 rounded-sm bg-amber-400/30 border border-border/40" />
                      <div className="w-3 h-3 rounded-sm bg-orange-500/40 border border-border/40" />
                      <div className="w-3 h-3 rounded-sm bg-destructive/50 border border-border/40" />
                      <div className="w-3 h-3 rounded-sm bg-destructive/70 border border-border/40" />
                    </div>
                    <span>More</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Coverage Pools */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Low Coverage Pools</h2>
                <Link href="/pools">
                  <Button variant="ghost" size="sm" className="gap-1" data-testid="link-view-all-pools">
                    View All
                    <ChevronRightIcon className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
              
              {sortedPools.length === 0 ? (
                <Card className="rounded-2xl">
                  <CardContent className="p-6 text-center text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No coverage pools available</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sortedPools.map((pool) => {
                    const getCoverageColor = (ratio: number) => {
                      if (ratio >= 15) return "text-green-600 dark:text-green-500";
                      if (ratio >= 10) return "text-yellow-600 dark:text-yellow-500";
                      return "text-red-600 dark:text-red-500";
                    };
                    
                    const coverageRatio = Number(pool.coverageRatio) || 0;

                    return (
                      <Link key={pool.id} href={`/pools/${pool.id}`}>
                        <Card className="rounded-2xl hover-elevate cursor-pointer" data-testid={`card-pool-${pool.id}`}>
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="text-sm font-medium flex-1 line-clamp-1">{pool.name}</h3>
                                <span className={`text-xl font-bold ${getCoverageColor(coverageRatio)}`}>
                                  {coverageRatio.toFixed(1)}%
                                </span>
                              </div>
                              
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{pool.spareCount} spare / {pool.coveredCount} covered</span>
                              </div>
                              
                              <Progress value={coverageRatio} className="h-1" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: lg:col-span-3 - High-Risk Combinations */}
          <div className="lg:col-span-3" ref={riskCombinationsRef}>
            <Card className="rounded-2xl">
              <CardHeader>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">High-Risk Combinations</CardTitle>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                        <Switch
                          checked={!excludeZeroCovered}
                          onCheckedChange={(checked) => setExcludeZeroCovered(!checked)}
                          data-testid="toggle-include-zero-covered"
                        />
                        Include 0 covered
                      </label>
                    </div>
                  </div>
                  
                  {/* Filter inputs */}
                  <div className="flex flex-col gap-2">
                    <Input
                      placeholder="Search make/model/processor..."
                      value={riskFilters.search}
                      onChange={(e) => setRiskFilters({ ...riskFilters, search: e.target.value })}
                      className="text-sm"
                      data-testid="input-risk-search"
                    />
                    <Select
                      value={riskFilters.riskLevel}
                      onValueChange={(value) => setRiskFilters({ ...riskFilters, riskLevel: value })}
                    >
                      <SelectTrigger className="text-sm" data-testid="select-risk-level">
                        <SelectValue placeholder="All risk levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All risk levels</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Select all / Deselect all */}
                  {filteredRiskCombinations && filteredRiskCombinations.length > 0 && (() => {
                    // Check if all filtered items are selected
                    const allFilteredSelected = filteredRiskCombinations.every((combo) => 
                      selectedRiskItems.has(getRiskComboKey(combo))
                    );
                    
                    return (
                      <div className="flex gap-2">
                        {!allFilteredSelected ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const newSelected = new Set(selectedRiskItems);
                              filteredRiskCombinations.forEach((combo) => newSelected.add(getRiskComboKey(combo)));
                              setSelectedRiskItems(newSelected);
                            }}
                            className="flex-1 text-xs"
                            data-testid="button-select-all"
                          >
                            Select All ({filteredRiskCombinations.length})
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const newSelected = new Set(selectedRiskItems);
                              filteredRiskCombinations.forEach((combo) => newSelected.delete(getRiskComboKey(combo)));
                              setSelectedRiskItems(newSelected);
                            }}
                            className="flex-1 text-xs"
                            data-testid="button-deselect-all"
                          >
                            Deselect All
                          </Button>
                        )}
                      </div>
                    );
                  })()}
                  
                  {/* Bulk actions */}
                  {selectedRiskItems.size > 0 && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1 gap-1"
                        onClick={handleSendCombinedAlert}
                        data-testid="button-send-combined-alert"
                      >
                        <Bell className="w-3 h-3" />
                        Send Combined Alert ({selectedRiskItems.size})
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1"
                        onClick={handleCreateCombinedPool}
                        data-testid="button-create-combined-pool"
                      >
                        <FolderPlus className="w-3 h-3" />
                        Create Combined Pool ({selectedRiskItems.size})
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {!filteredRiskCombinations || filteredRiskCombinations.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No high-risk combinations found</p>
                  </div>
                ) : (
                  <div>
                    <div className="space-y-3">
                      {filteredRiskCombinations.map((combo, index) => {
                        const comboKey = getRiskComboKey(combo);
                        const isSelected = selectedRiskItems.has(comboKey);
                        
                        return (
                          <Card key={comboKey} className="rounded-xl hover-elevate">
                            <CardContent className="p-3">
                              <div className="space-y-2">
                                <div className="flex items-start gap-2">
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={(checked) => {
                                      const newSelected = new Set(selectedRiskItems);
                                      if (checked) {
                                        newSelected.add(comboKey);
                                      } else {
                                        newSelected.delete(comboKey);
                                      }
                                      setSelectedRiskItems(newSelected);
                                    }}
                                    data-testid={`checkbox-risk-${index}`}
                                  />
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                          {combo.make} {combo.model}
                                        </p>
                                        {combo.processor && (
                                          <p className="text-xs text-muted-foreground truncate">
                                            {combo.processor}
                                          </p>
                                        )}
                                      </div>
                                      <Badge className={riskBadgeClass(combo.risk_level)} variant="outline">
                                        {combo.risk_level}
                                      </Badge>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                                      <div>
                                        <p className="text-muted-foreground">Coverage</p>
                                        <p className="font-medium">{(Number(combo.coverage_ratio) || 0).toFixed(1)}%</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Run Rate</p>
                                        <p className="font-medium">{(Number(combo.run_rate) || 0).toFixed(1)}/mo</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Covered</p>
                                        <p className="font-medium">{Number(combo.covered_count) || 0}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Spare</p>
                                        <p className="font-medium">{Number(combo.spare_count) || 0}</p>
                                      </div>
                                    </div>

                                    {!hasBulkSelection && (
                                      <div className="flex items-center gap-1 mt-2">
                                        <Button 
                                          size="sm" 
                                          variant="default" 
                                          className="flex-1 gap-1"
                                          onClick={() => handleSendAlert(combo)}
                                          data-testid={`button-send-alert-${index}`}
                                        >
                                          <Bell className="w-3 h-3" />
                                          Send Alert
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          className="flex-1 gap-1"
                                          onClick={() => handleCreatePool(combo)}
                                          data-testid={`button-create-pool-${index}`}
                                        >
                                          <FolderPlus className="w-3 h-3" />
                                          Create Pool
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <Button 
                        variant="ghost" 
                        className="w-full gap-2"
                        onClick={() => window.location.href = "/risk-combinations"}
                        data-testid="button-view-all-risk-profiles"
                      >
                        View All Risk Profiles
                        <ChevronRightIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
