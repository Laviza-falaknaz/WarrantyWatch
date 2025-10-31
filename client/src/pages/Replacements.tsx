import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import DataTable, { Column } from "@/components/DataTable";
import SearchBar from "@/components/SearchBar";
import TablePagination from "@/components/TablePagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Download } from "lucide-react";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import type { Replacement } from "@shared/schema";

export default function Replacements() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  const ITEMS_PER_PAGE = 100;

  const { data: stats } = useQuery({
    queryKey: ["/api/replacements/stats", searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      
      const response = await fetch(`/api/replacements/stats?${params}`);
      if (!response.ok) throw new Error("Failed to fetch replacements stats");
      return response.json() as Promise<{ total: number }>;
    },
  });

  const { data: replacements, isLoading } = useQuery({
    queryKey: ["/api/replacements", searchQuery, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      
      params.append("limit", ITEMS_PER_PAGE.toString());
      params.append("offset", ((currentPage - 1) * ITEMS_PER_PAGE).toString());
      
      const response = await fetch(`/api/replacements?${params}`);
      if (!response.ok) throw new Error("Failed to fetch replacements");
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
    if (!replacements || replacements.length === 0) return;

    const exportData = replacements.map((replacement: Replacement) => ({
      "Serial Number": replacement.serialNumber,
      "RMA": replacement.rma,
      "Make": replacement.make,
      "Model": replacement.model,
      "Processor": replacement.processor || "",
      "Generation": replacement.generation || "",
      "RAM": replacement.ram,
      "Storage": replacement.hdd,
      "Display Size": replacement.displaySize || "",
      "Touchscreen": replacement.touchscreen ? "Yes" : "No",
      "Category": replacement.category || "",
      "Area ID": replacement.areaId,
      "Item ID": replacement.itemId,
      "Replaced Date": replacement.replacedDate ? format(new Date(replacement.replacedDate), "yyyy-MM-dd") : "",
      "Product Description": replacement.productDescription || "",
      "Product Number": replacement.productNumber || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Replacements");
    XLSX.writeFile(wb, `Replacements_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  const totalPages = Math.ceil((stats?.total || 0) / ITEMS_PER_PAGE);

  const columns: Column<Replacement>[] = [
    {
      key: "serialNumber",
      header: "Serial Number",
      width: "160px",
      render: (item) => (
        <span className="font-mono text-sm" data-testid={`replacement-serial-${item.id}`}>
          {item.serialNumber}
        </span>
      ),
    },
    {
      key: "rma",
      header: "RMA",
      width: "140px",
      render: (item) => (
        <span className="font-mono text-sm" data-testid={`replacement-rma-${item.id}`}>
          {item.rma}
        </span>
      ),
    },
    {
      key: "make",
      header: "Make",
      width: "100px",
      render: (item) => (
        <span className="text-sm" data-testid={`replacement-make-${item.id}`}>
          {item.make}
        </span>
      ),
    },
    {
      key: "model",
      header: "Model",
      width: "140px",
      render: (item) => (
        <span className="text-sm" data-testid={`replacement-model-${item.id}`}>
          {item.model}
        </span>
      ),
    },
    {
      key: "processor",
      header: "Processor",
      width: "120px",
      render: (item) => (
        <span className="text-sm" data-testid={`replacement-processor-${item.id}`}>
          {item.processor || "—"}
        </span>
      ),
    },
    {
      key: "ram",
      header: "RAM",
      width: "80px",
      render: (item) => (
        <span className="text-sm" data-testid={`replacement-ram-${item.id}`}>
          {item.ram}
        </span>
      ),
    },
    {
      key: "hdd",
      header: "Storage",
      width: "90px",
      render: (item) => (
        <span className="text-sm" data-testid={`replacement-storage-${item.id}`}>
          {item.hdd}
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      width: "100px",
      render: (item) => (
        <Badge variant="outline" data-testid={`replacement-category-${item.id}`}>
          {item.category || "—"}
        </Badge>
      ),
    },
    {
      key: "replacedDate",
      header: "Replaced Date",
      width: "120px",
      render: (item) => (
        <span className="text-sm" data-testid={`replacement-date-${item.id}`}>
          {item.replacedDate ? format(new Date(item.replacedDate), "MMM dd, yyyy") : "—"}
        </span>
      ),
    },
  ];

  const totalReplacements = stats?.total || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="replacements-heading">
            Replacement History
          </h1>
          <p className="text-muted-foreground mt-1">
            Track all units sent as warranty replacements
          </p>
        </div>
        <Button
          onClick={handleExportToExcel}
          disabled={!replacements || replacements.length === 0}
          data-testid="button-export-replacements"
        >
          <Download className="h-4 w-4 mr-2" />
          Export to Excel
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Replacements</p>
              <p className="text-3xl font-bold" data-testid="text-total-replacements">
                {totalReplacements.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <SearchBar
            onSearch={handleSearchChange}
            placeholder="Search by serial number, RMA, make, or model..."
          />
        </div>
      </div>

      {totalPages > 1 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={totalReplacements}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <DataTable
          data={replacements || []}
          columns={columns}
        />
      )}
    </div>
  );
}
