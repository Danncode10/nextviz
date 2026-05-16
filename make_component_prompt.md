# make_component_prompt

Use this template when asking Claude to build a new NextViz node component.
Copy the block below, fill in the blanks, and paste it into the chat.

---

```
Build the **[NODE NAME]** node for NextViz.

## Step 0 — Read before coding
1. Search `n8n-io/n8n` for `[n8n class name, e.g. HttpRequestV3]` and read the node descriptor + executor.
2. Read `docs/nodes/README.md` for the documentation format.
3. Create (or update) `docs/nodes/[node-name].md` following the format in docs/nodes/README.md — fill in the n8n Source Notes table and Masterplan before writing any code.
4. Check off each step in the Build Plan as it completes.

## Node Details
- Category: [Trigger / Action / Logic / AI / Data / Messaging]
- What it does: [one sentence]
- Key fields/options the user configures: [list them, or write "match n8n exactly"]
- Any NextViz-specific behavior: [e.g. "use viz-select for method dropdown", or "none"]
- Secret fields (if any): [e.g. "API key stored as apiKeyRef"]

## Constraints
- Two-file pattern: `app/nextviz/nodes/[node-name]/node.tsx` (UI only) + `logic.ts` (executor only)
- `lib/nextviz/node-executors/[node-name].ts` re-exports from logic.ts
- Only viz-* sidebar primitives for form inputs (VizInput, VizSelect, VizToggle, VizKvEditor)
- No `any` types
- Execution state visual feedback (running / success / error) via BaseNode
- Update `docs/nodes/[node-name].md` as steps complete — mark [x] in Build Plan
- **Do NOT populate Test Results** — leave all tier test sections empty. Tests are generated separately after each tier is complete.

## Do not commit — summarize changes and ask first
```

---

## Examples

### HTTP Request
```
Build the **HTTP Request** node for NextViz.

## Step 0 — Read before coding
1. Search `n8n-io/n8n` for `HttpRequestV3` and read the node descriptor + executor.
2. Read `docs/nodes/README.md` for the documentation format.
3. Create `docs/nodes/http-request.md` following that format.

## Node Details
- Category: Data
- What it does: Makes an HTTP request to any URL and returns the response body
- Key fields/options: method (GET/POST/PUT/PATCH/DELETE), URL, headers (key-value), body (raw JSON or form), authentication toggle
- Any NextViz-specific behavior: none, match n8n exactly
- Secret fields: none (auth handled via headers)

## Constraints
- Two-file pattern: node.tsx (UI) + logic.ts (executor)
- Only viz-* sidebar primitives
- No any types
- Execution state visual feedback via BaseNode

## Do not commit — summarize changes and ask first
```

### Schedule (Cron) Trigger
```
Build the **Schedule** trigger node for NextViz.

## Step 0 — Read before coding
1. Search `n8n-io/n8n` for `ScheduleTrigger` and read the node descriptor + executor.
2. Read `docs/nodes/README.md` for the documentation format.
3. Create `docs/nodes/schedule-trigger.md` following that format.

## Node Details
- Category: Trigger
- What it does: Fires the flow on a cron schedule
- Key fields/options: interval mode (every X minutes/hours/days), cron expression (advanced mode), timezone
- Any NextViz-specific behavior: use node-schedule package for local execution
- Secret fields: none

## Constraints
- Two-file pattern: node.tsx (UI) + logic.ts (executor)
- Only viz-* sidebar primitives
- No any types
- Execution state visual feedback via BaseNode

## Do not commit — summarize changes and ask first
```
