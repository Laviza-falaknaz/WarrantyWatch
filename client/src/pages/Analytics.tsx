import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/analytics"],
  });

  const { data: warranties, isLoading: warrantiesLoading } = useQuery({
    queryKey: ["/api/warranties"],
  });

  const { data: inventoryWithWarranty, isLoading: inventoryLoading } = useQuery({
    queryKey: ["/api/inventory-with-warranty"],
  });

  // Generate warranty expiration trend data
  const warrantyExpirationData = warranties ? (() => {
    const months = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
    const now = new Date();
    
    return months.map((month, index) => {
      const targetDate = new Date(now);
      targetDate.setMonth(targetDate.getMonth() + index);
      targetDate.setDate(1);
      
      const nextMonth = new Date(targetDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      const expiring = warranties.filter((w: any) => {
        const endDate = new Date(w.warrantyEndDate);
        return endDate >= targetDate && endDate < nextMonth && w.isActive;
      }).length;
      
      return { month, expiring };
    });
  })() : [];

  // Generate pool coverage by make data
  const poolCoverageByMake = inventoryWithWarranty ? (() => {
    const makeGroups = inventoryWithWarranty.reduce((acc: any, item: any) => {
      if (!acc[item.make]) {
        acc[item.make] = { total: 0, inPool: 0 };
      }
      acc[item.make].total++;
      if (!item.soldOrder) {
        acc[item.make].inPool++;
      }
      return acc;
    }, {});
    
    return Object.entries(makeGroups).map(([make, data]: [string, any]) => ({
      make,
      coverage: data.total > 0 ? (data.inPool / data.total * 100).toFixed(1) : 0,
      inventory: data.total,
    }));
  })() : [];

  // Generate status distribution
  const statusDistribution = warranties ? [
    { 
      name: "Active", 
      value: warranties.filter((w: any) => w.isActive).length, 
      color: "hsl(var(--chart-1))" 
    },
    { 
      name: "Expiring Soon", 
      value: warranties.filter((w: any) => {
        if (!w.isActive) return false;
        const daysRemaining = Math.floor((new Date(w.warrantyEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return daysRemaining < 30;
      }).length, 
      color: "hsl(var(--chart-4))" 
    },
    { 
      name: "Inactive", 
      value: warranties.filter((w: any) => !w.isActive).length, 
      color: "hsl(var(--chart-3))" 
    },
  ] : [];

  // Calculate coverage target
  const totalPoolUnits = inventoryWithWarranty?.filter((item: any) => !item.soldOrder).length || 0;
  const targetCoverage = 0.15;
  const targetUnits = Math.ceil((analytics?.totalInventory || 0) * targetCoverage);
  const unitsNeeded = Math.max(0, targetUnits - totalPoolUnits);

  if (analyticsLoading || warrantiesLoading || inventoryLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Visualize warranty trends and pool performance
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

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
              <span className="text-lg font-bold">{analytics?.totalInventory || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
              <span className="text-sm font-medium">Total Pool Units</span>
              <span className="text-lg font-bold">{totalPoolUnits}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
              <span className="text-sm font-medium">Average Pool Coverage</span>
              <span className="text-lg font-bold">
                {analytics?.totalInventory > 0 ? ((totalPoolUnits / analytics.totalInventory) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
              <span className="text-sm font-medium">Coverage Target (15%)</span>
              <span className={`text-lg font-bold ${unitsNeeded > 0 ? 'text-yellow-600 dark:text-yellow-500' : 'text-green-600 dark:text-green-500'}`}>
                {unitsNeeded > 0 ? `${unitsNeeded} needed` : 'Target met'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
