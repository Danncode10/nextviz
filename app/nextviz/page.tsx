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
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { NextVizProject } from "@/lib/nextviz/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [project, setProject] = useState<NextVizProject | null>(null);
  const [activeFlowId, setActiveFlowId] = useState<string | null>(null);
  
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [isLoaded, setIsLoaded] = useState(false);

  // Dialog state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newFlowName, setNewFlowName] = useState("");
  const [newFlowDesc, setNewFlowDesc] = useState("");

  // 1. Load initial state from Source of Truth
  useEffect(() => {
    getWorkflow().then((data) => {
      if (data) {
        setProject(data);
        const flowId = data.activeFlowId || (data.flows.length > 0 ? data.flows[0].id : null);
        setActiveFlowId(flowId);
        
        if (flowId) {
          const flow = data.flows.find(f => f.id === flowId);
          if (flow) {
            setNodes(flow.nodes);
            setEdges(flow.edges);
          }
        }
      }
      setIsLoaded(true);
    });
  }, []);

  // 2. Auto-save (Live-Sync) to Source of Truth with Debounce
  useEffect(() => {
    if (!isLoaded || !project || !activeFlowId) return;
    if (process.env.NODE_ENV !== "development") return; // CRITICAL: Disable save in read-only mode
    
    const timeout = setTimeout(() => {
      const updatedProject = { ...project };
      const flowIndex = updatedProject.flows.findIndex(f => f.id === activeFlowId);
      if (flowIndex !== -1) {
        updatedProject.flows[flowIndex] = {
          ...updatedProject.flows[flowIndex],
          nodes,
          edges,
        };
        updatedProject.activeFlowId = activeFlowId;
        saveWorkflow(updatedProject).catch(console.error);
        setProject(updatedProject);
      }
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timeout);
  }, [nodes, edges, isLoaded]); // intentional dependency array on nodes/edges/isLoaded

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

  const handleCreateFlow = () => {
    if (!newFlowName.trim()) return;
    
    const newFlowId = `flow-${Date.now()}`;
    const newFlow = {
      id: newFlowId,
      name: newFlowName,
      description: newFlowDesc,
      nodes: initialNodes,
      edges: initialEdges,
    };

    let updatedProject: NextVizProject;
    if (project) {
      updatedProject = {
        ...project,
        flows: [...project.flows, newFlow],
        activeFlowId: newFlowId,
      };
    } else {
      updatedProject = {
        version: "1.0",
        activeFlowId: newFlowId,
        flows: [newFlow]
      };
    }

    // Immediately save and update state
    setProject(updatedProject);
    setActiveFlowId(newFlowId);
    setNodes(newFlow.nodes);
    setEdges(newFlow.edges);
    saveWorkflow(updatedProject).catch(console.error);

    setNewFlowName("");
    setNewFlowDesc("");
    setIsAddOpen(false);
  };

  const isDevelopment = process.env.NODE_ENV === "development";
  const activeFlow = project?.flows.find(f => f.id === activeFlowId);

  return (
    <div className="flex-1 w-full h-full relative flex flex-col">
      {!isDevelopment && (
        <div className="w-full bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-500 text-center py-2 text-sm font-medium z-50">
          Read-Only Mode: Edit in Localhost to sync with Git.
        </div>
      )}
      <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0 z-40 shadow-sm">
        <h1 className="text-sm font-semibold text-foreground">
          {activeFlow ? activeFlow.name : "NextViz"}
        </h1>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Flow
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Flow</DialogTitle>
              <DialogDescription>
                Define a new automation workflow.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newFlowName}
                  onChange={(e) => setNewFlowName(e.target.value)}
                  placeholder="e.g. Slack Onboarding"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newFlowDesc}
                  onChange={(e) => setNewFlowDesc(e.target.value)}
                  placeholder="Briefly describe what this flow does..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateFlow} disabled={!newFlowName.trim()}>
                Create Flow
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex-1 w-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={isDevelopment ? onNodesChange : undefined}
          onEdgesChange={isDevelopment ? onEdgesChange : undefined}
          onConnect={isDevelopment ? onConnect : undefined}
          nodesDraggable={isDevelopment}
          nodesConnectable={isDevelopment}
          elementsSelectable={isDevelopment}
          fitView
          className="bg-zinc-950"
        >
          <Background variant="dots" gap={16} size={1} color="#333" />
          <Controls className="bg-card border-border fill-foreground" showInteractive={false} />
          <MiniMap 
            className="bg-card border-border" 
            maskColor="rgba(0,0,0,0.2)"
            nodeColor="#52525b" // zinc-600
          />
        </ReactFlow>
      </div>
    </div>
  );
}
