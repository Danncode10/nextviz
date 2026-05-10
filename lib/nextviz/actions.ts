"use server";

import * as registry from "./registry";
import { WorkflowJSON } from "./types";

function guardDev() {
  if (process.env.NODE_ENV !== "development") {
    throw new Error(
      "NextViz Local Bridge: File system writes are forbidden outside development."
    );
  }
}

export async function listFlows(): Promise<WorkflowJSON[]> {
  try {
    return await registry.listFlows();
  } catch (e) {
    console.error("Failed to list flows:", e);
    return [];
  }
}

export async function loadFlow(flowId: string): Promise<WorkflowJSON | null> {
  return registry.loadFlow(flowId);
}

export async function saveFlow(
  flow: WorkflowJSON
): Promise<{ success: boolean; error?: string }> {
  guardDev();
  try {
    await registry.saveFlow(flow);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createFlow(
  name: string,
  description?: string
): Promise<WorkflowJSON> {
  guardDev();
  const id = `flow-${Date.now()}`;
  const flow: WorkflowJSON = { id, name, description, nodes: [], edges: [] };
  await registry.saveFlow(flow);
  return flow;
}

export async function deleteFlow(
  flowId: string
): Promise<{ success: boolean; error?: string }> {
  guardDev();
  try {
    await registry.deleteFlow(flowId);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
