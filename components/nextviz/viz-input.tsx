"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VizInputProps {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  placeholder?: string;
  type?: "text" | "number" | "url" | "password" | "email";
  mono?: boolean;
  warning?: boolean;
  description?: string;
  disabled?: boolean;
}

export function VizInput({
  value,
  onChange,
  label,
  placeholder,
  type = "text",
  mono = false,
  warning = false,
  description,
  disabled = false,
}: VizInputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-medium text-zinc-500 block">{label}</label>
      )}
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full bg-zinc-900 border text-zinc-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none placeholder:text-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
            warning && !value
              ? "border-amber-500/50 focus:border-amber-500"
              : "border-zinc-800 focus:border-zinc-700",
            mono && "font-mono text-xs",
            warning && !value && "pr-9"
          )}
        />
        {warning && !value && (
          <AlertTriangle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 pointer-events-none" />
        )}
      </div>
      {description && (
        <p className="text-[11px] text-zinc-600">{description}</p>
      )}
    </div>
  );
}
