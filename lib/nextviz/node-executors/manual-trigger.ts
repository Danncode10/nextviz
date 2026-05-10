import { NodeExecutorFn } from "../types";

/**
 * ManualTrigger — root node, no upstream inputs.
 * Passes the trigger payload downstream as-is.
 */
export const manualTrigger: NodeExecutorFn = async (_nodeData, _inputs, context) => {
  return {
    triggered: true,
    triggeredAt: new Date().toISOString(),
    payload: context.payload,
  };
};
