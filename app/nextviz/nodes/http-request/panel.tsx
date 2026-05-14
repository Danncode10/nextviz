"use client";

import { useState, useCallback } from "react";
import { Node } from "reactflow";
import { Globe, Plus, Trash2, AlertTriangle, Zap, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { NodeModalShell } from "../_base/node-modal-shell";

// ── Types ─────────────────────────────────────────────────────────────────────

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
type AuthType = "none" | "bearer" | "apiKey" | "basic";
type BodyType = "json" | "form" | "text";

interface KVRow { id: string; key: string; value: string }

interface HttpRequestConfig {
  method: HttpMethod;
  url: string;
  authType: AuthType;
  authToken: string;
  authApiKeyHeader: string;
  authApiKeyValue: string;
  authUsername: string;
  authPassword: string;
  sendQueryParams: boolean;
  sendHeaders: boolean;
  sendBody: boolean;
  queryParams: KVRow[];
  headers: KVRow[];
  bodyType: BodyType;
  body: string;
}

interface HttpResponse {
  status: number;
  ok: boolean;
  data: unknown;
  duration?: number;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

function defaultConfig(data: Record<string, unknown>): HttpRequestConfig {
  return {
    method:            (data.method as HttpMethod)    ?? "GET",
    url:               (data.url as string)           ?? "",
    authType:          (data.authType as AuthType)    ?? "none",
    authToken:         (data.authToken as string)     ?? "",
    authApiKeyHeader:  (data.authApiKeyHeader as string) ?? "X-API-Key",
    authApiKeyValue:   (data.authApiKeyValue as string)  ?? "",
    authUsername:      (data.authUsername as string)  ?? "",
    authPassword:      (data.authPassword as string)  ?? "",
    sendQueryParams:   (data.sendQueryParams as boolean) ?? false,
    sendHeaders:       (data.sendHeaders as boolean)  ?? false,
    sendBody:          (data.sendBody as boolean)     ?? false,
    queryParams:       (data.queryParams as KVRow[])  ?? [],
    headers:           (data.headers as KVRow[])      ?? [],
    bodyType:          (data.bodyType as BodyType)    ?? "json",
    body:              (data.body as string)          ?? "",
  };
}

function makeRow(): KVRow {
  return { id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, key: "", value: "" };
}

// ── Primitives ────────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-zinc-500 mb-2">{children}</p>;
}

function Input({ value, onChange, placeholder, type = "text", mono = false, warning = false }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; mono?: boolean; warning?: boolean;
}) {
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full bg-zinc-900/50 border text-zinc-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none placeholder:text-zinc-600 transition-colors",
          warning && !value ? "border-amber-500/40 focus:border-amber-500" : "border-zinc-800/50 focus:border-zinc-700",
          mono && "font-mono text-xs"
        )}
      />
      {warning && !value && (
        <AlertTriangle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 pointer-events-none" />
      )}
    </div>
  );
}

function Select({ value, onChange, children }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-900/50 border border-zinc-800/50 text-zinc-300 text-sm rounded-lg px-3 py-2.5 appearance-none focus:outline-none focus:border-zinc-700 cursor-pointer transition-colors"
      >
        {children}
      </select>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">▾</div>
    </div>
  );
}

function Toggle({ checked, onChange, label, description }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-zinc-800/30 last:border-0">
      <div>
        <p className="text-sm text-zinc-300">{label}</p>
        {description && <p className="text-xs text-zinc-600 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          "relative shrink-0 w-9 h-5 rounded-full transition-colors duration-200",
          checked ? "bg-orange-500" : "bg-zinc-700"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200",
            checked && "translate-x-4"
          )}
        />
      </button>
    </div>
  );
}

