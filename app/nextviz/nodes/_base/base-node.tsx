"use client";

/**
 * BaseNode — shared canvas wrapper for all NextViz nodes.
 *
 * Handles:
 *  - Hover state with a 150 ms grace period so the hover menu doesn't
 *    vanish while the user moves the cursor from the node body to the actions.
 *  - Trigger badge (⚡) rendering (opt-in via `showBadge`).
 *  - Label rendered below the node, falling back to `defaultLabel`.
 *  - React Flow Handle (source right / target left, opt-in).
 *  - Disabled (grayscale) state.
 *
 * Usage — minimum viable node:
 *
 *   export default function MyNode({ id, data, selected }: NodeProps) {
 *     return (
 *       <BaseNode id={id} data={data} selected={selected} defaultLabel="My Node" showBadge>
 *         <MyIcon className="w-11 h-11 text-zinc-200" strokeWidth={1.5} />
 *       </BaseNode>
 *     );
 *   }
 */

import { useRef, useState, ReactNode } from "react";
import { Handle, Position } from "reactflow";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { NodeHoverMenu } from "../../_components/node-hover-menu";

export interface BaseNodeData {
  label?: string;
  disabled?: boolean;
  [key: string]: unknown;
}

export interface BaseNodeProps {
  id: string;
  data: BaseNodeData;
  selected: boolean;
  children: ReactNode;
  defaultLabel: string;
  /** Show the ⚡ badge on the left (triggers only). Default false. */
  showBadge?: boolean;
  /** Show the source handle on the right. Default true. */
  showSourceHandle?: boolean;
  /** Show the target handle on the left. Default false. */
  showTargetHandle?: boolean;
}

export function BaseNode({
  id,
  data,
  selected,
  children,
  defaultLabel,
  showBadge = false,
  showSourceHandle = true,
  showTargetHandle = false,
}: BaseNodeProps) {
  const [hovered, setHovered] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setHovered(true);
  };

  const onLeave = () => {
    leaveTimer.current = setTimeout(() => setHovered(false), 150);
  };

  const label = (data?.label as string | undefined) || defaultLabel;

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
        {children}
      </div>

      {/* Trigger badge */}
      {showBadge && (
        <Zap className="absolute -left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400 fill-orange-400 pointer-events-none" />
      )}

      {/* Label */}
      <div
        className="absolute left-1/2 -translate-x-1/2 pointer-events-none text-center"
        style={{ top: 116, width: 180 }}
      >
        <p className="text-[11px] font-medium text-zinc-300 leading-snug">{label}</p>
      </div>

      {/* Handles */}
      {showTargetHandle && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-zinc-600 !border-2 !border-zinc-400"
        />
      )}
      {showSourceHandle && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-zinc-600 !border-2 !border-zinc-400"
        />
      )}

      {/* Hover menu — rendered inside onEnter/onLeave scope so it stays visible */}
      {hovered && <NodeHoverMenu nodeId={id} onMouseEnter={onEnter} onMouseLeave={onLeave} />}
    </div>
  );
}
