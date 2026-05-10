# NextViz Folder Structure (Phase 3.5+)

This document describes the **target folder structure** for NextViz after Phase 3.5 restructuring.

## Directory Layout

```
project-root/
│
├── app/
│   ├── nextviz/                      ← Editor UI (Read-Only on Vercel)
│   │   ├── page.tsx                  ← Canvas editor, sidebar, flow switcher
│   │   ├── layout.tsx                ← Layout shell
│   │   └── nodes/                    ← User-created custom node components
│   │       ├── ManualTrigger.tsx      (example)
│   │       ├── HttpAction.tsx         (example)
│   │       └── (users add more here)
│   │
│   ├── api/
│   │   └── nextviz/
│   │       └── (runtime endpoints for triggers: webhooks, timers, etc)
│   │
│   ├── page.tsx                      ← Home page (optional landing)
│   ├── layout.tsx                    ← Root layout
│   └── globals.css
│
├── lib/
│   └── nextviz/                      ← FRAMEWORK CODE (Read-Only to Users)
│       ├── engine.ts                 ← Execution engine + topological sort + caching
│       ├── registry.ts               ← FlowRegistry (auto-discovery) + node registry
│       ├── actions.ts                ← Server Actions (load/save flows)
│       ├── types.ts                  ← TypeScript interfaces (NextVizNode, WorkflowJSON, etc)
│       │
│       └── services/                 ← Third-party integrations
│           ├── supabase.ts           (example)
│           ├── openai.ts             (example)
│           └── slack.ts              (example: future)
│
├── flows/                            ← 🎯 SOURCE OF TRUTH (Individual Flow Files)
│   ├── default.json                  ← {id, name, description, nodes[], edges[]}
│   ├── chatbot-flow.json             (example)
│   └── data-processor.json           (example)
│
├── .nextviz/                         ← Optional: Metadata & Configuration
│   └── metadata.json                 (optional: per-flow tags, created date, etc)
│
├── components/                       ← Generic UI components (sidebar, inputs, etc)
│   ├── ui/                           (shadcn/ui base components)
│   ├── app-sidebar.tsx               (NextViz editor sidebar)
│   ├── right-sidebar.tsx             (Component palette)
│   └── theme-provider.tsx
│
├── hooks/                            ← Custom React hooks
│
├── .env                              ← Standard Next.js env (public vars only)
├── .env.nextviz                      ← SECRETS ONLY (git-ignored)
├── .env.nextviz.example              ← Template for .env.nextviz (committed)
│
├── .gitignore                        ← Include: .env.nextviz
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## Key Design Principles

### 1. **Separation of Concerns**
- **`app/nextviz/` & `lib/nextviz/`** = Framework (shipped, read-only to users).
- **`flows/`** = User space (where they create and edit automations).
- **`components/`** = Generic UI (shared across the app).

### 2. **Scale & Git-Friendly**
- Each flow is its own file → no merge conflicts.
- Teams can work on different flows simultaneously.
- Git history per-flow is clean and readable.

### 3. **Clear Template for `npx nextviz init`**
When someone scaffolds a new project, the structure is immediately clear:
- ✅ "Put my flows here:" `flows/`
- ✅ "Add custom nodes here:" `app/nextviz/nodes/`
- ✅ "Don't modify this:" `lib/nextviz/` (framework code)

### 4. **Framework Code Isolation**
All engine logic is in `lib/nextviz/`, making it:
- Easy to upgrade (users don't touch it).
- Testable in isolation.
- Reusable in headless mode (Vercel webhooks, API routes).

---

## File Responsibilities

### `lib/nextviz/engine.ts`
- Loads a flow from `flows/{flowId}.json`.
- Parses the node/edge graph.
- Calculates topological sort (execution order).
- **Caches** the execution plan in memory.
- Executes nodes sequentially or in parallel.
- Returns the final result.

### `lib/nextviz/registry.ts`
- **FlowRegistry**: Scans `flows/` at startup, caches metadata.
  - `loadFlow(flowId)` → reads JSON from disk.
  - `listFlows()` → returns available flows.
  - `createFlow(flowId, schema)` → creates new flow file.
- **NodeRegistry**: Maps node types to component imports.
  - `getNode(nodeType)` → returns component.
  - `listNodeTypes()` → available nodes.

### `lib/nextviz/actions.ts` (Server Actions)
- `saveFlow(flowId, nodes, edges)` → writes to `flows/{flowId}.json`.
- `loadFlow(flowId)` → reads from `flows/{flowId}.json`.
- `createFlow(name, description)` → creates new file.
- `deleteFlow(flowId)` → removes file.
- **All guarded by:** `if (NODE_ENV !== 'development') throw new Error(...)`

### `app/nextviz/page.tsx` (Canvas Editor)
- Loads the `activeFlowId` from state/query param.
- Calls `loadFlow(activeFlowId)` via Server Action.
- Renders React Flow canvas.
- On change, calls `saveFlow(activeFlowId, nodes, edges)`.
- Displays Read-Only banner on Vercel.

### `flows/{flowId}.json` (Source of Truth)
```json
{
  "id": "default",
  "name": "Default Flow",
  "description": "Your first automation",
  "nodes": [
    {
      "id": "1",
      "type": "manualTrigger",
      "position": { "x": 0, "y": 0 },
      "data": { "label": "Trigger" }
    }
  ],
  "edges": []
}
```

---

## Phase 3.5 Migration Checklist

When restructuring from monolithic to individual flows:

- [ ] Create `flows/` directory.
- [ ] Extract each flow from `nextviz-flow.json` into `flows/{flowId}.json`.
- [ ] Build `FlowRegistry` utility in `lib/nextviz/registry.ts`.
- [ ] Update `lib/nextviz/actions.ts` to read/write individual files.
- [ ] Update `app/nextviz/page.tsx` to use `FlowRegistry.loadFlow()`.
- [ ] Add `.nextviz/metadata.json` (optional, for per-flow settings).
- [ ] Delete the old monolithic `nextviz-flow.json`.
- [ ] Update `.gitignore` to include `flows/` pattern (if desired).
- [ ] Test flow switching, saving, and multi-user editing.

---

## Best Practices for Users

### Adding a Custom Node
```typescript
// 1. Create component in app/nextviz/nodes/MyNode.tsx
export function MyNode(props) {
  return <div>My custom node</div>;
}

// 2. Register in lib/nextviz/registry.ts
export const nodeRegistry = {
  myNode: () => import('@/app/nextviz/nodes/MyNode'),
  // ... other nodes
};

// 3. Use in the canvas (via the Node Palette sidebar)
```

### Creating a New Flow
```typescript
// Option A: Via UI (Create Flow button)
// → Creates flows/my-flow.json automatically

// Option B: Manual (for CI/CD or templates)
// → Save flows/my-flow.json with proper schema
```

### Deploying Individual Flows
Because each flow is its own file, you can:
- Deploy flow updates independently.
- A/B test flows by changing `activeFlowId`.
- Version control flows in separate branches.

---

## Future Extensibility

### Flow Versioning
```
flows/
├── default@1.0.json
├── default@2.0.json
└── default@latest.json (symlink or alias)
```

### Per-Flow Configuration
```
.nextviz/
├── metadata.json
└── flows/
    ├── default.config.json    ← Retry policies, timeout rules, etc
    └── chatbot.config.json
```

### Multi-Environment Flows
```
flows/
├── prod/
│   └── chatbot.json
└── staging/
    └── chatbot.json
```

All of these become straightforward with individual flow files.
