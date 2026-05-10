import fs from "fs/promises";
import path from "path";
import { WorkflowJSON, WorkflowSchema } from "./types";

const FLOWS_DIR = path.join(process.cwd(), "flows");

async function ensureFlowsDir() {
  await fs.mkdir(FLOWS_DIR, { recursive: true });
}

export async function listFlows(): Promise<WorkflowJSON[]> {
  await ensureFlowsDir();
  let files: string[];
  try {
    files = await fs.readdir(FLOWS_DIR);
  } catch {
    return [];
  }
  const flows = await Promise.all(
    files
      .filter((f) => f.endsWith(".json"))
      .map(async (file) => {
        const raw = await fs.readFile(path.join(FLOWS_DIR, file), "utf-8");
        return WorkflowSchema.parse(JSON.parse(raw));
      })
  );
  return flows;
}

export async function loadFlow(flowId: string): Promise<WorkflowJSON | null> {
  const filePath = path.join(FLOWS_DIR, `${flowId}.json`);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return WorkflowSchema.parse(JSON.parse(raw));
  } catch (e: any) {
    if (e.code === "ENOENT") return null;
    throw e;
  }
}

export async function saveFlow(flow: WorkflowJSON): Promise<void> {
  await ensureFlowsDir();
  const validated = WorkflowSchema.parse(flow);
  await fs.writeFile(
    path.join(FLOWS_DIR, `${flow.id}.json`),
    JSON.stringify(validated, null, 2),
    "utf-8"
  );
}

export async function deleteFlow(flowId: string): Promise<void> {
  await fs.unlink(path.join(FLOWS_DIR, `${flowId}.json`));
}
