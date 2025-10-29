import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DataTable, { Column } from "@/components/DataTable";
import FilterPanel, { FilterCategory } from "@/components/FilterPanel";
import SearchBar from "@/components/SearchBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, AlertCircle } from "lucide-react";
import type { SpareUnit } from "@shared/schema";

export default function Inventory() {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState("");

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

  const { data: replacementUnits, isLoading } = useQuery({
    queryKey: ["/api/spare-units", selectedFilters, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      Object.entries(selectedFilters).forEach(([key, values]) => {
        values.forEach(value => params.append(key, value));
      });
      
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      
      const response = await fetch(`/api/spare-units?${params}`);
      if (!response.ok) throw new Error("Failed to fetch replacement units");
      return response.json();
    },
  });

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
  };

  const handleClearAll = () => {
    setSelectedFilters({});
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Replacement Pool</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Replacement units available in the pool to cover warranty claims on deployed units
            </p>
          </div>
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="heading-replacement-pool">
            Replacement Pool
          </h1>
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-replacement-pool-description">
            Replacement units available in the pool to cover warranty claims on deployed units
          </p>
        </div>
        <Button variant="outline" data-testid="button-export-replacement-units">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Warning when query limit is reached */}
      {replacementUnits && replacementUnits.length >= 10000 && (
        <Alert data-testid="alert-query-limit-reached">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Showing {replacementUnits.length.toLocaleString()} records (query limit reached). 
            Use search and filters to find specific units. Additional records may exist in the database.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-6">
        <div className="w-72 flex-shrink-0">
          <FilterPanel
            categories={filterCategories}
            selectedFilters={selectedFilters}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearAll}
          />
        </div>

        <div className="flex-1 space-y-4">
          <SearchBar
            placeholder="Search by serial number, make, model..."
            onSearch={setSearchQuery}
            className="max-w-md"
            data-testid="input-search-replacement-units"
          />

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
