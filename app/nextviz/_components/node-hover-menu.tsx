"use client";

import { useReactFlow } from "reactflow";
import { Copy, Trash2, Play, Power, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface NodeHoverMenuProps {
  nodeId: string;
}

export function NodeHoverMenu({ nodeId }: NodeHoverMenuProps) {
  const { getNode, setNodes, setEdges } = useReactFlow();
  const node = getNode(nodeId);
  const isDisabled = node?.data?.disabled ?? false;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!node) return;
    const newId = `node-${Date.now()}`;
    setNodes((nds) => [
      ...nds,
      {
        ...node,
        id: newId,
        selected: false,
        position: { x: node.position.x + 30, y: node.position.y + 30 },
      },
    ]);
  };

  const handleDeactivate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId) {
          return { ...n, data: { ...n.data, disabled: !isDisabled } };
        }
        return n;
      })
    );
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    // In a real engine, this would trigger an execution bridge
    console.log("Playing node:", nodeId);
  };

  return (
    <div
      className="nodrag nopan absolute -top-12 left-1/2 -translate-x-1/2 bg-[#1a1a1b] border border-zinc-800 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.5)] z-50 flex items-center gap-1.5 p-1 px-2.5 animate-in fade-in zoom-in-95 duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="p-1.5 rounded-full hover:bg-zinc-800 transition-all group/play"
        title="Execute node"
        onClick={handlePlay}
      >
        <Play className="w-3.5 h-3.5 text-zinc-400 group-hover/play:text-zinc-100 fill-zinc-400 group-hover/play:fill-zinc-100 transition-colors" />
      </button>

      <button
        className={cn(
          "p-1.5 rounded-full hover:bg-zinc-800 transition-all group/power",
          isDisabled && "bg-orange-500/10"
        )}
        title={isDisabled ? "Activate node" : "Deactivate node"}
        onClick={handleDeactivate}
      >
        <Power className={cn(
          "w-3.5 h-3.5 transition-colors",
          isDisabled ? "text-orange-500" : "text-zinc-400 group-hover/power:text-zinc-100"
        )} />
      </button>

      <button
        className="p-1.5 rounded-full hover:bg-red-500/10 transition-all group/del"
        title="Delete node"
        onClick={handleDelete}
      >
        <Trash2 className="w-3.5 h-3.5 text-zinc-400 group-hover/del:text-red-500 transition-colors" />
      </button>
    </div>
  );
}
