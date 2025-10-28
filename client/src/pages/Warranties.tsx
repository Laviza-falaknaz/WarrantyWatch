import { useState } from "react";
import DataTable, { Column } from "@/components/DataTable";
import SearchBar from "@/components/SearchBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Calendar } from "lucide-react";
import { format } from "date-fns";

interface WarrantyItem {
  serialNumber: string;
  make: string;
  model: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  status: string;
  daysRemaining: number;
}

export default function Warranties() {
  const [searchQuery, setSearchQuery] = useState("");

  //todo: remove mock functionality
  const mockData: WarrantyItem[] = [
    {
      serialNumber: "SN123456789",
      make: "HP",
      model: "EliteBook 840 G8",
      startDate: new Date("2024-01-15"),
      endDate: new Date("2027-01-15"),
      duration: 1095,
      status: "Active",
      daysRemaining: 789,
    },
    {
      serialNumber: "SN987654321",
      make: "Dell",
      model: "Latitude 7420",
      startDate: new Date("2024-03-20"),
      endDate: new Date("2025-11-20"),
      duration: 365,
      status: "Expiring Soon",
      daysRemaining: 28,
    },
    {
      serialNumber: "SN456789123",
      make: "Lenovo",
      model: "ThinkPad X1 Carbon",
      startDate: new Date("2023-06-10"),
      endDate: new Date("2026-06-10"),
      duration: 1095,
      status: "Active",
      daysRemaining: 563,
    },
    {
      serialNumber: "SN789123456",
      make: "HP",
      model: "ProBook 450 G8",
      startDate: new Date("2024-08-01"),
      endDate: new Date("2025-08-01"),
      duration: 365,
      status: "Active",
      daysRemaining: 278,
    },
    {
      serialNumber: "SN321654987",
      make: "Dell",
      model: "Precision 5560",
      startDate: new Date("2022-11-15"),
      endDate: new Date("2024-09-15"),
      duration: 730,
      status: "Inactive",
      daysRemaining: -45,
    },
  ];

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
      key: "startDate",
      header: "Start Date",
      width: "120px",
      render: (item) => (
        <span className="text-sm">{format(item.startDate, "MMM dd, yyyy")}</span>
      ),
    },
    {
      key: "endDate",
      header: "End Date",
      width: "120px",
      render: (item) => (
        <span className="text-sm">{format(item.endDate, "MMM dd, yyyy")}</span>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      width: "100px",
      render: (item) => (
        <span className="text-sm">{item.duration} days</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "140px",
      render: (item) => (
        <Badge
          variant={
            item.status === "Active"
              ? "default"
              : item.status === "Expiring Soon"
              ? "destructive"
              : "outline"
          }
        >
          {item.status}
        </Badge>
      ),
    },
    {
      key: "daysRemaining",
      header: "Days Left",
      width: "100px",
      render: (item) => {
        const color =
          item.daysRemaining < 0
            ? "text-muted-foreground"
            : item.daysRemaining < 30
            ? "text-red-600 dark:text-red-500"
            : item.daysRemaining < 90
            ? "text-yellow-600 dark:text-yellow-500"
            : "";
        return (
          <span className={`text-sm font-medium ${color}`}>
            {item.daysRemaining < 0 ? "Expired" : `${item.daysRemaining} days`}
          </span>
        );
      },
    },
  ];

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
          placeholder="Search by serial number, make, model..."
          onSearch={setSearchQuery}
          className="max-w-md"
        />

        <DataTable
          columns={columns}
          data={mockData}
          onRowClick={(item) => console.log("View warranty details:", item)}
        />
      </div>
    </div>
  );
}
