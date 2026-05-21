"use client";

import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface BaseProps {
  label: string;
  options: Option[];
  searchable?: boolean;
  placeholder?: string;
  width?: string;
}

interface MultiProps extends BaseProps {
  multi: true;
  selected: string[];
  onChange: (v: string[]) => void;
}

interface SingleProps extends BaseProps {
  multi?: false;
  selected: string;
  onChange: (v: string) => void;
}

type Props = MultiProps | SingleProps;

export function FilterDropdown(props: Props) {
  const {
    label,
    options,
    searchable,
    placeholder = "Any",
    width = "w-44",
  } = props;
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!q) return options;
    const l = q.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(l));
  }, [options, q]);

  const isMulti = props.multi === true;
  const selectedArr = isMulti
    ? (props as MultiProps).selected
    : (props as SingleProps).selected
      ? [(props as SingleProps).selected]
      : [];

  const displayValue = (() => {
    if (selectedArr.length === 0) return placeholder;
    if (!isMulti) {
      const found = options.find((o) => o.value === selectedArr[0]);
      return found ? found.label : selectedArr[0];
    }
    if (selectedArr.length === 1) {
      const found = options.find((o) => o.value === selectedArr[0]);
      return found ? found.label : selectedArr[0];
    }
    return `${selectedArr.length} selected`;
  })();

  const isActive = selectedArr.length > 0;

  const handleToggle = (val: string) => {
    if (isMulti) {
      const cur = (props as MultiProps).selected;
      if (cur.includes(val)) {
        (props as MultiProps).onChange(cur.filter((x) => x !== val));
      } else {
        (props as MultiProps).onChange([...cur, val]);
      }
    } else {
      const p = props as SingleProps;
      p.onChange(p.selected === val ? "" : val);
      setOpen(false);
    }
  };

  const clearAll = () => {
    if (isMulti) (props as MultiProps).onChange([]);
    else (props as SingleProps).onChange("");
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "h-9 px-3 rounded-md border bg-zinc-900 flex items-center justify-between gap-2 text-xs transition-colors",
              width,
              isActive
                ? "border-indigo-500/40 text-indigo-200 bg-indigo-500/5"
                : "border-zinc-800 text-zinc-300 hover:border-zinc-700",
            )}
          >
            <span className="truncate">{displayValue}</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 shrink-0 transition-transform",
                open && "rotate-180",
              )}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="p-0 bg-zinc-950 border-zinc-800 text-zinc-200 w-64 overflow-hidden"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
            <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              {label}
            </span>
            {isActive && (
              <button
                onClick={clearAll}
                className="text-[10px] text-indigo-400 hover:text-indigo-200"
              >
                Clear
              </button>
            )}
          </div>
          {searchable && (
            <div className="p-2 border-b border-zinc-800">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="h-7 text-xs bg-zinc-900 border-zinc-800"
              />
            </div>
          )}
          <ScrollArea className="max-h-64">
            <div className="py-1">
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-[11px] text-zinc-600 italic">
                  No options
                </p>
              ) : (
                filtered.map((o) => {
                  const active = selectedArr.includes(o.value);
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => handleToggle(o.value)}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors",
                        active
                          ? "bg-indigo-500/10 text-indigo-200"
                          : "text-zinc-300 hover:bg-zinc-900",
                      )}
                    >
                      <span
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 rounded border flex items-center justify-center",
                          active
                            ? "bg-indigo-500 border-indigo-500"
                            : "border-zinc-700",
                        )}
                      >
                        {active && <Check className="h-2.5 w-2.5 text-white" />}
                      </span>
                      <span className="truncate">{o.label}</span>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
