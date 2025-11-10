import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Bell, Plus, ArrowUpDown, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

interface RiskCombination {
  make: string;
  model: string;
  processor: string | null;
  generation: string | null;
  covered_count: number;
  spare_count: number;
  available_stock_count: number;
  claims_last_6_months: number;
  replacements_last_6_months: number;
  coverage_ratio: number;
  run_rate: number;
  fulfillment_rate: number;
  coverage_of_run_rate: number;
  risk_level: RiskLevel;
  risk_score: number;
}

const riskBadgeClass = (level: RiskLevel) => {
  switch (level) {
    case 'critical': 
      return 'bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100 border-red-200 dark:border-red-800 font-semibold';
    case 'high': 
      return 'bg-orange-50 text-orange-900 dark:bg-orange-950 dark:text-orange-100 border-orange-200 dark:border-orange-800 font-semibold';
    case 'medium': 
      return 'bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100 border-amber-200 dark:border-amber-800 font-semibold';
    case 'low': 
      return 'bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700';
    default: 
      return 'bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100';
  }
};

export default function RiskAnalysisTable() {
  const [sortBy, setSortBy] = useState<'riskScore' | 'riskLevel' | 'runRate' | 'coverageRatio' | 'coveredCount' | 'coverageOfRunRate'>('riskScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [excludeZeroCovered, setExcludeZeroCovered] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const limit = 20;
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(0);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: allCombinations, isLoading } = useQuery<RiskCombination[]>({
    queryKey: ['/api/risk-combinations', { sortBy, sortOrder, limit, offset: page * limit, search: debouncedSearch }],
  });

  const combinations = useMemo(() => {
    if (!allCombinations) return allCombinations;
    if (!excludeZeroCovered) return allCombinations;
    return allCombinations.filter(combo => combo.covered_count > 0);
  }, [allCombinations, excludeZeroCovered]);

  const sendAlertMutation = useMutation({
    mutationFn: async (combinationsArray: RiskCombination[]) => {
      return apiRequest('POST', '/api/risk-combinations/send-alert', { combinations: combinationsArray });
    },
    onSuccess: () => {
      toast({
        title: "Alert sent",
        description: `Alert sent to Power Automate successfully`,
      });
      setSelectedRows(new Set());
    },
    onError: (error: Error) => {
      toast({
        title: "Alert failed",
        description: error.message || "Failed to send alert to webhook",
        variant: "destructive",
      });
    },
  });

  const createPoolMutation = useMutation({
    mutationFn: async (data: { name: string; combinations: RiskCombination[] }) => {
      if (data.combinations.length === 1) {
        const combo = data.combinations[0];
        const poolData = {
          name: `${combo.make} ${combo.model} Pool`,
          filterCriteria: JSON.stringify({
            make: combo.make,
            model: combo.model,
            processor: combo.processor || undefined,
            generation: combo.generation || undefined,
          }),
        };
        return apiRequest('POST', '/api/coverage-pools', poolData);
      } else {
        const poolData = {
          name: data.name || `Combined Risk Pool (${data.combinations.length} items)`,
          filterCriteria: JSON.stringify({
            combinations: data.combinations.map(c => ({
              make: c.make,
              model: c.model,
              processor: c.processor || undefined,
              generation: c.generation || undefined,
            })),
          }),
        };
        return apiRequest('POST', '/api/coverage-pools', poolData);
      }
    },
    onSuccess: () => {
      toast({
        title: "Pool created",
        description: "Coverage pool created successfully",
      });
      setSelectedRows(new Set());
      queryClient.invalidateQueries({ queryKey: ['/api/coverage-pools'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Pool creation failed",
        description: error.message || "Failed to create coverage pool",
        variant: "destructive",
      });
    },
  });

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleSendAlert = async (combination: RiskCombination) => {
    sendAlertMutation.mutate([combination]);
  };

  const handleCreatePool = async (combination: RiskCombination) => {
    createPoolMutation.mutate({ name: '', combinations: [combination] });
  };

  const handleBulkSendAlert = () => {
    if (!combinations || selectedRows.size === 0) return;
    const selectedCombinations = Array.from(selectedRows).map(idx => combinations[idx]);
    sendAlertMutation.mutate(selectedCombinations);
  };

  const handleBulkCreatePool = () => {
    if (!combinations || selectedRows.size === 0) return;
    const selectedCombinations = Array.from(selectedRows).map(idx => combinations[idx]);
    createPoolMutation.mutate({ 
      name: `Combined Risk Pool (${selectedCombinations.length} items)`,
      combinations: selectedCombinations 
    });
  };

  const toggleRowSelection = (idx: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(idx)) {
      newSelected.delete(idx);
    } else {
      newSelected.add(idx);
    }
    setSelectedRows(newSelected);
  };

  const toggleSelectAll = () => {
    if (!combinations) return;
    if (selectedRows.size === combinations.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(combinations.map((_, idx) => idx)));
    }
  };

  const hasSelection = selectedRows.size > 0;

  return (
    <Card data-testid="card-risk-analysis">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          High-Risk Combinations
        </CardTitle>
        <CardDescription>
          Equipment with high claim rates and low spare coverage (last 6 months)
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by make, model, processor, or generation..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-8"
                data-testid="input-search-risk"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="exclude-zero"
                checked={excludeZeroCovered}
                onCheckedChange={setExcludeZeroCovered}
                data-testid="switch-exclude-zero"
              />
              <Label htmlFor="exclude-zero" className="text-sm whitespace-nowrap">
                Exclude 0 covered
              </Label>
            </div>
          </div>
          {hasSelection && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <span className="text-sm font-medium">
                {selectedRows.size} item{selectedRows.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkSendAlert}
                disabled={sendAlertMutation.isPending}
                data-testid="button-bulk-alert"
              >
                <Bell className="h-3 w-3 mr-1" />
                Send Combined Alert
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkCreatePool}
                disabled={createPoolMutation.isPending}
                data-testid="button-bulk-pool"
              >
                <Plus className="h-3 w-3 mr-1" />
                Create Combined Pool
              </Button>
            </div>
          )}
        </div>
        <div className="rounded-md border overflow-x-auto -mx-6 px-6 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10" data-testid="table-loading-overlay">
              <div className="text-sm text-muted-foreground">Loading...</div>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={combinations && combinations.length > 0 && selectedRows.size === combinations.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                    data-testid="checkbox-select-all"
                  />
                </TableHead>
                <TableHead>Equipment</TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('coveredCount')} className="h-8 px-2">
                    Covered <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('coverageRatio')} className="h-8 px-2">
                    Coverage <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Available</TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('runRate')} className="h-8 px-2">
                    Run Rate <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('coverageOfRunRate')} className="h-8 px-2">
                    Spare/Rate <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('riskLevel')} className="h-8 px-2">
                    Risk <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {combinations && combinations.length > 0 ? (
                combinations.map((combo, idx) => (
                  <TableRow key={idx} data-testid={`risk-row-${idx}`}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.has(idx)}
                        onCheckedChange={() => toggleRowSelection(idx)}
                        aria-label={`Select ${combo.make} ${combo.model}`}
                        data-testid={`checkbox-row-${idx}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{combo.make} {combo.model}</div>
                      <div className="text-xs text-muted-foreground">
                        {[combo.processor, combo.generation].filter(Boolean).join(' • ')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{combo.covered_count}</div>
                      <div className="text-xs text-muted-foreground">
                        {combo.spare_count} spare
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`text-sm font-medium ${combo.coverage_ratio < 50 ? 'text-destructive' : combo.coverage_ratio < 75 ? 'text-orange-600' : ''}`}>
                        {combo.coverage_ratio}%
                      </div>
                    </TableCell>
                    <TableCell data-testid={`cell-available-${idx}`}>
                      <div className="text-sm font-medium">{combo.available_stock_count}</div>
                      <div className="text-xs text-muted-foreground">
                        all stock
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{combo.run_rate}/mo</div>
                      <div className="text-xs text-muted-foreground">
                        {combo.claims_last_6_months} claims
                      </div>
                    </TableCell>
                    <TableCell data-testid={`cell-coverage-runrate-${idx}`}>
                      <div className={`text-sm font-medium ${combo.coverage_of_run_rate < 5 ? 'text-destructive' : combo.coverage_of_run_rate < 50 ? 'text-orange-600' : ''}`}>
                        {combo.coverage_of_run_rate}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={riskBadgeClass(combo.risk_level)}>
                        {combo.risk_level.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {!hasSelection ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendAlert(combo)}
                            data-testid={`button-send-alert-${idx}`}
                          >
                            <Bell className="h-3 w-3 mr-1" />
                            Alert
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCreatePool(combo)}
                            data-testid={`button-create-pool-${idx}`}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Pool
                          </Button>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          {selectedRows.has(idx) ? 'Selected' : ''}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : !isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No high-risk combinations found
                  </TableCell>
                </TableRow>
              ) : (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={9}>
                      <Skeleton className="h-12 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {combinations && combinations.length >= limit && (
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              data-testid="button-prev-page"
            >
              Previous
            </Button>
            <div className="text-sm text-muted-foreground">
              Page {page + 1}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={combinations.length < limit}
              data-testid="button-next-page"
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
