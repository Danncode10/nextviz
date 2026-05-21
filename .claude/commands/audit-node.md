# /audit-node

Audit an existing node for compliance with NextViz conventions.

**Usage:** `/audit-node <node-name>`
**Example:** `/audit-node http-request`

---

## Protocol

### Step 1 — File structure check
Verify all three files exist:
- `app/nextviz/nodes/$ARGUMENTS/node.tsx`
- `app/nextviz/nodes/$ARGUMENTS/panel.tsx`
- `app/nextviz/nodes/$ARGUMENTS/logic.ts`

### Step 2 — Registration check
- Is the executor in `lib/nextviz/node-executors/index.ts`?
- Is the component in `app/nextviz/nodes/index.ts`?

### Step 3 — Code checks
**node.tsx:**
- [ ] Uses `BaseNode` or semantic tokens (`bg-card`, `border-border`)
- [ ] No `process.env` usage
- [ ] No direct server calls
- [ ] No `any` types

**panel.tsx:**
- [ ] Uses only `viz-*` primitives (no custom inputs)
- [ ] No free-text input for API keys (must use `VizConnection`)
- [ ] Calls `saveFlow` on field change

**logic.ts:**
- [ ] Matches `NodeExecutorFn` signature
- [ ] Resolves secrets via `process.env[nodeData.apiKeyRef as string]`
- [ ] No React imports, no browser APIs
- [ ] No `any` types

### Step 4 — Doc check
Does `docs/nodes/$ARGUMENTS.md` exist and have all sections filled?

### Step 5 — Report
Output a pass/fail table for each check. Flag any violations with the exact file and line.
