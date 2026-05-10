"use client";

import { useCallback, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Connection,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
} from "reactflow";
import "reactflow/dist/style.css";

const initialNodes: Node[] = [
  {
    id: "1",
    type: "input",
    data: { label: "Trigger Node" },
    position: { x: 250, y: 100 },
    className: "bg-card border-border text-card-foreground rounded-xl shadow-sm",
  },
  {
    id: "2",
    data: { label: "Action Node" },
    position: { x: 250, y: 250 },
    className: "bg-card border-border text-card-foreground rounded-xl shadow-sm",
  },
];

const initialEdges: Edge[] = [{ id: "e1-2", source: "1", target: "2", animated: true }];

export default function NextVizPage() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  return (
    <div className="flex-1 w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        className="bg-zinc-950"
      >
        <Background variant="dots" gap={16} size={1} color="#333" />
        <Controls className="bg-card border-border fill-foreground" />
        <MiniMap 
          className="bg-card border-border" 
          maskColor="rgba(0,0,0,0.2)"
          nodeColor="#52525b" // zinc-600
        />
      </ReactFlow>
    </div>
  );
}
