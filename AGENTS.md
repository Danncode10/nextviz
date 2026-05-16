<!-- BEGIN:nextjs-agent-rules -->

# 🚀 NextViz AI Steering & Project Rules (AGENTS.md)

> **Core Mission**: You are an expert AI Engineer working on **NextViz**—a local-first, node-based automation engine. Your goal is to maintain the "Vibe Coding" philosophy: speed, local ownership, and seamless React Flow orchestration.

## 🛠 Required Diagnostic Protocol

Before modifying the codebase, verify the following environment state:

1. **Local Bridge Check**: Ensure the agent has access to the local filesystem (`fs-extra`) via Node.js.
2. **Environment Check**: Identify if the current execution is `development` or `production`.
3. **Dependency Check**: Verify `reactflow`, `lucide-react`, and `shadcn/ui` are initialized.

## 🏗 NextViz Architectural Guardrails

1. **The Source of Truth (SOT)**: Individual flow files in `flows/{flow-id}.json` are the absolute authority. Any UI change in the canvas must be synced to the appropriate flow file via Server Actions.
   - **Flow Discovery:** The `FlowRegistry` (in `lib/nextviz/registry.ts`) auto-scans the `flows/` directory at startup.
   - **Active Flow State:** The UI tracks `activeFlowId` in memory, not persisted to a separate manifest.
   - **Per-Flow Structure:** Each file contains `{id, name, description, nodes[], edges[]}`.

2. **The Production Guard**: **CRITICAL**. Any Server Action involving `fs` (File System) must be wrapped in a check: `if (process.env.NODE_ENV !== 'development') throw new Error(...)`.
3. **Node Modularity**: Every node (Trigger, Action, Logic) must be a self-contained component in `app/nextviz/nodes/`.
4. **Local Secrets**: All sensitive keys (OpenAI, Supabase Service Role) MUST be stored in `.env.nextviz`. Never commit this file.
5. **Type Safety**: Use the `NextVizNode` and `WorkflowJSON` interfaces for all flow manipulations. No `any`.

## 🎨 UI & UX Standards (The "NextViz" Aesthetic)

1. **Dark Mode Default**: Use `bg-zinc-950` and `text-zinc-50`. Avoid pure `#000`.
2. **The Canvas**: React Flow backgrounds should use `variant="dots"` with a subtle color (`#333`).
3. **Semantic Tokens**:
* Nodes: `bg-card`, `border-border`, `text-card-foreground`.
* Active/Running: `border-primary` with a pulse effect.
* Error state: `border-destructive`.


4. **Read-Only Mode**: If `isLocalhost` is false, the UI must show a fixed header banner: *"Read-Only Mode: Edit in Localhost to sync with Git."*

## 🔄 Vibe Workflow & Git Integration

1. **Commit Checkpoints**: When requested to "checkpoint," use the Terminal/GitHub MCP to:
* `git add flows/ .env.nextviz.example` (individual flow files, not a monolithic file)
* `git commit -m "nextviz: [detailed description of workflow change]"`
* **Benefits:** Each developer can commit their own flows without merge conflicts.

2. **Feature Blueprints**: Before building a new Node type (e.g., Discord, Slack), look for the schema definition in `lib/nextviz/registry.ts`.
3. **Atomic Services**: Logic for third-party integrations (Supabase, OpenAI) must live in `lib/nextviz/services/` and be imported by the Node components.

## 🔒 Security & RLS (Supabase)

1. **Service Role Warning**: Only use the Supabase Service Role key inside Server Actions that are guarded by the `development` check.
2. **Client-Side Safety**: Never expose `.env.nextviz` keys to the browser. Use the "Bridge" pattern to handle executions on the server.

## 🗄️ CLI Engine Logic (For CLI Tasks)

If tasked with updating the `npx nextviz` logic:

1. **Templates**: Ensure the `templates/` folder matches the current working `app/nextviz` structure.
2. **Injections**: The CLI must automatically add `.env.nextviz` to the user's `.gitignore`.

## 🧠 The Headless Engine (Phase 3 Rules)

1. **The Orchestrator, Not the Brain**: NextViz is an orchestrator. Core business logic (e.g., Supabase queries) MUST be written in pure TypeScript in standard directories (e.g., `lib/db/`). NextViz action nodes simply import and wrap these functions.
2. **Direct Invocation**: Flows are executed in code via `executeFlow("flow-name", payload)`. This allows Next.js API Routes and Server Actions to seamlessly trigger visual workflows.
3. **Execution Caching**: To prevent runtime overhead, the Engine (`engine.ts`) MUST cache the topological sort (the parsed execution plan) in memory so that high-frequency loops are not bottlenecked by JSON parsing and edge resolution.

## 🔥 The Heavy Hitters (Phase 4 Rules)

