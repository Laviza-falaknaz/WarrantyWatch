import MetricCard from "@/components/MetricCard";
import PoolCoverageCard from "@/components/PoolCoverageCard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Shield, AlertTriangle, TrendingUp, Package, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  //todo: remove mock functionality
  const mockPoolGroups = [
    {
      name: "HP EliteBook",
      specs: ["HP", "EliteBook", "i5", "8GB"],
      required: 150,
      units: 4,
      coverage: 2.7,
    },
    {
      name: "Dell Latitude",
      specs: ["Dell", "Latitude", "i7", "16GB"],
      required: 89,
      units: 12,
      coverage: 13.5,
    },
    {
      name: "Lenovo ThinkPad",
      specs: ["Lenovo", "ThinkPad", "i5", "Gen 11"],
      required: 203,
      units: 8,
      coverage: 3.9,
    },
    {
      name: "Dell Precision",
      specs: ["Dell", "Precision", "i7", "32GB"],
      required: 45,
      units: 2,
      coverage: 4.4,
    },
    {
      name: "HP ProBook",
      specs: ["HP", "ProBook", "i3", "8GB"],
      required: 112,
      units: 15,
      coverage: 13.4,
    },
    {
      name: "Lenovo IdeaPad",
      specs: ["Lenovo", "IdeaPad", "Ryzen 5"],
      required: 76,
      units: 3,
      coverage: 3.9,
    },
  ];

  const mockAlerts = [
    {
      type: "low-coverage",
      message: "HP EliteBook pool below 5% coverage",
      time: "5 minutes ago",
    },
    {
      type: "expiring",
      message: "34 warranties expiring in next 30 days",
      time: "1 hour ago",
    },
    {
      type: "low-coverage",
      message: "Lenovo ThinkPad pool needs expansion",
      time: "2 hours ago",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor warranty coverage and pool status across all inventory
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Warranties"
          value={1247}
          change={{ value: 5.2, trend: "up" }}
          icon={Shield}
          subtitle="Across all inventory"
        />
        <MetricCard
          title="Pool Coverage"
          value="12.8%"
          change={{ value: 2.1, trend: "down" }}
          icon={Package}
          subtitle="Average coverage rate"
        />
        <MetricCard
          title="Expiring Soon"
          value={34}
          change={{ value: 12, trend: "up" }}
          icon={TrendingUp}
          subtitle="Next 30 days"
        />
        <MetricCard
          title="Low Coverage Alerts"
          value={8}
          icon={AlertTriangle}
          subtitle="Below 10% threshold"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-medium mb-4">Pool Coverage Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockPoolGroups.map((group, idx) => (
              <PoolCoverageCard
                key={idx}
                groupName={group.name}
                specifications={group.specs}
                inventoryRequired={group.required}
                poolUnits={group.units}
                coveragePercentage={group.coverage}
                onExpand={() => console.log(`Expand pool: ${group.name}`)}
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-4">Recent Alerts</h2>
          <Card>
            <CardContent className="p-4 space-y-4">
              {mockAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 pb-4 last:pb-0 border-b last:border-0"
                  data-testid={`alert-${idx}`}
                >
                  <AlertCircle
                    className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                      alert.type === "low-coverage"
                        ? "text-red-500"
                        : "text-yellow-500"
                    }`}
                  />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">{alert.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
