# /build-node

Build a new NextViz node end-to-end following the full NextViz protocol.

**Usage:** `/build-node <Node Name>`
**Example:** `/build-node Supabase DB`

---

## Protocol (execute in order, do not skip steps)

### Step 0 — Research
1. Use `github-mcp-server` → search `n8n-io/n8n` for the equivalent node class (e.g. `HttpRequestV3`, `ScheduleTrigger`, `Postgres`)
2. Read the node descriptor (`*.node.ts`) — extract: field names, types, defaults, option sets
3. Read the executor logic — understand how n8n processes the node at runtime
4. Note what n8n has that NextViz can't support yet (call it out before coding)

### Step 1 — Documentation first
1. Read `docs/nodes/README.md` for the doc format
2. Create (or update) `docs/nodes/$ARGUMENTS.md` with:
   - n8n Source Notes table (fields + types)
   - Gap Analysis (what NextViz has vs n8n, tiered by priority)
   - Build Plan checklist (`[ ]` steps)
   - What Was Adapted / What Was Skipped sections

### Step 2 — Scaffold files
Create the three-file folder:
```
app/nextviz/nodes/{node-name}/
├── node.tsx     ← canvas UI
├── panel.tsx    ← properties sidebar
└── logic.ts     ← NodeExecutorFn executor
```

### Step 3 — Build `node.tsx`
- Import `BaseNode` from `app/nextviz/nodes/_base/base-node.tsx`
- Use `bg-card`, `border-border`, `text-card-foreground` tokens
- Category-colored header icon via `lucide-react`
- Handles: `Handle` + `Position` from `reactflow`
- No `process.env`, no server calls, no `any`

### Step 4 — Build `panel.tsx`
- Use **only** `viz-*` primitives (`VizInput`, `VizSelect`, `VizToggle`, `VizKvEditor`)
- For API key fields: use `VizConnection` (never a free-text input for secrets)
- Every field: implement the Raw Toggle (`</>` icon → switches fixed ↔ expression mode, store `isExpression: boolean` in `node.data`)
- Auto-save on every field change via existing `saveFlow` Server Action

### Step 5 — Build `logic.ts`
- Export a function matching `NodeExecutorFn` signature:
  ```ts
  export const execute: NodeExecutorFn = async (nodeData, inputs, context) => { ... }
  ```
- Resolve secrets: `process.env[nodeData.apiKeyRef as string]`
- Resolve templates: already handled by engine before executor is called
- No React, no browser APIs, no `any`

### Step 6 — Register
- Add executor to `lib/nextviz/node-executors/index.ts`
- Add node component to `app/nextviz/nodes/index.ts`

### Step 7 — Install deps
If new npm packages are needed, add them and install.

### Step 8 — Update docs
Check off each completed step in `docs/nodes/{node-name}.md`.

### Step 9 — Summarize, do not commit
List files created/changed and ask before committing.
