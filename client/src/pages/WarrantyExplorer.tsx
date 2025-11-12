import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Search,
  RefreshCw,
  Shield,
  Users,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  PieChart,
  Download,
  ChevronDown,
  Check,
  X,
  Sparkles,
  Clock,
  Laptop,
  Package,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";
import { format, subDays, subMonths, startOfMonth, endOfMonth, differenceInDays, parseISO } from "date-fns";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface CoveredUnit {
  id: string;
  serialNumber: string;
  make: string;
  model: string;
  processor: string | null;
  ram: string | null;
  category: string | null;
  customerName: string | null;
  orderNumber: string | null;
  coverageDescription: string | null;
  coverageStartDate: string;
  coverageEndDate: string;
  isCoverageActive: boolean | null;
}

interface FilterState {
  make: string[];
  model: string[];
  processor: string[];
  ram: string[];
  category: string[];
  customerName: string[];
  orderNumber: string[];
  coverageDescription: string[];
  status: string[];
  search: string;
  coverageStartDateFrom: string;
  coverageStartDateTo: string;
  coverageEndDateFrom: string;
  coverageEndDateTo: string;
}

interface StatsResponse {
  total: number;
  active: number;
  expiring: number;
  expired: number;
}

const CHART_COLORS = {
  primary: "#6B7FBD",
  secondary: "#9B93D4",
  accent: "#5EBFB3",
  info: "#6EA8DC",
  warning: "#E89B6B",
  error: "#E87D8F",
};

const PRESET_RANGES = [
  { label: "Last 30 Days", days: 30 },
  { label: "Last 90 Days", days: 90 },
  { label: "Last 180 Days", days: 180 },
  { label: "Last 12 Months", days: 365 },
];

