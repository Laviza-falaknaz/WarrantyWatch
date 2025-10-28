import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DataTable, { Column } from "@/components/DataTable";
import SearchBar from "@/components/SearchBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download } from "lucide-react";
import { format } from "date-fns";

interface WarrantyItem {
  id: string;
  serialNumber: string;
  areaId: string;
  itemId: string;
  warrantyStartDate: Date;
  warrantyEndDate: Date;
  durationInDays: number;
  isActive: boolean;
}

export default function Warranties() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: warranties, isLoading } = useQuery({
    queryKey: ["/api/warranties", searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      
      const response = await fetch(`/api/warranties?${params}`);
      if (!response.ok) throw new Error("Failed to fetch warranties");
      return response.json();
    },
  });

  const getDaysRemaining = (endDate: Date, isActive: boolean) => {
    if (!isActive) return -1;
    const now = new Date();
    const end = new Date(endDate);
    return Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatus = (isActive: boolean, daysRemaining: number) => {
    if (!isActive) return "Inactive";
    if (daysRemaining < 30) return "Expiring Soon";
    return "Active";
  };

  const columns: Column<WarrantyItem>[] = [
    {
      key: "serialNumber",
      header: "Serial Number",
      width: "160px",
      render: (item) => (
        <span className="font-mono text-sm">{item.serialNumber}</span>
      ),
    },
    {
      key: "areaId",
      header: "Area ID",
      width: "100px",
      render: (item) => (
        <span className="font-mono text-sm">{item.areaId}</span>
      ),
    },
    {
      key: "itemId",
      header: "Item ID",
      width: "100px",
      render: (item) => (
        <span className="font-mono text-sm">{item.itemId}</span>
      ),
    },
    {
      key: "warrantyStartDate",
      header: "Start Date",
      width: "120px",
      render: (item) => (
        <span className="text-sm">{format(new Date(item.warrantyStartDate), "MMM dd, yyyy")}</span>
      ),
    },
    {
      key: "warrantyEndDate",
      header: "End Date",
      width: "120px",
      render: (item) => (
        <span className="text-sm">{format(new Date(item.warrantyEndDate), "MMM dd, yyyy")}</span>
      ),
    },
    {
      key: "durationInDays",
      header: "Duration",
      width: "100px",
      render: (item) => (
        <span className="text-sm">{item.durationInDays} days</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "140px",
      render: (item) => {
        const daysRemaining = getDaysRemaining(item.warrantyEndDate, item.isActive);
        const status = getStatus(item.isActive, daysRemaining);
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
      key: "daysRemaining",
      header: "Days Left",
      width: "100px",
      render: (item) => {
        const daysRemaining = getDaysRemaining(item.warrantyEndDate, item.isActive);
        const color =
          daysRemaining < 0
            ? "text-muted-foreground"
            : daysRemaining < 30
            ? "text-red-600 dark:text-red-500"
            : daysRemaining < 90
            ? "text-yellow-600 dark:text-yellow-500"
            : "";
        return (
          <span className={`text-sm font-medium ${color}`}>
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
            <h1 className="text-2xl font-semibold">Warranties</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor warranty status and expiration dates
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
          <h1 className="text-2xl font-semibold">Warranties</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor warranty status and expiration dates
          </p>
        </div>
        <Button variant="outline" data-testid="button-export-warranties">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="space-y-4">
        <SearchBar
          placeholder="Search by serial number..."
          onSearch={setSearchQuery}
          className="max-w-md"
        />

        <DataTable
          columns={columns}
          data={warranties || []}
          onRowClick={(item) => console.log("View warranty details:", item)}
        />
      </div>
    </div>
  );
}
