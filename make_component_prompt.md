# make_component_prompt

Use this template when asking Claude to build a new NextViz node component.
Copy the block below, fill in the blanks, and paste it into the chat.

---

```
Build the **[NODE NAME]** node for NextViz.

n8n reference: search `n8n-io/n8n` for `[n8n class name, e.g. HttpRequestV3]` and read the node descriptor + executor before writing any code.

Details:
- Category: [Trigger / Action / Logic / AI / Data / Messaging]
- What it does: [one sentence]
- Key fields/options the user configures: [list them, or write "match n8n exactly"]
- Any NextViz-specific behavior: [e.g. "use viz-select for method dropdown", or "none"]
- Secret fields (if any): [e.g. "API key stored as apiKeyRef"]

Constraints:
- Follow the two-file pattern: node.tsx (UI) + logic.ts (executor)
- Use only viz-* sidebar primitives for form inputs
- No any types
- Apply execution visual feedback (running / success / error border states)
```

---

## Examples

### HTTP Request
```
Build the **HTTP Request** node for NextViz.

n8n reference: search `n8n-io/n8n` for `HttpRequestV3` and read the node descriptor + executor before writing any code.

Details:
- Category: Data
- What it does: Makes an HTTP request to any URL and returns the response body
- Key fields/options: method (GET/POST/PUT/PATCH/DELETE), URL, headers (key-value), body (raw JSON or form), authentication toggle
- Any NextViz-specific behavior: none, match n8n exactly
- Secret fields: none (auth handled via headers)

Constraints:
- Follow the two-file pattern: node.tsx (UI) + logic.ts (executor)
- Use only viz-* sidebar primitives for form inputs
- No any types
- Apply execution visual feedback (running / success / error border states)
```

### Schedule (Cron) Trigger
```
Build the **Schedule** trigger node for NextViz.

n8n reference: search `n8n-io/n8n` for `ScheduleTrigger` and read the node descriptor + executor before writing any code.

Details:
- Category: Trigger
- What it does: Fires the flow on a cron schedule
- Key fields/options: interval mode (every X minutes/hours/days), cron expression (advanced mode), timezone
- Any NextViz-specific behavior: use node-schedule package for local execution
- Secret fields: none

Constraints:
- Follow the two-file pattern: node.tsx (UI) + logic.ts (executor)
- Use only viz-* sidebar primitives for form inputs
- No any types
- Apply execution visual feedback (running / success / error border states)
```
