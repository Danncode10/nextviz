"use client";

import { NodeProps } from "reactflow";
import { Clock } from "lucide-react";
import { BaseNode } from "../_base/base-node";

export default function ScheduleTriggerNode({ id, data, selected }: NodeProps) {
  return (
    <BaseNode id={id} data={data} selected={selected} defaultLabel="Schedule Trigger" showBadge>
      <Clock className="w-11 h-11 text-zinc-200" strokeWidth={1.5} />
    </BaseNode>
  );
}
