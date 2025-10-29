import { useState, useMemo, useCallback } from "react";
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
import type { CoveredUnit, AppConfiguration } from "@shared/schema";

export default function Warranties() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  const ITEMS_PER_PAGE = 100;

  // Get configuration for expiring days threshold
  const { data: configuration } = useQuery<AppConfiguration>({
    queryKey: ["/api/configuration"],
  });

  const expiringThresholdDays = configuration?.expiringCoverageDays || 30;

  // Fetch stats for entire dataset (for summary cards)
  const { data: fullStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/covered-units/stats", searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      
      const response = await fetch(`/api/covered-units/stats?${params}`);
      if (!response.ok) throw new Error("Failed to fetch covered units stats");
      return response.json() as Promise<{ total: number; active: number; expiring: number; expired: number; }>;
    },
  });

  // Fetch table data (paginated - 100 items per page)
  const { data: stockUnderWarranty, isLoading: tableLoading } = useQuery({
    queryKey: ["/api/covered-units", searchQuery, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      
      // Add pagination parameters
      params.append("limit", ITEMS_PER_PAGE.toString());
      params.append("offset", ((currentPage - 1) * ITEMS_PER_PAGE).toString());
      
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

  // Use full dataset stats for summary cards (not limited to 10k)
  const stats = fullStats || { active: 0, expiring: 0, expired: 0, total: 0 };

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when search changes
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

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
        
        // Color coding: Active=blue, Expiring Soon=orange, Expired=red
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
        
        // Color coding matches status
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
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Stock under Warranty</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Units deployed under warranty coverage that may need replacement
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
          <h1 className="text-2xl font-semibold" data-testid="heading-stock-under-warranty">
            Stock under Warranty
          </h1>
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-stock-under-warranty-description">
            Units deployed under warranty coverage that may need replacement
          </p>
        </div>
        <Button variant="outline" data-testid="button-export-stock-under-warranty">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total Units</div>
            <div className="text-2xl font-semibold mt-1">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Active</div>
            <div className="text-2xl font-semibold mt-1 text-blue-600 dark:text-blue-400">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Expiring Soon</div>
            <div className="text-2xl font-semibold mt-1 text-orange-600 dark:text-orange-400">{stats.expiring}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Expired</div>
            <div className="text-2xl font-semibold mt-1 text-red-600 dark:text-red-400">{stats.expired}</div>
          </CardContent>
        </Card>
      </div>

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
