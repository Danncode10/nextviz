"use server";

import { promises as fs } from "fs";
import path from "path";
import { PROVIDERS, providerFromEnvKey } from "./providers";

const ENV_FILE         = path.join(process.cwd(), ".env.nextviz");
const ENV_EXAMPLE_FILE = path.join(process.cwd(), ".env.nextviz.example");

const EXAMPLE_HEADER = `# NextViz Secrets Configuration Example
# Copy this file to .env.nextviz and populate with your actual keys.
# .env.nextviz is ignored by git.`;

const SECRET_HEADER = `# NextViz local secrets — gitignored. DO NOT COMMIT.
# Managed by the NextViz credentials UI. Manual edits are preserved on next save.`;

// ─── Guard ────────────────────────────────────────────────────────────────────

function guardDev() {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("Credential operations are forbidden outside development.");
  }
}

// ─── Env file parsing ─────────────────────────────────────────────────────────

interface EnvEntry { key: string; value: string }

async function readEnvFile(filePath: string): Promise<EnvEntry[]> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const entries: EnvEntry[] = [];
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      entries.push({
        key:   trimmed.slice(0, eq).trim(),
        value: trimmed.slice(eq + 1).trim(),
      });
    }
    return entries;
  } catch {
    return [];
  }
}

async function writeEnvFile(filePath: string, entries: EnvEntry[], header: string) {
  const lines = [header, ""];
  for (const { key, value } of entries) lines.push(`${key}=${value}`);
  await fs.writeFile(filePath, lines.join("\n") + "\n", "utf-8");
}

async function syncEnvExample() {
  const entries  = await readEnvFile(ENV_FILE);
  // Example file: keep only keys, blank values
  const stripped = entries.map(({ key }) => ({ key, value: "" }));
  await writeEnvFile(ENV_EXAMPLE_FILE, stripped, EXAMPLE_HEADER);
}

// ─── Public types ─────────────────────────────────────────────────────────────

export interface CredentialInfo {
  /** Primary env key, e.g. NEXTVIZ_OPENAI_API_KEY or NEXTVIZ_OPENAI_API_KEY_2. */
  envKey: string;
  providerId: string;
  hasValue: boolean;
  /** Non-secret extras (org id, base URL) — values shown to user. */
  extras: Record<string, string>;
}

// ─── Listing ──────────────────────────────────────────────────────────────────

export async function listCredentials(): Promise<CredentialInfo[]> {
  const entries = await readEnvFile(ENV_FILE);
  const byKey   = new Map<string, EnvEntry>();
  for (const e of entries) byKey.set(e.key, e);

  const results: CredentialInfo[] = [];
  for (const entry of entries) {
    const provider = providerFromEnvKey(entry.key);
    if (!provider) continue;

    // The primary key matches a provider prefix exactly OR with _N suffix —
    // but not extras like _ORG / _BASE_URL.
    const isExtraSuffix = /_(ORG|BASE_URL|PROJECT)(_|$)/.test(entry.key.slice(provider.envKeyPrefix.length));
    if (isExtraSuffix) continue;

    // Collect this credential's extras (anything starting with envKey_).
    const extras: Record<string, string> = {};
    for (const other of entries) {
      if (other.key.startsWith(entry.key + "_")) {
        const suffix = other.key.slice(entry.key.length + 1).toLowerCase();
        extras[suffix] = other.value;
      }
    }

    results.push({
      envKey:     entry.key,
      providerId: provider.id,
      hasValue:   !!entry.value.trim(),
      extras,
    });
  }
  return results;
}

// ─── Auto-generate next env key for a provider ────────────────────────────────

export async function suggestEnvKey(providerId: string): Promise<string> {
  const provider = PROVIDERS[providerId];
  if (!provider) throw new Error(`Unknown provider: ${providerId}`);

  const existing = (await listCredentials())
    .filter((c) => c.providerId === providerId)
    .map((c) => c.envKey);

  if (!existing.includes(provider.envKeyPrefix)) return provider.envKeyPrefix;
  let i = 2;
  while (existing.includes(`${provider.envKeyPrefix}_${i}`)) i++;
  return `${provider.envKeyPrefix}_${i}`;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function addCredential(input: {
  envKey: string;
  providerId: string;
  apiKey: string;
  extras?: Record<string, string>;
}): Promise<{ success: boolean; error?: string }> {
  guardDev();
  try {
    const { envKey, providerId, apiKey, extras = {} } = input;
    if (!PROVIDERS[providerId])              throw new Error("Unknown provider");
    if (!envKey.trim() || !apiKey.trim())    throw new Error("envKey and apiKey are required");
    if (!/^[A-Z][A-Z0-9_]*$/.test(envKey))   throw new Error("envKey must be UPPER_SNAKE_CASE");

    const entries = await readEnvFile(ENV_FILE);
    const upsert  = (key: string, value: string) => {
      const i = entries.findIndex((e) => e.key === key);
      if (i >= 0) entries[i] = { key, value };
      else        entries.push({ key, value });
    };

    upsert(envKey, apiKey);

    for (const [extraKey, extraVal] of Object.entries(extras)) {
      const fullKey = `${envKey}_${extraKey.toUpperCase()}`;
      if (extraVal && extraVal.trim()) upsert(fullKey, extraVal);
    }

    await writeEnvFile(ENV_FILE, entries, SECRET_HEADER);
    await syncEnvExample();
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteCredential(envKey: string): Promise<{ success: boolean; error?: string }> {
  guardDev();
  try {
    const entries  = await readEnvFile(ENV_FILE);
    const filtered = entries.filter((e) => !(e.key === envKey || e.key.startsWith(`${envKey}_`)));
    await writeEnvFile(ENV_FILE, filtered, SECRET_HEADER);
    await syncEnvExample();
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ─── Simple key/value operations (no provider required) ───────────────────────

export interface EnvVarInfo {
  key: string;
  hasValue: boolean;
}

export async function listAllEnvVars(): Promise<EnvVarInfo[]> {
  const entries = await readEnvFile(ENV_FILE);
  return entries.map(({ key, value }) => ({ key, hasValue: !!value.trim() }));
}

export async function setEnvVar(
  key: string,
  value: string,
): Promise<{ success: boolean; error?: string }> {
  guardDev();
  try {
    if (!key.trim()) throw new Error("Variable name is required");
    if (!/^[A-Z][A-Z0-9_]*$/.test(key)) throw new Error("Variable name must be UPPER_SNAKE_CASE");

    const entries = await readEnvFile(ENV_FILE);
    const idx = entries.findIndex((e) => e.key === key);
    if (idx >= 0) entries[idx] = { key, value };
    else entries.push({ key, value });

    await writeEnvFile(ENV_FILE, entries, SECRET_HEADER);
    await syncEnvExample();
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteEnvVar(key: string): Promise<{ success: boolean; error?: string }> {
  guardDev();
  try {
    const entries  = await readEnvFile(ENV_FILE);
    const filtered = entries.filter((e) => e.key !== key);
    await writeEnvFile(ENV_FILE, filtered, SECRET_HEADER);
    await syncEnvExample();
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
