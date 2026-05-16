"use client";

import { Node } from "reactflow";
import { Zap } from "lucide-react";
import { ScheduleTriggerPanel } from "../nodes/schedule-trigger/panel";
import { ChatTriggerPanel } from "../nodes/chat-trigger/panel";
import { AIAgentPanel } from "../nodes/ai-agent/panel";
import { HttpRequestPanel } from "../nodes/http-request/panel";
import { ManualTriggerPanel } from "../nodes/manual-trigger/panel";

interface NodePropertiesPanelProps {
  node: Node;
  onClose: () => void;
  onExecuteStep?: (nodeId: string) => Promise<Record<string, unknown>>;
  onNodeChange?: (node: Node) => void;
  onOpenChat?: () => void;
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

export function NodePropertiesPanel({ node, onClose, onExecuteStep, onNodeChange, onOpenChat }: NodePropertiesPanelProps) {
  if (node.type === "manualTrigger") {
    return (
      <ManualTriggerPanel
        node={node}
        onClose={onClose}
        onExecuteStep={onExecuteStep}
        onNodeChange={onNodeChange}
      />
    );
  }

  if (node.type === "scheduleTrigger") {
    return (
      <ScheduleTriggerPanel
        node={node}
        onClose={onClose}
        onExecuteStep={onExecuteStep}
        onNodeChange={onNodeChange}
      />
    );
  }

  if (node.type === "chatTrigger") {
    return (
      <ChatTriggerPanel
        node={node}
        onClose={onClose}
        onOpenChat={onOpenChat}
        onExecuteStep={onExecuteStep}
        onNodeChange={onNodeChange}
      />
    );
  }

  if (node.type === "aiAgent") {
    return (
      <AIAgentPanel
        node={node}
        onClose={onClose}
        onExecuteStep={onExecuteStep}
        onNodeChange={onNodeChange}
      />
    );
  }

  if (node.type === "httpRequest") {
    return (
      <HttpRequestPanel
        node={node}
        onClose={onClose}
        onExecuteStep={onExecuteStep}
        onNodeChange={onNodeChange}
      />
    );
  }

  return null;
}

// Re-export Zap so existing imports don't break (unused but harmless)
export { Zap };
