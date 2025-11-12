import { useState, useMemo, useRef, useEffect } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import * as XLSX from 'xlsx';
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
  Download,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addMonths, subMonths, eachDayOfInterval, startOfWeek, addWeeks, endOfWeek, isSameDay, differenceInCalendarWeeks } from "date-fns";
import type { CoveragePoolWithStats } from "@shared/schema";
import type { RiskCombination, RiskLevel } from "@shared/risk-analysis-types";
import { formatRiskLevel } from "@shared/risk-analysis-types";

interface CoveredUnit {
  id: string;
  serialNumber?: string;
  coverageEndDate: string;
  coverageStartDate?: string;
  isCoverageActive: boolean;
  orderNumber?: string;
  customerName?: string;
  make?: string;
  model?: string;
  coverageDescription?: string;
  processor?: string;
  generation?: string;
}

interface HeatmapCell {
  date: Date;
  count: number;
  units: CoveredUnit[];
}


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

// 10-shade gradient: gray → green → yellow → orange → red
function getCellColor(count: number, maxCount: number): string {
  if (count === 0) return "bg-slate-200 dark:bg-slate-800";
  const intensity = maxCount > 0 ? (count / maxCount) * 100 : 0;
  
  // 10 shades for better data segregation
  if (intensity < 10) return "bg-emerald-200 dark:bg-emerald-900";    // Light green
  if (intensity < 20) return "bg-emerald-300 dark:bg-emerald-800";    // Green
  if (intensity < 30) return "bg-green-400 dark:bg-green-700";        // Medium green
  if (intensity < 40) return "bg-lime-400 dark:bg-lime-700";          // Lime/yellow-green
  if (intensity < 50) return "bg-yellow-300 dark:bg-yellow-600";      // Yellow
  if (intensity < 60) return "bg-amber-400 dark:bg-amber-600";        // Amber
  if (intensity < 70) return "bg-orange-400 dark:bg-orange-600";      // Orange
  if (intensity < 80) return "bg-orange-500 dark:bg-orange-700";      // Dark orange
  if (intensity < 90) return "bg-red-500 dark:bg-red-700";            // Red
  return "bg-red-600 dark:bg-red-800";                                // Deep red
}

