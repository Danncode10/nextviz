"use client";

import { NodeProps } from "reactflow";
import { MousePointer2 } from "lucide-react";
import { BaseNode } from "../_base/base-node";

export default function ManualTriggerNode({ id, data, selected }: NodeProps) {
  return (
    <BaseNode id={id} data={data} selected={selected} defaultLabel="When clicking 'Execute workflow'" showBadge>
      <MousePointer2 className="w-11 h-11 text-zinc-200" strokeWidth={1.5} />
    </BaseNode>
  );
}
