import { NodeExecutorFn } from "../types";

/**
 * onHTTP — webhook trigger node.
 * Receives the incoming HTTP request data from the execution payload
 * and forwards it downstream for other nodes to consume.
 */
export const onHTTP: NodeExecutorFn = async (_nodeData, _inputs, context) => {
  return {
    method: (context.payload.method as string) ?? "POST",
    headers: (context.payload.headers as Record<string, string>) ?? {},
    body: context.payload.body ?? {},
    params: (context.payload.params as Record<string, string>) ?? {},
    receivedAt: new Date().toISOString(),
  };
};
