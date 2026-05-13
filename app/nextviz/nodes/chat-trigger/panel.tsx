"use client";

import { useState, useCallback } from "react";
import { Node } from "reactflow";
import { MessageSquare, MessageCircle, Plus, X } from "lucide-react";
import { NodeModalShell } from "../_base/node-modal-shell";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ChatField {
  id: string;
  name: string;
  type: "string" | "number" | "boolean";
}

export interface ChatTriggerPanelProps {
  node: Node;
  onClose: () => void;
  onOpenChat?: () => void;
  onExecuteStep?: (nodeId: string) => Promise<Record<string, unknown>>;
  onNodeChange?: (node: Node) => void;
}

// ── Toggle (local — keep panels self-contained) ────────────────────────────────

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-800/40 last:border-0 group">
      <p className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors">{label}</p>
      <button
        onClick={() => onChange(!value)}
        aria-checked={value}
        role="switch"
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
          value ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]" : "bg-zinc-700 hover:bg-zinc-600"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200",
            value ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

// ── Parameters content ─────────────────────────────────────────────────────────

function ChatTriggerParameters({
  node,
  onNodeChange,
}: {
  node: Node;
  onNodeChange?: (node: Node) => void;
}) {
  const [isPublic, setIsPublic] = useState<boolean>(node.data?.chatPublic ?? false);
  const [inHub, setInHub]       = useState<boolean>(node.data?.chatInHub   ?? false);
  const [fields, setFields]     = useState<ChatField[]>(node.data?.chatFields ?? []);

  const syncNode = useCallback(
    (patch: Record<string, unknown>) => {
      onNodeChange?.({ ...node, data: { ...node.data, ...patch } });
    },
    [node, onNodeChange]
  );

  const addField = () => {
    const field: ChatField = { id: `field-${Date.now()}`, name: "", type: "string" };
    const updated = [...fields, field];
    setFields(updated);
    syncNode({ chatFields: updated });
  };

  const removeField = (id: string) => {
    const updated = fields.filter((f) => f.id !== id);
    setFields(updated);
    syncNode({ chatFields: updated });
  };

  const updateField = (id: string, changes: Partial<ChatField>) => {
    const updated = fields.map((f) => (f.id === id ? { ...f, ...changes } : f));
    setFields(updated);
    syncNode({ chatFields: updated });
  };

  return (
    <div className="space-y-6">
      {/* Visibility toggles */}
      <div className="space-y-0">
        <Toggle
          label="Make Chat Publicly Available"
          value={isPublic}
          onChange={(v) => { setIsPublic(v); syncNode({ chatPublic: v }); }}
        />
        <Toggle
          label="Make Available in NextViz Chat Hub"
          value={inHub}
          onChange={(v) => { setInHub(v); syncNode({ chatInHub: v }); }}
        />
      </div>

      {/* Dynamic options */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Options</p>

        {fields.length === 0 && (
          <p className="text-xs text-zinc-600 italic mb-3">No properties</p>
        )}

        <div className="space-y-2 mb-2">
          {fields.map((field) => (
            <div key={field.id} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Field name"
                value={field.name}
                onChange={(e) => updateField(field.id, { name: e.target.value })}
                className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-700 placeholder:text-zinc-600 transition-colors"
              />
              <select
                value={field.type}
                onChange={(e) => updateField(field.id, { type: e.target.value as ChatField["type"] })}
                className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-2 py-2 focus:outline-none focus:border-zinc-700 appearance-none cursor-pointer"
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
              </select>
              <button
                onClick={() => removeField(field.id)}
                className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
                title="Remove field"
              >
                <X className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300" />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addField}
          className="w-full flex items-center justify-center gap-2 bg-zinc-900 border border-dashed border-zinc-700 text-zinc-400 text-sm rounded-lg px-3 py-2.5 hover:border-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Field
        </button>
      </div>
    </div>
  );
}

// ── Panel export ───────────────────────────────────────────────────────────────

export function ChatTriggerPanel({ node, onClose, onOpenChat, onExecuteStep, onNodeChange }: ChatTriggerPanelProps) {
  const openChatButton = (
    <button
      onClick={() => { onClose(); onOpenChat?.(); }}
      className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors mr-2"
    >
      <MessageCircle className="w-3.5 h-3.5" />
      Open chat
    </button>
  );

  return (
    <NodeModalShell
      node={node}
      icon={<MessageSquare className="w-4 h-4 text-zinc-400" strokeWidth={2} />}
      title={(node.data?.label as string) || "When chat message received"}
      version="1"
      onClose={onClose}
      onExecuteStep={onExecuteStep}
      onNodeChange={onNodeChange}
      executeButtonLabel="Execute step"
      actionButton={openChatButton}
      parametersContent={<ChatTriggerParameters node={node} onNodeChange={onNodeChange} />}
    />
  );
}