function KVEditor({ rows, onChange, keyPlaceholder = "Name", valuePlaceholder = "Value" }: {
  rows: KVRow[]; onChange: (rows: KVRow[]) => void; keyPlaceholder?: string; valuePlaceholder?: string;
}) {
  const add = () => onChange([...rows, makeRow()]);
  const remove = (id: string) => onChange(rows.filter((r) => r.id !== id));
  const update = (id: string, field: "key" | "value", val: string) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, [field]: val } : r)));

  return (
    <div className="space-y-2 mt-2">
      {rows.map((r) => (
        <div key={r.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
          <input value={r.key} onChange={(e) => update(r.id, "key", e.target.value)} placeholder={keyPlaceholder}
            className="bg-zinc-900/50 border border-zinc-800/50 text-zinc-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-700 placeholder:text-zinc-600 font-mono" />
          <input value={r.value} onChange={(e) => update(r.id, "value", e.target.value)} placeholder={valuePlaceholder}
            className="bg-zinc-900/50 border border-zinc-800/50 text-zinc-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-700 placeholder:text-zinc-600 font-mono" />
          <button onClick={() => remove(r.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 border border-zinc-800/30 transition-colors">
            <Trash2 className="w-3.5 h-3.5 text-zinc-600 hover:text-red-500 transition-colors" />
          </button>
        </div>
      ))}
      <button onClick={add} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-400 transition-colors py-2 font-medium">
        <Plus className="w-3.5 h-3.5" />
        Add entry
      </button>
    </div>
  );
}

// ── Parameters content ────────────────────────────────────────────────────────

const METHODS: HttpMethod[] = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"];

function ParametersContent({ config, patch, onSendRequest, isLoading }: {
  config: HttpRequestConfig;
  patch: (p: Partial<HttpRequestConfig>) => void;
  onSendRequest: () => void;
  isLoading: boolean;
}) {
  const noBody = config.method === "GET" || config.method === "HEAD" || config.method === "OPTIONS";

  return (
    <div className="space-y-6 max-w-lg">

      {/* Method & URL */}
      <div className="space-y-3">
        <div>
          <Label>Method</Label>
          <Select value={config.method} onChange={(v) => patch({ method: v as HttpMethod })}>
            {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
        </div>

        <div>
          <Label>URL</Label>
          <Input value={config.url} onChange={(v) => patch({ url: v })} placeholder="https://api.example.com/endpoint" mono warning />
        </div>

        <button
          onClick={onSendRequest}
          disabled={isLoading || !config.url}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all",
            isLoading || !config.url
              ? "bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-60"
              : "bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-900/20 active:scale-[0.98]"
          )}
        >
          <Zap className={cn("w-4 h-4", isLoading && "animate-pulse")} />
          {isLoading ? "Sending…" : "Send request"}
        </button>
      </div>

      {/* Authentication */}
      <div className="space-y-3">
        <Label>Authentication</Label>
        <Select value={config.authType} onChange={(v) => patch({ authType: v as AuthType })}>
          <option value="none">None</option>
          <option value="bearer">Bearer Token</option>
          <option value="apiKey">API Key (Header)</option>
          <option value="basic">Basic Auth</option>
        </Select>

        {config.authType === "bearer" && (
          <div><Label>Token</Label><Input value={config.authToken} onChange={(v) => patch({ authToken: v })} placeholder="your-token" type="password" mono /></div>
        )}
        {config.authType === "apiKey" && (
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Header Name</Label><Input value={config.authApiKeyHeader} onChange={(v) => patch({ authApiKeyHeader: v })} placeholder="X-API-Key" mono /></div>
            <div><Label>Key Value</Label><Input value={config.authApiKeyValue} onChange={(v) => patch({ authApiKeyValue: v })} placeholder="your-key" type="password" mono /></div>
          </div>
        )}
        {config.authType === "basic" && (
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Username</Label><Input value={config.authUsername} onChange={(v) => patch({ authUsername: v })} placeholder="username" /></div>
            <div><Label>Password</Label><Input value={config.authPassword} onChange={(v) => patch({ authPassword: v })} placeholder="password" type="password" /></div>
          </div>
        )}
      </div>

      {/* Optional sections */}
      <div className="space-y-3">
        <Toggle checked={config.sendQueryParams} onChange={(v) => patch({ sendQueryParams: v })} label="Send Query Parameters" />
        {config.sendQueryParams && <KVEditor rows={config.queryParams} onChange={(rows) => patch({ queryParams: rows })} keyPlaceholder="Parameter" valuePlaceholder="Value" />}

        <Toggle checked={config.sendHeaders} onChange={(v) => patch({ sendHeaders: v })} label="Send Headers" />
        {config.sendHeaders && <KVEditor rows={config.headers} onChange={(rows) => patch({ headers: rows })} keyPlaceholder="Header" valuePlaceholder="Value" />}

        <Toggle
          checked={!noBody && config.sendBody}
          onChange={(v) => !noBody && patch({ sendBody: v })}
          label="Send Body"
          description={noBody ? `${config.method} requests cannot have a body` : undefined}
        />
        {!noBody && config.sendBody && (
          <div className="space-y-3 mt-2">
            <Select value={config.bodyType} onChange={(v) => patch({ bodyType: v as BodyType })}>
              <option value="json">JSON</option>
              <option value="form">Form URL-Encoded</option>
              <option value="text">Raw / Plain Text</option>
            </Select>
            <textarea
              value={config.body}
              onChange={(e) => patch({ body: e.target.value })}
              rows={5}
              placeholder={config.bodyType === "json" ? '{\n  "key": "value"\n}' : config.bodyType === "form" ? "key=value&other=data" : "Plain text..."}
              className="w-full bg-zinc-900/50 border border-zinc-800/50 text-zinc-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-zinc-700 placeholder:text-zinc-600 transition-colors font-mono resize-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Response display ──────────────────────────────────────────────────────────

function ResponseDisplay({ response, error, isLoading }: {
  response: HttpResponse | null;
  error: string | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center animate-pulse">
          <Zap className="w-5 h-5 text-orange-400" />
        </div>
        <p className="text-sm text-zinc-400">Sending request…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-sm font-medium text-red-400">Request failed</p>
        </div>
        <pre className="text-xs text-red-300 bg-red-950/30 rounded px-3 py-2 overflow-auto max-h-40">
          {error}
        </pre>
      </div>
    );
  }

  if (response) {
    const isJson = typeof response.data === "object";
    const statusColor = response.ok ? "text-green-400" : "text-amber-400";
    const statusBg = response.ok ? "bg-green-500/10 border-green-500/30" : "bg-amber-500/10 border-amber-500/30";

    return (
      <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {response.ok ? (
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400" />
            )}
            <span className={cn("text-sm font-mono font-bold", statusColor)}>
              {response.status}
            </span>
          </div>
          {response.duration && (
            <p className="text-xs text-zinc-500">{response.duration}ms</p>
          )}
        </div>

        <div className="bg-zinc-950/50 rounded border border-zinc-800/30 p-3">
          <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Response</p>
          <pre className="text-xs text-zinc-300 font-mono overflow-auto max-h-64 whitespace-pre-wrap break-words">
            {isJson ? JSON.stringify(response.data, null, 2) : String(response.data)}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2">
      <p className="text-sm text-zinc-500">Click "Send request" to test</p>
    </div>
  );
}

// ── Panel export ──────────────────────────────────────────────────────────────

interface HttpRequestPanelProps {
  node: Node;
  onClose: () => void;
  onExecuteStep?: (nodeId: string) => Promise<Record<string, unknown>>;
  onNodeChange?: (node: Node) => void;
}

export function HttpRequestPanel({ node, onClose, onExecuteStep, onNodeChange }: HttpRequestPanelProps) {
  const [config, setConfig] = useState<HttpRequestConfig>(() => defaultConfig(node.data ?? {}));
  const [response, setResponse] = useState<HttpResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const patch = useCallback(
    (partial: Partial<HttpRequestConfig>) => {
      setConfig((prev) => {
        const updated = { ...prev, ...partial };
        onNodeChange?.({ ...node, data: { ...node.data, ...updated } });
        return updated;
      });
    },
    [node, onNodeChange]
  );

  const handleSendRequest = useCallback(async () => {
    if (!config.url) {
      setError("URL is required");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const startTime = performance.now();

      let url = config.url;
      const headers: Record<string, string> = {};

      // Auth
      const authType = config.authType || "none";
      if (authType === "bearer" && config.authToken) {
        headers["Authorization"] = `Bearer ${config.authToken}`;
      } else if (authType === "apiKey" && config.authApiKeyHeader && config.authApiKeyValue) {
        headers[config.authApiKeyHeader] = config.authApiKeyValue;
      } else if (authType === "basic" && config.authUsername && config.authPassword) {
        const encoded = Buffer.from(`${config.authUsername}:${config.authPassword}`).toString("base64");
        headers["Authorization"] = `Basic ${encoded}`;
      }

      // Query params
      if (config.sendQueryParams && config.queryParams.length > 0) {
        const params = config.queryParams
          .filter((p) => p.key)
          .reduce<Record<string, string>>((acc, p) => { acc[p.key] = p.value; return acc; }, {});
        const qs = new URLSearchParams(params).toString();
        if (qs) url = `${url}${url.includes("?") ? "&" : "?"}${qs}`;
      }

      // Headers
      if (config.sendHeaders && config.headers.length > 0) {
        config.headers.filter((h) => h.key).forEach((h) => { headers[h.key] = h.value; });
      }

      // Body
      let body: string | undefined;
      const noBody = config.method === "GET" || config.method === "HEAD" || config.method === "OPTIONS";
      if (!noBody && config.sendBody && config.body) {
        const bodyType = config.bodyType || "json";
        if (bodyType === "json") {
          headers["Content-Type"] = "application/json";
        } else if (bodyType === "form") {
          headers["Content-Type"] = "application/x-www-form-urlencoded";
        } else {
          headers["Content-Type"] = "text/plain";
        }
        body = config.body;
      }

      const res = await fetch(url, { method: config.method, headers, body });
      const contentType = res.headers.get("content-type") ?? "";
      const data = contentType.includes("application/json")
        ? await res.json()
        : await res.text();

      const duration = Math.round(performance.now() - startTime);
      setResponse({ status: res.status, ok: res.ok, data, duration });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  return (
    <NodeModalShell
      node={node}
      icon={<Globe className="w-4 h-4 text-emerald-400" strokeWidth={2} />}
      title="HTTP Request"
      version="1.0"
      onClose={onClose}
      onExecuteStep={onExecuteStep}
      onNodeChange={onNodeChange}
      executeButtonLabel="Send request"
      parametersContent={
        <div className="space-y-6">
          <ParametersContent config={config} patch={patch} onSendRequest={handleSendRequest} isLoading={isLoading} />
          <div className="border-t border-zinc-800/30 pt-4">
            <p className="text-xs font-medium text-zinc-600 mb-3">RESPONSE</p>
            <ResponseDisplay response={response} error={error} isLoading={isLoading} />
          </div>
        </div>
      }
    />
  );
}
