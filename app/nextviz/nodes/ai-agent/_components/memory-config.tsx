"use client";

import { Node } from "reactflow";

interface MemoryData {
  type: "none" | "simple" | "summary" | "entity";
  maxMessages?: number;
}

interface MemoryConfigProps {
  node: Node;
  onNodeChange?: (node: Node) => void;
}

const MEMORY_TYPES = [
  { value: "none", label: "None (Stateless)" },
  { value: "simple", label: "Simple (Last N messages)" },
  { value: "summary", label: "Summary (AI summarized)" },
  { value: "entity", label: "Entity Memory" },
];

export function MemoryConfig({ node, onNodeChange }: MemoryConfigProps) {
  const memory = (node.data?.memory as MemoryData) ?? { type: "none" };

  const updateMemory = (updates: Partial<MemoryData>) => {
    onNodeChange?.({
      ...node,
      data: { ...node.data, memory: { ...memory, ...updates } },
    });
  };

  return (
    <div className="space-y-4">
      {/* Memory type selector */}
      <div>
        <label className="text-xs font-medium text-zinc-500 block mb-2">Memory Type</label>
        <select
          value={memory.type}
          onChange={(e) => updateMemory({ type: e.target.value as MemoryData["type"] })}
          className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-zinc-700 appearance-none cursor-pointer"
        >
          {MEMORY_TYPES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-zinc-600 mt-1">How the agent maintains conversation history.</p>
      </div>

      {memory.type !== "none" && (
        <div>
          <label className="text-xs font-medium text-zinc-500 block mb-2">Max Messages to Retain</label>
          <input
            type="number"
            min="1"
            max="100"
            value={memory.maxMessages ?? 10}
            onChange={(e) => updateMemory({ maxMessages: parseInt(e.target.value) || 10 })}
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-700"
          />
          <p className="text-[11px] text-zinc-600 mt-1">Number of previous messages to keep in context.</p>
        </div>
      )}

      {memory.type === "none" && (
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-3">
          <p className="text-xs text-zinc-500">
            Agent will not retain conversation history. Useful for stateless operations.
          </p>
        </div>
      )}
    </div>
  );
}
