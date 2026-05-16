"use client";

import { NodeProps } from "reactflow";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { BaseNode, BaseNodeData } from "../_base/base-node";

const METHOD_COLORS: Record<string, string> = {
  GET:     "text-emerald-400",
  POST:    "text-blue-400",
  PUT:     "text-yellow-400",
  PATCH:   "text-orange-400",
  DELETE:  "text-red-400",
  HEAD:    "text-purple-400",
  OPTIONS: "text-zinc-400",
};

export default function HttpRequestNode({ id, data, selected }: NodeProps<BaseNodeData>) {
  const method      = (data?.method as string) || "GET";
  const url         = (data?.url as string)    || "";
  const methodColor = METHOD_COLORS[method]    ?? "text-zinc-400";

  let displayUrl = "";
  try {
    displayUrl = url ? new URL(url).hostname : "";
  } catch {
    displayUrl = url.slice(0, 20);
  }

  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      defaultLabel="HTTP Request"
      showTargetHandle
      showSourceHandle
      subtitle={
        <p className={cn("text-[10px] font-mono", methodColor)}>
          {method}{displayUrl ? `: ${displayUrl}` : ""}
        </p>
      }
    >
      <Globe className="w-11 h-11 text-emerald-400" strokeWidth={1.5} />
    </BaseNode>
  );
}
