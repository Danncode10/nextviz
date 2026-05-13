"use client";

/**
 * viz-connection — Credential picker primitive.
 *
 * Renders a dropdown of existing credentials matching a provider, with a
 * "Set up new" button that opens the credential setup modal. The node stores
 * the selected envKey (e.g. NEXTVIZ_OPENAI_API_KEY) — never the actual secret.
 */

import { useEffect, useState, useCallback } from "react";
import { ChevronDown, Plus, KeyRound, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { listCredentials, type CredentialInfo } from "@/lib/nextviz/credentials/actions";
import { CredentialSetupModal } from "@/app/nextviz/_components/credential-setup-modal";

interface VizConnectionProps {
  providerId: string;
  value?: string;
  onChange: (envKey: string) => void;
  label?: string;
}

export function VizConnection({ providerId, value, onChange, label }: VizConnectionProps) {
  const [credentials, setCredentials] = useState<CredentialInfo[]>([]);
  const [loading, setLoading]         = useState(true);
  const [modalOpen, setModalOpen]     = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const all = await listCredentials();
      setCredentials(all.filter((c) => c.providerId === providerId));
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => { refresh(); }, [refresh]);

  const selected = credentials.find((c) => c.envKey === value);

  return (
    <div className="space-y-2">
      {label && <label className="text-xs font-medium text-zinc-500 block">{label}</label>}

      <div className="flex items-stretch gap-2">
        {/* Dropdown */}
        <div className="relative flex-1">
          <KeyRound className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
          <select
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={loading}
            className={cn(
              "w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg pl-8 pr-8 py-2.5 focus:outline-none focus:border-zinc-700 appearance-none cursor-pointer",
              loading && "opacity-60 cursor-wait"
            )}
          >
            <option value="">
              {loading
                ? "Loading…"
                : credentials.length === 0
                  ? "No credentials yet"
                  : "Select a credential…"}
            </option>
            {credentials.map((c) => (
              <option key={c.envKey} value={c.envKey}>
                {c.envKey}{!c.hasValue ? " (empty)" : ""}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
        </div>

        {/* Set up new */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium px-3 rounded-lg hover:bg-zinc-800 hover:border-zinc-700 transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Set up new
        </button>
      </div>

      {/* Status hint */}
      {selected && selected.hasValue && (
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
          <CheckCircle2 className="w-3 h-3" />
          Credential ready · reads from <code className="text-emerald-300">.env.nextviz</code>
        </div>
      )}
      {selected && !selected.hasValue && (
        <p className="text-[11px] text-yellow-400">
          ⚠ This variable is empty in <code>.env.nextviz</code>. Add a value before executing.
        </p>
      )}

      {/* Setup modal */}
      {modalOpen && (
        <CredentialSetupModal
          providerId={providerId}
          onClose={() => setModalOpen(false)}
          onSaved={(envKey) => { refresh().then(() => onChange(envKey)); }}
        />
      )}
    </div>
  );
}
