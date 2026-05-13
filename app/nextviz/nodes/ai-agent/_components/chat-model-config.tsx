"use client";

import { Node } from "reactflow";
import { listProviders, getProvider } from "@/lib/nextviz/credentials/providers";
import { VizConnection } from "@/components/nextviz/viz-connection";

interface ChatModelData {
  /** Provider id from PROVIDERS registry (e.g. "openai", "anthropic") */
  provider?: string;
  /** Model id within the provider (e.g. "gpt-4o", "claude-sonnet-4-6") */
  type?: string;
  /** Env variable name holding the API key (NOT the key itself). */
  apiKeyRef?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

interface ChatModelConfigProps {
  node: Node;
  onNodeChange?: (node: Node) => void;
}

export function ChatModelConfig({ node, onNodeChange }: ChatModelConfigProps) {
  const model = (node.data?.chatModel as ChatModelData) ?? {};
  const provider = model.provider ? getProvider(model.provider) : undefined;

  const update = (updates: Partial<ChatModelData>) => {
    onNodeChange?.({
      ...node,
      data: { ...node.data, chatModel: { ...model, ...updates } },
    });
  };

  return (
    <div className="space-y-5">
      {/* Provider selection */}
      <div>
        <label className="text-xs font-medium text-zinc-500 block mb-2">Provider *</label>
        <div className="grid grid-cols-3 gap-2">
          {listProviders().map((p) => (
            <button
              key={p.id}
              onClick={() => update({ provider: p.id, type: "", apiKeyRef: "" })}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-colors ${
                model.provider === p.id
                  ? "border-orange-500 bg-orange-500/5"
                  : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold ${p.iconColor}`}>
                {p.name[0]}
              </div>
              <span className="text-[11px] font-medium text-zinc-300">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {provider && (
        <>
          {/* Credential picker */}
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-2">Credential *</label>
            <VizConnection
              providerId={provider.id}
              value={model.apiKeyRef}
              onChange={(envKey) => update({ apiKeyRef: envKey })}
            />
          </div>

          {/* Model selector */}
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-2">Model *</label>
            <select
              value={model.type ?? ""}
              onChange={(e) => update({ type: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-zinc-700 appearance-none cursor-pointer"
            >
              <option value="">Select a model…</option>
              {provider.models.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

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
              onChange={(e) => update({ temperature: parseFloat(e.target.value) })}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <p className="text-[11px] text-zinc-600 mt-1">0 = deterministic, 2 = creative.</p>
          </div>

          {/* Max Tokens */}
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-2">Max Tokens</label>
            <input
              type="number"
              value={model.maxTokens ?? 2048}
              onChange={(e) => update({ maxTokens: parseInt(e.target.value) || 0 })}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-700"
            />
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
              onChange={(e) => update({ topP: parseFloat(e.target.value) })}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
          </div>
        </>
      )}
    </div>
  );
}
