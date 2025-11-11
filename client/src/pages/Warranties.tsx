import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import DataTable, { Column } from "@/components/DataTable";
import SearchBar from "@/components/SearchBar";
import TablePagination from "@/components/TablePagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Download, Shield, CheckCircle2, Clock, XCircle, X, Check, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { CoveredUnit, AppConfiguration } from "@shared/schema";

interface WarrantyFilters {
  make: string[];
  model: string[];
  customer: string[];
  order: string[];
  coverageDescription: string[];
  coverageStartDateFrom?: Date;
  coverageStartDateTo?: Date;
  coverageEndDateFrom?: Date;
  coverageEndDateTo?: Date;
}

// MultiSelect Component
function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
  testId
}: {
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  testId?: string;
}) {
  const [open, setOpen] = useState(false);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          data-testid={testId}
        >
          {selected.length > 0 ? `${selected.length} selected` : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder={`Search...`} />
          <CommandEmpty>No options found.</CommandEmpty>
          <CommandList className="max-h-[200px] overflow-y-auto">
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => toggleOption(option)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected.includes(option) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// DatePicker Component
function DatePicker({
  date,
  onDateChange,
  placeholder,
  testId
}: {
  date?: Date;
  onDateChange: (date?: Date) => void;
  placeholder: string;
  testId?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
          data-testid={testId}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export default function Warranties() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<WarrantyFilters>({
    make: [],
    model: [],
    customer: [],
    order: [],
    coverageDescription: [],
  });
  
  const ITEMS_PER_PAGE = 100;

  const { data: configuration } = useQuery<AppConfiguration>({
    queryKey: ["/api/configuration"],
  });

  const expiringThresholdDays = configuration?.expiringCoverageDays || 30;

  const { data: filterOptions } = useQuery({
    queryKey: ["/api/covered-units/filter-options"],
    queryFn: async () => {
      const response = await fetch("/api/covered-units/filter-options");
      if (!response.ok) throw new Error("Failed to fetch filter options");
      return response.json() as Promise<{
        makes: string[];
        models: string[];
        customers: string[];
        orders: string[];
        coverageDescriptions: string[];
      }>;
    },
  });

  // Helper to build URL params with all filters
  const buildFilterParams = (includeLimit = false, includeOffset = false) => {
    const params = new URLSearchParams();
    if (searchQuery) {
      params.append("search", searchQuery);
    }
    if (filters.make.length > 0) {
      filters.make.forEach(m => params.append("make", m));
    }
    if (filters.model.length > 0) {
      filters.model.forEach(m => params.append("model", m));
    }
    if (filters.customer.length > 0) {
      filters.customer.forEach(c => params.append("customerName", c));
    }
    if (filters.order.length > 0) {
      filters.order.forEach(o => params.append("orderNumber", o));
    }
    if (filters.coverageDescription.length > 0) {
      filters.coverageDescription.forEach(d => params.append("coverageDescription", d));
    }
    if (filters.coverageStartDateFrom) {
      params.append("coverageStartDateFrom", filters.coverageStartDateFrom.toISOString());
    }
    if (filters.coverageStartDateTo) {
      params.append("coverageStartDateTo", filters.coverageStartDateTo.toISOString());
    }
    if (filters.coverageEndDateFrom) {
      params.append("coverageEndDateFrom", filters.coverageEndDateFrom.toISOString());
    }
    if (filters.coverageEndDateTo) {
      params.append("coverageEndDateTo", filters.coverageEndDateTo.toISOString());
    }
    if (includeLimit) {
      params.append("limit", ITEMS_PER_PAGE.toString());
    }
    if (includeOffset) {
      params.append("offset", ((currentPage - 1) * ITEMS_PER_PAGE).toString());
    }
    return params;
  };

  const { data: fullStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/covered-units/stats", searchQuery, filters],
    queryFn: async () => {
      const params = buildFilterParams();
      const response = await fetch(`/api/covered-units/stats?${params}`);
      if (!response.ok) throw new Error("Failed to fetch covered units stats");
      return response.json() as Promise<{ total: number; active: number; expiring: number; expired: number; }>;
    },
  });

  const { data: stockUnderWarranty, isLoading: tableLoading } = useQuery({
    queryKey: ["/api/covered-units", searchQuery, filters, currentPage],
    queryFn: async () => {
      const params = buildFilterParams(true, true);
      const response = await fetch(`/api/covered-units?${params}`);
      if (!response.ok) throw new Error("Failed to fetch stock under warranty");
      return response.json();
    },
  });

  const getDaysRemaining = (endDate: Date) => {
    const now = new Date();
    const end = new Date(endDate);
    return Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getCoverageStatus = (daysRemaining: number) => {
    if (daysRemaining < 0) return "Expired";
    if (daysRemaining <= expiringThresholdDays) return "Expiring Soon";
    return "Active";
  };

  const stats = fullStats || { active: 0, expiring: 0, expired: 0, total: 0 };

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const clearAllFilters = () => {
    setFilters({
      make: [],
      model: [],
      customer: [],
      order: [],
      coverageDescription: [],
    });
    setSearchQuery("");
    setCurrentPage(1);
  };

  const hasActiveFilters = 
    filters.make.length > 0 ||
    filters.model.length > 0 ||
    filters.customer.length > 0 ||
    filters.order.length > 0 ||
    filters.coverageDescription.length > 0 ||
    filters.coverageStartDateFrom ||
    filters.coverageStartDateTo ||
    filters.coverageEndDateFrom ||
    filters.coverageEndDateTo;

  const totalPages = Math.ceil(stats.total / ITEMS_PER_PAGE);

  const columns: Column<CoveredUnit>[] = [
    {
      key: "serialNumber",
      header: "Serial Number",
      width: "160px",
      render: (item) => (
        <span className="font-mono text-sm" data-testid={`stock-under-warranty-serial-${item.id}`}>
          {item.serialNumber}
        </span>
      ),
    },
    {
      key: "make",
      header: "Make",
      width: "100px",
      render: (item) => (
        <span className="text-sm" data-testid={`stock-under-warranty-make-${item.id}`}>
          {item.make}
        </span>
      ),
    },
    {
      key: "model",
      header: "Model",
      width: "140px",
      render: (item) => (
        <span className="text-sm" data-testid={`stock-under-warranty-model-${item.id}`}>
          {item.model}
        </span>
      ),
    },
    {
      key: "processor",
      header: "Processor",
      width: "120px",
      render: (item) => (
        <span className="text-sm" data-testid={`stock-under-warranty-processor-${item.id}`}>
          {item.processor || "—"}
        </span>
      ),
    },
    {
      key: "ram",
      header: "RAM",
      width: "80px",
      render: (item) => (
        <span className="text-sm" data-testid={`stock-under-warranty-ram-${item.id}`}>
          {item.ram || "—"}
        </span>
      ),
    },
    {
      key: "areaId",
      header: "Area ID",
      width: "100px",
      render: (item) => (
        <span className="font-mono text-sm" data-testid={`stock-under-warranty-area-${item.id}`}>
          {item.areaId}
        </span>
      ),
    },
    {
      key: "customerName",
      header: "Customer Name",
      width: "160px",
      render: (item) => (
        <span className="text-sm" data-testid={`stock-under-warranty-customer-${item.id}`}>
          {item.customerName || "—"}
        </span>
      ),
    },
    {
      key: "orderNumber",
      header: "Order Number",
      width: "140px",
      render: (item) => (
        <span className="font-mono text-sm" data-testid={`stock-under-warranty-order-${item.id}`}>
          {item.orderNumber || "—"}
        </span>
      ),
    },
    {
      key: "orderDate",
      header: "Order Date",
      width: "120px",
      render: (item) => (
        <span className="text-sm" data-testid={`stock-under-warranty-order-date-${item.id}`}>
          {item.orderDate ? format(new Date(item.orderDate), "MMM dd, yyyy") : "—"}
        </span>
      ),
    },
    {
      key: "coverageStartDate",
      header: "Coverage Start",
      width: "120px",
      render: (item) => (
        <span className="text-sm" data-testid={`stock-under-warranty-coverage-start-${item.id}`}>
          {format(new Date(item.coverageStartDate), "MMM dd, yyyy")}
        </span>
      ),
    },
    {
      key: "coverageEndDate",
      header: "Coverage End",
      width: "120px",
      render: (item) => (
        <span className="text-sm" data-testid={`stock-under-warranty-coverage-end-${item.id}`}>
          {format(new Date(item.coverageEndDate), "MMM dd, yyyy")}
        </span>
      ),
    },
    {
      key: "coverageDurationDays",
      header: "Duration",
      width: "100px",
      render: (item) => (
        <span className="text-sm" data-testid={`stock-under-warranty-duration-${item.id}`}>
          {item.coverageDurationDays} days
        </span>
      ),
    },
    {
      key: "status",
      header: "Coverage Status",
      width: "140px",
      render: (item) => {
        const daysRemaining = getDaysRemaining(item.coverageEndDate);
        const status = getCoverageStatus(daysRemaining);
        
        const badgeVariant = status === "Active" ? "default" : status === "Expiring Soon" ? "secondary" : "outline";
        const badgeClass = status === "Active" 
          ? "bg-blue-500 hover:bg-blue-600 text-white border-blue-600" 
          : status === "Expiring Soon" 
          ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-600"
          : "bg-red-500 hover:bg-red-600 text-white border-red-600";
        
        return (
          <Badge
            variant={badgeVariant}
            className={badgeClass}
            data-testid={`stock-under-warranty-status-${item.id}`}
          >
            {status}
          </Badge>
        );
      },
    },
    {
      key: "daysRemaining",
      header: "Days Left",
      width: "100px",
      render: (item) => {
        const daysRemaining = getDaysRemaining(item.coverageEndDate);
        const status = getCoverageStatus(daysRemaining);
        
        const color = status === "Active"
          ? "text-blue-600 dark:text-blue-400"
          : status === "Expiring Soon"
          ? "text-orange-600 dark:text-orange-400"
          : "text-red-600 dark:text-red-400";
        
        return (
          <span className={`text-sm font-medium ${color}`} data-testid={`stock-under-warranty-days-${item.id}`}>
            {daysRemaining} days
          </span>
        );
      },
    },
  ];

  if (statsLoading || tableLoading) {
    return (
      <div className="space-y-6 p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Stock under Warranty</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Units deployed under warranty coverage that may need replacement
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header Section */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-stock-under-warranty">
            Stock under Warranty
          </h1>
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-stock-under-warranty-description">
            Units deployed under warranty coverage that may need replacement
          </p>
        </div>
        <Button variant="outline" data-testid="button-export-stock-under-warranty" size="lg">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-3">
          <div>
            <CardTitle className="text-base">Advanced Filters</CardTitle>
            <CardDescription>Filter warranties across entire database</CardDescription>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              data-testid="button-clear-all-filters"
            >
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Make</label>
              <MultiSelect
                options={filterOptions?.makes || []}
                selected={filters.make}
                onChange={(values) => { setFilters(prev => ({ ...prev, make: values })); setCurrentPage(1); }}
                placeholder="All Makes"
                testId="select-filter-make"
              />
              {filters.make.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {filters.make.map(make => (
                    <Badge key={make} variant="secondary" className="text-xs cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, make: prev.make.filter(v => v !== make) }))}>
                      {make} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Model</label>
              <MultiSelect
                options={filterOptions?.models || []}
                selected={filters.model}
                onChange={(values) => { setFilters(prev => ({ ...prev, model: values })); setCurrentPage(1); }}
                placeholder="All Models"
                testId="select-filter-model"
              />
              {filters.model.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {filters.model.map(model => (
                    <Badge key={model} variant="secondary" className="text-xs cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, model: prev.model.filter(v => v !== model) }))}>
                      {model} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Customer</label>
              <MultiSelect
                options={filterOptions?.customers || []}
                selected={filters.customer}
                onChange={(values) => { setFilters(prev => ({ ...prev, customer: values })); setCurrentPage(1); }}
                placeholder="All Customers"
                testId="select-filter-customer"
              />
              {filters.customer.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {filters.customer.map(customer => (
                    <Badge key={customer} variant="secondary" className="text-xs cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, customer: prev.customer.filter(v => v !== customer) }))}>
                      {customer} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Order Number</label>
              <MultiSelect
                options={filterOptions?.orders || []}
                selected={filters.order}
                onChange={(values) => { setFilters(prev => ({ ...prev, order: values })); setCurrentPage(1); }}
                placeholder="All Orders"
                testId="select-filter-order"
              />
              {filters.order.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {filters.order.map(order => (
                    <Badge key={order} variant="secondary" className="text-xs cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, order: prev.order.filter(v => v !== order) }))}>
                      {order} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Warranty Type</label>
              <MultiSelect
                options={filterOptions?.coverageDescriptions || []}
                selected={filters.coverageDescription}
                onChange={(values) => { setFilters(prev => ({ ...prev, coverageDescription: values })); setCurrentPage(1); }}
                placeholder="All Types"
                testId="select-filter-warranty-type"
              />
              {filters.coverageDescription.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {filters.coverageDescription.map(desc => (
                    <Badge key={desc} variant="secondary" className="text-xs cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, coverageDescription: prev.coverageDescription.filter(v => v !== desc) }))}>
                      {desc} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Coverage Start From</label>
              <DatePicker
                date={filters.coverageStartDateFrom}
                onDateChange={(date) => { setFilters(prev => ({ ...prev, coverageStartDateFrom: date })); setCurrentPage(1); }}
                placeholder="Start date from"
                testId="date-coverage-start-from"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Coverage Start To</label>
              <DatePicker
                date={filters.coverageStartDateTo}
                onDateChange={(date) => { setFilters(prev => ({ ...prev, coverageStartDateTo: date })); setCurrentPage(1); }}
                placeholder="Start date to"
                testId="date-coverage-start-to"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Coverage End From</label>
              <DatePicker
                date={filters.coverageEndDateFrom}
                onDateChange={(date) => { setFilters(prev => ({ ...prev, coverageEndDateFrom: date })); setCurrentPage(1); }}
                placeholder="End date from"
                testId="date-coverage-end-from"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Coverage End To</label>
              <DatePicker
                date={filters.coverageEndDateTo}
                onDateChange={(date) => { setFilters(prev => ({ ...prev, coverageEndDateTo: date })); setCurrentPage(1); }}
                placeholder="End date to"
                testId="date-coverage-end-to"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border hover-elevate transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <Badge variant="outline">Total</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Units</p>
              <p className="text-4xl font-bold tracking-tight">{stats.total.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border hover-elevate transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-500" />
              </div>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                Active
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Active Coverage</p>
              <p className="text-4xl font-bold tracking-tight text-blue-600 dark:text-blue-500">
                {stats.active}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border hover-elevate transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-orange-500/10 rounded-xl">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-500" />
              </div>
              <Badge variant="outline" className="bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                Expiring
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Expiring Soon</p>
              <p className="text-4xl font-bold tracking-tight text-orange-600 dark:text-orange-500">
                {stats.expiring}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border hover-elevate transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-red-500/10 rounded-xl">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-500" />
              </div>
              <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800">
                Expired
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Coverage Expired</p>
              <p className="text-4xl font-bold tracking-tight text-red-600 dark:text-red-500">
                {stats.expired}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <div className="space-y-4">
        <SearchBar
          placeholder="Search by serial number, make, or model..."
          onSearch={handleSearchChange}
          className="max-w-md"
        />

        {totalPages > 0 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={stats.total}
          />
        )}

        <DataTable
          columns={columns}
          data={stockUnderWarranty || []}
          onRowClick={(item) => console.log("View stock under warranty details:", item)}
        />
      </div>
    </div>
  );
}
