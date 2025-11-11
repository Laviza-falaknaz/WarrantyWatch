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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertTriangle, Bell, Plus, ArrowUpDown, Search, Filter, X } from "lucide-react";
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
  uk_available_count: number;
  uae_available_count: number;
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
      return 'bg-destructive/20 text-destructive-foreground border-destructive/30 dark:bg-destructive/30 dark:text-destructive-foreground dark:border-destructive/40 font-semibold rounded-full';
    case 'high': 
      return 'bg-primary/30 text-primary-foreground border-primary/40 dark:bg-primary/40 dark:text-primary-foreground dark:border-primary/50 font-semibold rounded-full';
    case 'medium': 
      return 'bg-secondary/30 text-secondary-foreground border-secondary/40 dark:bg-secondary/40 dark:text-secondary-foreground dark:border-secondary/50 font-medium rounded-full';
    case 'low': 
      return 'bg-accent/30 text-accent-foreground border-accent/40 dark:bg-accent/40 dark:text-accent-foreground dark:border-accent/50 rounded-full';
    default: 
      return 'bg-muted text-muted-foreground border-border rounded-full';
  }
};

export default function RiskAnalysisTable() {
  const [sortBy, setSortBy] = useState<'riskScore' | 'riskLevel' | 'runRate' | 'coverageRatio' | 'coveredCount' | 'coverageOfRunRate'>('riskScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [excludeZeroCovered, setExcludeZeroCovered] = useState(true);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  
  // Advanced filter state
  const [selectedRiskLevels, setSelectedRiskLevels] = useState<RiskLevel[]>([]);
  const [runRateMin, setRunRateMin] = useState<string>('');
  const [runRateMax, setRunRateMax] = useState<string>('');
  const [coverageRatioMin, setCoverageRatioMin] = useState<string>('');
  const [coverageRatioMax, setCoverageRatioMax] = useState<string>('');
  const [spareRateMin, setSpareRateMin] = useState<string>('');
  const [spareRateMax, setSpareRateMax] = useState<string>('');
  const [coveredCountMin, setCoveredCountMin] = useState<string>('');
  const [coveredCountMax, setCoveredCountMax] = useState<string>('');
  
  const limit = 20;
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(0);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset page and clear selections when filters change
  useEffect(() => {
    setPage(0);
    setSelectedRows(new Set());
  }, [
    excludeZeroCovered,
    selectedRiskLevels,
    runRateMin,
    runRateMax,
    coverageRatioMin,
    coverageRatioMax,
    spareRateMin,
    spareRateMax,
    coveredCountMin,
    coveredCountMax
  ]);

  const { data: allCombinations, isLoading } = useQuery<RiskCombination[]>({
    queryKey: ['/api/risk-combinations', { 
      sortBy, 
      sortOrder, 
      limit, 
      offset: page * limit, 
      search: debouncedSearch,
      excludeZeroCovered,
      riskLevels: selectedRiskLevels,
      runRateMin,
      runRateMax,
      coverageRatioMin,
      coverageRatioMax,
      spareRateMin,
      spareRateMax,
      coveredCountMin,
      coveredCountMax
    }],
  });

  const combinations = allCombinations;

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
            make: [combo.make],
            model: [combo.model],
            processor: combo.processor ? [combo.processor] : undefined,
            generation: combo.generation ? [combo.generation] : undefined,
          }),
        };
        return apiRequest('POST', '/api/coverage-pools', poolData);
      } else {
        // Extract unique values for each filter field from all combinations
        const makes = Array.from(new Set(data.combinations.map(c => c.make)));
        const models = Array.from(new Set(data.combinations.map(c => c.model)));
        const processors = Array.from(new Set(data.combinations.map(c => c.processor).filter(Boolean))) as string[];
        const generations = Array.from(new Set(data.combinations.map(c => c.generation).filter(Boolean))) as string[];
        
        const poolData = {
          name: data.name || `Combined Risk Pool (${data.combinations.length} items)`,
          filterCriteria: JSON.stringify({
            make: makes.length > 0 ? makes : undefined,
            model: models.length > 0 ? models : undefined,
            processor: processors.length > 0 ? processors : undefined,
            generation: generations.length > 0 ? generations : undefined,
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

  const toggleRiskLevel = (level: RiskLevel) => {
    setSelectedRiskLevels(prev => 
      prev.includes(level) 
        ? prev.filter(l => l !== level)
        : [...prev, level]
    );
  };

  const clearAllFilters = () => {
    setSelectedRiskLevels([]);
    setRunRateMin('');
    setRunRateMax('');
    setCoverageRatioMin('');
    setCoverageRatioMax('');
    setSpareRateMin('');
    setSpareRateMax('');
    setCoveredCountMin('');
    setCoveredCountMax('');
  };

  const hasActiveFilters = 
    selectedRiskLevels.length > 0 ||
    runRateMin !== '' ||
    runRateMax !== '' ||
    coverageRatioMin !== '' ||
    coverageRatioMax !== '' ||
    spareRateMin !== '' ||
    spareRateMax !== '' ||
    coveredCountMin !== '' ||
    coveredCountMax !== '';

  const hasSelection = selectedRows.size > 0;

  return (
    <Card className="rounded-2xl border border-border" data-testid="card-risk-analysis">
      <CardHeader className="pb-4 border-b border-border">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Units Running Out
        </CardTitle>
        <CardDescription className="text-sm">
          Equipment with high claim rates and low spare coverage (last 6 months)
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-4">
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
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  data-testid="button-open-filters"
                  className={hasActiveFilters ? "border-primary" : ""}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1">
                      {[
                        selectedRiskLevels.length,
                        runRateMin || runRateMax ? 1 : 0,
                        coverageRatioMin || coverageRatioMax ? 1 : 0,
                        spareRateMin || spareRateMax ? 1 : 0,
                        coveredCountMin || coveredCountMax ? 1 : 0,
                      ].reduce((sum, val) => sum + val, 0)}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end" data-testid="popover-filters">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Advanced Filters</h4>
                    {hasActiveFilters && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={clearAllFilters}
                        data-testid="button-clear-filters"
                        className="h-7 px-2"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Clear all
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium mb-2 block">Risk Levels</Label>
                      <div className="flex flex-wrap gap-1">
                        {(['critical', 'high', 'medium', 'low'] as RiskLevel[]).map(level => (
                          <Badge
                            key={level}
                            variant={selectedRiskLevels.includes(level) ? "default" : "outline"}
                            className={`cursor-pointer ${selectedRiskLevels.includes(level) ? riskBadgeClass(level) : ''}`}
                            onClick={() => toggleRiskLevel(level)}
                            data-testid={`badge-filter-risk-${level}`}
                          >
                            {level.toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-medium mb-1 block">Run Rate (claims/month)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={runRateMin}
                          onChange={(e) => setRunRateMin(e.target.value)}
                          className="h-8"
                          data-testid="input-filter-runrate-min"
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={runRateMax}
                          onChange={(e) => setRunRateMax(e.target.value)}
                          className="h-8"
                          data-testid="input-filter-runrate-max"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-medium mb-1 block">Coverage Ratio (%)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={coverageRatioMin}
                          onChange={(e) => setCoverageRatioMin(e.target.value)}
                          className="h-8"
                          data-testid="input-filter-coverage-min"
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={coverageRatioMax}
                          onChange={(e) => setCoverageRatioMax(e.target.value)}
                          className="h-8"
                          data-testid="input-filter-coverage-max"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-medium mb-1 block">Spare/Rate (%)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={spareRateMin}
                          onChange={(e) => setSpareRateMin(e.target.value)}
                          className="h-8"
                          data-testid="input-filter-sparerate-min"
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={spareRateMax}
                          onChange={(e) => setSpareRateMax(e.target.value)}
                          className="h-8"
                          data-testid="input-filter-sparerate-max"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-medium mb-1 block">Covered Count</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={coveredCountMin}
                          onChange={(e) => setCoveredCountMin(e.target.value)}
                          className="h-8"
                          data-testid="input-filter-covered-min"
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={coveredCountMax}
                          onChange={(e) => setCoveredCountMax(e.target.value)}
                          className="h-8"
                          data-testid="input-filter-covered-max"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
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
                      <div className="text-sm font-medium">{combo.available_stock_count} total</div>
                      <div className="text-xs text-muted-foreground">
                        {combo.uk_available_count} UK · {combo.uae_available_count} UAE
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
                    No units running out found
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
