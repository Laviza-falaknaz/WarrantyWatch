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
  variant?: "default" | "primary" | "secondary" | "accent";
}

export default function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  subtitle,
  className,
  variant = "default",
}: MetricCardProps) {
  const iconBgColors = {
    default: "bg-muted",
    primary: "bg-primary/20",
    secondary: "bg-secondary/20",
    accent: "bg-accent/20",
  };

  const iconColors = {
    default: "text-muted-foreground",
    primary: "text-primary-foreground",
    secondary: "text-secondary-foreground",
    accent: "text-accent-foreground",
  };

  return (
    <Card className={cn("rounded-2xl border shadow-sm hover-elevate", className)} data-testid={`card-metric-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
        </div>
        <div className={cn("flex items-center justify-center w-10 h-10 rounded-xl", iconBgColors[variant])}>
          <Icon className={cn("h-5 w-5", iconColors[variant])} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold tracking-tight" data-testid={`text-value-${title.toLowerCase().replace(/\s+/g, "-")}`}>
            {value}
          </p>
          {change && (
            <span
              className={cn(
                "text-xs font-medium",
                change.trend === "up" && "text-accent-foreground",
                change.trend === "down" && "text-destructive-foreground",
                change.trend === "neutral" && "text-muted-foreground"
              )}
            >
              {change.trend === "up" ? "↑" : change.trend === "down" ? "↓" : "→"}{" "}
              {Math.abs(change.value)}%
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
