# 🗺️ NextViz Masterplan

Local-first, node-based automation engine for the Next.js ecosystem.

---

## ✅ Phase 1 — Foundation
- [x] Next.js 15+ App Router, Tailwind, shadcn/ui, ReactFlow
- [x] NextViz directory structure (`app/nextviz`, `lib/nextviz`)
- [x] `.env.nextviz` isolated from `.env`, gitignored

## ✅ Phase 2 — Canvas & Local Bridge
- [x] Dark theme canvas (`bg-zinc-950`, dots background, semantic tokens)
- [x] Zod-validated Workflow Schema (`nodes[]`, `edges[]`)
- [x] Server Actions Local Bridge (`lib/nextviz/actions.ts`) — dev-only fs guard
- [x] Auto-save on node/edge change
- [x] Read-Only overlay for non-localhost environments
- [x] Multi-sidebar layout (left: flows, right: node palette)

## ✅ Phase 3 — Execution Engine
- [x] `executeFlow(flowId, payload)` — decoupled from UI, callable from API routes
- [x] Topological sort (Kahn's algorithm) with in-memory execution plan cache
- [x] Per-node input merging (upstream outputs → next node's inputs)
- [x] Execution events tracking (`node-start`, `node-success`, `node-error`)
- [x] Result Replay — animates node states on canvas after execution completes

## ✅ Phase 3.5 — Flow Registry
- [x] Migrated from monolithic JSON to `flows/{flow-id}.json` (one file per flow)
- [x] `FlowRegistry` in `lib/nextviz/registry.ts` — auto-discovers flows on startup
- [x] URL-based flow switching (`/nextviz?flowId=...`), `FlowsContext` for sidebar

---

## 🔥 Phase 4 — Node Roster

> Status key: ✅ Done · 🔶 In Progress · ⬜ Not Started

### Triggers

| Node | Status | Doc |
|---|---|---|
| Manual Trigger | ✅ Done | — |
| Webhook (onHTTP) | ✅ Done | — |
| Schedule (Cron) | ✅ Done | — |
| Chat Trigger | ✅ Done | — |

### AI

| Node | Status | Doc |
|---|---|---|
| AI Agent | ✅ Done | — |
| Vector Store (pgvector) | ⬜ Not Started | — |

### Logic

| Node | Status | Doc |
|---|---|---|
| Filter / If-Else | ⬜ Not Started | — |
| Code (JavaScript) | ⬜ Not Started | — |

### Data

| Node | Status | Doc |
|---|---|---|
| HTTP Request | 🔶 Tier 1 Complete | [http-request.md](./nodes/http-request.md) |
| Supabase DB (CRUD) | ⬜ Not Started | — |

### Messaging

| Node | Status | Doc |
|---|---|---|
| Discord / Slack | ⬜ Not Started | — |
| Gmail / Resend | ⬜ Not Started | — |

---

## 🧩 viz-* Sidebar Primitives

Shared form inputs used by all node panels.

| Component | Status | Purpose |
|---|---|---|
| `viz-input` | ✅ Done | Text / number / URL / password input |
| `viz-select` | ✅ Done | Static option dropdown |
| `viz-toggle` | ✅ Done | Boolean toggle with label + description |
| `viz-kv-editor` | ✅ Done | Key-value row editor (add/remove) |
| `viz-code-editor` | ⬜ Not Started | Monaco/CodeMirror pane for JS snippets |
| `viz-connection` | ⬜ Not Started | API key picker — reads from `.env.nextviz` |

---

## ⬜ Phase 5 — CLI Distributor
- [ ] `npx nextviz init` — scaffold the editor into an existing Next.js app
- [ ] `npx nextviz add <node-name>` — inject a node component over the network

---

## Architecture

```
flows/{flow-id}.json          ← Source of truth (one file per flow)
lib/nextviz/
  registry.ts                 ← Auto-discovers flows/ at startup
  actions.ts                  ← Server Actions (dev-only fs guard)
  engine.ts                   ← executeFlow(), topological sort, event tracking
  types.ts                    ← NextVizNode, WorkflowJSON, ExecutionEvent
  node-executors/             ← Re-exports from app/nextviz/nodes/*/logic.ts
app/nextviz/
  nodes/                      ← One folder per node (node.tsx + logic.ts)
  _components/                ← Canvas, Console, NodePropertiesPanel
components/nextviz/
  viz-*.tsx                   ← Shared sidebar primitives
```

---

## Docs

- [`docs/nodes/README.md`](./nodes/README.md) — Format template for per-node docs
- [`docs/nodes/http-request.md`](./nodes/http-request.md) — HTTP Request node reference
- [`docs/features/result-replay.md`](./features/result-replay.md) — Execution animation architecture
- [`docs/engine-architecture.md`](./engine-architecture.md) — Engine design patterns
- [`docs/FOLDER_STRUCTURE.md`](./FOLDER_STRUCTURE.md) — Directory layout reference
