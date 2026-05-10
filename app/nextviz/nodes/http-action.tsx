"use client";

import { Handle, Position, NodeProps } from "reactflow";
import { Globe } from "lucide-react";
import { useState } from "react";
import { NodeHoverMenu } from "../_components/node-hover-menu";

export default function HttpActionNode({ id, data, selected }: NodeProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="relative w-64 bg-card border-2 text-card-foreground rounded-xl shadow-sm overflow-visible transition-colors"
      style={{ borderColor: selected ? "rgb(249,115,22)" : "hsl(var(--border))" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" />
      <div className="bg-orange-500/10 px-4 py-2 border-b border-border flex items-center gap-2 rounded-t-xl">
        <Globe className="w-4 h-4 text-orange-500" />
        <span className="font-semibold text-sm">HTTP Request</span>
      </div>
      <div className="p-4">
        <p className="text-xs text-muted-foreground">{data.label || "Send an HTTP GET or POST request."}</p>
      </div>
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" />
      {hovered && <NodeHoverMenu nodeId={id} />}
    </div>
  );
}
