import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Bell, FolderPlus, Search, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { RiskCombination, RiskLevel } from "@shared/risk-analysis-types";
import { formatRiskLevel } from "@shared/risk-analysis-types";

type SortField = "risk_score" | "spare_count" | "run_rate" | "coverage_ratio" | "coverage_of_run_rate" | "covered_count";
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
  
  // State management
  const [search, setSearch] = useState("");
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>("all");
  const [excludeZeroCovered, setExcludeZeroCovered] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("risk_score");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Fetch all risk combinations
  const { data: allRiskCombinations, isLoading } = useQuery<RiskCombination[]>({
    queryKey: ['/api/risk-combinations', { 
      sortBy: sortField, 
      sortOrder: sortOrder,
      limit: 1000,
      offset: 0,
      excludeZeroCovered: excludeZeroCovered,
    }],
  });

  // Filter and sort combinations
  const filteredCombinations = useMemo(() => {
    if (!allRiskCombinations) return [];
    
    return allRiskCombinations.filter((combo) => {
      const searchLower = search.toLowerCase();
      const matchesSearch = !search || 
        combo.make?.toLowerCase().includes(searchLower) ||
        combo.model?.toLowerCase().includes(searchLower) ||
        combo.processor?.toLowerCase().includes(searchLower);
      
      const matchesRiskLevel = !riskLevelFilter || 
        riskLevelFilter === "all" ||
        combo.risk_level === riskLevelFilter;
      
      return matchesSearch && matchesRiskLevel;
    });
  }, [allRiskCombinations, search, riskLevelFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredCombinations.length / itemsPerPage);
  const paginatedCombinations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCombinations.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCombinations, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change and current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Mutations for creating pools and sending alerts
  const createPoolMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; filterCriteria: string }) => {
      const res = await apiRequest("POST", "/api/coverage-pools", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/coverage-pools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coverage-pools-with-stats"] });
      toast({
        title: "Pool Created Successfully",
        description: `Coverage pool "${data.name}" has been created.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Pool Creation Failed",
        description: error.message || "Failed to create coverage pool. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendAlertMutation = useMutation({
    mutationFn: async (combinations: RiskCombination[]) => {
      const res = await apiRequest("POST", "/api/risk-combinations/send-alert", { combinations });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Alert Sent Successfully",
        description: data.message || "High-risk alert sent to configured webhook.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Alert Failed",
        description: error.message || "Failed to send alert. Please check your webhook configuration.",
        variant: "destructive",
      });
    },
  });

  // Action handlers
  const handleCreatePool = (combo: RiskCombination) => {
    const poolName = `${combo.make} ${combo.model}${combo.processor ? ` (${combo.processor})` : ''}`;
    const filterCriteria = JSON.stringify({
      make: combo.make,
      model: combo.model,
      processor: combo.processor ? [combo.processor] : undefined,
      generation: combo.generation ? [combo.generation] : undefined,
    });
    
    createPoolMutation.mutate({
      name: poolName,
      description: `Automatically created pool for ${combo.make} ${combo.model} - Risk Level: ${combo.risk_level}`,
      filterCriteria,
    });
  };

  const handleSendAlert = (combo: RiskCombination) => {
    sendAlertMutation.mutate([combo]);
  };

  const handleCreateCombinedPool = () => {
    if (selectedItems.size === 0) return;
    
    const selectedCombinations = filteredCombinations.filter(combo => 
      selectedItems.has(getRiskComboKey(combo))
    );
    
    if (selectedCombinations.length === 0) return;
    
    const makes = Array.from(new Set(selectedCombinations.map(c => c.make)));
    const models = Array.from(new Set(selectedCombinations.map(c => c.model)));
    const processors = Array.from(new Set(selectedCombinations.map(c => c.processor).filter(Boolean)));
    const generations = Array.from(new Set(selectedCombinations.map(c => c.generation).filter(Boolean)));
    
    const poolName = `Combined Risk Pool (${selectedCombinations.length} combinations)`;
    const filterCriteria = JSON.stringify({
      make: makes.length > 0 ? makes : undefined,
      model: models.length > 0 ? models : undefined,
      processor: processors.length > 0 ? processors : undefined,
      generation: generations.length > 0 ? generations : undefined,
    });
    
    createPoolMutation.mutate(
      {
        name: poolName,
        description: `Combined pool covering ${makes.join(", ")} with ${selectedCombinations.length} risk combinations`,
        filterCriteria,
      },
      {
        onSuccess: () => {
          setSelectedItems(new Set());
        },
      }
    );
  };

  const handleSendCombinedAlert = () => {
    if (selectedItems.size === 0) return;
    
    const selectedCombinations = filteredCombinations.filter(combo => 
      selectedItems.has(getRiskComboKey(combo))
    );
    
    if (selectedCombinations.length === 0) return;
    
    sendAlertMutation.mutate(selectedCombinations, {
      onSuccess: () => {
        setSelectedItems(new Set());
      },
    });
  };

  // Selection handlers
  const handleSelectAll = () => {
    const newSelection = new Set(selectedItems);
    paginatedCombinations.forEach(combo => {
      newSelection.add(getRiskComboKey(combo));
    });
    setSelectedItems(newSelection);
  };

  const handleDeselectAll = () => {
    const newSelection = new Set(selectedItems);
    paginatedCombinations.forEach(combo => {
      newSelection.delete(getRiskComboKey(combo));
    });
    setSelectedItems(newSelection);
  };

  const handleToggleItem = (combo: RiskCombination) => {
    const key = getRiskComboKey(combo);
    const newSelection = new Set(selectedItems);
    if (newSelection.has(key)) {
      newSelection.delete(key);
    } else {
      newSelection.add(key);
    }
    setSelectedItems(newSelection);
  };

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1" />;
    return sortOrder === "asc" ? <ArrowUp className="w-4 h-4 ml-1" /> : <ArrowDown className="w-4 h-4 ml-1" />;
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Risk Combinations</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive analysis of high-risk warranty combinations requiring attention
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="rounded-2xl border hover-elevate transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Combinations</CardTitle>
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-tight">{filteredCombinations.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {allRiskCombinations?.length || 0} total combinations
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border hover-elevate transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Risk</CardTitle>
            <div className="w-3 h-3 rounded-full bg-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-tight">
              {filteredCombinations.filter(c => c.risk_level === "Critical").length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Require immediate attention</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border hover-elevate transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <div className="w-3 h-3 rounded-full bg-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-tight">
              {filteredCombinations.filter(c => c.risk_level === "High").length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Need pool allocation</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border hover-elevate transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected</CardTitle>
            <Checkbox checked={selectedItems.size > 0} className="pointer-events-none" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-tight">{selectedItems.size || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Items ready for bulk action</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="rounded-2xl border">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search make, model, processor..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9"
                  data-testid="input-search-risk"
                />
              </div>

              <Select value={riskLevelFilter} onValueChange={(value) => {
                setRiskLevelFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger data-testid="select-risk-level">
                  <SelectValue placeholder="All Risk Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <Switch
                  id="exclude-zero"
                  checked={excludeZeroCovered}
                  onCheckedChange={setExcludeZeroCovered}
                  data-testid="switch-exclude-zero"
                />
                <Label htmlFor="exclude-zero" className="text-sm cursor-pointer">
                  Exclude 0-covered
                </Label>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedItems.size > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendCombinedAlert}
                    disabled={sendAlertMutation.isPending}
                    className="gap-2"
                    data-testid="button-send-combined-alert"
                  >
                    <Bell className="w-4 h-4" />
                    Send Alert ({selectedItems.size})
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleCreateCombinedPool}
                    disabled={createPoolMutation.isPending}
                    className="gap-2"
                    data-testid="button-create-combined-pool"
                  >
                    <FolderPlus className="w-4 h-4" />
                    Create Pool ({selectedItems.size})
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Selection Controls */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                data-testid="button-select-all"
              >
                Select All on Page
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeselectAll}
                data-testid="button-deselect-all"
              >
                Deselect All on Page
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {paginatedCombinations.length} of {filteredCombinations.length} combinations
            </div>
          </div>

          {/* Data Table */}
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading risk combinations...</div>
          ) : filteredCombinations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No risk combinations found</div>
          ) : (
            <>
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={paginatedCombinations.length > 0 && paginatedCombinations.every(c => selectedItems.has(getRiskComboKey(c)))}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleSelectAll();
                            } else {
                              handleDeselectAll();
                            }
                          }}
                          data-testid="checkbox-select-all-header"
                        />
                      </TableHead>
                      <TableHead>Make / Model</TableHead>
                      <TableHead>Processor</TableHead>
                      <TableHead className="text-center">
                        <div>Available Stock</div>
                        <div className="text-xs font-normal text-muted-foreground">UK / UAE</div>
                      </TableHead>
                      <TableHead className="cursor-pointer text-right" onClick={() => handleSort("covered_count")}>
                        <div className="flex items-center justify-end">
                          Covered {getSortIcon("covered_count")}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer text-right" onClick={() => handleSort("spare_count")}>
                        <div className="flex items-center justify-end">
                          Spares {getSortIcon("spare_count")}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer text-right" onClick={() => handleSort("run_rate")}>
                        <div className="flex items-center justify-end">
                          Run Rate {getSortIcon("run_rate")}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer text-right" onClick={() => handleSort("coverage_ratio")}>
                        <div className="flex items-center justify-end">
                          Warranty Cov % {getSortIcon("coverage_ratio")}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer text-right" onClick={() => handleSort("coverage_of_run_rate")}>
                        <div className="flex items-center justify-end">
                          Spare Cov % {getSortIcon("coverage_of_run_rate")}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("risk_score")}>
                        <div className="flex items-center">
                          Risk {getSortIcon("risk_score")}
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCombinations.map((combo, index) => {
                      const key = getRiskComboKey(combo);
                      const isSelected = selectedItems.has(key);
                      const warrantyRatio = Number(combo.coverage_ratio || 0).toFixed(1);
                      const spareRatio = Number(combo.coverage_of_run_rate || 0).toFixed(1);
                      
                      return (
                        <TableRow 
                          key={key}
                          className={isSelected ? "bg-muted/50" : ""}
                          data-testid={`row-risk-${index}`}
                        >
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleItem(combo)}
                              data-testid={`checkbox-risk-${index}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{combo.make}</div>
                            <div className="text-sm text-muted-foreground">{combo.model}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{combo.processor || "—"}</div>
                            {combo.generation && (
                              <div className="text-xs text-muted-foreground">{combo.generation}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="text-center">
                                <div className="font-mono text-sm font-medium text-green-600 dark:text-green-400">
                                  {Number(combo.uk_available_count || 0)}
                                </div>
                                <div className="text-xs text-muted-foreground">UK</div>
                              </div>
                              <div className="text-muted-foreground">/</div>
                              <div className="text-center">
                                <div className="font-mono text-sm font-medium text-amber-600 dark:text-amber-400">
                                  {Number(combo.uae_available_count || 0)}
                                </div>
                                <div className="text-xs text-muted-foreground">UAE</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-mono text-sm">{Number(combo.covered_count || 0)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-mono text-sm font-medium">{Number(combo.spare_count || 0)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-mono text-sm">{Number(combo.run_rate || 0).toFixed(1)}</span>
                            <div className="text-xs text-muted-foreground">/ month</div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`font-mono text-sm font-medium ${
                              parseFloat(warrantyRatio) >= 100 ? 'text-green-600 dark:text-green-400' :
                              parseFloat(warrantyRatio) >= 50 ? 'text-amber-600 dark:text-amber-400' :
                              'text-red-600 dark:text-red-400'
                            }`}>
                              {warrantyRatio}%
                            </span>
                            <div className="text-xs text-muted-foreground">spare/covered</div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`font-mono text-sm font-medium ${
                              parseFloat(spareRatio) >= 100 ? 'text-green-600 dark:text-green-400' :
                              parseFloat(spareRatio) >= 50 ? 'text-amber-600 dark:text-amber-400' :
                              'text-red-600 dark:text-red-400'
                            }`}>
                              {spareRatio}%
                            </span>
                            <div className="text-xs text-muted-foreground">spare/runrate</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getRiskBadgeVariant(combo.risk_level)} font-semibold`}>
                              {formatRiskLevel(combo.risk_level)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {!isSelected && (
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleSendAlert(combo)}
                                  disabled={sendAlertMutation.isPending}
                                  data-testid={`button-send-alert-${index}`}
                                >
                                  <Bell className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCreatePool(combo)}
                                  disabled={createPoolMutation.isPending}
                                  data-testid={`button-create-pool-${index}`}
                                >
                                  <FolderPlus className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      data-testid="button-prev-page"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      data-testid="button-next-page"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