function HeatmapDay({
  cell,
  maxCount,
  onCellClick,
}: {
  cell: HeatmapCell;
  maxCount: number;
  onCellClick?: (cell: HeatmapCell) => void;
}) {
  const cellColor = getCellColor(cell.count, maxCount);
  const isToday = format(cell.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }}
          onClick={() => onCellClick?.(cell)}
          className={cn(
            "w-4 h-4 rounded-sm transition-all cursor-pointer shadow-sm",
            cellColor,
            cell.count > 0 && "hover:ring-2 hover:ring-purple-400 dark:hover:ring-purple-600",
            isToday && "ring-2 ring-red-500 dark:ring-red-600 ring-offset-1"
          )}
          data-testid={`heatmap-cell-${format(cell.date, 'yyyy-MM-dd')}`}
          aria-label={`${cell.count} warranties expiring on ${format(cell.date, 'MMM d, yyyy')}`}
        />
      </TooltipTrigger>
      <TooltipContent side="top" align="start">
        <div className="space-y-2">
          <p className="text-sm font-semibold">
            {format(cell.date, 'MMM d, yyyy')}
            {isToday && <span className="ml-2 text-red-500">(Today)</span>}
          </p>
          <div className="flex items-center gap-2">
            <Badge variant={cell.count > 5 ? "destructive" : cell.count > 0 ? "secondary" : "outline"}>
              {cell.count} {cell.count === 1 ? 'unit' : 'units'} expiring
            </Badge>
          </div>
          {cell.count > 0 && (
            <p className="text-xs text-muted-foreground italic">Click to view details</p>
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
  const [startDate, setStartDate] = useState(() => subMonths(new Date(), 5));
  const [filters, setFilters] = useState({
    orderNumber: "",
    customerName: "",
    make: "",
    model: "",
  });
  const [selectedDateCell, setSelectedDateCell] = useState<HeatmapCell | null>(null);
  const [dialogSearch, setDialogSearch] = useState("");
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  
  const endDate = useMemo(() => addMonths(startDate, 13), [startDate]);

  // Fetch aggregated heatmap data (server-side filtering for all 100k+ records)
  const { data: heatmapExpirations, isLoading } = useQuery<Array<{ date: string; count: number }>>({
    queryKey: ["/api/covered-units/expirations", {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      make: filters.make || undefined,
      model: filters.model || undefined,
      customerName: filters.customerName || undefined,
      orderNumber: filters.orderNumber || undefined,
    }],
  });

  // Fetch detailed units for a specific date when dialog opens
  const { data: dialogUnits, isLoading: isLoadingDialogUnits } = useQuery<CoveredUnit[]>({
    queryKey: ["/api/covered-units", {
      limit: 10000,
      coverageEndDateFrom: selectedDateCell ? format(selectedDateCell.date, 'yyyy-MM-dd') : '',
      coverageEndDateTo: selectedDateCell ? format(selectedDateCell.date, 'yyyy-MM-dd') : '',
      make: filters.make || undefined,
      model: filters.model || undefined,
      customerName: filters.customerName || undefined,
      orderNumber: filters.orderNumber || undefined,
    }],
    enabled: !!selectedDateCell,
  });

  // Fetch filter options from server (for all 100k+ records)
  const { data: filterOptionsData } = useQuery<{
    makes: string[];
    models: string[];
    customers: string[];
    orders: string[];
  }>({
    queryKey: ["/api/covered-units/filter-options"],
  });

  const { data: pools } = useQuery<CoveragePoolWithStats[]>({
    queryKey: ["/api/coverage-pools-with-stats"],
  });

  // Fetch top 30 models needing attention: critical risk OR zero coverage with claims
  const { data: riskSummaryData, isLoading: isLoadingRiskSummary } = useQuery<{ 
    data: RiskCombination[]; 
    total: number;
    stats: {
      critical: number;
      high: number;
      medium: number;
      low: number;
      worstDeficit: number | null;
    };
  }>({
    queryKey: ['/api/risk-combinations', { 
      sortBy: 'days_of_supply', 
      sortOrder: 'asc', 
      limit: 30,
      offset: 0,
      coveredCountMax: 0, // Show only models with zero coverage
    }],
  });

  const topRiskModels = riskSummaryData?.data || [];
  const riskStats = riskSummaryData?.stats || { critical: 0, high: 0, medium: 0, low: 0, worstDeficit: null };

  // Clear selected models when data refetches to prevent stale bulk-state
  useEffect(() => {
    setSelectedModels(new Set());
  }, [riskSummaryData]);

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

  // Bulk action handlers
  const getModelKey = (model: RiskCombination) => 
    `${model.make}|${model.model}|${model.processor || ""}|${model.generation || ""}`;

  const toggleModelSelection = (model: RiskCombination) => {
    const key = getModelKey(model);
    setSelectedModels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedModels.size === topRiskModels.length) {
      setSelectedModels(new Set());
    } else {
      setSelectedModels(new Set(topRiskModels.map(getModelKey)));
    }
  };

  const handleBulkAlert = () => {
    const selected = topRiskModels.filter(model => selectedModels.has(getModelKey(model)));
    if (selected.length === 0) return;
    
    sendAlertMutation.mutate(selected);
    setSelectedModels(new Set());
  };

  const handleBulkCreatePool = () => {
    const selected = topRiskModels.filter(model => selectedModels.has(getModelKey(model)));
    if (selected.length === 0) return;

    const poolName = `Bulk Pool - ${selected.length} Models`;
    const allMakes = Array.from(new Set(selected.map(c => c.make).filter(Boolean)));
    const allModels = Array.from(new Set(selected.map(c => c.model).filter(Boolean)));
    
    const filterCriteria = JSON.stringify({
      make: allMakes.length > 0 ? allMakes : undefined,
      model: allModels.length > 0 ? allModels : undefined,
    });
    
    createPoolMutation.mutate({
      name: poolName,
      description: `Bulk pool for ${selected.length} selected models`,
      filterCriteria,
    });
    setSelectedModels(new Set());
  };

  // Filter and map warranty expiration data (case-insensitive filtering)
  const heatmapData = useMemo(() => {
    if (!heatmapExpirations) return [];

    // Create a map of date strings to counts for fast lookup
    const expirationMap = new Map<string, number>();
    heatmapExpirations.forEach(exp => {
      const dateStr = format(new Date(exp.date), 'yyyy-MM-dd');
      expirationMap.set(dateStr, exp.count);
    });

    // Calculate the actual range to display
    const rangeEnd = addMonths(startDate, 13);
    
    // Start from the Monday of the week containing startDate
    const actualStart = startOfWeek(startDate, { weekStartsOn: 1 }); // 1 = Monday
    
    // End on the Sunday of the week containing rangeEnd
    const actualEnd = endOfWeek(rangeEnd, { weekStartsOn: 1 });
    
    const days = eachDayOfInterval({ start: actualStart, end: actualEnd });
    
    return days.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const count = expirationMap.get(dateStr) || 0;

      return {
        date,
        count,
        units: [], // Units are loaded on-demand when cell is clicked
      };
    });
  }, [heatmapExpirations, startDate]);

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
    
    // Since we start on Monday and end on Sunday, no padding needed
    heatmapData.forEach((cell) => {
      currentWeek.push(cell);
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    // This shouldn't happen since we aligned to week boundaries, but just in case
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: new Date(), count: -1, units: [] });
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [heatmapData]);

  const monthHeaders = useMemo(() => {
    if (heatmapWeeks.length === 0) return [];
    
    const headers: { weekIndex: number; month: string; weekCount: number }[] = [];
    let currentMonth = -1;
    let monthStartWeek = 0;

    heatmapWeeks.forEach((week, weekIndex) => {
      // Find the first real cell (non-padding) in this week
      const firstRealCell = week.find(cell => cell.count !== -1);
      
      if (firstRealCell) {
        const month = firstRealCell.date.getMonth();
        
        // If we've encountered a new month
        if (month !== currentMonth) {
          // Finalize the previous month's week count
          if (headers.length > 0) {
            headers[headers.length - 1].weekCount = weekIndex - monthStartWeek;
          }
          
          // Start a new month header
          headers.push({
            weekIndex,
            month: format(firstRealCell.date, 'MMM yy'),
            weekCount: 1, // Will be updated when next month starts or at the end
          });
          
          currentMonth = month;
          monthStartWeek = weekIndex;
        }
      }
    });

    // Finalize the last month's week count
    if (headers.length > 0) {
      headers[headers.length - 1].weekCount = heatmapWeeks.length - monthStartWeek;
    }

    return headers;
  }, [heatmapWeeks]);

  // Use filter options from server (covers all 100k+ records)
  const filterOptions = useMemo(() => {
    if (!filterOptionsData) {
      return { makes: [], models: [], customers: [], orders: [] };
    }
    return filterOptionsData;
  }, [filterOptionsData]);

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

  // Filter units in dialog by search term
  const filteredDialogUnits = useMemo(() => {
    if (!dialogUnits) return [];
    
    const searchLower = dialogSearch.toLowerCase();
    if (!searchLower) return dialogUnits;
    
    return dialogUnits.filter(unit => 
      unit.serialNumber?.toLowerCase().includes(searchLower) ||
      unit.make?.toLowerCase().includes(searchLower) ||
      unit.model?.toLowerCase().includes(searchLower) ||
      unit.customerName?.toLowerCase().includes(searchLower) ||
      unit.orderNumber?.toLowerCase().includes(searchLower) ||
      unit.coverageDescription?.toLowerCase().includes(searchLower) ||
      unit.processor?.toLowerCase().includes(searchLower)
    );
  }, [dialogUnits, dialogSearch]);

  // Export dialog units to Excel
  const handleExportToExcel = () => {
    if (!selectedDateCell) return;
    
    const data = filteredDialogUnits.map(unit => ({
      'Serial Number': unit.serialNumber || '',
      'Make': unit.make || '',
      'Model': unit.model || '',
      'Customer': unit.customerName || '',
      'Order': unit.orderNumber || '',
      'Coverage Description': unit.coverageDescription || '',
      'Processor': unit.processor || '',
      'Generation': unit.generation || '',
      'Start Date': unit.coverageStartDate ? format(new Date(unit.coverageStartDate), 'MMM d, yyyy') : '',
      'End Date': format(new Date(unit.coverageEndDate), 'MMM d, yyyy'),
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Units');
    
    const dateStr = format(selectedDateCell.date, 'yyyy-MM-dd');
    XLSX.writeFile(wb, `warranties-expiring-${dateStr}.xlsx`);
    
    toast({
      title: "Export Successful",
      description: `Exported ${filteredDialogUnits.length} unit(s) to Excel`,
    });
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
            <h1 className="text-3xl font-bold mb-2">Monitor Expiries</h1>
            <p className="text-muted-foreground">
              Track warranty expirations and units running out
            </p>
          </div>
        </motion.div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: lg:col-span-8 - Insights + Heatmap + Coverage Pools */}
          <div className="lg:col-span-8 space-y-6">
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

            {/* Warranty Expiration Timeline */}
            <Card className="rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <CardTitle>Warranty Expiration Timeline</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
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
                      type="button"
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
                {/* Dropdown Filters */}
                <div className="border-t pt-4 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1">Make</Label>
                      <Select
                        value={filters.make || "all"}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, make: value === "all" ? "" : value }))}
                      >
                        <SelectTrigger className="h-9" data-testid="select-make">
                          <SelectValue placeholder="All Makes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Makes</SelectItem>
                          {filterOptions.makes.map((make: string) => (
                            <SelectItem key={make} value={make}>{make}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1">Model</Label>
                      <Select
                        value={filters.model || "all"}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, model: value === "all" ? "" : value }))}
                      >
                        <SelectTrigger className="h-9" data-testid="select-model">
                          <SelectValue placeholder="All Models" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Models</SelectItem>
                          {filterOptions.models.map((model: string) => (
                            <SelectItem key={model} value={model}>{model}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1">Customer</Label>
                      <Select
                        value={filters.customerName || "all"}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, customerName: value === "all" ? "" : value }))}
                      >
                        <SelectTrigger className="h-9" data-testid="select-customer">
                          <SelectValue placeholder="All Customers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Customers</SelectItem>
                          {filterOptions.customers.map((customer: string) => (
                            <SelectItem key={customer} value={customer}>{customer}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1">Order</Label>
                      <Select
                        value={filters.orderNumber || "all"}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, orderNumber: value === "all" ? "" : value }))}
                      >
                        <SelectTrigger className="h-9" data-testid="select-order">
                          <SelectValue placeholder="All Orders" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Orders</SelectItem>
                          {filterOptions.orders.map((order: string) => (
                            <SelectItem key={order} value={order}>{order}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Active Filter Badges */}
                  {activeFilterCount > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {filters.make && (
                        <Badge variant="secondary" className="gap-1">
                          Make: {filters.make}
                          <X
                            className="w-3 h-3 cursor-pointer hover-elevate"
                            onClick={() => setFilters(prev => ({ ...prev, make: "" }))}
                          />
                        </Badge>
                      )}
                      {filters.model && (
                        <Badge variant="secondary" className="gap-1">
                          Model: {filters.model}
                          <X
                            className="w-3 h-3 cursor-pointer hover-elevate"
                            onClick={() => setFilters(prev => ({ ...prev, model: "" }))}
                          />
                        </Badge>
                      )}
                      {filters.customerName && (
                        <Badge variant="secondary" className="gap-1">
                          Customer: {filters.customerName}
                          <X
                            className="w-3 h-3 cursor-pointer hover-elevate"
                            onClick={() => setFilters(prev => ({ ...prev, customerName: "" }))}
                          />
                        </Badge>
                      )}
                      {filters.orderNumber && (
                        <Badge variant="secondary" className="gap-1">
                          Order: {filters.orderNumber}
                          <X
                            className="w-3 h-3 cursor-pointer hover-elevate"
                            onClick={() => setFilters(prev => ({ ...prev, orderNumber: "" }))}
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

                {/* Heatmap Grid */}
                <div className="overflow-x-auto">
                  <div className="flex gap-2 min-w-max">
                    {/* Day Labels - Aligned with Mon-Sun grid */}
                    <div className="flex flex-col gap-0.5 text-xs text-muted-foreground font-medium" style={{ paddingTop: '32px', width: '32px' }}>
                      <div className="h-4 flex items-center">Mon</div>
                      <div className="h-4" />
                      <div className="h-4 flex items-center">Wed</div>
                      <div className="h-4" />
                      <div className="h-4 flex items-center">Fri</div>
                      <div className="h-4" />
                      <div className="h-4" />
                    </div>

                    {/* Grid with Month Headers */}
                    <div className="flex-1">
                      {/* Month Headers */}
                      <div className="flex gap-0.5 mb-2 h-6">
                        {monthHeaders.map((header, index) => (
                          <div
                            key={index}
                            className="text-xs font-bold text-foreground"
                            style={{
                              width: `calc(${header.weekCount} * (16px + 2px) - 2px)`,
                              textAlign: 'left'
                            }}
                          >
                            {header.month}
                          </div>
                        ))}
                      </div>

                      {/* Week Columns */}
                      <div className="flex gap-0.5">
                        {heatmapWeeks.map((week, weekIndex) => (
                          <div key={weekIndex} className="flex flex-col gap-0.5">
                            {week.map((cell, dayIndex) => (
                              <div key={dayIndex}>
                                {cell.count === -1 ? (
                                  <div className="w-4 h-4" />
                                ) : (
                                  <HeatmapDay 
                                    cell={cell} 
                                    maxCount={maxCount} 
                                    onCellClick={(cell) => {
                                      if (cell.count > 0) {
                                        setSelectedDateCell(cell);
                                        setDialogSearch("");
                                      }
                                    }}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Legend - 10 shade gradient */}
                  <div className="flex items-center gap-2 mt-6 text-xs text-muted-foreground">
                    <span className="font-medium">Less</span>
                    <div className="flex gap-1">
                      <div className="w-3.5 h-3.5 rounded-sm bg-slate-200 dark:bg-slate-800 shadow-sm" title="0%" />
                      <div className="w-3.5 h-3.5 rounded-sm bg-emerald-200 dark:bg-emerald-900 shadow-sm" title="1-10%" />
                      <div className="w-3.5 h-3.5 rounded-sm bg-emerald-300 dark:bg-emerald-800 shadow-sm" title="11-20%" />
                      <div className="w-3.5 h-3.5 rounded-sm bg-green-400 dark:bg-green-700 shadow-sm" title="21-30%" />
                      <div className="w-3.5 h-3.5 rounded-sm bg-lime-400 dark:bg-lime-700 shadow-sm" title="31-40%" />
                      <div className="w-3.5 h-3.5 rounded-sm bg-yellow-300 dark:bg-yellow-600 shadow-sm" title="41-50%" />
                      <div className="w-3.5 h-3.5 rounded-sm bg-amber-400 dark:bg-amber-600 shadow-sm" title="51-60%" />
                      <div className="w-3.5 h-3.5 rounded-sm bg-orange-400 dark:bg-orange-600 shadow-sm" title="61-70%" />
                      <div className="w-3.5 h-3.5 rounded-sm bg-orange-500 dark:bg-orange-700 shadow-sm" title="71-80%" />
                      <div className="w-3.5 h-3.5 rounded-sm bg-red-500 dark:bg-red-700 shadow-sm" title="81-90%" />
                      <div className="w-3.5 h-3.5 rounded-sm bg-red-600 dark:bg-red-800 shadow-sm" title="91-100%" />
                    </div>
                    <span className="font-medium">More</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Models Needing Attention - 3-Column Card Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Models Without Coverage</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Showing {topRiskModels.length} model{topRiskModels.length !== 1 ? 's' : ''} with no active warranties
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {topRiskModels.length > 0 && (
                    <div className="flex items-center gap-2 mr-3">
                      <Checkbox 
                        checked={selectedModels.size === topRiskModels.length && topRiskModels.length > 0}
                        onCheckedChange={toggleSelectAll}
                        data-testid="checkbox-select-all"
                      />
                      <span className="text-sm text-muted-foreground">
                        {selectedModels.size > 0 ? `${selectedModels.size} selected` : "Select all"}
                      </span>
                    </div>
                  )}
                  <Link href="/risk-combinations">
                    <Button variant="outline" size="sm" className="gap-1" data-testid="button-view-all">
                      View All
                      <ChevronRightIcon className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Bulk Action Bar */}
              {selectedModels.size > 0 && (
                <div className="flex items-center justify-between gap-2 p-3 bg-accent/50 rounded-lg border">
                  <span className="text-sm font-medium">
                    {selectedModels.size} model{selectedModels.size > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={handleBulkAlert}
                      disabled={sendAlertMutation.isPending}
                      className="gap-1.5"
                      data-testid="button-bulk-alert"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      Send Alert
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkCreatePool}
                      disabled={createPoolMutation.isPending}
                      className="gap-1.5"
                      data-testid="button-bulk-pool"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      Create Pool
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedModels(new Set())}
                      data-testid="button-clear-selection"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* 3-Column Card Grid */}
              {isLoadingRiskSummary ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                  ))}
                </div>
              ) : topRiskModels.length === 0 ? (
                <Card className="rounded-2xl">
                  <CardContent className="p-12 text-center text-muted-foreground">
                    <Shield className="w-16 h-16 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">No models without coverage</p>
                    <p className="text-sm mt-1">All models with demand have active warranty coverage</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {topRiskModels.map((model, index) => {
                    const isSelected = selectedModels.has(getModelKey(model));
                    const hasCoverage = (model.covered_count || 0) > 0;
                    
                    return (
                      <Card 
                        key={index} 
                        className={cn(
                          "rounded-lg hover-elevate transition-all border-l-4",
                          isSelected && "ring-2 ring-primary",
                          model.risk_level === 'critical' && "border-l-red-600",
                          model.risk_level === 'high' && "border-l-orange-500",
                          model.risk_level === 'medium' && "border-l-amber-400",
                          model.risk_level === 'low' && "border-l-green-500"
                        )}
                        data-testid={`model-item-${index}`}
                      >
                        <CardContent className="p-3 space-y-2">
                          {/* Header: Checkbox + Title */}
                          <div className="flex items-start gap-2">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleModelSelection(model)}
                              data-testid={`checkbox-model-${index}`}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-xs leading-tight line-clamp-2">
                                {model.make} {model.model}
                                {(model.processor || model.generation) && (
                                  <span className="text-muted-foreground font-normal text-[10px]">
                                    {' '}({[model.processor, model.generation].filter(Boolean).join(' • ')})
                                  </span>
                                )}
                              </h3>
                            </div>
                          </div>

                          {/* Status Badges */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <div className={cn(
                              "inline-flex items-center px-1.5 py-0.5 rounded font-bold text-[10px]",
                              model.risk_level === 'critical' && "bg-red-600 text-white",
                              model.risk_level === 'high' && "bg-orange-500 text-white",
                              model.risk_level === 'medium' && "bg-amber-500 text-white",
                              model.risk_level === 'low' && "bg-green-600 text-white"
                            )}>
                              {model.days_of_supply !== null 
                                ? `${Math.floor(Number(model.days_of_supply) || 0)}d` 
                                : '∞'}
                            </div>
                            <Badge 
                              variant={hasCoverage ? "default" : "destructive"}
                              className="text-[9px] font-semibold h-4 px-1.5"
                            >
                              {hasCoverage ? "Has Active Warranties" : "No Active Warranties"}
                            </Badge>
                          </div>

                          {/* Compact Metrics - 5 Columns */}
                          <div className="grid grid-cols-5 gap-1.5 text-[10px]">
                            <div className="text-center">
                              <div className="text-muted-foreground">Active</div>
                              <div className="font-bold text-xs">{model.covered_count || 0}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-muted-foreground">Spare</div>
                              <div className="font-bold text-xs">{model.spare_count || 0}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-muted-foreground">Run/mo</div>
                              <div className="font-bold text-xs">{(Number(model.run_rate) || 0).toFixed(1)}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-muted-foreground">UK</div>
                              <div className="font-bold text-xs">{model.uk_available_count || 0}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-muted-foreground">UAE</div>
                              <div className="font-bold text-xs">{model.uae_available_count || 0}</div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-7 text-[10px]"
                              onClick={() => handleSendAlert(model)}
                              data-testid={`button-alert-${index}`}
                            >
                              <Bell className="w-3 h-3 mr-1" />
                              Alert
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-7 text-[10px]"
                              onClick={() => handleCreatePool(model)}
                              data-testid={`button-pool-${index}`}
                            >
                              <FolderPlus className="w-3 h-3 mr-1" />
                              Pool
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: lg:col-span-4 - Coverage Pools */}
          <div className="lg:col-span-4 space-y-4" ref={riskCombinationsRef}>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="rounded-2xl border-l-4 border-l-red-600">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Critical Risk</p>
                      <p className="text-2xl font-bold" data-testid="text-critical-count">{riskStats.critical}</p>
                    </div>
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="rounded-2xl border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">High Risk</p>
                      <p className="text-2xl font-bold" data-testid="text-high-count">{riskStats.high}</p>
                    </div>
                    <TrendingDown className="w-6 h-6 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

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
                <div className="space-y-3">
                  {sortedPools.map((pool) => {
                    const coverageRatio = Number(pool.coverageRatio) || 0;
                    const runRate = Number(pool.runRate) || 0;
                    const spareCount = Number(pool.spareCount) || 0;
                    const coveredCount = Number(pool.coveredCount) || 0;
                    const ukAvailable = Number(pool.ukAvailableCount) || 0;
                    const uaeAvailable = Number(pool.uaeAvailableCount) || 0;
                    const totalAvailable = ukAvailable + uaeAvailable;
                    
                    // Calculate runway in months
                    const runwayMonths = runRate > 0 ? spareCount / runRate : 0;
                    
                    // Calculate shortfall (target 6% coverage)
                    const targetCoverage = 6; // 6% target
                    const targetSpares = Math.ceil((coveredCount * targetCoverage) / 100);
                    const shortfall = Math.max(0, targetSpares - spareCount);
                    
                    // Status badge and runway colors based on inventory runway
                    const getStatusBadge = () => {
                      if (runRate === 0) {
                        return { 
                          text: "Low Priority", 
                          class: "bg-muted text-muted-foreground border-muted",
                          bg: "bg-muted/30",
                          borderColor: "border-l-muted",
                          textColor: "text-muted-foreground"
                        };
                      }
                      
                      if (runwayMonths < 1) {
                        return { 
                          text: "Critical", 
                          class: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 border-red-300 dark:border-red-700",
                          bg: "bg-red-50 dark:bg-red-950/30",
                          borderColor: "border-l-red-600",
                          textColor: "text-red-600 dark:text-red-400"
                        };
                      } else if (runwayMonths < 2) {
                        return { 
                          text: "Warning", 
                          class: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 border-orange-300 dark:border-orange-700",
                          bg: "bg-orange-50 dark:bg-orange-950/30",
                          borderColor: "border-l-orange-600",
                          textColor: "text-orange-600 dark:text-orange-400"
                        };
                      } else if (runwayMonths < 3) {
                        return { 
                          text: "Caution", 
                          class: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 border-amber-300 dark:border-amber-700",
                          bg: "bg-amber-50 dark:bg-amber-950/30",
                          borderColor: "border-l-amber-600",
                          textColor: "text-amber-600 dark:text-amber-500"
                        };
                      } else {
                        return { 
                          text: "Healthy", 
                          class: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-300 dark:border-green-700",
                          bg: "bg-green-50 dark:bg-green-950/30",
                          borderColor: "border-l-green-600",
                          textColor: "text-green-600 dark:text-green-500"
                        };
                      }
                    };
                    
                    const status = getStatusBadge();

                    return (
                      <Link key={pool.id} href={`/pools/${pool.id}`}>
                        <Card className="rounded-2xl hover-elevate cursor-pointer" data-testid={`card-pool-${pool.id}`}>
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              {/* Header: Pool name + Status badge */}
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="text-sm font-semibold flex-1 line-clamp-2 leading-tight">{pool.name}</h3>
                                <Badge className={`${status.class} font-semibold text-xs rounded-full px-2 py-0.5`} variant="outline">
                                  {status.text}
                                </Badge>
                              </div>
                              
                              {/* Inventory Runway - Prominent Display */}
                              <div className={`${status.bg} rounded-lg p-3 border-l-4 ${status.borderColor}`}>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-muted-foreground">Inventory Runway</span>
                                  <span className={`text-xl font-bold ${status.textColor}`}>
                                    {runwayMonths > 0 ? `${runwayMonths.toFixed(1)} Months` : "No Demand"}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Stock Counts - 4 Column Grid */}
                              <div className="grid grid-cols-4 gap-2 text-center">
                                <div className="bg-background rounded border p-2">
                                  <p className="text-[10px] text-muted-foreground mb-1">Covered</p>
                                  <p className="text-sm font-bold">{coveredCount}</p>
                                </div>
                                <div className="bg-background rounded border p-2">
                                  <p className="text-[10px] text-muted-foreground mb-1">Spares</p>
                                  <p className="text-sm font-bold">{spareCount}</p>
                                </div>
                                <div className="bg-background rounded border p-2">
                                  <p className="text-[10px] text-muted-foreground mb-1">Demand/mo</p>
                                  <p className="text-sm font-bold">{runRate.toFixed(1)}</p>
                                </div>
                                <div className="bg-background rounded border p-2">
                                  <p className="text-[10px] text-muted-foreground mb-1">Gap</p>
                                  <p className={`text-sm font-bold ${shortfall > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-500'}`}>
                                    {shortfall}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Available Stock - Regional Breakdown */}
                              <div className="bg-muted/20 rounded-lg p-2">
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                                    <Package className="w-3 h-3" />
                                    <span>Available Stock</span>
                                  </div>
                                  <div className="flex items-center gap-3 font-semibold">
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                      <span>{ukAvailable}</span>
                                      <span className="text-muted-foreground">UK</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                      <span>{uaeAvailable}</span>
                                      <span className="text-muted-foreground">UAE</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span>=</span>
                                      <span>{totalAvailable}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
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
        </div>
      </div>

      {/* Warranty Details Dialog */}
      <Dialog open={!!selectedDateCell} onOpenChange={(open) => !open && setSelectedDateCell(null)}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Warranties Expiring on {selectedDateCell && format(selectedDateCell.date, 'MMMM d, yyyy')}
            </DialogTitle>
            <DialogDescription>
              {selectedDateCell?.count || 0} unit(s) with coverage ending on this date
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Search and Export Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by serial, make, model, customer, order, warranty description..."
                  value={dialogSearch}
                  onChange={(e) => setDialogSearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-dialog-search"
                />
              </div>
              <Button
                variant="outline"
                onClick={handleExportToExcel}
                className="gap-2"
                disabled={filteredDialogUnits.length === 0}
                data-testid="button-export-excel"
              >
                <Download className="w-4 h-4" />
                Export to Excel
              </Button>
            </div>

            {/* Units Table */}
            <div className="flex-1 overflow-auto border rounded-lg">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Make</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Coverage Description</TableHead>
                    <TableHead>Processor</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDialogUnits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        No units found matching your search
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDialogUnits.map((unit, index) => (
                      <TableRow key={unit.id} data-testid={`row-unit-${index}`}>
                        <TableCell className="font-mono text-xs">{unit.serialNumber || '-'}</TableCell>
                        <TableCell>{unit.make || '-'}</TableCell>
                        <TableCell>{unit.model || '-'}</TableCell>
                        <TableCell>{unit.customerName || '-'}</TableCell>
                        <TableCell className="font-mono text-xs">{unit.orderNumber || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate" title={unit.coverageDescription}>
                          {unit.coverageDescription || '-'}
                        </TableCell>
                        <TableCell className="text-xs">{unit.processor || '-'}</TableCell>
                        <TableCell className="text-xs">
                          {unit.coverageStartDate ? format(new Date(unit.coverageStartDate), 'MMM d, yyyy') : '-'}
                        </TableCell>
                        <TableCell className="text-xs">
                          {format(new Date(unit.coverageEndDate), 'MMM d, yyyy')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Results Summary */}
            {dialogSearch && (
              <div className="text-sm text-muted-foreground">
                Showing {filteredDialogUnits.length} of {selectedDateCell?.count || 0} unit(s)
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
