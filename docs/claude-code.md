# Using Claude Code with NextViz

NextViz is built with Claude Code as a first-class development tool. This guide explains how to start a session, which commands to run, which prompts to use, and what Claude already knows so you don't have to explain it.

---

## Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/Danncode10/nextviz.git
cd nextviz

# 2. Install dependencies
npm install

# 3. Copy the env example
cp .env.nextviz.example .env.nextviz

# 4. Open Claude Code inside the project
claude
```

Claude automatically loads `CLAUDE.md` and `SKILLS.md` on startup. It already knows every architectural rule — you don't need to explain anything.

---

## Slash Commands

Type these directly in the Claude Code chat.

---

### `/build-node <Node Name>`

**The main command. Use this to add any new node end-to-end.**

```
/build-node Supabase DB
/build-node Filter / If-Else
/build-node Discord
/build-node Gmail
/build-node Vector Store
```

What it does automatically:
1. Searches `n8n-io/n8n` on GitHub for the equivalent node
2. Creates `docs/nodes/{name}.md` with n8n reference + build plan
3. Scaffolds `node.tsx`, `panel.tsx`, and `logic.ts`
4. Implements all three files to NextViz conventions
5. Registers in `node-executors/index.ts` and `nodes/index.ts`
6. Checks off each step in the doc as it completes
7. Summarizes changes and asks before committing

**Output:**
```
app/nextviz/nodes/supabase-db/
├── node.tsx     ← canvas component
├── panel.tsx    ← properties sidebar
└── logic.ts     ← NodeExecutorFn executor

