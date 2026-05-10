"use client";

import { useCallback, useEffect, useRef } from "react";
import { useReactFlow } from "reactflow";
import {
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
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Node catalogue shown in the popover ───────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

interface AddNodePopoverProps {
  sourceNodeId: string;
  onClose: () => void;
}

export function AddNodePopover({ sourceNodeId, onClose }: AddNodePopoverProps) {
  const { getNode, setNodes, setEdges } = useReactFlow();
  const ref = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Close on outside mousedown (inside canvas space, not DOM body)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    // Slight delay so the opening click doesn't immediately close
    const id = setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", handler);
    };
  }, [onClose]);

  const addNode = useCallback(
    (nodeType: string, label: string) => {
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
        data: { label },
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
    },
    [sourceNodeId, getNode, setNodes, setEdges, onClose]
  );

  return (
    <div
      ref={ref}
      className="w-[260px] bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl shadow-black/60 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
          Add next step
        </p>
        <button
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-zinc-800 transition-colors"
          onClick={onClose}
        >
          <X className="w-3.5 h-3.5 text-zinc-500" />
        </button>
      </div>

      {/* Node list */}
      <div className="max-h-[420px] overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        {NODE_GROUPS.map((group) => (
          <div key={group.label}>
            <p className={cn("px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest", group.color)}>
              {group.label}
            </p>
            {group.nodes.map((node) => (
              <button
                key={node.type}
                className="nodrag nopan w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800 transition-colors text-left"
                onClick={() => addNode(node.type, node.label)}
              >
                <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", group.bg)}>
                  <node.icon className={cn("w-3.5 h-3.5", group.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-zinc-200 truncate">{node.label}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{node.description}</p>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
