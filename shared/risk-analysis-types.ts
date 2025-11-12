/**
 * Shared types for risk analysis across the application
 * Backend returns snake_case field names and lowercase risk_level values from SQL
 */

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

/**
 * Risk combination as returned by the backend API
 * Matches the SQL query structure from server/storage.ts getRiskCombinations
 */
export interface RiskCombination {
  make: string;
  model: string;
  processor: string | null;
  generation: string | null;
  covered_count: number; // Active warranty count
  spare_count: number;
  uk_available_count: number; // UK regional stock
  uae_available_count: number; // UAE regional stock
  available_stock_count: number;
  run_rate: number; // Claims per month
  days_of_supply: number | null; // Days until spare stock runs out (null if no demand)
  coverage_ratio: number; // Warranty Coverage: % of spare vs covered units (0-100)
  coverage_of_run_rate: number; // Spare Coverage: % of spare vs run rate (0-100)
  fulfillment_rate: number;
  claims_last_6_months: number;
  replacements_last_6_months: number;
  risk_score: number;
  risk_level: RiskLevel;
}

/**
 * Capitalizes the first letter of a risk level for display
 */
export function formatRiskLevel(level: RiskLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

// Legacy interface - kept for backwards compatibility if needed
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
  riskLevel: RiskLevel;
  riskScore: number; // 0-100, higher = more risk
}
