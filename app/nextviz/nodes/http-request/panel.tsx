"use client";

import { useState, useCallback } from "react";
import { Node } from "reactflow";
import { Globe, AlertCircle, CheckCircle2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { NodeModalShell } from "../_base/node-modal-shell";
import { VizInput } from "@/components/nextviz/viz-input";
import { VizSelect } from "@/components/nextviz/viz-select";
import { VizToggle } from "@/components/nextviz/viz-toggle";
import { VizKvEditor, KVRow, makeKVRow } from "@/components/nextviz/viz-kv-editor";

// ── Types ─────────────────────────────────────────────────────────────────────

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
type AuthType   = "none" | "bearer" | "apiKey" | "basic";
type BodyType   = "json" | "form" | "text";

interface HttpRequestConfig {
  method:            HttpMethod;
  url:               string;
  authType:          AuthType;
  authToken:         string;
  authApiKeyHeader:  string;
  authApiKeyValue:   string;
  authUsername:      string;
  authPassword:      string;
  sendQueryParams:   boolean;
  sendHeaders:       boolean;
  sendBody:          boolean;
  queryParams:       KVRow[];
  headers:           KVRow[];
  bodyType:          BodyType;
  body:              string;
}

interface HttpResponse {
  status:    number;
  ok:        boolean;
  data:      unknown;
  duration?: number;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

function defaultConfig(data: Record<string, unknown>): HttpRequestConfig {
  return {
    method:           (data.method           as HttpMethod) ?? "GET",
    url:              (data.url              as string)     ?? "",
    authType:         (data.authType         as AuthType)   ?? "none",
    authToken:        (data.authToken        as string)     ?? "",
    authApiKeyHeader: (data.authApiKeyHeader as string)     ?? "X-API-Key",
    authApiKeyValue:  (data.authApiKeyValue  as string)     ?? "",
    authUsername:     (data.authUsername     as string)     ?? "",
    authPassword:     (data.authPassword     as string)     ?? "",
    sendQueryParams:  (data.sendQueryParams  as boolean)    ?? false,
    sendHeaders:      (data.sendHeaders      as boolean)    ?? false,
    sendBody:         (data.sendBody         as boolean)    ?? false,
    queryParams:      (data.queryParams      as KVRow[])    ?? [],
    headers:          (data.headers          as KVRow[])    ?? [],
    bodyType:         (data.bodyType         as BodyType)   ?? "json",
    body:             (data.body             as string)     ?? "",
  };
}

// ── Option sets ───────────────────────────────────────────────────────────────

const METHOD_OPTIONS = [
  "DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT",
].map((m) => ({ value: m, label: m }));

const AUTH_OPTIONS = [
  { value: "none",    label: "None" },
  { value: "bearer",  label: "Bearer Token" },
  { value: "apiKey",  label: "API Key (Header)" },
  { value: "basic",   label: "Basic Auth" },
];

const BODY_OPTIONS = [
  { value: "json", label: "JSON" },
  { value: "form", label: "Form URL-Encoded" },
  { value: "text", label: "Raw / Plain Text" },
];

// ── Response display ──────────────────────────────────────────────────────────

function ResponseDisplay({
  response,
  error,
  isLoading,
}: {
  response: HttpResponse | null;
  error:    string | null;
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
    const statusColor = response.ok ? "text-green-400" : "text-amber-400";

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
          {response.duration !== undefined && (
            <p className="text-xs text-zinc-500">{response.duration}ms</p>
          )}
        </div>
        <div className="bg-zinc-950/50 rounded border border-zinc-800/30 p-3">
          <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Response</p>
          <pre className="text-xs text-zinc-300 font-mono overflow-auto max-h-64 whitespace-pre-wrap break-words">
            {typeof response.data === "object"
              ? JSON.stringify(response.data, null, 2)
              : String(response.data)}
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

// ── Parameters content ────────────────────────────────────────────────────────

function ParametersContent({
  config,
  patch,
  onSendRequest,
  isLoading,
}: {
  config:          HttpRequestConfig;
  patch:           (p: Partial<HttpRequestConfig>) => void;
  onSendRequest:   () => void;
  isLoading:       boolean;
}) {
  const noBody = config.method === "GET" || config.method === "HEAD" || config.method === "OPTIONS";

  return (
    <div className="space-y-6 max-w-lg">

      {/* Method & URL */}
      <div className="space-y-3">
        <VizSelect
          label="Method"
          value={config.method}
          onChange={(v) => patch({ method: v as HttpMethod })}
          options={METHOD_OPTIONS}
        />
        <VizInput
          label="URL"
          value={config.url}
          onChange={(v) => patch({ url: v })}
          placeholder="https://api.example.com/endpoint"
          mono
          warning
        />
        <button
          onClick={onSendRequest}
          disabled={isLoading || !config.url}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all text-sm",
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
        <VizSelect
          label="Authentication"
          value={config.authType}
          onChange={(v) => patch({ authType: v as AuthType })}
          options={AUTH_OPTIONS}
        />
        {config.authType === "bearer" && (
          <VizInput
            label="Token"
            value={config.authToken}
            onChange={(v) => patch({ authToken: v })}
            placeholder="your-token"
            type="password"
            mono
          />
        )}
        {config.authType === "apiKey" && (
          <div className="grid grid-cols-2 gap-3">
            <VizInput
              label="Header Name"
              value={config.authApiKeyHeader}
              onChange={(v) => patch({ authApiKeyHeader: v })}
              placeholder="X-API-Key"
              mono
            />
            <VizInput
              label="Key Value"
              value={config.authApiKeyValue}
              onChange={(v) => patch({ authApiKeyValue: v })}
              placeholder="your-key"
              type="password"
              mono
            />
          </div>
        )}
        {config.authType === "basic" && (
          <div className="grid grid-cols-2 gap-3">
            <VizInput
              label="Username"
              value={config.authUsername}
              onChange={(v) => patch({ authUsername: v })}
              placeholder="username"
            />
            <VizInput
              label="Password"
              value={config.authPassword}
              onChange={(v) => patch({ authPassword: v })}
              placeholder="password"
              type="password"
            />
          </div>
        )}
      </div>

      {/* Optional sections */}
      <div className="space-y-3">
        <VizToggle
          checked={config.sendQueryParams}
          onChange={(v) => patch({ sendQueryParams: v })}
          label="Send Query Parameters"
        />
        {config.sendQueryParams && (
          <VizKvEditor
            rows={config.queryParams}
            onChange={(rows) => patch({ queryParams: rows })}
            keyPlaceholder="Parameter"
            valuePlaceholder="Value"
          />
        )}

        <VizToggle
          checked={config.sendHeaders}
          onChange={(v) => patch({ sendHeaders: v })}
          label="Send Headers"
        />
        {config.sendHeaders && (
          <VizKvEditor
            rows={config.headers}
            onChange={(rows) => patch({ headers: rows })}
            keyPlaceholder="Header"
            valuePlaceholder="Value"
          />
        )}

        <VizToggle
          checked={!noBody && config.sendBody}
          onChange={(v) => !noBody && patch({ sendBody: v })}
          label="Send Body"
          description={noBody ? `${config.method} requests cannot have a body` : undefined}
          disabled={noBody}
        />
        {!noBody && config.sendBody && (
          <div className="space-y-3 mt-2">
            <VizSelect
              value={config.bodyType}
              onChange={(v) => patch({ bodyType: v as BodyType })}
              options={BODY_OPTIONS}
            />
            <textarea
              value={config.body}
              onChange={(e) => patch({ body: e.target.value })}
              rows={5}
              placeholder={
                config.bodyType === "json"
                  ? '{\n  "key": "value"\n}'
                  : config.bodyType === "form"
                  ? "key=value&other=data"
                  : "Plain text…"
              }
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-zinc-700 placeholder:text-zinc-600 transition-colors font-mono resize-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Panel export ──────────────────────────────────────────────────────────────

interface HttpRequestPanelProps {
  node:            Node;
  onClose:         () => void;
  onExecuteStep?:  (nodeId: string) => Promise<Record<string, unknown>>;
  onNodeChange?:   (node: Node) => void;
}

export function HttpRequestPanel({
  node,
  onClose,
  onExecuteStep,
  onNodeChange,
}: HttpRequestPanelProps) {
  const [config, setConfig]     = useState<HttpRequestConfig>(() => defaultConfig(node.data ?? {}));
  const [response, setResponse] = useState<HttpResponse | null>(null);
  const [error, setError]       = useState<string | null>(null);
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
    if (!config.url) { setError("URL is required"); return; }
    if (!config.url.startsWith("http://") && !config.url.startsWith("https://")) {
      setError('URL must start with "http://" or "https://"');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const startTime = performance.now();
      let url = config.url;
      const headers: Record<string, string> = {};

      // Auth — use btoa for browser-safe base64 (no Node.js Buffer)
      if (config.authType === "bearer" && config.authToken) {
        headers["Authorization"] = `Bearer ${config.authToken}`;
      } else if (config.authType === "apiKey" && config.authApiKeyHeader && config.authApiKeyValue) {
        headers[config.authApiKeyHeader] = config.authApiKeyValue;
      } else if (config.authType === "basic" && config.authUsername && config.authPassword) {
        headers["Authorization"] = `Basic ${btoa(`${config.authUsername}:${config.authPassword}`)}`;
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
        if (config.bodyType === "json") {
          headers["Content-Type"] = "application/json";
        } else if (config.bodyType === "form") {
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

      setResponse({ status: res.status, ok: res.ok, data, duration: Math.round(performance.now() - startTime) });
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
          <ParametersContent
            config={config}
            patch={patch}
            onSendRequest={handleSendRequest}
            isLoading={isLoading}
          />
          <div className="border-t border-zinc-800/30 pt-4">
            <p className="text-xs font-medium text-zinc-600 mb-3 uppercase tracking-wider">Response</p>
            <ResponseDisplay response={response} error={error} isLoading={isLoading} />
          </div>
        </div>
      }
    />
  );
}
