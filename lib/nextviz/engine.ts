import * as registry from "./registry";
import { nodeExecutors } from "./node-executors";
import { loadEnvNextviz } from "./load-env";
import { resolveTemplates } from "./template";
import {
  ExecutionEvent,
  ExecutionPlan,
  FlowExecutionResult,
  NextVizEdge,
  NextVizNode,
  NodeExecutionContext,
  WorkflowJSON,
} from "./types";

// Load .env.nextviz into process.env (server-side)
loadEnvNextviz();

// ─── Execution Plan Cache ──────────────────────────────────────────────────
//
// Topological sort is computed once per flow and stored here.
// Subsequent calls to executeFlow skip parsing and sorting entirely.
// Key: flowId.

const planCache = new Map<string, ExecutionPlan>();

/** Invalidate the cached plan for a flow (call after editing a flow in the canvas). */
export function invalidatePlan(flowId: string): void {
  planCache.delete(flowId);
}

/** Wipe the entire cache (e.g. on hot-reload in development). */
export function clearPlanCache(): void {
  planCache.clear();
}

// ─── Topological Sort (Kahn's Algorithm) ──────────────────────────────────

function buildExecutionPlan(flow: WorkflowJSON): ExecutionPlan {
  const { nodes, edges } = flow;

  const inDegree = new Map<string, number>(nodes.map((n) => [n.id, 0]));
  const adjacency = new Map<string, string[]>(nodes.map((n) => [n.id, []]));
  const incomingEdges = new Map<string, string[]>(nodes.map((n) => [n.id, []]));

  for (const edge of edges) {
    adjacency.get(edge.source)?.push(edge.target);
    incomingEdges.get(edge.target)?.push(edge.source);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  // Kahn's BFS — nodes with no incoming edges start the queue
  const queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }

  const sortedNodeIds: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    sortedNodeIds.push(id);
    for (const neighbor of adjacency.get(id) ?? []) {
      const next = (inDegree.get(neighbor) ?? 0) - 1;
      inDegree.set(neighbor, next);
      if (next === 0) queue.push(neighbor);
    }
  }

  if (sortedNodeIds.length !== nodes.length) {
    throw new Error(
      `Flow "${flow.id}" has a cycle — execution plans must be acyclic.`
    );
  }

  return { flowId: flow.id, sortedNodeIds, incomingEdges };
}

function getOrBuildPlan(flow: WorkflowJSON): ExecutionPlan {
  const cached = planCache.get(flow.id);
  if (cached) return cached;
  const plan = buildExecutionPlan(flow);
  planCache.set(flow.id, plan);
  return plan;
}

// ─── executeFlow ───────────────────────────────────────────────────────────

/**
 * Execute a named flow with an optional payload.
 *
 * ```ts
 * // From an API route or Server Action:
 * const result = await executeFlow("chatbot-flow", { message: "Hello" });
 * ```
 *
 * @param flowId   The flow's `id` field (matches `flows/{flowId}.json`).
 * @param payload  Initial data injected into trigger nodes.
 */
export async function executeFlow(
  flowId: string,
  payload: Record<string, unknown> = {}
): Promise<FlowExecutionResult> {
  const executionId = crypto.randomUUID();
  const startedAt = new Date().toISOString();

  // 1. Load flow from disk (or in-memory cache via registry)
  let flow: WorkflowJSON | null;
  try {
    flow = await registry.loadFlow(flowId);
  } catch (err: unknown) {
    return failure(flowId, executionId, startedAt, `Failed to load flow: ${String(err)}`);
  }

  if (!flow) {
    return failure(flowId, executionId, startedAt, `Flow "${flowId}" not found.`);
  }

  // 2. Get (or build + cache) the topologically sorted execution plan
  let plan: ExecutionPlan;
  try {
    plan = getOrBuildPlan(flow);
  } catch (err: unknown) {
    return failure(flowId, executionId, startedAt, String(err));
  }

  // 3. Execute nodes in sorted order
  const nodeOutputs = new Map<string, Record<string, unknown>>();
  const executionEvents: ExecutionEvent[] = [];
  const startTime = performance.now();
  const context: NodeExecutionContext = { flowId, executionId, payload, nodeOutputs };

  const nodeMap = new Map<string, NextVizNode>(flow.nodes.map((n) => [n.id, n]));

  for (const nodeId of plan.sortedNodeIds) {
    const node = nodeMap.get(nodeId);
    if (!node) continue;

    const executor = nodeExecutors[node.type ?? ""];

    if (!executor) {
      // Unknown node types are skipped with an empty output (non-fatal)
      console.warn(`[NextViz] No executor for node type "${node.type}" — skipping.`);
      nodeOutputs.set(nodeId, {});
      continue;
    }

    // Merge outputs of all upstream nodes as this node's inputs.
    // Root nodes (no incoming edges) receive the raw trigger payload instead.
    const upstream = plan.incomingEdges.get(nodeId) ?? [];
    const inputs: Record<string, unknown> =
      upstream.length === 0
        ? { ...payload }
        : upstream.reduce<Record<string, unknown>>(
            (acc, srcId) => ({ ...acc, ...(nodeOutputs.get(srcId) ?? {}) }),
            {}
          );

    // Emit node-start event
    executionEvents.push({
      type: "node-start",
      nodeId,
      timestamp: Math.round(performance.now() - startTime),
    });

    // Resolve {{ template }} expressions in nodeData before calling the executor.
    const resolvedData = resolveTemplates(node.data, inputs, context);

    try {
      const output = await executor(resolvedData, inputs, context);
      nodeOutputs.set(nodeId, output);

      // Emit node-success event
      executionEvents.push({
        type: "node-success",
        nodeId,
        timestamp: Math.round(performance.now() - startTime),
      });
    } catch (err: unknown) {
      const errorMsg = String(err);
      executionEvents.push({
        type: "node-error",
        nodeId,
        timestamp: Math.round(performance.now() - startTime),
        error: errorMsg,
      });

      // continueOnFail: store error as node output and keep running downstream nodes.
      if (node.data.continueOnFail === true) {
        nodeOutputs.set(nodeId, { error: errorMsg, continueOnFail: true });
        continue;
      }

      return {
        ...failure(
          flowId,
          executionId,
          startedAt,
          `Node "${nodeId}" (${node.type}) threw: ${errorMsg}`
        ),
        nodeOutputs: Object.fromEntries(nodeOutputs),
        executionEvents,
      };
    }
  }

  return {
    success: true,
    flowId,
    executionId,
    startedAt,
    completedAt: new Date().toISOString(),
    nodeOutputs: Object.fromEntries(nodeOutputs),
    executionEvents,
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function failure(
  flowId: string,
  executionId: string,
  startedAt: string,
  error: string
): FlowExecutionResult {
  return {
    success: false,
    flowId,
    executionId,
    startedAt,
    completedAt: new Date().toISOString(),
    nodeOutputs: {},
    error,
  };
}
