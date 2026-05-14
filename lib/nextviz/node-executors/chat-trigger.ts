import { NodeExecutorFn } from "../types";

export const chatTrigger: NodeExecutorFn = async (nodeData, inputs) => {
  const message =
    (inputs?.chatMessage as string) ??
    (nodeData?.testMessage as string) ??
    "";

  return {
    message,
    sessionId:
      (inputs?.sessionId as string) ?? `session-${Date.now()}`,
    timestamp: new Date().toISOString(),
    chatHistory: (inputs?.chatHistory as unknown[]) ?? [],
    isPublic: nodeData?.chatPublic ?? false,
  };
};
