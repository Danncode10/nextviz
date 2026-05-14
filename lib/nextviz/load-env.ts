import fs from "fs";
import path from "path";

/**
 * Load .env.nextviz into process.env (server-side only)
 */
export function loadEnvNextviz() {
  if (typeof process === "undefined") return; // Skip in browser

  const envPath = path.join(process.cwd(), ".env.nextviz");

  try {
    if (!fs.existsSync(envPath)) return;

    const content = fs.readFileSync(envPath, "utf-8");
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").trim();
        // Remove quotes if present
        const unquoted = value.replace(/^["']|["']$/g, "");
        process.env[key] = unquoted;
      }
    }
  } catch (err) {
    console.error("[NextViz] Failed to load .env.nextviz:", err);
  }
}
