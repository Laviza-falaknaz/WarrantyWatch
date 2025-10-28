import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DataTable, { Column } from "@/components/DataTable";
import FilterPanel, { FilterCategory } from "@/components/FilterPanel";
import SearchBar from "@/components/SearchBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download } from "lucide-react";

interface InventoryItem {
  id: string;
  serialNumber: string;
  make: string;
  model: string;
  processor: string | null;
  ram: string | null;
  hdd: string | null;
  category: string | null;
  soldOrder: string | null;
  warranty?: {
    isActive: boolean;
    warrantyEndDate: Date;
  };
}

export default function Inventory() {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const { data: filterOptions } = useQuery({
    queryKey: ["/api/filters"],
  });

  const { data: inventoryWithWarranty, isLoading } = useQuery({
    queryKey: ["/api/inventory-with-warranty", selectedFilters, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      Object.entries(selectedFilters).forEach(([key, values]) => {
        values.forEach(value => params.append(key, value));
      });
      
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      
      const response = await fetch(`/api/inventory-with-warranty?${params}`);
      if (!response.ok) throw new Error("Failed to fetch inventory");
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

  const getWarrantyStatus = (item: InventoryItem) => {
    if (!item.warranty) return "No Warranty";
    if (!item.warranty.isActive) return "Inactive";
    
    const endDate = new Date(item.warranty.warrantyEndDate);
    const now = new Date();
    const daysUntilExpiry = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 30) return "Expiring Soon";
    return "Active";
  };

  const columns: Column<InventoryItem>[] = [
    {
      key: "serialNumber",
      header: "Serial Number",
      width: "160px",
      render: (item) => (
        <span className="font-mono text-sm">{item.serialNumber}</span>
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
      render: (item) => <span>{item.processor || "-"}</span>,
    },
    {
      key: "ram",
      header: "RAM",
      width: "80px",
      render: (item) => <span>{item.ram || "-"}</span>,
    },
    {
      key: "hdd",
      header: "Storage",
      width: "100px",
      render: (item) => <span>{item.hdd || "-"}</span>,
    },
    {
      key: "warrantyStatus",
      header: "Warranty",
      width: "140px",
      render: (item) => {
        const status = getWarrantyStatus(item);
        return (
          <Badge
            variant={
              status === "Active"
                ? "default"
                : status === "Expiring Soon"
                ? "destructive"
                : "outline"
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      key: "coverage",
      header: "Coverage",
      width: "120px",
      render: (item) => (
        <Badge variant={!item.soldOrder ? "secondary" : "outline"}>
          {!item.soldOrder ? "In Pool" : "Sold"}
        </Badge>
      ),
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
            <h1 className="text-2xl font-semibold">Inventory</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage and monitor all laptop inventory
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
          <h1 className="text-2xl font-semibold">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and monitor all laptop inventory
          </p>
        </div>
        <Button variant="outline" data-testid="button-export">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

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
          />

          <DataTable
            columns={columns}
            data={inventoryWithWarranty || []}
            onRowClick={(item) => console.log("View details:", item)}
          />
        </div>
      </div>
    </div>
  );
}
