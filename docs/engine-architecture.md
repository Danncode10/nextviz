# NextViz Engine Architecture

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
Flows are directly invocable via pure TypeScript.

```typescript
import { executeFlow } from "@/lib/nextviz/engine";

export async function POST(req: Request) {
  const body = await req.json();
  
  // Directly trigger a flow by its JSON filename
  const result = await executeFlow("chatbot-flow", { message: body.message });
  
  return Response.json(result);
}
```

## Execution Caching for Zero Latency
To ensure `executeFlow` is fast enough for production endpoints:

1. **First Invocation**: The Engine reads `chatbot-flow.json`.
2. **Topological Sort**: The Engine calculates the precise order of node execution based on the edge connections.
3. **Caching**: This Execution Plan is cached in memory.
4. **Subsequent Invocations**: The Engine skips disk reads and JSON sorting, instantly executing the compiled plan.
