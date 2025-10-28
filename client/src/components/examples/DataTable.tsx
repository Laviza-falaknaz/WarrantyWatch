import DataTable from "../DataTable";
import { Badge } from "@/components/ui/badge";

const sampleData = [
  {
    serialNumber: "SN123456789",
    make: "HP",
    model: "EliteBook 840 G8",
    processor: "Intel Core i5",
    ram: "8GB",
    warrantyStatus: "Active",
    coverage: "In Pool",
  },
  {
    serialNumber: "SN987654321",
    make: "Dell",
    model: "Latitude 7420",
    processor: "Intel Core i7",
    ram: "16GB",
    warrantyStatus: "Expiring Soon",
    coverage: "Not Covered",
  },
  {
    serialNumber: "SN456789123",
    make: "Lenovo",
    model: "ThinkPad X1 Carbon",
    processor: "Intel Core i5",
    ram: "16GB",
    warrantyStatus: "Active",
    coverage: "In Pool",
  },
];

export default function DataTableExample() {
  const columns = [
    {
      key: "serialNumber",
      header: "Serial Number",
      width: "160px",
      render: (item: typeof sampleData[0]) => (
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
      key: "warrantyStatus",
      header: "Warranty Status",
      width: "140px",
      render: (item: typeof sampleData[0]) => (
        <Badge variant={item.warrantyStatus === "Active" ? "default" : "destructive"}>
          {item.warrantyStatus}
        </Badge>
      ),
    },
    {
      key: "coverage",
      header: "Coverage",
      width: "120px",
      render: (item: typeof sampleData[0]) => (
        <Badge variant={item.coverage === "In Pool" ? "secondary" : "outline"}>
          {item.coverage}
        </Badge>
      ),
    },
  ];

  return (
    <div className="p-6">
      <DataTable
        columns={columns}
        data={sampleData}
        onRowClick={(item) => console.log("Row clicked:", item)}
      />
    </div>
  );
}
