# Node Documentation

Every node built for NextViz gets its own `.md` file in this folder.
Copy the template below when starting a new node. Fill in every section — never leave placeholder text.

---

## Available Nodes

| Node | Status | Doc |
|---|---|---|
| HTTP Request | 🔶 Tier 1 Complete | [http-request.md](./http-request.md) |
| Manual Trigger | ✅ Tier 2 Complete | [manual-trigger.md](./manual-trigger.md) |

---

## Template

Copy everything below this line into `docs/nodes/{node-name}.md` and fill it in.

---

# {Node Name} Node

**Category:** {Trigger / Data / Logic / AI / Messaging}
**n8n Reference:** `packages/nodes-base/nodes/{NodeFolder}/{Version}/{ClassName}.node.ts`
**Status:** {Planning / In Progress / Complete}

<!-- Find the exact path by searching n8n-io/n8n for the class name, e.g. "HttpRequestV3" -->

---

## n8n Source Notes

<!-- 
  Read the n8n source file BEFORE writing any code.
  Extract every configurable field from the node descriptor.
  
  Column guide:
    Field   — exact key name as it appears in nodeData (use dot notation for nested: options.timeout)
    Type    — enum / string / boolean / number / KV array / JSON string
    Default — the default value n8n uses, or — if there is none
    Notes   — list enum options if applicable, explain when the field appears (conditional fields),
              note any validation rules (e.g. "must start with https://")
-->

Key fields extracted from `{ClassName}.node.ts`:

| Field | Type | Default | Notes |
|---|---|---|---|
| `fieldName` | enum | `optionA` | `optionA` / `optionB` / `optionC` |
| `url` | string | — | Validated — must start with `http://` or `https://` |
| `toggleField` | boolean | `false` | Toggle to show/hide the related section |
| `nested.parameters` | KV array | `[]` | `{ name, value }` pairs — only shown when `toggleField = true` |
| `specifyMode` | enum | `keypair` | `keypair` or `json` — switches between KV editor and raw JSON input |
| `options.timeout` | number | `300000` | In milliseconds. 300000 = 5 minutes |
| `options.someFlag` | boolean | `false` | What it controls. Note any version differences (e.g. "default true in v4+") |
| `rawField` | string | — | Free-text; only shown when `specifyMode = json` |

<!-- 
  Tips:
  - Cover ALL fields, including ones inside `options.{}` — those are often skipped and cause parity gaps
  - For enum fields, list every valid value in the Notes column
  - For conditional fields, note the condition: "only shown when X = Y"
  - Use — in the Default column when there is no default (required or optional with no fallback)
  - KV array means the field is an array of { key, value } or { name, value } objects
-->

---

## Gap Analysis (NextViz vs n8n)

<!--
  After filling in the Source Notes table, go through every field and decide which tier it belongs to.
  The tier system controls build priority — complete lower-numbered tiers before higher ones.
-->

### 🟥 Tier 1 — Architectural (always do first)

These are the same for every node. Do not skip.

- [ ] **Two-file pattern** — `node.tsx` (UI only) + `logic.ts` (executor only)
- [ ] **BaseNode** — `node.tsx` extends `BaseNode`, no custom node chrome
- [ ] **Execution state** — `BaseNodeData.executionState` drives border/badge via BaseNode
- [ ] **viz-* primitives** — Panel uses only `VizInput`, `VizSelect`, `VizToggle`, `VizKvEditor` — no custom inputs
- [ ] **Re-export** — `lib/nextviz/node-executors/{node-name}.ts` re-exports from `logic.ts`

<!-- Add any node-specific architectural concerns here, e.g. browser vs server API differences -->

### 🟧 Tier 2 — Feature Parity

<!--
  One bullet per field from the Source Notes table that isn't covered by a default behavior.
  Skip fields that are Tier 4 (batching, pagination, proxy, etc.)
  Format: **Field name** — what it does and what NextViz needs to add
-->

- [ ] **`fieldName`** — brief description of what needs to be built

### 🟨 Tier 3 — Engine-Wide Gaps

These are not node-specific — they affect all nodes equally.

