"use client";

import { useState, useRef, useCallback } from "react";
import { MessageSquare, RotateCcw, ChevronDown, MoreHorizontal, Send } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatWindowProps {
  onClose: () => void;
  executionResult?: any;
  isExecuting?: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateSessionId() {
  return Math.random().toString(36).substring(2, 10);
}

// ── Component ──────────────────────────────────────────────────────────────────

export function ChatWindow({ onClose, executionResult, isExecuting }: ChatWindowProps) {
  const [messages, setMessages]   = useState<ChatMessage[]>([]);
  const [input, setInput]         = useState("");
  const [sessionId, setSessionId] = useState(generateSessionId);

  const logs = executionResult
    ? [
        executionResult.success
          ? `✅ Execution succeeded in ${executionResult.result?.completedAt ? new Date(executionResult.result.completedAt).getTime() - new Date(executionResult.result.startedAt).getTime() : '?'}ms`
          : `❌ Error: ${executionResult.error}`,
        ...(executionResult.result?.nodeOutputs ? [`Total nodes executed: ${Object.keys(executionResult.result.nodeOutputs).length}`] : []),
      ]
    : [];

  const inputRef      = useRef<HTMLTextAreaElement>(null);
  const messagesEnd   = useRef<HTMLDivElement>(null);
  const msgHistory    = useRef<string[]>([]);
  const historyIdx    = useRef(-1);

  const scrollToBottom = () =>
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });

  const resetSession = () => {
    setMessages([]);
    setSessionId(generateSessionId());
    msgHistory.current = [];
    historyIdx.current = -1;
  };

  const sendMessage = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    msgHistory.current.unshift(trimmed);
    historyIdx.current = -1;
    setMessages((prev) => [...prev, msg]);
    setInput("");
    setTimeout(scrollToBottom, 50);
    inputRef.current?.focus();
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = historyIdx.current + 1;
      if (next < msgHistory.current.length) {
        historyIdx.current = next;
        setInput(msgHistory.current[next]);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = historyIdx.current - 1;
      if (next < 0) { historyIdx.current = -1; setInput(""); }
      else { historyIdx.current = next; setInput(msgHistory.current[next]); }
    }
  };

  return (
    <div className="h-[280px] border-t border-zinc-800 bg-[#09090b] flex shrink-0 animate-in slide-in-from-bottom duration-200">

      {/* ── Left: Chat ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 border-r border-zinc-800 min-w-0">

        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800 shrink-0">
          <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs font-semibold text-zinc-300">Chat</span>

          <div className="flex items-center gap-1 ml-2 bg-zinc-900 border border-zinc-800 rounded-md px-2 py-0.5">
            <span className="text-[11px] text-zinc-500">
              Session: {sessionId.substring(0, 7)}...
            </span>
            <button
              onClick={resetSession}
              title="New session"
              className="ml-1 text-zinc-600 hover:text-zinc-300 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center select-none">
              <MessageSquare className="w-8 h-8 text-zinc-800" />
              <p className="text-xs text-zinc-600">Send a message to start the workflow</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed",
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
          <div ref={messagesEnd} />
        </div>

        {/* Input */}
        <div className="flex items-end gap-2 px-4 py-3 border-t border-zinc-800 shrink-0">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type message, or press 'up' for previous one"
            rows={1}
            className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-zinc-700 placeholder:text-zinc-600 transition-colors"
            style={{ minHeight: 38, maxHeight: 80 }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            title="Send message"
            className="p-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Right: Logs ────────────────────────────────────────────────────── */}
      <div className="flex flex-col w-[380px] shrink-0">

        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800 shrink-0">
          <span className="text-xs font-semibold text-zinc-300 flex-1">Logs</span>
          <button className="text-zinc-600 hover:text-zinc-300 transition-colors" title="Options">
            <MoreHorizontal className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            title="Close chat"
            className="text-zinc-600 hover:text-zinc-300 transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Logs content */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-xs text-zinc-600 text-center leading-relaxed">
              Nothing to display yet. Execute the workflow to see execution logs.
            </p>
          ) : (
            <div className="w-full space-y-1">
              {logs.map((log, i) => (
                <p key={i} className="text-xs text-zinc-400 font-mono">{log}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
