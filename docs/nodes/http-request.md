# HTTP Request Node

**Category:** Data  
**n8n Reference:** `packages/nodes-base/nodes/HttpRequest/V3/HttpRequestV3.node.ts`  
**Status:** In Progress

---

## n8n Source Notes

Key fields extracted from `HttpRequestV3.node.ts`:

| Field | Type | Default | Notes |
|---|---|---|---|
| `method` | enum | `GET` | GET / POST / PUT / PATCH / DELETE / HEAD / OPTIONS |
| `url` | string | — | Must start with `http://` or `https://` (validated) |
| `authentication` | enum | `none` | `none` / `genericCredentialType` / `predefinedCredentialType` |
| `sendQuery` | boolean | `false` | Toggle to show query params section |
| `queryParameters.parameters` | KV array | `[]` | `{ name, value }` pairs |
| `specifyQuery` | enum | `keypair` | `keypair` or `json` (raw JSON string alternative) |
| `sendHeaders` | boolean | `false` | Toggle to show headers section |
| `headerParameters.parameters` | KV array | `[]` | `{ name, value }` pairs |
| `specifyHeaders` | enum | `keypair` | `keypair` or `json` |
| `sendBody` | boolean | `false` | Toggle; disabled for GET/HEAD/OPTIONS |
| `contentType` | enum | `json` | `json` / `form-urlencoded` / `multipart-form-data` / `binaryData` / `raw` |
| `specifyBody` | enum | `keypair` | `keypair` / `json` / `string` |
| `bodyParameters.parameters` | KV array | `[]` | Used when `specifyBody = keypair` |
| `jsonBody` | string | — | Used when `specifyBody = json` |
| `body` | string | — | Used when `specifyBody = string` (form-urlencoded) |
| `rawContentType` | string | — | Custom MIME type when `contentType = raw` |
| `options.timeout` | number | `300000` | 5 min default |
| `options.redirect.followRedirects` | boolean | `true` (v4+) | Follow 3xx responses |
| `options.redirect.maxRedirects` | number | — | Cap redirect hops |
| `options.allowUnauthorizedCerts` | boolean | `false` | Skip TLS verification |
| `options.response.responseFormat` | enum | `autodetect` | `autodetect` / `json` / `text` / `file` |
| `options.response.fullResponse` | boolean | `false` | Return `{ body, headers, statusCode, statusMessage }` |
| `options.response.neverError` | boolean | `false` | Don't throw on 4xx/5xx — return error body as data |
| `options.response.outputPropertyName` | string | `data` | Key name for response in output |
| `options.lowercaseHeaders` | boolean | `true` | Normalize header keys to lowercase |
| `options.queryParameterArrays` | enum | — | `indices` / `brackets` / `repeat` |
| `options.batching.batchSize` | number | `1` | Requests per batch |
| `options.batching.batchInterval` | number | `0` | ms delay between batches |
| `options.proxy` | string | — | Proxy URL |

---

## Gap Analysis (NextViz vs n8n)

### 🟥 Tier 1 — Architectural fixes (do first)

- [ ] **Two-file pattern violated** — Executor is at `lib/nextviz/node-executors/http-request.ts`, not `app/nextviz/nodes/http-request/logic.ts`. Move it; have node-executors/index.ts re-export.
- [ ] **`node.tsx` reinvents BaseNode** — Duplicates ~50 lines of hover/handle/label logic. Refactor to use `_base/base-node.tsx`.
- [ ] **No execution visual feedback** — `node.tsx` doesn't apply `running → border-primary + pulse`, `success → border-green-500`, `error → border-destructive`. Add execution state reading to `BaseNode` (benefits all nodes).
- [ ] **viz-\* primitives missing** — `panel.tsx` uses local `Input`/`Select`/`Toggle`/`KVEditor`. Only `viz-connection.tsx` exists. Build `viz-input`, `viz-select`, `viz-toggle`, `viz-kv-editor` first, then refactor the panel.
- [ ] **`Buffer.from` in browser** — `panel.tsx:397` uses Node.js `Buffer` for Basic auth encoding in the test-send. Replace with `btoa(\`${user}:${pass}\`)`.

### 🟧 Tier 2 — Feature parity gaps

