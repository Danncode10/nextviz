import { NodeExecutorFn } from "../types";

export const chatTrigger: NodeExecutorFn = async (nodeData, inputs) => {
  const message =
    (inputs?.chatMessage as string) ??
    (nodeData?.testMessage as string) ??
    "";

  const chatHistory = (inputs?.chatHistory as unknown[]) ?? [];
  console.log(`[Chat Trigger] Received chatHistory length: ${Array.isArray(chatHistory) ? chatHistory.length : 'invalid'}`);

  return {
    message,
    sessionId:
      (inputs?.sessionId as string) ?? `session-${Date.now()}`,
    timestamp: new Date().toISOString(),
    chatHistory,
    isPublic: nodeData?.chatPublic ?? false,
  };
};
