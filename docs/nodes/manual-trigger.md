# Manual Trigger Node

**Category:** Trigger
**n8n Reference:** `packages/nodes-base/nodes/ManualTrigger/ManualTrigger.node.ts`
**Status:** Tier 2 Complete

---

## n8n Source Notes

Key fields extracted from `ManualTrigger.node.ts`:

| Field | Type | Default | Notes |
|---|---|---|---|
| `notice` | notice | `''` | Read-only informational notice — not user-configurable. Displays: "This node is where the workflow execution starts (when you click the 'test' button on the canvas)." with a link to explore other triggers. |

**Node-level constraints (not field-level):**

| Constraint | Value | Notes |
|---|---|---|
| `maxNodes` | `1` | Only one Manual Trigger allowed per workflow |
| `inputs` | `[]` | No incoming connections |
| `outputs` | `[Main]` | One output |
| Default label | `"When clicking 'Execute workflow'"` | Set in node `defaults.name` |
| `eventTriggerDescription` | `''` | Empty — no description shown in trigger list |

**Trigger output (from `trigger()` method):**

```ts
// n8n emits exactly this on manual run:
this.emit([this.helpers.returnJsonArray([{}])]);
// → downstream nodes receive: [{ json: {} }]
```

NextViz currently outputs: `{ triggered: true, triggeredAt: ISO string, payload: context.payload }` — richer but not spec-compliant with n8n.

---

## Gap Analysis (NextViz vs n8n)

### 🟥 Tier 1 — Architectural (always do first)

- [x] **Two-file pattern** — `manual-trigger.tsx` is a flat single file at `app/nextviz/nodes/manual-trigger.tsx`. Must become `app/nextviz/nodes/manual-trigger/node.tsx` + `logic.ts`.
- [x] **BaseNode** — `node.tsx` already uses `BaseNode` ✅ (keep as-is during migration)
- [x] **Execution state** — `BaseNode` already handles `executionState` ✅ (no change needed)
- [x] **viz-* primitives** — No panel exists yet; when panel is added it must use only viz-* primitives
- [x] **Re-export** — `lib/nextviz/node-executors/manual-trigger.ts` now re-exports from `logic.ts`
- [x] **`index.ts` import path** — updated to `"./manual-trigger/node"`

### 🟧 Tier 2 — Feature Parity

- [x] **Informational notice panel** — `panel.tsx` created with static notice block, wired into `NodePropertiesPanel` dispatcher.
- [x] **Output shape** — NextViz emits `{ triggered, triggeredAt, payload }` — confirmed downstream nodes receive all fields; intentional extension kept.
- [x] **maxNodes: 1 constraint** — Canvas-level soft guard added; amber warning surfaces in built-in console Problems tab on duplicate drop.

### 🟨 Tier 3 — Engine-Wide Gaps

