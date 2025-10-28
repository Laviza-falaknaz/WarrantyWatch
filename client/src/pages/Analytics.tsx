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

  const { data: coveredUnits, isLoading: coveredUnitsLoading } = useQuery({
    queryKey: ["/api/covered-units"],
  });

  const { data: spareUnits, isLoading: spareUnitsLoading } = useQuery({
    queryKey: ["/api/spare-units"],
  });

  // Generate coverage expiration trend data
  const coverageExpirationData = (() => {
    if (!coveredUnits || !Array.isArray(coveredUnits)) return [];
    
    const months = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
    const now = new Date();
    
    return months.map((month, index) => {
      const targetDate = new Date(now);
      targetDate.setMonth(targetDate.getMonth() + index);
      targetDate.setDate(1);
      
      const nextMonth = new Date(targetDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      const expiring = coveredUnits.filter((c: any) => {
        const endDate = new Date(c.coverageEndDate);
        return endDate >= targetDate && endDate < nextMonth && c.isCoverageActive;
      }).length;
      
      return { month, expiring };
    });
  })();

  // Generate coverage ratio by make data (spare units / covered units)
  const coverageRatioByMake = (() => {
    if (!spareUnits || !coveredUnits || !Array.isArray(spareUnits) || !Array.isArray(coveredUnits)) return [];
    
    const makeGroups: any = {};
    
    // Count spare units by make
    spareUnits.forEach((unit: any) => {
      if (!makeGroups[unit.make]) {
        makeGroups[unit.make] = { spareCount: 0, coveredCount: 0 };
      }
      if (!unit.retiredOrder && !unit.reservedForCase) {
        makeGroups[unit.make].spareCount++;
      }
    });
    
    // Count covered units by make
    coveredUnits.forEach((unit: any) => {
      if (!makeGroups[unit.make]) {
        makeGroups[unit.make] = { spareCount: 0, coveredCount: 0 };
      }
      if (unit.isCoverageActive) {
        makeGroups[unit.make].coveredCount++;
      }
    });
    
    return Object.entries(makeGroups).map(([make, data]: [string, any]) => ({
      make,
      coverageRatio: data.coveredCount > 0 ? ((data.spareCount / data.coveredCount) * 100).toFixed(1) : 0,
      spareCount: data.spareCount,
      coveredCount: data.coveredCount,
    }));
  })();

  // Generate coverage status distribution
  const statusDistribution = (() => {
    if (!coveredUnits || !Array.isArray(coveredUnits)) return [];
    
    return [
      { 
        name: "Active Coverage", 
        value: coveredUnits.filter((c: any) => c.isCoverageActive).length, 
        color: "hsl(var(--chart-1))" 
      },
      { 
        name: "Expiring Soon", 
        value: coveredUnits.filter((c: any) => {
          if (!c.isCoverageActive) return false;
          const daysRemaining = Math.floor((new Date(c.coverageEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          return daysRemaining < 30;
        }).length, 
        color: "hsl(var(--chart-4))" 
      },
      { 
        name: "Inactive Coverage", 
        value: coveredUnits.filter((c: any) => !c.isCoverageActive).length, 
        color: "hsl(var(--chart-3))" 
      },
    ];
  })();

  // Calculate coverage ratio metrics
  const totalSpareUnits = (spareUnits && Array.isArray(spareUnits)) ? spareUnits.filter((unit: any) => !unit.retiredOrder && !unit.reservedForCase).length : 0;
  const totalCoveredUnits = (coveredUnits && Array.isArray(coveredUnits)) ? coveredUnits.filter((unit: any) => unit.isCoverageActive).length : 0;
  const currentCoverageRatio = totalCoveredUnits > 0 ? (totalSpareUnits / totalCoveredUnits) : 0;
  const targetCoverageRatio = 0.15;
  const targetSpareUnits = Math.ceil(totalCoveredUnits * targetCoverageRatio);
  const spareUnitsNeeded = Math.max(0, targetSpareUnits - totalSpareUnits);

  if (analyticsLoading || coveredUnitsLoading || spareUnitsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Analyze coverage trends and pool performance metrics
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
            Analyze coverage trends and pool performance metrics
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
            <h3 className="text-base font-medium">Coverage Expiration Trend</h3>
            <p className="text-xs text-muted-foreground">
              Covered units with expiring coverage per month
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={coverageExpirationData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="month"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  label={{
                    value: "Covered Units",
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
            <h3 className="text-base font-medium">Coverage Ratio by Make</h3>
            <p className="text-xs text-muted-foreground">
              Ratio of spare units to covered units by manufacturer
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={coverageRatioByMake}>
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
                    value: "Coverage Ratio %",
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
                  formatter={(value: any, name: string) => {
                    if (name === 'coverageRatio') return [`${value}%`, 'Coverage Ratio'];
                    return [value, name];
                  }}
                />
                <Bar dataKey="coverageRatio" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-base font-medium">Coverage Status Distribution</h3>
            <p className="text-xs text-muted-foreground">
              Current status breakdown across all covered units in field
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
              Coverage pool performance indicators
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
              <span className="text-sm font-medium">Total Spare Units</span>
              <span className="text-lg font-bold">{totalSpareUnits}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
              <span className="text-sm font-medium">Total Covered Units</span>
              <span className="text-lg font-bold">{totalCoveredUnits}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
              <span className="text-sm font-medium">Current Coverage Ratio</span>
              <span className="text-lg font-bold">
                {(currentCoverageRatio * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
              <span className="text-sm font-medium">Target Ratio (15%)</span>
              <span className={`text-lg font-bold ${spareUnitsNeeded > 0 ? 'text-yellow-600 dark:text-yellow-500' : 'text-green-600 dark:text-green-500'}`}>
                {spareUnitsNeeded > 0 ? `${spareUnitsNeeded} spare units needed` : 'Target met'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
