import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Analytics() {
  //todo: remove mock functionality
  const warrantyExpirationData = [
    { month: "Nov", expiring: 12 },
    { month: "Dec", expiring: 18 },
    { month: "Jan", expiring: 34 },
    { month: "Feb", expiring: 28 },
    { month: "Mar", expiring: 22 },
    { month: "Apr", expiring: 31 },
  ];

  const poolCoverageByMake = [
    { make: "HP", coverage: 8.5, inventory: 342 },
    { make: "Dell", coverage: 12.3, inventory: 289 },
    { make: "Lenovo", coverage: 5.1, inventory: 256 },
    { make: "Apple", coverage: 15.7, inventory: 123 },
  ];

  const statusDistribution = [
    { name: "Active", value: 1247, color: "hsl(var(--chart-1))" },
    { name: "Expiring Soon", value: 34, color: "hsl(var(--chart-4))" },
    { name: "Inactive", value: 89, color: "hsl(var(--chart-3))" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visualize warranty trends and pool performance
          </p>
        </div>
        <Button variant="outline" data-testid="button-export-analytics">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-base font-medium">Warranty Expiration Trend</h3>
            <p className="text-xs text-muted-foreground">
              Number of warranties expiring per month
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={warrantyExpirationData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="month"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="expiring"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-1))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-base font-medium">Pool Coverage by Make</h3>
            <p className="text-xs text-muted-foreground">
              Coverage percentage across manufacturers
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={poolCoverageByMake}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="make"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  label={{
                    value: "Coverage %",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "hsl(var(--muted-foreground))" },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Bar dataKey="coverage" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-base font-medium">Warranty Status Distribution</h3>
            <p className="text-xs text-muted-foreground">
              Current status breakdown across all warranties
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="hsl(var(--chart-1))"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-base font-medium">Key Metrics Summary</h3>
            <p className="text-xs text-muted-foreground">
              Overall system performance indicators
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
              <span className="text-sm font-medium">Total Inventory Units</span>
              <span className="text-lg font-bold">1,370</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
              <span className="text-sm font-medium">Average Pool Coverage</span>
              <span className="text-lg font-bold">12.8%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
              <span className="text-sm font-medium">Total Pool Units</span>
              <span className="text-lg font-bold">64</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
              <span className="text-sm font-medium">Coverage Target (15%)</span>
              <span className="text-lg font-bold text-yellow-600 dark:text-yellow-500">
                206 needed
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
