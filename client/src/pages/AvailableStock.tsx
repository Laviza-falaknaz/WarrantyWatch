import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import DataTable, { Column } from "@/components/DataTable";
import SearchBar from "@/components/SearchBar";
import TablePagination from "@/components/TablePagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Package2, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import type { AvailableStock } from "@shared/schema";

export default function AvailableStockPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  const ITEMS_PER_PAGE = 100;

  const { data: stats } = useQuery({
    queryKey: ["/api/available-stock/stats", searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      
      const response = await fetch(`/api/available-stock/stats?${params}`);
      if (!response.ok) throw new Error("Failed to fetch available stock stats");
      return response.json() as Promise<{ total: number; reserved: number; available: number }>;
    },
  });

  const { data: availableStock, isLoading } = useQuery({
    queryKey: ["/api/available-stock", searchQuery, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      
      params.append("limit", ITEMS_PER_PAGE.toString());
      params.append("offset", ((currentPage - 1) * ITEMS_PER_PAGE).toString());
      
      const response = await fetch(`/api/available-stock?${params}`);
      if (!response.ok) throw new Error("Failed to fetch available stock");
      return response.json();
    },
  });

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleExportToExcel = () => {
    if (!availableStock || availableStock.length === 0) return;

    const exportData = availableStock.map((item: AvailableStock) => ({
      "Serial Number": item.serialNumber,
      "Make": item.make,
      "Model": item.model,
      "Processor": item.processor || "",
      "Generation": item.generation || "",
      "RAM": item.ram,
      "Storage": item.hdd,
      "Display Size": item.displaySize || "",
      "Touchscreen": item.touchscreen ? "Yes" : "No",
      "Category": item.category || "",
      "Area ID": item.areaId,
      "Item ID": item.itemId,
      "Reserved Segregation Group": item.reservedSegregationGroup || "",
      "Reserved For Case": item.reservedForCase || "",
      "Product Description": item.productDescription || "",
      "Product Number": item.productNumber || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Available Stock");
    XLSX.writeFile(wb, `Available_Stock_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  const getReservationStatus = (item: AvailableStock) => {
    if (item.reservedForCase) return "Reserved";
    return "Available";
  };

  const totalPages = Math.ceil((stats?.total || 0) / ITEMS_PER_PAGE);

  const columns: Column<AvailableStock>[] = [
    {
      key: "serialNumber",
      header: "Serial Number",
      width: "160px",
      render: (item) => (
        <span className="font-mono text-sm" data-testid={`available-stock-serial-${item.id}`}>
          {item.serialNumber}
        </span>
      ),
    },
    {
      key: "make",
      header: "Make",
      width: "100px",
      render: (item) => (
        <span className="text-sm" data-testid={`available-stock-make-${item.id}`}>
          {item.make}
        </span>
      ),
    },
    {
      key: "model",
      header: "Model",
      width: "140px",
      render: (item) => (
        <span className="text-sm" data-testid={`available-stock-model-${item.id}`}>
          {item.model}
        </span>
      ),
    },
    {
      key: "processor",
      header: "Processor",
      width: "120px",
      render: (item) => (
        <span className="text-sm" data-testid={`available-stock-processor-${item.id}`}>
          {item.processor || "—"}
        </span>
      ),
    },
    {
      key: "ram",
      header: "RAM",
      width: "80px",
      render: (item) => (
        <span className="text-sm" data-testid={`available-stock-ram-${item.id}`}>
          {item.ram}
        </span>
      ),
    },
    {
      key: "hdd",
      header: "Storage",
      width: "90px",
      render: (item) => (
        <span className="text-sm" data-testid={`available-stock-storage-${item.id}`}>
          {item.hdd}
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      width: "100px",
      render: (item) => (
        <Badge variant="outline" data-testid={`available-stock-category-${item.id}`}>
          {item.category || "—"}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "100px",
      render: (item) => {
        const status = getReservationStatus(item);
        return (
          <Badge 
            variant={status === "Available" ? "default" : "secondary"}
            data-testid={`available-stock-status-${item.id}`}
          >
            {status}
          </Badge>
        );
      },
    },
    {
      key: "reservedForCase",
      header: "Reserved For",
      width: "120px",
      render: (item) => (
        <span className="text-sm font-mono" data-testid={`available-stock-reserved-${item.id}`}>
          {item.reservedForCase || "—"}
        </span>
      ),
    },
  ];

  const totalStock = stats?.total || 0;
  const reservedStock = stats?.reserved || 0;
  const availableCount = stats?.available || 0;

  if (isLoading) {
    return (
      <div className="space-y-6 p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Available Stock Inventory</h1>
            <p className="text-sm text-muted-foreground mt-1">
              All stock available for allocation or replacement
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
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
          <h1 className="text-3xl font-bold" data-testid="available-stock-heading">
            Available Stock Inventory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            All stock available for allocation or replacement
          </p>
        </div>
        <Button
          onClick={handleExportToExcel}
          disabled={!availableStock || availableStock.length === 0}
          data-testid="button-export-available-stock"
          size="lg"
        >
          <Download className="h-4 w-4 mr-2" />
          Export to Excel
        </Button>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border hover-elevate transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Package2 className="h-6 w-6 text-primary" />
              </div>
              <Badge variant="outline">Total</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Stock</p>
              <p className="text-4xl font-bold tracking-tight" data-testid="text-total-available-stock">
                {totalStock.toLocaleString()}
              </p>
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
              <p className="text-sm font-medium text-muted-foreground">Available Now</p>
              <p className="text-4xl font-bold tracking-tight text-green-600 dark:text-green-500" data-testid="text-available-stock">
                {availableCount.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border hover-elevate transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-amber-500/10 rounded-xl">
                <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-500" />
              </div>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                Reserved
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Reserved Units</p>
              <p className="text-4xl font-bold tracking-tight text-amber-600 dark:text-amber-500" data-testid="text-reserved-stock">
                {reservedStock.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <div className="space-y-4">
        <SearchBar
          onSearch={handleSearchChange}
          placeholder="Search by serial number, make, or model..."
        />

        {totalPages > 1 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalStock}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        )}

        <DataTable
          data={availableStock || []}
          columns={columns}
        />
      </div>
    </div>
  );
}
