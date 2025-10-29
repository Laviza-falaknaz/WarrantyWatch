import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MultiSelectCombobox } from "@/components/MultiSelectCombobox";
import { X } from "lucide-react";

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface FilterCategory {
  id: string;
  title: string;
  options: FilterOption[];
}

interface FilterPanelProps {
  categories: FilterCategory[];
  selectedFilters: Record<string, string[]>;
  onFilterChange: (categoryId: string, values: string[]) => void;
  onClearAll: () => void;
}

export default function FilterPanel({
  categories,
  selectedFilters,
  onFilterChange,
  onClearAll,
}: FilterPanelProps) {
  const totalSelectedCount = Object.values(selectedFilters).reduce(
    (sum, values) => sum + values.length,
    0
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <h3 className="text-base font-medium">Filters</h3>
        {totalSelectedCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            data-testid="button-clear-filters"
          >
            <X className="h-4 w-4 mr-1" />
            Clear ({totalSelectedCount})
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map((category) => (
          <div key={category.id} className="space-y-2">
            <label className="text-sm font-medium">
              {category.title}
              {(selectedFilters[category.id]?.length || 0) > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({selectedFilters[category.id].length})
                </span>
              )}
            </label>
            <MultiSelectCombobox
              values={selectedFilters[category.id] || []}
              onValuesChange={(values) => onFilterChange(category.id, values)}
              options={category.options.map(opt => opt.value)}
              placeholder={`Select ${category.title.toLowerCase()}...`}
              searchPlaceholder={`Search ${category.title.toLowerCase()}...`}
              emptyText={`No ${category.title.toLowerCase()} found`}
              data-testid={`filter-${category.id}`}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
