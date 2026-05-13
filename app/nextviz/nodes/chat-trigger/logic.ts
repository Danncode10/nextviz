import { NodeExecutorFn } from "@/lib/nextviz/types";

if (process.env.NODE_ENV !== "development") {
  throw new Error("ChatTrigger logic can only run in development mode.");
}

export const executeChatTrigger: NodeExecutorFn = async (nodeData, inputs) => {
  const message = (inputs?.chatMessage as string) ?? (nodeData?.testMessage as string) ?? "";

  return {
    sessionId: `session-${Date.now()}`,
    message,
    timestamp: new Date().toISOString(),
    chatHistory: [],
    isPublic: nodeData?.chatPublic ?? false,
  };
};
