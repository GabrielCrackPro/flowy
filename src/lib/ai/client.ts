import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { ServiceUnavailableError } from "@/lib/errors/error-types";

const DEFAULT_PROVIDER = "google" as const;
type ProviderId = "google" | "openai";

function getConfig() {
  const provider = (process.env.AI_PROVIDER || DEFAULT_PROVIDER) as ProviderId;
  const apiKey = process.env.AI_PROVIDER_API_KEY;
  const model =
    process.env.AI_MODEL ||
    (provider === "google" ? "gemini-3.6-flash" : "gpt-4o-mini");

  return { provider, apiKey, model };
}

function getProvider() {
  const { provider, apiKey, model } = getConfig();

  if (!apiKey || apiKey === "sk-your-key" || apiKey === "your-gemini-key") {
    throw new ServiceUnavailableError(
      "AI Assistant is not configured. Set AI_PROVIDER_API_KEY in your environment.",
    );
  }

  if (provider === "google") {
    const google = createGoogleGenerativeAI({ apiKey });
    return { model: google(model) };
  }

  if (provider === "openai") {
    const openai = createOpenAI({ apiKey });
    return { model: openai(model) };
  }

  throw new ServiceUnavailableError(
    `Unsupported AI provider: ${provider}. Use "google" or "openai".`,
  );
}

export function getModel() {
  return getProvider().model;
}

export function isAssistantConfigured(): boolean {
  const { apiKey } = getConfig();
  return !!apiKey && apiKey !== "sk-your-key" && apiKey !== "your-gemini-key";
}
