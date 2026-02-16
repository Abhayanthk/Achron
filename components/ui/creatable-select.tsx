"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface Option {
  label: string;
  value: string;
}

interface CreatableSelectProps {
  options: Option[];
  value: string | string[]; // Single string or array of strings
  onChange: (value: string | string[]) => void;
  onCreate?: (value: string) => void;
  placeholder?: string;
  isMulti?: boolean;
}

export function CreatableSelect({
  options,
  value,
  onChange,
  onCreate,
  placeholder = "Select...",
  isMulti = false,
}: CreatableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const selectedValues = isMulti
    ? Array.isArray(value)
      ? value
      : []
    : value
      ? [value]
      : [];

  const handleSelect = (currentValue: string) => {
    if (isMulti) {
      const isSelected = selectedValues.includes(currentValue);
      let newValues;
      if (isSelected) {
        newValues = selectedValues.filter((v) => v !== currentValue);
      } else {
        newValues = [...selectedValues, currentValue];
      }
      onChange(newValues as any);
    } else {
      onChange(currentValue as any);
      setOpen(false);
    }
  };

  const handleCreate = () => {
    if (!inputValue.trim()) return;
    if (onCreate) {
      onCreate(inputValue.trim());
    } else {
      // Default behavior if onCreate not provided: just select it
      handleSelect(inputValue.trim());
    }
    setInputValue("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-zinc-800/50 border-white/10 text-white hover:bg-zinc-800 hover:text-white"
        >
          {selectedValues.length > 0 ? (
            <span className="truncate">
              {isMulti
                ? `${selectedValues.length} selected`
                : options.find((opt) => opt.value === value)?.label || value}
            </span>
          ) : (
            <span className="text-zinc-500">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-zinc-900 border-white/10">
        <Command className="bg-transparent text-white">
          <CommandInput
            placeholder={`Search ${placeholder.toLowerCase()}...`}
            value={inputValue}
            onValueChange={setInputValue}
            className="text-white placeholder:text-zinc-500"
          />
          <CommandList>
            <CommandEmpty className="py-2 px-2 text-sm">
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-indigo-400 hover:bg-white/10 cursor-pointer"
                onClick={handleCreate}
              >
                <Plus className="h-4 w-4" />
                Create "{inputValue}"
              </button>
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label} // Search by label
                  onSelect={(currentValue) => {
                    // CommandItem lowercases values, so we find the original case from options
                    // Or if it's a new custom option not in list, use currentValue (but likely create path taken)
                    const matchedOption = options.find(
                      (o) =>
                        o.label.toLowerCase() === currentValue.toLowerCase(),
                    );
                    handleSelect(
                      matchedOption ? matchedOption.value : currentValue,
                    );
                  }}
                  className="text-zinc-200 aria-selected:bg-white/10 cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedValues.includes(option.value)
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
