"use client";

import { NodeProps, Handle, Position } from "reactflow";
import { Bot, AlertTriangle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import { NodeHoverMenu } from "../../_components/node-hover-menu";

interface AIAgentData {
  label?: string;
  disabled?: boolean;
  chatModel?: { type: string };
  memory?: { type: string };
  tools?: Array<{ id: string; type: string }>;
}

// ── Sub-port: diamond + label + + button ──────────────────────────────────────
function SubPort({ label, required }: { label: string; required?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5 nodrag nopan">
      {/* Connecting line from node bottom */}
      <div className="w-px h-5 bg-zinc-600" />
      {/* Diamond */}
      <div className="w-3 h-3 bg-zinc-900 border-2 border-zinc-500 rotate-45 shrink-0" />
      {/* Label */}
      <p className="text-[11px] text-zinc-500 whitespace-nowrap leading-none">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </p>
      {/* + button */}
      <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:bg-zinc-700 hover:border-zinc-500 cursor-pointer transition-colors">
        <Plus className="w-3.5 h-3.5 text-zinc-400" />
      </div>
    </div>
  );
}

// ── Node ──────────────────────────────────────────────────────────────────────
export default function AIAgentNode({ id, data, selected }: NodeProps<AIAgentData>) {
  const [hovered, setHovered] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasModel = !!data.chatModel?.type;

  const onEnter = () => { if (leaveTimer.current) clearTimeout(leaveTimer.current); setHovered(true); };
  const onLeave = () => { leaveTimer.current = setTimeout(() => setHovered(false), 150); };

  return (
    <div
      className={cn("relative", data.disabled && "opacity-50 grayscale-[0.5]")}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {/* Hover menu */}
      {hovered && <NodeHoverMenu nodeId={id} onMouseEnter={onEnter} onMouseLeave={onLeave} />}

      {/* ── Main node card ─────────────────────────────────────────────────── */}
      <div
        className={cn(
          "rounded-2xl bg-zinc-800 border-2 flex items-center gap-3 px-4 py-4 transition-all duration-150",
          selected
            ? "border-orange-500 shadow-[0_0_0_3px_rgba(249,115,22,0.18)]"
            : "border-zinc-700 hover:border-zinc-500"
        )}
        style={{ width: 280 }}
      >
        {/* Icon */}
        <div className="w-11 h-11 rounded-xl bg-zinc-700 flex items-center justify-center shrink-0">
          <Bot className="w-6 h-6 text-zinc-200" strokeWidth={1.5} />
        </div>

        {/* Title */}
        <span className="text-sm font-semibold text-zinc-100 flex-1">
          {data.label || "AI Agent"}
        </span>

        {/* Warning if no model configured */}
        {!hasModel && (
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
        )}
      </div>

      {/* ── Sub-component ports ────────────────────────────────────────────── */}
      <div className="flex justify-around pt-1 px-6">
        <SubPort label="Chat Model" required />
        <SubPort label="Memory" />
        <SubPort label="Tool" />
      </div>

      {/* ── React Flow Handles ─────────────────────────────────────────────── */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ top: 38 }}
        className="!w-3 !h-3 !bg-zinc-600 !border-2 !border-zinc-400"
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ top: 38 }}
        className="!w-3 !h-3 !bg-zinc-600 !border-2 !border-zinc-400"
      />
    </div>
  );
}
