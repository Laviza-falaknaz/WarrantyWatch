import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  AlertTriangle,
  Filter,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addMonths, subMonths, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, startOfWeek, endOfWeek, eachMonthOfInterval } from "date-fns";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";

interface CoveredUnit {
  id: string;
  coverageEndDate: string;
  isCoverageActive: boolean;
  orderNumber?: string;
  customerName?: string;
  make?: string;
  model?: string;
}

interface HeatmapCell {
  date: Date;
  count: number;
  units: CoveredUnit[];
}

// GitHub-style heatmap cell
function HeatmapDay({
  cell,
  maxCount,
  onClick,
}: {
  cell: HeatmapCell;
  maxCount: number;
  onClick: () => void;
}) {
  const intensity = maxCount > 0 ? (cell.count / maxCount) * 100 : 0;

  const getBgColor = () => {
    if (intensity === 0) return "bg-muted/10";
    if (intensity < 20) return "bg-accent/20";
    if (intensity < 40) return "bg-amber-400/30";
    if (intensity < 60) return "bg-orange-500/40";
    if (intensity < 80) return "bg-destructive/50";
    return "bg-destructive/70";
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={cn(
            "w-3 h-3 rounded-sm border border-border/40 transition-all cursor-pointer",
            getBgColor(),
            cell.count > 0 && "hover:ring-2 hover:ring-primary/50"
          )}
          data-testid={`heatmap-day-${format(cell.date, 'yyyy-MM-dd')}`}
        />
      </TooltipTrigger>
      <TooltipContent side="top" align="start">
        <div className="space-y-2">
          <p className="text-sm font-semibold">
            {format(cell.date, 'MMM d, yyyy')}
          </p>
          <div className="flex items-center gap-2">
            <Badge variant={cell.count > 5 ? "destructive" : cell.count > 0 ? "secondary" : "outline"}>
              {cell.count} {cell.count === 1 ? 'unit' : 'units'} expiring
            </Badge>
          </div>
          {cell.count > 0 && cell.count <= 5 && (
            <div className="text-xs text-muted-foreground space-y-1 max-w-xs">
              {cell.units.slice(0, 5).map((unit, i) => (
                <div key={i} className="truncate">
                  {unit.orderNumber || 'N/A'} - {unit.make} {unit.model}
                </div>
              ))}
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export default function MonitorDashboard() {
  const [startDate, setStartDate] = useState(() => subMonths(new Date(), 1));
  const [filters, setFilters] = useState({
    orderNumber: "",
    customerName: "",
    make: "",
    model: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const endDate = useMemo(() => addMonths(startDate, 6), [startDate]);

  const { data: coveredUnits, isLoading } = useQuery<CoveredUnit[]>({
    queryKey: ["/api/covered-units"],
  });

  const { data: riskCombinations } = useQuery({
    queryKey: ["/api/risk-combinations"],
  });

  // Filter units based on user filters
  const filteredUnits = useMemo(() => {
    if (!coveredUnits) return [];
    
    return coveredUnits.filter((unit) => {
      if (filters.orderNumber && !unit.orderNumber?.toLowerCase().includes(filters.orderNumber.toLowerCase())) {
        return false;
      }
      if (filters.customerName && !unit.customerName?.toLowerCase().includes(filters.customerName.toLowerCase())) {
        return false;
      }
      if (filters.make && !unit.make?.toLowerCase().includes(filters.make.toLowerCase())) {
        return false;
      }
      if (filters.model && !unit.model?.toLowerCase().includes(filters.model.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [coveredUnits, filters]);

  // Generate heatmap data (day-by-day)
  const heatmapData = useMemo(() => {
    if (!filteredUnits) return [];

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    return days.map((date) => {
      const unitsExpiringThisDay = filteredUnits.filter((unit) => {
        if (!unit.isCoverageActive) return false;
        const expiryDate = new Date(unit.coverageEndDate);
        return isSameDay(expiryDate, date);
      });

      return {
        date,
        count: unitsExpiringThisDay.length,
        units: unitsExpiringThisDay,
      };
    });
  }, [filteredUnits, startDate, endDate]);

  const maxCount = useMemo(
    () => Math.max(...heatmapData.map((d) => d.count), 1),
    [heatmapData]
  );

  // Calculate stats
  const totalExpiring = useMemo(
    () => heatmapData.reduce((sum, cell) => sum + cell.count, 0),
    [heatmapData]
  );

  const peakDay = useMemo(
    () => heatmapData.reduce((max, cell) => (cell.count > max.count ? cell : max), heatmapData[0] || { count: 0, date: new Date(), units: [] }),
    [heatmapData]
  );

  const highRiskDays = useMemo(
    () => heatmapData.filter((cell) => cell.count > 5).length,
    [heatmapData]
  );

  // Trend data - aggregate by month
  const trendData = useMemo(() => {
    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    
    return months.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthCells = heatmapData.filter(
        (cell) => cell.date >= monthStart && cell.date <= monthEnd
      );
      
      const totalExpiring = monthCells.reduce((sum, cell) => sum + cell.count, 0);
      const peakDay = Math.max(...monthCells.map((c) => c.count), 0);
      const avgPerDay = monthCells.length > 0 ? totalExpiring / monthCells.length : 0;
      
      return {
        month: format(month, 'MMM yyyy'),
        totalExpiring,
        peakDay,
        avgPerDay: parseFloat(avgPerDay.toFixed(1)),
      };
    });
  }, [heatmapData, startDate, endDate]);

  // Daily trend data for sparkline
  const dailyTrendData = useMemo(() => {
    return heatmapData.slice(0, 90).map((cell) => ({
      date: format(cell.date, 'MMM d'),
      count: cell.count,
    }));
  }, [heatmapData]);

  // Group heatmap by weeks for GitHub-style display
  const heatmapWeeks = useMemo(() => {
    const weeks: HeatmapCell[][] = [];
    let currentWeek: HeatmapCell[] = [];
    
    // Pad the start to align with week start
    const firstDay = heatmapData[0];
    if (firstDay) {
      const dayOfWeek = firstDay.date.getDay();
      for (let i = 0; i < dayOfWeek; i++) {
        currentWeek.push({ date: new Date(), count: -1, units: [] }); // -1 indicates padding
      }
    }

    heatmapData.forEach((cell, index) => {
      currentWeek.push(cell);
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    // Pad the end
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: new Date(), count: -1, units: [] });
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [heatmapData]);

  const moveTimeWindow = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setStartDate(prev => subMonths(prev, 1));
    } else {
      setStartDate(prev => addMonths(prev, 1));
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-12 w-96" />
        <div className="grid grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="p-8 space-y-8">
        {/* Header */}
        <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Monitor</h1>
            <p className="text-muted-foreground">
              Track warranty expirations and high-risk combinations
            </p>
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
            data-testid="button-toggle-filters"
          >
            <Filter className="w-4 h-4" />
            Filters
            {Object.values(filters).some(v => v) && (
              <Badge variant="destructive" className="ml-2">
                {Object.values(filters).filter(v => v).length}
              </Badge>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Filter Warranties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="filter-order">Order Number</Label>
                  <Input
                    id="filter-order"
                    placeholder="Search orders..."
                    value={filters.orderNumber}
                    onChange={(e) => setFilters(prev => ({ ...prev, orderNumber: e.target.value }))}
                    data-testid="input-filter-order"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-customer">Customer Name</Label>
                  <Input
                    id="filter-customer"
                    placeholder="Search customers..."
                    value={filters.customerName}
                    onChange={(e) => setFilters(prev => ({ ...prev, customerName: e.target.value }))}
                    data-testid="input-filter-customer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-make">Make</Label>
                  <Input
                    id="filter-make"
                    placeholder="Search makes..."
                    value={filters.make}
                    onChange={(e) => setFilters(prev => ({ ...prev, make: e.target.value }))}
                    data-testid="input-filter-make"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-model">Model</Label>
                  <Input
                    id="filter-model"
                    placeholder="Search models..."
                    value={filters.model}
                    onChange={(e) => setFilters(prev => ({ ...prev, model: e.target.value }))}
                    data-testid="input-filter-model"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setFilters({ orderNumber: "", customerName: "", make: "", model: "" })}
                  data-testid="button-clear-filters"
                >
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Expiring</p>
                  <p className="text-2xl font-bold" data-testid="text-total-expiring">{totalExpiring}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Peak Day</p>
                  <p className="text-2xl font-bold" data-testid="text-peak-count">{peakDay.count}</p>
                  <p className="text-xs text-muted-foreground">
                    {peakDay.date && format(peakDay.date, 'MMM d')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Activity className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">High-Risk Days</p>
                  <p className="text-2xl font-bold" data-testid="text-high-risk-days">{highRiskDays}</p>
                  <p className="text-xs text-muted-foreground">&gt;5 units/day</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Risk Combos</p>
                  <p className="text-2xl font-bold" data-testid="text-risk-combos">
                    {Array.isArray(riskCombinations) ? riskCombinations.length : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* GitHub-Style Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="rounded-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Warranty Expiration Timeline</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')} (6-month view)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => moveTimeWindow('prev')}
                  data-testid="button-prev-period"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => moveTimeWindow('next')}
                  data-testid="button-next-period"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setStartDate(subMonths(new Date(), 1))}
                  data-testid="button-reset-period"
                >
                  Today
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {/* Month labels */}
              <div className="flex gap-1 mb-2 ml-12">
                {Array.from({ length: 6 }).map((_, i) => {
                  const month = addMonths(startDate, i);
                  return (
                    <div key={i} className="text-xs text-muted-foreground" style={{ width: '80px' }}>
                      {format(month, 'MMM yyyy')}
                    </div>
                  );
                })}
              </div>

              {/* Heatmap grid */}
              <div className="flex gap-1">
                {/* Day labels */}
                <div className="flex flex-col gap-1 text-xs text-muted-foreground justify-around">
                  <div>Mon</div>
                  <div>Wed</div>
                  <div>Fri</div>
                </div>

                {/* Grid */}
                <div className="flex gap-1">
                  {heatmapWeeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-1">
                      {week.map((cell, dayIndex) => (
                        <div key={dayIndex}>
                          {cell.count === -1 ? (
                            <div className="w-3 h-3" data-testid="heatmap-padding" />
                          ) : (
                            <HeatmapDay cell={cell} maxCount={maxCount} onClick={() => {}} />
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="mt-6 flex items-center gap-4 text-xs">
                <span className="text-muted-foreground">Less</span>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-muted/10 border"></div>
                  <div className="w-3 h-3 rounded-sm bg-accent/20 border"></div>
                  <div className="w-3 h-3 rounded-sm bg-amber-400/30 border"></div>
                  <div className="w-3 h-3 rounded-sm bg-orange-500/40 border"></div>
                  <div className="w-3 h-3 rounded-sm bg-destructive/50 border"></div>
                  <div className="w-3 h-3 rounded-sm bg-destructive/70 border"></div>
                </div>
                <span className="text-muted-foreground">More</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Trend Analysis Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl">Monthly Expiration Trends</CardTitle>
              <p className="text-sm text-muted-foreground">
                Total units expiring per month
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="totalExpiring" fill="hsl(var(--primary))" name="Total Expiring" />
                  <Bar dataKey="peakDay" fill="hsl(var(--destructive))" name="Peak Day" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl">Daily Expiration Pattern</CardTitle>
              <p className="text-sm text-muted-foreground">
                First 90 days trend
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" interval={14} />
                  <YAxis className="text-xs" />
                  <RechartsTooltip />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--accent))" 
                    fill="hsl(var(--accent) / 0.3)"
                    name="Units Expiring"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      </div>
    </TooltipProvider>
  );
}
