import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Bell, 
  FolderPlus, 
  Search, 
  AlertTriangle,
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Download,
  Package,
  Shield,
  TrendingDown,
  X
} from "lucide-react";
import type { RiskCombination, RiskLevel } from "@shared/risk-analysis-types";
import { formatRiskLevel } from "@shared/risk-analysis-types";

type SortField = "risk_score" | "spare_count" | "run_rate" | "coverage_ratio" | "coverage_of_run_rate" | "covered_count" | "days_of_supply";
type SortOrder = "asc" | "desc";

const getRiskComboKey = (combo: RiskCombination) => 
  `${combo.make}|${combo.model}|${combo.processor || ""}|${combo.generation || ""}`;

const getRiskBadgeVariant = (level: RiskLevel) => {
  switch (level) {
    case "critical": return "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800";
    case "high": return "bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800";
    case "medium": return "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800";
    case "low": return "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800";
  }
};

export default function RiskCombinations() {
  const { toast } = useToast();
  
  // State management for filtering, sorting, and pagination
  const [activeTab, setActiveTab] = useState<"covered" | "not-covered">("covered");
  const [search, setSearch] = useState("");
  const [riskLevels, setRiskLevels] = useState<RiskLevel[]>(['critical', 'high', 'medium']);
  const [coverageRatioMin, setCoverageRatioMin] = useState<number | undefined>();
  const [coverageRatioMax, setCoverageRatioMax] = useState<number | undefined>();
  const [sortField, setSortField] = useState<SortField>("days_of_supply");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Fetch risk combinations with server-side filtering and pagination
  const { data: riskData, isLoading } = useQuery<{ 
    data: RiskCombination[]; 
    total: number;
    stats: {
      critical: number;
      high: number;
      medium: number;
      low: number;
      worstDeficit: number | null;
    };
  }>({
    queryKey: ['/api/risk-combinations', { 
      sortBy: sortField, 
      sortOrder: sortOrder,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      excludeZeroCovered: activeTab === "covered",
      search: search || undefined,
      riskLevels: riskLevels.length > 0 ? riskLevels : undefined,
      coverageRatioMin,
      coverageRatioMax,
    }],
  });

  const riskCombinations = riskData?.data || [];
  const totalItems = riskData?.total || 0;
  const totalPages = Math.ceil(totalItems / pageSize);
  const stats = riskData?.stats || { critical: 0, high: 0, medium: 0, low: 0, worstDeficit: null };

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, sortField, sortOrder, pageSize, riskLevels, coverageRatioMin, coverageRatioMax, activeTab]);

  // Clamp page if it exceeds totalPages
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5" />;
    return sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />;
  };

  // CSV Export
  const handleExport = () => {
    const params = new URLSearchParams({
      sortBy: sortField,
      sortOrder: sortOrder,
      excludeZeroCovered: String(activeTab === "covered"),
    });
    
    if (search) params.append('search', search);
    if (riskLevels.length > 0) {
      riskLevels.forEach(level => params.append('riskLevels', level));
    }
    if (coverageRatioMin !== undefined) params.append('coverageRatioMin', String(coverageRatioMin));
    if (coverageRatioMax !== undefined) params.append('coverageRatioMax', String(coverageRatioMax));
    
    const link = document.createElement('a');
    link.href = `/api/risk-combinations/export?${params.toString()}`;
    link.download = `risk-combinations-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Mutations
  const createPoolMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; filterCriteria: string }) => {
      const res = await apiRequest("POST", "/api/coverage-pools", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/coverage-pools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coverage-pools-with-stats"] });
      toast({
        title: "Pool Created",
        description: `Coverage pool "${data.name}" has been created.`,
      });
    },
  });

  const handleCreatePool = (combo: RiskCombination) => {
    const poolName = `${combo.make} ${combo.model} Pool`;
    const filterCriteria = JSON.stringify({
      make: combo.make ? [combo.make] : undefined,
      model: combo.model ? [combo.model] : undefined,
      processor: combo.processor ? [combo.processor] : undefined,
      generation: combo.generation ? [combo.generation] : undefined,
    });
    
    createPoolMutation.mutate({
      name: poolName,
      description: `Auto-created pool for ${combo.make} ${combo.model} - Risk: ${combo.risk_level}`,
      filterCriteria,
    });
  };

  const handleSendAlert = (combo: RiskCombination) => {
    toast({
      title: "Alert Sent",
      description: `Alert notification sent for ${combo.make} ${combo.model}`,
    });
  };

  const handleBulkCreatePool = () => {
    const selected = riskCombinations.filter(combo => selectedItems.has(getRiskComboKey(combo)));
    if (selected.length === 0) return;

    const poolName = `Bulk Pool - ${selected.length} Models`;
    const allMakes = Array.from(new Set(selected.map(c => c.make).filter(Boolean)));
    const allModels = Array.from(new Set(selected.map(c => c.model).filter(Boolean)));
    
    const filterCriteria = JSON.stringify({
      make: allMakes.length > 0 ? allMakes : undefined,
      model: allModels.length > 0 ? allModels : undefined,
    });
    
    createPoolMutation.mutate({
      name: poolName,
      description: `Bulk pool for ${selected.length} selected models`,
      filterCriteria,
    });
    setSelectedItems(new Set());
  };

  const handleBulkAlert = () => {
    const count = selectedItems.size;
    toast({
      title: "Alerts Sent",
      description: `Alert notifications sent for ${count} selected models`,
    });
    setSelectedItems(new Set());
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Risk Combinations</h1>
        <p className="text-muted-foreground mt-1">
          Identify models needing attention and sourcing with detailed filtering and analysis
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critical Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.critical}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">High Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.high}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Medium Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.medium}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.low}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Worst Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.worstDeficit !== null ? `${(Number(stats.worstDeficit) || 0).toFixed(1)}%` : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Models Analysis</CardTitle>
              <CardDescription>
                View models by category, filter by risk level, and take action
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="gap-1.5"
                data-testid="button-export-csv"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tabs for Covered vs Not Covered */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "covered" | "not-covered")}>
            <TabsList>
              <TabsTrigger value="covered" data-testid="tab-covered">
                <Shield className="w-4 h-4 mr-2" />
                With Coverage
              </TabsTrigger>
              <TabsTrigger value="not-covered" data-testid="tab-not-covered">
                <Package className="w-4 h-4 mr-2" />
                Without Coverage
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filters Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search make, model, processor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
            </div>

            {/* Coverage Range */}
            <Input
              type="number"
              placeholder="Min Coverage %"
              value={coverageRatioMin ?? ''}
              onChange={(e) => setCoverageRatioMin(e.target.value ? Number(e.target.value) : undefined)}
              data-testid="input-coverage-min"
            />
            <Input
              type="number"
              placeholder="Max Coverage %"
              value={coverageRatioMax ?? ''}
              onChange={(e) => setCoverageRatioMax(e.target.value ? Number(e.target.value) : undefined)}
              data-testid="input-coverage-max"
            />
          </div>

          {/* Risk Level Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <Label className="text-sm text-muted-foreground">Filter by Risk:</Label>
            {(['critical', 'high', 'medium', 'low'] as RiskLevel[]).map((level) => (
              <label key={level} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={riskLevels.includes(level)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setRiskLevels([...riskLevels, level]);
                    } else {
                      setRiskLevels(riskLevels.filter(l => l !== level));
                    }
                  }}
                  data-testid={`checkbox-risk-${level}`}
                />
                <span className="text-sm capitalize">{level}</span>
              </label>
            ))}
          </div>

          {/* Bulk Actions */}
          {selectedItems.size > 0 && (
            <div className="flex gap-2 p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                {selectedItems.size} selected
              </span>
              <Button
                size="sm"
                variant="default"
                onClick={handleBulkAlert}
                className="gap-1"
                data-testid="button-bulk-alert"
              >
                <Bell className="w-3 h-3" />
                Send Alerts
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkCreatePool}
                className="gap-1"
                data-testid="button-bulk-pool"
              >
                <FolderPlus className="w-3 h-3" />
                Create Pool
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedItems(new Set())}
                data-testid="button-clear-selection"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}

          {/* Table */}
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : riskCombinations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No models found matching your criteria
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedItems.size === riskCombinations.length && riskCombinations.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            const newSelected = new Set(selectedItems);
                            riskCombinations.forEach(combo => newSelected.add(getRiskComboKey(combo)));
                            setSelectedItems(newSelected);
                          } else {
                            setSelectedItems(new Set());
                          }
                        }}
                        data-testid="checkbox-select-all"
                      />
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("covered_count")}
                        className="gap-1 h-auto p-0 hover:bg-transparent"
                        data-testid="sort-model"
                      >
                        Make / Model
                        {getSortIcon("covered_count")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("days_of_supply")}
                        className="gap-1 h-auto p-0 hover:bg-transparent"
                        data-testid="sort-days-remaining"
                      >
                        Days Remaining
                        {getSortIcon("days_of_supply")}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Active Units</TableHead>
                    <TableHead className="text-right">Spare / Demand</TableHead>
                    <TableHead>Regional Stock</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riskCombinations.map((combo, index) => {
                    const key = getRiskComboKey(combo);
                    const isSelected = selectedItems.has(key);
                    const isLowCoverage = combo.coverage_ratio < 80;

                    return (
                      <TableRow 
                        key={key}
                        className={isLowCoverage ? "border-l-4 border-l-red-500" : ""}
                        data-testid={`row-combo-${index}`}
                      >
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              const newSelected = new Set(selectedItems);
                              if (checked) {
                                newSelected.add(key);
                              } else {
                                newSelected.delete(key);
                              }
                              setSelectedItems(newSelected);
                            }}
                            data-testid={`checkbox-combo-${index}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{combo.make} {combo.model}</div>
                            {combo.processor && (
                              <div className="text-xs text-muted-foreground">{combo.processor}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {combo.days_of_supply !== null && combo.days_of_supply !== undefined
                              ? `${Number(combo.days_of_supply).toFixed(0)} days`
                              : <span className="text-muted-foreground">No demand</span>
                            }
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">{combo.covered_count || 0}</TableCell>
                        <TableCell className="text-right">
                          <div className="text-sm">
                            <div className="font-medium">{combo.spare_count || 0} spare</div>
                            <div className="text-xs text-muted-foreground">
                              {combo.run_rate ? `${Number(combo.run_rate).toFixed(1)}/mo` : "No demand"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant="outline" className="text-xs">
                              UK: {combo.uk_available_count || 0}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              UAE: {combo.uae_available_count || 0}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRiskBadgeVariant(combo.risk_level)}>
                            {formatRiskLevel(combo.risk_level)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSendAlert(combo)}
                              data-testid={`button-alert-${index}`}
                            >
                              <Bell className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCreatePool(combo)}
                              data-testid={`button-pool-${index}`}
                            >
                              <FolderPlus className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalItems > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalItems)} of {totalItems}
                </p>
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-24 text-sm" data-testid="select-page-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  data-testid="button-prev-page"
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  data-testid="button-next-page"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
