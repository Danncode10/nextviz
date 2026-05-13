"use client";

import { useState } from "react";
import { Node } from "reactflow";
import { Bot, Info, X, Plus, ChevronDown } from "lucide-react";
import { NodeModalShell } from "../_base/node-modal-shell";
import { MemoryConfig } from "./_components/memory-config";
import { ToolConfig } from "./_components/tool-config";
import { ModelSelectorPopup } from "./_components/model-selector-popup";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

type SubView = "memory" | "tool" | null;

export interface AIAgentPanelProps {
  node: Node;
  onClose: () => void;
  onExecuteStep?: (nodeId: string) => Promise<Record<string, unknown>>;
  onNodeChange?: (node: Node) => void;
}

// ── Toggle (local — panels are self-contained) ─────────────────────────────────

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-800/40 last:border-0 group">
      <p className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors">{label}</p>
      <button
        onClick={() => onChange(!value)}
        aria-checked={value}
        role="switch"
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
          value ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]" : "bg-zinc-700 hover:bg-zinc-600"
        )}
      >
        <span className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200",
          value ? "translate-x-5" : "translate-x-0"
        )} />
      </button>
    </div>
  );
}

// ── Option row (for "Add Option" section) ──────────────────────────────────────

interface Option { id: string; key: string; value: string }

