"use client";

import { Handle, Position, NodeProps } from "reactflow";
import { MousePointer2, Zap } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { NodeHoverMenu } from "../_components/node-hover-menu";

export default function ManualTriggerNode({ id, data, selected }: NodeProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={cn("relative transition-opacity duration-200", data?.disabled && "opacity-50 grayscale-[0.5]")}
      style={{ width: 108, height: 108 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Node body */}
      <div
        className={cn(
          "absolute inset-0 rounded-[22px] bg-zinc-800 border-2 flex items-center justify-center transition-all duration-150",
          selected
            ? "border-orange-500 shadow-[0_0_0_3px_rgba(249,115,22,0.18)]"
            : "border-zinc-700 hover:border-zinc-500",
          data?.disabled && "border-zinc-800 bg-zinc-900"
        )}
      >
        <MousePointer2 className="w-11 h-11 text-zinc-200" strokeWidth={1.5} />
      </div>

      {/* Trigger badge */}
      <Zap className="absolute -left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400 fill-orange-400 pointer-events-none" />

      {/* Label */}
      <div
        className="absolute left-1/2 -translate-x-1/2 pointer-events-none text-center"
        style={{ top: 116, width: 180 }}
      >
        <p className="text-[11px] font-medium text-zinc-300 leading-snug">
          When clicking<br />&apos;Execute workflow&apos;
        </p>
      </div>

      {/* Source handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-zinc-600 !border-2 !border-zinc-400"
      />

      {/* Hover menu */}
      {hovered && <NodeHoverMenu nodeId={id} />}
    </div>
  );
}
