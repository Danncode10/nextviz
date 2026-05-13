"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Save, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Node } from "reactflow";
import { listProviders, getProvider } from "@/lib/nextviz/credentials/providers";
import {
  listCredentials,
  addCredential,
  suggestEnvKey,
  type CredentialInfo,
} from "@/lib/nextviz/credentials/actions";

interface ModelSelectorPopupProps {
  node: Node;
  onClose: () => void;
  onNodeChange?: (node: Node) => void;
}

export function ModelSelectorPopup({ node, onClose, onNodeChange }: ModelSelectorPopupProps) {
  const existing = (node.data?.chatModel as Record<string, string>) ?? {};

  const [providerId, setProviderId]     = useState<string>(existing.provider ?? "");
  const [modelType, setModelType]       = useState<string>(existing.type ?? "");
  const [envKey, setEnvKey]             = useState<string>(existing.apiKeyRef ?? "");
  const [apiKey, setApiKey]             = useState<string>("");
  const [showKey, setShowKey]           = useState(false);
  const [existingCreds, setExistingCreds] = useState<CredentialInfo[]>([]);
  const [selectedCred, setSelectedCred] = useState<string>(existing.apiKeyRef ?? "");
  const [useExisting, setUseExisting]   = useState(!!existing.apiKeyRef);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const provider = providerId ? getProvider(providerId) : undefined;

  // Auto-suggest env key and load existing creds when provider changes
  const refreshCreds = useCallback(async (pid: string) => {
    if (!pid) return;
    const [suggested, all] = await Promise.all([
      suggestEnvKey(pid).catch(() => ""),
      listCredentials().catch(() => [] as CredentialInfo[]),
    ]);
    const forProvider = all.filter((c) => c.providerId === pid);
    setExistingCreds(forProvider);
    if (!existing.apiKeyRef) {
      setEnvKey(suggested);
      setSelectedCred(forProvider[0]?.envKey ?? "");
      setUseExisting(forProvider.length > 0);
    }
  }, [existing.apiKeyRef]);

  useEffect(() => {
    if (providerId) refreshCreds(providerId);
  }, [providerId, refreshCreds]);

  const handleProviderSelect = (pid: string) => {
    setProviderId(pid);
    setModelType("");
    setApiKey("");
    setError(null);
  };

  const handleSave = async () => {
    if (!providerId) { setError("Select a provider"); return; }
    if (!modelType)  { setError("Select a model"); return; }

    let resolvedKey = selectedCred;

    if (!useExisting || !selectedCred) {
      // Save a new credential
      if (!envKey.trim()) { setError("Variable name is required"); return; }
      if (!apiKey.trim()) { setError("API Key is required"); return; }
      setSaving(true);
      const result = await addCredential({ providerId, envKey: envKey.trim(), apiKey, extras: {} });
      setSaving(false);
      if (!result.success) { setError(result.error ?? "Failed to save credential"); return; }
      resolvedKey = envKey.trim();
    }

    onNodeChange?.({
      ...node,
      data: {
        ...node.data,
        chatModel: { provider: providerId, type: modelType, apiKeyRef: resolvedKey },
      },
    });
    onClose();
  };

  const selectedCredInfo = existingCreds.find((c) => c.envKey === selectedCred);

  const modal = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="relative w-[90vw] max-w-[520px] max-h-[90vh] bg-[#09090b] rounded-2xl border border-zinc-800 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-800 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <span className="text-blue-400 font-bold text-sm">AI</span>
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-zinc-100">Select Model</h2>
            <p className="text-xs text-zinc-500">Choose a provider, model, and credential.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !providerId || !modelType}
            className={cn(
              "flex items-center gap-1.5 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors",
              saving || !providerId || !modelType
                ? "bg-zinc-700 cursor-not-allowed opacity-60"
                : "bg-orange-600 hover:bg-orange-500 shadow-lg shadow-orange-900/20"
            )}
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving…" : "Save"}
          </button>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition-colors">
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Provider */}
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-2">Provider *</label>
            <div className="grid grid-cols-3 gap-2">
              {listProviders().map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleProviderSelect(p.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-colors",
                    providerId === p.id
                      ? "border-orange-500 bg-orange-500/5"
                      : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                  )}
                >
                  <div className={cn("w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold", p.iconColor)}>
                    {p.name[0]}
                  </div>
                  <span className="text-[11px] font-medium text-zinc-300">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {provider && (
            <>
              {/* Model */}
              <div>
                <label className="text-xs font-medium text-zinc-500 block mb-2">Model *</label>
                <select
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-zinc-700 appearance-none cursor-pointer"
                >
                  <option value="">Select a model…</option>
                  {provider.models.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Credential */}
              <div>
                <label className="text-xs font-medium text-zinc-500 block mb-2">Credential *</label>

                {existingCreds.length > 0 && (
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setUseExisting(true)}
                      className={cn(
                        "flex-1 text-xs font-medium py-1.5 rounded-lg border transition-colors",
                        useExisting
                          ? "border-orange-500 bg-orange-500/10 text-orange-300"
                          : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
                      )}
                    >
                      Use existing
                    </button>
                    <button
                      onClick={() => setUseExisting(false)}
                      className={cn(
                        "flex-1 text-xs font-medium py-1.5 rounded-lg border transition-colors",
                        !useExisting
                          ? "border-orange-500 bg-orange-500/10 text-orange-300"
                          : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
                      )}
                    >
                      Add new
                    </button>
                  </div>
                )}

                {(useExisting && existingCreds.length > 0) ? (
                  <div className="space-y-2">
                    <select
                      value={selectedCred}
                      onChange={(e) => setSelectedCred(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-zinc-700 appearance-none cursor-pointer"
                    >
                      <option value="">Select a credential…</option>
                      {existingCreds.map((c) => (
                        <option key={c.envKey} value={c.envKey}>
                          {c.envKey}{!c.hasValue ? " (empty)" : ""}
                        </option>
                      ))}
                    </select>
                    {selectedCredInfo?.hasValue && (
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        Credential ready
                      </div>
                    )}
                    {selectedCredInfo && !selectedCredInfo.hasValue && (
                      <p className="text-[11px] text-yellow-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3 h-3" />
                        This variable is empty in .env.nextviz
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-zinc-600 block mb-1">Variable Name</label>
                      <input
                        type="text"
                        value={envKey}
                        onChange={(e) => setEnvKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm font-mono rounded-lg px-3 py-2.5 focus:outline-none focus:border-zinc-700 placeholder:text-zinc-600"
                        placeholder={provider.envKeyPrefix}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-600 block mb-1">API Key</label>
                      <div className="relative">
                        <input
                          type={showKey ? "text" : "password"}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="Paste your API key…"
                          className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:border-zinc-700 placeholder:text-zinc-600"
                        />
                        <button
                          type="button"
                          onClick={() => setShowKey((v) => !v)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-zinc-800 transition-colors"
                        >
                          {showKey
                            ? <EyeOff className="w-3.5 h-3.5 text-zinc-500" />
                            : <Eye className="w-3.5 h-3.5 text-zinc-500" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-xs text-red-300">{error}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}
