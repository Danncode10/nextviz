# NextViz — Claude Code Project Instructions

> **Core Mission**: Local-first, node-based automation engine for the Next.js ecosystem. The "Vibe Coding" philosophy: speed, local ownership, seamless React Flow orchestration. n8n for developers — flows live in your repo, pass code review, call your own TypeScript.

---

## Quick Reference — Key Paths

| What | Where |
|---|---|
| Flow files (Source of Truth) | `flows/{flow-id}.json` |
| Engine | `lib/nextviz/engine.ts` |
| Types | `lib/nextviz/types.ts` |
| Server Actions (Local Bridge) | `lib/nextviz/actions.ts` |
| Flow Registry | `lib/nextviz/registry.ts` |
| Node executors index | `lib/nextviz/node-executors/index.ts` |
| Node components | `app/nextviz/nodes/{node-name}/` |
| Shared sidebar primitives | `components/nextviz/viz-*.tsx` |
| Canvas + console | `app/nextviz/_components/` |
| Node docs | `docs/nodes/{node-name}.md` |
| Secrets | `.env.nextviz` (never commit) |
| Claude commands | `.claude/commands/` |

---

## Architectural Rules

### 1. Source of Truth
`flows/{flow-id}.json` is the absolute authority. Every canvas change must sync via Server Actions. Never mutate flow state client-side without saving.

### 2. Production Guard — CRITICAL
Every Server Action that touches `fs` must start with:
```ts
if (process.env.NODE_ENV !== 'development') throw new Error('Canvas is read-only outside localhost.');
```

### 3. The Three-File Node Pattern
**Every node MUST be a self-contained three-file folder. No exceptions.**
```
app/nextviz/nodes/{node-name}/
├── node.tsx     ← React canvas component (UI only — no process.env, no server calls)
├── panel.tsx    ← Properties sidebar (viz-* primitives only, auto-saves to flow JSON)
└── logic.ts     ← NodeExecutorFn (server-side executor — no React, no browser APIs)
```
Also register in `lib/nextviz/node-executors/index.ts`.

### 4. Secret Management
Store the env var **name**, never the value, in flow JSON:
```json
{ "apiKeyRef": "OPENAI_API_KEY" }   ✅ correct
{ "apiKey": "sk-abc123..." }         ❌ forbidden
```
Resolve at runtime: `process.env[nodeData.apiKeyRef as string]`

### 5. Variable Templates
Store raw template strings in `node.data` — never pre-resolve in the UI:
```
{{ $node["NodeName"].data.email }}   ← n8n-compatible (verbose)
{{ user_email }}                      ← NextViz shorthand (preferred)
```

### 6. Type Safety
Use `NextVizNode` and `WorkflowJSON` from `lib/nextviz/types.ts`. No `any`.

### 7. Orchestrator Pattern
Nodes wrap existing TypeScript — they don't contain business logic directly.
```ts
// lib/db/users.ts — business logic lives here
export async function getUser(id: string) { ... }

// node executor — just a wrapper
import { getUser } from "@/lib/db/users";
return await getUser(inputs.userId);
```

---

## UI Standards

- **Dark default**: `bg-zinc-950`, `text-zinc-50` — never pure `#000`
- **Canvas bg**: `variant="dots"` color `#333`
- **Node tokens**: `bg-card`, `border-border`, `text-card-foreground`
- **Running**: `border-primary` + pulse animation
- **Success**: `border-green-500` + ✅ badge
- **Error**: `border-destructive` + ❌ + tooltip
- **Read-only banner**: shown when `isLocalhost` is false

---

## Built-in Console (`app/nextviz/_components/console.tsx`)

Never use `console.warn`/`console.error` for user-visible messages. Use the built-in console.

| Tab | Content |
|---|---|
| Output | Node execution results from `result.nodeOutputs` |
| Problems | Node errors + canvas warnings (`canvasWarnings` prop) |
| Logs | Execution timeline |
| Chat | Chat interface (chatTrigger flows only) |

**To surface a canvas warning:**
```ts
setCanvasWarnings((prev) => [...prev, { message: "...", severity: "warning" }]);
setShowExecutionOutput(true);
```

---

## viz-* Sidebar Primitives

Use **only** these for node panel inputs. Never build custom form inputs per node.

| Component | Use |
|---|---|
| `viz-input` | Text / number / URL / password |
| `viz-select` | Static dropdown |
| `viz-toggle` | Boolean toggle |
| `viz-kv-editor` | Key-value rows (headers, params) |
| `viz-code-editor` | Monaco/CodeMirror JS pane (not yet built) |
| `viz-connection` | API key picker from `.env.nextviz` (not yet built) |

---

## Before Building Any Node

1. Use `github-mcp-server` → search `n8n-io/n8n` for the equivalent node
2. Read the n8n descriptor (`*.node.ts`) — extract field names, defaults, option sets
3. Read the n8n executor — understand the runtime logic
4. Check/create `docs/nodes/{node-name}.md` (see `docs/nodes/README.md` for format)
5. Only port data shape + logic — n8n's frontend is Vue 3, not usable directly
6. Use `/build-node` command (`.claude/commands/build-node.md`) for the full protocol

---

## Node Execution Context

```ts
// NodeExecutorFn signature — every logic.ts must match this
(
  nodeData: Record<string, unknown>,   // resolved node.data from flow JSON
  inputs: Record<string, unknown>,     // merged upstream outputs (or trigger payload)
  context: NodeExecutionContext        // flowId, executionId, payload, nodeOutputs map
) => Promise<Record<string, unknown>>
```

---

## Git / Checkpoint Protocol

```bash
git add flows/ .env.nextviz.example
git commit -m "nextviz: [description]"
```
One file per flow = no merge conflicts. Use `/checkpoint` command for this.

---

## Current Phase Status

| Phase | Status |
|---|---|
| Phase 1 — Foundation | ✅ Done |
| Phase 2 — Canvas & Local Bridge | ✅ Done |
| Phase 3 — Execution Engine | ✅ Done |
| Phase 3.5 — Flow Registry | ✅ Done |
| Phase 4 — Node Roster | 🔶 In Progress |
| Phase 5 — CLI Distributor (`npx nextviz`) | ⬜ Not Started |

### Phase 4 Node Status
| Node | Status |
|---|---|
| Manual Trigger | ✅ Done |
| Webhook (onHTTP) | ✅ Done |
| Schedule (Cron) | ✅ Done |
| Chat Trigger | ✅ Done |
| AI Agent | ✅ Done |
| HTTP Request | 🔶 Tier 1 Complete |
| Supabase DB | ⬜ Not Started |
| Filter / If-Else | ⬜ Not Started |
| Code (JavaScript) | ⬜ Not Started |
| Vector Store | ⬜ Not Started |
| Discord / Slack | ⬜ Not Started |
| Gmail / Resend | ⬜ Not Started |

---

## Known Issues / Open Work

- [Issue #3](https://github.com/Danncode10/nextviz/issues/3): `on-http.tsx`, `log-data.tsx`, `chat-model-node/`, `memory-node/` need migrating to three-file pattern
- `viz-code-editor` and `viz-connection` primitives not yet built
- Node docs missing for: `ai-agent`, `schedule-trigger`, `chat-trigger`, `on-http`, `log-data`

---

## Related Files
- `SKILLS.md` — skill procedures (diagnostics, node builds, sidebar, checkpoints)
- `make_component_prompt.md` — manual node build template (use `/build-node` instead)
- `docs/masterplan.md` — full phase roadmap
- `docs/engine-architecture.md` — engine internals, caching, variable resolution
- `docs/FOLDER_STRUCTURE.md` — directory layout