docs/nodes/supabase-db.md   ← fully documented
```

---

### `/new-node <node-name>`

**Scaffolds the empty three-file folder with boilerplate — no implementation.**

Use this when you want to write the node yourself and just need the structure.

```
/new-node filter
/new-node resend
```

**Output:**
```
app/nextviz/nodes/filter/
├── node.tsx     ← minimal boilerplate, compiles
├── panel.tsx    ← placeholder sidebar
└── logic.ts     ← empty NodeExecutorFn stub
```

---

### `/audit-node <node-name>`

**Checks an existing node against all NextViz conventions. Pass/fail report.**

Run this before opening any PR.

```
/audit-node http-request
/audit-node ai-agent
/audit-node schedule-trigger
```

Checks:
- All three files exist (`node.tsx`, `panel.tsx`, `logic.ts`)
- Registered in both index files
- No `any` types
- No `process.env` in `node.tsx`
- Only viz-* primitives in `panel.tsx`
- No free-text input for API keys (must be `VizConnection`)
- `docs/nodes/{name}.md` exists and is filled out

---

### `/checkpoint <description>`

**Git commit with the correct NextViz format.**

```
/checkpoint add Supabase DB node with select and insert operations
/checkpoint fix schedule trigger timezone handling
/checkpoint update HTTP Request to support bearer auth
```

Produces:
```bash
git commit -m "nextviz: add Supabase DB node with select and insert operations"
```

Stages only relevant files — never `.env.nextviz` or build artifacts.

---

## Prompts to Use

These are natural language prompts that work well in Claude Code sessions. Use these when you want more control than a slash command, or when you're doing something other than building a node.

---

### Starting a session

**Build a specific node:**
```
Build the Supabase DB node for NextViz. Follow the full build protocol.
```

**Pick up where you left off:**
```
Read docs/nodes/supabase-db.md and tell me which steps in the Build Plan are incomplete, then continue from where we stopped.
```

**Check overall project state:**
```
Read CLAUDE.md and the nodes/ folder. Tell me which nodes are done, which are in progress, and what's missing from the three-file pattern.
```

---

### Building nodes

**Full build (same as /build-node):**
```
Build the [Node Name] node. Research the n8n equivalent first using GitHub MCP, create the doc, scaffold the three files, implement everything, and register it.
```

**Only scaffold:**
```
Scaffold the three-file folder for the [node-name] node. Just boilerplate — no implementation yet.
```

**Only implement logic.ts:**
```
Read node.tsx and panel.tsx for the [node-name] node to understand the nodeData shape, then implement logic.ts as a NodeExecutorFn. Resolve secrets via process.env[nodeData.apiKeyRef]. No React, no browser APIs.
```

**Only implement panel.tsx:**
```
Implement panel.tsx for the [node-name] node. Read node.tsx to understand the fields needed. Use only viz-* primitives. Every field auto-saves via saveFlow Server Action. Add a Raw Toggle on every field.
```

**Only implement node.tsx:**
```
Implement node.tsx for the [node-name] node. Use BaseNode, semantic tokens (bg-card, border-border), a category-colored header icon from lucide-react, and the correct Handle positions. No process.env, no server calls.
```

---

### Debugging

**Node throws an error:**
```
The [node-name] node throws this error when the flow runs: [paste error].
Read logic.ts and engine.ts and tell me the root cause before changing anything.
```

**Canvas not showing the node:**
```
The [node-name] node isn't appearing in the canvas node palette.
Check nodes/index.ts and node-executors/index.ts and tell me what's missing.
```

**Flow not saving:**
```
Changes to the [node-name] panel aren't persisting to the flow JSON.
Read panel.tsx and actions.ts and find where the saveFlow call is broken.
```

**Type errors on build:**
```
I'm getting TypeScript errors in [file]. Read the file and lib/nextviz/types.ts and fix all type errors without using `any`.
```

---

### Reviewing and auditing

**Before a PR:**
```
Audit the [node-name] node against all NextViz conventions and give me a pass/fail report. Check: three files, both index registrations, no any, no process.env in node.tsx, viz-* only in panel.tsx, docs complete.
```

**Check a specific file:**
```
Review logic.ts for the [node-name] node. Check: correct NodeExecutorFn signature, secrets resolved via process.env[apiKeyRef], no hardcoded values, no any types, orchestrator pattern (wrapping lib/ functions).
```

**Spot inconsistencies across nodes:**
```
Read all folders in app/nextviz/nodes/ and list any that are missing node.tsx, panel.tsx, or logic.ts, or that aren't registered in the executors index.
```

---

### Documentation

**Create a missing node doc:**
```
Create docs/nodes/[node-name].md for the existing [node-name] node. Use GitHub MCP to read the n8n equivalent, then fill in the n8n Source Notes, Gap Analysis, Build Plan (mark steps already done as [x]), and What Was Adapted sections.
```

**Update doc after completing a step:**
```
Mark step [N] in docs/nodes/[node-name].md as complete.
```

---

### Git and checkpointing

**Checkpoint after a build:**
```
/checkpoint add [node-name] node — [what it does]
```

**Check what would be committed:**
```
Run git status and git diff and tell me what changed. Then suggest a commit message following the "nextviz: [description]" format.
```

---

## What Claude Knows Automatically

You never need to explain these — they're loaded from `CLAUDE.md` and `SKILLS.md` every session.

| Rule | What it means |
|---|---|
| Three-file pattern | Every node is `node.tsx` + `panel.tsx` + `logic.ts` in its own folder |
| Production guard | Every `fs` Server Action must check `NODE_ENV !== 'development'` first |
| Secret management | Store env var *names* in flow JSON (`apiKeyRef`), never the values |
| viz-* only | `panel.tsx` uses only shared primitives — never custom inputs per node |
| No `any` | Full TypeScript strictness across all node files |
| Orchestrator pattern | `logic.ts` wraps functions from `lib/` — no business logic inline |
| n8n reference first | Claude searches n8n source on GitHub before writing any node logic |
| Built-in console | Never `console.warn` for user-visible messages — use the canvas console tabs |
| Raw Toggle | Every panel field has a `</>` toggle between fixed value and expression mode |

---

## Recommended Workflows

### Add a new node (fastest)
```
/build-node <Node Name>
```
Review output → `/checkpoint add [node-name] node`

### Add a node manually
```
/new-node <node-name>
```
Implement the three files → `/audit-node <node-name>` → fix violations → `/checkpoint`

### Fix a broken node
Describe the problem to Claude → it reads the relevant files → proposes a fix → you approve → `/checkpoint`

### Contribute a doc-only task
```
Create docs/nodes/[node-name].md using the README template and the n8n source as reference.
```
→ `/checkpoint add docs for [node-name] node`

---

## Key Files Claude Reads

| File | Purpose |
|---|---|
| `CLAUDE.md` | Architectural rules, UI standards, phase status, known issues |
| `SKILLS.md` | Skill procedures — when and how to apply each protocol |
| `lib/nextviz/types.ts` | `NodeExecutorFn`, `NextVizNode`, `WorkflowJSON` types |
| `app/nextviz/nodes/_base/base-node.tsx` | Base canvas component all nodes extend |
| `components/nextviz/viz-*.tsx` | Shared sidebar primitives |
| `docs/nodes/README.md` | Node documentation format template |
| `docs/nodes/{node-name}.md` | Per-node n8n reference + build plan |

---

## Tips

- **One node per session** — focused sessions produce cleaner output. Build one node, checkpoint, start fresh.
- **Don't explain the architecture** — Claude already knows it. Just describe what you want.
- **Read before you build** — asking Claude to read the relevant files first produces better output than jumping straight to "write the code."
- **Use `/audit-node` before every PR** — it catches registration misses, `any` types, and missing docs.
- **Check the issues board** — [github.com/Danncode10/nextviz/issues](https://github.com/Danncode10/nextviz/issues) has `good first issue` labels for contributor-ready tasks.
- **Prompt with intent, not steps** — *"Build the Discord node"* is better than *"first create the folder, then create node.tsx..."* — Claude knows the steps.
