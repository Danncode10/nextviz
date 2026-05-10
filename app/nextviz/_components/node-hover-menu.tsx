"use client";

import { useReactFlow } from "reactflow";
import { Copy, Trash2 } from "lucide-react";

interface NodeHoverMenuProps {
  nodeId: string;
}

export function NodeHoverMenu({ nodeId }: NodeHoverMenuProps) {
  const { getNode, setNodes, setEdges } = useReactFlow();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const node = getNode(nodeId);
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

  return (
    <div
      className="nodrag nopan absolute bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 flex items-center gap-0.5 p-1"
      style={{ top: -10, right: -6 }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="p-1.5 rounded hover:bg-zinc-700 transition-colors group/copy"
        title="Duplicate node"
        onClick={handleCopy}
      >
        <Copy className="w-3.5 h-3.5 text-zinc-400 group-hover/copy:text-zinc-200 transition-colors" />
      </button>
      <button
        className="p-1.5 rounded hover:bg-red-900/40 transition-colors group/del"
        title="Delete node"
        onClick={handleDelete}
      >
        <Trash2 className="w-3.5 h-3.5 text-zinc-400 group-hover/del:text-red-400 transition-colors" />
      </button>
    </div>
  );
}
