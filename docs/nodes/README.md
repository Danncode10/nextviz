# Node Documentation

Every node built for NextViz gets its own `.md` file in this folder. Use this README as the format guide — copy the template below when starting a new node.

---

## Available Nodes

| Node | Status | Doc |
|---|---|---|
| HTTP Request | ✅ Complete (Tier 1) | [http-request.md](./http-request.md) |

---

## File Format Template

```
# {Node Name} Node

**Category:** {Trigger / Data / Logic / AI / Messaging}
**n8n Reference:** `packages/nodes-base/nodes/{Name}/...`
**Status:** {Planning / In Progress / Complete}

---

## n8n Source Notes

Key fields extracted from the n8n source file:

| Field | Type | Default | Notes |
|---|---|---|---|
| `fieldName` | type | `default` | Description |

---

## Masterplan

### Tier 1 — Architectural (do first)
* Two-file pattern: node.tsx + logic.ts
* Uses BaseNode component
* Execution state visual feedback (running / success / error)
* viz-* primitives in panel (VizInput, VizSelect, VizToggle, VizKvEditor)

### Tier 2 — Feature Parity
* Core fields that match n8n behavior
* Each item maps to a field from the n8n Source Notes table

### Tier 3 — Engine-Wide Gaps
* Template resolution {{ variable }}
* Per-item iteration
* continueOnFail

### Tier 4 — Defer
* Complex features for v2+

---

## Build Plan

Steps are ordered — complete each before moving to the next.

### Step 1 — {Step Name}
- [ ] Task
- [ ] Task

### Step 2 — {Step Name}
- [ ] Task

---

## Test Results

### Tier 1

* **Test 1: Canvas renders correctly**
  * [ ] Node shows icon + label on canvas
  * [ ] No TypeScript errors

* **Test 2: Execution state feedback**
  * [ ] Running state: border pulses + spinner badge
  * [ ] Success state: green border + ✅ badge
  * [ ] Error state: red border + ❌ badge

* **Test 3: Panel opens**
  * [ ] Click node → panel opens with correct fields
  * [ ] Fields use viz-* components

### Tier 2

* **Test 4: {Feature name}**
  * [ ] Expected behavior

---

## What Was Adapted from n8n

- How the data shape was ported from Vue to React
- Any naming changes or simplifications

## What Was Skipped (and Why)

| n8n feature | Reason skipped |
|---|---|
| Feature name | Brief reason |
```

---

## Format Rules

1. **One file per node** — named `{node-name}.md` matching the folder in `app/nextviz/nodes/`
2. **n8n Source Notes first** — always read the n8n source before building, log the field names and types
3. **Masterplan uses Tiers** — Tier 1 is always architectural (BaseNode, two-file, viz-*, execution state). Never skip Tier 1.
4. **Build Plan is a checklist** — mark `[x]` as steps complete, not after
5. **Test Results track real tests** — mark passing tests only after actually running them
6. **Skipped features are documented** — never silently drop an n8n feature without noting it

---

## n8n Source Reference

Before building any node, read the n8n source:

```
packages/nodes-base/nodes/{NodeName}/V{version}/{NodeName}V{version}.node.ts
```

Key things to extract:
- All input field names and their types
- Default values
- Option sets (enum values)
- Which fields are conditionally shown
- How the executor processes inputs
