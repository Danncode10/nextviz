"use client";

import { Node } from "reactflow";
import { cn } from "@/lib/utils";

interface ChatModelData {
  type: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

interface ChatModelConfigProps {
  node: Node;
  onNodeChange?: (node: Node) => void;
}

const CHAT_MODELS = [
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  { value: "claude-opus", label: "Claude Opus" },
  { value: "claude-sonnet", label: "Claude Sonnet" },
];

export function ChatModelConfig({ node, onNodeChange }: ChatModelConfigProps) {
  const model = (node.data?.chatModel as ChatModelData) ?? { type: "" };

  const updateModel = (updates: Partial<ChatModelData>) => {
    onNodeChange?.({
      ...node,
      data: { ...node.data, chatModel: { ...model, ...updates } },
    });
  };

  return (
    <div className="space-y-4">
      {/* Model selector */}
      <div>
        <label className="text-xs font-medium text-zinc-500 block mb-2">Chat Model *</label>
        <select
          value={model.type}
          onChange={(e) => updateModel({ type: e.target.value })}
          className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-zinc-700 appearance-none cursor-pointer"
        >
          <option value="">Select a model...</option>
          {CHAT_MODELS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-zinc-600 mt-1">Primary LLM for the agent.</p>
      </div>

      {model.type && (
        <>
          {/* Temperature */}
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-2">
              Temperature: {(model.temperature ?? 0.7).toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={model.temperature ?? 0.7}
              onChange={(e) => updateModel({ temperature: parseFloat(e.target.value) })}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-[11px] text-zinc-600 mt-1">Controls randomness (0=deterministic, 2=creative).</p>
          </div>

          {/* Max Tokens */}
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-2">Max Tokens</label>
            <input
              type="number"
              value={model.maxTokens ?? 2048}
              onChange={(e) => updateModel({ maxTokens: parseInt(e.target.value) || 0 })}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-700"
            />
            <p className="text-[11px] text-zinc-600 mt-1">Max output length.</p>
          </div>

          {/* Top P */}
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-2">
              Top P: {(model.topP ?? 0.9).toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={model.topP ?? 0.9}
              onChange={(e) => updateModel({ topP: parseFloat(e.target.value) })}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-[11px] text-zinc-600 mt-1">Nucleus sampling parameter.</p>
          </div>
        </>
      )}
    </div>
  );
}
