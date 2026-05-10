import { Handle, Position } from "reactflow";
import { ScrollText } from "lucide-react";

export default function LogDataNode({ data }: { data: { label?: string } }) {
  return (
    <div className="w-64 bg-card border-2 border-border text-card-foreground rounded-xl shadow-sm overflow-hidden">
      <div className="bg-emerald-500/10 px-4 py-2 border-b border-border flex items-center gap-2">
        <ScrollText className="w-4 h-4 text-emerald-400" />
        <span className="font-semibold text-sm">Log Data</span>
      </div>
      <div className="p-4">
        <p className="text-xs text-muted-foreground">
          {data.label || "Logs all incoming data to the server console."}
        </p>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-emerald-400 border-2 border-background"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-emerald-400 border-2 border-background"
      />
    </div>
  );
}
