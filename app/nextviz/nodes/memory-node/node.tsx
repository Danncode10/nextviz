"use client";

import { NodeProps, Handle, Position } from "reactflow";
import { Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface MemoryData {
  memory?: {
    type: "none" | "simple" | "summary" | "entity";
    maxMessages?: number;
  };
}

const MEMORY_LABELS: Record<string, string> = {
  simple:  "Simple Memory",
  summary: "Summary Memory",
  entity:  "Entity Memory",
};

export default function MemoryNode({ data, selected }: NodeProps<MemoryData>) {
  const memory = data.memory;
  const label  = memory?.type ? (MEMORY_LABELS[memory.type] ?? "Memory") : "Memory";
  const detail = memory?.maxMessages ? `Last ${memory.maxMessages} msgs` : undefined;

  return (
    <div
      className={cn(
        "rounded-xl bg-zinc-800 border-2 flex items-center gap-2.5 px-3 py-2.5 transition-all duration-150",
        selected
          ? "border-orange-500 shadow-[0_0_0_3px_rgba(249,115,22,0.18)]"
          : "border-zinc-700 hover:border-zinc-600"
      )}
      style={{ minWidth: 160 }}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="memory-in"
        className="!w-2.5 !h-2.5 !bg-zinc-600 !border-2 !border-zinc-400"
      />

      <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0">
        <Brain className="w-4 h-4 text-purple-400" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-zinc-300 leading-none truncate">{label}</p>
        {detail && <p className="text-[10px] text-zinc-500 leading-none mt-1 truncate">{detail}</p>}
      </div>
    </div>
  );
}
