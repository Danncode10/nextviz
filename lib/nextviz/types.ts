import { z } from "zod";

// ─── Schema Definitions ────────────────────────────────────────────────────

export const NextVizNodeSchema = z.object({
  id: z.string(),
  type: z.string().optional(),
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.record(z.string(), z.any()),
  dragHandle: z.string().optional(),
  selected: z.boolean().optional(),
  width: z.number().optional().nullable(),
  height: z.number().optional().nullable(),
});

export const NextVizEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional().nullable(),
  targetHandle: z.string().optional().nullable(),
  type: z.string().optional(),
  animated: z.boolean().optional(),
  label: z.string().optional(),
});

export const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  nodes: z.array(NextVizNodeSchema),
  edges: z.array(NextVizEdgeSchema),
});

// ─── Inferred Types ────────────────────────────────────────────────────────

export type NextVizNode = z.infer<typeof NextVizNodeSchema>;
export type NextVizEdge = z.infer<typeof NextVizEdgeSchema>;
export type WorkflowJSON = z.infer<typeof WorkflowSchema>;

// ─── Engine Types ──────────────────────────────────────────────────────────

/** Context passed to every node executor during a flow run. */
export interface NodeExecutionContext {
  flowId: string;
  executionId: string;
  /** Initial payload that triggered the flow (webhook body, manual args, etc.) */
  payload: Record<string, unknown>;
  /** Accumulated outputs from all previously executed nodes. */
  nodeOutputs: Map<string, Record<string, unknown>>;
}

/**
 * Every node type must export an executor matching this signature.
 * - `nodeData` — the node's `data` field from the flow JSON (config set in the canvas)
 * - `inputs`   — merged outputs of all upstream nodes (or the trigger payload for root nodes)
 * - `context`  — full execution context
 */
export type NodeExecutorFn = (
  nodeData: Record<string, unknown>,
  inputs: Record<string, unknown>,
  context: NodeExecutionContext
) => Promise<Record<string, unknown>>;

/** Cached, pre-computed execution plan for a flow. Built once, reused forever. */
export interface ExecutionPlan {
  flowId: string;
  /** Node IDs in topologically sorted order (safe execution sequence). */
  sortedNodeIds: string[];
  /** nodeId → IDs of all nodes whose output feeds into it. */
  incomingEdges: Map<string, string[]>;
}

export type ExecutionEventType = "node-start" | "node-success" | "node-error";

export interface ExecutionEvent {
  type: ExecutionEventType;
  nodeId: string;
  timestamp: number; // ms since execution start
  error?: string;
}

/** Result returned by `executeFlow`. */
export interface FlowExecutionResult {
  success: boolean;
  flowId: string;
  executionId: string;
  startedAt: string;
  completedAt: string;
  /** Each node's output, keyed by node ID. */
  nodeOutputs: Record<string, Record<string, unknown>>;
  /** Execution events for replay animation on the canvas. */
  executionEvents?: ExecutionEvent[];
  error?: string;
}
