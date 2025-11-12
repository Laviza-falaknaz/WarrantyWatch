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
  const [selectedRiskItems, setSelectedRiskItems] = useState<Set<string>>(new Set());
  const [excludeZeroCovered, setExcludeZeroCovered] = useState(true);
  const [riskFilters, setRiskFilters] = useState({
    search: "",
    riskLevel: "all",
  });
  const [selectedDateCell, setSelectedDateCell] = useState<HeatmapCell | null>(null);
  const [dialogSearch, setDialogSearch] = useState("");
  
  // Pagination, sorting, and advanced filtering for Units Running Out
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<'coverage_ratio' | 'risk_score' | 'covered_count' | 'spare_count' | 'run_rate'>('coverage_ratio');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [riskLevels, setRiskLevels] = useState<RiskLevel[]>([]);
  const [coverageRatioMin, setCoverageRatioMin] = useState<number | undefined>();
  const [coverageRatioMax, setCoverageRatioMax] = useState<number | undefined>();

  const endDate = useMemo(() => addMonths(startDate, 13), [startDate]);
  const hasBulkSelection = selectedRiskItems.size > 1;

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

  const { data: riskCombinationsData, isLoading: isLoadingRiskCombinations } = useQuery<{ data: RiskCombination[]; total: number }>({
    queryKey: ['/api/risk-combinations', { 
      sortBy: sortBy, 
      sortOrder: sortOrder, 
      limit: pageSize,
      offset: (page - 1) * pageSize,
      excludeZeroCovered: excludeZeroCovered,
      search: riskFilters.search || undefined,
      riskLevels: riskLevels.length > 0 ? riskLevels : undefined,
      coverageRatioMin: coverageRatioMin,
      coverageRatioMax: coverageRatioMax,
    }],
  });

  const riskCombinations = riskCombinationsData?.data || [];
  const totalRiskCombinations = riskCombinationsData?.total || 0;
  const totalPages = Math.ceil(totalRiskCombinations / pageSize);

  // Calculate metrics summary from current data
  const riskMetrics = useMemo(() => {
    if (!riskCombinations) return { critical: 0, high: 0, medium: 0, low: 0 };
    
    return riskCombinations.reduce((acc, combo) => {
      acc[combo.risk_level] = (acc[combo.risk_level] || 0) + 1;
      return acc;
    }, { critical: 0, high: 0, medium: 0, low: 0 } as Record<RiskLevel, number>);
  }, [riskCombinations]);

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
    
    const selectedCombinations = riskCombinations?.filter(combo => 
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
    
    const selectedCombinations = riskCombinations?.filter(combo => 
      selectedRiskItems.has(getRiskComboKey(combo))
    ) || [];
    
    if (selectedCombinations.length === 0) return;
    
    sendAlertMutation.mutate(selectedCombinations, {
      onSuccess: () => {
        setSelectedRiskItems(new Set()); // Clear selection after success
      },
    });
  };
  
  // CSV Export handler for risk combinations
  const handleExportRiskCombinations = async () => {
    try {
      // Fetch all filtered results (not just current page)
      const response = await fetch(`/api/risk-combinations?${new URLSearchParams({
        sortBy: sortBy,
        sortOrder: sortOrder,
        limit: '10000', // Fetch all results
        offset: '0',
        excludeZeroCovered: String(excludeZeroCovered),
        ...(riskFilters.search && { search: riskFilters.search }),
        ...(riskLevels.length > 0 && { riskLevels: riskLevels.join(',') }),
        ...(coverageRatioMin !== undefined && { coverageRatioMin: String(coverageRatioMin) }),
        ...(coverageRatioMax !== undefined && { coverageRatioMax: String(coverageRatioMax) }),
      })}`);
      
      const result = await response.json();
      const allCombinations = result.data || [];
      
      const exportData = allCombinations.map((combo: RiskCombination) => ({
        'Make': combo.make,
        'Model': combo.model,
        'Processor': combo.processor || '',
        'Generation': combo.generation || '',
        'Risk Level': combo.risk_level,
        'Risk Score': combo.risk_score,
        'Covered Count': combo.covered_count,
        'Spare Count': combo.spare_count,
        'Coverage Ratio %': (Number(combo.coverage_ratio) || 0).toFixed(1),
        'Run Rate': (Number(combo.run_rate) || 0).toFixed(1),
        'Coverage of Run Rate %': (Number(combo.coverage_of_run_rate) || 0).toFixed(1),
        'UK Available': combo.uk_available_count,
        'UAE Available': combo.uae_available_count,
        'Total Available': combo.available_stock_count,
        'Claims (6mo)': combo.claims_last_6_months,
        'Replacements (6mo)': combo.replacements_last_6_months,
        'Fulfillment Rate %': (Number(combo.fulfillment_rate) || 0).toFixed(1),
      }));
      
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Risk Combinations');
      
      XLSX.writeFile(wb, `risk-combinations-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      
      toast({
        title: "Export Successful",
        description: `Exported ${exportData.length} risk combination(s) to Excel`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Column sorting handler
  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1); // Reset to first page when sorting changes
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

          {/* Right Column: lg:col-span-4 - Units Running Out */}
          <div className="lg:col-span-4 space-y-4" ref={riskCombinationsRef}>
            {/* Risk Metrics Summary */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="rounded-2xl border-l-4 border-l-red-600">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Critical</p>
                      <p className="text-2xl font-bold" data-testid="text-critical-count">{riskMetrics.critical}</p>
                    </div>
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="rounded-2xl border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">High</p>
                      <p className="text-2xl font-bold" data-testid="text-high-count">{riskMetrics.high}</p>
                    </div>
                    <TrendingDown className="w-6 h-6 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="rounded-2xl border-l-4 border-l-amber-400">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Medium</p>
                      <p className="text-2xl font-bold" data-testid="text-medium-count">{riskMetrics.medium}</p>
                    </div>
                    <Activity className="w-6 h-6 text-amber-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="rounded-2xl border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Low</p>
                      <p className="text-2xl font-bold" data-testid="text-low-count">{riskMetrics.low}</p>
                    </div>
                    <Shield className="w-6 h-6 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Table Card */}
            <Card className="rounded-2xl">
              <CardHeader>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Units Running Out</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleExportRiskCombinations}
                        className="gap-1.5"
                        data-testid="button-export-csv"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Export
                      </Button>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                        <Switch
                          checked={!excludeZeroCovered}
                          onCheckedChange={(checked) => {
                            setExcludeZeroCovered(!checked);
                            setPage(1);
                          }}
                          data-testid="toggle-include-zero-covered"
                        />
                        Show Zero
                      </label>
                    </div>
                  </div>
                  
                  {/* Filters */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search make, model, processor..."
                        value={riskFilters.search}
                        onChange={(e) => {
                          setRiskFilters({ ...riskFilters, search: e.target.value });
                          setPage(1);
                        }}
                        className="pl-9 text-sm"
                        data-testid="input-risk-search"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min Coverage %"
                        value={coverageRatioMin ?? ''}
                        onChange={(e) => {
                          setCoverageRatioMin(e.target.value ? Number(e.target.value) : undefined);
                          setPage(1);
                        }}
                        className="text-sm"
                        data-testid="input-coverage-min"
                      />
                      <Input
                        type="number"
                        placeholder="Max Coverage %"
                        value={coverageRatioMax ?? ''}
                        onChange={(e) => {
                          setCoverageRatioMax(e.target.value ? Number(e.target.value) : undefined);
                          setPage(1);
                        }}
                        className="text-sm"
                        data-testid="input-coverage-max"
                      />
                    </div>
                  </div>
                  
                  {/* Bulk Actions */}
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
                        Alert ({selectedRiskItems.size})
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1"
                        onClick={handleCreateCombinedPool}
                        data-testid="button-create-combined-pool"
                      >
                        <FolderPlus className="w-3 h-3" />
                        Pool ({selectedRiskItems.size})
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedRiskItems(new Set())}
                        data-testid="button-clear-selection"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {isLoadingRiskCombinations ? (
                  <div className="p-8 text-center">
                    <Skeleton className="h-64 w-full" />
                  </div>
                ) : !riskCombinations || riskCombinations.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No risk combinations found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={riskCombinations.every(combo => selectedRiskItems.has(getRiskComboKey(combo)))}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  const newSelected = new Set(selectedRiskItems);
                                  riskCombinations.forEach(combo => newSelected.add(getRiskComboKey(combo)));
                                  setSelectedRiskItems(newSelected);
                                } else {
                                  const newSelected = new Set(selectedRiskItems);
                                  riskCombinations.forEach(combo => newSelected.delete(getRiskComboKey(combo)));
                                  setSelectedRiskItems(newSelected);
                                }
                              }}
                              data-testid="checkbox-select-all"
                            />
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover-elevate"
                            onClick={() => handleSort('coverage_ratio')}
                            data-testid="header-coverage-ratio"
                          >
                            <div className="flex items-center gap-1">
                              Coverage %
                              {sortBy === 'coverage_ratio' && (
                                <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                          </TableHead>
                          <TableHead>Make/Model</TableHead>
                          <TableHead>Risk</TableHead>
                          <TableHead 
                            className="cursor-pointer hover-elevate text-right"
                            onClick={() => handleSort('covered_count')}
                            data-testid="header-covered"
                          >
                            <div className="flex items-center justify-end gap-1">
                              Covered
                              {sortBy === 'covered_count' && (
                                <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover-elevate text-right"
                            onClick={() => handleSort('spare_count')}
                            data-testid="header-spares"
                          >
                            <div className="flex items-center justify-end gap-1">
                              Spares
                              {sortBy === 'spare_count' && (
                                <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover-elevate text-right"
                            onClick={() => handleSort('run_rate')}
                            data-testid="header-demand"
                          >
                            <div className="flex items-center justify-end gap-1">
                              Demand
                              {sortBy === 'run_rate' && (
                                <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                          </TableHead>
                          <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {riskCombinations.map((combo, index) => {
                          const comboKey = getRiskComboKey(combo);
                          const isSelected = selectedRiskItems.has(comboKey);
                          const coverageRatio = Number(combo.coverage_ratio) || 0;
                          
                          const borderClass = 
                            coverageRatio < 25 ? 'border-l-4 border-l-red-600 bg-red-50/30 dark:bg-red-950/10' :
                            coverageRatio < 50 ? 'border-l-4 border-l-orange-500 bg-orange-50/30 dark:bg-orange-950/10' :
                            coverageRatio < 75 ? 'border-l-4 border-l-amber-400 bg-amber-50/20 dark:bg-amber-950/10' :
                            '';
                          
                          return (
                            <TableRow 
                              key={comboKey} 
                              className={cn(borderClass, "hover-elevate")}
                              data-testid={`row-risk-${index}`}
                            >
                              <TableCell>
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
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress value={coverageRatio} className="w-16 h-2" />
                                  <span className={cn(
                                    "text-sm font-semibold",
                                    coverageRatio < 25 ? "text-red-600 dark:text-red-400" :
                                    coverageRatio < 50 ? "text-orange-600 dark:text-orange-400" :
                                    coverageRatio < 75 ? "text-amber-600 dark:text-amber-500" :
                                    "text-green-600 dark:text-green-500"
                                  )}>
                                    {coverageRatio.toFixed(0)}%
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="text-sm font-medium">{combo.make} {combo.model}</p>
                                  {combo.processor && (
                                    <p className="text-xs text-muted-foreground">{combo.processor}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={riskBadgeClass(combo.risk_level)} variant="outline">
                                  {combo.risk_level}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {combo.covered_count}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {combo.spare_count}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {(Number(combo.run_rate) || 0).toFixed(1)}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleSendAlert(combo)}
                                        data-testid={`button-alert-${index}`}
                                      >
                                        <Bell className="w-3.5 h-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Send Alert</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleCreatePool(combo)}
                                        data-testid={`button-pool-${index}`}
                                      >
                                        <FolderPlus className="w-3.5 h-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Create Pool</TooltipContent>
                                  </Tooltip>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
                
                {/* Pagination */}
                {totalRiskCombinations > 0 && (
                  <div className="border-t p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                          Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalRiskCombinations)} of {totalRiskCombinations}
                        </p>
                        <Select
                          value={String(pageSize)}
                          onValueChange={(value) => {
                            setPageSize(Number(value));
                            setPage(1);
                          }}
                        >
                          <SelectTrigger className="w-24 text-sm" data-testid="select-page-size">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPage(Math.max(1, page - 1))}
                          disabled={page === 1}
                          data-testid="button-prev-page"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-medium px-2">
                          Page {page} of {totalPages}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPage(Math.min(totalPages, page + 1))}
                          disabled={page >= totalPages}
                          data-testid="button-next-page"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
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
