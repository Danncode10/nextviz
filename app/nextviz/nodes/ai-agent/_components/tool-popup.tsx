"use client";

import { createPortal } from "react-dom";
import { X, Save, Wrench } from "lucide-react";
import { Node } from "reactflow";
import { ToolConfig } from "./tool-config";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ToolPopupProps {
  node: Node;
  onClose: () => void;
  onNodeChange?: (node: Node) => void;
}

export function ToolPopup({ node, onClose, onNodeChange }: ToolPopupProps) {
  const [draft, setDraft] = useState<Node>(node);

  const modal = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="relative w-[90vw] max-w-[480px] max-h-[90vh] bg-[#09090b] rounded-2xl border border-zinc-800 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-800 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Wrench className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-zinc-100">Tools</h2>
            <p className="text-xs text-zinc-500">Add tools the agent can use during execution.</p>
          </div>
          <button
            onClick={() => { onNodeChange?.(draft); onClose(); }}
            className={cn(
              "flex items-center gap-1.5 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors",
              "bg-orange-600 hover:bg-orange-500 shadow-lg shadow-orange-900/20"
            )}
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition-colors">
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <ToolConfig node={draft} onNodeChange={setDraft} />
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}