> Build these 10 nodes in priority order. Each unlocks a new category of automation.

### Node Priority Roster

| Priority | Node              | Category  | Key Dependency                    |
|----------|-------------------|-----------|-----------------------------------|
| 1        | Schedule (Cron)   | Trigger   | `node-schedule`                   |
| 2        | OpenAI/Anthropic  | AI        | `openai` / `@anthropic-ai/sdk`    |
| 3        | Supabase DB       | Data      | `@supabase/supabase-js`           |
| 4        | HTTP Request      | Data      | `fetch` (native)                  |
| 5        | Filter / If-Else  | Logic     | none (pure logic)                 |
| 6        | Code (JS)         | Logic     | sandboxed `vm2` or edge runtime   |
| 7        | Vector Store      | AI        | Supabase `pgvector`               |
| 8        | Discord / Slack   | Messaging | REST API / Webhooks               |
| 9        | Gmail / Resend    | Messaging | `resend` SDK                      |

### The Manifest Rule (Two-File Pattern)
Every Phase 4+ node **MUST** be a self-contained two-file folder. Never mix UI and executor:
```
app/nextviz/nodes/{node-name}/
├── node.tsx    ← React canvas component (UI only — no server calls, no process.env)
└── logic.ts    ← NodeExecutorFn (server-side executor — no React, no browser APIs)
```

### Secret Management Rule
Node `data` fields store the **env variable name**, never the raw secret:
```json
{ "apiKeyRef": "OPENAI_API_KEY" }    ← CORRECT — key name stored in flow JSON
{ "apiKey": "sk-abc123..." }          ← FORBIDDEN — secret value in flow JSON
```
Executors resolve the secret at runtime with `process.env[nodeData.apiKeyRef as string]`.

### Variable Mapping Rule
Fields referencing upstream outputs use template syntax that the engine resolves at runtime. Store the raw template string in `node.data` — never pre-resolve it in the UI layer:
```
{{ $node["NodeName"].data.email }}   ← n8n-compatible form (verbose)
{{ user_email }}                      ← NextViz shorthand (preferred in UI dropdowns)
```

### viz-* Sidebar Primitives Rule
When building a node's Properties Sidebar, use **only** the shared primitives from `components/nextviz/viz-*`. Do not build custom form inputs per node:
- `viz-input` — text / number / URL input
- `viz-select` — static option dropdown
- `viz-code-editor` — Monaco / CodeMirror pane for JS snippets
- `viz-connection` — API key picker that auto-reads `.env.nextviz` key names

### n8n Source Reference Rule
Before building or modifying **any** node, use `github-mcp-server` to read the equivalent implementation from the `n8n-io/n8n` public repo. Follow this sequence:

1. **Search** for the node in `n8n-io/n8n` using `search_code` (e.g. `HttpRequest`, `ScheduleTrigger`).
2. **Read** the node's descriptor file (usually `*.node.ts`) to extract: input/output field names, default values, and option sets.
3. **Read** the executor logic to understand how n8n processes the node at runtime.
4. **Adapt** — do not copy Vue/n8n-specific code. Port the data shape and logic into NextViz's two-file pattern (`node.tsx` + `logic.ts`).
5. **Note any gaps** — if n8n has behavior NextViz can't support yet, call it out before coding.

> n8n's frontend is Vue 3. Only the **data schemas, field names, execution logic, and option sets** are portable to NextViz.

### Execution Visual Feedback Rule
The canvas must reflect live execution state. Apply these styles when execution events are received:
- `running` → `border-primary` + pulse animation
- `success` → `border-green-500` + ✅ overlay badge
- `error` → `border-destructive` + ❌ overlay + tooltip with error message

---

## Code Architecture Summary

* **Primary Data**: `flows/{flow-id}.json` (Source of Truth) + `FlowRegistry` (auto-discovery)
* **Framework Code**: `lib/nextviz/` (engine, actions, registry, services, types)
* **Custom Nodes**: `app/nextviz/nodes/` (user-created node components)
* **Secrets**: `.env.nextviz` (isolated from `.env`)
* **Frontend**: Next.js 15+ App Router + React Flow
* **Backend**: Next.js Server Actions (The "Local Bridge")
* **Deployment**: Vercel (Running in Read-Only Mode)

**Always be concise. If a change breaks the "Local Bridge" logic, stop and warn the user.**

---

### How to use this:

1. Save this as `AGENTS.md` in your root.
2. Whenever you start a new chat session with your AI, tell it: **"Read AGENTS.md, CLAUDE.md, README.md, and SKILLS.md and follow the NextViz protocols."**
3. It will now know exactly how to handle your specific "Local Bridge" and "Production Guard" setup without you explaining it every time.

<!-- END:nextjs-agent-rules -->, 