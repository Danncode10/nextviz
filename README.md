# NextViz

**NextViz** is a local-first, node-based automation and UI orchestration engine designed specifically for the Next.js ecosystem. It allows developers to build complex logic, chatbots, and data pipelines visually within their own codebase—eliminating the need for external VPS hosting like n8n.

## 1. The Core Philosophy

* **Code-Owned:** The workflows are stored as JSON files (`nextviz-flow.json`) in the user's repository. If it’s in Git, it’s in NextViz.
* **Environment-Aware:** Full editing power in `localhost`; **Read-Only** safety in production (Vercel).
* **Zero-Latency:** Workflows run as native Next.js Server Actions or API Routes.
* **Vibe-First:** Designed for "Vibe Coders" who want to drag, drop, and prompt their way to a functional backend.

---

## 2. Technical Stack & Constraints

* **Framework:** Next.js 14+ (App Router).
* **Visual Engine:** `reactflow` (Handles the canvas, edge logic, and node dragging).
* **Styling:** Tailwind CSS + `lucide-react` icons + `shadcn/ui`.
* **Storage:**
* **Logic:** Local `.json` files.
* **Secrets:** A dedicated `.env.nextviz` (auto-added to `.gitignore`).
* **Database:** Supabase (for persistent user data/logs).


* **Security:** Node.js `fs` module is strictly limited to `process.env.NODE_ENV === 'development'`.

---

## 3. The Architecture (The "Triad")

### A. The Editor (`/app/nextviz/page.tsx`)

The visual workspace. It interprets the JSON schema and renders it as a React Flow graph.

* **Interaction:** Dragging a node updates the local JSON via a Server Action.
* **Marketplace:** A sidebar of "Grayed-out" nodes that can be injected via CLI.

### B. The Engine (`/lib/nextviz/engine.ts`)

The "brain" that executes the workflow.

* It traverses the JSON graph.
* It identifies the **Trigger** (e.g., an incoming Webhook or a Button Click).
* It executes **Action Nodes** sequentially or in parallel based on the **Logic Nodes** (If/Else).

### C. The CLI (`npx nextviz`)

The "Delivery System."

* `init`: Scaffolds the folders and installs dependencies.
* `add <node>`: Fetches specific component code into the user's local directory.

---

## 4. Key Implementation Rules (For the AI Agent)

> [!IMPORTANT]
> **Rule 1: The Local Bridge.** All "Save" functionality must use Next.js Server Actions that interact with the local file system using `fs/promises`.
> **Rule 2: Type Strictness.** Every node must have a TypeScript interface defining its `Inputs` and `Outputs`.
> **Rule 3: Secret Isolation.** Never write secrets to the `workflow.json`. Always reference keys that exist in `.env.nextviz`.
> **Rule 4: Component Autonomy.** Nodes are just React components. A user should be able to create a new node by simply dropping a `.tsx` file into `app/nextviz/nodes/`.

---

## 5. High-Level Project Directory

Your blank Next.js project will eventually be structured as follows:

```text
/
├── app/
│   ├── nextviz/            <-- The Editor Route
│   │   ├── page.tsx        <-- Main Canvas
│   │   ├── nodes/          <-- Folder for custom Node components (user-created)
│   │   └── layout.tsx
│   └── api/nextviz/        <-- Runtime endpoints (Triggers)
├── lib/
│   └── nextviz/            <-- Shared Framework Code (Read-only)
│       ├── engine.ts       <-- The Execution Logic & Headless Orchestrator
│       ├── actions.ts      <-- Server Actions (Save/Load flows)
│       ├── registry.ts     <-- Node registry & Flow discovery
│       ├── services/       <-- Third-party integrations (Supabase, OpenAI, etc)
│       └── types.ts        <-- Schema definitions
├── flows/                  <-- 🎯 NEW: Individual Flow Storage
│   ├── default.json        <-- Example: {id, name, nodes[], edges[]}
│   └── (user creates more flows here)
├── .nextviz/               <-- Optional: Flow metadata
│   └── metadata.json       <-- Flow discovery & settings
├── .env.nextviz            <-- Secrets (Ignored by Git)
└── next.config.mjs

```

**Key Difference:** 
- **Old:** `nextviz-flow.json` held all flows in one array → merge conflicts
- **New:** `flows/` directory holds individual flow files → no conflicts, team-friendly

---

## 6. The Complete Masterplan (5 Phases)

### Phase 1: Canvas & Core Infrastructure ✅
**Goal:** Build the foundational React Flow canvas and file-based persistence.
- [x] Setup Next.js App Router with React Flow integration
- [x] Implement `FlowRegistry` for auto-discovery of individual flow files
- [x] Create Server Actions for Save/Load operations (The "Local Bridge")
- [x] Define TypeScript interfaces (`NextVizNode`, `WorkflowJSON`, etc.)
- [x] Setup `.env.nextviz` isolation and `.gitignore` configuration

