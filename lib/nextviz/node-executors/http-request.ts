import { NodeExecutorFn } from "../types";

export const httpRequest: NodeExecutorFn = async (nodeData, inputs, _context) => {
  const url = (nodeData.url as string) || (inputs.url as string);
  if (!url) throw new Error("HTTP Request: no URL configured");

  const method = ((nodeData.method as string) || "GET").toUpperCase();

  const headers: Record<string, string> = {
    ...((nodeData.headers as { key: string; value: string }[] ?? [])
      .filter((h) => h.key)
      .reduce<Record<string, string>>((acc, h) => { acc[h.key] = h.value; return acc; }, {})),
  };

  // Auth
  const authType = (nodeData.authType as string) || "none";
  if (authType === "bearer" && nodeData.authToken) {
    headers["Authorization"] = `Bearer ${nodeData.authToken}`;
  } else if (authType === "apiKey" && nodeData.authApiKeyHeader && nodeData.authApiKeyValue) {
    headers[nodeData.authApiKeyHeader as string] = nodeData.authApiKeyValue as string;
  } else if (authType === "basic" && nodeData.authUsername && nodeData.authPassword) {
    const encoded = Buffer.from(`${nodeData.authUsername}:${nodeData.authPassword}`).toString("base64");
    headers["Authorization"] = `Basic ${encoded}`;
  }

  // Body
  let body: string | undefined;
  if (method !== "GET" && nodeData.body) {
    const bodyType = (nodeData.bodyType as string) || "json";
    if (bodyType === "json") {
      headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
      body = typeof nodeData.body === "string" ? nodeData.body : JSON.stringify(nodeData.body);
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

  return {
    status: response.status,
    ok: response.ok,
    data,
  };
};
