import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import DataTable, { Column } from "@/components/DataTable";
import SearchBar from "@/components/SearchBar";
import TablePagination from "@/components/TablePagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Download, FileWarning } from "lucide-react";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import type { Claim } from "@shared/schema";

export default function Claims() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  const ITEMS_PER_PAGE = 100;

  const { data: stats } = useQuery({
    queryKey: ["/api/claims/stats", searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      
      const response = await fetch(`/api/claims/stats?${params}`);
      if (!response.ok) throw new Error("Failed to fetch claims stats");
      return response.json() as Promise<{ total: number }>;
    },
  });

  const { data: claims, isLoading } = useQuery({
    queryKey: ["/api/claims", searchQuery, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      
      params.append("limit", ITEMS_PER_PAGE.toString());
      params.append("offset", ((currentPage - 1) * ITEMS_PER_PAGE).toString());
      
      const response = await fetch(`/api/claims?${params}`);
      if (!response.ok) throw new Error("Failed to fetch claims");
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
    if (!claims || claims.length === 0) return;

    const exportData = claims.map((claim: Claim) => ({
      "Serial Number": claim.serialNumber,
      "RMA": claim.rma,
      "Make": claim.make,
      "Model": claim.model,
      "Processor": claim.processor || "",
      "Generation": claim.generation || "",
      "RAM": claim.ram,
      "Storage": claim.hdd,
      "Display Size": claim.displaySize || "",
      "Touchscreen": claim.touchscreen ? "Yes" : "No",
      "Category": claim.category || "",
      "Area ID": claim.areaId,
      "Item ID": claim.itemId,
      "Claim Date": claim.claimDate ? format(new Date(claim.claimDate), "yyyy-MM-dd") : "",
      "Product Description": claim.productDescription || "",
      "Product Number": claim.productNumber || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Claims");
    XLSX.writeFile(wb, `Claims_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  const totalPages = Math.ceil((stats?.total || 0) / ITEMS_PER_PAGE);

  const columns: Column<Claim>[] = [
    {
      key: "serialNumber",
      header: "Serial Number",
      width: "160px",
      render: (item) => (
        <span className="font-mono text-sm" data-testid={`claim-serial-${item.id}`}>
          {item.serialNumber}
        </span>
      ),
    },
    {
      key: "rma",
      header: "RMA",
      width: "140px",
      render: (item) => (
        <span className="font-mono text-sm" data-testid={`claim-rma-${item.id}`}>
          {item.rma}
        </span>
      ),
    },
    {
      key: "make",
      header: "Make",
      width: "100px",
      render: (item) => (
        <span className="text-sm" data-testid={`claim-make-${item.id}`}>
          {item.make}
        </span>
      ),
    },
    {
      key: "model",
      header: "Model",
      width: "140px",
      render: (item) => (
        <span className="text-sm" data-testid={`claim-model-${item.id}`}>
          {item.model}
        </span>
      ),
    },
    {
      key: "processor",
      header: "Processor",
      width: "120px",
      render: (item) => (
        <span className="text-sm" data-testid={`claim-processor-${item.id}`}>
          {item.processor || "—"}
        </span>
      ),
    },
    {
      key: "ram",
      header: "RAM",
      width: "80px",
      render: (item) => (
        <span className="text-sm" data-testid={`claim-ram-${item.id}`}>
          {item.ram}
        </span>
      ),
    },
    {
      key: "hdd",
      header: "Storage",
      width: "90px",
      render: (item) => (
        <span className="text-sm" data-testid={`claim-storage-${item.id}`}>
          {item.hdd}
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      width: "100px",
      render: (item) => (
        <Badge variant="outline" data-testid={`claim-category-${item.id}`}>
          {item.category || "—"}
        </Badge>
      ),
    },
    {
      key: "claimDate",
      header: "Claim Date",
      width: "120px",
      render: (item) => (
        <span className="text-sm" data-testid={`claim-date-${item.id}`}>
          {item.claimDate ? format(new Date(item.claimDate), "MMM dd, yyyy") : "—"}
        </span>
      ),
    },
  ];

  const totalClaims = stats?.total || 0;

  if (isLoading) {
    return (
      <div className="space-y-6 p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Claims History</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track all warranty claims and RMA records
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <Skeleton className="h-32" />
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
          <h1 className="text-3xl font-bold" data-testid="claims-heading">
            Claims History
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track all warranty claims and RMA records
          </p>
        </div>
        <Button
          onClick={handleExportToExcel}
          disabled={!claims || claims.length === 0}
          data-testid="button-export-claims"
          size="lg"
        >
          <Download className="h-4 w-4 mr-2" />
          Export to Excel
        </Button>
      </div>

      {/* Summary Stats Row */}
      <Card className="rounded-2xl border hover-elevate transition-all">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <FileWarning className="h-6 w-6 text-primary" />
            </div>
            <Badge variant="outline">Total</Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Total Claims</p>
            <p className="text-4xl font-bold tracking-tight" data-testid="text-total-claims">
              {totalClaims.toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Search and Table */}
      <div className="space-y-4">
        <SearchBar
          onSearch={handleSearchChange}
          placeholder="Search by serial number, RMA, make, or model..."
        />

        {totalPages > 1 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalClaims}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        )}

        <DataTable
          data={claims || []}
          columns={columns}
        />
      </div>
    </div>
  );
}
