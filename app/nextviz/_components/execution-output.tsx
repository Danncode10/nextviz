"use client";

import { ChevronDown, ChevronRight, X, Copy, Check, AlertCircle, Code, MessageSquare, Activity } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type TabType = "output" | "problems" | "chat" | "logs";

interface ExecutionOutputProps {
  result: Record<string, unknown> | null;
  isExecuting: boolean;
  onClose: () => void;
}

export function ExecutionOutput({ result, isExecuting, onClose }: ExecutionOutputProps) {
  const [activeTab, setActiveTab] = useState<TabType>("output");
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

  // Extract problems (errors) from node outputs
  const problems = nodeIds
    .filter((nodeId) => {
      const data = nodeOutputs[nodeId];
      return data && (data.error || (data.status && typeof data.status === "number" && data.status >= 400));
    })
    .map((nodeId) => ({
      nodeId,
      message: (nodeOutputs[nodeId] as any)?.error || `HTTP ${(nodeOutputs[nodeId] as any)?.status}`,
      severity: "error" as const,
    }));

  const tabConfigs: Array<{ id: TabType; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: "output", label: "Output", icon: <Code className="w-4 h-4" />, badge: nodeIds.length },
    { id: "problems", label: "Problems", icon: <AlertCircle className="w-4 h-4" />, badge: problems.length > 0 ? problems.length : undefined },
    { id: "chat", label: "Chat", icon: <MessageSquare className="w-4 h-4" /> },
    { id: "logs", label: "Logs", icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="h-64 border-t border-border bg-zinc-950 flex flex-col shrink-0">
      {/* Header with tabs */}
      <div className="flex items-center border-b border-border shrink-0">
        <div className="flex items-center gap-0.5 px-0">
          {tabConfigs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "border-orange-500 text-orange-400 bg-zinc-900/30"
                  : "border-transparent text-zinc-500 hover:text-zinc-400 hover:bg-zinc-900/20"
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-orange-500/20 text-orange-400">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Status indicator + close button */}
        <div className="flex items-center gap-2 px-4">
          <div className={cn("w-2 h-2 rounded-full", isExecuting ? "bg-orange-400 animate-pulse" : "bg-emerald-400")} />
          <span className="text-[11px] text-zinc-600">{isExecuting ? "Executing…" : "Complete"}</span>
        </div>

        <button onClick={onClose} className="p-2 hover:bg-zinc-900 rounded transition-colors mr-1">
          <X className="w-4 h-4 text-zinc-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-zinc-950">
        {isExecuting && (
          <div className="flex items-center justify-center py-8 gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <p className="text-sm text-zinc-500">Running flow...</p>
          </div>
        )}

        {/* Output Tab */}
        {activeTab === "output" && !isExecuting && (
          <div className="space-y-0.5 p-3">
            {nodeIds.length === 0 ? (
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
                    <div
                      className="flex items-center gap-2 px-3 py-2.5 hover:bg-zinc-900 transition-colors cursor-pointer group"
                      onClick={() => toggleNode(nodeId)}
                    >
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
                        onClick={(e) => {
                          e.stopPropagation();
                          copyOutput(nodeId, data);
                        }}
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
        )}

        {/* Problems Tab */}
        {activeTab === "problems" && !isExecuting && (
          <div className="space-y-2 p-3">
            {problems.length === 0 ? (
              <div className="flex items-center justify-center py-8 gap-2">
                <Check className="w-5 h-5 text-emerald-500" />
                <p className="text-sm text-zinc-500">No problems detected</p>
              </div>
            ) : (
              problems.map((problem, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg border border-red-500/20 bg-red-500/5"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-red-500">{problem.nodeId}</p>
                    <p className="text-xs text-red-400/80 mt-1">{problem.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === "chat" && !isExecuting && (
          <div className="flex items-center justify-center py-12 text-center">
            <div className="space-y-2">
              <MessageSquare className="w-8 h-8 text-zinc-700 mx-auto" />
              <p className="text-sm text-zinc-600">No chat messages</p>
              <p className="text-xs text-zinc-700">Use Chat Trigger to enable chat mode</p>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === "logs" && !isExecuting && (
          <div className="space-y-1 p-3 font-mono text-xs">
            <div className="text-zinc-600">
              <span className="text-zinc-700">[</span>
              <span className="text-orange-500">INFO</span>
              <span className="text-zinc-700">]</span> Flow execution started
            </div>
            {nodeIds.map((nodeId, idx) => (
              <div key={nodeId} className="text-zinc-600">
                <span className="text-zinc-700">[</span>
                <span className="text-blue-500">LOG</span>
                <span className="text-zinc-700">]</span> Node <span className="text-zinc-400">{nodeId}</span> executed ({idx + 1}/{nodeIds.length})
              </div>
            ))}
            <div className="text-zinc-600">
              <span className="text-zinc-700">[</span>
              <span className="text-emerald-500">SUCCESS</span>
              <span className="text-zinc-700">]</span> Flow execution completed
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
