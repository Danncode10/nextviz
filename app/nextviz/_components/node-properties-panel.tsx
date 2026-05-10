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
  ChevronLeft,
  ChevronRight,
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
  defaultCollapsed?: boolean;
}

// ── Node catalogue ─────────────────────────────────────────────────────────────

const NODE_GROUPS = [
  {
    label: "Triggers",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    nodes: [
      { type: "onHTTP",          label: "HTTP Trigger",       description: "Fires when a webhook is called",     icon: Webhook },
      { type: "scheduleTrigger", label: "Schedule (Cron)",    description: "Run on an interval or cron expr.",   icon: Clock },
    ],
  },
  {
    label: "AI",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    nodes: [
      { type: "openaiAction",    label: "OpenAI / Anthropic", description: "Generate with LLMs",                icon: BrainCircuit },
    ],
  },
  {
    label: "Logic",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    nodes: [
      { type: "ifElseNode",      label: "Filter / If-Else",   description: "Branch on a condition",             icon: GitBranch },
      { type: "codeNode",        label: "Code (JS)",           description: "Run raw JavaScript",               icon: Code2 },
    ],
  },
  {
    label: "Data",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    nodes: [
      { type: "supabaseNode",    label: "Supabase DB",         description: "Read / write rows",                icon: Database },
      { type: "httpAction",      label: "HTTP Request",        description: "Call any REST API",                icon: Globe },
      { type: "logData",         label: "Log Data",            description: "Print to server console",          icon: ScrollText },
    ],
  },
  {
    label: "Messaging",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    nodes: [
      { type: "discordNode",     label: "Discord / Slack",     description: "Send a message to a channel",      icon: MessageSquare },
      { type: "emailNode",       label: "Gmail / Resend",      description: "Send an email",                    icon: Mail },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

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
    <div className="flex items-center justify-between py-1">
      <p className="text-xs text-zinc-300">{label}</p>
      <button
        onClick={() => onChange(!value)}
        aria-checked={value}
        role="switch"
        className={cn(
          "relative w-9 h-5 rounded-full transition-colors duration-200",
          value ? "bg-orange-600" : "bg-zinc-700"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
            value ? "translate-x-[18px]" : "translate-x-0.5"
          )}
        />
      </button>
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
  onNodeAdd,
  defaultCollapsed = false,
}: NodePropertiesPanelProps) {
  const { getNode, setNodes, setEdges } = useReactFlow();
  const [activeTab, setActiveTab] = useState<Tab>("parameters");
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // Settings state (mirrors n8n's per-node settings)
  const [alwaysOutputData, setAlwaysOutputData] = useState(
    node?.data?.alwaysOutputData ?? false
  );
  const [executeOnce, setExecuteOnce] = useState(node?.data?.executeOnce ?? false);
  const [retryOnFail, setRetryOnFail] = useState(node?.data?.retryOnFail ?? false);
  const [onError, setOnError] = useState<string>(
    node?.data?.onError ?? "stopWorkflow"
  );
  const [notes, setNotes] = useState<string>(node?.data?.notes ?? "");
  const [displayNote, setDisplayNote] = useState(node?.data?.displayNote ?? false);

  // Execution state
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
        // Simulation fallback
        await new Promise((r) => setTimeout(r, 600));
        setOutput({ executedAt: new Date().toISOString(), nodeId: node?.id });
      }
    } finally {
      setIsRunning(false);
    }
  };

  // Add node handler (for addNode mode)
  const handleAddNode = (nodeType: string, label: string) => {
    if (!sourceNodeId) return;

    const source = getNode(sourceNodeId);
    if (!source) return;

    const newId = `node-${Date.now()}`;
    const newNode = {
      id: newId,
      type: nodeType,
      position: {
        x: source.position.x + (source.width ?? 120) + 220,
        y: source.position.y,
      },
      data: {
        label,
        // Pass the onAddNode callback for future + button clicks on this node
        onAddNode: (sourceId: string) => setAddNodeMode(sourceId),
      },
    };
    const newEdge = {
      id: `edge-${sourceNodeId}-${newId}`,
      source: sourceNodeId,
      target: newId,
      animated: false,
    };

    setNodes((nds) => [...nds, newNode]);
    setEdges((eds) => [...eds, newEdge]);
    onClose();
  };

  // Render add-node mode
  if (mode === "addNode") {
    // Collapsed state: show small tab button
    if (isCollapsed) {
      return (
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed right-0 top-1/2 -translate-y-1/2 w-12 h-24 bg-zinc-800 border-l border-zinc-700 flex items-center justify-center hover:bg-zinc-700 transition-colors z-40 rounded-l-lg"
          title="Expand node palette"
        >
          <ChevronLeft className="w-5 h-5 text-zinc-400" />
        </button>
      );
    }

    return (
      <div className="fixed right-0 top-0 w-[500px] h-full border-l border-zinc-800 bg-zinc-950 flex flex-col shrink-0 overflow-hidden z-40 transition-transform duration-300">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="h-12 border-b border-zinc-800 flex items-center gap-3 px-4 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
            <Zap className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <span className="text-sm font-semibold text-zinc-200 flex-1">
            Add next step
          </span>
          <button
            onClick={() => setIsCollapsed(true)}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-800 transition-colors"
            title="Collapse"
          >
            <ChevronRight className="w-4 h-4 text-zinc-400" />
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        {/* ── Node list ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          {NODE_GROUPS.map((group) => (
            <div key={group.label}>
              <p className={cn("px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest", group.color)}>
                {group.label}
              </p>
              {group.nodes.map((node) => {
                const IconComponent = node.icon;
                return (
                  <button
                    key={node.type}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800 transition-colors text-left"
                    onClick={() => {
                      handleAddNode(node.type, node.label);
                    }}
                  >
                    <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", group.bg)}>
                      <IconComponent className={cn("w-3.5 h-3.5", group.color)} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-zinc-200 truncate">{node.label}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{node.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render view mode (normal properties panel)
  // Collapsed state: show small tab button
  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="fixed right-0 top-1/2 -translate-y-1/2 w-12 h-24 bg-zinc-800 border-l border-zinc-700 flex items-center justify-center hover:bg-zinc-700 transition-colors z-40 rounded-l-lg"
        title="Expand properties panel"
      >
        <ChevronLeft className="w-5 h-5 text-zinc-400" />
      </button>
    );
  }

  return (
    <div className="fixed right-0 top-0 w-[500px] h-full border-l border-zinc-800 bg-zinc-950 flex flex-col shrink-0 overflow-hidden z-40 transition-transform duration-300">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="h-12 border-b border-zinc-800 flex items-center gap-3 px-4 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
          <MousePointer2 className="w-3.5 h-3.5 text-zinc-300" strokeWidth={1.5} />
        </div>
        <span className="text-sm font-semibold text-zinc-200 flex-1 truncate">
          {nodeTitle}
        </span>
        <button className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors">
          Docs <ExternalLink className="w-3 h-3" />
        </button>
        <button
          onClick={() => setIsCollapsed(true)}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-800 transition-colors ml-1"
          title="Collapse"
        >
          <ChevronRight className="w-4 h-4 text-zinc-400" />
        </button>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      {/* ── Body ───────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Left — Parameters / Settings ───────────────────────── */}
        <div className="flex flex-col flex-1 border-r border-zinc-800 min-w-0">

          {/* Tabs + Execute step button */}
          <div className="border-b border-zinc-800 px-4 flex items-center gap-0.5 shrink-0 pt-0.5">
            {(["parameters", "settings"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-3 py-2.5 text-xs font-medium capitalize border-b-2 transition-colors",
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
                "mb-1 flex items-center gap-1.5 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors",
                isRunning
                  ? "bg-orange-700 opacity-70 cursor-wait"
                  : "bg-orange-600 hover:bg-orange-500"
              )}
            >
              <Zap className={cn("w-3 h-3", isRunning && "animate-pulse")} />
              {isRunning ? "Running…" : "Execute step"}
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === "parameters" && (
              <>
                {/* Info banner */}
                <div className="bg-zinc-800/60 border border-zinc-700/60 rounded-lg p-3 text-xs text-zinc-400 leading-relaxed">
                  This node is where the workflow execution starts (when you
                  click the{" "}
                  <span className="text-orange-400 font-medium">
                    &apos;Execute step&apos;
                  </span>{" "}
                  button above). You can also trigger this flow via{" "}
                  <span className="text-orange-400 font-medium">
                    a schedule, or a webhook
                  </span>
                  .
                </div>
                <p className="text-xs text-zinc-600 italic">
                  This node does not have any parameters.
                </p>
              </>
            )}

            {activeTab === "settings" && (
              <div className="space-y-4">
                <Toggle
                  label="Always Output Data"
                  value={alwaysOutputData}
                  onChange={setAlwaysOutputData}
                />
                <Toggle
                  label="Execute Once"
                  value={executeOnce}
                  onChange={setExecuteOnce}
                />
                <Toggle
                  label="Retry On Fail"
                  value={retryOnFail}
                  onChange={setRetryOnFail}
                />

                {/* On Error */}
                <div>
                  <p className="text-xs text-zinc-400 mb-1.5">On Error</p>
                  <div className="relative">
                    <select
                      value={onError}
                      onChange={(e) => setOnError(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-md px-3 py-2 appearance-none focus:outline-none focus:border-zinc-500 cursor-pointer"
                    >
                      <option value="stopWorkflow">Stop Workflow</option>
                      <option value="continueRegular">
                        Continue (Regular Output)
                      </option>
                      <option value="continueError">
                        Continue (Error Output)
                      </option>
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                      ▾
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <p className="text-xs text-zinc-400 mb-1.5">Notes</p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Add notes about this node…"
                    className="w-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-md px-3 py-2 resize-none focus:outline-none focus:border-zinc-500 placeholder:text-zinc-600"
                  />
                </div>

                <Toggle
                  label="Display Note in Flow?"
                  value={displayNote}
                  onChange={setDisplayNote}
                />

                <div className="pt-3 border-t border-zinc-800/60">
                  <p className="text-[10px] text-zinc-600">
                    Manual Trigger node version 1 (Latest)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right — Output ──────────────────────────────────────── */}
        <div className="w-[190px] flex flex-col shrink-0">
          <div className="border-b border-zinc-800 px-4 py-2 shrink-0">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Output
            </p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-5 gap-3">
            {output ? (
              <div className="w-full space-y-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <p className="text-[10px] font-medium text-emerald-400">
                    Trigger fired
                  </p>
                </div>
                <pre className="text-[9px] text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-md p-2 overflow-auto max-h-48 leading-relaxed">
                  {JSON.stringify(output, null, 2)}
                </pre>
                <button
                  onClick={() => setOutput(null)}
                  className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  Clear output
                </button>
              </div>
            ) : (
              <>
                <Zap className="w-6 h-6 text-zinc-700" />
                <p className="text-[11px] text-zinc-500 text-center font-medium">
                  No trigger output
                </p>
                <button
                  onClick={handleExecuteStep}
                  disabled={isRunning}
                  className="bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white text-[11px] font-medium px-4 py-2 rounded-md transition-colors w-full"
                >
                  {isRunning ? "Running…" : "Test this trigger"}
                </button>
                <button className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">
                  or set mock data
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
