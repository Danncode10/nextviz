"use client";

import { useState, useCallback } from "react";
import { Node } from "reactflow";
import { Globe, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NodeModalShell } from "../_base/node-modal-shell";

// ── Types ─────────────────────────────────────────────────────────────────────

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type AuthType = "none" | "bearer" | "apiKey" | "basic";
type BodyType = "json" | "form" | "text";

interface HeaderRow {
  id: string;
  key: string;
  value: string;
}

interface HttpRequestConfig {
  method: HttpMethod;
  url: string;
  authType: AuthType;
  authToken: string;
  authApiKeyHeader: string;
  authApiKeyValue: string;
  authUsername: string;
  authPassword: string;
  headers: HeaderRow[];
  bodyType: BodyType;
  body: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "text-green-400 border-green-400/30 bg-green-400/5",
  POST: "text-blue-400 border-blue-400/30 bg-blue-400/5",
  PUT: "text-yellow-400 border-yellow-400/30 bg-yellow-400/5",
  PATCH: "text-orange-400 border-orange-400/30 bg-orange-400/5",
  DELETE: "text-red-400 border-red-400/30 bg-red-400/5",
};

function defaultConfig(data: Record<string, unknown>): HttpRequestConfig {
  return {
    method: (data.method as HttpMethod) ?? "GET",
    url: (data.url as string) ?? "",
    authType: (data.authType as AuthType) ?? "none",
    authToken: (data.authToken as string) ?? "",
    authApiKeyHeader: (data.authApiKeyHeader as string) ?? "X-API-Key",
    authApiKeyValue: (data.authApiKeyValue as string) ?? "",
    authUsername: (data.authUsername as string) ?? "",
    authPassword: (data.authPassword as string) ?? "",
    headers: (data.headers as HeaderRow[]) ?? [],
    bodyType: (data.bodyType as BodyType) ?? "json",
    body: (data.body as string) ?? "",
  };
}

function makeHeader(): HeaderRow {
  return { id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, key: "", value: "" };
}

// ── Primitives ────────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-zinc-500 mb-1.5">{children}</p>;
}

function StyledInput({
  value,
  onChange,
  placeholder,
  type = "text",
  mono = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  mono?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2.5",
        "focus:outline-none focus:border-zinc-700 placeholder:text-zinc-600 transition-colors",
        mono && "font-mono"
      )}
    />
  );
}

function StyledSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2.5 appearance-none focus:outline-none focus:border-zinc-700 cursor-pointer transition-colors"
      >
        {children}
      </select>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">▾</div>
    </div>
  );
}

// ── Parameters content ────────────────────────────────────────────────────────

