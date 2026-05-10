import { NodeExecutorFn } from "../types";

/**
 * logData — prints node inputs to the server console and passes them through.
 * Use this for debugging flows or as a terminal action node.
 */
export const logData: NodeExecutorFn = async (nodeData, inputs, context) => {
  const label = (nodeData.label as string) || "logData";
  const timestamp = new Date().toISOString();

  console.log(
    `[NextViz][${context.flowId}][${context.executionId}] ${label}`,
    JSON.stringify(inputs, null, 2)
  );

  return {
    logged: true,
    label,
    data: inputs,
    timestamp,
  };
};