- [ ] **URL validation** — Reject URLs not starting with `http://` or `https://` (match n8n behavior).
- [ ] **Response format override** — Add `options.response.responseFormat` toggle: `autodetect` / `json` / `text`.
- [ ] **Full response toggle** — `options.response.fullResponse`: return `{ body, headers, statusCode, statusMessage }` instead of just body.
- [ ] **`neverError` toggle** — Don't fail flow on 4xx/5xx; return error body as data.
- [ ] **Timeout** — Add `options.timeout` field (default 5 min / 300000ms). Current executor has no timeout.
- [ ] **Redirect controls** — `options.redirect.followRedirects` (default on) + `maxRedirects`.
- [ ] **Allow self-signed certs** — `options.allowUnauthorizedCerts` toggle for local/staging APIs.
- [ ] **JSON mode for query/headers/body** — Toggle between `keypair` and `json` raw string input for each section.
- [ ] **`multipart/form-data` body** — Required for file uploads.
- [ ] **Raw body with custom Content-Type** — Send XML or custom MIME types via `rawContentType`.
- [ ] **Output property name** — `options.response.outputPropertyName` (default `data`).
- [ ] **Lowercase headers** — Normalize header keys by default (`options.lowercaseHeaders`).

### 🟨 Tier 3 — Engine-wide gaps (not HTTP-specific)

- [ ] **Template resolution** — `{{ user_email }}` / `{{ $node["X"].data.y }}` strings in `nodeData` fields are never replaced with upstream values. This is a global engine gap affecting every node.
- [ ] **Per-item iteration** — n8n loops the executor over each item in the input array. NextViz runs the executor once.
- [ ] **`continueOnFail`** — If HTTP request fails, entire flow halts. Need opt-in error passthrough.

### 🟦 Tier 4 — Defer

- [ ] Pagination (auto-follow next-page URL or increment param)
- [ ] Batching (rate-limit N requests per interval)
- [ ] Proxy support
- [ ] SSL client certificates
- [ ] OAuth1 / OAuth2 / Digest auth (requires credentials system)
- [ ] Predefined credential types (GitHub, Stripe, etc.)

---

## Build Plan

Steps are ordered: complete each before moving to the next.

### Step 1 — Build missing viz-\* primitives
- [ ] `components/nextviz/viz-input.tsx` — text / number / URL / password input
- [ ] `components/nextviz/viz-select.tsx` — static option dropdown
- [ ] `components/nextviz/viz-toggle.tsx` — boolean toggle with label + description
- [ ] `components/nextviz/viz-kv-editor.tsx` — key-value row editor with add/remove

### Step 2 — Fix `node.tsx` (use BaseNode + execution feedback)
- [ ] Refactor `node.tsx` to extend `BaseNode` instead of duplicating it
- [ ] Read `data.executionState` (`running` / `success` / `error`) and apply border classes
- [ ] Show method + hostname subtitle below node label (keep current display logic)

### Step 3 — Add execution state to BaseNode
- [ ] Add `executionState?: 'running' | 'success' | 'error'` to `BaseNodeData`
- [ ] Apply conditional border classes in `BaseNode` (all nodes inherit this for free)

### Step 4 — Move executor to two-file pattern
- [ ] Create `app/nextviz/nodes/http-request/logic.ts` with the `NodeExecutorFn`
- [ ] Update `lib/nextviz/node-executors/http-request.ts` to re-export from the new location (keeps index.ts wiring intact)

### Step 5 — Fix `Buffer.from` browser bug
- [ ] Replace `Buffer.from(\`${user}:${pass}\`).toString('base64')` with `btoa(\`${user}:${pass}\`)` in `panel.tsx`

### Step 6 — Refactor `panel.tsx` to use viz-\* primitives
- [ ] Replace local `Input` → `viz-input`
- [ ] Replace local `Select` → `viz-select`
- [ ] Replace local `Toggle` → `viz-toggle`
- [ ] Replace local `KVEditor` → `viz-kv-editor`

### Step 7 — Add Tier 2 features to panel + executor
- [ ] URL validation (http/https prefix check)
- [ ] Response format override dropdown
- [ ] Full response toggle
- [ ] neverError toggle
- [ ] Timeout input (ms)
- [ ] Redirect controls
- [ ] allowUnauthorizedCerts toggle
- [ ] Output property name input

### Step 8 — Body enhancements
- [ ] JSON mode toggle for query params, headers, body
- [ ] multipart/form-data content type option
- [ ] Raw body with custom rawContentType field

---

## What Was Adapted from n8n (not copied)

- n8n uses Vue 3 + n8n-workflow SDK. All UI ported to React + Tailwind.
- n8n uses `IExecuteFunctions` context with `this.getNodeParameter()` helpers. NextViz uses plain `nodeData: Record<string, unknown>`.
- n8n loops over input items; NextViz currently runs once (Tier 3 gap above).
- n8n has a full credential system with encrypted storage. NextViz inlines auth in `node.data` for now (tracked in Tier 4 debt).

## What Was Skipped (and Why)

| n8n feature | Reason skipped |
|---|---|
| SSL client certificates | Requires credential system; deferred |
| Pagination | Complex; v2 feature |
| Batching | Low priority for local-first use case |
| OAuth1 / OAuth2 | Requires credential system |
| Predefined credential types | Requires credential registry |
| Binary file response | Deferred until file handling is designed |
