# NextViz Engine Architecture

## 🗂️ Flow Storage & Discovery (Phase 3.5)

### Individual Flow Files (Not Monolithic)
Starting in Phase 3.5, flows are stored as individual JSON files in the `flows/` directory:

```
flows/
├── default.json          // {id: "default", name: "Default", nodes: [...], edges: [...]}
├── chatbot-flow.json
├── data-processor.json
└── webhook-receiver.json
```

**Each flow file structure:**
```json
{
  "id": "chatbot-flow",
  "name": "Chatbot Automation",
  "description": "Handles incoming messages",
  "nodes": [...],
  "edges": [...],
  "metadata": {
    "createdAt": "2026-05-10",
    "tags": ["chatbot", "ai"]
  }
}
```

### The FlowRegistry Pattern
The `lib/nextviz/registry.ts` exports a `FlowRegistry` utility that:
1. Scans the `flows/` directory at startup.
2. Caches available flow metadata (id, name, description).
3. Provides methods: `loadFlow(flowId)`, `listFlows()`, `createFlow(flowId, schema)`, `updateFlow(flowId, changes)`.

**Benefits:**
- ✅ **No merge conflicts** – teams can work on different flows independently.
- ✅ **Scalable** – supports hundreds of flows without file bloat.
- ✅ **CI/CD friendly** – each flow can be deployed/versioned separately.

---

## The Orchestrator Pattern
NextViz is designed to be a visual orchestrator of your *existing* TypeScript code, rather than a completely proprietary logic engine. 

### 1. The Wrapper Rule
NextViz nodes should **never** contain complex business logic directly inside the node execution body. 
Instead, they should act as "Wrappers" around pure TypeScript functions.

**BAD:**
```typescript
// Inside a NextViz Postgres Node
const { data } = await supabase.from('users').select('*').eq('id', inputs.userId);
return data;
```

**GOOD:**
```typescript
// Inside lib/db/users.ts
export async function getUser(userId: string) {
  const { data } = await supabase.from('users').select('*').eq('id', userId);
  return data;
}

// Inside a NextViz Postgres Node
import { getUser } from "@/lib/db/users";
return await getUser(inputs.userId);
```
**Why?** This guarantees that your core software architecture remains framework-agnostic. If you stop using NextViz, your business logic is still perfectly intact.

## The `executeFlow` API
Flows are directly invocable via pure TypeScript. Flow names map to `flows/{flowName}.json`.

```typescript
import { executeFlow } from "@/lib/nextviz/engine";

export async function POST(req: Request) {
  const body = await req.json();
  
  // Directly trigger a flow by its id (loads from flows/{flowName}.json)
  const result = await executeFlow("chatbot-flow", { message: body.message });
  
  return Response.json(result);
}
```

**The engine will:**
1. Load `flows/chatbot-flow.json` (first time only, then use cache).
2. Resolve the topological sort and cache it in memory.
3. Execute nodes sequentially or in parallel based on edge connections.
4. Return the final result to the caller.

## Execution Caching for Zero Latency
To ensure `executeFlow` is fast enough for production endpoints:

1. **First Invocation**: The Engine reads `chatbot-flow.json`.
2. **Topological Sort**: The Engine calculates the precise order of node execution based on the edge connections.
3. **Caching**: This Execution Plan is cached in memory.
4. **Subsequent Invocations**: The Engine skips disk reads and JSON sorting, instantly executing the compiled plan.
