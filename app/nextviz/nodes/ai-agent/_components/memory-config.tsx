"use client";

import { useEffect, useState } from "react";
import { Node } from "reactflow";
import { Database, KeyRound, ChevronDown, Loader2, RefreshCw, CheckSquare, Square, ChevronRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { listAllEnvVars, type EnvVarInfo } from "@/lib/nextviz/credentials/actions";
import {
  listSupabaseTables,
  listSupabaseColumns,
  type TableInfo,
  type ColumnInfo,
} from "@/lib/nextviz/services/supabase-introspect";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface SupabaseMemoryConfig {
  urlRef: string;
  keyRef: string;
  table: string;
  columns: string[];
  rowFilter: string;
}

export interface MemoryData {
  type: "none" | "simple" | "summary" | "entity" | "supabase";
  maxMessages?: number;
  supabase?: SupabaseMemoryConfig;
}

interface MemoryConfigProps {
  node: Node;
  onNodeChange?: (node: Node) => void;
}

const MEMORY_TYPES = [
  { value: "none",     label: "None",    sub: "Stateless — no history" },
  { value: "simple",   label: "Simple",  sub: "Last N messages" },
  { value: "summary",  label: "Summary", sub: "AI-summarized history" },
  { value: "entity",   label: "Entity",  sub: "Named entity tracking" },
  { value: "supabase", label: "Supabase",sub: "Query from your database", icon: true },
];

// ── Env var dropdown ──────────────────────────────────────────────────────────

function EnvVarSelect({ label, hint, value, onChange, vars }: {
  label: string; hint?: string; value: string;
  onChange: (v: string) => void; vars: EnvVarInfo[];
}) {
  return (
    <div>
      <label className="text-xs font-medium text-zinc-400 block mb-1.5">{label}</label>
      <div className="relative">
        <KeyRound className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-sm rounded-lg pl-8 pr-8 py-2.5 focus:outline-none focus:border-zinc-700 appearance-none cursor-pointer"
        >
          <option value="">Select variable…</option>
          {vars.map((v) => (
            <option key={v.key} value={v.key}>
              {v.key}{!v.hasValue ? " ⚠ empty" : ""}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
      </div>
      {hint && <p className="text-[11px] text-zinc-600 mt-1">{hint}</p>}
    </div>
  );
}

// ── Supabase config section ───────────────────────────────────────────────────

function SupabaseConfig({ config, onChange }: {
  config: SupabaseMemoryConfig;
  onChange: (c: Partial<SupabaseMemoryConfig>) => void;
}) {
  const [envVars, setEnvVars]         = useState<EnvVarInfo[]>([]);
  const [tables, setTables]           = useState<TableInfo[]>([]);
  const [columns, setColumns]         = useState<ColumnInfo[]>([]);
  const [loadingTables, setLT]        = useState(false);
  const [loadingColumns, setLC]       = useState(false);
  const [connectError, setConnErr]    = useState<string | null>(null);
  const [connected, setConnected]     = useState(false);

  useEffect(() => {
    listAllEnvVars().then(setEnvVars).catch(() => setEnvVars([]));
  }, []);

  // Auto-load columns when table is selected
  useEffect(() => {
    if (!config.table || !connected) return;
    setLC(true);
    setColumns([]);
    listSupabaseColumns(config.urlRef, config.keyRef, config.table)
      .then(({ columns: cols, error }) => {
        if (error) setConnErr(error);
        else setColumns(cols);
      })
      .finally(() => setLC(false));
  }, [config.table]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = async () => {
    if (!config.urlRef || !config.keyRef) {
      setConnErr("Select both URL and Service Role Key variables first.");
      return;
    }
    setLT(true);
    setConnErr(null);
    setConnected(false);
    setTables([]);
    setColumns([]);
    onChange({ table: "", columns: [] });

    const { tables: t, error } = await listSupabaseTables(config.urlRef, config.keyRef);
    setLT(false);
    if (error) { setConnErr(error); return; }
    setTables(t);
    setConnected(true);
  };

  const toggleColumn = (col: string) => {
    const next = config.columns.includes(col)
      ? config.columns.filter((c) => c !== col)
      : [...config.columns, col];
    onChange({ columns: next });
  };

  const canConnect = !!config.urlRef && !!config.keyRef;

  return (
    <div className="space-y-4">
      {/* Step 1 — Credentials */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">
          Step 1 · Credentials
        </p>

        <EnvVarSelect
          label="Supabase URL"
          hint="e.g. NEXTVIZ_SUPABASE_URL"
          value={config.urlRef}
          onChange={(v) => { onChange({ urlRef: v }); setConnected(false); setTables([]); }}
          vars={envVars}
        />
        <EnvVarSelect
          label="Service Role Key"
          hint="e.g. NEXTVIZ_SUPABASE_SERVICE_ROLE_KEY"
          value={config.keyRef}
          onChange={(v) => { onChange({ keyRef: v }); setConnected(false); setTables([]); }}
          vars={envVars}
        />

        <button
          onClick={handleConnect}
          disabled={!canConnect || loadingTables}
          className={cn(
            "w-full flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-lg transition-colors",
            !canConnect || loadingTables
              ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              : connected
                ? "bg-emerald-600/20 border border-emerald-600/40 text-emerald-400 hover:bg-emerald-600/30"
                : "bg-orange-600 hover:bg-orange-500 text-white"
          )}
        >
          {loadingTables
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Connecting…</>
            : connected
              ? <><RefreshCw className="w-3.5 h-3.5" /> Reconnect</>
              : <><Database className="w-3.5 h-3.5" /> Connect to Supabase</>}
        </button>

        {connectError && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">{connectError}</p>
          </div>
        )}
      </div>

      {/* Step 2 — Table */}
      {connected && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">
            Step 2 · Select Table
          </p>

          {tables.length === 0 ? (
            <p className="text-xs text-zinc-600 italic">No tables found in public schema.</p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {tables.map((t) => (
                <button
                  key={t.name}
                  onClick={() => onChange({ table: t.name, columns: [] })}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors text-sm",
                    config.table === t.name
                      ? "bg-orange-500/10 border border-orange-500/30 text-orange-300"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700"
                  )}
                >
                  <Database className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span className="font-mono text-xs flex-1">{t.name}</span>
                  {config.table === t.name && <ChevronRight className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3 — Columns */}
      {connected && config.table && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">
              Step 3 · Select Columns
            </p>
            <button
              onClick={() => onChange({
                columns: config.columns.length === columns.length
                  ? []
                  : columns.map((c) => c.name),
              })}
              className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {config.columns.length === columns.length ? "Deselect all" : "Select all"}
            </button>
          </div>

          {loadingColumns ? (
            <div className="flex items-center gap-2 text-xs text-zinc-500 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading columns…
            </div>
          ) : columns.length === 0 ? (
            <p className="text-xs text-zinc-600 italic">No columns found.</p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {columns.map((col) => {
                const checked = config.columns.includes(col.name);
                return (
                  <button
                    key={col.name}
                    onClick={() => toggleColumn(col.name)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors",
                      checked
                        ? "bg-orange-500/10 border border-orange-500/20 text-zinc-200"
                        : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    )}
                  >
                    {checked
                      ? <CheckSquare className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      : <Square className="w-3.5 h-3.5 text-zinc-600 shrink-0" />}
                    <span className="font-mono text-xs flex-1">{col.name}</span>
                    <span className="text-[10px] text-zinc-600">{col.type}</span>
                  </button>
                );
              })}
            </div>
          )}

          {config.columns.length > 0 && (
            <p className="text-[11px] text-emerald-400 mt-2">
              {config.columns.length} column{config.columns.length !== 1 ? "s" : ""} selected
            </p>
          )}
        </div>
      )}

      {/* Step 4 — Row filter */}
      {connected && config.table && config.columns.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">
            Step 4 · Row Filter <span className="text-zinc-600 normal-case font-normal">(optional)</span>
          </p>
          <input
            type="text"
            value={config.rowFilter}
            onChange={(e) => onChange({ rowFilter: e.target.value })}
            placeholder={`user_id = '{{ $json.userId }}'`}
            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-zinc-700 placeholder:text-zinc-600 font-mono text-xs"
          />
          <p className="text-[11px] text-zinc-600">
            Filter rows. Use <code className="text-zinc-500">{"{{ $json.field }}"}</code> to reference upstream node data.
          </p>
        </div>
      )}

      {/* Summary */}
      {connected && config.table && config.columns.length > 0 && (
        <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2.5 text-xs text-emerald-400">
          <Database className="w-3.5 h-3.5 shrink-0" />
          <span>
            Querying <code className="font-mono">{config.table}</code> · {config.columns.join(", ")}
            {config.rowFilter && <> · WHERE {config.rowFilter}</>}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function MemoryConfig({ node, onNodeChange }: MemoryConfigProps) {
  const memory = (node.data?.memory as MemoryData) ?? { type: "none" };

  const updateMemory = (updates: Partial<MemoryData>) =>
    onNodeChange?.({ ...node, data: { ...node.data, memory: { ...memory, ...updates } } });

  const updateSupabase = (updates: Partial<SupabaseMemoryConfig>) =>
    updateMemory({
      supabase: {
        urlRef: "", keyRef: "", table: "", columns: [], rowFilter: "",
        ...(memory.supabase ?? {}),
        ...updates,
      },
    });

  return (
    <div className="space-y-4">
      {/* Type selector */}
      <div>
        <label className="text-xs font-medium text-zinc-500 block mb-2">Memory Type</label>
        <div className="grid grid-cols-1 gap-1.5">
          {MEMORY_TYPES.map((m) => (
            <button
              key={m.value}
              onClick={() => updateMemory({ type: m.value as MemoryData["type"] })}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-colors",
                memory.type === m.value
                  ? "border-orange-500 bg-orange-500/5"
                  : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
              )}
            >
              {m.icon && <Database className="w-4 h-4 text-emerald-400 shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium", memory.type === m.value ? "text-zinc-100" : "text-zinc-400")}>
                  {m.label}
                </p>
                <p className="text-[11px] text-zinc-600">{m.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Simple / Summary / Entity */}
      {(memory.type === "simple" || memory.type === "summary" || memory.type === "entity") && (
        <div>
          <label className="text-xs font-medium text-zinc-500 block mb-2">Max Messages to Retain</label>
          <input
            type="number" min="1" max="100"
            value={memory.maxMessages ?? 10}
            onChange={(e) => updateMemory({ maxMessages: parseInt(e.target.value) || 10 })}
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-700"
          />
          <p className="text-[11px] text-zinc-600 mt-1">Number of previous messages to keep in context.</p>
        </div>
      )}

      {/* None */}
      {memory.type === "none" && (
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-3">
          <p className="text-xs text-zinc-500">Agent will not retain conversation history.</p>
        </div>
      )}

      {/* Supabase */}
      {memory.type === "supabase" && (
        <SupabaseConfig
          config={memory.supabase ?? { urlRef: "", keyRef: "", table: "", columns: [], rowFilter: "" }}
          onChange={updateSupabase}
        />
      )}
    </div>
  );
}
