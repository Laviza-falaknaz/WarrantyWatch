import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Bell, Plus, ArrowUpDown, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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
  const limit = 20;
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(0);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: combinations, isLoading } = useQuery<RiskCombination[]>({
    queryKey: ['/api/risk-combinations', { sortBy, sortOrder, limit, offset: page * limit, search: debouncedSearch }],
  });

  const sendAlertMutation = useMutation({
    mutationFn: async (combination: RiskCombination) => {
      return apiRequest('POST', '/api/risk-combinations/send-alert', combination);
    },
    onSuccess: () => {
      toast({
        title: "Alert sent",
        description: "Risk combination alert sent to Power Automate successfully",
      });
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
    mutationFn: async (combination: RiskCombination) => {
      const poolData = {
        name: `${combination.make} ${combination.model} Pool`,
        filterCriteria: JSON.stringify({
          make: combination.make,
          model: combination.model,
          processor: combination.processor || undefined,
          generation: combination.generation || undefined,
        }),
      };
      return apiRequest('POST', '/api/coverage-pools', poolData);
    },
    onSuccess: () => {
      toast({
        title: "Pool created",
        description: "Coverage pool created successfully from risk combination",
      });
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
    sendAlertMutation.mutate(combination);
  };

  const handleCreatePool = async (combination: RiskCombination) => {
    createPoolMutation.mutate(combination);
  };

  if (isLoading) {
    return (
      <Card data-testid="card-risk-analysis">
        <CardHeader>
          <CardTitle>High-Risk Combinations</CardTitle>
          <CardDescription>Equipment with high claim rates and low coverage (last 6 months)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

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
        <div className="mb-4 flex items-center gap-2">
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
        </div>
        <div className="rounded-md border overflow-x-auto -mx-6 px-6">
          <Table>
            <TableHeader>
              <TableRow>
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
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No high-risk combinations found
                  </TableCell>
                </TableRow>
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
