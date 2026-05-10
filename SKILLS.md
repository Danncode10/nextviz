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
1. Ensure all changes are synchronized to `nextviz-flow.json` via Server Actions.
2. Maintain type safety using `NextVizNode` and `WorkflowJSON` interfaces. Do not use `any`.

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
1. Use the terminal to stage critical files: `git add nextviz-flow.json .env.nextviz.example`.
2. Commit with the standard prefix: `git commit -m "nextviz: [detailed description of workflow change]"`.

## Skill 8: Implement CLI Engine Logic
**When to use:** When tasked with updating the `npx nextviz` logic.
**Action:**
1. Ensure the `templates/` folder matches the current working `app/nextviz` structure.
2. Ensure the CLI automatically injects `.env.nextviz` into the target user's `.gitignore`.