### Phase 2: Multi-Flow Management & UI Polish ✅
**Goal:** Enable users to manage multiple workflows and improve UX.
- [x] Build "Add Flow" modal with name/description input
- [x] Implement flow switching in the sidebar
- [x] Add delete/rename/export operations for flows
- [x] Create a "Recent Flows" history
- [x] Implement dark mode default styling (`bg-zinc-950`, semantic tokens)

### Phase 3: Headless Engine & Fundamental Nodes ✅
**Goal:** Build the execution engine and foundational trigger/action nodes.
- [x] Implement `executeFlow("flow-name", payload)` direct invocation pattern
- [x] Build Kahn's algorithm topological sort with plan caching
- [x] Create `onHTTP` trigger node (Webhook receiver)
- [x] Create `logData` action node (Console/File logger)
- [x] Ensure engine is completely decoupled from UI (Headless design)

### Phase 4: Heavy Hitters — n8n Component Recreation 🚀
**Goal:** Implement the 9 most essential nodes that power 90% of automations.

#### Tier 1: Triggers & Scheduling
- [ ] **Schedule (Cron)** — Runs flows on intervals (hourly, daily, custom cron expressions)
  - UI: Time picker + Cron expression editor
  - Executor: Uses Node.js `cron` or node-schedule library
  - Output: `{ executedAt: ISO string }`

#### Tier 2: AI & Intelligence
- [ ] **OpenAI / Anthropic** — The "Brain" for natural language processing
  - UI: Prompt editor + Model selector (gpt-4, gpt-3.5, claude-opus, etc.)
  - Config: Temperature, max_tokens, system_role
  - Output: `{ response: string, usage: { tokens_used, cost } }`
- [ ] **Vector Store (pgvector)** — Supabase RAG integration
  - UI: Query/Embed/Upsert actions selector
  - Operations: Store embeddings, similarity search, retrieval augmented generation
  - Output: `{ results: [], similarity_scores: [] }`

#### Tier 3: Logic & Control Flow
- [ ] **Filter / If-Else** — The fork in the road
  - UI: Visual condition builder (field > value, equals, contains, regex)
  - Support: AND/OR logic, multiple branches
  - Output: Routes to different downstream nodes based on condition
- [ ] **Code (JavaScript)** — The "Escaper" for custom logic
  - UI: Monaco Editor with syntax highlighting
  - Runtime: Sandboxed `eval()` or V8 isolate
  - Input: Access all upstream node outputs via context
  - Output: Whatever the user returns

#### Tier 4: Data & Persistence
- [ ] **Supabase DB (CRUD)** — The "Memory"
  - UI: Table/RPC selector + Query builder
  - Operations: SELECT, INSERT, UPDATE, DELETE, RPC calls
  - Output: `{ data: [], rowCount: number }`
- [ ] **HTTP Request** — The "Universal Connector"
  - UI: Method selector (GET/POST/PUT/DELETE) + URL + Headers + Body
  - Auth: Basic, Bearer token, API key support
  - Output: `{ status: number, body: any, headers: {} }`

#### Tier 5: Messaging & Notifications
- [ ] **Discord / Slack** — The "Voice"
  - UI: Channel selector + Message formatter (plain text/markdown/rich embeds)
  - Operations: Send to channel, thread, DM
  - Output: `{ messageId: string, timestamp: number }`
- [ ] **Gmail / Resend** — The "Letters"
  - UI: Recipient + Subject + HTML body editor + attachment support
  - Template: Support for variables from upstream nodes
  - Output: `{ emailId: string, status: 'sent' | 'queued' }`

**Implementation Strategy:**
- Create each node as a **pair:** UI component (`app/nextviz/nodes/{name}.tsx`) + Executor (`lib/nextviz/node-executors/{name}.ts`)
- All node configs are stored in the flow JSON's `node.data` field
- Use `.env.nextviz` for all API keys (OpenAI, Anthropic, Discord token, etc.)
- Executors follow the `NodeExecutorFn` signature: `(nodeData, inputs, context) => Promise<output>`
- Add a **Node Library** sidebar showing all 9 nodes with drag-to-canvas support

### Phase 5: Advanced Features & Polish 🎯
**Goal:** Add enterprise-grade capabilities and optimization.
- [ ] **Error Handling & Retries** — Automatic retry logic with exponential backoff
- [ ] **Flow Versioning** — Store historical versions of flows in Git
- [ ] **Execution Logs & Monitoring** — Store execution history in Supabase
- [ ] **Team Collaboration** — Multi-user support with real-time updates (via Supabase Realtime)
- [ ] **Node Marketplace** — Community node sharing via GitHub/NPM
- [ ] **Performance Monitoring** — Track execution time, token usage, cost analytics
- [ ] **Production Hardening** — Rate limiting, security audits, API key rotation

---