import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import DataTable, { Column } from "@/components/DataTable";
import FilterPanel, { FilterCategory } from "@/components/FilterPanel";
import SearchBar from "@/components/SearchBar";
import TablePagination from "@/components/TablePagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Package, CheckCircle2, AlertCircle, XCircle, Filter as FilterIcon } from "lucide-react";
import type { SpareUnit } from "@shared/schema";

export default function Inventory() {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  
  const ITEMS_PER_PAGE = 100;

  const { data: filterOptions } = useQuery<{
    makes: string[];
    models: string[];
    processors: string[];
    rams: string[];
    categories: string[];
    customers: string[];
    orderNumbers: string[];
  }>({
    queryKey: ["/api/filters"],
  });

  // Fetch stats for total count
  const { data: stats } = useQuery({
    queryKey: ["/api/spare-units/stats", selectedFilters, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      Object.entries(selectedFilters).forEach(([key, values]) => {
        values.forEach(value => params.append(key, value));
      });
      
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      
      const response = await fetch(`/api/spare-units/stats?${params}`);
      if (!response.ok) throw new Error("Failed to fetch replacement units stats");
      return response.json() as Promise<{ total: number }>;
    },
  });

  // Fetch paginated data
  const { data: replacementUnits, isLoading } = useQuery({
    queryKey: ["/api/spare-units", selectedFilters, searchQuery, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      Object.entries(selectedFilters).forEach(([key, values]) => {
        values.forEach(value => params.append(key, value));
      });
      
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      
      params.append("limit", ITEMS_PER_PAGE.toString());
      params.append("offset", ((currentPage - 1) * ITEMS_PER_PAGE).toString());
      
      const response = await fetch(`/api/spare-units?${params}`);
      if (!response.ok) throw new Error("Failed to fetch replacement units");
      return response.json();
    },
  });

  // Calculate status breakdown
  const statusBreakdown = useMemo(() => {
    if (!replacementUnits) return { available: 0, reserved: 0, retired: 0 };
    
    return replacementUnits.reduce((acc: any, unit: SpareUnit) => {
      if (unit.retiredOrder) {
        acc.retired++;
      } else if (unit.reservedForCase) {
        acc.reserved++;
      } else {
        acc.available++;
      }
      return acc;
    }, { available: 0, reserved: 0, retired: 0 });
  }, [replacementUnits]);

  const filterCategories: FilterCategory[] = [
    {
      id: "make",
      title: "Make",
      options: (filterOptions?.makes || []).map((make: string) => ({
        label: make,
        value: make,
      })),
    },
    {
      id: "model",
      title: "Model",
      options: (filterOptions?.models || []).map((model: string) => ({
        label: model,
        value: model,
      })),
    },
    {
      id: "processor",
      title: "Processor",
      options: (filterOptions?.processors || []).map((processor: string) => ({
        label: processor,
        value: processor,
      })),
    },
    {
      id: "ram",
      title: "RAM",
      options: (filterOptions?.rams || []).map((ram: string) => ({
        label: ram,
        value: ram,
      })),
    },
    {
      id: "category",
      title: "Category",
      options: (filterOptions?.categories || []).map((category: string) => ({
        label: category,
        value: category,
      })),
    },
  ];

  const getAvailabilityStatus = (unit: SpareUnit) => {
    if (unit.retiredOrder) return "Retired";
    if (unit.reservedForCase) return "Reserved";
    return "Available";
  };

  const columns: Column<SpareUnit>[] = [
    {
      key: "serialNumber",
      header: "Serial Number",
      width: "160px",
      render: (unit) => (
        <span className="font-mono text-sm" data-testid={`text-replacement-unit-serial-${unit.id}`}>
          {unit.serialNumber}
        </span>
      ),
    },
    {
      key: "make",
      header: "Make",
      width: "100px",
    },
    {
      key: "model",
      header: "Model",
      width: "180px",
    },
    {
      key: "processor",
      header: "Processor",
      width: "140px",
      render: (unit) => <span>{unit.processor || "-"}</span>,
    },
    {
      key: "ram",
      header: "RAM",
      width: "80px",
      render: (unit) => <span>{unit.ram || "-"}</span>,
    },
    {
      key: "hdd",
      header: "Storage",
      width: "100px",
      render: (unit) => <span>{unit.hdd || "-"}</span>,
    },
    {
      key: "status",
      header: "Status",
      width: "140px",
      render: (unit) => {
        const status = getAvailabilityStatus(unit);
        return (
          <Badge
            variant={
              status === "Available"
                ? "default"
                : status === "Reserved"
                ? "secondary"
                : "outline"
            }
            data-testid={`badge-replacement-unit-status-${unit.id}`}
          >
            {status}
          </Badge>
        );
      },
    },
    {
      key: "allocation",
      header: "Allocation",
      width: "140px",
      render: (unit) => {
        if (unit.reservedForCase) {
          return (
            <span className="text-sm text-muted-foreground" data-testid={`text-replacement-unit-allocation-${unit.id}`}>
              {unit.reservedForCase}
            </span>
          );
        }
        return (
          <Badge variant="secondary" data-testid={`badge-replacement-unit-allocation-${unit.id}`}>
            In Pool
          </Badge>
        );
      },
    },
  ];

  const handleFilterChange = (categoryId: string, values: string[]) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [categoryId]: values,
    }));
    setCurrentPage(1);
  };

  const handleClearAll = () => {
    setSelectedFilters({});
    setCurrentPage(1);
  };

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const totalItems = stats?.total || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  if (isLoading) {
    return (
      <div className="space-y-6 p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Replacement Pool</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Replacement units available to cover warranty claims
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
          <h1 className="text-3xl font-bold" data-testid="heading-replacement-pool">
            Replacement Pool
          </h1>
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-replacement-pool-description">
            Replacement units available in the pool to cover warranty claims on deployed units
          </p>
        </div>
        <Button variant="outline" data-testid="button-export-replacement-units" size="lg">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border hover-elevate transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <Badge variant="outline">Total</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Units</p>
              <p className="text-4xl font-bold tracking-tight">{totalItems.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border hover-elevate transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-500" />
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                Available
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Available</p>
              <p className="text-4xl font-bold tracking-tight text-green-600 dark:text-green-500">
                {statusBreakdown.available}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border hover-elevate transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-yellow-500/10 rounded-xl">
                <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
              </div>
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800">
                Reserved
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Reserved</p>
              <p className="text-4xl font-bold tracking-tight text-yellow-600 dark:text-yellow-500">
                {statusBreakdown.reserved}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border hover-elevate transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-muted rounded-xl">
                <XCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <Badge variant="outline">Retired</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Retired</p>
              <p className="text-4xl font-bold tracking-tight">{statusBreakdown.retired}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Content */}
      <div className="flex gap-6">
        {showFilters && (
          <div className="w-72 flex-shrink-0">
            <FilterPanel
              categories={filterCategories}
              selectedFilters={selectedFilters}
              onFilterChange={handleFilterChange}
              onClearAll={handleClearAll}
            />
          </div>
        )}

        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant={showFilters ? "secondary" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              data-testid="button-toggle-filters"
            >
              <FilterIcon className="h-4 w-4 mr-2" />
              {showFilters ? "Hide Filters" : "Show Filters"}
              {Object.keys(selectedFilters).length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {Object.values(selectedFilters).flat().length}
                </Badge>
              )}
            </Button>

            <SearchBar
              placeholder="Search by serial number, make, model..."
              onSearch={handleSearchChange}
              className="flex-1 max-w-md"
              data-testid="input-search-replacement-units"
            />
          </div>

          {totalPages > 0 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={ITEMS_PER_PAGE}
              totalItems={totalItems}
            />
          )}

          <DataTable
            columns={columns}
            data={replacementUnits || []}
            onRowClick={(unit) => console.log("View replacement unit details:", unit)}
            data-testid="table-replacement-units"
          />
        </div>
      </div>
    </div>
  );
}
