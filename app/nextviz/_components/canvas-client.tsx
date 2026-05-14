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
import { Plus, Undo2, Redo2, KeyRound } from "lucide-react";
import Link from "next/link";
import { NodePropertiesPanel } from "./node-properties-panel";
import { ChatWindow } from "./chat-window";
import { ModelSelectorPopup } from "../nodes/ai-agent/_components/model-selector-popup";
import { MemoryPopup } from "../nodes/ai-agent/_components/memory-popup";
import { ToolPopup } from "../nodes/ai-agent/_components/tool-popup";
import { executeFlowAction } from "@/lib/nextviz/actions";

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

  // ── Read-only mode detection ───────────────────────────────────────────────
  const [isProduction, setIsProduction] = useState(false);
  const [showReadOnlyModal, setShowReadOnlyModal] = useState(false);

  useEffect(() => {
    const isLocal = typeof window !== "undefined" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
    setIsProduction(!isLocal);

    // Show modal once on load if in production
    if (!isLocal) {
      setShowReadOnlyModal(true);
    }
  }, []);

  // ── Properties panel ───────────────────────────────────────────────────────
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // ── Chat window ────────────────────────────────────────────────────────────
  const [chatWindowOpen, setChatWindowOpen] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Derive memory type from the active AI Agent node so ChatWindow can react to changes
  const activeMemoryType = (() => {
    const aiNode = nodes.find((n) => n.type === "aiAgent");
    return (aiNode?.data?.memory as { type?: string } | undefined)?.type ?? "none";
  })();

  // ── Sub-component popups (opened from canvas node sub-ports) ─────────────
  const [modelPopupNode,  setModelPopupNode]  = useState<Node | null>(null);
  const [memoryPopupNode, setMemoryPopupNode] = useState<Node | null>(null);
  const [toolPopupNode,   setToolPopupNode]   = useState<Node | null>(null);

  useEffect(() => {
    const findNode = (e: Event, setter: (n: Node) => void) => {
      const { nodeId } = (e as CustomEvent<{ nodeId: string }>).detail;
      setNodes((nds) => { const found = nds.find((n) => n.id === nodeId); if (found) setter(found); return nds; });
    };
    const onModel  = (e: Event) => findNode(e, setModelPopupNode);
    const onMemory = (e: Event) => findNode(e, setMemoryPopupNode);
    const onTool   = (e: Event) => findNode(e, setToolPopupNode);
    document.addEventListener("nextviz:open-model-popup",  onModel);
    document.addEventListener("nextviz:open-memory-popup", onMemory);
    document.addEventListener("nextviz:open-tool-popup",   onTool);
    return () => {
      document.removeEventListener("nextviz:open-model-popup",  onModel);
      document.removeEventListener("nextviz:open-memory-popup", onMemory);
      document.removeEventListener("nextviz:open-tool-popup",   onTool);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Flow execution listener (manual trigger button) ───────────────────────
  useEffect(() => {
    const handleExecuteFlow = async () => {
      if (!activeFlow) return;
      setIsExecuting(true);
      const result = await executeFlowAction(activeFlow.id);
      setExecutionResult(result);
      setChatWindowOpen(true);
      setIsExecuting(false);
    };
    document.addEventListener("nextviz:execute-flow", handleExecuteFlow);
    return () => document.removeEventListener("nextviz:execute-flow", handleExecuteFlow);
  }, [activeFlow]);

  // ── Chat message handler — runs flow with message payload ─────────────────
  const handleChatMessage = useCallback(
    async (
      message: string,
      sessionId: string,
      chatHistory: Array<{ role: "user" | "assistant" | "system"; content: string }>
    ): Promise<string> => {
      if (!activeFlow) return "No active flow.";
      const result = await executeFlowAction(activeFlow.id, {
        chatMessage: message,
        sessionId,
        chatHistory,
      });
      if (!result.success) return `Error: ${result.error}`;
      const outputs = result.result?.nodeOutputs ?? {};
      for (const output of Object.values(outputs)) {
        const out = output as Record<string, unknown>;
        if (out.response && typeof out.response === "string") {
          return out.response;
        }
      }
      return "No response returned from AI Agent.";
    },
    [activeFlow]
  );

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

  // ── Shared node change handler (updates node + auto-manages sub-nodes) ──────
  const handleNodeChange = useCallback((updatedNode: Node) => {
    setNodes((nds) => {
      let next = nds.map((n) => (n.id === updatedNode.id ? updatedNode : n));

      if (updatedNode.type === "aiAgent") {
        const chatModel = updatedNode.data?.chatModel as { type?: string; provider?: string; apiKeyRef?: string } | undefined;
        const memory    = updatedNode.data?.memory    as { type?: string; maxMessages?: number } | undefined;

        // Sync chatModelNode
        const modelNodeId = `${updatedNode.id}-model`;
        if (chatModel?.type) {
          const existsIdx = next.findIndex((n) => n.id === modelNodeId);
          if (existsIdx >= 0) {
            next = next.map((n) => n.id === modelNodeId ? { ...n, data: { chatModel } } : n);
          } else {
            next = [...next, {
              id: modelNodeId,
              type: "chatModelNode",
              position: { x: updatedNode.position.x + 20, y: updatedNode.position.y + 230 },
              data: { chatModel },
            }];
          }
        }

        // Sync memoryNode (only when type is set and not "none")
        const memoryNodeId = `${updatedNode.id}-memory`;
        if (memory?.type && memory.type !== "none") {
          const existsIdx = next.findIndex((n) => n.id === memoryNodeId);
          if (existsIdx >= 0) {
            next = next.map((n) => n.id === memoryNodeId ? { ...n, data: { memory } } : n);
          } else {
            next = [...next, {
              id: memoryNodeId,
              type: "memoryNode",
              position: { x: updatedNode.position.x + 110, y: updatedNode.position.y + 230 },
              data: { memory },
            }];
          }
        } else {
          // Remove memoryNode if type set back to "none"
          next = next.filter((n) => n.id !== memoryNodeId);
        }
      }

      return next;
    });

    if (updatedNode.type === "aiAgent") {
      const chatModel = updatedNode.data?.chatModel as { type?: string } | undefined;
      const memory    = updatedNode.data?.memory    as { type?: string } | undefined;

      setEdges((eds) => {
        let next = eds;

        // Model edge
        if (chatModel?.type) {
          const modelNodeId = `${updatedNode.id}-model`;
          const edgeId = `${updatedNode.id}-to-model`;
          if (!next.find((e) => e.id === edgeId)) {
            next = [...next, {
              id: edgeId,
              source: updatedNode.id,
              target: modelNodeId,
              sourceHandle: "model-out",
              targetHandle: "model-in",
              type: "smoothstep",
              style: { stroke: "#52525b", strokeWidth: 2 },
            }];
          }
        }

        // Memory edge
        const memoryNodeId = `${updatedNode.id}-memory`;
        const memEdgeId    = `${updatedNode.id}-to-memory`;
        if (memory?.type && memory.type !== "none") {
          if (!next.find((e) => e.id === memEdgeId)) {
            next = [...next, {
              id: memEdgeId,
              source: updatedNode.id,
              target: memoryNodeId,
              sourceHandle: "memory-out",
              targetHandle: "memory-in",
              type: "smoothstep",
              style: { stroke: "#52525b", strokeWidth: 2 },
            }];
          }
        } else {
          // Remove memory edge if memory disabled
          next = next.filter((e) => e.id !== memEdgeId);
        }

        return next;
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

            <Link href="/nextviz/credentials">
              <Button size="sm" variant="ghost" className="gap-2">
                <KeyRound className="h-4 w-4" />
                Credentials
              </Button>
            </Link>

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
      {chatWindowOpen && (
        <ChatWindow
          onClose={() => setChatWindowOpen(false)}
          onSendMessage={handleChatMessage}
          memoryType={activeMemoryType}
          executionResult={executionResult}
          isExecuting={isExecuting}
        />
      )}
      </div>

      {/* Properties modal — portal to body, not affected by canvas transforms */}
      {selectedNode && (
        <NodePropertiesPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onExecuteStep={handleExecuteStep}
          onOpenChat={() => { setSelectedNode(null); setChatWindowOpen(true); }}
          onNodeChange={(updatedNode) => {
            handleNodeChange(updatedNode);
            setSelectedNode(updatedNode);
          }}
        />
      )}

      {/* Sub-component popups — opened directly from canvas node sub-ports */}
      {modelPopupNode && (
        <ModelSelectorPopup
          node={modelPopupNode}
          onClose={() => setModelPopupNode(null)}
          onNodeChange={(updatedNode) => { handleNodeChange(updatedNode); setModelPopupNode(null); }}
        />
      )}
      {memoryPopupNode && (
        <MemoryPopup
          node={memoryPopupNode}
          onClose={() => setMemoryPopupNode(null)}
          onNodeChange={(updatedNode) => { handleNodeChange(updatedNode); setMemoryPopupNode(null); }}
        />
      )}
      {toolPopupNode && (
        <ToolPopup
          node={toolPopupNode}
          onClose={() => setToolPopupNode(null)}
          onNodeChange={(updatedNode) => { handleNodeChange(updatedNode); setToolPopupNode(null); }}
        />
      )}

      {/* Read-Only Mode Modal */}
      {!isDevelopment && (
        <Dialog open={showReadOnlyModal} onOpenChange={setShowReadOnlyModal}>
          <DialogContent className="sm:max-w-[500px] border-yellow-500/30 bg-zinc-950">
            <DialogHeader>
              <DialogTitle className="text-yellow-500 flex items-center gap-2">
                <span className="text-xl">🔒</span> Read-Only Mode
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                This is the production version. To edit flows, you must run NextViz locally.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-zinc-200">
                  ⚠️ You are viewing this flow in read-only mode.
                </p>
                <p className="text-sm text-zinc-400">
                  All editing features (drag, connect, create, delete) are disabled to prevent accidental changes.
                </p>
              </div>

              <div className="bg-zinc-900/50 border border-blue-500/20 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-blue-400">
                  How to edit:
                </p>
                <ol className="text-sm text-zinc-400 space-y-1 list-decimal list-inside">
                  <li>Clone or download this project locally</li>
                  <li>Run <code className="bg-zinc-800 px-2 py-1 rounded text-zinc-200">npm install && npm run dev</code></li>
                  <li>Open <code className="bg-zinc-800 px-2 py-1 rounded text-zinc-200">localhost:3000/nextviz</code></li>
                  <li>Edit flows and they'll sync to your git repository</li>
                </ol>
              </div>

              <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                <p className="text-sm text-green-400">
                  ✓ You can still test flows by opening the chat window (testing works in production).
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowReadOnlyModal(false)} className="gap-2">
                Got it, I'll edit locally
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
