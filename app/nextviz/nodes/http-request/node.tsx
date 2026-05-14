"use client";

import { Handle, Position, NodeProps } from "reactflow";
import { Globe } from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { NodeHoverMenu } from "../../_components/node-hover-menu";

const METHOD_COLORS: Record<string, string> = {
  GET: "text-green-400",
  POST: "text-blue-400",
  PUT: "text-yellow-400",
  PATCH: "text-orange-400",
  DELETE: "text-red-400",
};

export default function HttpRequestNode({ id, data, selected }: NodeProps) {
  const [hovered, setHovered] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDisabled = data?.disabled;

  const method = (data?.method as string) || "GET";
  const url = (data?.url as string) || "";

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
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" />

      <div className="bg-orange-500/10 px-4 py-2 border-b border-border flex items-center gap-2 rounded-t-xl">
        <Globe className="w-4 h-4 text-orange-500" />
        <span className="font-semibold text-sm">HTTP Request</span>
      </div>

      <div className="p-4 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-bold font-mono", METHOD_COLORS[method] ?? "text-zinc-400")}>
            {method}
          </span>
          {url ? (
            <span className="text-xs text-muted-foreground truncate">{url}</span>
          ) : (
            <span className="text-xs text-zinc-600 italic">No URL set</span>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" />
      {hovered && <NodeHoverMenu nodeId={id} onMouseEnter={onEnter} onMouseLeave={onLeave} />}
    </div>
  );
}
