import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Trash2, Pencil, Package } from "lucide-react";

interface PoolCoverageCardProps {
  poolId: string;
  groupName: string;
  specifications: string[];
  inventoryRequired: number; // coveredCount - units in field under coverage
  poolUnits: number; // spareCount - spare units available in pool
  coveragePercentage: number; // coverageRatio
  availableStockCount?: number; // available stock matching pool criteria
  ukAvailableCount?: number; // UK available stock
  uaeAvailableCount?: number; // UAE available stock
  claimsCount?: number; // claims matching pool criteria
  runRate?: number; // claims per month (run rate)
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function PoolCoverageCard({
  poolId,
  groupName,
  specifications,
  inventoryRequired: coveredCount,
  poolUnits: spareCount,
  coveragePercentage: coverageRatio,
  availableStockCount,
  ukAvailableCount,
  uaeAvailableCount,
  claimsCount,
  runRate = 0,
  onEdit,
  onDelete,
}: PoolCoverageCardProps) {
  // Safe fallback: if UK/UAE not provided, use availableStockCount for total and split evenly
  const hasRegionalData = ukAvailableCount !== undefined || uaeAvailableCount !== undefined;
  const ukAvailable = ukAvailableCount ?? (hasRegionalData ? 0 : Math.floor((availableStockCount ?? 0) / 2));
  const uaeAvailable = uaeAvailableCount ?? (hasRegionalData ? 0 : Math.ceil((availableStockCount ?? 0) / 2));
  const totalAvailable = hasRegionalData ? (ukAvailable + uaeAvailable) : (availableStockCount ?? 0);
  
  // Calculate shortfall based on actual coverage (not hardcoded 6%)
  const uncoveredUnits = Math.max(0, coveredCount - spareCount);
  const shortfall = uncoveredUnits;
  
  // Calculate runway in months
  const runwayMonths = runRate > 0 ? spareCount / runRate : 0;
  
  // Status badge and runway colors based on inventory runway
  const getStatusBadge = () => {
    if (runRate === 0) {
      return { 
        text: "Low Priority", 
        class: "bg-muted text-muted-foreground border-muted",
        bg: "bg-muted/30",
        borderColor: "border-l-muted",
        textColor: "text-muted-foreground"
      };
    }
    
    if (runwayMonths < 1) {
      return { 
        text: "Critical", 
        class: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 border-red-300 dark:border-red-700",
        bg: "bg-red-50 dark:bg-red-950/30",
        borderColor: "border-l-red-600",
        textColor: "text-red-600 dark:text-red-400"
      };
    } else if (runwayMonths < 2) {
      return { 
        text: "Warning", 
        class: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 border-orange-300 dark:border-orange-700",
        bg: "bg-orange-50 dark:bg-orange-950/30",
        borderColor: "border-l-orange-600",
        textColor: "text-orange-600 dark:text-orange-400"
      };
    } else if (runwayMonths < 3) {
      return { 
        text: "Caution", 
        class: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 border-amber-300 dark:border-amber-700",
        bg: "bg-amber-50 dark:bg-amber-950/30",
        borderColor: "border-l-amber-600",
        textColor: "text-amber-600 dark:text-amber-500"
      };
    } else {
      return { 
        text: "Healthy", 
        class: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-300 dark:border-green-700",
        bg: "bg-green-50 dark:bg-green-950/30",
        borderColor: "border-l-green-600",
        textColor: "text-green-600 dark:text-green-500"
      };
    }
  };
  
  const status = getStatusBadge();

  return (
    <Card data-testid={`card-coverage-pool-${groupName.toLowerCase().replace(/\s+/g, "-")}`} className="hover-elevate rounded-2xl">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold flex-1 line-clamp-2 leading-tight">{groupName}</h3>
          <div className="flex items-center gap-1">
            <Badge className={`${status.class} font-semibold text-xs rounded-full px-2 py-0.5`} variant="outline">
              {status.text}
            </Badge>
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="h-7 w-7 text-muted-foreground"
                data-testid={`button-edit-coverage-pool-${groupName.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                data-testid={`button-delete-coverage-pool-${groupName.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {specifications.map((spec, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {spec}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Inventory Runway - Prominent Display */}
        <div className={`${status.bg} rounded-lg p-3 border-l-4 ${status.borderColor}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Inventory Runway</span>
            <span className={`text-xl font-bold ${status.textColor}`} data-testid={`text-runway-${groupName.toLowerCase().replace(/\s+/g, "-")}`}>
              {runRate > 0 ? `${runwayMonths.toFixed(1)} Months` : "No Recent Demand"}
            </span>
          </div>
        </div>
        
        {/* Stock Counts - 4 Column Grid */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-background rounded border p-2">
            <p className="text-[10px] text-muted-foreground mb-1">Covered</p>
            <p className="text-sm font-bold" data-testid={`text-covered-${groupName.toLowerCase().replace(/\s+/g, "-")}`}>{coveredCount}</p>
          </div>
          <div className="bg-background rounded border p-2">
            <p className="text-[10px] text-muted-foreground mb-1">Spares</p>
            <p className="text-sm font-bold" data-testid={`text-spares-${groupName.toLowerCase().replace(/\s+/g, "-")}`}>{spareCount}</p>
          </div>
          <div className="bg-background rounded border p-2">
            <p className="text-[10px] text-muted-foreground mb-1">Demand/mo</p>
            <p className="text-sm font-bold" data-testid={`text-run-rate-${groupName.toLowerCase().replace(/\s+/g, "-")}`}>{runRate.toFixed(1)}</p>
          </div>
          <div className="bg-background rounded border p-2">
            <p className="text-[10px] text-muted-foreground mb-1">Gap</p>
            <p className={`text-sm font-bold ${shortfall > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-500'}`} data-testid={`text-gap-${groupName.toLowerCase().replace(/\s+/g, "-")}`}>
              {shortfall}
            </p>
          </div>
        </div>
        
        {/* Available Stock - Regional Breakdown */}
        <div className="bg-muted/20 rounded-lg p-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
              <Package className="w-3 h-3" />
              <span>Available Stock</span>
            </div>
            <div className="flex items-center gap-3 font-semibold">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span data-testid={`text-uk-available-${groupName.toLowerCase().replace(/\s+/g, "-")}`}>{ukAvailable}</span>
                <span className="text-muted-foreground">UK</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span data-testid={`text-uae-available-${groupName.toLowerCase().replace(/\s+/g, "-")}`}>{uaeAvailable}</span>
                <span className="text-muted-foreground">UAE</span>
              </div>
              <div className="flex items-center gap-1">
                <span>=</span>
                <span data-testid={`text-total-available-${groupName.toLowerCase().replace(/\s+/g, "-")}`}>{totalAvailable}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button 
          asChild
          variant="outline" 
          className="w-full" 
          size="sm"
        >
          <Link href={`/pools/${poolId}`} data-testid={`button-view-pool-details-${groupName.toLowerCase().replace(/\s+/g, "-")}`}>
            View Details
            <ChevronRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
