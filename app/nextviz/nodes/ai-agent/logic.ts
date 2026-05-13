import { NodeExecutorFn } from "@/lib/nextviz/types";

if (process.env.NODE_ENV !== "development") {
  throw new Error("AIAgent logic can only run in development mode.");
}

export const executeAIAgent: NodeExecutorFn = async (nodeData, inputs) => {
  const model = (nodeData?.chatModel as { type?: string; temperature?: number })?.type;

  if (!model) {
    throw new Error("AI Agent requires a Chat Model to be configured.");
  }

  const promptTemplate = (nodeData?.promptTemplate as string) ?? "{{ $json.chatInput }}";
  const userMessage = (inputs?.chatInput as string)
    ?? (inputs?.message as string)
    ?? promptTemplate;

  // Resolve API key from env (never store raw key in node data)
  const apiKeyRef = nodeData?.apiKeyRef as string | undefined;
  const apiKey = apiKeyRef ? process.env[apiKeyRef] : undefined;

  return {
    model,
    prompt: userMessage,
    response: null,       // populated by actual model call in a future integration
    usage: { tokensUsed: 0, cost: 0 },
    executedAt: new Date().toISOString(),
    nodeId: nodeData?.id,
  };
};
