# 🚀 NextViz AI Skills (SKILLS.md)

This document defines the core actionable "skills" or procedures the AI agent must employ when working on the **NextViz** project. These skills implement the rules and guardrails defined in `AGENTS.md`.

## Skill 1: Run Diagnostic Protocol
**When to use:** Before making any architectural modifications to the codebase.
**Action:**
1. Verify access to the local filesystem (`fs-extra`).
2. Identify the current execution environment (`development` vs `production`).
3. Verify required dependencies (`reactflow`, `lucide-react`, `shadcn/ui`) are present.

## Skill 2: Manage Flow State (Source of Truth)
**When to use:** When modifying the UI canvas or node connections.
**Action:**
1. Ensure all changes are synchronized to the appropriate flow file in `flows/{activeFlowId}.json` via Server Actions.
2. Use the `FlowRegistry` utility to load and discover flows from the `flows/` directory.
3. Maintain type safety using `NextVizNode` and `WorkflowJSON` interfaces. Do not use `any`.

## Skill 3: Enforce the Production Guard
**When to use:** When creating or modifying Server Actions involving the File System (`fs`).
**Action:**
1. Wrap all File System operations in the critical environment check: `if (process.env.NODE_ENV !== 'development') throw new Error(...)`.
2. Ensure the Read-Only Mode UI banner is enforced if the environment is not localhost.

## Skill 4: Build Atomic Nodes & Services
**When to use:** When adding new feature nodes (e.g., Slack, Discord, Supabase).
**Action:**
1. Look up or add the schema definition in `lib/nextviz/registry.ts`.
2. Build the visual node in `app/nextviz/nodes/` as a self-contained component.
3. Place third-party integration logic in `lib/nextviz/services/`.

## Skill 5: Apply "NextViz" Aesthetics
**When to use:** When building or modifying React components and UI elements.
**Action:**
1. Use `bg-zinc-950` and `text-zinc-50` for the dark mode default. Avoid pure `#000`.
2. Apply semantic tokens for nodes: `bg-card`, `border-border`, `text-card-foreground`.
3. Highlight active states with `border-primary` and error states with `border-destructive`.
4. Ensure the React Flow canvas background uses `variant="dots"` with subtle colors (e.g., `#333`).

## Skill 6: Secure Secrets & Implement RLS
**When to use:** When handling sensitive keys, API integrations, or Supabase connections.
**Action:**
1. Verify all local secrets are stored in `.env.nextviz`. Ensure this file is never committed.
2. Only use the Supabase Service Role key inside guarded Server Actions (the "Local Bridge").
3. Never expose `.env.nextviz` keys to the client-side browser.

## Skill 7: Execute Vibe Workflow (Checkpointing)
**When to use:** When the user requests a "checkpoint" or a feature sprint is complete.
**Action:**
1. Use the terminal to stage flow files and example env: `git add flows/ .env.nextviz.example`.
2. Commit with the standard prefix: `git commit -m "nextviz: [detailed description of workflow change]"`.
3. **Benefit:** Individual flows can be committed separately, reducing merge conflicts in team environments.

## Skill 8: Implement CLI Engine Logic
**When to use:** When tasked with updating the `npx nextviz` logic.
**Action:**
1. Ensure the `templates/` folder matches the current working `app/nextviz` structure.
2. Ensure the CLI automatically injects `.env.nextviz` into the target user's `.gitignore`.

## Skill 9: Build a Phase 4 Heavy Hitter Node
**When to use:** When implementing any of the 10 Heavy Hitter nodes (Schedule, OpenAI, Supabase DB, HTTP Request, If-Else, Code JS, Vector Store, Discord/Slack, Gmail/Resend).
**Action:**
1. Create a two-file folder following the **Manifest Pattern**:
   - `app/nextviz/nodes/{node-name}/node.tsx` — React canvas UI only.
   - `app/nextviz/nodes/{node-name}/logic.ts` — `NodeExecutorFn` server executor only.
2. **node.tsx rules:** Import `Handle` and `Position` from `reactflow`. Use `bg-card`, `border-border`, and semantic tokens. Display a category-colored header icon using `lucide-react`.
3. **logic.ts rules:** Match the signature `(nodeData, inputs, context) => Promise<Record<string, unknown>>`. Resolve secrets via `process.env[nodeData.apiKeyRef as string]` — never hardcode.
4. Register the executor in `lib/nextviz/node-executors/index.ts`.
5. Add any required npm packages to `package.json` and install them.
6. Use `viz-*` sidebar primitives (never build custom inputs per node). Add the `viz-connection` component for any API key field.

## Skill 11: Maintain Node Documentation
**When to use:** Before building a new node OR after completing any build plan step on an existing node.
**Action:**
1. **Before building:** Check if `docs/nodes/{node-name}.md` exists. If not, create it using the standard template (n8n source notes → gap analysis → build plan → adapted/skipped sections).
2. **During build:** After completing each step in the build plan, mark it `[x]` in the doc.
3. **After building:** Fill in the "What Was Adapted" and "What Was Skipped" sections so the next session has full context.
4. **n8n reference lookup:** Use `github-mcp-server` to search `n8n-io/n8n` for the equivalent node before writing the gap analysis. Don't guess — read the source.
5. **Never leave a node undocumented.** If a node folder exists in `app/nextviz/nodes/` without a matching `docs/nodes/` file, create the doc before touching the code.

## Skill 10: Implement the Properties Sidebar
**When to use:** When building or updating the node configuration panel that slides out on node click.
**Action:**
1. The sidebar reads from and writes to `node.data` in the active flow JSON via Server Actions.
2. Use only `viz-*` primitive components (`viz-input`, `viz-select`, `viz-code-editor`, `viz-connection`).
3. Implement the **Raw Toggle** on every field: a `</>` icon switches between `Fixed Value` (static string) and `Expression` (template string evaluated at runtime). Store `isExpression: boolean` in `node.data` alongside the value.
4. For API key fields, use `viz-connection` which auto-reads key names from `.env.nextviz`. **Never** render a free-text input for secrets.
5. For variable mapping fields, render a dropdown of available `{{ node.output }}` references built from the current flow's upstream nodes. Store the raw template string in `node.data`.
6. On every field change, auto-save to `flows/{flowId}.json` via the existing `saveFlow` Server Action.
