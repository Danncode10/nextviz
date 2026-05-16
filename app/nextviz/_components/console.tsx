"use client";

import { ChevronDown, ChevronRight, X, Copy, Check, AlertCircle, Code, MessageSquare, Activity, Send } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

type TabType = "output" | "problems" | "chat" | "logs";

export interface CanvasWarning {
  message: string;
  severity: "warning" | "error";
}

interface ExecutionOutputProps {
  result: Record<string, unknown> | null;
  isExecuting: boolean;
  onClose: () => void;
  initialTab?: TabType;
  chatMessages?: Array<{ role: "user" | "assistant"; content: string }>;
  onSendChatMessage?: (message: string) => Promise<string>;
  canvasWarnings?: CanvasWarning[];
}

export function Console({
  result,
  isExecuting,
  onClose,
  initialTab = "output",
  chatMessages = [],
  onSendChatMessage,
  canvasWarnings = [],
}: ExecutionOutputProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [height, setHeight] = useState(320);
  const [chatInput, setChatInput] = useState("");
  const [localChatMessages, setLocalChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>(chatMessages);
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localChatMessages]);

  // Handle resize dragging
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      startYRef.current = e.clientY;
      startHeightRef.current = height;
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const delta = startYRef.current - e.clientY; // Negative = drag up = increase height
      const newHeight = Math.max(200, Math.min(800, startHeightRef.current + delta));
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove as EventListener);
      document.removeEventListener("mouseup", handleMouseUp as EventListener);
    };

    const element = resizeRef.current?.querySelector("[data-resize-handle]") as HTMLElement | null;
    if (element) {
      element.addEventListener("mousedown", handleMouseDown as EventListener);
      return () => element.removeEventListener("mousedown", handleMouseDown as EventListener);
    }
  }, [height]);

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



  const nodeOutputs = (result as Record<string, Record<string, unknown>>) || {};
  const nodeIds = Object.keys(nodeOutputs).filter((id) => !id.match(/-model$|-memory$/));

  // Extract problems (errors) from node outputs
  const nodeProblems = nodeIds
    .filter((nodeId) => {
      const data = nodeOutputs[nodeId];
      return data && (data.error || (data.status && typeof data.status === "number" && data.status >= 400));
    })
    .map((nodeId) => ({
      nodeId,
      message: (nodeOutputs[nodeId] as any)?.error || `HTTP ${(nodeOutputs[nodeId] as any)?.status}`,
      severity: "error" as const,
    }));

  const problems = [
    ...canvasWarnings.map((w, i) => ({ nodeId: `canvas-${i}`, message: w.message, severity: w.severity })),
    ...nodeProblems,
  ];

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !onSendChatMessage) return;

    const userMessage = chatInput;
    setChatInput("");
    setLocalChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsSending(true);

    try {
      const response = await onSendChatMessage(userMessage);
      setLocalChatMessages((prev) => [...prev, { role: "assistant", content: response }]);
    } catch (error) {
      setLocalChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${error instanceof Error ? error.message : "Unknown error"}` },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const tabConfigs: Array<{ id: TabType; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: "output", label: "Output", icon: <Code className="w-4 h-4" />, badge: nodeIds.length },
    { id: "problems", label: "Problems", icon: <AlertCircle className="w-4 h-4" />, badge: problems.length > 0 ? problems.length : undefined },
    ...(initialTab === "chat" || onSendChatMessage ? [{ id: "chat" as TabType, label: "Chat", icon: <MessageSquare className="w-4 h-4" /> }] : []),
    { id: "logs", label: "Logs", icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div
      ref={resizeRef}
      style={{ height: `${height}px` }}
      className="border-t border-border bg-zinc-950 flex flex-col shrink-0 relative"
    >
      {/* Resize handle */}
      <div
        data-resize-handle
        className="absolute top-0 left-0 right-0 h-1 bg-orange-500/0 hover:bg-orange-500/50 cursor-ns-resize transition-colors group"
        title="Drag to resize"
      />

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
              problems.map((problem, idx) => {
                const isWarning = problem.severity === "warning";
                return (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border",
                      isWarning
                        ? "border-amber-500/20 bg-amber-500/5"
                        : "border-red-500/20 bg-red-500/5"
                    )}
                  >
                    <AlertCircle className={cn("w-4 h-4 flex-shrink-0 mt-0.5", isWarning ? "text-amber-400" : "text-red-500")} />
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-semibold", isWarning ? "text-amber-400" : "text-red-500")}>
                        {isWarning ? "Canvas Warning" : problem.nodeId}
                      </p>
                      <p className={cn("text-xs mt-1", isWarning ? "text-amber-400/80" : "text-red-400/80")}>{problem.message}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === "chat" && (
          <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3">
              {localChatMessages.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-center">
                  <div className="space-y-2">
                    <MessageSquare className="w-8 h-8 text-zinc-700 mx-auto" />
                    <p className="text-sm text-zinc-600">No messages yet</p>
                    <p className="text-xs text-zinc-700">Send a message to start chatting</p>
                  </div>
                </div>
              ) : (
                localChatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-xs px-3 py-2 rounded-lg text-sm",
                        msg.role === "user"
                          ? "bg-orange-600 text-white"
                          : "bg-zinc-800 text-zinc-200"
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-zinc-800 p-3 bg-zinc-900/50 shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  disabled={isSending || !onSendChatMessage}
                  className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded px-3 py-2 focus:outline-none focus:border-orange-500 disabled:opacity-50 placeholder:text-zinc-600"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isSending || !chatInput.trim() || !onSendChatMessage}
                  className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded transition-colors flex items-center gap-1"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
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
