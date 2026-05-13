"use client";

import { useState } from "react";
import { Bot, Clock, Globe, MessageSquare, Play, ScrollText, Search, Webhook, ChevronRight, PanelRight } from "lucide-react";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";

const NODE_PALETTE = [
  {
    group: "Triggers",
    nodes: [
      { type: "manualTrigger",   label: "Manual Trigger",   icon: Play,  color: "text-orange-400" },
      { type: "scheduleTrigger", label: "Schedule Trigger", icon: Clock,         color: "text-orange-400" },
      { type: "chatTrigger",    label: "Chat Trigger",     icon: MessageSquare, color: "text-orange-400" },
      { type: "onHTTP",         label: "HTTP Trigger",     icon: Webhook,       color: "text-violet-400" },
    ],
  },
  {
    group: "AI",
    nodes: [
      { type: "aiAgent", label: "AI Agent", icon: Bot, color: "text-blue-400" },
    ],
  },
  {
    group: "Actions",
    nodes: [
      { type: "httpAction", label: "HTTP Action", icon: Globe, color: "text-emerald-400" },
      { type: "logData", label: "Log Data", icon: ScrollText, color: "text-blue-400" },
    ],
  },
];

export default function RightSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.setData("application/reactflow-label", label);
    event.dataTransfer.effectAllowed = "move";
  };

  const filtered = NODE_PALETTE.map((group) => ({
    ...group,
    nodes: group.nodes.filter((n) =>
      n.label.toLowerCase().includes(query.toLowerCase())
    ),
  })).filter((group) => group.nodes.length > 0);

  // ── Collapsed: thin icon strip ────────────────────────────────────────────
  if (collapsed) {
    return (
      <div className="h-screen w-12 bg-card border-l border-border flex flex-col items-center py-3 gap-3 shrink-0">
        <button
          onClick={() => setCollapsed(false)}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-zinc-800 transition-colors"
          title="Expand node palette"
        >
          <PanelRight className="w-4 h-4 text-zinc-400" />
        </button>
        <div className="w-5 h-px bg-zinc-800" />
        {NODE_PALETTE.flatMap((g) => g.nodes).map((node) => (
          <button
            key={node.type}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-zinc-800 transition-colors cursor-grab active:cursor-grabbing"
            title={node.label}
            draggable
            onDragStart={(e) => onDragStart(e, node.type, node.label)}
          >
            <node.icon className={cn("w-4 h-4 shrink-0", node.color)} />
          </button>
        ))}
      </div>
    );
  }

  // ── Expanded: full palette ─────────────────────────────────────────────────
  return (
    <div className="h-screen w-56 bg-card border-l border-border flex flex-col shrink-0">
      {/* Header */}
      <div className="border-b border-border py-3 px-3 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Node Palette
          </p>
          <button
            onClick={() => setCollapsed(true)}
            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-zinc-800 transition-colors"
            title="Collapse palette"
          >
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search nodes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* Node list */}
      <div className="flex-1 overflow-y-auto py-2">
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center px-4 py-6">
            No nodes match &ldquo;{query}&rdquo;
          </p>
        ) : (
          filtered.map((group) => (
            <div key={group.group} className="mb-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1">
                {group.group}
              </p>
              {group.nodes.map((node) => (
                <div
                  key={node.type}
                  className="flex items-center gap-2.5 px-3 py-2 cursor-grab active:cursor-grabbing hover:bg-zinc-800 transition-colors select-none"
                  draggable
                  onDragStart={(e) => onDragStart(e, node.type, node.label)}
                >
                  <node.icon className={cn("w-4 h-4 shrink-0", node.color)} />
                  <span className="text-xs text-zinc-300">{node.label}</span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
