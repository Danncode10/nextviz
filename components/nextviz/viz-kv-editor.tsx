"use client";

import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KVRow {
  id: string;
  key: string;
  value: string;
}

export function makeKVRow(): KVRow {
  return {
    id: `kv-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    key: "",
    value: "",
  };
}

interface VizKvEditorProps {
  rows: KVRow[];
  onChange: (rows: KVRow[]) => void;
  label?: string;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  disabled?: boolean;
}

export function VizKvEditor({
  rows,
  onChange,
  label,
  keyPlaceholder = "Name",
  valuePlaceholder = "Value",
  disabled = false,
}: VizKvEditorProps) {
  const add = () => onChange([...rows, makeKVRow()]);
  const remove = (id: string) => onChange(rows.filter((r) => r.id !== id));
  const update = (id: string, field: "key" | "value", val: string) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, [field]: val } : r)));

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-medium text-zinc-500 block">{label}</label>
      )}
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
            <input
              value={r.key}
              onChange={(e) => update(r.id, "key", e.target.value)}
              placeholder={keyPlaceholder}
              disabled={disabled}
              className={cn(
                "bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-700 placeholder:text-zinc-600 font-mono transition-colors",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            />
            <input
              value={r.value}
              onChange={(e) => update(r.id, "value", e.target.value)}
              placeholder={valuePlaceholder}
              disabled={disabled}
              className={cn(
                "bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-700 placeholder:text-zinc-600 font-mono transition-colors",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            />
            <button
              type="button"
              onClick={() => remove(r.id)}
              disabled={disabled}
              className="p-1.5 rounded-lg hover:bg-red-500/10 border border-zinc-800/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5 text-zinc-600 hover:text-red-500 transition-colors" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          disabled={disabled}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-400 transition-colors py-1.5 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
          Add entry
        </button>
      </div>
    </div>
  );
}