export default function WarrantyExplorer() {
  const { toast } = useToast();
  const [selectedUnit, setSelectedUnit] = useState<CoveredUnit | null>(null);

  // Filter state with date ranges defaulting to last 12 months
  const [filters, setFilters] = useState<FilterState>({
    make: [],
    model: [],
    processor: [],
    ram: [],
    category: [],
    customerName: [],
    orderNumber: [],
    coverageDescription: [],
    status: [],
    search: "",
    coverageStartDateFrom: format(subMonths(new Date(), 12), "yyyy-MM-dd"),
    coverageStartDateTo: format(new Date(), "yyyy-MM-dd"),
    coverageEndDateFrom: "",
    coverageEndDateTo: "",
  });

  const [page, setPage] = useState(1);
  const [groupBy, setGroupBy] = useState<"none" | "customer" | "make" | "model" | "status">("none");
  const pageSize = 50;

  // Date range popovers
  const [showStartDateFrom, setShowStartDateFrom] = useState(false);
  const [showStartDateTo, setShowStartDateTo] = useState(false);
  const [showEndDateFrom, setShowEndDateFrom] = useState(false);
  const [showEndDateTo, setShowEndDateTo] = useState(false);

  // Build filter params for API
  const filterParams = useMemo(() => {
    const params: Record<string, string | string[]> = {};
    if (filters.make.length > 0) params.make = filters.make;
    if (filters.model.length > 0) params.model = filters.model;
    if (filters.processor.length > 0) params.processor = filters.processor;
    if (filters.ram.length > 0) params.ram = filters.ram;
    if (filters.category.length > 0) params.category = filters.category;
    if (filters.customerName.length > 0) params.customerName = filters.customerName;
    if (filters.orderNumber.length > 0) params.orderNumber = filters.orderNumber;
    if (filters.coverageDescription.length > 0) params.coverageDescription = filters.coverageDescription;
    if (filters.status.length > 0) params.status = filters.status;
    if (filters.search) params.search = filters.search;
    if (filters.coverageStartDateFrom) params.coverageStartDateFrom = filters.coverageStartDateFrom;
    if (filters.coverageStartDateTo) params.coverageStartDateTo = filters.coverageStartDateTo;
    if (filters.coverageEndDateFrom) params.coverageEndDateFrom = filters.coverageEndDateFrom;
    if (filters.coverageEndDateTo) params.coverageEndDateTo = filters.coverageEndDateTo;
    return params;
  }, [filters]);

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery<StatsResponse>({
    queryKey: ["/api/covered-units/stats", filterParams],
  });

  // Fetch units with pagination
  const { data: units = [], isLoading: unitsLoading, refetch } = useQuery<CoveredUnit[]>({
    queryKey: ["/api/covered-units", { ...filterParams, limit: pageSize, offset: (page - 1) * pageSize }],
  });

  // Fetch all units for analytics (limited to filtered set)
  const { data: allUnits = [] } = useQuery<CoveredUnit[]>({
    queryKey: ["/api/covered-units", { ...filterParams, limit: 10000, offset: 0 }],
  });

  // Fetch filter options
  const { data: filterOptions } = useQuery<{
    makes: string[];
    models: string[];
    customers: string[];
    orders: string[];
    coverageDescriptions: string[];
  }>({
    queryKey: ["/api/covered-units/filter-options"],
  });

  // Extract unique values for additional filters
  const uniqueProcessors = useMemo(() => 
    Array.from(new Set(allUnits.filter(u => u.processor).map(u => u.processor!))).sort(),
    [allUnits]
  );
  const uniqueRam = useMemo(() => 
    Array.from(new Set(allUnits.filter(u => u.ram).map(u => u.ram!))).sort(),
    [allUnits]
  );
  const uniqueCategories = useMemo(() => 
    Array.from(new Set(allUnits.filter(u => u.category).map(u => u.category!))).sort(),
    [allUnits]
  );

  // Analytics: Coverage Timeline
  const coverageTimeline = useMemo(() => {
    const monthMap = new Map<string, { starts: number; ends: number; active: number }>();
    
    allUnits.forEach(unit => {
      const startMonth = format(parseISO(unit.coverageStartDate), "MMM yyyy");
      const endMonth = format(parseISO(unit.coverageEndDate), "MMM yyyy");
      
      if (!monthMap.has(startMonth)) {
        monthMap.set(startMonth, { starts: 0, ends: 0, active: 0 });
      }
      monthMap.get(startMonth)!.starts++;
      
      if (!monthMap.has(endMonth)) {
        monthMap.set(endMonth, { starts: 0, ends: 0, active: 0 });
      }
      monthMap.get(endMonth)!.ends++;
    });

    return Array.from(monthMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-12);
  }, [allUnits]);

  // Analytics: Unique Customers Count
  const uniqueCustomersCount = useMemo(() => {
    const customerSet = new Set<string>();
    allUnits.forEach(unit => {
      const customer = unit.customerName || "Unknown";
      customerSet.add(customer);
    });
    return customerSet.size;
  }, [allUnits]);

  // Analytics: Customer Distribution (top 10 for chart)
  const customerDistribution = useMemo(() => {
    const customerMap = new Map<string, number>();
    allUnits.forEach(unit => {
      const customer = unit.customerName || "Unknown";
      customerMap.set(customer, (customerMap.get(customer) || 0) + 1);
    });
    return Array.from(customerMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [allUnits]);

  // Analytics: Make Distribution
  const makeDistribution = useMemo(() => {
    const makeMap = new Map<string, number>();
    allUnits.forEach(unit => {
      makeMap.set(unit.make, (makeMap.get(unit.make) || 0) + 1);
    });
    return Array.from(makeMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [allUnits]);

  // Analytics: Expiration Risk Timeline
  const expirationRisk = useMemo(() => {
    const today = new Date();
    const next30 = allUnits.filter(u => {
      const endDate = parseISO(u.coverageEndDate);
      const daysUntil = differenceInDays(endDate, today);
      return daysUntil >= 0 && daysUntil <= 30;
    }).length;
    const next90 = allUnits.filter(u => {
      const endDate = parseISO(u.coverageEndDate);
      const daysUntil = differenceInDays(endDate, today);
      return daysUntil > 30 && daysUntil <= 90;
    }).length;
    const next180 = allUnits.filter(u => {
      const endDate = parseISO(u.coverageEndDate);
      const daysUntil = differenceInDays(endDate, today);
      return daysUntil > 90 && daysUntil <= 180;
    }).length;
    const beyond = allUnits.filter(u => {
      const endDate = parseISO(u.coverageEndDate);
      const daysUntil = differenceInDays(endDate, today);
      return daysUntil > 180;
    }).length;

    return [
      { period: "0-30 Days", count: next30, fill: CHART_COLORS.error },
      { period: "31-90 Days", count: next90, fill: CHART_COLORS.warning },
      { period: "91-180 Days", count: next180, fill: CHART_COLORS.info },
      { period: "180+ Days", count: beyond, fill: CHART_COLORS.accent },
    ];
  }, [allUnits]);

  const updateFilter = (key: keyof FilterState, value: string[] | string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      make: [],
      model: [],
      processor: [],
      ram: [],
      category: [],
      customerName: [],
      orderNumber: [],
      coverageDescription: [],
      status: [],
      search: "",
      coverageStartDateFrom: format(subMonths(new Date(), 12), "yyyy-MM-dd"),
      coverageStartDateTo: format(new Date(), "yyyy-MM-dd"),
      coverageEndDateFrom: "",
      coverageEndDateTo: "",
    });
    setPage(1);
  };

  const applyDatePreset = (days: number) => {
    const to = new Date();
    const from = subDays(to, days);
    setFilters(prev => ({
      ...prev,
      coverageStartDateFrom: format(from, "yyyy-MM-dd"),
      coverageStartDateTo: format(to, "yyyy-MM-dd"),
    }));
  };

  const exportToExcel = () => {
    if (allUnits.length === 0) {
      toast({
        title: "No data to export",
        variant: "destructive",
      });
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      allUnits.map(unit => ({
        "Serial Number": unit.serialNumber,
        "Make": unit.make,
        "Model": unit.model,
        "Processor": unit.processor || "",
        "RAM": unit.ram || "",
        "Category": unit.category || "",
        "Customer": unit.customerName || "",
        "Order Number": unit.orderNumber || "",
        "Coverage": unit.coverageDescription || "",
        "Start Date": unit.coverageStartDate,
        "End Date": unit.coverageEndDate,
        "Status": unit.isCoverageActive ? "Active" : "Inactive",
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Warranty Data");
    XLSX.writeFile(workbook, `warranty-explorer-${format(new Date(), "yyyy-MM-dd")}.xlsx`);

    toast({
      title: "Export successful",
      description: `Exported ${allUnits.length} warranty records`,
    });
  };

  const activeFilterCount = useMemo(() => {
    return [
      filters.make,
      filters.model,
      filters.processor,
      filters.ram,
      filters.category,
      filters.customerName,
      filters.orderNumber,
      filters.coverageDescription,
      filters.status,
    ].filter(arr => arr.length > 0).length + (filters.search ? 1 : 0);
  }, [filters]);

  // Grouped data for table
  const groupedUnits = useMemo(() => {
    if (groupBy === "none") return null;

    const groups = new Map<string, CoveredUnit[]>();
    units.forEach(unit => {
      let key = "";
      switch (groupBy) {
        case "customer":
          key = unit.customerName || "Unknown";
          break;
        case "make":
          key = unit.make;
          break;
        case "model":
          key = unit.model;
          break;
        case "status":
          key = unit.isCoverageActive ? "Active" : "Inactive";
          break;
      }
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(unit);
    });

    return Array.from(groups.entries())
      .map(([key, items]) => ({ key, items, count: items.length }))
      .sort((a, b) => b.count - a.count);
  }, [units, groupBy]);

  const MultiSelectFilter = ({
    label,
    options,
    selected,
    onSelectionChange,
    testId,
  }: {
    label: string;
    options: string[];
    selected: string[];
    onSelectionChange: (values: string[]) => void;
    testId: string;
  }) => {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredOptions = useMemo(() => {
      if (!searchTerm) return options;
      return options.filter(opt =>
        opt.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }, [options, searchTerm]);

    const toggleOption = (option: string) => {
      if (selected.includes(option)) {
        onSelectionChange(selected.filter(v => v !== option));
      } else {
        onSelectionChange([...selected, option]);
      }
    };

    return (
      <div>
        <label className="text-sm font-medium mb-2 block text-muted-foreground">{label}</label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between font-normal"
              data-testid={testId}
            >
              <span className="truncate">
                {selected.length > 0 ? `${selected.length} selected` : `All ${label.toLowerCase()}`}
              </span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput
                placeholder={`Search ${label.toLowerCase()}...`}
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
              <CommandList>
                <CommandEmpty>No options found</CommandEmpty>
                <CommandGroup>
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option}
                      onSelect={() => toggleOption(option)}
                      className="cursor-pointer"
                    >
                      <Checkbox
                        checked={selected.includes(option)}
                        className="mr-2"
                      />
                      <span className="truncate">{option}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  const getStatusBadge = (unit: CoveredUnit) => {
    if (!unit.isCoverageActive) {
      return <Badge variant="outline" className="text-muted-foreground">Expired</Badge>;
    }

    const daysUntilExpiry = differenceInDays(parseISO(unit.coverageEndDate), new Date());
    if (daysUntilExpiry < 0) {
      return <Badge variant="outline" className="text-muted-foreground">Expires in {daysUntilExpiry}d</Badge>;
    } else if (daysUntilExpiry <= 30) {
      return <Badge className="bg-[#E87D8F] hover:bg-[#E87D8F]/90">Expires in {daysUntilExpiry}d</Badge>;
    } else if (daysUntilExpiry <= 90) {
      return <Badge className="bg-[#E89B6B] hover:bg-[#E89B6B]/90">Expires in {daysUntilExpiry}d</Badge>;
    }
    return <Badge className="bg-[#5EBFB3] hover:bg-[#5EBFB3]/90">Active</Badge>;
  };

  return (
    <div className="space-y-6 p-8" data-testid="page-warranty-explorer">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Warranty Explorer</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Analyze warranty coverage trends, patterns, and insights
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="default"
            onClick={() => refetch()}
            disabled={unitsLoading}
            data-testid="button-refresh"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", unitsLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            variant="default"
            size="default"
            onClick={exportToExcel}
            disabled={allUnits.length === 0}
            data-testid="button-export"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Quick Date Presets */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">Quick ranges:</span>
        {PRESET_RANGES.map(preset => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            onClick={() => applyDatePreset(preset.days)}
            className="h-8"
            data-testid={`button-preset-${preset.days}`}
          >
            {preset.label}
          </Button>
        ))}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 text-muted-foreground"
            data-testid="button-clear-filters"
          >
            <X className="h-3 w-3 mr-1" />
            Clear all filters
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border hover-elevate transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-[#6B7FBD]/10 rounded-xl">
                <Shield className="h-6 w-6 text-[#6B7FBD]" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Coverage</p>
              <p className="text-4xl font-bold tracking-tight">
                {statsLoading ? "..." : (stats?.total || 0).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border hover-elevate transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-[#5EBFB3]/10 rounded-xl">
                <TrendingUp className="h-6 w-6 text-[#5EBFB3]" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Active Warranties</p>
              <p className="text-4xl font-bold tracking-tight">
                {statsLoading ? "..." : (stats?.active || 0).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border hover-elevate transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-[#E89B6B]/10 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-[#E89B6B]" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Expiring Soon</p>
              <p className="text-4xl font-bold tracking-tight">
                {statsLoading ? "..." : (stats?.expiring || 0).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border hover-elevate transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-[#6EA8DC]/10 rounded-xl">
                <Users className="h-6 w-6 text-[#6EA8DC]" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Unique Customers</p>
              <p className="text-4xl font-bold tracking-tight">
                {uniqueCustomersCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coverage Timeline */}
        <Card className="rounded-2xl border">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Coverage Timeline
            </CardTitle>
            <p className="text-sm text-muted-foreground">Warranty starts and ends by month</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={coverageTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#52525B", fontSize: 12 }}
                    tickLine={{ stroke: "#E4E4E7" }}
                  />
                  <YAxis
                    tick={{ fill: "#52525B", fontSize: 12 }}
                    tickLine={{ stroke: "#E4E4E7" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E4E4E7",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="starts"
                    stackId="1"
                    stroke={CHART_COLORS.accent}
                    fill={CHART_COLORS.accent}
                    fillOpacity={0.6}
                    name="Coverage Starts"
                  />
                  <Area
                    type="monotone"
                    dataKey="ends"
                    stackId="2"
                    stroke={CHART_COLORS.warning}
                    fill={CHART_COLORS.warning}
                    fillOpacity={0.6}
                    name="Coverage Ends"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expiration Risk */}
        <Card className="rounded-2xl border">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              Expiration Risk Analysis
            </CardTitle>
            <p className="text-sm text-muted-foreground">Warranties by time until expiration</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expirationRisk} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                  <XAxis
                    type="number"
                    tick={{ fill: "#52525B", fontSize: 12 }}
                    tickLine={{ stroke: "#E4E4E7" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="period"
                    tick={{ fill: "#52525B", fontSize: 12 }}
                    tickLine={{ stroke: "#E4E4E7" }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E4E4E7",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {expirationRisk.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Customer Distribution */}
        <Card className="rounded-2xl border">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-info" />
              Top Customers by Coverage
            </CardTitle>
            <p className="text-sm text-muted-foreground">Warranty count by customer</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={customerDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#52525B", fontSize: 11 }}
                    tickLine={{ stroke: "#E4E4E7" }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tick={{ fill: "#52525B", fontSize: 12 }}
                    tickLine={{ stroke: "#E4E4E7" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E4E4E7",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill={CHART_COLORS.info} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Make Distribution */}
        <Card className="rounded-2xl border">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Laptop className="h-5 w-5 text-secondary" />
              Coverage by Manufacturer
            </CardTitle>
            <p className="text-sm text-muted-foreground">Distribution across makes</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={makeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {makeDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E4E4E7",
                      borderRadius: "8px",
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters */}
      <Card className="rounded-2xl border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Filter & Explore Data
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount} active
                </Badge>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search */}
          <div>
            <label className="text-sm font-medium mb-2 block text-muted-foreground">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search serial number, customer, order..."
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
          </div>

          {/* Date Range Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">
                Coverage Start (From)
              </label>
              <Popover open={showStartDateFrom} onOpenChange={setShowStartDateFrom}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.coverageStartDateFrom
                      ? format(parseISO(filters.coverageStartDateFrom), "MMM dd, yyyy")
                      : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.coverageStartDateFrom ? parseISO(filters.coverageStartDateFrom) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        updateFilter("coverageStartDateFrom", format(date, "yyyy-MM-dd"));
                        setShowStartDateFrom(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">
                Coverage Start (To)
              </label>
              <Popover open={showStartDateTo} onOpenChange={setShowStartDateTo}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.coverageStartDateTo
                      ? format(parseISO(filters.coverageStartDateTo), "MMM dd, yyyy")
                      : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.coverageStartDateTo ? parseISO(filters.coverageStartDateTo) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        updateFilter("coverageStartDateTo", format(date, "yyyy-MM-dd"));
                        setShowStartDateTo(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">
                Coverage End (From)
              </label>
              <Popover open={showEndDateFrom} onOpenChange={setShowEndDateFrom}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.coverageEndDateFrom
                      ? format(parseISO(filters.coverageEndDateFrom), "MMM dd, yyyy")
                      : "Any date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.coverageEndDateFrom ? parseISO(filters.coverageEndDateFrom) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        updateFilter("coverageEndDateFrom", format(date, "yyyy-MM-dd"));
                        setShowEndDateFrom(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">
                Coverage End (To)
              </label>
              <Popover open={showEndDateTo} onOpenChange={setShowEndDateTo}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.coverageEndDateTo
                      ? format(parseISO(filters.coverageEndDateTo), "MMM dd, yyyy")
                      : "Any date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.coverageEndDateTo ? parseISO(filters.coverageEndDateTo) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        updateFilter("coverageEndDateTo", format(date, "yyyy-MM-dd"));
                        setShowEndDateTo(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Multi-select Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">Status</label>
              <Select
                value={filters.status[0] || "all"}
                onValueChange={(value) => updateFilter("status", value === "all" ? [] : [value])}
              >
                <SelectTrigger data-testid="select-status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <MultiSelectFilter
              label="Make"
              options={filterOptions?.makes || []}
              selected={filters.make}
              onSelectionChange={(values) => updateFilter("make", values)}
              testId="select-make"
            />

            <MultiSelectFilter
              label="Model"
              options={filterOptions?.models || []}
              selected={filters.model}
              onSelectionChange={(values) => updateFilter("model", values)}
              testId="select-model"
            />

            <MultiSelectFilter
              label="Customer"
              options={filterOptions?.customers || []}
              selected={filters.customerName}
              onSelectionChange={(values) => updateFilter("customerName", values)}
              testId="select-customer"
            />

            <MultiSelectFilter
              label="Order Number"
              options={filterOptions?.orders || []}
              selected={filters.orderNumber}
              onSelectionChange={(values) => updateFilter("orderNumber", values)}
              testId="select-order"
            />

            <MultiSelectFilter
              label="Processor"
              options={uniqueProcessors}
              selected={filters.processor}
              onSelectionChange={(values) => updateFilter("processor", values)}
              testId="select-processor"
            />

            <MultiSelectFilter
              label="RAM"
              options={uniqueRam}
              selected={filters.ram}
              onSelectionChange={(values) => updateFilter("ram", values)}
              testId="select-ram"
            />

            <MultiSelectFilter
              label="Category"
              options={uniqueCategories}
              selected={filters.category}
              onSelectionChange={(values) => updateFilter("category", values)}
              testId="select-category"
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Table with Grouping */}
      <Card className="rounded-2xl border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-xl font-semibold">
              Warranty Records ({(stats?.total || 0).toLocaleString()} total)
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Group by:</span>
              <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
                <SelectTrigger className="w-[150px]" data-testid="select-groupby">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="make">Make</SelectItem>
                  <SelectItem value="model">Model</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Serial Number</TableHead>
                  <TableHead className="font-semibold">Make / Model</TableHead>
                  <TableHead className="font-semibold">Specs</TableHead>
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold">Coverage Period</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unitsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading warranty data...
                    </TableCell>
                  </TableRow>
                ) : groupBy !== "none" && groupedUnits ? (
                  groupedUnits.map(group => (
                    <>
                      <TableRow key={`group-${group.key}`} className="bg-muted/30 font-semibold">
                        <TableCell colSpan={7}>
                          {group.key} ({group.count} records)
                        </TableCell>
                      </TableRow>
                      {group.items.map(unit => (
                        <TableRow
                          key={unit.id}
                          className="hover:bg-muted/50 cursor-pointer"
                          onClick={() => setSelectedUnit(unit)}
                          data-testid={`row-warranty-${unit.id}`}
                        >
                          <TableCell className="font-mono text-sm">{unit.serialNumber}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{unit.make}</div>
                              <div className="text-sm text-muted-foreground">{unit.model}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {[unit.processor, unit.ram].filter(Boolean).join(", ") || "—"}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{unit.customerName || "—"}</div>
                              <div className="text-xs text-muted-foreground">
                                {unit.orderNumber || "—"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div>
                              <div>{format(parseISO(unit.coverageStartDate), "MMM dd, yyyy")}</div>
                              <div className="text-muted-foreground">
                                to {format(parseISO(unit.coverageEndDate), "MMM dd, yyyy")}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(unit)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUnit(unit);
                              }}
                            >
                              Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  ))
                ) : units.length > 0 ? (
                  units.map(unit => (
                    <TableRow
                      key={unit.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedUnit(unit)}
                      data-testid={`row-warranty-${unit.id}`}
                    >
                      <TableCell className="font-mono text-sm">{unit.serialNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{unit.make}</div>
                          <div className="text-sm text-muted-foreground">{unit.model}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {[unit.processor, unit.ram].filter(Boolean).join(", ") || "—"}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{unit.customerName || "—"}</div>
                          <div className="text-xs text-muted-foreground">
                            {unit.orderNumber || "—"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>
                          <div>{format(parseISO(unit.coverageStartDate), "MMM dd, yyyy")}</div>
                          <div className="text-muted-foreground">
                            to {format(parseISO(unit.coverageEndDate), "MMM dd, yyyy")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(unit)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUnit(unit);
                          }}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No warranty records found. Try adjusting your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!unitsLoading && units.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, stats?.total || 0)} of {(stats?.total || 0).toLocaleString()} results
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  data-testid="button-prev-page"
                >
                  Previous
                </Button>
                <span className="text-sm">Page {page}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={units.length < pageSize}
                  data-testid="button-next-page"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={!!selectedUnit} onOpenChange={(open) => !open && setSelectedUnit(null)}>
        <SheetContent className="sm:max-w-[500px] overflow-y-auto">
          {selectedUnit && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Warranty Details
                </SheetTitle>
                <SheetDescription>
                  Complete information for {selectedUnit.serialNumber}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Device Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Serial Number</span>
                      <span className="text-sm font-mono font-medium">{selectedUnit.serialNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Make</span>
                      <span className="text-sm font-medium">{selectedUnit.make}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Model</span>
                      <span className="text-sm font-medium">{selectedUnit.model}</span>
                    </div>
                    {selectedUnit.processor && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Processor</span>
                        <span className="text-sm font-medium">{selectedUnit.processor}</span>
                      </div>
                    )}
                    {selectedUnit.ram && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">RAM</span>
                        <span className="text-sm font-medium">{selectedUnit.ram}</span>
                      </div>
                    )}
                    {selectedUnit.category && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Category</span>
                        <span className="text-sm font-medium">{selectedUnit.category}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Customer Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Customer</span>
                      <span className="text-sm font-medium">{selectedUnit.customerName || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Order Number</span>
                      <span className="text-sm font-medium">{selectedUnit.orderNumber || "—"}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Coverage Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Coverage Type</span>
                      <span className="text-sm font-medium">{selectedUnit.coverageDescription || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Start Date</span>
                      <span className="text-sm font-medium">
                        {format(parseISO(selectedUnit.coverageStartDate), "MMM dd, yyyy")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">End Date</span>
                      <span className="text-sm font-medium">
                        {format(parseISO(selectedUnit.coverageEndDate), "MMM dd, yyyy")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Status</span>
                      {getStatusBadge(selectedUnit)}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
