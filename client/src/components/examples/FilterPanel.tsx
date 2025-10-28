import { useState } from "react";
import FilterPanel, { FilterCategory } from "../FilterPanel";

const mockCategories: FilterCategory[] = [
  {
    id: "make",
    title: "Make",
    options: [
      { label: "HP", value: "hp", count: 342 },
      { label: "Dell", value: "dell", count: 289 },
      { label: "Lenovo", value: "lenovo", count: 256 },
      { label: "Apple", value: "apple", count: 123 },
    ],
  },
  {
    id: "processor",
    title: "Processor",
    options: [
      { label: "Intel Core i5", value: "i5", count: 512 },
      { label: "Intel Core i7", value: "i7", count: 398 },
      { label: "AMD Ryzen 5", value: "ryzen5", count: 145 },
    ],
  },
  {
    id: "ram",
    title: "RAM",
    options: [
      { label: "8GB", value: "8gb", count: 445 },
      { label: "16GB", value: "16gb", count: 367 },
      { label: "32GB", value: "32gb", count: 98 },
    ],
  },
];

export default function FilterPanelExample() {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});

  const handleFilterChange = (categoryId: string, values: string[]) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [categoryId]: values,
    }));
  };

  const handleClearAll = () => {
    setSelectedFilters({});
  };

  return (
    <div className="p-6 max-w-xs">
      <FilterPanel
        categories={mockCategories}
        selectedFilters={selectedFilters}
        onFilterChange={handleFilterChange}
        onClearAll={handleClearAll}
      />
    </div>
  );
}
