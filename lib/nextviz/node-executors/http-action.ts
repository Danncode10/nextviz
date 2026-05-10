import { NodeExecutorFn } from "../types";

/**
 * httpAction — makes an outbound HTTP request.
 * URL and method come from the node's canvas config (nodeData),
 * with fallback to upstream inputs so they can be set dynamically.
 */
export const httpAction: NodeExecutorFn = async (nodeData, inputs, _context) => {
  const url = (nodeData.url as string) || (inputs.url as string);
  if (!url) throw new Error("HTTP Action: no URL configured");

  const method = ((nodeData.method as string) || "GET").toUpperCase();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((nodeData.headers as Record<string, string>) ?? {}),
  };

  const body =
    method !== "GET"
      ? JSON.stringify(nodeData.body ?? inputs.body ?? {})
      : undefined;

  const response = await fetch(url, { method, headers, body });

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  return {
    status: response.status,
    ok: response.ok,
    data,
  };
};
