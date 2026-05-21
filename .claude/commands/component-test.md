# /component-test — Automated Phase 4 Node Build & Test

**Purpose:** Execute the current priority tier, auto-generate test files with verification checkboxes, and track completion.

---

## Protocol

### Step 1 — Detect Current Tier
Read the task list or project memory to determine which tier is active:
- **TIER 1:** Manual Trigger panel, on-http/log-data migrations, chat-model-node/memory-node completion
- **TIER 2:** viz-connection, viz-code-editor primitives
- **TIER 3:** HTTP Request verification, node docs

Output: `Building [Node Name] — [Tier N] — [What's being done]`

### Step 2 — Execute the Work
- If node build: Run `/build-node [name]` to scaffold or complete the three-file pattern
- If primitive: Build the component from scratch
- If verification: Run `/verify [name]` to test the implementation
- If docs: Generate missing node documentation

Commit after completion with `git add flows/ && git commit -m "nextviz: [node-name] — [tier-stage] completion"`

### Step 3 — Generate Test Plan File
Create a timestamped test file in `.claude/tests/component-[node-name]-[date].md`:

```markdown
# Component Test Plan — [Node Name]

**Built:** [timestamp]
**Tier:** [N]
**Task:** [what was built]

---

## Automated Verification Tests

- [x] **File structure check** — Verify node.tsx, panel.tsx, logic.ts exist
- [x] **Type safety** — No `any` types; NodeExecutorFn signature matches
- [x] **Registration** — Node registered in lib/nextviz/node-executors/index.ts
- [x] **Build compiles** — `npm run build` succeeds

## Manual Verification Tests

- [ ] **Canvas rendering** — Node appears on canvas with correct icon & label
  → Run: `npm run dev`, open nextviz, drag node onto canvas
  → Verify: Icon color matches category, label reads correctly

- [ ] **Node execution** — Click "Execute step", see output in console tab
  → Run: Create simple flow → trigger → check Output tab for result
  → Verify: Execution completes without errors

- [ ] **Panel fields** — Click node, properties sidebar opens with correct inputs
  → Run: Click node on canvas
  → Verify: All form fields render, labels match n8n docs

- [ ] **Auto-save to flow JSON** — Change a field, check flows/{flowId}.json
  → Run: Edit a panel field, then `cat flows/{flowId}.json | grep [fieldName]`
  → Verify: Change persisted to JSON file

---

## Summary

**Automated:** 4/4 ✅
**Manual:** 0/4 [ ]

Status: Ready for human verification
```

### Step 4 — Report Results

If all automated tests pass:
```
✅ [Node Name] — [Tier N] COMPLETE
   • File structure: ✅
   • Compilation: ✅
   • Registration: ✅
   • Manual tests: [ ] Awaiting human verification

   Test plan: .claude/tests/component-[name]-[date].md
   Next: Run the manual verification tests above, then mark [ ] → [x]
```

If tests fail:
```
❌ [Node Name] — [Tier N] INCOMPLETE
   Error: [what failed]
   Fix: [Claude diagnosis]
```

---

## How to Mark Tests Complete

**By Claude (automated tests):**
- After running verification checks, mark `[x]` if test passes
- Include timestamp and what was verified

**By Human (manual tests):**
- After running the test guide, mark `[x]` if it works
- If it fails, describe the error — Claude will diagnose next run

**Command to mark complete after all tests pass:**
```
/checkpoint [node-name]
```
This commits the node, test file, and updates the progress memory.

---

## Usage

```
/component-test                    # Auto-detect current tier, build it
/component-test --tier=1           # Force tier 1
/component-test --node=manual-trigger   # Build specific node
/component-test --verify=http-request   # Run verification only
```

---

## Examples

**Example 1: Complete Manual Trigger panel**
```
> /component-test
Building Manual Trigger — TIER 1 — panel.tsx (test data input field)
✅ Scaffolded panel.tsx with viz-input for testPayload
✅ Compiled without errors
✅ Registered in node-executors/index.ts
✅ Test plan generated: .claude/tests/component-manual-trigger-20260521.md

Next: Run manual verification tests from the test plan file
```

**Example 2: Complete viz-connection primitive**
```
> /component-test --tier=2
Building viz-connection — TIER 2 — credential modal + listCredentials wiring
✅ Modal implementation complete
✅ Compiled without errors
✅ Test plan generated: .claude/tests/component-viz-connection-20260521.md

Next: Test the credential picker in a node panel (manual test)
```

**Example 3: Verify HTTP Request**
```
> /component-test --verify=http-request
Verifying HTTP Request — All file checks pass
✅ All 3 files present
✅ Registered in executors
✅ Test plan generated: .claude/tests/component-http-request-verify-20260521.md

Next: Run the manual auth testing (Bearer, Basic, API Key) — see test plan
```

---

## Test File Location

All generated test plans go to: `.claude/tests/component-[name]-[date].md`

To view all outstanding manual tests:
```bash
grep -r "- \[ \]" .claude/tests/ | head -20
```
