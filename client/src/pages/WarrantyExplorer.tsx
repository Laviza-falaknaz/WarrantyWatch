import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, RefreshCw, Laptop, Tags, Box, Shield, ChevronDown, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// API endpoint from the HTML file
const API_URL = 'https://01f7d87362b64cf3a95fbd0a0c6bc1.28.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/6669a738385d413f9d33e10155e5a2cd/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=DwpZjBG08rpwV2uwqeQlve3naP1kzp3kbw-Jn2Wv388';

interface WarrantySummaryData {
  Make: string;
  CleanedModelNum: string;
  Category: string;
  WarrantyCount: number;
}

interface DrillData {
  a2c_acinvent_inventserialid: string;
  a2c_acinvent_areaid: string;
  a2c_acinvent_gradeuae: string;
  a2c_acinvent_processor_txt: string;
  a2c_acinvent_processorgen_txt: string;
  a2c_acinvent_currram: number;
  a2c_acinvent_currhdd: number;
  warrantydescription: string;
  warrantystartdate: string;
  warrantyenddate: string;
  warrantystatus: string;
  dayspending: number;
}

export default function WarrantyExplorer() {
  const { toast } = useToast();
  
  // State management
  const [data, setData] = useState<WarrantySummaryData[]>([]);
  const [filteredData, setFilteredData] = useState<WarrantySummaryData[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter states
  const [selectedMakes, setSelectedMakes] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [warrantyFilter, setWarrantyFilter] = useState<string>('');
  
  // Drill-down modal states
  const [drillModalOpen, setDrillModalOpen] = useState(false);
  const [drillData, setDrillData] = useState<DrillData[]>([]);
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillModalTitle, setDrillModalTitle] = useState('');
  const [drillSearchQuery, setDrillSearchQuery] = useState('');
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Fetch data from API
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "operation": "summary"
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiData = await response.json();
      setData(apiData);
      setFilteredData(apiData);
      
      // Initialize filters - all makes, all models, but only Reman and Circular categories
      const makes = Array.from(new Set(apiData.map((item: WarrantySummaryData) => item.Make))) as string[];
      const models = Array.from(new Set(apiData.map((item: WarrantySummaryData) => item.CleanedModelNum))) as string[];
      const categories = Array.from(new Set(apiData.map((item: WarrantySummaryData) => item.Category))) as string[];
      
      setSelectedMakes(makes);
      setSelectedModels(models);
      // Default to only Reman and Circular
      const defaultCategories = categories.filter(cat => 
        cat.toLowerCase() === 'reman' || cat.toLowerCase() === 'circular'
      );
      setSelectedCategories(defaultCategories.length > 0 ? defaultCategories : categories);
      
      setLastUpdated(new Date().toLocaleTimeString());
      
      toast({
        title: "Success",
        description: "Data loaded successfully",
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: `Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Apply filters
  useEffect(() => {
    let filtered = [...data];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.Make.toLowerCase().includes(query) ||
        item.CleanedModelNum.toLowerCase().includes(query) ||
        item.Category.toLowerCase().includes(query)
      );
    }

    // Make filter
    if (selectedMakes.length > 0) {
      filtered = filtered.filter(item => selectedMakes.includes(item.Make));
    }

    // Model filter
    if (selectedModels.length > 0) {
      filtered = filtered.filter(item => selectedModels.includes(item.CleanedModelNum));
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(item => selectedCategories.includes(item.Category));
    }

    // Warranty count filter
    if (warrantyFilter) {
      filtered = filtered.filter(item => {
        if (warrantyFilter === 'low') return item.WarrantyCount >= 1 && item.WarrantyCount <= 19;
        if (warrantyFilter === 'medium') return item.WarrantyCount >= 20 && item.WarrantyCount <= 49;
        if (warrantyFilter === 'high') return item.WarrantyCount >= 50;
        return true;
      });
    }

    // Apply sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        const aVal = a[sortColumn as keyof WarrantySummaryData];
        const bVal = b[sortColumn as keyof WarrantySummaryData];
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        return 0;
      });
    }

    setFilteredData(filtered);
  }, [data, searchQuery, selectedMakes, selectedModels, selectedCategories, warrantyFilter, sortColumn, sortDirection]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const totalWarranties = filteredData.reduce((sum, item) => sum + item.WarrantyCount, 0);
    const uniqueMakes = new Set(filteredData.map(item => item.Make)).size;
    const uniqueModels = new Set(filteredData.map(item => item.CleanedModelNum)).size;
    const uniqueCategories = new Set(filteredData.map(item => item.Category)).size;

    return { totalWarranties, uniqueMakes, uniqueModels, uniqueCategories };
  }, [filteredData]);

  // Prepare chart data
  const warrantyByMakeData = useMemo(() => {
    const makes: Record<string, number> = {};
    filteredData.forEach(item => {
      makes[item.Make] = (makes[item.Make] || 0) + item.WarrantyCount;
    });
    
    const sorted = Object.entries(makes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      labels: sorted.map(item => item[0]),
      datasets: [{
        label: 'Warranty Count',
        data: sorted.map(item => item[1]),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      }]
    };
  }, [filteredData]);

  const topCategoriesData = useMemo(() => {
    const categories: Record<string, number> = {};
    filteredData.forEach(item => {
      categories[item.Category] = (categories[item.Category] || 0) + item.WarrantyCount;
    });
    
    const sorted = Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      labels: sorted.map(item => item[0]),
      datasets: [{
        data: sorted.map(item => item[1]),
        backgroundColor: [
          'rgba(59, 130, 246, 0.85)',
          'rgba(16, 185, 129, 0.85)',
          'rgba(251, 146, 60, 0.85)',
          'rgba(147, 51, 234, 0.85)',
          'rgba(236, 72, 153, 0.85)',
        ],
        borderWidth: 0,
      }]
    };
  }, [filteredData]);

  const topModelsData = useMemo(() => {
    const models: Record<string, number> = {};
    filteredData.forEach(item => {
      models[item.CleanedModelNum] = (models[item.CleanedModelNum] || 0) + item.WarrantyCount;
    });
    
    const sorted = Object.entries(models)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      labels: sorted.map(item => item[0]),
      datasets: [{
        label: 'Warranty Count',
        data: sorted.map(item => item[1]),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
      }]
    };
  }, [filteredData]);

  // Drill-down functionality
  const handleDrillDown = async (make: string, model: string, category: string) => {
    setDrillModalTitle(`${make} - ${model} (${category})`);
    setDrillModalOpen(true);
    setDrillLoading(true);
    setDrillSearchQuery('');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "operation": "drill",
          "make": make,
          "model": model,
          "category": category
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const drillResult = await response.json();
      setDrillData(drillResult);
    } catch (error) {
      console.error('Error fetching drill data:', error);
      toast({
        title: "Error",
        description: `Failed to load device details: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setDrillLoading(false);
    }
  };

  // Drill data summary metrics
  const drillSummaryMetrics = useMemo(() => {
    const totalDevices = drillData.length;
    const activeWarranties = drillData.filter(item => item.warrantystatus === 'Active').length;
    const avgDaysPending = drillData.length > 0
      ? Math.round(drillData.reduce((sum, item) => sum + item.dayspending, 0) / drillData.length)
      : 0;
    const uniqueWarrantyTypes = new Set(drillData.map(item => item.warrantydescription)).size;

    return { totalDevices, activeWarranties, avgDaysPending, uniqueWarrantyTypes };
  }, [drillData]);

  // Drill data chart preparations
  const drillTimelineData = useMemo(() => {
    const months: Record<string, number> = {};
    
    drillData.forEach(item => {
      if (item.warrantystartdate) {
        const date = new Date(item.warrantystartdate);
        const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        months[monthYear] = (months[monthYear] || 0) + 1;
      }
    });

    const sorted = Object.entries(months).sort((a, b) => a[0].localeCompare(b[0]));
    const labels = sorted.map(([monthYear]) => {
      const [year, month] = monthYear.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });

    return {
      labels,
      datasets: [{
        label: 'Warranty Starts',
        data: sorted.map(([, count]) => count),
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      }]
    };
  }, [drillData]);

  const drillWarrantyTypesData = useMemo(() => {
    const descriptions: Record<string, number> = {};
    
    drillData.forEach(item => {
      const description = item.warrantydescription || 'Unknown';
      descriptions[description] = (descriptions[description] || 0) + 1;
    });

    const sorted = Object.entries(descriptions).sort((a, b) => b[1] - a[1]);

    return {
      labels: sorted.map(item => item[0]),
      datasets: [{
        label: 'Device Count',
        data: sorted.map(item => item[1]),
        backgroundColor: sorted.map((_, index) => {
          const colors = [
            'rgba(59, 130, 246, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(251, 146, 60, 0.7)',
            'rgba(147, 51, 234, 0.7)',
            'rgba(236, 72, 153, 0.7)',
          ];
          return colors[index % colors.length];
        }),
        borderWidth: 0,
        barThickness: 12,
      }]
    };
  }, [drillData]);

  // Filtered drill data based on search
  const filteredDrillData = useMemo(() => {
    if (!drillSearchQuery) return drillData;
    
    const query = drillSearchQuery.toLowerCase();
    return drillData.filter(item =>
      item.a2c_acinvent_inventserialid?.toLowerCase().includes(query) ||
      item.a2c_acinvent_areaid?.toLowerCase().includes(query) ||
      item.warrantydescription?.toLowerCase().includes(query)
    );
  }, [drillData, drillSearchQuery]);

  // Handle sorting
  const handleSort = useCallback((column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }, [sortColumn, sortDirection]);

  // Reset filters
  const resetFilters = useCallback(() => {
    const makes = Array.from(new Set(data.map(item => item.Make)));
    const models = Array.from(new Set(data.map(item => item.CleanedModelNum)));
    const categories = Array.from(new Set(data.map(item => item.Category)));
    
    setSelectedMakes(makes);
    setSelectedModels(models);
    setSelectedCategories(categories);
    setWarrantyFilter('');
    setSearchQuery('');
  }, [data]);

  // Get unique filter options
  const filterOptions = useMemo(() => {
    const makes = Array.from(new Set(data.map(item => item.Make))).sort();
    const allModels = Array.from(new Set(data.map(item => item.CleanedModelNum))).sort();
    const categories = Array.from(new Set(data.map(item => item.Category))).sort();
    
    // Filter models based on selected makes (Make-Model hierarchy)
    const models = selectedMakes.length === 0 || selectedMakes.length === makes.length
      ? allModels
      : Array.from(new Set(
          data
            .filter(item => selectedMakes.includes(item.Make))
            .map(item => item.CleanedModelNum)
        )).sort();
    
    return { makes, models, categories };
  }, [data, selectedMakes]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Warranty Explorer</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive warranty analytics and device tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by make, model or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          <Button
            onClick={fetchData}
            disabled={loading}
            data-testid="button-refresh"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh Data'}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card data-testid="card-total-warranties">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Warranties</CardTitle>
                <Laptop className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="value-total-warranties">
                  {summaryMetrics.totalWarranties.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">All active warranties</p>
              </CardContent>
            </Card>

            <Card data-testid="card-unique-makes">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Makes</CardTitle>
                <Tags className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="value-unique-makes">
                  {summaryMetrics.uniqueMakes}
                </div>
                <p className="text-xs text-muted-foreground">Different manufacturers</p>
              </CardContent>
            </Card>

            <Card data-testid="card-unique-models">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Models</CardTitle>
                <Box className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="value-unique-models">
                  {summaryMetrics.uniqueModels}
                </div>
                <p className="text-xs text-muted-foreground">Different device models</p>
              </CardContent>
            </Card>

            <Card data-testid="card-unique-categories">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="value-unique-categories">
                  {summaryMetrics.uniqueCategories}
                </div>
                <p className="text-xs text-muted-foreground">Different categories</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="chart-warranty-by-make">
              <CardHeader>
                <CardTitle>Warranty Distribution by Make</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <Bar
                    data={warrantyByMakeData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                      },
                      scales: {
                        y: { beginAtZero: true },
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card data-testid="chart-top-categories">
              <CardHeader>
                <CardTitle>Top Categories by Warranties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <Doughnut
                    data={topCategoriesData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom' },
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card data-testid="chart-top-models">
            <CardHeader>
              <CardTitle>Top 10 Models by Warranties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <Bar
                  data={topModelsData}
                  options={{
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      x: { beginAtZero: true },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Data Table with Filters */}
          <Card data-testid="table-warranty-summary">
            <CardHeader>
              <CardTitle>Warranty Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-wrap gap-4 p-4 mb-4 bg-muted/50 rounded-lg border">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs font-semibold uppercase mb-2 block">Make</label>
                  <Select
                    value={selectedMakes.length === filterOptions.makes.length ? "all" : "custom"}
                    onValueChange={(value) => {
                      if (value === "all") {
                        setSelectedMakes(filterOptions.makes);
                      }
                    }}
                  >
                    <SelectTrigger data-testid="select-make-filter">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All ({filterOptions.makes.length})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs font-semibold uppercase mb-2 block">Model</label>
                  <Select
                    value={selectedModels.length === filterOptions.models.length ? "all" : "custom"}
                    onValueChange={(value) => {
                      if (value === "all") {
                        setSelectedModels(filterOptions.models);
                      }
                    }}
                  >
                    <SelectTrigger data-testid="select-model-filter">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All ({filterOptions.models.length})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs font-semibold uppercase mb-2 block">Category</label>
                  <Select
                    value={selectedCategories.length === filterOptions.categories.length ? "all" : "custom"}
                    onValueChange={(value) => {
                      if (value === "all") {
                        setSelectedCategories(filterOptions.categories);
                      }
                    }}
                  >
                    <SelectTrigger data-testid="select-category-filter">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All ({filterOptions.categories.length})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs font-semibold uppercase mb-2 block">Warranty Count</label>
                  <Select value={warrantyFilter || "all"} onValueChange={(value) => setWarrantyFilter(value === "all" ? "" : value)}>
                    <SelectTrigger data-testid="select-warranty-count-filter">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="low">Low (1-19)</SelectItem>
                      <SelectItem value="medium">Medium (20-49)</SelectItem>
                      <SelectItem value="high">High (50+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end gap-2">
                  <Button variant="outline" onClick={resetFilters} data-testid="button-reset-filters">
                    Reset
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div className="border rounded-md">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th
                        className="p-3 text-left font-medium cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => handleSort('Make')}
                        data-testid="header-make"
                      >
                        Make {sortColumn === 'Make' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th
                        className="p-3 text-left font-medium cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => handleSort('CleanedModelNum')}
                        data-testid="header-model"
                      >
                        Model {sortColumn === 'CleanedModelNum' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th
                        className="p-3 text-left font-medium cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => handleSort('Category')}
                        data-testid="header-category"
                      >
                        Category {sortColumn === 'Category' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th
                        className="p-3 text-left font-medium cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => handleSort('WarrantyCount')}
                        data-testid="header-warranty-count"
                      >
                        Warranty Count {sortColumn === 'WarrantyCount' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="p-3 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                            <p className="text-muted-foreground">Loading warranty data...</p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Shield className="h-12 w-12 text-muted-foreground/50" />
                            <h3 className="font-semibold">No devices found</h3>
                            <p className="text-sm text-muted-foreground">Try adjusting your search criteria</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((item, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50 transition-colors" data-testid={`row-warranty-${index}`}>
                          <td className="p-3">{item.Make}</td>
                          <td className="p-3">{item.CleanedModelNum}</td>
                          <td className="p-3">{item.Category}</td>
                          <td className="p-3">
                            <Badge
                              variant={
                                item.WarrantyCount >= 50 ? "default" :
                                item.WarrantyCount >= 20 ? "secondary" :
                                "outline"
                              }
                              data-testid={`badge-warranty-count-${index}`}
                            >
                              {item.WarrantyCount}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Button
                              size="sm"
                              onClick={() => handleDrillDown(item.Make, item.CleanedModelNum, item.Category)}
                              data-testid={`button-drill-${index}`}
                            >
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Drill-Down Modal */}
        <Dialog open={drillModalOpen} onOpenChange={setDrillModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="drill-modal-title">{drillModalTitle}</DialogTitle>
          </DialogHeader>

          {drillLoading ? (
            <div className="flex flex-col items-center justify-center p-12 gap-4">
              <RefreshCw className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading device details...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Drill Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-primary" data-testid="drill-total-devices">
                      {drillSummaryMetrics.totalDevices}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Total Devices</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-primary" data-testid="drill-active-warranties">
                      {drillSummaryMetrics.activeWarranties}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Active Warranties</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-primary" data-testid="drill-avg-days">
                      {drillSummaryMetrics.avgDaysPending}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Avg Days Pending</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-primary" data-testid="drill-warranty-types">
                      {drillSummaryMetrics.uniqueWarrantyTypes}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Warranty Types</p>
                  </CardContent>
                </Card>
              </div>

              {/* Drill Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Inventory Dispatch Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <Line
                        data={drillTimelineData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: { stepSize: 1 },
                            },
                          },
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Warranty Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <Bar
                        data={drillWarrantyTypesData}
                        options={{
                          indexAxis: 'y',
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                          },
                          scales: {
                            x: {
                              beginAtZero: true,
                              ticks: { stepSize: 1 },
                            },
                          },
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Drill Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Device Details</CardTitle>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search devices..."
                        value={drillSearchQuery}
                        onChange={(e) => setDrillSearchQuery(e.target.value)}
                        className="pl-10"
                        data-testid="input-drill-search"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-2 text-left font-medium whitespace-nowrap">Serial ID</th>
                          <th className="p-2 text-left font-medium whitespace-nowrap">Area</th>
                          <th className="p-2 text-left font-medium whitespace-nowrap">Grade</th>
                          <th className="p-2 text-left font-medium whitespace-nowrap">Processor</th>
                          <th className="p-2 text-left font-medium whitespace-nowrap">RAM</th>
                          <th className="p-2 text-left font-medium whitespace-nowrap">HDD</th>
                          <th className="p-2 text-left font-medium whitespace-nowrap">Warranty</th>
                          <th className="p-2 text-left font-medium whitespace-nowrap">Start Date</th>
                          <th className="p-2 text-left font-medium whitespace-nowrap">End Date</th>
                          <th className="p-2 text-left font-medium whitespace-nowrap">Status</th>
                          <th className="p-2 text-left font-medium whitespace-nowrap">Days</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDrillData.length === 0 ? (
                          <tr>
                            <td colSpan={11} className="p-8 text-center text-muted-foreground">
                              No devices found
                            </td>
                          </tr>
                        ) : (
                          filteredDrillData.map((item, index) => (
                            <tr key={index} className="border-b hover:bg-muted/50 transition-colors">
                              <td className="p-2 font-mono text-xs">{item.a2c_acinvent_inventserialid || 'N/A'}</td>
                              <td className="p-2">{item.a2c_acinvent_areaid || 'N/A'}</td>
                              <td className="p-2">{item.a2c_acinvent_gradeuae || 'N/A'}</td>
                              <td className="p-2">{`${item.a2c_acinvent_processor_txt || ''} ${item.a2c_acinvent_processorgen_txt || ''}`.trim()}</td>
                              <td className="p-2">{item.a2c_acinvent_currram || 'N/A'} MB</td>
                              <td className="p-2">{item.a2c_acinvent_currhdd || 'N/A'} GB</td>
                              <td className="p-2">{item.warrantydescription || 'N/A'}</td>
                              <td className="p-2 whitespace-nowrap">{item.warrantystartdate ? new Date(item.warrantystartdate).toLocaleDateString() : 'N/A'}</td>
                              <td className="p-2 whitespace-nowrap">{item.warrantyenddate ? new Date(item.warrantyenddate).toLocaleDateString() : 'N/A'}</td>
                              <td className="p-2">
                                <Badge variant={item.warrantystatus === 'Active' ? 'default' : 'secondary'}>
                                  {item.warrantystatus || 'Unknown'}
                                </Badge>
                              </td>
                              <td className="p-2">
                                <Badge
                                  variant={
                                    item.dayspending > 365 ? "destructive" :
                                    item.dayspending > 180 ? "secondary" :
                                    "outline"
                                  }
                                >
                                  {item.dayspending || 0}
                                </Badge>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
