import { Handle, Position } from "reactflow";
import { Webhook } from "lucide-react";

export default function OnHttpNode({ data }: { data: { label?: string; method?: string } }) {
  const method = data.method ?? "POST";
  return (
    <div className="w-64 bg-card border-2 border-border text-card-foreground rounded-xl shadow-sm overflow-hidden">
      <div className="bg-violet-500/10 px-4 py-2 border-b border-border flex items-center gap-2">
        <Webhook className="w-4 h-4 text-violet-400" />
        <span className="font-semibold text-sm">HTTP Trigger</span>
        <span className="ml-auto text-[10px] font-mono bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded">
          {method}
        </span>
      </div>
      <div className="p-4">
        <p className="text-xs text-muted-foreground">
          {data.label || "Fires when this flow's webhook endpoint is called."}
        </p>
        <p className="mt-2 text-[10px] font-mono text-zinc-500 break-all">
          POST /api/nextviz/&#123;flowId&#125;
        </p>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-violet-400 border-2 border-background"
      />
    </div>
  );
}
