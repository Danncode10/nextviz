"use server";

import fs from "fs/promises";
import path from "path";
import { NextVizProject, NextVizProjectSchema } from "./types";

const FLOW_FILE_PATH = path.join(process.cwd(), "nextviz-flow.json");

/**
 * Reads the workflow from the local file system.
 * This is the source of truth for NextViz.
 */
export async function getWorkflow(): Promise<NextVizProject | null> {
  try {
    const data = await fs.readFile(FLOW_FILE_PATH, "utf-8");
    const parsed = JSON.parse(data);
    // Validate with Zod
    return NextVizProjectSchema.parse(parsed);
  } catch (error: any) {
    // If the file doesn't exist, return null
    if (error.code === "ENOENT") {
      return null;
    }
    console.error("Failed to read workflow:", error);
    return null;
  }
}

/**
 * Saves the workflow to the local file system.
 * Includes the Production Guard to prevent file system modifications in production.
 */
export async function saveWorkflow(project: NextVizProject): Promise<{ success: boolean; error?: string }> {
  // CRITICAL: Production Guard
  if (process.env.NODE_ENV !== "development") {
    throw new Error("NextViz Local Bridge Error: File system writes are strictly forbidden outside of development mode.");
  }

  try {
    // Ensure strict validation before writing to disk
    const validWorkflow = NextVizProjectSchema.parse(project);
    
    await fs.writeFile(
      FLOW_FILE_PATH,
      JSON.stringify(validWorkflow, null, 2),
      "utf-8"
    );
    return { success: true };
  } catch (error: any) {
    console.error("Failed to save workflow:", error);
    return { success: false, error: error.message };
  }
}
