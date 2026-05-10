import { z } from "zod";

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

export type NextVizNode = z.infer<typeof NextVizNodeSchema>;
export type NextVizEdge = z.infer<typeof NextVizEdgeSchema>;
export type WorkflowJSON = z.infer<typeof WorkflowSchema>;
