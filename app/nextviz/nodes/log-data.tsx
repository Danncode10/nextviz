"use client";

import { Handle, Position, NodeProps } from "reactflow";
import { ScrollText } from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { NodeHoverMenu } from "../_components/node-hover-menu";

export default function LogDataNode({ id, data, selected }: NodeProps) {
  const [hovered, setHovered] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDisabled = data?.disabled;

  const onEnter = () => { if (leaveTimer.current) clearTimeout(leaveTimer.current); setHovered(true); };
  const onLeave = () => { leaveTimer.current = setTimeout(() => setHovered(false), 150); };

  return (
    <div
      className={cn(
        "relative w-64 bg-card border-2 text-card-foreground rounded-xl shadow-sm overflow-visible transition-all duration-200",
        isDisabled && "opacity-50 grayscale-[0.5] scale-[0.98]"
      )}
      style={{ borderColor: selected ? "rgb(249,115,22)" : "hsl(var(--border))" }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div className="bg-emerald-500/10 px-4 py-2 border-b border-border flex items-center gap-2 rounded-t-xl">
        <ScrollText className="w-4 h-4 text-emerald-400" />
        <span className="font-semibold text-sm">Log Data</span>
      </div>
      <div className="p-4">
        <p className="text-xs text-muted-foreground">{data.label || "Logs all incoming data to the server console."}</p>
      </div>
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-background" />
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-background" />
      {hovered && <NodeHoverMenu nodeId={id} onMouseEnter={onEnter} onMouseLeave={onLeave} />}
    </div>
  );
}
