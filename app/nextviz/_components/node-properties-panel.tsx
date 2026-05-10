"use client";

import { useState } from "react";
import { Node } from "reactflow";
import { useReactFlow } from "reactflow";
import {
  X,
  ExternalLink,
  MousePointer2,
  Zap,
  Webhook,
  Globe,
  ScrollText,
  Clock,
  BrainCircuit,
  Database,
  GitBranch,
  Code2,
  MessageSquare,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "parameters" | "settings";

interface NodePropertiesPanelProps {
  node: Node | null;
  mode: "view" | "addNode";
  sourceNodeId?: string;
  setAddNodeMode: (nodeId: string | null) => void;
  onClose: () => void;
  onExecuteStep?: (nodeId: string) => Promise<Record<string, unknown>>;
  onNodeAdd?: (nodeType: string, label: string) => void;
}

// ── Node catalogue ────────────────────────────────────────────────────────────

const NODE_GROUPS = [
  {
    label: "Triggers",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    nodes: [
      { type: "onHTTP",          label: "HTTP Trigger",       description: "Fires when a webhook is called",   icon: Webhook },
      { type: "scheduleTrigger", label: "Schedule (Cron)",    description: "Run on an interval or cron expr.", icon: Clock },
    ],
  },
  {
    label: "AI",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    nodes: [
      { type: "openaiAction",    label: "OpenAI / Anthropic", description: "Generate with LLMs",              icon: BrainCircuit },
    ],
  },
  {
    label: "Logic",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    nodes: [
      { type: "ifElseNode",      label: "Filter / If-Else",   description: "Branch on a condition",           icon: GitBranch },
      { type: "codeNode",        label: "Code (JS)",           description: "Run raw JavaScript",             icon: Code2 },
    ],
  },
  {
    label: "Data",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    nodes: [
      { type: "supabaseNode",    label: "Supabase DB",         description: "Read / write rows",              icon: Database },
      { type: "httpAction",      label: "HTTP Request",        description: "Call any REST API",              icon: Globe },
      { type: "logData",         label: "Log Data",            description: "Print to server console",        icon: ScrollText },
    ],
  },
  {
    label: "Messaging",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    nodes: [
      { type: "discordNode",     label: "Discord / Slack",     description: "Send a message to a channel",   icon: MessageSquare },
      { type: "emailNode",       label: "Gmail / Resend",      description: "Send an email",                 icon: Mail },
    ],
  },
];

// ── Toggle helper ─────────────────────────────────────────────────────────────

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <p className="text-sm text-zinc-300">{label}</p>
      <button
        onClick={() => onChange(!value)}
        aria-checked={value}
        role="switch"
        className={cn(
          "relative w-10 h-5 rounded-full transition-colors duration-200",
          value ? "bg-orange-600" : "bg-zinc-700"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
            value ? "translate-x-[22px]" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}

// ── Backdrop wrapper ──────────────────────────────────────────────────────────

function ModalBackdrop({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
    >
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />
      {/* Modal content sits above the backdrop */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-6">
        {children}
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function NodePropertiesPanel({
  node,
  mode,
  sourceNodeId,
  setAddNodeMode,
  onClose,
  onExecuteStep,
}: NodePropertiesPanelProps) {
  const { getNode, setNodes, setEdges } = useReactFlow();
  const [activeTab, setActiveTab] = useState<Tab>("parameters");

  const [alwaysOutputData, setAlwaysOutputData] = useState(node?.data?.alwaysOutputData ?? false);
  const [executeOnce,      setExecuteOnce]      = useState(node?.data?.executeOnce ?? false);
  const [retryOnFail,      setRetryOnFail]      = useState(node?.data?.retryOnFail ?? false);
  const [onError,          setOnError]          = useState<string>(node?.data?.onError ?? "stopWorkflow");
  const [notes,            setNotes]            = useState<string>(node?.data?.notes ?? "");
  const [displayNote,      setDisplayNote]      = useState(node?.data?.displayNote ?? false);

  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<Record<string, unknown> | null>(null);

  const nodeTitle: string = node?.data?.label ?? "When clicking 'Execute workflow'";

  const handleExecuteStep = async () => {
    setIsRunning(true);
    try {
      if (onExecuteStep && node) {
        const result = await onExecuteStep(node.id);
        setOutput(result);
      } else {
        await new Promise((r) => setTimeout(r, 600));
        setOutput({ executedAt: new Date().toISOString(), nodeId: node?.id });
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleAddNode = (nodeType: string, label: string) => {
    if (!sourceNodeId) return;
    const source = getNode(sourceNodeId);
    if (!source) return;

    const newId = `node-${Date.now()}`;
    setNodes((nds) => [
      ...nds,
      {
        id: newId,
        type: nodeType,
        position: {
          x: source.position.x + (source.width ?? 120) + 220,
          y: source.position.y,
        },
        data: {
          label,
          onAddNode: (sid: string) => setAddNodeMode(sid),
        },
      },
    ]);
    setEdges((eds) => [
      ...eds,
      { id: `edge-${sourceNodeId}-${newId}`, source: sourceNodeId, target: newId, animated: false },
    ]);
    onClose();
  };

  // ── Add-node mode ─────────────────────────────────────────────────────────

  if (mode === "addNode") {
    return (
      <ModalBackdrop onClose={onClose}>
        <div
          className="w-full max-w-2xl max-h-[80vh] bg-zinc-900 rounded-xl border border-zinc-700/80 shadow-2xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="h-12 border-b border-zinc-800 flex items-center gap-3 px-5 shrink-0">
            <Zap className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-semibold text-zinc-200 flex-1">Add next step</span>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4 text-zinc-400" />
            </button>
          </div>

          {/* Node list — 2 column grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {NODE_GROUPS.map((group) => (
              <div key={group.label} className="mb-4">
                <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-2", group.color)}>
                  {group.label}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {group.nodes.map((n) => {
                    const Icon = n.icon;
                    return (
                      <button
                        key={n.type}
                        onClick={() => handleAddNode(n.type, n.label)}
                        className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/60 border border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600 transition-all text-left"
                      >
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", group.bg)}>
                          <Icon className={cn("w-4 h-4", group.color)} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-zinc-200 truncate">{n.label}</p>
                          <p className="text-[10px] text-zinc-500 truncate leading-tight mt-0.5">{n.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ModalBackdrop>
    );
  }

  // ── View mode: full-screen node modal ─────────────────────────────────────

  return (
    <ModalBackdrop onClose={onClose}>
      <div
        className="w-full h-full max-w-[1100px] max-h-[90vh] bg-zinc-900 rounded-xl border border-zinc-700/60 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Top bar ─────────────────────────────────────────────── */}
        <div className="h-13 border-b border-zinc-800 flex items-center gap-3 px-5 py-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
            <MousePointer2 className="w-4 h-4 text-zinc-300" strokeWidth={1.5} />
          </div>
          <span className="text-base font-semibold text-zinc-100 flex-1 truncate">
            {nodeTitle}
          </span>
          <button className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mr-2">
            Docs <ExternalLink className="w-3 h-3" />
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0">

          {/* Left — Parameters / Settings ───────────────────────── */}
          <div className="flex flex-col flex-1 border-r border-zinc-800 min-w-0">

            {/* Tab bar */}
            <div className="border-b border-zinc-800 px-5 flex items-center gap-1 shrink-0">
              {(["parameters", "settings"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-4 py-3 text-sm font-medium capitalize border-b-2 transition-colors",
                    activeTab === tab
                      ? "border-orange-500 text-orange-400"
                      : "border-transparent text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {tab}
                </button>
              ))}
              <div className="flex-1" />
              <button
                onClick={handleExecuteStep}
                disabled={isRunning}
                className={cn(
                  "flex items-center gap-2 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors",
                  isRunning
                    ? "bg-orange-700 opacity-70 cursor-wait"
                    : "bg-orange-600 hover:bg-orange-500"
                )}
              >
                <Zap className={cn("w-3.5 h-3.5", isRunning && "animate-pulse")} />
                {isRunning ? "Running…" : "Execute step"}
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeTab === "parameters" && (
                <>
                  <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 text-sm text-zinc-400 leading-relaxed">
                    This node is where the workflow execution starts (when you click the{" "}
                    <span className="text-orange-400 font-medium">&apos;Execute step&apos;</span> button
                    above). You can also trigger this flow via{" "}
                    <span className="text-orange-400 font-medium">a schedule, or a webhook</span>.
                  </div>
                  <p className="text-sm text-zinc-600 italic">This node does not have any parameters.</p>
                </>
              )}

              {activeTab === "settings" && (
                <div className="space-y-1 max-w-lg">
                  <Toggle label="Always Output Data" value={alwaysOutputData} onChange={setAlwaysOutputData} />
                  <Toggle label="Execute Once"        value={executeOnce}      onChange={setExecuteOnce} />
                  <Toggle label="Retry On Fail"       value={retryOnFail}      onChange={setRetryOnFail} />

                  <div className="pt-2">
                    <p className="text-sm text-zinc-400 mb-2">On Error</p>
                    <div className="relative">
                      <select
                        value={onError}
                        onChange={(e) => setOnError(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2.5 appearance-none focus:outline-none focus:border-zinc-500 cursor-pointer"
                      >
                        <option value="stopWorkflow">Stop Workflow</option>
                        <option value="continueRegular">Continue (Regular Output)</option>
                        <option value="continueError">Continue (Error Output)</option>
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">▾</div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-sm text-zinc-400 mb-2">Notes</p>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      placeholder="Add notes about this node…"
                      className="w-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:border-zinc-500 placeholder:text-zinc-600"
                    />
                  </div>

                  <Toggle label="Display Note in Flow?" value={displayNote} onChange={setDisplayNote} />

                  <div className="pt-4 border-t border-zinc-800/60 mt-4">
                    <p className="text-xs text-zinc-600">Manual Trigger node version 1 (Latest)</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right — Output ──────────────────────────────────────── */}
          <div className="w-[320px] flex flex-col shrink-0">
            <div className="border-b border-zinc-800 px-5 py-3 shrink-0">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Output</p>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
              {output ? (
                <div className="w-full space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <p className="text-xs font-medium text-emerald-400">Trigger fired</p>
                  </div>
                  <pre className="text-[11px] text-zinc-400 bg-zinc-950 border border-zinc-800 rounded-lg p-3 overflow-auto max-h-64 leading-relaxed">
                    {JSON.stringify(output, null, 2)}
                  </pre>
                  <button
                    onClick={() => setOutput(null)}
                    className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    Clear output
                  </button>
                </div>
              ) : (
                <>
                  <Zap className="w-8 h-8 text-zinc-700" />
                  <p className="text-sm text-zinc-500 text-center font-medium">No trigger output</p>
                  <button
                    onClick={handleExecuteStep}
                    disabled={isRunning}
                    className="bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors w-full"
                  >
                    {isRunning ? "Running…" : "Test this trigger"}
                  </button>
                  <button className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                    or set mock data
                  </button>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </ModalBackdrop>
  );
}
