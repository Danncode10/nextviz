import { NodeExecutorFn } from "../types";
import { manualTrigger } from "./manual-trigger";
import { onHTTP } from "./on-http";
import { httpAction } from "./http-action";
import { logData } from "./log-data";
import { chatTrigger } from "./chat-trigger";
import { aiAgent } from "./ai-agent";

/**
 * Maps node `type` strings (as set in the canvas) to their executor functions.
 * Add a new entry here whenever a new node type is created.
 */
export const nodeExecutors: Record<string, NodeExecutorFn> = {
  manualTrigger,
  onHTTP,
  httpAction,
  logData,
  chatTrigger,
  aiAgent,
};
