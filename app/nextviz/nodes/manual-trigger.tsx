import { Handle, Position } from "reactflow";
import { Play } from "lucide-react";

export default function ManualTriggerNode({ data }: { data: any }) {
  return (
    <div className="w-64 bg-card border-2 border-border text-card-foreground rounded-xl shadow-sm overflow-hidden">
      <div className="bg-primary/10 px-4 py-2 border-b border-border flex items-center gap-2">
        <Play className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm">Manual Trigger</span>
      </div>
      <div className="p-4 flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">
          {data.label || "Click the button to trigger workflow manually."}
        </p>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-primary border-2 border-background"
      />
    </div>
  );
}
