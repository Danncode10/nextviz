"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  EdgeChange,
  MiniMap,
  Node,
  NodeChange,
  ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import { useRouter } from "next/navigation";
import { nodeTypes } from "../nodes";
import {
  createFlow,
  listFlows,
  loadFlow,
  saveFlow,
} from "@/lib/nextviz/actions";
import { WorkflowJSON } from "@/lib/nextviz/types";
import { useFlows } from "../_context/flows-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { NodePropertiesPanel } from "./node-properties-panel";

interface CanvasClientProps {
  initialFlowId?: string;
}

export function CanvasClient({ initialFlowId }: CanvasClientProps) {
  const router = useRouter();
  const { refreshFlows, setActiveFlowId } = useFlows();

  const [activeFlow, setActiveFlow] = useState<WorkflowJSON | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // ── Properties panel ───────────────────────────────────────
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [addNodeMode, setAddNodeMode] = useState<string | null>(null); // tracks which node's + button was clicked

  // ── Add-flow dialog ────────────────────────────────────────
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newFlowName, setNewFlowName] = useState("");
  const [newFlowDesc, setNewFlowDesc] = useState("");

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  // Load flow on mount (key prop in page.tsx forces remount on flow change)
  useEffect(() => {
    async function load() {
      let flowId = initialFlowId;

      if (!flowId) {
        const flows = await listFlows();
        if (flows.length > 0) {
          router.replace(`/nextviz?flowId=${flows[0].id}`);
          return;
        }
        setIsLoaded(true);
        return;
      }

      const flow = await loadFlow(flowId);
      if (flow) {
        setActiveFlow(flow);
        setActiveFlowId(flowId);
        // Patch nodes with onAddNode callback
        const nodesWithCallback = (flow.nodes as Node[]).map((node) => ({
          ...node,
          data: {
            ...node.data,
            onAddNode: (sourceId: string) => setAddNodeMode(sourceId),
          },
        }));
        setNodes(nodesWithCallback);
        setEdges(flow.edges as Edge[]);
      }
      setIsLoaded(true);
    }

    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save with 500 ms debounce
  useEffect(() => {
    if (!isLoaded || !activeFlow || process.env.NODE_ENV !== "development")
      return;

    const timeout = setTimeout(() => {
      saveFlow({
        ...activeFlow,
        nodes,
        edges,
      } as unknown as WorkflowJSON).catch(console.error);
    }, 500);

    return () => clearTimeout(timeout);
  }, [nodes, edges, isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── React Flow callbacks ───────────────────────────────────

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (!rfInstance || !reactFlowWrapper.current) return;

      const nodeType = event.dataTransfer.getData("application/reactflow");
      const label = event.dataTransfer.getData("application/reactflow-label");
      if (!nodeType) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = rfInstance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: nodeType,
        position,
        data: {
          label,
          onAddNode: (sourceId: string) => setAddNodeMode(sourceId),
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [rfInstance]
  );

  // ── Node click → open properties panel ────────────────────

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      // Don't open properties if the + button inside the node was clicked
      if ((event.target as Element).closest("[data-add-node-button]")) return;
      setSelectedNode(node);
    },
    []
  );

  // Click on canvas background → close properties panel
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // ── Execute step handler (passed to properties panel) ─────

  const handleExecuteStep = useCallback(
    async (nodeId: string): Promise<Record<string, unknown>> => {
      // TODO: wire to engine.executeFlow() in Phase 4
      // For now returns a simulated trigger output
      await new Promise((r) => setTimeout(r, 700));
      return {
        executedAt: new Date().toISOString(),
        nodeId,
        flowId: activeFlow?.id ?? "unknown",
        payload: {},
      };
    },
    [activeFlow]
  );

  // ── Create flow dialog ─────────────────────────────────────

  const handleCreateFlow = async () => {
    if (!newFlowName.trim()) return;
    const flow = await createFlow(newFlowName, newFlowDesc);
    await refreshFlows();
    setNewFlowName("");
    setNewFlowDesc("");
    setIsAddOpen(false);
    router.push(`/nextviz?flowId=${flow.id}`);
  };

  const isDevelopment = process.env.NODE_ENV === "development";

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="flex-1 w-full h-full relative flex flex-col">
      {/* Read-only banner */}
      {!isDevelopment && (
        <div className="w-full bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-500 text-center py-2 text-sm font-medium z-50 shrink-0">
          Read-Only Mode: Edit in Localhost to sync with Git.
        </div>
      )}

      {/* Top bar */}
      <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0 z-40 shadow-sm">
        <h1 className="text-sm font-semibold text-foreground">
          {activeFlow?.name ?? "NextViz"}
        </h1>

        {isDevelopment && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => setIsAddOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add Flow
            </Button>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
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
                      placeholder="Briefly describe what this flow does…"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateFlow}
                    disabled={!newFlowName.trim()}
                  >
                    Create Flow
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>

      {/* Canvas + Properties Panel */}
      <div className="flex flex-1 min-h-0">
        {/* React Flow canvas */}
        <div ref={reactFlowWrapper} className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onInit={setRfInstance}
            onNodesChange={isDevelopment ? onNodesChange : undefined}
            onEdgesChange={isDevelopment ? onEdgesChange : undefined}
            onConnect={isDevelopment ? onConnect : undefined}
            onDragOver={isDevelopment ? onDragOver : undefined}
            onDrop={isDevelopment ? onDrop : undefined}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodesDraggable={isDevelopment}
            nodesConnectable={isDevelopment}
            elementsSelectable={isDevelopment}
            fitView
            className="bg-zinc-950"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={16}
              size={1}
              color="#333"
            />
            <Controls
              className="bg-card border-border fill-foreground"
              showInteractive={false}
            />
            <MiniMap
              className="bg-card border-border"
              maskColor="rgba(0,0,0,0.2)"
              nodeColor="#52525b"
            />

            {/* Properties Panel — slides in when a node is selected or + button clicked */}
            {/* Must be inside ReactFlow to access useReactFlow() context */}
            {(selectedNode || addNodeMode) && (
              <NodePropertiesPanel
                node={selectedNode}
                mode={addNodeMode ? "addNode" : "view"}
                sourceNodeId={addNodeMode || undefined}
                setAddNodeMode={setAddNodeMode}
                onClose={() => {
                  setSelectedNode(null);
                  setAddNodeMode(null);
                }}
                onExecuteStep={handleExecuteStep}
              />
            )}
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
