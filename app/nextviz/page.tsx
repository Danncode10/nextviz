"use client";

import { useCallback, useState, useEffect } from "react";
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
import { nodeTypes } from "./nodes";
import { getWorkflow, saveWorkflow } from "@/lib/nextviz/actions";

const initialNodes: Node[] = [
  {
    id: "1",
    type: "manualTrigger",
    data: { label: "Trigger this workflow" },
    position: { x: 150, y: 150 },
  },
  {
    id: "2",
    type: "httpAction",
    data: { label: "Fetch data from API" },
    position: { x: 500, y: 150 },
  },
];

const initialEdges: Edge[] = [{ id: "e1-2", source: "1", target: "2", animated: true }];

export default function NextVizPage() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Load initial state from Source of Truth
  useEffect(() => {
    getWorkflow().then((data) => {
      if (data) {
        // If data exists on disk, override placeholders
        setNodes(data.nodes);
        setEdges(data.edges);
      }
      setIsLoaded(true);
    });
  }, []);

  // 2. Auto-save (Live-Sync) to Source of Truth with Debounce
  useEffect(() => {
    if (!isLoaded) return;
    
    const timeout = setTimeout(() => {
      saveWorkflow({ nodes, edges, version: "1.0" }).catch(console.error);
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timeout);
  }, [nodes, edges, isLoaded]);

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
        nodeTypes={nodeTypes}
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
