import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Bell, Plus, ArrowUpDown } from "lucide-react";
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
  risk_level: RiskLevel;
  risk_score: number;
}

const riskBadgeVariant = (level: RiskLevel) => {
  switch (level) {
    case 'critical': return 'destructive';
    case 'high': return 'default';
    case 'medium': return 'secondary';
    case 'low': return 'outline';
    default: return 'outline';
  }
};

const riskColor = (level: RiskLevel) => {
  switch (level) {
    case 'critical': return 'text-red-600';
    case 'high': return 'text-orange-600';
    case 'medium': return 'text-yellow-600';
    case 'low': return 'text-green-600';
    default: return '';
  }
};

export default function RiskAnalysisTable() {
  const [sortBy, setSortBy] = useState<'riskScore' | 'runRate' | 'coverageRatio' | 'coveredCount'>('riskScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const limit = 20;
  const { toast } = useToast();

  const { data: combinations, isLoading } = useQuery<RiskCombination[]>({
    queryKey: ['/api/risk-combinations', { sortBy, sortOrder, limit, offset: page * limit }],
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
          Equipment with high claim rates and low coverage ratio (last 6 months)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
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
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('runRate')} className="h-8 px-2">
                    Run Rate <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Risk</TableHead>
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
                    <TableCell>
                      <div className="text-sm">{combo.run_rate}/mo</div>
                      <div className="text-xs text-muted-foreground">
                        {combo.claims_last_6_months} claims
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={riskBadgeVariant(combo.risk_level)} className={riskColor(combo.risk_level)}>
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
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
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
