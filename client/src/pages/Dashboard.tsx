import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Package,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Circular Progress Ring Component
function ProgressRing({
  value,
  max = 100,
  size = 120,
  strokeWidth = 12,
  label,
  sublabel,
  color = "primary",
}: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  label: string;
  sublabel?: string;
  color?: "primary" | "accent" | "warning" | "destructive";
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / max) * 100;
  const offset = circumference - (progress / 100) * circumference;

  const colorClasses = {
    primary: "stroke-primary",
    accent: "stroke-accent",
    warning: "stroke-amber-500",
    destructive: "stroke-destructive",
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/20"
          />
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className={colorClasses[color]}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{Math.round(progress)}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">{label}</p>
        {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
      </div>
    </div>
  );
}

// Heatmap Cell Component
function HeatmapCell({
  label,
  value,
  maxValue,
  onClick,
}: {
  label: string;
  value: number;
  maxValue: number;
  onClick?: () => void;
}) {
  const intensity = maxValue > 0 ? (value / maxValue) * 100 : 0;

  const getBgColor = () => {
    if (intensity === 0) return "bg-muted/20";
    if (intensity < 25) return "bg-accent/20";
    if (intensity < 50) return "bg-amber-500/30";
    if (intensity < 75) return "bg-orange-500/40";
    return "bg-destructive/50";
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05, zIndex: 10 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-xl cursor-pointer transition-all border",
        getBgColor(),
        onClick && "hover:shadow-lg"
      )}
      data-testid={`heatmap-cell-${label}`}
    >
      <div className="text-xs font-medium text-foreground/70">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {intensity > 50 && (
        <AlertTriangle className="absolute top-2 right-2 w-4 h-4 text-destructive" />
      )}
    </motion.div>
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  
  const { data: analytics, isLoading: analyticsLoading } = useQuery<{
    totalSpareUnits: number;
    totalCoveredUnits: number;
    activeCoverage: number;
    expiringCoverage: number;
    unallocatedSpareUnits: number;
    averageCoverageRatio: number;
    lowCoverageThresholdPercent: number;
    expiringCoverageDays: number;
  }>({
    queryKey: ["/api/analytics"],
  });

  const { data: stockUnderWarranty, isLoading: stockLoading } = useQuery({
    queryKey: ["/api/covered-units"],
  });

  // Calculate warranty expiration heatmap data
  const getWarrantyExpirationHeatmap = () => {
    if (!stockUnderWarranty || !Array.isArray(stockUnderWarranty)) return [];

    const periods = [
      { label: "0-30 days", start: 0, end: 30 },
      { label: "31-60 days", start: 31, end: 60 },
      { label: "61-90 days", start: 61, end: 90 },
      { label: "91-180 days", start: 91, end: 180 },
      { label: "181-365 days", start: 181, end: 364 },
      { label: "365+ days", start: 365, end: Infinity },
    ];

    const now = new Date();

    return periods.map((period) => {
      const count = stockUnderWarranty.filter((item: any) => {
        if (!item.isCoverageActive) return false;
        const endDate = new Date(item.coverageEndDate);
        const daysUntilExpiry = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry >= period.start && daysUntilExpiry <= period.end;
      }).length;

      return {
        label: period.label,
        value: count,
      };
    });
  };

  const heatmapData = getWarrantyExpirationHeatmap();
  const maxHeatmapValue = Math.max(...heatmapData.map((d) => d.value), 1);

  if (analyticsLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const coveragePercentage = analytics?.averageCoverageRatio || 0;
  const activeUnits = analytics?.activeCoverage || 0;
  const expiringUnits = analytics?.expiringCoverage || 0;
  const spareUnits = analytics?.totalSpareUnits || 0;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-4xl font-bold mb-2">Mission Control</h1>
        <p className="text-muted-foreground">
          Real-time coverage analytics and risk monitoring
        </p>
      </motion.div>

      {/* Hero KPI Section with Progress Rings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="rounded-2xl border-2 overflow-hidden bg-gradient-to-br from-card via-card to-primary/5">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <ProgressRing
                value={coveragePercentage}
                label="Average Coverage"
                sublabel="Target: 80%+"
                color="primary"
              />
              <ProgressRing
                value={activeUnits}
                max={analytics?.totalCoveredUnits || 100}
                label="Active Coverage"
                sublabel={`${activeUnits} of ${analytics?.totalCoveredUnits || 0} units`}
                color="accent"
              />
              <ProgressRing
                value={expiringUnits}
                max={100}
                label="Expiring Soon"
                sublabel={`${expiringUnits} units`}
                color="warning"
              />
              <ProgressRing
                value={spareUnits}
                max={analytics?.totalCoveredUnits || 100}
                label="Spare Units"
                sublabel={`${spareUnits} available`}
                color="accent"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Warranty Expiration Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Warranty Expiration Timeline</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Click any period to view detailed inventory
                </p>
              </div>
              <Badge variant="outline" className="gap-2">
                <Activity className="w-4 h-4" />
                {stockUnderWarranty?.length || 0} Total Units
              </Badge>
            </div>

            {stockLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {heatmapData.map((cell, index) => (
                  <HeatmapCell
                    key={index}
                    label={cell.label}
                    value={cell.value}
                    maxValue={maxHeatmapValue}
                    onClick={() => setLocation("/warranties")}
                  />
                ))}
              </div>
            )}

            <div className="mt-6 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-muted/20"></div>
                <span className="text-muted-foreground">None</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-accent/20"></div>
                <span className="text-muted-foreground">Low</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-amber-500/30"></div>
                <span className="text-muted-foreground">Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-destructive/50"></div>
                <span className="text-muted-foreground">High</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Link href="/pools">
            <Card className="rounded-2xl hover-elevate active-elevate-2 transition-all cursor-pointer border-2 hover:border-primary/50" data-testid="card-quick-action-pools">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">Coverage Pools</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage warranty pools and allocations
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" data-testid="badge-pools-count">
                    {analytics?.totalCoveredUnits || 0} pools
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Link href="/inventory">
            <Card className="rounded-2xl hover-elevate active-elevate-2 transition-all cursor-pointer border-2 hover:border-accent/50" data-testid="card-quick-action-inventory">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-accent/10 rounded-xl">
                    <Package className="w-6 h-6 text-accent" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">Replacement Pool</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  View and manage spare inventory
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" data-testid="badge-spare-units">{spareUnits} units</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Link href="/warranties">
            <Card className="rounded-2xl hover-elevate active-elevate-2 transition-all cursor-pointer border-2 hover:border-amber-500/50" data-testid="card-quick-action-warranties">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-amber-500/10 rounded-xl">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">Warranty Status</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Monitor expiring warranties
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" data-testid="badge-expiring-units">{expiringUnits} expiring</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </div>

      {/* Status Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Active Coverage</p>
                  <p className="text-2xl font-bold">{activeUnits}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.7 }}
        >
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Expiring Soon</p>
                  <p className="text-2xl font-bold">{expiringUnits}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.8 }}
        >
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Spare Units</p>
                  <p className="text-2xl font-bold">{spareUnits}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.9 }}
        >
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Coverage Ratio</p>
                  <p className="text-2xl font-bold">{Math.round(coveragePercentage)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
