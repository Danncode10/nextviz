<!-- BEGIN:nextjs-agent-rules -->

# 🚀 NextViz AI Steering & Project Rules (AGENTS.md)

> **Core Mission**: You are an expert AI Engineer working on **NextViz**—a local-first, node-based automation engine. Your goal is to maintain the "Vibe Coding" philosophy: speed, local ownership, and seamless React Flow orchestration.

## 🛠 Required Diagnostic Protocol

Before modifying the codebase, verify the following environment state:

1. **Local Bridge Check**: Ensure the agent has access to the local filesystem (`fs-extra`) via Node.js.
2. **Environment Check**: Identify if the current execution is `development` or `production`.
3. **Dependency Check**: Verify `reactflow`, `lucide-react`, and `shadcn/ui` are initialized.

## 🏗 NextViz Architectural Guardrails

1. **The Source of Truth (SOT)**: The file `nextviz-flow.json` is the absolute authority. Any UI change in the canvas must be synced to this file via Server Actions.
2. **The Production Guard**: **CRITICAL**. Any Server Action involving `fs` (File System) must be wrapped in a check: `if (process.env.NODE_ENV !== 'development') throw new Error(...)`.
3. **Node Modularity**: Every node (Trigger, Action, Logic) must be a self-contained component in `app/nextviz/nodes/`.
4. **Local Secrets**: All sensitive keys (OpenAI, Supabase Service Role) MUST be stored in `.env.nextviz`. Never commit this file.
5. **Type Safety**: Use the `NextVizNode` and `WorkflowJSON` interfaces for all flow manipulations. No `any`.

## 🎨 UI & UX Standards (The "NextViz" Aesthetic)

1. **Dark Mode Default**: Use `bg-zinc-950` and `text-zinc-50`. Avoid pure `#000`.
2. **The Canvas**: React Flow backgrounds should use `variant="dots"` with a subtle color (`#333`).
3. **Semantic Tokens**:
* Nodes: `bg-card`, `border-border`, `text-card-foreground`.
* Active/Running: `border-primary` with a pulse effect.
* Error state: `border-destructive`.


4. **Read-Only Mode**: If `isLocalhost` is false, the UI must show a fixed header banner: *"Read-Only Mode: Edit in Localhost to sync with Git."*

## 🔄 Vibe Workflow & Git Integration

1. **Commit Checkpoints**: When requested to "checkpoint," use the Terminal/GitHub MCP to:
* `git add nextviz-flow.json .env.nextviz.example`
* `git commit -m "nextviz: [detailed description of workflow change]"`


2. **Feature Blueprints**: Before building a new Node type (e.g., Discord, Slack), look for the schema definition in `lib/nextviz/registry.ts`.
3. **Atomic Services**: Logic for third-party integrations (Supabase, OpenAI) must live in `lib/nextviz/services/` and be imported by the Node components.

## 🔒 Security & RLS (Supabase)

1. **Service Role Warning**: Only use the Supabase Service Role key inside Server Actions that are guarded by the `development` check.
2. **Client-Side Safety**: Never expose `.env.nextviz` keys to the browser. Use the "Bridge" pattern to handle executions on the server.

## 🗄️ CLI Engine Logic (For CLI Tasks)

If tasked with updating the `npx nextviz` logic:

1. **Templates**: Ensure the `templates/` folder matches the current working `app/nextviz` structure.
2. **Injections**: The CLI must automatically add `.env.nextviz` to the user's `.gitignore`.

---

## Code Architecture Summary

* **Primary Data**: `nextviz-flow.json`
* **Secrets**: `.env.nextviz`
* **Frontend**: Next.js 15+ App Router + React Flow
* **Backend**: Next.js Server Actions (The "Local Bridge")
* **Deployment**: Vercel (Running in Read-Only Mode)

**Always be concise. If a change breaks the "Local Bridge" logic, stop and warn the user.**

---

### How to use this:

1. Save this as `AGENTS.md` in your root.
2. Whenever you start a new chat session with your AI, tell it: **"Read AGENTS.md, CLAUDE.md, README.md, and SKILLS.md and follow the NextViz protocols."**
3. It will now know exactly how to handle your specific "Local Bridge" and "Production Guard" setup without you explaining it every time.

<!-- END:nextjs-agent-rules -->, 