# Building a NextViz Node — Prompts & Commands Reference

This file is the **manual reference** for building a node. If you have Claude Code installed, just use `/build-node` instead — it runs all of this automatically.

---

## The Fast Path (Claude Code)

```
/build-node <Node Name>
```

That's it. Claude handles research, docs, scaffolding, implementation, and registration. Skip the rest of this file.

---

## The Manual Path (copy-paste prompt)

Use this if you're in Claude.ai (browser), a different AI, or want to control each step yourself.

Copy the block below, fill in the blanks, and paste it into the chat.

---

```
Build the **[NODE NAME]** node for NextViz.

## Step 0 — Research first, use GitHub MCP
1. Search `n8n-io/n8n` for `[n8n class name, e.g. HttpRequestV3]` and read the node descriptor + executor.
2. Read `docs/nodes/README.md` for the documentation format.
3. Create (or update) `docs/nodes/[node-name].md` — fill in the n8n Source Notes table and Build Plan before writing any code.
4. Check off each step in the Build Plan as it completes.

## Node Details
- Category: [Trigger / Action / Logic / AI / Data / Messaging]
- What it does: [one sentence]
- Key fields/options the user configures: [list them, or write "match n8n exactly"]
- Any NextViz-specific behavior: [e.g. "use viz-select for method dropdown", or "none"]
- Secret fields (if any): [e.g. "API key stored as apiKeyRef"]

## Constraints — Three-File Pattern
Every node is a self-contained three-file folder:
- `app/nextviz/nodes/[node-name]/node.tsx` — React canvas component (UI only, no process.env, no server calls)
- `app/nextviz/nodes/[node-name]/panel.tsx` — Properties sidebar (viz-* primitives only, auto-saves to flow JSON)
- `app/nextviz/nodes/[node-name]/logic.ts` — NodeExecutorFn (server-side only, no React, no browser APIs)
- Register executor in `lib/nextviz/node-executors/index.ts`
- Register component in `app/nextviz/nodes/index.ts`
- Only viz-* sidebar primitives: VizInput, VizSelect, VizToggle, VizKvEditor, VizConnection
- No `any` types anywhere
- Secrets: store env var name in flow JSON (`apiKeyRef`), resolve with `process.env[nodeData.apiKeyRef]`
- Execution state visual feedback (running / success / error) via BaseNode

## Do not commit — summarize changes and ask first
```

---

## Prompts for Specific Situations

### Start a full build session
```
I want to build the [Node Name] node for NextViz. Read CLAUDE.md first, then run the full build protocol — research n8n source, create the doc, scaffold the three files, implement, and register.
```

### Just scaffold the files (implement later)
```
Scaffold the three-file folder for a [Node Name] node. Create node.tsx, panel.tsx, and logic.ts with minimal boilerplate that compiles — no implementation yet.
```

### Implement only logic.ts
```
Implement logic.ts for the [node-name] node. Read the existing node.tsx and panel.tsx to understand the nodeData shape, then write the NodeExecutorFn following the orchestrator pattern. Resolve secrets via process.env[nodeData.apiKeyRef].
```

### Implement only panel.tsx
```
Implement panel.tsx for the [node-name] node. Read node.tsx to understand what fields are needed, then build the sidebar using only viz-* primitives. Every field must auto-save to flow JSON via the saveFlow Server Action. Add the Raw Toggle on every field.
```

### Audit before opening a PR
```
Audit the [node-name] node against all NextViz conventions. Check: three files exist, both index files updated, no any types, no process.env in node.tsx, viz-* only in panel.tsx, no free-text input for API keys, docs/nodes/[node-name].md is complete.
```

### Debug a broken node
```
The [node-name] node is throwing this error during execution: [paste error]. Read logic.ts and the engine.ts executor loop and tell me what's wrong before changing anything.
```

### Create a checkpoint
```
/checkpoint [describe what you built]
```
Or manually:
```
Stage and commit all changes for the [node-name] node. Use the commit format: "nextviz: [description]". Do not commit .env.nextviz or any build artifacts.
```

---

## Examples

### Supabase DB Node
```
Build the **Supabase DB** node for NextViz.

## Step 0 — Research first, use GitHub MCP
1. Search `n8n-io/n8n` for `Postgres` or `Supabase` and read the node descriptor + executor.
2. Read `docs/nodes/README.md`.
3. Create `docs/nodes/supabase-db.md`.

## Node Details
- Category: Data
- What it does: Run SELECT / INSERT / UPDATE / DELETE queries against a Supabase project
- Key fields/options: operation (select/insert/update/delete), table name, filters (key-value), data (key-value for insert/update), returning (toggle)
- Any NextViz-specific behavior: use supabase-introspect service to list tables as a dropdown
- Secret fields: supabaseUrl (apiKeyRef: SUPABASE_URL), supabaseKey (apiKeyRef: SUPABASE_SERVICE_ROLE_KEY)

## Constraints — Three-File Pattern
[standard constraints block]

## Do not commit — summarize changes and ask first
```

### Filter / If-Else Node
```
Build the **Filter / If-Else** node for NextViz.

## Step 0 — Research first, use GitHub MCP
1. Search `n8n-io/n8n` for `If` node and read the descriptor + executor.
2. Read `docs/nodes/README.md`.
3. Create `docs/nodes/filter.md`.

## Node Details
- Category: Logic
- What it does: Evaluates a condition and routes flow to a true or false output handle
- Key fields/options: field (expression input), operator (equals / not equals / contains / greater than / less than / is empty), value (comparison target)
- Any NextViz-specific behavior: two output handles — `true` and `false` — routed by the engine based on condition result
- Secret fields: none

## Constraints — Three-File Pattern
[standard constraints block]

## Do not commit — summarize changes and ask first
```

### Discord Node
```
Build the **Discord** node for NextViz.

## Step 0 — Research first, use GitHub MCP
1. Search `n8n-io/n8n` for `Discord` and read the node descriptor + executor.
2. Read `docs/nodes/README.md`.
3. Create `docs/nodes/discord.md`.

## Node Details
- Category: Messaging
- What it does: Sends a message to a Discord channel via webhook or bot token
- Key fields/options: delivery method (webhook URL / bot token), channel ID, message content, username override, embed toggle
- Any NextViz-specific behavior: none, match n8n exactly
- Secret fields: webhookUrl (apiKeyRef: DISCORD_WEBHOOK_URL) or botToken (apiKeyRef: DISCORD_BOT_TOKEN)

## Constraints — Three-File Pattern
[standard constraints block]

## Do not commit — summarize changes and ask first
```
