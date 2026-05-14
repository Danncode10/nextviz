"use client";

import { useRef, useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { NodeHoverMenu } from "../../_components/node-hover-menu";

const METHOD_COLORS: Record<string, string> = {
  GET: "text-emerald-400",
  POST: "text-blue-400",
  PUT: "text-yellow-400",
  PATCH: "text-orange-400",
  DELETE: "text-red-400",
};

export default function HttpRequestNode({ id, data, selected }: NodeProps) {
  const [hovered, setHovered] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onEnter = () => { if (leaveTimer.current) clearTimeout(leaveTimer.current); setHovered(true); };
  const onLeave = () => { leaveTimer.current = setTimeout(() => setHovered(false), 150); };

  const method = (data?.method as string) || "GET";
  const url = (data?.url as string) || "";
  const methodColor = METHOD_COLORS[method] ?? "text-zinc-400";

  let displayUrl = "";
  try {
    displayUrl = url ? new URL(url).hostname : "";
  } catch {
    displayUrl = url.slice(0, 20);
  }

  return (
    <div
      className={cn("relative transition-opacity duration-200", data.disabled && "opacity-50 grayscale-[0.5]")}
      style={{ width: 108, height: 108 }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {/* Node body */}
      <div
        className={cn(
          "absolute inset-0 rounded-[22px] bg-zinc-800 border-2 flex items-center justify-center transition-all duration-150",
          selected
            ? "border-orange-500 shadow-[0_0_0_3px_rgba(249,115,22,0.18)]"
            : "border-zinc-700 hover:border-zinc-500",
          data.disabled && "border-zinc-800 bg-zinc-900"
        )}
      >
        <Globe className="w-11 h-11 text-emerald-400" strokeWidth={1.5} />
      </div>

      {/* Label below */}
      <div
        className="absolute left-1/2 -translate-x-1/2 pointer-events-none text-center"
        style={{ top: 116, width: 180 }}
      >
        <p className="text-[11px] font-medium text-zinc-300 leading-snug">HTTP Request</p>
        <p className={cn("text-[10px] font-mono mt-0.5", methodColor)}>
          {method}{displayUrl ? `: ${displayUrl}` : ""}
        </p>
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-zinc-600 !border-2 !border-zinc-400" />
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-zinc-600 !border-2 !border-zinc-400" />

      {hovered && <NodeHoverMenu nodeId={id} onMouseEnter={onEnter} onMouseLeave={onLeave} />}
    </div>
  );
}
