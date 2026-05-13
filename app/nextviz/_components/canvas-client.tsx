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
import { createFlow, listFlows, loadFlow, saveFlow } from "@/lib/nextviz/actions";
import { WorkflowJSON } from "@/lib/nextviz/types";
import { useFlows } from "../_context/flows-context";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Undo2, Redo2 } from "lucide-react";
import { NodePropertiesPanel } from "./node-properties-panel";
import { ChatWindow } from "./chat-window";

interface CanvasClientProps {
  initialFlowId?: string;
}

const MAX_HISTORY = 30;

export function CanvasClient({ initialFlowId }: CanvasClientProps) {
  const router = useRouter();
  const { refreshFlows, setActiveFlowId } = useFlows();

  const [activeFlow, setActiveFlow] = useState<WorkflowJSON | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // ── Properties panel ───────────────────────────────────────────────────────
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // ── Chat window ────────────────────────────────────────────────────────────
  const [chatWindowOpen, setChatWindowOpen] = useState(false);

  // ── Undo / Redo history ────────────────────────────────────────────────────
  const history    = useRef<Array<{ nodes: Node[]; edges: Edge[] }>>([]);
  const historyIdx = useRef(-1);
  const skipHistory = useRef(false); // prevents recording while restoring

  const pushHistory = useCallback((n: Node[], e: Edge[]) => {
    if (skipHistory.current) return;
    // Discard any "future" states when a new change is made
    history.current = history.current.slice(0, historyIdx.current + 1);
    history.current.push({ nodes: n, edges: e });
    if (history.current.length > MAX_HISTORY) history.current.shift();
    historyIdx.current = history.current.length - 1;
  }, []);

  const undo = useCallback(() => {
    if (historyIdx.current <= 0) return;
    historyIdx.current -= 1;
    const snap = history.current[historyIdx.current];
    skipHistory.current = true;
    setNodes(snap.nodes);
    setEdges(snap.edges);
    skipHistory.current = false;
  }, []);

  const redo = useCallback(() => {
    if (historyIdx.current >= history.current.length - 1) return;
    historyIdx.current += 1;
    const snap = history.current[historyIdx.current];
    skipHistory.current = true;
    setNodes(snap.nodes);
    setEdges(snap.edges);
    skipHistory.current = false;
  }, []);

  // Keyboard shortcuts: Cmd/Ctrl+Z (undo), Cmd/Ctrl+Shift+Z or Ctrl+Y (redo)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.key === "z" && e.shiftKey) || e.key === "y") { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  // ── Add-flow dialog ────────────────────────────────────────────────────────
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newFlowName, setNewFlowName] = useState("");
  const [newFlowDesc, setNewFlowDesc] = useState("");

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  // Load flow on mount
  useEffect(() => {
    async function load() {
      let flowId = initialFlowId;
      if (!flowId) {
        const flows = await listFlows();
        if (flows.length > 0) { router.replace(`/nextviz?flowId=${flows[0].id}`); return; }
        setIsLoaded(true);
        return;
      }
      const flow = await loadFlow(flowId);
      if (flow) {
        setActiveFlow(flow);
        setActiveFlowId(flowId);
        const loadedNodes = flow.nodes as Node[];
        const loadedEdges = flow.edges as Edge[];
        setNodes(loadedNodes);
        setEdges(loadedEdges);
        // Seed history with the initial state
        history.current = [{ nodes: loadedNodes, edges: loadedEdges }];
        historyIdx.current = 0;
      }
      setIsLoaded(true);
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save (dev only)
  useEffect(() => {
    if (!isLoaded || !activeFlow || process.env.NODE_ENV !== "development") return;
    const timeout = setTimeout(() => {
      // Sanitize nodes/edges to remove symbols (React Flow internals) that break Server Actions
      const sanitizedNodes = JSON.parse(JSON.stringify(nodes));
      const sanitizedEdges = JSON.parse(JSON.stringify(edges));
      saveFlow({ ...activeFlow, nodes: sanitizedNodes, edges: sanitizedEdges } as unknown as WorkflowJSON).catch(console.error);
    }, 500);
    return () => clearTimeout(timeout);
  }, [nodes, edges, isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── React Flow callbacks ───────────────────────────────────────────────────

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => {
      const next = applyNodeChanges(changes, nds);
      // Only push to history on meaningful changes (add/remove), not selection or position drag
      const isSignificant = changes.some((c) => c.type === "add" || c.type === "remove");
      if (isSignificant) pushHistory(next, edges);
      return next;
    });
  }, [edges, pushHistory]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => {
      const next = applyEdgeChanges(changes, eds);
      const isSignificant = changes.some((c) => c.type === "add" || c.type === "remove");
      if (isSignificant) pushHistory(nodes, next);
      return next;
    });
  }, [nodes, pushHistory]);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => {
      const next = addEdge(params, eds);
      pushHistory(nodes, next);
      return next;
    });
  }, [nodes, pushHistory]);

  // Save history on node drag end
  const onNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    setNodes((nds) => {
      pushHistory(nds, edges);
      return nds;
    });
  }, [edges, pushHistory]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    if (!rfInstance || !reactFlowWrapper.current) return;

    const nodeType = event.dataTransfer.getData("application/reactflow");
    const label    = event.dataTransfer.getData("application/reactflow-label");
    if (!nodeType) return;

    const bounds   = reactFlowWrapper.current.getBoundingClientRect();
    const position = rfInstance.project({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });

    const newNode: Node = { id: `node-${Date.now()}`, type: nodeType, position, data: { label } };
    setNodes((nds) => {
      const next = [...nds, newNode];
      pushHistory(next, edges);
      return next;
    });
  }, [rfInstance, edges, pushHistory]);

  // ── Node click → open properties panel ────────────────────────────────────
  const NODES_WITH_PANEL = new Set(["manualTrigger", "scheduleTrigger", "chatTrigger", "aiAgent"]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (NODES_WITH_PANEL.has(node.type ?? "")) {
      setSelectedNode(node);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  // ── Execute step handler ───────────────────────────────────────────────────
  const handleExecuteStep = useCallback(async (nodeId: string): Promise<Record<string, unknown>> => {
    await new Promise((r) => setTimeout(r, 700));
    return { executedAt: new Date().toISOString(), nodeId, flowId: activeFlow?.id ?? "unknown", payload: {} };
  }, [activeFlow]);

  // ── Create flow ────────────────────────────────────────────────────────────
  const handleCreateFlow = async () => {
    if (!newFlowName.trim()) return;
    const flow = await createFlow(newFlowName, newFlowDesc);
    await refreshFlows();
    setNewFlowName(""); setNewFlowDesc(""); setIsAddOpen(false);
    router.push(`/nextviz?flowId=${flow.id}`);
  };

  const isDevelopment = process.env.NODE_ENV === "development";
  const canUndo = historyIdx.current > 0;
  const canRedo = historyIdx.current < history.current.length - 1;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 w-full h-full relative flex flex-col">
      {/* Read-only banner */}
      {!isDevelopment && (
        <div className="w-full bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-500 text-center py-2 text-sm font-medium z-50 shrink-0">
          Read-Only Mode: Edit in Localhost to sync with Git.
        </div>
      )}

      {/* Top bar */}
      <div className="h-14 border-b border-border bg-card flex items-center gap-2 px-4 shrink-0 z-40 shadow-sm">
        <h1 className="text-sm font-semibold text-foreground flex-1">
          {activeFlow?.name ?? "NextViz"}
        </h1>

        {isDevelopment && (
          <>
            {/* Undo / Redo */}
            <Button size="sm" variant="ghost" onClick={undo} disabled={!canUndo} title="Undo (⌘Z)" className="px-2">
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={redo} disabled={!canRedo} title="Redo (⌘⇧Z)" className="px-2">
              <Redo2 className="h-4 w-4" />
            </Button>

            <div className="w-px h-5 bg-border mx-1" />

            <Button size="sm" variant="outline" className="gap-2" onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Flow
            </Button>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Flow</DialogTitle>
                  <DialogDescription>Define a new automation workflow.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={newFlowName} onChange={(e) => setNewFlowName(e.target.value)} placeholder="e.g. Slack Onboarding" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input id="description" value={newFlowDesc} onChange={(e) => setNewFlowDesc(e.target.value)} placeholder="Briefly describe what this flow does…" />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateFlow} disabled={!newFlowName.trim()}>Create Flow</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>

      {/* Canvas + Chat Window */}
      <div className="flex flex-col flex-1 min-h-0">
      <div className="flex flex-1 min-h-0">
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
            onNodeDragStop={isDevelopment ? onNodeDragStop : undefined}
            onPaneClick={onPaneClick}
            nodesDraggable={isDevelopment}
            nodesConnectable={isDevelopment}
            elementsSelectable={isDevelopment}
            deleteKeyCode={["Delete", "Backspace"]}
            fitView
            className="bg-zinc-950"
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#333" />
            <Controls className="bg-card border-border fill-foreground" showInteractive={false} />
            <MiniMap className="bg-card border-border" maskColor="rgba(0,0,0,0.2)" nodeColor="#52525b" />
          </ReactFlow>
        </div>
      </div>

      {/* Chat window — slides up from bottom when a chatTrigger is open */}
      {chatWindowOpen && <ChatWindow onClose={() => setChatWindowOpen(false)} />}
      </div>

      {/* Properties modal — portal to body, not affected by canvas transforms */}
      {selectedNode && (
        <NodePropertiesPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onExecuteStep={handleExecuteStep}
          onOpenChat={() => { setSelectedNode(null); setChatWindowOpen(true); }}
          onNodeChange={(updatedNode) => {
            setNodes((nds) => nds.map((n) => (n.id === updatedNode.id ? updatedNode : n)));
            setSelectedNode(updatedNode);
          }}
        />
      )}
    </div>
  );
}
