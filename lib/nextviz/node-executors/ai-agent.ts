import OpenAI from "openai";
import { NodeExecutorFn } from "../types";

type ChatModelConfig = {
  type?: string;
  provider?: string;
  apiKeyRef?: string;
  temperature?: number;
  maxTokens?: number;
};

type MemoryConfig = {
  type?: string;
  maxMessages?: number;
};

export const aiAgent: NodeExecutorFn = async (nodeData, inputs) => {
  const chatModel = nodeData?.chatModel as ChatModelConfig | undefined;
  const model = chatModel?.type;

  if (!model) {
    throw new Error("AI Agent requires a Chat Model to be configured.");
  }

  const apiKeyRef = chatModel?.apiKeyRef ?? (nodeData?.apiKeyRef as string | undefined);
  const apiKey = apiKeyRef ? process.env[apiKeyRef] : undefined;

  if (!apiKey) {
    throw new Error(
      `AI Agent: API key not found. Set ${apiKeyRef ?? "an API key ref"} in .env.nextviz.`
    );
  }

  const userMessage =
    (inputs?.message as string) ??
    (inputs?.chatInput as string) ??
    (nodeData?.promptTemplate as string) ??
    "";

  const memory = nodeData?.memory as MemoryConfig | undefined;
  const maxMessages = memory?.maxMessages ?? 20;
  const rawHistory = (inputs?.chatHistory as Array<{ role: string; content: string }>) ?? [];
  const chatHistory = rawHistory.slice(-maxMessages);

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    ...chatHistory.map((h) => ({
      role: h.role as "user" | "assistant" | "system",
      content: h.content,
    })),
    { role: "user", content: userMessage },
  ];

  const systemPrompt = nodeData?.systemPrompt as string | undefined;
  if (systemPrompt) {
    messages.unshift({ role: "system", content: systemPrompt });
  }

  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model,
    messages,
    temperature: chatModel?.temperature ?? 0.7,
    max_tokens: chatModel?.maxTokens ?? 1024,
  });

  const response = completion.choices[0]?.message?.content ?? "";

  const updatedHistory = [
    ...chatHistory,
    { role: "user", content: userMessage },
    { role: "assistant", content: response },
  ];

  return {
    model,
    prompt: userMessage,
    response,
    chatHistory: updatedHistory,
    usage: {
      tokensUsed: completion.usage?.total_tokens ?? 0,
      promptTokens: completion.usage?.prompt_tokens ?? 0,
      completionTokens: completion.usage?.completion_tokens ?? 0,
    },
    executedAt: new Date().toISOString(),
  };
};
