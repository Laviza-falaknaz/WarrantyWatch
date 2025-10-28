import MetricCard from "../MetricCard";
import { Shield, AlertTriangle, TrendingUp, Package } from "lucide-react";

export default function MetricCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
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
  );
}
