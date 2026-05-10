import { Handle, Position } from "reactflow";
import { Globe } from "lucide-react";

export default function HttpActionNode({ data }: { data: any }) {
  return (
    <div className="w-64 bg-card border-2 border-border text-card-foreground rounded-xl shadow-sm overflow-hidden">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-muted-foreground border-2 border-background"
      />
      <div className="bg-orange-500/10 px-4 py-2 border-b border-border flex items-center gap-2">
        <Globe className="w-4 h-4 text-orange-500" />
        <span className="font-semibold text-sm">HTTP Request</span>
      </div>
      <div className="p-4 flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">
          {data.label || "Send an HTTP GET or POST request."}
        </p>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-muted-foreground border-2 border-background"
      />
    </div>
  );
}
