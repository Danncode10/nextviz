"use client";

import { NodeProps } from "reactflow";
import { MessageSquare } from "lucide-react";
import { BaseNode } from "../_base/base-node";

export default function ChatTriggerNode({ id, data, selected }: NodeProps) {
  return (
    <BaseNode id={id} data={data} selected={selected} defaultLabel="When chat message received" showBadge>
      <MessageSquare className="w-11 h-11 text-zinc-200" strokeWidth={1.5} />
    </BaseNode>
  );
}
