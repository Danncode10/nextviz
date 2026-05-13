"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Trash2, KeyRound, ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff, Pencil, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { listAllEnvVars, setEnvVar, deleteEnvVar, type EnvVarInfo } from "@/lib/nextviz/credentials/actions";

export default function CredentialsPage() {
  const [vars, setVars]           = useState<EnvVarInfo[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [name, setName]           = useState("");
  const [value, setValue]         = useState("");
  const [showVal, setShowVal]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [deleting, setDeleting]   = useState<string | null>(null);

  // Inline edit state
  const [editingKey, setEditingKey]   = useState<string | null>(null);
  const [editVal, setEditVal]         = useState("");
  const [showEditVal, setShowEditVal] = useState(false);
  const [editSaving, setEditSaving]   = useState(false);
  const [editError, setEditError]     = useState<string | null>(null);

  const isDevelopment = process.env.NODE_ENV === "development";

  const refresh = useCallback(async () => {
    setLoading(true);
    try { setVars(await listAllEnvVars()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleAdd = async () => {
    if (!name.trim() || !value.trim()) { setError("Both fields are required"); return; }
    setSaving(true);
    setError(null);
    const result = await setEnvVar(name.trim(), value.trim());
    setSaving(false);
    if (!result.success) { setError(result.error ?? "Failed to save"); return; }
    setName(""); setValue(""); setShowForm(false);
    await refresh();
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`Delete ${key}?`)) return;
    setDeleting(key);
    await deleteEnvVar(key);
    await refresh();
    setDeleting(null);
  };

  const startEdit = (key: string) => {
    setEditingKey(key);
    setEditVal("");
    setShowEditVal(false);
    setEditError(null);
  };

  const cancelEdit = () => { setEditingKey(null); setEditError(null); };

  const handleEditSave = async () => {
    if (!editVal.trim()) { setEditError("Value is required"); return; }
    setEditSaving(true);
    setEditError(null);
    const result = await setEnvVar(editingKey!, editVal.trim());
    setEditSaving(false);
    if (!result.success) { setEditError(result.error ?? "Failed to save"); return; }
    setEditingKey(null);
    await refresh();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Read-only banner */}
      {!isDevelopment && (
        <div className="w-full bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-500 text-center py-2 text-sm font-medium">
          Read-Only Mode: Credential management requires localhost.
        </div>
      )}

      {/* Top bar */}
      <div className="h-14 border-b border-border bg-card flex items-center gap-3 px-4 shrink-0">
        <Link href="/nextviz" className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to canvas
        </Link>
        <div className="h-5 w-px bg-zinc-800" />
        <h1 className="text-sm font-semibold flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-orange-400" />
          Credentials
        </h1>
        <div className="flex-1" />
        {isDevelopment && (
          <button
            onClick={() => { setShowForm((v) => !v); setError(null); }}
            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Credential
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6 space-y-4">

          {/* Add form */}
          {showForm && isDevelopment && (
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 space-y-4">
              <p className="text-sm font-semibold text-zinc-200">New Credential</p>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 block">Variable Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                  placeholder="e.g. NEXTVIZ_OPENAI_API_KEY"
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm font-mono rounded-lg px-3 py-2.5 focus:outline-none focus:border-zinc-600 placeholder:text-zinc-600"
                />
                <p className="text-[11px] text-zinc-600">Use UPPER_SNAKE_CASE.</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 block">Value</label>
                <div className="relative">
                  <input
                    type={showVal ? "text" : "password"}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Paste your secret here…"
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:border-zinc-600 placeholder:text-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowVal((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-zinc-800 transition-colors"
                  >
                    {showVal ? <EyeOff className="w-3.5 h-3.5 text-zinc-500" /> : <Eye className="w-3.5 h-3.5 text-zinc-500" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </p>
              )}

              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => { setShowForm(false); setError(null); setName(""); setValue(""); }}
                  className="text-sm text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={saving || !name.trim() || !value.trim()}
                  className={cn(
                    "text-sm font-medium px-4 py-1.5 rounded-lg transition-colors",
                    saving || !name.trim() || !value.trim()
                      ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                      : "bg-orange-600 hover:bg-orange-500 text-white"
                  )}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          )}

          {/* List */}
          {loading ? (
            <p className="text-center text-zinc-600 text-sm py-16">Loading…</p>
          ) : vars.length === 0 ? (
            <div className="border border-dashed border-zinc-800 rounded-xl p-12 text-center">
              <KeyRound className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">No credentials yet.</p>
              {isDevelopment && (
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-3 text-xs text-orange-400 hover:text-orange-300 transition-colors"
                >
                  Add your first credential →
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {vars.map((v) => (
                <div key={v.key} className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                  {/* Row */}
                  <div className="px-4 py-3 flex items-center gap-3">
                    <code className="text-sm font-mono text-zinc-200 flex-1">{v.key}</code>
                    {v.hasValue ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded shrink-0">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 rounded shrink-0">
                        <AlertCircle className="w-2.5 h-2.5" /> Empty
                      </span>
                    )}
                    {isDevelopment && (
                      <>
                        <button
                          onClick={() => editingKey === v.key ? cancelEdit() : startEdit(v.key)}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors shrink-0",
                            editingKey === v.key
                              ? "text-orange-400 bg-orange-500/10"
                              : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
                          )}
                          title="Edit value"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(v.key)}
                          disabled={!!deleting}
                          className="p-1.5 rounded-lg transition-colors shrink-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Inline edit form */}
                  {editingKey === v.key && (
                    <div className="border-t border-zinc-800 px-4 py-3 bg-zinc-900/80 space-y-2">
                      <label className="text-xs font-medium text-zinc-500 block">New Value</label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            autoFocus
                            type={showEditVal ? "text" : "password"}
                            value={editVal}
                            onChange={(e) => setEditVal(e.target.value)}
                            placeholder="Enter new value…"
                            onKeyDown={(e) => { if (e.key === "Enter") handleEditSave(); if (e.key === "Escape") cancelEdit(); }}
                            className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2 pr-10 focus:outline-none focus:border-orange-600 placeholder:text-zinc-600"
                          />
                          <button
                            type="button"
                            onClick={() => setShowEditVal((s) => !s)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-zinc-800 transition-colors"
                          >
                            {showEditVal ? <EyeOff className="w-3 h-3 text-zinc-500" /> : <Eye className="w-3 h-3 text-zinc-500" />}
                          </button>
                        </div>
                        <button
                          onClick={handleEditSave}
                          disabled={editSaving || !editVal.trim()}
                          className={cn(
                            "p-2 rounded-lg transition-colors shrink-0",
                            editSaving || !editVal.trim()
                              ? "text-zinc-600 cursor-not-allowed"
                              : "text-emerald-400 hover:bg-emerald-500/10"
                          )}
                          title="Save"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors shrink-0"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {editError && (
                        <p className="text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" /> {editError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
