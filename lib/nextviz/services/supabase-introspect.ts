"use server";

import { promises as fs } from "fs";
import path from "path";

const ENV_FILE = path.join(process.cwd(), ".env.nextviz");

function guardDev() {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("Supabase introspection is only available in development.");
  }
}

async function readEnvValue(key: string): Promise<string | undefined> {
  try {
    const content = await fs.readFile(ENV_FILE, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      if (trimmed.slice(0, eq).trim() !== key) continue;
      // Strip surrounding quotes (single or double) and whitespace
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      return val;
    }
  } catch { /* file missing */ }
  return undefined;
}

async function resolveCredentials(urlRef: string, keyRef: string) {
  const url = await readEnvValue(urlRef);
  const key = await readEnvValue(keyRef);
  if (!url) throw new Error(`Credential "${urlRef}" has no value in .env.nextviz.`);
  if (!key) throw new Error(`Credential "${keyRef}" has no value in .env.nextviz.`);
  return { url: url.replace(/\/$/, ""), key };
}

// Fetch the OpenAPI spec from Supabase's REST endpoint — always available,
// no information_schema workaround needed.
async function fetchOpenApiSpec(url: string, key: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${url}/rest/v1/`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`Supabase returned ${res.status}: ${res.statusText}`);
  return res.json();
}

export interface TableInfo {
  name: string;
  schema: string;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
}

/** List all public tables via the Supabase REST OpenAPI spec. */
export async function listSupabaseTables(
  urlRef: string,
  keyRef: string,
): Promise<{ tables: TableInfo[]; error?: string }> {
  guardDev();
  try {
    const { url, key } = await resolveCredentials(urlRef, keyRef);
    const spec = await fetchOpenApiSpec(url, key);
    const paths = (spec.paths ?? {}) as Record<string, unknown>;

    const tables: TableInfo[] = Object.keys(paths)
      .filter((p) => p !== "/" && !p.includes("{"))
      .map((p) => ({ name: p.replace(/^\//, ""), schema: "public" }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return { tables };
  } catch (e) {
    return { tables: [], error: (e as Error).message };
  }
}

/** List columns for a specific table via the OpenAPI definitions. */
export async function listSupabaseColumns(
  urlRef: string,
  keyRef: string,
  table: string,
): Promise<{ columns: ColumnInfo[]; error?: string }> {
  guardDev();
  try {
    const { url, key } = await resolveCredentials(urlRef, keyRef);
    const spec = await fetchOpenApiSpec(url, key);
    const definitions = (spec.definitions ?? {}) as Record<string, {
      properties?: Record<string, { type?: string; format?: string; description?: string }>;
      required?: string[];
    }>;

    const def = definitions[table];
    if (!def) throw new Error(`Table "${table}" not found in schema.`);

    const required = new Set(def.required ?? []);
    const columns: ColumnInfo[] = Object.entries(def.properties ?? {}).map(([name, prop]) => ({
      name,
      type: prop.format ?? prop.type ?? "unknown",
      nullable: !required.has(name),
    }));

    return { columns };
  } catch (e) {
    return { columns: [], error: (e as Error).message };
  }
}
