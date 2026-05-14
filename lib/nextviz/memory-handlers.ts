/**
 * Memory handlers for different memory modes.
 * Each mode has its own isolated logic.
 */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── None Mode: Stateless ──────────────────────────────────────────────────
// No history passed to AI. Each message is independent.

export function buildNoneMemory(messages: ChatMessage[]): ChatMessage[] {
  return [];
}

// ─── Simple Mode: Last N Messages ──────────────────────────────────────────
// Pass the last N complete messages to maintain conversational context.

export function buildSimpleMemory(messages: ChatMessage[], maxMessages: number = 20): ChatMessage[] {
  return messages.slice(-maxMessages);
}

// ─── Entity Mode: Extract & Maintain Facts ────────────────────────────────
// Extract key entities (names, dates, facts) from the conversation.
// Builds a fact list that the AI uses to maintain context without full history.

export interface Entity {
  key: string;      // e.g., "user_name", "company", "date_mentioned"
  value: string;    // e.g., "Dann", "Acme Corp", "2025-01-15"
  confidence: number; // 0-1, how confident we are
}

function extractEntitiesFromText(text: string, previousEntities: Map<string, Entity> = new Map()): Entity[] {
  const entities: Entity[] = [];

  // Pattern 1: "my name is <name>" or "i'm <name>" or "call me <name>"
  const nameMatch = text.match(/(?:my name is|i(?:'m| am)|call me)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i);
  if (nameMatch) {
    entities.push({
      key: "user_name",
      value: nameMatch[1],
      confidence: 0.9,
    });
  }

  // Pattern 2: "i work at <company>" or "company is <company>"
  const companyMatch = text.match(/(?:work(?:\s+at|ing\s+for)|company is|employed at)\s+([a-zA-Z\s&]+?)(?:\.|,|$)/i);
  if (companyMatch) {
    entities.push({
      key: "company",
      value: companyMatch[1].trim(),
      confidence: 0.85,
    });
  }

  // Pattern 3: "i'm <role/title>" or "role is <role>"
  const roleMatch = text.match(/(?:i(?:'m| am|'ve)\s+(?:a|an)?|role is)\s+([a-zA-Z\s]+?)(?:\.|,|$)/i);
  if (roleMatch) {
    entities.push({
      key: "user_role",
      value: roleMatch[1].trim(),
      confidence: 0.8,
    });
  }

  // Merge with previous entities (keep older ones if no update)
  const merged = new Map(previousEntities);
  for (const entity of entities) {
    merged.set(entity.key, entity);
  }

  return Array.from(merged.values());
}

export function buildEntityMemory(
  messages: ChatMessage[],
  previousEntities: Entity[] = []
): { factString: string; entities: Entity[] } {
  // Start with previous entities
  const entityMap = new Map<string, Entity>();
  for (const entity of previousEntities) {
    entityMap.set(entity.key, entity);
  }

  // Extract new entities from recent messages
  const recentMessages = messages.slice(-5); // Only scan last 5 messages to avoid noise
  for (const msg of recentMessages) {
    const newEntities = extractEntitiesFromText(msg.content, entityMap);
    for (const entity of newEntities) {
      entityMap.set(entity.key, entity);
    }
  }

  // Build a natural-language fact string for the AI to read
  const entities = Array.from(entityMap.values());
  let factString = "";
  if (entities.length > 0) {
    factString = "Known facts about the user:\n";
    for (const entity of entities) {
      const humanKey = entity.key
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      factString += `• ${humanKey}: ${entity.value}\n`;
    }
  }

  return { factString, entities };
}

// ─── Memory Handler Router ────────────────────────────────────────────────
// Dispatches to the correct memory handler based on mode.

export function buildChatHistory(
  memoryType: string,
  messages: ChatMessage[],
  previousEntities?: Entity[],
  maxMessages?: number
): {
  history: ChatMessage[];
  entityContext?: string;
  entities?: Entity[];
} {
  switch (memoryType) {
    case "none":
      return { history: buildNoneMemory(messages) };

    case "simple":
      return { history: buildSimpleMemory(messages, maxMessages ?? 20) };

    case "entity":
      const { factString, entities } = buildEntityMemory(messages, previousEntities ?? []);
      return {
        history: [], // Entity mode doesn't pass full history
        entityContext: factString,
        entities,
      };

    default:
      return { history: buildNoneMemory(messages) };
  }
}
