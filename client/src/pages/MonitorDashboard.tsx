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

// Vibrant color palette for heatmap - poppy and bold
function getCellColor(count: number, maxCount: number): string {
  if (count === 0) return "bg-slate-100 dark:bg-slate-800";
  const intensity = maxCount > 0 ? (count / maxCount) * 100 : 0;
  
  if (intensity < 20) return "bg-indigo-300 dark:bg-indigo-400";
  if (intensity < 40) return "bg-indigo-500 dark:bg-indigo-600";
  if (intensity < 60) return "bg-purple-500 dark:bg-purple-600";
  if (intensity < 80) return "bg-fuchsia-600 dark:bg-fuchsia-700";
  return "bg-rose-700 dark:bg-rose-800";
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
        <motion.div
          whileHover={{ scale: 1.1 }}
          onClick={() => onCellClick?.(cell)}
          className={cn(
            "w-4 h-4 rounded-sm transition-all cursor-pointer shadow-sm",
            cellColor,
            cell.count > 0 && "hover:ring-2 hover:ring-purple-400 dark:hover:ring-purple-600",
            isToday && "ring-2 ring-red-500 dark:ring-red-600 ring-offset-1"
          )}
          data-testid={`heatmap-day-${format(cell.date, 'yyyy-MM-dd')}`}
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
          {cell.count > 0 && cell.count <= 5 && (
            <div className="text-xs text-muted-foreground space-y-1 max-w-xs">
              {cell.units.slice(0, 5).map((unit, i) => (
                <div key={i} className="truncate">
                  {unit.orderNumber || 'N/A'} - {unit.make} {unit.model}
                </div>
              ))}
            </div>
          )}
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
  const [startDate, setStartDate] = useState(() => subMonths(new Date(), 4));
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
  const [selectedDateCell, setSelectedDateCell] = useState<HeatmapCell | null>(null);
  const [dialogSearch, setDialogSearch] = useState("");

  const endDate = useMemo(() => addMonths(startDate, 10), [startDate]);
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
      if (endDate < startDate || endDate > addMonths(startDate, 10)) return false;

      if (filters.orderNumber && unit.orderNumber !== filters.orderNumber) return false;
      if (filters.customerName && unit.customerName !== filters.customerName) return false;
      if (filters.make && unit.make !== filters.make) return false;
      if (filters.model && unit.model !== filters.model) return false;

      return true;
    });

    const days = eachDayOfInterval({ start: startDate, end: addMonths(startDate, 10) });
    
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
            month: format(firstRealCell.date, 'MMM'),
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

  // Extract unique filter options from covered units
  const filterOptions = useMemo(() => {
    if (!coveredUnits) {
      return { makes: [], models: [], customers: [], orders: [] };
    }

    const makes = Array.from(new Set(coveredUnits.map(u => u.make).filter((v): v is string => Boolean(v)))).sort();
    const models = Array.from(new Set(coveredUnits.map(u => u.model).filter((v): v is string => Boolean(v)))).sort();
    const customers = Array.from(new Set(coveredUnits.map(u => u.customerName).filter((v): v is string => Boolean(v)))).sort();
    const orders = Array.from(new Set(coveredUnits.map(u => u.orderNumber).filter((v): v is string => Boolean(v)))).sort();

    return { makes, models, customers, orders };
  }, [coveredUnits]);

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
    if (!selectedDateCell) return [];
    
    const searchLower = dialogSearch.toLowerCase();
    if (!searchLower) return selectedDateCell.units;
    
    return selectedDateCell.units.filter(unit => 
      unit.serialNumber?.toLowerCase().includes(searchLower) ||
      unit.make?.toLowerCase().includes(searchLower) ||
      unit.model?.toLowerCase().includes(searchLower) ||
      unit.customerName?.toLowerCase().includes(searchLower) ||
      unit.orderNumber?.toLowerCase().includes(searchLower) ||
      unit.coverageDescription?.toLowerCase().includes(searchLower) ||
      unit.processor?.toLowerCase().includes(searchLower)
    );
  }, [selectedDateCell, dialogSearch]);

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

            {/* Warranty Expiration Timeline */}
            <Card className="rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
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
                    {/* Day Labels */}
                    <div className="flex flex-col justify-around text-xs text-muted-foreground font-medium pt-6" style={{ width: '32px' }}>
                      <div>Mon</div>
                      <div>Wed</div>
                      <div>Fri</div>
                    </div>

                    {/* Grid with Month Headers */}
                    <div className="flex-1">
                      {/* Month Headers */}
                      <div className="flex gap-1 mb-2 h-6">
                        {monthHeaders.map((header, index) => (
                          <div
                            key={index}
                            className="text-xs font-bold text-foreground"
                            style={{
                              width: `${header.weekCount * 20}px`,
                              textAlign: 'left'
                            }}
                          >
                            {header.month}
                          </div>
                        ))}
                      </div>

                      {/* Week Columns */}
                      <div className="flex gap-1">
                        {heatmapWeeks.map((week, weekIndex) => (
                          <div key={weekIndex} className="flex flex-col gap-1">
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

                  {/* Legend */}
                  <div className="flex items-center gap-3 mt-6 text-xs text-muted-foreground">
                    <span className="font-medium">Less</span>
                    <div className="flex gap-1.5">
                      <div className="w-4 h-4 rounded-sm bg-slate-100 dark:bg-slate-800 shadow-sm" />
                      <div className="w-4 h-4 rounded-sm bg-indigo-300 dark:bg-indigo-400 shadow-sm" />
                      <div className="w-4 h-4 rounded-sm bg-indigo-500 dark:bg-indigo-600 shadow-sm" />
                      <div className="w-4 h-4 rounded-sm bg-purple-500 dark:bg-purple-600 shadow-sm" />
                      <div className="w-4 h-4 rounded-sm bg-fuchsia-600 dark:bg-fuchsia-700 shadow-sm" />
                      <div className="w-4 h-4 rounded-sm bg-rose-700 dark:bg-rose-800 shadow-sm" />
                    </div>
                    <span className="font-medium">More</span>
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
