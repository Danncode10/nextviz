import { z } from "zod";

// --- Node Schema ---
// A strict schema for nodes. React Flow uses specific structure.
export const NextVizNodeSchema = z.object({
  id: z.string(),
  type: z.string().optional(), // 'default', 'input', 'output', 'customNode' etc.
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.record(z.string(), z.any()), // flexible data object for node config
  dragHandle: z.string().optional(),
  selected: z.boolean().optional(),
  width: z.number().optional().nullable(),
  height: z.number().optional().nullable(),
});

// --- Edge Schema ---
// A strict schema for edges connecting nodes.
export const NextVizEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional().nullable(),
  targetHandle: z.string().optional().nullable(),
  type: z.string().optional(), // e.g., 'default', 'straight', 'step', 'smoothstep'
  animated: z.boolean().optional(),
  label: z.string().optional(),
});

// --- Workflow Schema ---
// The absolute source of truth for nextviz-flow.json
export const WorkflowSchema = z.object({
  nodes: z.array(NextVizNodeSchema),
  edges: z.array(NextVizEdgeSchema),
  version: z.string().default("1.0"),
});

// --- Inferred Types ---
// Expose TypeScript interfaces generated from the Zod schemas
export type NextVizNode = z.infer<typeof NextVizNodeSchema>;
export type NextVizEdge = z.infer<typeof NextVizEdgeSchema>;
export type WorkflowJSON = z.infer<typeof WorkflowSchema>;
