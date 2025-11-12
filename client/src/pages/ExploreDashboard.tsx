import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, Package, FileText, AlertCircle, Calendar, X, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type FilterOptions = {
  makes: string[];
  models: string[];
  customers: string[];
  orders: string[];
};

type SelectedFilters = {
  make: string[];
  model: string[];
  customer: string[];
  order: string[];
};

// Color palettes for different charts
const CHART_COLORS = {
  blue: ["#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe"],
  green: ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5"],
  purple: ["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"],
  orange: ["#f97316", "#fb923c", "#fdba74", "#fed7aa", "#ffedd5"],
  pink: ["#ec4899", "#f472b6", "#f9a8d4", "#fbcfe8", "#fce7f3"],
  teal: ["#14b8a6", "#2dd4bf", "#5eead4", "#99f6e4", "#ccfbf1"],
  red: ["#ef4444", "#f87171", "#fca5a5", "#fecaca", "#fee2e2"],
  indigo: ["#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe", "#e0e7ff"],
  amber: ["#f59e0b", "#fbbf24", "#fcd34d", "#fde68a", "#fef3c7"],
};

// Helper to truncate long text
const truncateText = (text: string, maxLength: number = 20) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

// MultiSelect Component
function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
  testId
}: {
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  testId?: string;
}) {
  const [open, setOpen] = useState(false);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          data-testid={testId}
        >
          {selected.length > 0 ? `${selected.length} selected` : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder={`Search...`} />
          <CommandEmpty>No options found.</CommandEmpty>
          <CommandList className="max-h-[200px] overflow-y-auto">
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => toggleOption(option)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected.includes(option) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function ExploreDashboard() {
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({
    make: [],
    model: [],
    customer: [],
    order: [],
  });

  // Fetch filter options
  const { data: filterOptions } = useQuery<FilterOptions>({
    queryKey: ["/api/analytics/filter-options"],
  });

  // Build query params - full filters for covered units endpoints
  const fullFilterParams = useMemo(() => {
    const params = new URLSearchParams();
    selectedFilters.make.forEach(m => params.append('make', m));
    selectedFilters.model.forEach(m => params.append('model', m));
    selectedFilters.customer.forEach(c => params.append('customer', c));
    selectedFilters.order.forEach(o => params.append('order', o));
    const str = params.toString();
    return str || null;
  }, [selectedFilters]);

  // Build query params - limited filters for claims/replacements (only make/model)
  const limitedFilterParams = useMemo(() => {
    const params = new URLSearchParams();
    selectedFilters.make.forEach(m => params.append('make', m));
    selectedFilters.model.forEach(m => params.append('model', m));
    const str = params.toString();
    return str || null;
  }, [selectedFilters]);

  // Fetch all analytics data with appropriate filters
  const { data: topModels, isLoading: loadingTopModels } = useQuery({
    queryKey: ["/api/analytics/top-models-by-warranties", fullFilterParams],
    queryFn: () => fetch(`/api/analytics/top-models-by-warranties${fullFilterParams ? `?${fullFilterParams}` : ''}`).then(r => r.json()),
  });

  const { data: warrantyDescriptions, isLoading: loadingDescriptions } = useQuery({
    queryKey: ["/api/analytics/warranty-descriptions", fullFilterParams],
    queryFn: () => fetch(`/api/analytics/warranty-descriptions${fullFilterParams ? `?${fullFilterParams}` : ''}`).then(r => r.json()),
  });

  const { data: warrantiesByCategory, isLoading: loadingCategory } = useQuery({
    queryKey: ["/api/analytics/warranties-by-category", fullFilterParams],
    queryFn: () => fetch(`/api/analytics/warranties-by-category${fullFilterParams ? `?${fullFilterParams}` : ''}`).then(r => r.json()),
  });

  const { data: topCustomers, isLoading: loadingCustomers } = useQuery({
    queryKey: ["/api/analytics/top-customers", fullFilterParams],
    queryFn: () => fetch(`/api/analytics/top-customers${fullFilterParams ? `?${fullFilterParams}` : ''}`).then(r => r.json()),
  });

  // Claims and replacements use limited filters (only make/model)
  const { data: claimsByModel, isLoading: loadingClaims } = useQuery({
    queryKey: ["/api/analytics/claims-by-model", limitedFilterParams],
    queryFn: () => fetch(`/api/analytics/claims-by-model${limitedFilterParams ? `?${limitedFilterParams}` : ''}`).then(r => r.json()),
  });

  const { data: replacementsByModel, isLoading: loadingReplacements } = useQuery({
    queryKey: ["/api/analytics/replacements-by-model", limitedFilterParams],
    queryFn: () => fetch(`/api/analytics/replacements-by-model${limitedFilterParams ? `?${limitedFilterParams}` : ''}`).then(r => r.json()),
  });

  const { data: sparePool, isLoading: loadingSparePool } = useQuery({
    queryKey: ["/api/analytics/spare-pool-by-model", limitedFilterParams],
    queryFn: () => fetch(`/api/analytics/spare-pool-by-model${limitedFilterParams ? `?${limitedFilterParams}` : ''}`).then(r => r.json()),
  });

  const { data: monthlyClaimsReplacements, isLoading: loadingMonthly } = useQuery({
    queryKey: ["/api/analytics/monthly-claims-replacements", limitedFilterParams],
    queryFn: () => fetch(`/api/analytics/monthly-claims-replacements${limitedFilterParams ? `?${limitedFilterParams}` : ''}`).then(r => r.json()),
  });

  const { data: monthlyWarrantyStarts, isLoading: loadingWarrantyStarts } = useQuery({
    queryKey: ["/api/analytics/monthly-warranty-starts", fullFilterParams],
    queryFn: () => fetch(`/api/analytics/monthly-warranty-starts${fullFilterParams ? `?${fullFilterParams}` : ''}`).then(r => r.json()),
  });

  // Process category data for stacked timeline
  const categoryTimelineData = useMemo(() => {
    if (!warrantiesByCategory) return [];
    
    const monthMap = new Map<string, any>();
    warrantiesByCategory.forEach((item: any) => {
      if (!monthMap.has(item.month)) {
        monthMap.set(item.month, { month: item.month });
      }
      monthMap.get(item.month)[item.category] = item.count;
    });
    
    return Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [warrantiesByCategory]);

  const categories = useMemo(() => {
    if (!warrantiesByCategory) return [];
    return Array.from(new Set(warrantiesByCategory.map((item: any) => item.category)));
  }, [warrantiesByCategory]);

  const clearAllFilters = () => {
    setSelectedFilters({ make: [], model: [], customer: [], order: [] });
  };

  const hasActiveFilters = Object.values(selectedFilters).some(arr => arr.length > 0);

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">Warranty Analytics</h1>
          <p className="text-muted-foreground mt-1">Comprehensive business intelligence and analytics</p>
        </div>
      </div>

      {/* Global Filters */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-3">
          <div>
            <CardTitle className="text-base">Filters</CardTitle>
            <CardDescription>Filter all charts simultaneously</CardDescription>
          </div>
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAllFilters}
              data-testid="button-clear-filters"
            >
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Make</label>
              <MultiSelect
                options={filterOptions?.makes || []}
                selected={selectedFilters.make}
                onChange={(values) => setSelectedFilters(prev => ({ ...prev, make: values }))}
                placeholder="All Makes"
                testId="select-filter-make"
              />
              {selectedFilters.make.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedFilters.make.map(make => (
                    <Badge
                      key={make}
                      variant="secondary"
                      className="text-xs cursor-pointer"
                      onClick={() => setSelectedFilters(prev => ({ ...prev, make: prev.make.filter(v => v !== make) }))}
                    >
                      {make}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Model</label>
              <MultiSelect
                options={filterOptions?.models || []}
                selected={selectedFilters.model}
                onChange={(values) => setSelectedFilters(prev => ({ ...prev, model: values }))}
                placeholder="All Models"
                testId="select-filter-model"
              />
              {selectedFilters.model.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedFilters.model.map(model => (
                    <Badge
                      key={model}
                      variant="secondary"
                      className="text-xs cursor-pointer"
                      onClick={() => setSelectedFilters(prev => ({ ...prev, model: prev.model.filter(v => v !== model) }))}
                    >
                      {model}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Customer</label>
              <MultiSelect
                options={filterOptions?.customers || []}
                selected={selectedFilters.customer}
                onChange={(values) => setSelectedFilters(prev => ({ ...prev, customer: values }))}
                placeholder="All Customers"
                testId="select-filter-customer"
              />
              {selectedFilters.customer.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedFilters.customer.map(customer => (
                    <Badge
                      key={customer}
                      variant="secondary"
                      className="text-xs cursor-pointer"
                      onClick={() => setSelectedFilters(prev => ({ ...prev, customer: prev.customer.filter(v => v !== customer) }))}
                    >
                      {customer}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Order</label>
              <MultiSelect
                options={filterOptions?.orders || []}
                selected={selectedFilters.order}
                onChange={(values) => setSelectedFilters(prev => ({ ...prev, order: values }))}
                placeholder="All Orders"
                testId="select-filter-order"
              />
              {selectedFilters.order.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedFilters.order.map(order => (
                    <Badge
                      key={order}
                      variant="secondary"
                      className="text-xs cursor-pointer"
                      onClick={() => setSelectedFilters(prev => ({ ...prev, order: prev.order.filter(v => v !== order) }))}
                    >
                      {order}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Top Models by Warranties - Horizontal Bar */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-1 space-y-0 pb-2">
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <CardTitle className="text-base">Top Models by Active Warranties</CardTitle>
              <CardDescription>Most deployed models under coverage</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="overflow-hidden">
            {loadingTopModels ? (
              <Skeleton className="h-[360px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={360}>
                <BarChart 
                  data={topModels || []} 
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: "#666" }} />
                  <YAxis 
                    dataKey="model" 
                    type="category" 
                    width={150} 
                    tick={{ fontSize: 12, fill: "#333" }}
                    tickFormatter={(value) => truncateText(value, 18)}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #ddd' }}
                    labelStyle={{ color: '#333', fontWeight: 600 }}
                  />
                  <Bar dataKey="count" fill={CHART_COLORS.blue[0]} radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Chart 2: Coverage Descriptions - Horizontal Bar */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-1 space-y-0 pb-2">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <CardTitle className="text-base">Coverage Descriptions Distribution</CardTitle>
              <CardDescription>Breakdown by coverage type</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="overflow-hidden">
            {loadingDescriptions ? (
              <Skeleton className="h-[360px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={360}>
                <BarChart 
                  data={warrantyDescriptions || []}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: "#666" }} />
                  <YAxis 
                    dataKey="description" 
                    type="category" 
                    width={180}
                    tick={{ fontSize: 11, fill: "#333" }}
                    tickFormatter={(value) => truncateText(value, 22)}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #ddd' }}
                    labelStyle={{ color: '#333', fontWeight: 600 }}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {(warrantyDescriptions || []).map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS.green[index % CHART_COLORS.green.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Chart 8: Monthly Claims vs Replacements Timeline - Dual Line */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center gap-1 space-y-0 pb-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <CardTitle className="text-base">Monthly Claims vs Replacements</CardTitle>
              <CardDescription>Trend analysis of claims and fulfillment</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="overflow-hidden">
            {loadingMonthly ? (
              <Skeleton className="h-[360px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={360}>
                <LineChart 
                  data={monthlyClaimsReplacements || []}
                  margin={{ top: 5, right: 20, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12, fill: "#666" }}
                  />
                  <YAxis tick={{ fontSize: 12, fill: "#666" }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #ddd' }}
                  />
                  <Legend 
                    iconType="line"
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="claims"
                    stroke={CHART_COLORS.red[0]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Claims"
                  />
                  <Line
                    type="monotone"
                    dataKey="replacements"
                    stroke={CHART_COLORS.green[0]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Replacements"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Chart 3: Warranties by Category Timeline - Line Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center gap-1 space-y-0 pb-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <CardTitle className="text-base">Warranty Starts by Category Over Time</CardTitle>
              <CardDescription>Monthly breakdown by device category</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="overflow-hidden">
            {loadingCategory ? (
              <Skeleton className="h-[360px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={360}>
                <LineChart 
                  data={categoryTimelineData}
                  margin={{ top: 5, right: 20, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12, fill: "#666" }}
                  />
                  <YAxis tick={{ fontSize: 12, fill: "#666" }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #ddd' }}
                  />
                  <Legend 
                    iconType="line"
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                  {categories.map((cat, idx) => (
                    <Line
                      key={String(cat)}
                      type="monotone"
                      dataKey={String(cat)}
                      stroke={CHART_COLORS.purple[idx % CHART_COLORS.purple.length]}
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Chart 4: Top Customers by Covered Units - Vertical Bar */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-1 space-y-0 pb-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <CardTitle className="text-base">Top Customers by Coverage</CardTitle>
              <CardDescription>Customers with most covered units</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="overflow-hidden">
            {loadingCustomers ? (
              <Skeleton className="h-[360px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={360}>
                <BarChart 
                  data={topCustomers || []}
                  margin={{ top: 5, right: 20, left: 20, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="customer" 
                    angle={-30} 
                    textAnchor="end" 
                    height={80}
                    tick={{ fontSize: 11, fill: "#333" }}
                    interval={0}
                    tickFormatter={(value) => truncateText(value, 15)}
                  />
                  <YAxis tick={{ fontSize: 12, fill: "#666" }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #ddd' }}
                    labelStyle={{ color: '#333', fontWeight: 600 }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {(topCustomers || []).map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS.orange[index % CHART_COLORS.orange.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Chart 5: Claims by Model - Horizontal Bar */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-1 space-y-0 pb-2">
            <AlertCircle className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <CardTitle className="text-base">Claims by Model</CardTitle>
              <CardDescription>Distribution of warranty claims</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="overflow-hidden">
            {loadingClaims ? (
              <Skeleton className="h-[360px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={360}>
                <BarChart 
                  data={claimsByModel || []} 
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: "#666" }} />
                  <YAxis 
                    dataKey="model" 
                    type="category" 
                    width={150} 
                    tick={{ fontSize: 12, fill: "#333" }}
                    tickFormatter={(value) => truncateText(value, 18)}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #ddd' }}
                    labelStyle={{ color: '#333', fontWeight: 600 }}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {(claimsByModel || []).map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS.pink[index % CHART_COLORS.pink.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Chart 6: Replacements by Model - Horizontal Bar */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-1 space-y-0 pb-2">
            <Package className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <CardTitle className="text-base">Replacements by Model</CardTitle>
              <CardDescription>Distribution of fulfilled replacements</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="overflow-hidden">
            {loadingReplacements ? (
              <Skeleton className="h-[360px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={360}>
                <BarChart 
                  data={replacementsByModel || []} 
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: "#666" }} />
                  <YAxis 
                    dataKey="model" 
                    type="category" 
                    width={150} 
                    tick={{ fontSize: 12, fill: "#333" }}
                    tickFormatter={(value) => truncateText(value, 18)}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #ddd' }}
                    labelStyle={{ color: '#333', fontWeight: 600 }}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {(replacementsByModel || []).map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS.teal[index % CHART_COLORS.teal.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Chart 7: Spare Pool Horizontal Bar */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-1 space-y-0 pb-2">
            <Package className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <CardTitle className="text-base">Spare Unit Pool by Model</CardTitle>
              <CardDescription>Available inventory distribution</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="overflow-hidden">
            {loadingSparePool ? (
              <Skeleton className="h-[360px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={360}>
                <BarChart 
                  data={sparePool || []} 
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: "#666" }} />
                  <YAxis 
                    dataKey="model" 
                    type="category" 
                    width={150}
                    tick={{ fontSize: 12, fill: "#333" }}
                    tickFormatter={(value) => truncateText(value, 18)}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #ddd' }}
                    labelStyle={{ color: '#333', fontWeight: 600 }}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {(sparePool || []).map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS.indigo[index % CHART_COLORS.indigo.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Chart 9: Monthly Warranty Starts - Vertical Bar */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center gap-1 space-y-0 pb-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <CardTitle className="text-base">Monthly Warranty Activations</CardTitle>
              <CardDescription>New warranties started each month</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="overflow-hidden">
            {loadingWarrantyStarts ? (
              <Skeleton className="h-[360px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={360}>
                <BarChart 
                  data={monthlyWarrantyStarts || []}
                  margin={{ top: 5, right: 20, left: 20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12, fill: "#666" }}
                    angle={0}
                  />
                  <YAxis tick={{ fontSize: 12, fill: "#666" }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #ddd' }}
                    labelStyle={{ color: '#333', fontWeight: 600 }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {(monthlyWarrantyStarts || []).map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS.amber[index % CHART_COLORS.amber.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
