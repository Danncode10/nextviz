"use client";

import { useState, ReactNode } from "react";
import { createPortal } from "react-dom";
import { Node } from "reactflow";
import { X, ExternalLink, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "parameters" | "settings";

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-800/40 last:border-0 group">
      <p className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors">{label}</p>
      <button
        onClick={() => onChange(!value)}
        aria-checked={value}
        role="switch"
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
          value ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]" : "bg-zinc-700 hover:bg-zinc-600"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
            value ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

export interface NodeModalShellProps {
  node: Node;
  icon: ReactNode;
  title: string;
  version?: string;
  onClose: () => void;
  onExecuteStep?: (nodeId: string) => Promise<Record<string, unknown>>;
  onNodeChange?: (node: Node) => void;
  parametersContent: ReactNode;
  executeButtonLabel?: string;
  /** Optional button rendered in the tab bar, to the left of the Execute button. */
  actionButton?: ReactNode;
  /** Optional fixed footer rendered below the scroll area on the left panel. */
  footerContent?: ReactNode;
}

export function NodeModalShell({
  node,
  icon,
  title,
  version = "1",
  onClose,
  onExecuteStep,
  onNodeChange,
  parametersContent,
  executeButtonLabel = "Execute step",
  actionButton,
  footerContent,
}: NodeModalShellProps) {
  const [activeTab, setActiveTab]     = useState<Tab>("parameters");
  const [nodeLabel, setNodeLabel]     = useState<string>((node.data?.label as string) ?? "");
  const [alwaysOutputData, setAlways] = useState(node.data?.alwaysOutputData ?? false);
  const [executeOnce, setExecuteOnce] = useState(node.data?.executeOnce ?? false);
  const [retryOnFail, setRetryOnFail] = useState(node.data?.retryOnFail ?? false);
  const [onError, setOnError]         = useState<string>(node.data?.onError ?? "stopWorkflow");
  const [notes, setNotes]             = useState<string>(node.data?.notes ?? "");
  const [displayNote, setDisplayNote] = useState(node.data?.displayNote ?? false);
  const [isRunning, setIsRunning]     = useState(false);
  const [output, setOutput]           = useState<Record<string, unknown> | null>(null);

  const handleExecuteStep = async () => {
    setIsRunning(true);
    try {
      const result = onExecuteStep
        ? await onExecuteStep(node.id)
        : await new Promise<Record<string, unknown>>((r) =>
            setTimeout(() => r({ executedAt: new Date().toISOString(), nodeId: node.id }), 600)
          );
      setOutput(result);
    } finally {
      setIsRunning(false);
    }
  };

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="relative w-[90vw] max-w-[1100px] h-[88vh] bg-[#09090b] rounded-2xl border border-zinc-800 shadow-[0_0_50px_-12px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-800 shrink-0 bg-[#09090b]">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <span className="text-base font-semibold text-zinc-100 flex-1 truncate">{title}</span>
          <button className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            Docs <ExternalLink className="w-3 h-3" />
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition-colors ml-1"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">

          {/* Left — Parameters / Settings */}
          <div className="flex flex-col flex-1 border-r border-zinc-800 min-w-0">
            {/* Tabs + Execute */}
            <div className="flex items-center gap-1 px-6 border-b border-zinc-800 shrink-0 bg-[#09090b]">
              {(["parameters", "settings"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-4 py-3.5 text-sm font-medium capitalize border-b-2 -mb-px transition-colors",
                    activeTab === tab
                      ? "border-orange-500 text-orange-400"
                      : "border-transparent text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {tab}
                </button>
              ))}
              <div className="flex-1" />
              {actionButton}
              <button
                onClick={handleExecuteStep}
                disabled={isRunning}
                className={cn(
                  "flex items-center gap-2 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors",
                  isRunning
                    ? "bg-orange-700 opacity-70 cursor-wait"
                    : "bg-orange-600 hover:bg-orange-500 shadow-lg shadow-orange-900/20"
                )}
              >
                <Zap className={cn("w-3.5 h-3.5", isRunning && "animate-pulse")} />
                {isRunning ? "Running…" : executeButtonLabel}
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
              {activeTab === "parameters" && (
                <div className="space-y-5">
                  {/* Universal node label — every node gets this */}
                  <div>
                    <label className="text-xs font-medium text-zinc-500 block mb-1.5">Node Name</label>
                    <input
                      type="text"
                      value={nodeLabel}
                      onChange={(e) => {
                        const v = e.target.value;
                        setNodeLabel(v);
                        onNodeChange?.({ ...node, data: { ...node.data, label: v } });
                      }}
                      placeholder={title}
                      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-zinc-700 placeholder:text-zinc-600 transition-colors"
                    />
                    <p className="text-[11px] text-zinc-600 mt-1">This name is shown below the node on the canvas.</p>
                  </div>
                  {parametersContent && <div className="border-t border-zinc-800/40 pt-4">{parametersContent}</div>}
                </div>
              )}

              {activeTab === "settings" && (
                <div className="space-y-0 max-w-lg divide-y divide-zinc-800/40">
                  <Toggle
                    label="Always Output Data"
                    value={alwaysOutputData}
                    onChange={(v) => { setAlways(v); onNodeChange?.({ ...node, data: { ...node.data, alwaysOutputData: v } }); }}
                  />
                  <Toggle
                    label="Execute Once"
                    value={executeOnce}
                    onChange={(v) => { setExecuteOnce(v); onNodeChange?.({ ...node, data: { ...node.data, executeOnce: v } }); }}
                  />
                  <Toggle
                    label="Retry On Fail"
                    value={retryOnFail}
                    onChange={(v) => { setRetryOnFail(v); onNodeChange?.({ ...node, data: { ...node.data, retryOnFail: v } }); }}
                  />

                  <div className="py-2.5">
                    <p className="text-sm text-zinc-400 mb-2">On Error</p>
                    <div className="relative">
                      <select
                        value={onError}
                        onChange={(e) => { const v = e.target.value; setOnError(v); onNodeChange?.({ ...node, data: { ...node.data, onError: v } }); }}
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2.5 appearance-none focus:outline-none focus:border-zinc-700 cursor-pointer transition-colors"
                      >
                        <option value="stopWorkflow">Stop Workflow</option>
                        <option value="continueRegular">Continue (Regular Output)</option>
                        <option value="continueError">Continue (Error Output)</option>
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">▾</div>
                    </div>
                  </div>

                  <div className="py-2.5">
                    <p className="text-sm text-zinc-400 mb-2">Notes</p>
                    <textarea
                      value={notes}
                      onChange={(e) => { const v = e.target.value; setNotes(v); onNodeChange?.({ ...node, data: { ...node.data, notes: v } }); }}
                      rows={4}
                      placeholder="Add notes about this node…"
                      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:border-zinc-700 placeholder:text-zinc-600 transition-colors"
                    />
                  </div>

                  <Toggle
                    label="Display Note in Flow?"
                    value={displayNote}
                    onChange={(v) => { setDisplayNote(v); onNodeChange?.({ ...node, data: { ...node.data, displayNote: v } }); }}
                  />

                  <div className="pt-4">
                    <p className="text-xs text-zinc-600">{title} node version {version} (Latest)</p>
                  </div>
                </div>
              )}
            </div>

            {/* Fixed footer — sub-component tabs etc. */}
            {footerContent && (
              <div className="shrink-0 border-t border-zinc-800">
                {footerContent}
              </div>
            )}
          </div>

          {/* Right — Output */}
          <div className="w-[320px] shrink-0 flex flex-col">
            <div className="px-6 py-3.5 border-b border-zinc-800 shrink-0">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Output</p>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
              {output ? (
                <div className="w-full space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <p className="text-xs font-medium text-emerald-400">Trigger fired</p>
                  </div>
                  <pre className="text-[11px] text-zinc-400 bg-zinc-950 border border-zinc-800 rounded-xl p-3 overflow-auto max-h-64 leading-relaxed">
                    {JSON.stringify(output, null, 2)}
                  </pre>
                  <button onClick={() => setOutput(null)} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                    Clear output
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 w-full">
                  <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center animate-pulse shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                    <Zap className="w-8 h-8 text-zinc-700" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm text-zinc-300 font-medium">No trigger output</p>
                    <p className="text-xs text-zinc-500">Run a test to see output</p>
                  </div>
                  <button
                    onClick={handleExecuteStep}
                    disabled={isRunning}
                    className="bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-all w-full shadow-lg shadow-orange-900/20 active:scale-[0.98]"
                  >
                    {isRunning ? "Running…" : "Test this trigger"}
                  </button>
                  <button className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">or set mock data</button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}
