"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface VizSelectOption {
  value: string;
  label: string;
}

interface VizSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: VizSelectOption[];
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function VizSelect({
  value,
  onChange,
  options,
  label,
  description,
  disabled = false,
}: VizSelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-medium text-zinc-500 block">{label}</label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            "w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2.5 pr-8 appearance-none focus:outline-none focus:border-zinc-700 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
      </div>
      {description && (
        <p className="text-[11px] text-zinc-600">{description}</p>
      )}
    </div>
  );
}
