"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Save, AlertCircle, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  listProviders,
  getProvider,
  type CredentialProvider,
  type CredentialField,
} from "@/lib/nextviz/credentials/providers";
import { addCredential, suggestEnvKey } from "@/lib/nextviz/credentials/actions";

interface CredentialSetupModalProps {
  /** Pre-select a provider — hides provider step if given. */
  providerId?: string;
  onClose: () => void;
  onSaved?: (envKey: string) => void;
}

export function CredentialSetupModal({ providerId: initialProvider, onClose, onSaved }: CredentialSetupModalProps) {
  const [providerId, setProviderId] = useState<string>(initialProvider ?? "");
  const [envKey, setEnvKey]         = useState("");
  const [fields, setFields]         = useState<Record<string, string>>({});
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const provider = providerId ? getProvider(providerId) : undefined;

  // Auto-suggest env key when provider changes
  useEffect(() => {
    if (!providerId) { setEnvKey(""); return; }
    suggestEnvKey(providerId).then(setEnvKey).catch(() => setEnvKey(""));
    setFields({});
  }, [providerId]);

  const handleFieldChange = (key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!provider) { setError("Select a provider"); return; }
    if (!envKey.trim()) { setError("Variable name is required"); return; }
    if (!fields.apiKey?.trim()) { setError("API Key is required"); return; }

    setSaving(true);
    setError(null);

    const extras: Record<string, string> = {};
    for (const f of provider.fields) {
      if (f.key !== "apiKey" && fields[f.key]) extras[f.key] = fields[f.key];
    }

    const result = await addCredential({
      providerId: provider.id,
      envKey: envKey.trim(),
      apiKey: fields.apiKey,
      extras,
    });

    setSaving(false);

    if (!result.success) { setError(result.error ?? "Failed to save credential"); return; }
    onSaved?.(envKey.trim());
    onClose();
  };

  const modal = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="relative w-[90vw] max-w-[680px] max-h-[90vh] bg-[#09090b] rounded-2xl border border-zinc-800 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-800 shrink-0">
          <div className={cn(
            "w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lg font-bold",
            provider?.iconColor
          )}>
            {provider?.name?.[0] ?? "?"}
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-zinc-100">
              {provider ? `${provider.name} credential` : "Set up credential"}
            </h2>
            <p className="text-xs text-zinc-500">
              Stored in <code className="text-zinc-400">.env.nextviz</code> · Never committed to git
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !provider}
            className={cn(
              "flex items-center gap-1.5 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors",
              saving || !provider
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
          {/* Provider picker (if not pre-selected) */}
          {!initialProvider && (
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest block mb-2">Provider</label>
              <div className="grid grid-cols-2 gap-2">
                {listProviders().map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setProviderId(p.id)}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-colors",
                      providerId === p.id
                        ? "border-orange-500 bg-orange-500/5"
                        : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold shrink-0",
                      p.iconColor
                    )}>
                      {p.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200">{p.name}</p>
                      <p className="text-[11px] text-zinc-500 leading-snug mt-0.5">{p.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {provider && (
            <>
              {/* Variable name */}
              <div>
                <label className="text-xs font-medium text-zinc-500 block mb-1.5">
                  Variable Name
                </label>
                <input
                  type="text"
                  value={envKey}
                  onChange={(e) => setEnvKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm font-mono rounded-lg px-3 py-2.5 focus:outline-none focus:border-zinc-700 placeholder:text-zinc-600"
                  placeholder={provider.envKeyPrefix}
                />
                <p className="text-[11px] text-zinc-600 mt-1">
                  Auto-generated based on provider. Override to use a custom env variable.
                </p>
              </div>

              {/* Provider fields */}
              {provider.fields.map((field) => (
                <FieldInput
                  key={field.key}
                  field={field}
                  value={fields[field.key] ?? ""}
                  showApiKey={field.key === "apiKey" ? showApiKey : false}
                  onToggleVisibility={field.key === "apiKey" ? () => setShowApiKey((v) => !v) : undefined}
                  onChange={(v) => handleFieldChange(field.key, v)}
                />
              ))}

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">{error}</p>
                </div>
              )}

              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-3">
                <p className="text-xs text-zinc-500 leading-relaxed">
                  🔒 API keys are written to <code className="text-zinc-400">.env.nextviz</code> (gitignored).
                  The example file <code className="text-zinc-400">.env.nextviz.example</code> is updated with the variable name only — never the secret.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}

// ── Field Input ────────────────────────────────────────────────────────────────

function FieldInput({
  field, value, onChange, showApiKey, onToggleVisibility,
}: {
  field: CredentialField;
  value: string;
  onChange: (v: string) => void;
  showApiKey?: boolean;
  onToggleVisibility?: () => void;
}) {
  const isPassword = field.type === "password";
  const inputType = isPassword && !showApiKey ? "password" : "text";

  return (
    <div>
      <label className="text-xs font-medium text-zinc-500 block mb-1.5">
        {field.label}
        {field.required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-zinc-700 placeholder:text-zinc-600 pr-10"
        />
        {isPassword && (
          <button
            type="button"
            onClick={onToggleVisibility}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-zinc-800 transition-colors"
          >
            {showApiKey
              ? <EyeOff className="w-3.5 h-3.5 text-zinc-500" />
              : <Eye className="w-3.5 h-3.5 text-zinc-500" />}
          </button>
        )}
      </div>
      {field.helpText && <p className="text-[11px] text-zinc-600 mt-1">{field.helpText}</p>}
    </div>
  );
}
