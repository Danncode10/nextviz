"use client";

import { ChevronDown, ChevronRight, X, Copy, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ExecutionOutputProps {
  result: Record<string, unknown> | null;
  isExecuting: boolean;
  onClose: () => void;
}

export function ExecutionOutput({ result, isExecuting, onClose }: ExecutionOutputProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleNode = (nodeId: string) => {
    const next = new Set(expandedNodes);
    if (next.has(nodeId)) next.delete(nodeId);
    else next.add(nodeId);
    setExpandedNodes(next);
  };

  const copyOutput = (nodeId: string, data: unknown) => {
    const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(text);
    setCopiedId(nodeId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!result && !isExecuting) return null;

  const nodeOutputs = (result as Record<string, Record<string, unknown>>) || {};
  const nodeIds = Object.keys(nodeOutputs).filter((id) => !id.match(/-model$|-memory$/));

  return (
    <div className="h-56 border-t border-border bg-card flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", isExecuting ? "bg-orange-400 animate-pulse" : "bg-emerald-400")} />
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
            {isExecuting ? "Executing…" : "Execution Output"}
          </p>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded transition-colors">
          <X className="w-4 h-4 text-zinc-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-0.5 p-3">
        {isExecuting ? (
          <div className="flex items-center justify-center py-8 gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <p className="text-sm text-zinc-500">Running flow...</p>
          </div>
        ) : nodeIds.length === 0 ? (
          <p className="text-xs text-zinc-600 py-8 text-center">No output yet</p>
        ) : (
          nodeIds.map((nodeId) => {
            const data = nodeOutputs[nodeId];
            const isExpanded = expandedNodes.has(nodeId);
            const isObject = typeof data === "object";
            const preview = isObject
              ? `{${Object.keys((data as Record<string, unknown>) || {}).length} fields}`
              : typeof data === "string"
              ? (data as string).slice(0, 60)
              : String(data).slice(0, 60);

            return (
              <div key={nodeId} className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-zinc-900 transition-colors cursor-pointer group"
                  onClick={() => toggleNode(nodeId)}>
                  {isObject && (
                    <>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-zinc-600" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-zinc-600" />
                      )}
                    </>
                  )}
                  <span className="text-xs font-mono text-zinc-400 flex-1 truncate">{nodeId}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); copyOutput(nodeId, data); }}
                    className="p-1 rounded hover:bg-zinc-800 transition-colors opacity-0 group-hover:opacity-100"
                    title="Copy output"
                  >
                    {copiedId === nodeId ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-zinc-600" />
                    )}
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-zinc-800/50 bg-zinc-950/50 px-3 py-2.5">
                    <pre className="text-xs text-zinc-400 font-mono overflow-auto max-h-32 whitespace-pre-wrap break-words">
                      {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
                    </pre>
                  </div>
                )}

                {!isExpanded && (
                  <div className="px-3 py-1.5 text-[11px] text-zinc-600 border-t border-zinc-800/50 bg-zinc-950/30">
                    {preview}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