function HttpRequestParameters({
  config,
  onChange,
}: {
  config: HttpRequestConfig;
  onChange: (c: HttpRequestConfig) => void;
}) {
  const patch = (partial: Partial<HttpRequestConfig>) => onChange({ ...config, ...partial });

  const addHeader = () => patch({ headers: [...config.headers, makeHeader()] });
  const removeHeader = (id: string) => patch({ headers: config.headers.filter((h) => h.id !== id) });
  const updateHeader = (id: string, field: "key" | "value", val: string) =>
    patch({ headers: config.headers.map((h) => (h.id === id ? { ...h, [field]: val } : h)) });

  const showBody = config.method !== "GET";

  return (
    <div className="space-y-6 max-w-lg">

      {/* Method + URL */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Request</p>

        <div>
          <FieldLabel>Method</FieldLabel>
          <div className="flex gap-2 flex-wrap">
            {METHODS.map((m) => (
              <button
                key={m}
                onClick={() => patch({ method: m })}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold font-mono rounded-lg border transition-all",
                  config.method === m
                    ? METHOD_COLORS[m]
                    : "text-zinc-600 border-zinc-800 bg-transparent hover:border-zinc-700 hover:text-zinc-400"
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel>URL</FieldLabel>
          <StyledInput
            value={config.url}
            onChange={(v) => patch({ url: v })}
            placeholder="https://api.example.com/endpoint"
            mono
          />
        </div>
      </div>

      {/* Auth */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Authentication</p>

        <div>
          <FieldLabel>Type</FieldLabel>
          <StyledSelect value={config.authType} onChange={(v) => patch({ authType: v as AuthType })}>
            <option value="none">None</option>
            <option value="bearer">Bearer Token</option>
            <option value="apiKey">API Key (Header)</option>
            <option value="basic">Basic Auth</option>
          </StyledSelect>
        </div>

        {config.authType === "bearer" && (
          <div>
            <FieldLabel>Token</FieldLabel>
            <StyledInput
              value={config.authToken}
              onChange={(v) => patch({ authToken: v })}
              placeholder="your-bearer-token"
              type="password"
              mono
            />
          </div>
        )}

        {config.authType === "apiKey" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Header Name</FieldLabel>
              <StyledInput
                value={config.authApiKeyHeader}
                onChange={(v) => patch({ authApiKeyHeader: v })}
                placeholder="X-API-Key"
                mono
              />
            </div>
            <div>
              <FieldLabel>Key Value</FieldLabel>
              <StyledInput
                value={config.authApiKeyValue}
                onChange={(v) => patch({ authApiKeyValue: v })}
                placeholder="your-api-key"
                type="password"
                mono
              />
            </div>
          </div>
        )}

        {config.authType === "basic" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Username</FieldLabel>
              <StyledInput
                value={config.authUsername}
                onChange={(v) => patch({ authUsername: v })}
                placeholder="username"
              />
            </div>
            <div>
              <FieldLabel>Password</FieldLabel>
              <StyledInput
                value={config.authPassword}
                onChange={(v) => patch({ authPassword: v })}
                placeholder="password"
                type="password"
              />
            </div>
          </div>
        )}
      </div>

      {/* Headers */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Headers</p>

        {config.headers.length > 0 && (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-1">
              <span className="text-[11px] text-zinc-600">Key</span>
              <span className="text-[11px] text-zinc-600">Value</span>
              <span />
            </div>
            {config.headers.map((h) => (
              <div key={h.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                <input
                  value={h.key}
                  onChange={(e) => updateHeader(h.id, "key", e.target.value)}
                  placeholder="Content-Type"
                  className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-700 placeholder:text-zinc-600 font-mono"
                />
                <input
                  value={h.value}
                  onChange={(e) => updateHeader(h.id, "value", e.target.value)}
                  placeholder="application/json"
                  className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-700 placeholder:text-zinc-600 font-mono"
                />
                <button
                  onClick={() => removeHeader(h.id)}
                  className="p-2 rounded-lg hover:bg-red-500/10 border border-zinc-800 transition-colors group"
                >
                  <Trash2 className="w-3.5 h-3.5 text-zinc-600 group-hover:text-red-500 transition-colors" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={addHeader}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-zinc-800",
            "text-sm text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors"
          )}
        >
          <Plus className="w-4 h-4" />
          Add Header
        </button>
      </div>

      {/* Body */}
      {showBody && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Body</p>

          <div>
            <FieldLabel>Content Type</FieldLabel>
            <StyledSelect value={config.bodyType} onChange={(v) => patch({ bodyType: v as BodyType })}>
              <option value="json">JSON</option>
              <option value="form">Form (URL-encoded)</option>
              <option value="text">Plain Text</option>
            </StyledSelect>
          </div>

          <div>
            <FieldLabel>Body</FieldLabel>
            <textarea
              value={config.body}
              onChange={(e) => patch({ body: e.target.value })}
              rows={6}
              placeholder={
                config.bodyType === "json"
                  ? '{\n  "key": "value"\n}'
                  : config.bodyType === "form"
                  ? "key=value&other=data"
                  : "Plain text body..."
              }
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-zinc-700 placeholder:text-zinc-600 transition-colors font-mono resize-none"
            />
          </div>
        </div>
      )}
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
  const [config, setConfig] = useState<HttpRequestConfig>(() =>
    defaultConfig(node.data ?? {})
  );

  const handleChange = useCallback(
    (updated: HttpRequestConfig) => {
      setConfig(updated);
      onNodeChange?.({ ...node, data: { ...node.data, ...updated } });
    },
    [node, onNodeChange]
  );

  return (
    <NodeModalShell
      node={node}
      icon={<Globe className="w-4 h-4 text-orange-400" strokeWidth={2} />}
      title="HTTP Request"
      version="1.0"
      onClose={onClose}
      onExecuteStep={onExecuteStep}
      onNodeChange={onNodeChange}
      executeButtonLabel="Send request"
      parametersContent={
        <HttpRequestParameters config={config} onChange={handleChange} />
      }
    />
  );
}
