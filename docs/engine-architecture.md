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

---

## The Execution Flow — Step by Step

This is the full lifecycle of what happens when a user hits "Run" or a Webhook fires.

```
1. Hydration       →  engine reads flows/{flowId}.json (or hits the plan cache)
2. Context Inject  →  process.env keys from .env.nextviz are injected into execution context
3. Step-by-Step    →  nodes execute in topological order; each node receives upstream outputs as inputs
4. Visual Feedback →  UI polls/subscribes to execution state and renders node status in real-time
```

### Context Injection Detail

Before any node runs, the engine builds a `RuntimeContext` that merges:
- The **trigger payload** (webhook body, cron tick, manual args)
- **Environment keys** resolved from `.env.nextviz` (by key name — never the value at serialization time)
- **Accumulated node outputs** (Map keyed by node ID — each node appends to this)

### Variable Mapping at Runtime

Node `data` fields support two value modes, resolved during context injection:

| Mode       | Storage in `node.data`                         | Resolved Value                          |
|------------|------------------------------------------------|-----------------------------------------|
| Fixed      | `"value": "hello@example.com"`                 | The literal string                      |
| Expression | `"value": "{{ $node[\"NodeA\"].data.email }}"` | Evaluated against the runtime context   |

The engine runs a lightweight template resolver over `node.data` before handing it to the executor.

### Secret Management Bridge

API key fields store only the **env variable name**, never the secret itself:

```json
// In flows/my-flow.json (safe to commit)
{
  "type": "openai",
  "data": {
    "apiKeyRef": "OPENAI_API_KEY"
  }
}
```

```typescript
// In the executor (lib/nextviz/node-executors/openai.ts)
const apiKey = process.env[nodeData.apiKeyRef as string];
if (!apiKey) throw new Error(`Secret "${nodeData.apiKeyRef}" not found in .env.nextviz`);
```

---

## Properties Sidebar — Architecture Guide

When a user clicks a node on the canvas, a **Properties Sidebar** slides out. It reads from and writes to `node.data` in the active flow JSON.

### Field Types (viz-* Primitives)

These are the pre-built UI controls the sidebar uses. Node builders import them from a shared component library (`components/nextviz/viz-*`):

| Component         | Use case                                                         |
|-------------------|------------------------------------------------------------------|
| `viz-input`       | Text / number / URL input                                        |
| `viz-select`      | Static dropdown (method: GET/POST/PUT, model: gpt-4o, etc.)      |
| `viz-code-editor` | Monaco/CodeMirror pane for inline JS snippets                    |
| `viz-connection`  | API key picker — auto-reads available keys from `.env.nextviz`   |

### The Raw Toggle

Every field supports two modes toggled by a `</>` icon:

```
[ Fixed Value  ] Hello World           ← static, stored as a string
[ Expression   ] {{ user.email }}      ← template, evaluated at runtime
```

The `isExpression: boolean` flag is stored alongside the value in `node.data`.

---

## The Manifest Pattern (Custom Node Structure)

Every Phase 4+ node follows a **two-file co-location** convention:

```
app/nextviz/nodes/openai/
├── node.tsx        ← React component (canvas UI, Properties Sidebar config)
└── logic.ts        ← NodeExecutorFn (server-side, imported by node-executors/index.ts)
```

This makes nodes fully self-contained and portable — drag the folder out and it still works.

---

## Visual Feedback on the Canvas

During execution, the engine emits status events per node. The canvas subscribes and applies class overrides:

| Status     | Visual Treatment                                        |
|------------|---------------------------------------------------------|
| `idle`     | `border-border` (default)                               |
| `running`  | `border-primary` + CSS pulse animation                  |
| `success`  | `border-green-500` + ✅ overlay badge                   |
| `error`    | `border-destructive` + ❌ overlay + error tooltip        |

> **Vibe Feature:** Right-click any node → **"Convert to Code"** — serializes the node's current UI config into a standalone TypeScript function. The user owns the output forever, zero lock-in.
