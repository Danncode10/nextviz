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

## 6. The "Vibe" Roadmap

1. **Foundation:** Setup the React Flow canvas in a blank Next.js app and enable "Save to File" via Server Actions.
2. **Basic Nodes:** Create `onHTTP` (Trigger) and `logData` (Action).
3. **AI Integration:** Create the `aiGenerate` node using the `.env.nextviz` OpenAI key.
4. **Production Guard:** Implement the "Read-Only" UI overlay for non-localhost environments.
5. **CLI Prep:** Move the working code into a template folder for the `npx` distributor.

---