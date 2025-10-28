import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: "up" | "down" | "neutral";
  };
  icon: LucideIcon;
  subtitle?: string;
  className?: string;
}

export default function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  subtitle,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("h-32", className)} data-testid={`card-metric-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold" data-testid={`text-value-${title.toLowerCase().replace(/\s+/g, "-")}`}>
            {value}
          </p>
          {change && (
            <span
              className={cn(
                "text-xs font-medium",
                change.trend === "up" && "text-green-600 dark:text-green-500",
                change.trend === "down" && "text-red-600 dark:text-red-500",
                change.trend === "neutral" && "text-muted-foreground"
              )}
            >
              {change.trend === "up" ? "↑" : change.trend === "down" ? "↓" : "→"}{" "}
              {Math.abs(change.value)}%
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
