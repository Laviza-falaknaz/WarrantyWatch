import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2 } from "lucide-react";

interface PoolCoverageCardProps {
  groupName: string;
  specifications: string[];
  inventoryRequired: number; // coveredCount - units in field under coverage
  poolUnits: number; // spareCount - spare units available in pool
  coveragePercentage: number; // coverageRatio
  onExpand?: () => void;
  onDelete?: () => void;
}

export default function PoolCoverageCard({
  groupName,
  specifications,
  inventoryRequired: coveredCount,
  poolUnits: spareCount,
  coveragePercentage: coverageRatio,
  onExpand,
  onDelete,
}: PoolCoverageCardProps) {
  const getCoverageColor = (percentage: number) => {
    if (percentage >= 15) return "text-green-600 dark:text-green-500";
    if (percentage >= 10) return "text-yellow-600 dark:text-yellow-500";
    return "text-red-600 dark:text-red-500";
  };

  return (
    <Card data-testid={`card-coverage-pool-${groupName.toLowerCase().replace(/\s+/g, "-")}`} className="hover-elevate">
      <CardHeader className="space-y-2 pb-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-medium flex-1">{groupName}</h3>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${getCoverageColor(coverageRatio)}`} data-testid={`text-coverage-ratio-${groupName.toLowerCase().replace(/\s+/g, "-")}`}>
              {coverageRatio.toFixed(1)}%
            </span>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                data-testid={`button-delete-coverage-pool-${groupName.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Trash2 className="h-4 w-4" />
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
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Coverage Ratio</span>
          <span className="font-mono font-medium" data-testid={`text-coverage-units-${groupName.toLowerCase().replace(/\s+/g, "-")}`}>
            {spareCount} spare / {coveredCount} covered
          </span>
        </div>
        <Progress value={coverageRatio} className="h-2" />
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full" 
          size="sm"
          onClick={onExpand}
          data-testid={`button-expand-coverage-pool-${groupName.toLowerCase().replace(/\s+/g, "-")}`}
        >
          <Plus className="h-4 w-4 mr-2" />
          Expand Pool
        </Button>
      </CardFooter>
    </Card>
  );
}
