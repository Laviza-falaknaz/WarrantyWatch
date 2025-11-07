// High-risk combination analysis types
export interface HighRiskCombination {
  make: string;
  model: string;
  processor: string | null;
  generation: string | null;
  
  // Coverage metrics
  coveredCount: number;  // Active, non-expired units only
  spareCount: number;
  availableStockCount: number;
  coverageRatio: number; // percentage
  
  // Claim metrics (last 6 months)
  claimsLast6Months: number;
  replacementsLast6Months: number;
  runRate: number; // claims per month
  fulfillmentRate: number; // percentage
  
  // Risk assessment
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  riskScore: number; // 0-100, higher = more risk
}
