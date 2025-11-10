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
    primary: "bg-primary/10",
    secondary: "bg-secondary/10",
    accent: "bg-accent/10",
  };

  const iconColors = {
    default: "text-muted-foreground",
    primary: "text-primary",
    secondary: "text-secondary",
    accent: "text-accent",
  };

  const valueColors = {
    default: "text-foreground",
    primary: "text-primary",
    secondary: "text-secondary",
    accent: "text-accent",
  };

  return (
    <Card className={cn("rounded-2xl border border-border bg-card transition-shadow hover:shadow-sm", className)} data-testid={`card-metric-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={cn("flex items-center justify-center w-12 h-12 rounded-xl", iconBgColors[variant])}>
          <Icon className={cn("h-5 w-5", iconColors[variant])} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <p className={cn("text-3xl font-bold tracking-tight", valueColors[variant])} data-testid={`text-value-${title.toLowerCase().replace(/\s+/g, "-")}`}>
            {value}
          </p>
          {change && (
            <span
              className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                change.trend === "up" && "bg-accent/10 text-accent",
                change.trend === "down" && "bg-destructive/10 text-destructive",
                change.trend === "neutral" && "bg-muted text-muted-foreground"
              )}
            >
              {change.trend === "up" ? "↑" : change.trend === "down" ? "↓" : "→"}{" "}
              {Math.abs(change.value)}%
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
