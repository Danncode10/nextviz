import { NodeExecutionContext } from "./types";

/**
 * Resolves a single template expression against a lookup object.
 * Supports dot notation: "user.name" → lookup["user"]["name"]
 */
function resolvePath(path: string, lookup: Record<string, unknown>): unknown {
  const parts = path.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = lookup;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = current[part];
  }
  return current;
}

/**
 * Replaces {{ expr }} patterns in a string with resolved values.
 * Supported syntax:
 *   {{ key }}           → value from inputs (merged upstream outputs)
 *   {{ key.sub }}       → dot-notation traversal from inputs
 *   {{ $json.key }}     → n8n shorthand — same as inputs.key
 */
function resolveString(value: string, lookup: Record<string, unknown>): string {
  return value.replace(/\{\{\s*(.+?)\s*\}\}/g, (original, expr: string) => {
    const trimmed = expr.trim();

    // n8n shorthand: $json.field → inputs.field
    const path = trimmed.startsWith("$json.") ? trimmed.slice("$json.".length) : trimmed;

    const resolved = resolvePath(path, lookup);
    if (resolved === undefined) return original; // leave unresolved
    if (typeof resolved === "object") return JSON.stringify(resolved);
    return String(resolved);
  });
}

function resolveValue(value: unknown, lookup: Record<string, unknown>): unknown {
  if (typeof value === "string") return resolveString(value, lookup);
  if (Array.isArray(value)) return value.map((item) => resolveValue(item, lookup));
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, resolveValue(v, lookup)])
    );
  }
  return value;
}

/**
 * Walk every string in `nodeData` and replace {{ }} templates with runtime values.
 * Called by the engine just before invoking each node executor.
 *
 * Lookup priority (earlier wins on key collision):
 *   1. inputs — merged outputs of all upstream nodes
 *   2. context.payload — the original trigger payload
 */
export function resolveTemplates(
  nodeData: Record<string, unknown>,
  inputs: Record<string, unknown>,
  context: NodeExecutionContext
): Record<string, unknown> {
  const lookup: Record<string, unknown> = { ...context.payload, ...inputs };
  return resolveValue(nodeData, lookup) as Record<string, unknown>;
}
