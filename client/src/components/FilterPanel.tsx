import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  const handleCheckboxChange = (categoryId: string, value: string, checked: boolean) => {
    const currentValues = selectedFilters[categoryId] || [];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter((v) => v !== value);
    onFilterChange(categoryId, newValues);
  };

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
      <CardContent>
        <Accordion type="multiple" className="w-full" defaultValue={categories.map(c => c.id)}>
          {categories.map((category) => (
            <AccordionItem key={category.id} value={category.id}>
              <AccordionTrigger className="text-sm font-medium py-3">
                {category.title}
                {(selectedFilters[category.id]?.length || 0) > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({selectedFilters[category.id].length})
                  </span>
                )}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {category.options.map((option) => {
                    const isChecked = selectedFilters[category.id]?.includes(option.value) || false;
                    return (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${category.id}-${option.value}`}
                          checked={isChecked}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange(category.id, option.value, checked === true)
                          }
                          data-testid={`checkbox-${category.id}-${option.value}`}
                        />
                        <Label
                          htmlFor={`${category.id}-${option.value}`}
                          className="text-sm font-normal flex items-center justify-between flex-1 cursor-pointer"
                        >
                          <span>{option.label}</span>
                          {option.count !== undefined && (
                            <span className="text-xs text-muted-foreground">
                              {option.count}
                            </span>
                          )}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
