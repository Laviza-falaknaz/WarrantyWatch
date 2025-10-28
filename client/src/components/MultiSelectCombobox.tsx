import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface MultiSelectComboboxProps {
  values: string[];
  onValuesChange: (values: string[]) => void;
  options: string[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelectCombobox({
  values,
  onValuesChange,
  options,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  className,
  disabled = false,
}: MultiSelectComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (option: string) => {
    if (values.includes(option)) {
      onValuesChange(values.filter(v => v !== option))
    } else {
      onValuesChange([...values, option])
    }
  }

  const handleRemove = (option: string, event: React.MouseEvent) => {
    event.stopPropagation()
    onValuesChange(values.filter(v => v !== option))
  }

  const handleClearAll = (event: React.MouseEvent) => {
    event.stopPropagation()
    onValuesChange([])
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between min-h-9", className)}
          disabled={disabled}
        >
          <div className="flex gap-1 flex-wrap flex-1">
            {values.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              values.map((value) => (
                <Badge
                  key={value}
                  variant="secondary"
                  className="mr-1 mb-1"
                  data-testid={`badge-selected-${value}`}
                >
                  {value}
                  <span
                    role="button"
                    tabIndex={0}
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 inline-flex items-center cursor-pointer"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleRemove(value, e as any)
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onClick={(e) => handleRemove(value, e)}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </span>
                </Badge>
              ))
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {values.length > 0 && (
                <CommandItem
                  onSelect={() => {
                    onValuesChange([])
                    setOpen(false)
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  <span className="text-muted-foreground italic">Clear all</span>
                </CommandItem>
              )}
              {options.map((option) => {
                const isSelected = values.includes(option)
                return (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => handleSelect(option)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
