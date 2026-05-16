import { NodeExecutorFn } from "@/lib/nextviz/types";

export const httpRequest: NodeExecutorFn = async (nodeData, inputs, _context) => {
  let url = (nodeData.url as string) || (inputs.url as string);
  if (!url) throw new Error("HTTP Request: no URL configured");

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    throw new Error(`HTTP Request: invalid URL "${url}". Must start with http:// or https://`);
  }

  const method = ((nodeData.method as string) || "GET").toUpperCase();
  const headers: Record<string, string> = {};

  // Auth
  const authType = (nodeData.authType as string) || "none";
  if (authType === "bearer" && nodeData.authToken) {
    headers["Authorization"] = `Bearer ${nodeData.authToken as string}`;
  } else if (authType === "apiKey" && nodeData.authApiKeyHeader && nodeData.authApiKeyValue) {
    headers[nodeData.authApiKeyHeader as string] = nodeData.authApiKeyValue as string;
  } else if (authType === "basic" && nodeData.authUsername && nodeData.authPassword) {
    const encoded = Buffer.from(
      `${nodeData.authUsername as string}:${nodeData.authPassword as string}`
    ).toString("base64");
    headers["Authorization"] = `Basic ${encoded}`;
  }

  // Query params
  if (nodeData.sendQueryParams && Array.isArray(nodeData.queryParams)) {
    const params = (nodeData.queryParams as { key: string; value: string }[])
      .filter((p) => p.key)
      .reduce<Record<string, string>>((acc, p) => {
        acc[p.key] = p.value;
        return acc;
      }, {});
    const qs = new URLSearchParams(params).toString();
    if (qs) url = `${url}${url.includes("?") ? "&" : "?"}${qs}`;
  }

  // Headers
  if (nodeData.sendHeaders && Array.isArray(nodeData.headers)) {
    (nodeData.headers as { key: string; value: string }[])
      .filter((h) => h.key)
      .forEach((h) => {
        headers[h.key] = h.value;
      });
  }

  // Body
  let body: string | undefined;
  const canHaveBody = method !== "GET" && method !== "HEAD" && method !== "OPTIONS";
  if (canHaveBody && nodeData.sendBody && nodeData.body) {
    const bodyType = (nodeData.bodyType as string) || "json";
    if (bodyType === "json") {
      headers["Content-Type"] ??= "application/json";
      body =
        typeof nodeData.body === "string"
          ? nodeData.body
          : JSON.stringify(nodeData.body);
    } else if (bodyType === "form") {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      body = nodeData.body as string;
    } else {
      headers["Content-Type"] = "text/plain";
      body = nodeData.body as string;
    }
  }

  const response = await fetch(url, { method, headers, body });
  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  return { status: response.status, ok: response.ok, data };
};
