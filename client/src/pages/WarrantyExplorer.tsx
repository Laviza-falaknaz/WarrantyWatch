import { useState, useMemo, useCallback } from "react";
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
import {
  Search,
  RefreshCw,
  Laptop,
  Users,
  ShieldCheck,
  Calendar,
  ChevronDown,
  Check,
  X,
  Download,
  SlidersHorizontal,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';

interface CoveredUnit {
  id: string;
  serialNumber: string;
  areaId: string;
  itemId: string;
  make: string;
  model: string;
  processor: string | null;
  generation: string | null;
  ram: string | null;
  hdd: string | null;
  displaySize: string | null;
  touchscreen: boolean | null;
  category: string | null;
  customerName: string | null;
  orderNumber: string | null;
  orderDate: string | null;
  coverageDescription: string | null;
  coverageStartDate: string;
  coverageEndDate: string;
  coverageStatus: string | null;
  coverageDurationDays: number | null;
  isCoverageActive: boolean | null;
  createdOn: string;
  modifiedOn: string;
}

interface FilterOptions {
  makes: string[];
  models: string[];
  customers: string[];
  orders: string[];
  coverageDescriptions: string[];
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
}

interface StatsResponse {
  total: number;
  active: number;
  expiring: number;
  expired: number;
}

export default function WarrantyExplorer() {
  const { toast } = useToast();

  // Filter state
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
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Fetch filter options
  const { data: filterOptions } = useQuery<FilterOptions>({
    queryKey: ["/api/covered-units/filter-options"],
  });

  // Build filter params object for API calls
  const filterParams = useMemo(() => {
    const params: Record<string, any> = {};
    
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        params[key] = value;
      } else if (typeof value === "string" && value) {
        params[key] = value;
      }
    });

    return params;
  }, [filters]);

  // Fetch covered units stats
  const { data: stats } = useQuery<StatsResponse>({
    queryKey: ["/api/covered-units/stats", filterParams],
    enabled: true,
  });

  // Fetch covered units with filters
  const {
    data: coveredUnits = [],
    isLoading,
    refetch,
  } = useQuery<CoveredUnit[]>({
    queryKey: [
      "/api/covered-units",
      {
        ...filterParams,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      },
    ],
  });

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!stats) return { total: 0, active: 0, expiringSoon: 0, uniqueCustomers: 0 };
    
    return {
      total: stats.total || 0,
      active: stats.active || 0,
      expiringSoon: stats.expiring || 0,
      uniqueCustomers: filterOptions?.customers.length || 0,
    };
  }, [stats, filterOptions]);

  // Get all available filter values from covered units (from entire dataset)
  const { data: allCoveredUnitsForFilters = [] } = useQuery<CoveredUnit[]>({
    queryKey: ["/api/covered-units", { limit: 10000 }],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Get unique values for multi-select filters from all data
  const dynamicFilterOptions = useMemo(() => {
    const processors = Array.from(new Set(allCoveredUnitsForFilters.map(u => u.processor).filter(Boolean))).sort() as string[];
    const rams = Array.from(new Set(allCoveredUnitsForFilters.map(u => u.ram).filter(Boolean))).sort() as string[];
    const categories = Array.from(new Set(allCoveredUnitsForFilters.map(u => u.category).filter(Boolean))).sort() as string[];
    
    return { processors, rams, categories };
  }, [allCoveredUnitsForFilters]);

  // Update filter
  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
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
    });
    setCurrentPage(1);
  }, []);

  // Export to Excel
  const handleExport = useCallback(() => {
    if (coveredUnits.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no warranty records to export.",
        variant: "destructive",
      });
      return;
    }

    const exportData = coveredUnits.map(unit => ({
      "Serial Number": unit.serialNumber,
      "Make": unit.make,
      "Model": unit.model,
      "Processor": unit.processor || "",
      "RAM": unit.ram || "",
      "Category": unit.category || "",
      "Customer": unit.customerName || "",
      "Order Number": unit.orderNumber || "",
      "Coverage Description": unit.coverageDescription || "",
      "Start Date": unit.coverageStartDate ? new Date(unit.coverageStartDate).toLocaleDateString() : "",
      "End Date": unit.coverageEndDate ? new Date(unit.coverageEndDate).toLocaleDateString() : "",
      "Status": unit.isCoverageActive ? "Active" : "Inactive",
      "Area": unit.areaId,
      "Item ID": unit.itemId,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Warranty Records");
    
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `warranty-explorer-${timestamp}.xlsx`);

    toast({
      title: "Export successful",
      description: `Exported ${coveredUnits.length} warranty records to Excel.`,
    });
  }, [coveredUnits, toast]);

  // Format date helper
  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate days until expiration
  const getDaysUntilExpiration = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get expiration status badge
  const getExpirationBadge = (unit: CoveredUnit) => {
    if (!unit.isCoverageActive) {
      return <Badge variant="secondary" className="text-xs">Expired</Badge>;
    }
    
    const daysLeft = getDaysUntilExpiration(unit.coverageEndDate);
    
    if (daysLeft <= 30) {
      return <Badge variant="destructive" className="text-xs">Expires in {daysLeft}d</Badge>;
    } else if (daysLeft <= 90) {
      return <Badge className="bg-orange-500 hover:bg-orange-600 text-xs">Expires in {daysLeft}d</Badge>;
    } else {
      return <Badge variant="default" className="text-xs">Active</Badge>;
    }
  };

  // Active filter count
  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(v => 
      (Array.isArray(v) && v.length > 0) || (typeof v === "string" && v)
    ).length;
  }, [filters]);

  // Calculate total pages
  const totalPages = Math.ceil((stats?.total || 0) / itemsPerPage);

  return (
    <div className="space-y-6" data-testid="page-warranty-explorer">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Warranty Explorer</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and analyze warranty coverage for deployed devices
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={coveredUnits.length === 0}
            data-testid="button-export"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
            data-testid="button-refresh"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-warranties">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Warranties</CardTitle>
            <Laptop className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="value-total-warranties">
              {(summaryMetrics?.total || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Deployed units under coverage
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-active-warranties">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Coverage</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="value-active-warranties">
              {(summaryMetrics?.active || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently covered devices
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-expiring-soon">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="value-expiring-soon">
              {(summaryMetrics?.expiringSoon || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Within 90 days
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-unique-customers">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="value-unique-customers">
              {(summaryMetrics?.uniqueCustomers || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Unique customer accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              <CardTitle className="text-base">Filters</CardTitle>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeFilterCount} active
                </Badge>
              )}
            </div>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                data-testid="button-clear-filters"
              >
                <X className="h-4 w-4 mr-1" />
                Clear all
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Serial number, customer, order..."
                  value={filters.search}
                  onChange={(e) => updateFilter("search", e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
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

            {/* Make */}
            <MultiSelectFilter
              label="Make"
              options={filterOptions?.makes || []}
              selected={filters.make}
              onChange={(value) => updateFilter("make", value)}
              placeholder="Select makes"
              testId="filter-make"
            />

            {/* Model */}
            <MultiSelectFilter
              label="Model"
              options={filterOptions?.models || []}
              selected={filters.model}
              onChange={(value) => updateFilter("model", value)}
              placeholder="Select models"
              testId="filter-model"
            />

            {/* Customer */}
            <MultiSelectFilter
              label="Customer"
              options={filterOptions?.customers || []}
              selected={filters.customerName}
              onChange={(value) => updateFilter("customerName", value)}
              placeholder="Select customers"
              testId="filter-customer"
            />

            {/* Order Number */}
            <MultiSelectFilter
              label="Order Number"
              options={filterOptions?.orders || []}
              selected={filters.orderNumber}
              onChange={(value) => updateFilter("orderNumber", value)}
              placeholder="Select orders"
              testId="filter-order"
            />

            {/* Processor */}
            <MultiSelectFilter
              label="Processor"
              options={dynamicFilterOptions.processors}
              selected={filters.processor}
              onChange={(value) => updateFilter("processor", value)}
              placeholder="Select processors"
              testId="filter-processor"
            />

            {/* RAM */}
            <MultiSelectFilter
              label="RAM"
              options={dynamicFilterOptions.rams}
              selected={filters.ram}
              onChange={(value) => updateFilter("ram", value)}
              placeholder="Select RAM"
              testId="filter-ram"
            />

            {/* Category */}
            <MultiSelectFilter
              label="Category"
              options={dynamicFilterOptions.categories}
              selected={filters.category}
              onChange={(value) => updateFilter("category", value)}
              placeholder="Select categories"
              testId="filter-category"
            />

            {/* Coverage Description */}
            <MultiSelectFilter
              label="Coverage Type"
              options={filterOptions?.coverageDescriptions || []}
              selected={filters.coverageDescription}
              onChange={(value) => updateFilter("coverageDescription", value)}
              placeholder="Select coverage types"
              testId="filter-coverage"
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Warranty Records
              {stats && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({stats.total.toLocaleString()} total)
                </span>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading warranty records...</span>
            </div>
          ) : coveredUnits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Laptop className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No warranty records found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your filters or search criteria
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32">Status</TableHead>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>Make/Model</TableHead>
                      <TableHead>Specifications</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Coverage</TableHead>
                      <TableHead className="text-right">Period</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coveredUnits.map((unit) => (
                      <TableRow key={unit.id} data-testid={`row-warranty-${unit.id}`}>
                        <TableCell>
                          {getExpirationBadge(unit)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {unit.serialNumber}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{unit.make}</div>
                          <div className="text-sm text-muted-foreground">{unit.model}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-0.5">
                            {unit.processor && (
                              <div className="text-muted-foreground">{unit.processor}</div>
                            )}
                            {unit.ram && <div className="text-muted-foreground">{unit.ram} RAM</div>}
                            {unit.category && (
                              <Badge variant="outline" className="text-xs">
                                {unit.category}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{unit.customerName || "N/A"}</div>
                            {unit.orderNumber && (
                              <div className="text-muted-foreground text-xs">
                                Order: {unit.orderNumber}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {unit.coverageDescription || "Standard Warranty"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          <div>{formatDate(unit.coverageStartDate)}</div>
                          <div className="text-muted-foreground">to</div>
                          <div>{formatDate(unit.coverageEndDate)}</div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, stats?.total || 0)} of{" "}
                    {(stats?.total || 0).toLocaleString()} records
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      data-testid="button-prev-page"
                    >
                      Previous
                    </Button>
                    <div className="text-sm">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      data-testid="button-next-page"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Multi-select filter component
interface MultiSelectFilterProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  testId?: string;
}

function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
  placeholder,
  testId,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Filter options based on search (case-insensitive)
  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const searchUpper = search.toLocaleUpperCase('en-US');
    return options.filter(option => 
      option.toLocaleUpperCase('en-US').includes(searchUpper)
    );
  }, [options, search]);

  const toggleOption = (option: string) => {
    // Case-insensitive toggle
    const optionUpper = option.toLocaleUpperCase('en-US');
    const isSelected = selected.some(s => s.toLocaleUpperCase('en-US') === optionUpper);
    
    if (isSelected) {
      onChange(selected.filter(s => s.toLocaleUpperCase('en-US') !== optionUpper));
    } else {
      onChange([...selected, option]);
    }
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div>
      <label className="text-sm font-medium mb-2 block">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            data-testid={testId}
          >
            <span className="truncate">
              {selected.length === 0
                ? placeholder
                : `${selected.length} selected`}
            </span>
            <div className="flex items-center gap-1">
              {selected.length > 0 && (
                <X
                  className="h-3 w-3 opacity-50 hover:opacity-100"
                  onClick={clearSelection}
                />
              )}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder={`Search ${label.toLowerCase()}...`}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>No options found.</CommandEmpty>
              <CommandGroup>
                {filteredOptions.map((option) => {
                  const optionUpper = option.toLocaleUpperCase('en-US');
                  const isSelected = selected.some(s => s.toLocaleUpperCase('en-US') === optionUpper);
                  
                  return (
                    <CommandItem
                      key={option}
                      value={option}
                      onSelect={() => toggleOption(option)}
                    >
                      <Checkbox
                        checked={isSelected}
                        className="mr-2"
                      />
                      <span className="flex-1">{option}</span>
                      {isSelected && <Check className="h-4 w-4" />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selected.map((item) => (
            <Badge
              key={item}
              variant="secondary"
              className="text-xs"
            >
              {item}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => toggleOption(item)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
