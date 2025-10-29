import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import DataTable, { Column } from "@/components/DataTable";
import SearchBar from "@/components/SearchBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Filter } from "lucide-react";
import { format } from "date-fns";
import type { CoveredUnit, AppConfiguration } from "@shared/schema";

export default function Warranties() {
  const [searchQuery, setSearchQuery] = useState("");
  const [hideExpired, setHideExpired] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Get configuration for expiring days threshold
  const { data: configuration } = useQuery<AppConfiguration>({
    queryKey: ["/api/configuration"],
  });

  const expiringThresholdDays = configuration?.expiringCoverageDays || 30;

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

  // Filter data based on user selections
  const filteredData = useMemo(() => {
    if (!stockUnderWarranty) return [];
    
    return stockUnderWarranty.filter((item: CoveredUnit) => {
      const daysRemaining = getDaysRemaining(item.coverageEndDate);
      const status = getCoverageStatus(daysRemaining);
      
      // Filter by expired checkbox
      if (hideExpired && status === "Expired") return false;
      
      // Filter by status
      if (statusFilter !== "all" && status.toLowerCase() !== statusFilter) return false;
      
      return true;
    });
  }, [stockUnderWarranty, hideExpired, statusFilter, expiringThresholdDays]);

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

  // Calculate stats for display
  const stats = useMemo(() => {
    if (!stockUnderWarranty) return { active: 0, expiring: 0, expired: 0, total: 0 };
    
    const active = stockUnderWarranty.filter((item: CoveredUnit) => {
      const days = getDaysRemaining(item.coverageEndDate);
      return getCoverageStatus(days) === "Active";
    }).length;
    
    const expiring = stockUnderWarranty.filter((item: CoveredUnit) => {
      const days = getDaysRemaining(item.coverageEndDate);
      return getCoverageStatus(days) === "Expiring Soon";
    }).length;
    
    const expired = stockUnderWarranty.filter((item: CoveredUnit) => {
      const days = getDaysRemaining(item.coverageEndDate);
      return getCoverageStatus(days) === "Expired";
    }).length;
    
    return { active, expiring, expired, total: stockUnderWarranty.length };
  }, [stockUnderWarranty, expiringThresholdDays]);

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
          onSearch={setSearchQuery}
          className="max-w-md"
        />

        {/* Filter Controls */}
        <Card data-testid="card-filter-controls">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Checkbox
                  id="hide-expired"
                  checked={hideExpired}
                  onCheckedChange={(checked) => setHideExpired(checked as boolean)}
                  data-testid="checkbox-hide-expired"
                />
                <Label htmlFor="hide-expired" className="text-sm font-normal cursor-pointer">
                  Hide Expired
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="status-filter" className="text-sm">Status:</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter" className="w-40" data-testid="select-status-filter">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expiring soon">Expiring Soon</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-muted-foreground ml-auto">
                Showing {filteredData.length} of {stats.total} units
              </div>
            </div>
          </CardContent>
        </Card>

        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={(item) => console.log("View stock under warranty details:", item)}
        />
      </div>
    </div>
  );
}
