"use client";

import { Handle, Position, NodeProps } from "reactflow";
import { MousePointer2, Zap, Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AddNodePopover } from "../_components/add-node-popover";

export default function ManualTriggerNode({ id, selected }: NodeProps) {
  const [showPopover, setShowPopover] = useState(false);

  return (
    // Root is exactly the node's visual bounding box (108×108).
    // Absolutely-positioned children (Zap, label, + button) extend
    // outside this box without affecting React Flow's hit-test size.
    <div className="relative" style={{ width: 108, height: 108 }}>

      {/* ── Node body ──────────────────────────────────────────── */}
      <div
        className={cn(
          "absolute inset-0 rounded-[22px] bg-zinc-800 border-2 flex items-center justify-center transition-all duration-150",
          selected
            ? "border-orange-500 shadow-[0_0_0_3px_rgba(249,115,22,0.18)]"
            : "border-zinc-700 hover:border-zinc-500"
        )}
      >
        <MousePointer2 className="w-11 h-11 text-zinc-200" strokeWidth={1.5} />
      </div>

      {/* ── Trigger badge (left) ───────────────────────────────── */}
      <Zap
        className="absolute -left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400 fill-orange-400 pointer-events-none"
      />

      {/* ── Label (bottom) ────────────────────────────────────── */}
      <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none text-center"
           style={{ top: 116, width: 180 }}>
        <p className="text-[11px] font-medium text-zinc-300 leading-snug">
          When clicking<br />&apos;Execute workflow&apos;
        </p>
      </div>

      {/* ── Source handle (right edge) ────────────────────────── */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-zinc-600 !border-2 !border-zinc-400"
      />

      {/* ── Add-node (+) button ───────────────────────────────── */}
      <button
        data-add-node-button="true"
        className={cn(
          "nodrag nopan absolute top-1/2 -translate-y-1/2 w-7 h-7",
          "rounded-lg bg-zinc-800 border border-zinc-600",
          "flex items-center justify-center transition-colors z-10",
          "hover:bg-zinc-700 hover:border-zinc-400",
          showPopover && "bg-zinc-700 border-zinc-400"
        )}
        style={{ right: -48 }}
        onClick={(e) => {
          e.stopPropagation();
          setShowPopover((v) => !v);
        }}
      >
        <Plus className="w-3.5 h-3.5 text-zinc-300" />
      </button>

      {/* ── Add-node popover ──────────────────────────────────── */}
      {showPopover && (
        <div
          className="nodrag nopan absolute z-50"
          style={{ left: 124, top: -12 }}
          onClick={(e) => e.stopPropagation()}
        >
          <AddNodePopover
            sourceNodeId={id}
            onClose={() => setShowPopover(false)}
          />
        </div>
      )}
    </div>
  );
}
