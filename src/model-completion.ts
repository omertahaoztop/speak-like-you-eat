import type { Context } from "@earendil-works/pi-ai";
import type { ModelRegistry } from "@earendil-works/pi-coding-agent";

const THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh", "max"] as const;

type Model = NonNullable<ReturnType<ModelRegistry["find"]>>;
type Provider = NonNullable<ReturnType<ModelRegistry["getProvider"]>>;
type ProviderContext = Parameters<Provider["streamSimple"]>[1];
type StreamSimple = ModelRegistry["streamSimple"];
type CompletionOptions = NonNullable<Parameters<StreamSimple>[2]>;
type AssistantMessage = Awaited<ReturnType<ReturnType<StreamSimple>["result"]>>;
export type ThinkingLevel = (typeof THINKING_LEVELS)[number];

export type DirectCompletionOptions = {
  signal: NonNullable<CompletionOptions["signal"]>;
  cacheRetention: "none";
  sessionId: NonNullable<CompletionOptions["sessionId"]>;
};

export function lowestSupportedThinkingLevel(model: Model): ThinkingLevel | undefined {
  if (!model.reasoning) {
    return "off";
  }

  for (const level of THINKING_LEVELS) {
    const mappedLevel = model.thinkingLevelMap?.[level];
    if (mappedLevel === null) {
      continue;
    }
    if ((level === "xhigh" || level === "max") && typeof mappedLevel !== "string") {
      continue;
    }

    return level;
  }

  return undefined;
}

export async function completeModel(
  registry: ModelRegistry,
  model: Model,
  context: Context,
  options: DirectCompletionOptions,
): Promise<AssistantMessage> {
  const thinkingLevel = lowestSupportedThinkingLevel(model);
  if (thinkingLevel === undefined) {
    throw new Error("The selected model exposes no supported thinking level.");
  }

  const completionOptions: CompletionOptions = {
    signal: options.signal,
    cacheRetention: options.cacheRetention,
    sessionId: options.sessionId,
  };
  if (thinkingLevel !== "off") {
    completionOptions.reasoning = thinkingLevel;
  }

  if (typeof registry.streamSimple === "function") {
    // The registry normalizes systemPrompt into the transcript; providers ignore raw Context.systemPrompt since pi-ai 0.86.
    return registry.streamSimple(model, context, completionOptions).result();
  }

  const provider = registry.getProvider(model.provider);
  if (provider === undefined) {
    throw new Error("The selected model provider is unavailable.");
  }

  const auth = await registry.getApiKeyAndHeaders(model);
  if (!auth.ok) {
    throw new Error(auth.error);
  }

  const effectiveModel = auth.baseUrl === undefined ? model : { ...model, baseUrl: auth.baseUrl };
  const providerOptions: CompletionOptions = {
    ...completionOptions,
    apiKey: auth.apiKey,
    headers: auth.headers,
    env: auth.env,
  };

  // Older Pi hosts and OMP providers accept raw Context, before pi-ai branded TranscriptContext.
  return provider.streamSimple(effectiveModel, context as ProviderContext, providerOptions).result();
}