- [ ] **Template resolution** — `{{ variable }}` strings in nodeData are never replaced with upstream values
- [ ] **Per-item iteration** — executor runs once, not once per input item like n8n
- [ ] **`continueOnFail`** — flow halts on error; no opt-in error passthrough yet

### 🟦 Tier 4 — Defer

<!--
  Features that require infrastructure that doesn't exist yet, or are low priority.
  Examples: pagination, batching, proxy, OAuth, credential system, file handling
-->

- [ ] Feature name — reason deferred

---

## Build Plan

<!--
  Turn each Tier 1 and Tier 2 gap into a concrete build step.
  Steps are ordered — complete each before starting the next.
  Check off [x] as you go, not at the end.
-->

### Step 1 — {Name} 
- [ ] Sub-task

### Step 2 — {Name}
- [ ] Sub-task

---

## Test Results

<!--
  DO NOT pre-fill this section when creating the node doc.
  Leave each tier block empty until that tier is complete.

  WORKFLOW:
    1. Finish all steps in a tier (all Build Plan checkboxes for that tier are [x])
    2. Ask Claude: "Generate tests for Tier {N} of the {Node Name} node"
    3. Claude will produce a test list based on what was actually built
    4. Paste the list here, then run each test manually
    5. Mark [x] only after you have seen the expected result with your own eyes
    
  Never mark a test passing based on "it should work" — only after actually running it.
-->

### Tier 1

<!-- Populate after all Tier 1 Build Plan steps are complete. Ask Claude for the test list. -->

### Tier 2

<!-- Populate after all Tier 2 Build Plan steps are complete. Ask Claude for the test list. -->

### Tier 3

<!-- Populate if any Tier 3 items are implemented. Ask Claude for the test list. -->

---

## What Was Adapted from n8n

<!--
  Explain how the n8n logic was ported. Focus on decisions made, not line-by-line description.
  - Did you rename fields? Why?
  - Did you simplify an enum? What was dropped?
  - Was there a Vue/n8n-specific API that needed a React equivalent?
-->

- n8n uses Vue 3 + n8n-workflow SDK. All UI ported to React + Tailwind.
- n8n uses `IExecuteFunctions` context. NextViz uses plain `nodeData: Record<string, unknown>`.

## What Was Skipped (and Why)

<!--
  Every n8n feature that was intentionally left out must be listed here.
  "I didn't know about it" is not a valid reason — the Source Notes table prevents that.
-->

| n8n feature | Reason skipped |
|---|---|
| Feature name | Requires credential system / low priority / deferred to v2 |

---

## Format Rules

1. **Create the doc before writing any code** — Source Notes and Gap Analysis must be filled in first.
2. **n8n Source Notes = every field** — include all `options.*` fields too; those are commonly missed.
3. **One bullet per gap in Tier 2** — directly maps to a row in the Source Notes table.
4. **Build Plan steps are ordered** — Tier 1 always comes first; never start Tier 2 while Tier 1 is incomplete.
5. **Test Results are generated after a tier is done** — never pre-fill them. When a tier's Build Plan is fully checked off, ask Claude: "Generate tests for Tier N of the {Node} node." Paste the output into the doc, then run each test.
6. **Only mark [x] after running the test** — not based on assumption.
7. **Check off Build Plan [x] as you go** — not at the end of the session.
8. **Never leave "Feature name" placeholders** — fill in or delete every template hint.

---

## n8n Source Reference

To find a node's source file:

```
packages/nodes-base/nodes/{NodeFolder}/{Version}/{ClassName}V{N}.node.ts
```

Examples:
```
packages/nodes-base/nodes/HttpRequest/V3/HttpRequestV3.node.ts
packages/nodes-base/nodes/Schedule/ScheduleTrigger.node.ts
packages/nodes-base/nodes/Code/Code.node.ts
```

**What to extract from the file:**
- The `properties` array — every `INodeProperties` object is a field for the Source Notes table
- `displayOptions.show` on a property — that's a conditional field; note the condition in Notes column
- The `execute()` method — understand the runtime logic before adapting it to `NodeExecutorFn`
- Default values in `default:` keys
- Enum options in `options: [{ value, name }]` arrays