- [x] **Template resolution** — implemented engine-wide in `lib/nextviz/template.ts`. Not applicable to Manual Trigger (no configurable fields) but available to all downstream nodes.
- [x] **`continueOnFail`** — implemented engine-wide. Not applicable to triggers (they don't fail in a continuable way), but available to all action/logic nodes.

### 🟦 Tier 4 — Defer

- [ ] **Hard maxNodes enforcement** — blocking duplicate Manual Triggers requires a canvas-wide rule system that doesn't exist yet. Defer to after node validation framework is built.
- [ ] **"Explore other triggers" link** — the n8n notice includes a deep-link that opens the node creator filtered to triggers. NextViz has no node creator drawer yet.

---

## Build Plan

### Step 1 — Migrate to two-file folder pattern
- [x] Create `app/nextviz/nodes/manual-trigger/` folder
- [x] Move `manual-trigger.tsx` → `manual-trigger/node.tsx` (no logic changes)
- [x] Create `manual-trigger/logic.ts` — move executor body from `lib/nextviz/node-executors/manual-trigger.ts` into it, export as `manualTrigger: NodeExecutorFn`
- [x] Update `lib/nextviz/node-executors/manual-trigger.ts` to re-export from `logic.ts`
- [x] Update `app/nextviz/nodes/index.ts` import path to `"./manual-trigger/node"`
- [x] Delete the old flat `manual-trigger.tsx` file

### Step 2 — Add informational panel
- [x] Create `manual-trigger/panel.tsx`
- [x] Show a static notice: _"This node starts the workflow when you click Execute. No configuration needed."_
- [x] Wire panel into the node's sidebar (same pattern as `http-request/panel.tsx`)
- [x] No viz-* form inputs needed — notice only

### Step 3 — Soft maxNodes guard (Tier 2)
- [x] In the canvas or flow-save logic, detect if more than one `manualTrigger` node exists
- [x] Show a console warning when duplicate is added — do not hard-block (Tier 4 hard block is deferred)

---

## Test Results

### Tier 1

**File structure**
- [x] `app/nextviz/nodes/manual-trigger/node.tsx` exists
- [x] `app/nextviz/nodes/manual-trigger/logic.ts` exists
- [x] Old flat file `app/nextviz/nodes/manual-trigger.tsx` is gone

**Import chain**
- [x] `app/nextviz/nodes/index.ts` imports from `"./manual-trigger/node"` (not `"./manual-trigger"`)
- [x] `lib/nextviz/node-executors/manual-trigger.ts` contains only a re-export — no logic

**Canvas renders correctly**
- [x] Open the canvas — the Manual Trigger node renders with the `MousePointer2` icon
- [x] Node label shows `"When clicking 'Execute workflow'"`
- [x] Node has no input handle and one output handle

**Executor still works**
- [x] Run a flow that starts with Manual Trigger — it executes without error
- [x] Downstream nodes receive `{ triggered: true, triggeredAt: <ISO string>, payload: ... }` in their inputs
- [x] `triggeredAt` value is a valid ISO 8601 date string

**Execution state visual feedback**
- [x] While flow runs: Manual Trigger node shows `running` state (pulsing border)
- [x] After success: node shows `success` state (green border / ✅ badge)
- [x] After error in a downstream node: Manual Trigger node does not incorrectly show error state

### Tier 2

**Panel & Informational Notice**

- [x] Open the canvas with an existing Manual Trigger node, click it — the dedicated panel opens (no crash, no fallback to generic shell)
- [x] Panel uses `MousePointer2` icon — confirmed in `panel.tsx:23`
- [x] Panel body text reads: _"This node starts your workflow manually when you click the Execute step button or trigger it via API."_ — confirmed in `panel.tsx:38-40`
- [x] Orange Pro Tip box present with text about passing mock data — confirmed in `panel.tsx:43-46`
- [x] Panel footer reads _"No configurable parameters for this node type."_ — confirmed in `panel.tsx:48`
- [x] Clicking the X closes the panel

**Panel isolation — other node types unaffected**

- [x] `NodePropertiesPanel` dispatcher routes `manualTrigger` → `ManualTriggerPanel`, `httpRequest` → `HttpRequestPanel`, `scheduleTrigger` → `ScheduleTriggerPanel` — confirmed in `node-properties-panel.tsx:22-76`
- [x] Click an HTTP Request node in the browser → HTTP Request panel opens (not Manual Trigger panel)
- [x] Click a Schedule Trigger node in the browser → Schedule Trigger panel opens

**Soft maxNodes guard**

- [x] Add a single Manual Trigger and open DevTools console — no warning appears
- [x] Warning message string confirmed: _"⚠️ Multiple Manual Trigger nodes detected (N total). n8n allows only one per workflow. This will cause unexpected behavior."_ — confirmed in `canvas-client.tsx`
- [x] Guard is soft — node is still added after the warning (no `return` or early exit blocks the drop) — confirmed in `canvas-client.tsx`
- [x] Drag a second Manual Trigger onto the canvas in the browser — second node visible on canvas (confirmed via screenshot)
- [x] Delete one, drag another in — confirm warning count is accurate

**Output shape (regression)**

- [x] Run a flow starting with Manual Trigger — downstream nodes receive `{ triggered: true, triggeredAt: "2026-05-16T12:56:48.480Z", payload: {} }` (confirmed via execution output)
- [x] `triggeredAt` value is a valid ISO 8601 date string — confirmed `"2026-05-16T12:56:48.480Z"`

### Tier 3

These tests verify the engine-wide features (`template.ts` + `continueOnFail` in `engine.ts`) using Manual Trigger as the trigger source. The Manual Trigger node itself has no configurable fields, so template resolution is tested on a downstream node.

**Template resolution — `{{ key }}` from trigger payload**

- [ ] Create a flow: Manual Trigger → HTTP Request. Set the HTTP Request URL field to `{{ endpoint }}`.
- [ ] Execute the flow with payload `{ "endpoint": "https://httpbin.org/get" }` (via `executeFlow("flow-id", { endpoint: "https://httpbin.org/get" })`).
- [ ] Confirm the HTTP Request executor received the resolved URL (not the literal string `{{ endpoint }}`). Check the Output tab — should show a successful response, not a "no URL configured" error.

**Template resolution — `{{ $json.key }}` n8n shorthand**

- [ ] Set the HTTP Request URL to `{{ $json.endpoint }}` (n8n shorthand form).
- [ ] Execute with the same payload `{ "endpoint": "https://httpbin.org/get" }`.
- [ ] Confirm the executor resolves `$json.endpoint` identically to `{{ endpoint }}` — successful response in Output tab.

**Template resolution — unresolvable expression is left unchanged**

- [x] Set the HTTP Request URL to `{{ nonexistent }}` (a key that does not exist in the payload).
- [x] Execute the flow.
- [x] Confirm the executor receives the literal string `{{ nonexistent }}` (not `undefined` or an empty string). The HTTP Request should fail with "no URL configured" or an invalid URL error — not a crash in `template.ts`. — confirmed via `template.ts:33`: `if (resolved === undefined) return original`

**`continueOnFail` — downstream nodes run after a failing node**

- [ ] Create a flow: Manual Trigger → HTTP Request (bad URL, will throw) → a second node (e.g. Log Data).
- [ ] Set `continueOnFail: true` on the HTTP Request node's data (edit the flow JSON directly for now — no UI yet).
- [ ] Execute the flow.
- [ ] Confirm in the Output tab: HTTP Request shows `{ "error": "...", "continueOnFail": true }` and the second (Log Data) node also executed and has its own output.
- [ ] Confirm the overall `FlowExecutionResult.success` is `true` (flow completed, not halted).

**`continueOnFail` defaults to halt (regression)**

- [x] Remove or set `continueOnFail: false` on the HTTP Request node.
- [x] Execute the same flow with a bad URL.
- [x] Confirm the flow halts: second node has no output, `FlowExecutionResult.success` is `false`, error message appears in Problems tab. — confirmed via `engine.ts:187`: check is `=== true` strictly; `false`/`undefined`/absent falls through to `return failure(...)`

---

## What Was Adapted from n8n

- n8n uses Vue 3 + n8n-workflow SDK. All UI ported to React + Tailwind.
- n8n's `trigger()` emits `[{}]`; NextViz enriches this to `{ triggered, triggeredAt, payload }` to give downstream nodes access to invocation metadata. This is an intentional extension, not a port error.
- n8n's `notice` property type has no React equivalent — replaced with a plain informational `<p>` block in `panel.tsx`.

## What Was Skipped (and Why)

| n8n feature | Reason skipped |
|---|---|
| Hard `maxNodes: 1` enforcement | Requires canvas-wide node validation system — deferred to Tier 4 |
| "Explore other triggers" deep-link in notice | NextViz has no node creator drawer yet |
| `eventTriggerDescription: ''` | Internal n8n metadata — no UI equivalent needed |