function OptionsSection({ node, onNodeChange }: { node: Node; onNodeChange?: (n: Node) => void }) {
  const [expanded, setExpanded] = useState(false);
  const options = (node.data?.agentOptions as Option[]) ?? [];

  const addOption = () => {
    const next = [...options, { id: `opt-${Date.now()}`, key: "", value: "" }];
    onNodeChange?.({ ...node, data: { ...node.data, agentOptions: next } });
  };

  const removeOption = (id: string) => {
    onNodeChange?.({ ...node, data: { ...node.data, agentOptions: options.filter((o) => o.id !== id) } });
  };

  const updateOption = (id: string, field: "key" | "value", val: string) => {
    onNodeChange?.({
      ...node,
      data: { ...node.data, agentOptions: options.map((o) => o.id === id ? { ...o, [field]: val } : o) },
    });
  };

  return (
    <div>
      <div className="flex items-center gap-1 mb-2">
        <p className="text-sm font-medium text-zinc-400 flex-1">Options</p>
      </div>

      {options.length === 0 && <p className="text-xs text-zinc-600 italic mb-2">No properties</p>}

      {options.map((opt) => (
        <div key={opt.id} className="flex items-center gap-2 mb-2">
          <input
            type="text"
            placeholder="Key"
            value={opt.key}
            onChange={(e) => updateOption(opt.id, "key", e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-700 placeholder:text-zinc-600"
          />
          <input
            type="text"
            placeholder="Value"
            value={opt.value}
            onChange={(e) => updateOption(opt.id, "value", e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-700 placeholder:text-zinc-600"
          />
          <button onClick={() => removeOption(opt.id)} className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="w-3.5 h-3.5 text-zinc-500" />
          </button>
        </div>
      ))}

      <button
        onClick={addOption}
        className="w-full flex items-center justify-center gap-2 bg-zinc-900 border border-dashed border-zinc-700 text-zinc-400 text-sm rounded-lg px-3 py-2 hover:border-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ChevronDown className="w-3.5 h-3.5" />
        Add Option
      </button>
    </div>
  );
}

// ── Main parameters content ────────────────────────────────────────────────────

function AIAgentParameters({ node, onNodeChange }: { node: Node; onNodeChange?: (n: Node) => void }) {
  const [showTip, setShowTip]         = useState(true);
  const [promptSource, setPromptSource] = useState<string>(node.data?.promptSource ?? "chatTrigger");
  const [promptTemplate, setTemplate] = useState<string>(node.data?.promptTemplate ?? "{{ $json.chatInput }}");
  const [requireFormat, setFormat]    = useState<boolean>(node.data?.requireOutputFormat ?? false);
  const [enableFallback, setFallback] = useState<boolean>(node.data?.enableFallback ?? false);

  const sync = (patch: Record<string, unknown>) =>
    onNodeChange?.({ ...node, data: { ...node.data, ...patch } });

  return (
    <div className="space-y-5">
      {/* Tip callout */}
      {showTip && (
        <div className="flex items-start gap-2 bg-blue-500/5 border border-blue-500/20 rounded-xl px-3 py-2.5">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-400 leading-relaxed flex-1">
            Tip: Get a feel for agents with a quick tutorial or see an example of how this node works.
          </p>
          <button onClick={() => setShowTip(false)} className="text-zinc-600 hover:text-zinc-400 transition-colors shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Source for Prompt */}
      <div>
        <label className="text-xs font-medium text-zinc-500 block mb-1.5">
          Source for Prompt (User Message)
        </label>
        <select
          value={promptSource}
          onChange={(e) => { setPromptSource(e.target.value); sync({ promptSource: e.target.value }); }}
          className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-zinc-700 appearance-none cursor-pointer"
        >
          <option value="chatTrigger">Connected Chat Trigger Node</option>
          <option value="manual">Define Below</option>
          <option value="previousNode">Take from Previous Node</option>
        </select>
      </div>

      {/* Prompt template */}
      <div>
        <label className="text-xs font-medium text-zinc-500 block mb-1.5">
          Prompt (User Message)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-600">fx</span>
          <input
            type="text"
            value={promptTemplate}
            onChange={(e) => { setTemplate(e.target.value); sync({ promptTemplate: e.target.value }); }}
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg pl-8 pr-10 py-2.5 focus:outline-none focus:border-zinc-700 font-mono"
          />
        </div>
        <p className="text-[11px] text-zinc-600 mt-1">Use {"{{ $json.fieldName }}"} to reference upstream data.</p>
      </div>

      {/* Toggles */}
      <div className="space-y-0">
        <Toggle
          label="Require Specific Output Format"
          value={requireFormat}
          onChange={(v) => { setFormat(v); sync({ requireOutputFormat: v }); }}
        />
        <Toggle
          label="Enable Fallback Model"
          value={enableFallback}
          onChange={(v) => { setFallback(v); sync({ enableFallback: v }); }}
        />
      </div>

      {/* Options */}
      <OptionsSection node={node} onNodeChange={onNodeChange} />
    </div>
  );
}

// ── Sub-component footer tabs ──────────────────────────────────────────────────

function SubComponentFooter({
  activeView,
  onSelect,
  onModelClick,
  hasModel,
}: {
  activeView: SubView;
  onSelect: (v: SubView) => void;
  onModelClick: () => void;
  hasModel: boolean;
}) {
  return (
    <div className="flex items-center gap-0 px-6 py-3">
      {/* Model tab — opens popup */}
      <button
        onClick={onModelClick}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors",
          hasModel
            ? "bg-zinc-800 text-zinc-200 border border-zinc-700"
            : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
        )}
      >
        <span>Model</span>
        <span className="text-red-400">*</span>
        <div className={cn(
          "w-5 h-5 rounded flex items-center justify-center border transition-colors",
          hasModel
            ? "bg-orange-600 border-orange-500 text-white"
            : "bg-zinc-900 border-zinc-700 text-zinc-500 hover:border-zinc-500"
        )}>
          <Plus className="w-3 h-3" />
        </div>
      </button>

      {/* Memory + Tool tabs — swap panel content */}
      {(["memory", "tool"] as SubView[]).map((key) => (
        <button
          key={key}
          onClick={() => onSelect(activeView === key ? null : key)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors capitalize",
            activeView === key
              ? "bg-zinc-800 text-zinc-200 border border-zinc-700"
              : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
          )}
        >
          <span>{key}</span>
          <div className={cn(
            "w-5 h-5 rounded flex items-center justify-center border transition-colors",
            activeView === key
              ? "bg-orange-600 border-orange-500 text-white"
              : "bg-zinc-900 border-zinc-700 text-zinc-500 hover:border-zinc-500"
          )}>
            <Plus className="w-3 h-3" />
          </div>
        </button>
      ))}
    </div>
  );
}

// ── Panel export ───────────────────────────────────────────────────────────────

export function AIAgentPanel({ node, onClose, onExecuteStep, onNodeChange }: AIAgentPanelProps) {
  const [subView, setSubView]           = useState<SubView>(null);
  const [modelPopupOpen, setModelPopup] = useState(false);

  const hasModel = !!(node.data?.chatModel as Record<string, string> | undefined)?.type;

  const parametersContent = (() => {
    if (subView === "memory") return <MemoryConfig node={node} onNodeChange={onNodeChange} />;
    if (subView === "tool")   return <ToolConfig   node={node} onNodeChange={onNodeChange} />;
    return <AIAgentParameters node={node} onNodeChange={onNodeChange} />;
  })();

  return (
    <>
      <NodeModalShell
        node={node}
        icon={<Bot className="w-4 h-4 text-blue-400" strokeWidth={2} />}
        title={(node.data?.label as string) || "AI Agent"}
        version="3.1"
        onClose={onClose}
        onExecuteStep={onExecuteStep}
        onNodeChange={onNodeChange}
        executeButtonLabel="Execute step"
        parametersContent={parametersContent}
        footerContent={
          <SubComponentFooter
            activeView={subView}
            onSelect={setSubView}
            onModelClick={() => setModelPopup(true)}
            hasModel={hasModel}
          />
        }
      />

      {modelPopupOpen && (
        <ModelSelectorPopup
          node={node}
          onClose={() => setModelPopup(false)}
          onNodeChange={(updated) => {
            onNodeChange?.(updated);
          }}
        />
      )}
    </>
  );
}
