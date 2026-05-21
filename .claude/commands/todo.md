# /todo

Show the current NextViz project progress and give clear, actionable next tasks — by reading the masterplan AND deeply inspecting the actual codebase to detect incomplete, stub, or broken work.

**Usage:** `/todo`
**Optional:** `/todo nodes` — show only node progress
**Optional:** `/todo phase4` — show only Phase 4 detail

---

## Protocol

### Step 1 — Read everything
Read all of these in parallel:
- `docs/masterplan.md` — planned status
- `app/nextviz/nodes/` — list all node folders and their files
- `lib/nextviz/node-executors/index.ts` — which executors are registered
- `app/nextviz/nodes/index.ts` — which components are registered
- `components/nextviz/` — which viz-* primitives exist
- `docs/nodes/` — which node docs exist

### Step 2 — Deep-inspect every node that exists
For each node folder found, READ the actual file contents — not just whether they exist. Determine:

**Is node.tsx complete or a stub?**
- Stub signs: placeholder text, `TODO`, empty render, no Handle components, no category header
- Complete signs: real canvas component, correct handles, BaseNode or semantic tokens used

**Is panel.tsx complete or a stub?**
- Stub signs: "Configure [Node]" placeholder, no viz-* primitives, empty return
- Complete signs: real viz-* form fields, saveFlow wired up, at least one configurable field

**Is logic.ts complete or a stub?**
- Stub signs: `return {}`, empty function body, `// TODO`, no real implementation
- Complete signs: actual logic, inputs/nodeData used, returns meaningful output

A node is only ✅ if ALL THREE files are complete + registered. If any file is a stub, mark it 🔶 Incomplete.

### Step 3 — Detect n8n feature gaps
Based on the node categories in `docs/masterplan.md`, identify which n8n node types are:
- Already built in NextViz (even partially)
- Planned but not started
- Not even on the roadmap yet but commonly used in n8n (e.g. Set, Merge, Wait, EmailReadImap, Google Sheets, Notion, Airtable, PostgreSQL, MySQL, Redis, S3)

Use your knowledge of n8n's node library for this — no GitHub lookup needed for the todo report.

### Step 4 — Output the report

---

## 📊 NextViz Progress Report

### Overall Phases
Show each phase with its real completion status based on actual code, not just masterplan claims.

---

### Phase 4 — Nodes [X/Y]

Group by category. For each node show:
```
[status] [Node Name] — [files check] [registered check] [doc check] [note if incomplete]
```

Status rules:
- ✅ = all 3 files complete + registered
- 🔶 = files exist but one or more is a stub, or not registered
- ⚠️ = masterplan says done but reality says otherwise
- ⬜ = not started

---

### viz-* Sidebar Primitives [X/6]
Check actual file existence AND whether the component has real implementation.

---

### ⚠️ Mismatches
List anything where masterplan and reality disagree.

---

### 🎯 Do This Now

This is the most important section. Output a prioritized action list — not a summary, but specific tasks a developer can start immediately.

**Format each task as:**
```
[Priority #] [Verb] [Specific Thing]
→ Why: [one sentence on why this is blocking or important]
→ Command: [exact Claude command or prompt to run]
```

**Priority logic (apply in order):**
1. **Fix broken registered nodes first** — if a node is registered but has a stub logic.ts, it will silently fail at runtime. Most dangerous.
2. **Complete in-progress nodes** — finish what's started before starting new things. A 🔶 node is closer to done than ⬜.
3. **Unblock other work** — viz-connection blocks every secret-based node. viz-code-editor blocks Code node.
4. **Structural cleanup** — Issue #3 violations (single-file nodes, missing panel.tsx)
5. **New nodes by impact** — Logic nodes (Filter/If-Else) unlock conditional flows for all users. Data nodes (Supabase) unlock persistence. Messaging nodes (Discord/Slack) are high-visibility.

**Example output:**
```
1. Finish panel.tsx for Manual Trigger
   → Why: file is a stub with no real fields — node appears done but isn't configurable
   → Command: /build-node Manual Trigger (panel only)

2. Register schedule-trigger executor
   → Why: logic.ts exists but isn't in node-executors/index.ts — Schedule nodes silently do nothing
   → Command: Add schedule-trigger to lib/nextviz/node-executors/index.ts

3. Build viz-connection primitive
   → Why: blocks every node that needs an API key (Supabase, Discord, Gmail, OpenAI)
   → Command: /build-node viz-connection
```

---

### 💡 n8n Nodes Not on the Roadmap Yet
List 5 high-value n8n nodes that NextViz doesn't have planned yet, with a one-line reason each is worth adding:
```
• [Node Name] — [why it's valuable for Next.js developers]
```
Suggest nodes that fit the NextViz "developer-native" philosophy — not every n8n node belongs here.
