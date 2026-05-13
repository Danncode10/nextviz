/**
 * Provider Registry — Adding a new AI / API provider:
 *
 *   1. Add an entry to PROVIDERS below.
 *   2. Set envKeyPrefix using the NEXTVIZ_<PROVIDER>_API_KEY convention.
 *   3. List its models in the `models` array.
 *   4. Any custom fields (Org ID, Base URL) go in `fields`.
 *
 * The setup modal, credentials page, and node configs all read from this file —
 * no other code changes needed for new providers.
 */

export interface CredentialField {
  /** Suffix appended to envKey when stored (e.g. apiKey → no suffix, organizationId → _ORG). */
  key: "apiKey" | "organizationId" | "baseUrl" | "projectId";
  label: string;
  type: "password" | "text" | "url";
  required?: boolean;
  placeholder?: string;
  helpText?: string;
}

export interface AIModel {
  value: string;
  label: string;
}

export interface CredentialProvider {
  id: string;
  name: string;
  description: string;
  /** Base env variable name. Numeric suffix added for additional accounts. */
  envKeyPrefix: string;
  /** Tailwind text color class for branding. */
  iconColor: string;
  fields: CredentialField[];
  models: AIModel[];
}

export const PROVIDERS: Record<string, CredentialProvider> = {
  openai: {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4o, GPT-4 Turbo, and embedding models",
    envKeyPrefix: "NEXTVIZ_OPENAI_API_KEY",
    iconColor: "text-emerald-400",
    fields: [
      { key: "apiKey", label: "API Key", type: "password", required: true, placeholder: "sk-..." },
      { key: "organizationId", label: "Organization ID (optional)", type: "text", helpText: "Only required if you belong to multiple organisations" },
      { key: "baseUrl", label: "Base URL", type: "url", placeholder: "https://api.openai.com/v1" },
    ],
    models: [
      { value: "gpt-4o", label: "GPT-4o" },
      { value: "gpt-4o-mini", label: "GPT-4o Mini" },
      { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
      { value: "gpt-4", label: "GPT-4" },
      { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
    ],
  },

  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude Opus, Sonnet, and Haiku models",
    envKeyPrefix: "NEXTVIZ_ANTHROPIC_API_KEY",
    iconColor: "text-orange-400",
    fields: [
      { key: "apiKey", label: "API Key", type: "password", required: true, placeholder: "sk-ant-..." },
      { key: "baseUrl", label: "Base URL", type: "url", placeholder: "https://api.anthropic.com" },
    ],
    models: [
      { value: "claude-opus-4-7", label: "Claude Opus 4.7" },
      { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
      { value: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
    ],
  },

  google: {
    id: "google",
    name: "Google AI",
    description: "Gemini models",
    envKeyPrefix: "NEXTVIZ_GOOGLE_API_KEY",
    iconColor: "text-blue-400",
    fields: [
      { key: "apiKey", label: "API Key", type: "password", required: true, placeholder: "AIza..." },
      { key: "projectId", label: "Project ID (optional)", type: "text" },
    ],
    models: [
      { value: "gemini-2-pro", label: "Gemini 2 Pro" },
      { value: "gemini-2-flash", label: "Gemini 2 Flash" },
      { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    ],
  },
};

export function getProvider(id: string): CredentialProvider | undefined {
  return PROVIDERS[id];
}

export function listProviders(): CredentialProvider[] {
  return Object.values(PROVIDERS);
}

/** Map a stored env key back to its provider id. */
export function providerFromEnvKey(envKey: string): CredentialProvider | undefined {
  return Object.values(PROVIDERS).find((p) => envKey.startsWith(p.envKeyPrefix));
}
