"use client";

import { NodeProps, Handle, Position } from "reactflow";
import { cn } from "@/lib/utils";
import { getProvider } from "@/lib/nextviz/credentials/providers";

interface ChatModelData {
  chatModel?: {
    provider?: string;
    type?: string;
    apiKeyRef?: string;
  };
}

export default function ChatModelNode({ data, selected }: NodeProps<ChatModelData>) {
  const model = data.chatModel;
  const provider = model?.provider ? getProvider(model.provider) : undefined;
  const modelLabel =
    provider?.models.find((m) => m.value === model?.type)?.label ?? model?.type ?? "Model";

  return (
    <div
      className={cn(
        "rounded-xl bg-zinc-800 border-2 flex items-center gap-2.5 px-3 py-2.5 transition-all duration-150 nodrag-ignore",
        selected
          ? "border-orange-500 shadow-[0_0_0_3px_rgba(249,115,22,0.18)]"
          : "border-zinc-700 hover:border-zinc-600"
      )}
      style={{ minWidth: 160 }}
    >
      {/* Target handle at top */}
      <Handle
        type="target"
        position={Position.Top}
        id="model-in"
        className="!w-2.5 !h-2.5 !bg-zinc-600 !border-2 !border-zinc-400"
      />

      {/* Provider icon */}
      <div
        className={cn(
          "w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center font-bold text-sm shrink-0",
          provider?.iconColor ?? "text-zinc-400"
        )}
      >
        {provider?.name?.[0] ?? "M"}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-zinc-300 leading-none truncate">
          {provider?.name ?? "Chat Model"}
        </p>
        <p className="text-[10px] text-zinc-500 leading-none mt-1 truncate">{modelLabel}</p>
      </div>
    </div>
  );
}
