"use client";

import { cn } from "@/lib/utils";

interface VizToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function VizToggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: VizToggleProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-zinc-800/30 last:border-0">
      <div className="min-w-0">
        <p className={cn("text-sm text-zinc-300", disabled && "text-zinc-500")}>{label}</p>
        {description && (
          <p className="text-xs text-zinc-600 mt-0.5 leading-snug">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "relative shrink-0 w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none",
          checked && !disabled ? "bg-orange-500" : "bg-zinc-700",
          disabled && "opacity-40 cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200",
            checked && "translate-x-4"
          )}
        />
      </button>
    </div>
  );
}
