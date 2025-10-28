import { useState } from "react";
import DataTable, { Column } from "@/components/DataTable";
import FilterPanel, { FilterCategory } from "@/components/FilterPanel";
import SearchBar from "@/components/SearchBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface InventoryItem {
  serialNumber: string;
  make: string;
  model: string;
  processor: string;
  ram: string;
  hdd: string;
  warrantyStatus: string;
  coverage: string;
  customer?: string;
}

export default function Inventory() {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState("");

  //todo: remove mock functionality
  const mockData: InventoryItem[] = [
    {
      serialNumber: "SN123456789",
      make: "HP",
      model: "EliteBook 840 G8",
      processor: "Intel Core i5",
      ram: "8GB",
      hdd: "256GB SSD",
      warrantyStatus: "Active",
      coverage: "In Pool",
      customer: "Acme Corp",
    },
    {
      serialNumber: "SN987654321",
      make: "Dell",
      model: "Latitude 7420",
      processor: "Intel Core i7",
      ram: "16GB",
      hdd: "512GB SSD",
      warrantyStatus: "Expiring Soon",
      coverage: "Not Covered",
    },
    {
      serialNumber: "SN456789123",
      make: "Lenovo",
      model: "ThinkPad X1 Carbon",
      processor: "Intel Core i5",
      ram: "16GB",
      hdd: "512GB SSD",
      warrantyStatus: "Active",
      coverage: "In Pool",
      customer: "TechStart Inc",
    },
    {
      serialNumber: "SN789123456",
      make: "HP",
      model: "ProBook 450 G8",
      processor: "Intel Core i3",
      ram: "8GB",
      hdd: "256GB SSD",
      warrantyStatus: "Active",
      coverage: "In Pool",
    },
    {
      serialNumber: "SN321654987",
      make: "Dell",
      model: "Precision 5560",
      processor: "Intel Core i7",
      ram: "32GB",
      hdd: "1TB SSD",
      warrantyStatus: "Inactive",
      coverage: "Not Covered",
      customer: "Design Studio",
    },
  ];

  const filterCategories: FilterCategory[] = [
    {
      id: "make",
      title: "Make",
      options: [
        { label: "HP", value: "HP", count: 2 },
        { label: "Dell", value: "Dell", count: 2 },
        { label: "Lenovo", value: "Lenovo", count: 1 },
      ],
    },
    {
      id: "processor",
      title: "Processor",
      options: [
        { label: "Intel Core i3", value: "Intel Core i3", count: 1 },
        { label: "Intel Core i5", value: "Intel Core i5", count: 2 },
        { label: "Intel Core i7", value: "Intel Core i7", count: 2 },
      ],
    },
    {
      id: "ram",
      title: "RAM",
      options: [
        { label: "8GB", value: "8GB", count: 2 },
        { label: "16GB", value: "16GB", count: 2 },
        { label: "32GB", value: "32GB", count: 1 },
      ],
    },
    {
      id: "warrantyStatus",
      title: "Warranty Status",
      options: [
        { label: "Active", value: "Active", count: 3 },
        { label: "Expiring Soon", value: "Expiring Soon", count: 1 },
        { label: "Inactive", value: "Inactive", count: 1 },
      ],
    },
  ];

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
    },
    {
      key: "ram",
      header: "RAM",
      width: "80px",
    },
    {
      key: "hdd",
      header: "Storage",
      width: "100px",
    },
    {
      key: "warrantyStatus",
      header: "Warranty",
      width: "140px",
      render: (item) => (
        <Badge
          variant={
            item.warrantyStatus === "Active"
              ? "default"
              : item.warrantyStatus === "Expiring Soon"
              ? "destructive"
              : "outline"
          }
        >
          {item.warrantyStatus}
        </Badge>
      ),
    },
    {
      key: "coverage",
      header: "Coverage",
      width: "120px",
      render: (item) => (
        <Badge variant={item.coverage === "In Pool" ? "secondary" : "outline"}>
          {item.coverage}
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
            data={mockData}
            onRowClick={(item) => console.log("View details:", item)}
          />
        </div>
      </div>
    </div>
  );
}
