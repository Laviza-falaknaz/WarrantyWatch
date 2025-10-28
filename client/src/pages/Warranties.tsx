import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DataTable, { Column } from "@/components/DataTable";
import SearchBar from "@/components/SearchBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download } from "lucide-react";
import { format } from "date-fns";
import type { CoveredUnit } from "@shared/schema";

export default function Warranties() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: stockUnderWarranty, isLoading } = useQuery({
    queryKey: ["/api/covered-units", searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      
      const response = await fetch(`/api/covered-units?${params}`);
      if (!response.ok) throw new Error("Failed to fetch stock under warranty");
      return response.json();
    },
  });

  const getDaysRemaining = (endDate: Date, isCoverageActive: boolean) => {
    if (!isCoverageActive) return -1;
    const now = new Date();
    const end = new Date(endDate);
    return Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getCoverageStatus = (isCoverageActive: boolean, daysRemaining: number) => {
    if (!isCoverageActive) return "Inactive";
    if (daysRemaining < 30) return "Expiring Soon";
    return "Active";
  };

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
        const daysRemaining = getDaysRemaining(item.coverageEndDate, item.isCoverageActive);
        const status = getCoverageStatus(item.isCoverageActive, daysRemaining);
        return (
          <Badge
            variant={
              status === "Active"
                ? "default"
                : status === "Expiring Soon"
                ? "destructive"
                : "outline"
            }
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
        const daysRemaining = getDaysRemaining(item.coverageEndDate, item.isCoverageActive);
        const color =
          daysRemaining < 0
            ? "text-muted-foreground"
            : daysRemaining < 30
            ? "text-red-600 dark:text-red-500"
            : daysRemaining < 90
            ? "text-yellow-600 dark:text-yellow-500"
            : "";
        return (
          <span className={`text-sm font-medium ${color}`} data-testid={`stock-under-warranty-days-${item.id}`}>
            {daysRemaining < 0 ? "Expired" : `${daysRemaining} days`}
          </span>
        );
      },
    },
  ];

  if (isLoading) {
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

      <div className="space-y-4">
        <SearchBar
          placeholder="Search by serial number, make, or model..."
          onSearch={setSearchQuery}
          className="max-w-md"
        />

        <DataTable
          columns={columns}
          data={stockUnderWarranty || []}
          onRowClick={(item) => console.log("View stock under warranty details:", item)}
        />
      </div>
    </div>
  );
}
