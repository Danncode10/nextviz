"use client";

import { Node } from "reactflow";
import { MousePointer2 } from "lucide-react";
import { NodeModalShell } from "../_base/node-modal-shell";

interface ManualTriggerPanelProps {
  node: Node;
  onClose: () => void;
  onExecuteStep?: (nodeId: string) => Promise<Record<string, unknown>>;
  onNodeChange?: (node: Node) => void;
}

export function ManualTriggerPanel({
  node,
  onClose,
  onExecuteStep,
  onNodeChange,
}: ManualTriggerPanelProps) {
  return (
    <NodeModalShell
      node={node}
      icon={<MousePointer2 className="w-4 h-4 text-zinc-400" strokeWidth={2} />}
      title={node.data?.label ?? "When clicking 'Execute workflow'"}
      version="1"
      onClose={onClose}
      onExecuteStep={onExecuteStep}
      onNodeChange={onNodeChange}
      executeButtonLabel="Execute step"
      parametersContent={
        <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center space-y-4 pt-8">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-2">
            <MousePointer2 className="w-6 h-6 text-zinc-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-zinc-200 font-medium">Manual Trigger</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              This node starts your workflow manually when you click the{" "}
              <span className="text-orange-400 font-semibold mx-1">Execute step</span>
              button or trigger it via API.
            </p>
          </div>
          <div className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-4 w-full">
            <p className="text-xs text-orange-500/70">
              Pro Tip: You can pass mock data using the &quot;Test this trigger&quot; section on the right.
            </p>
          </div>
          <p className="text-xs text-zinc-700 italic pt-4">No configurable parameters for this node type.</p>
        </div>
      }
    />
  );
}
