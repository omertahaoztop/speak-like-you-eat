import assert from "node:assert/strict";
import test from "node:test";
import type { Context } from "@earendil-works/pi-ai";
import type { ModelRegistry } from "@earendil-works/pi-coding-agent";
import { completeModel, lowestSupportedThinkingLevel } from "../src/model-completion.ts";

type Model = NonNullable<ReturnType<ModelRegistry["find"]>>;
type Provider = NonNullable<ReturnType<ModelRegistry["getProvider"]>>;
type StreamSimple = Provider["streamSimple"];
type StreamOptions = NonNullable<Parameters<StreamSimple>[2]>;
type RegistryStreamOptions = NonNullable<Parameters<ModelRegistry["streamSimple"]>[2]>;
type AssistantMessage = Awaited<ReturnType<ReturnType<StreamSimple>["result"]>>;

const unsupportedThinkingLevels = {
  off: null,
  minimal: null,
  low: null,
  medium: null,
  high: null,
  xhigh: null,
  max: null,
} as const;

function model(overrides: Partial<Model> = {}): Model {
  return {
    provider: "test",
    id: "model",
    name: "Test model",
    api: "test-api",
    baseUrl: "https://original.example.test",
    reasoning: true,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 1,
    maxTokens: 1,
    ...overrides,
  } as Model;
}

function context(): Context {
  return {
    systemPrompt: "SLYE system prompt",
    messages: [{ role: "user", content: "SLYE context and target", timestamp: 0 }],
  };
}

function result(): AssistantMessage {
  return {
    role: "assistant",
    content: [{ type: "text", text: "Plain result." }],
    api: "test-api",
    provider: "test",
    model: "model",
    stopReason: "stop",
    timestamp: 0,
    usage: {
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
      totalTokens: 0,
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
    },
  } as AssistantMessage;
}

test("uses off only for non-reasoning models", () => {
  assert.equal(
    lowestSupportedThinkingLevel(model({ reasoning: false, thinkingLevelMap: unsupportedThinkingLevels })),
    "off",
  );
});

test("supports standard levels when their map values are omitted and excludes null", () => {
  assert.equal(lowestSupportedThinkingLevel(model()), "off");
  assert.equal(lowestSupportedThinkingLevel(model({ thinkingLevelMap: { off: null } })), "minimal");
  assert.equal(lowestSupportedThinkingLevel(model({ thinkingLevelMap: { off: null, minimal: null } })), "low");
  assert.equal(
    lowestSupportedThinkingLevel(model({ thinkingLevelMap: { off: null, minimal: null, low: null } })),
    "medium",
  );
  assert.equal(
    lowestSupportedThinkingLevel(model({ thinkingLevelMap: { off: null, minimal: null, low: null, medium: null } })),
    "high",
  );
});

test("requires an explicit string mapping for extended levels", () => {
  const standardLevelsExcluded = { off: null, minimal: null, low: null, medium: null, high: null } as const;

  assert.equal(lowestSupportedThinkingLevel(model({ thinkingLevelMap: standardLevelsExcluded })), undefined);
  assert.equal(
    lowestSupportedThinkingLevel(model({ thinkingLevelMap: { ...standardLevelsExcluded, xhigh: "xhigh" } })),
    "xhigh",
  );
  assert.equal(
    lowestSupportedThinkingLevel(model({ thinkingLevelMap: { ...standardLevelsExcluded, xhigh: null, max: "max" } })),
    "max",
  );
});

test("returns undefined when every thinking level is excluded", () => {
  assert.equal(lowestSupportedThinkingLevel(model({ thinkingLevelMap: unsupportedThinkingLevels })), undefined);
});

test("dispatches an off request with the original model and forwarded auth", async () => {
  const selectedModel = model({ reasoning: false });
  const selectedContext = context();
  const signal = new AbortController().signal;
  let receivedModel: Model | undefined;
  let receivedContext: Context | undefined;
  let receivedOptions: StreamOptions | undefined;
  const provider = {
    streamSimple(effectiveModel: Model, requestContext: Context, options: StreamOptions) {
      receivedModel = effectiveModel;
      receivedContext = requestContext;
      receivedOptions = options;
      return { result: async () => result() };
    },
  };
  const registry = {
    getProvider() {
      return provider;
    },
    async getApiKeyAndHeaders() {
      return {
        ok: true as const,
        apiKey: "api-key",
        headers: { "x-auth": "header" },
        env: { REGION: "test" },
      };
    },
  } as unknown as ModelRegistry;

  assert.deepEqual(
    await completeModel(registry, selectedModel, selectedContext, {
      signal,
      cacheRetention: "none",
      sessionId: "session",
    }),
    result(),
  );
  assert.strictEqual(receivedModel, selectedModel);
  assert.strictEqual(receivedContext, selectedContext);
  assert.deepEqual(receivedOptions, {
    signal,
    cacheRetention: "none",
    sessionId: "session",
    apiKey: "api-key",
    headers: { "x-auth": "header" },
    env: { REGION: "test" },
  });
  assert.equal(Object.hasOwn(receivedOptions ?? {}, "reasoning"), false);
});

test("sends an off request through the registry with the original model and context", async () => {
  const signal = new AbortController().signal;
  const selectedModel = model({ reasoning: false });
  const selectedContext = context();
  let receivedModel: Model | undefined;
  let receivedContext: Context | undefined;
  let receivedOptions: RegistryStreamOptions | undefined;
  const registry = {
    streamSimple(effectiveModel: Model, requestContext: Context, options: RegistryStreamOptions) {
      receivedModel = effectiveModel;
      receivedContext = requestContext;
      receivedOptions = options;
      return { result: async () => result() };
    },
  } as unknown as ModelRegistry;

  assert.deepEqual(
    await completeModel(registry, selectedModel, selectedContext, {
      signal,
      cacheRetention: "none",
      sessionId: "session",
    }),
    result(),
  );
  assert.strictEqual(receivedModel, selectedModel);
  assert.strictEqual(receivedContext, selectedContext);
  assert.deepEqual(receivedOptions, { signal, cacheRetention: "none", sessionId: "session" });
});

test("sends the lowest supported reasoning level through the registry", async () => {
  const signal = new AbortController().signal;
  let receivedOptions: RegistryStreamOptions | undefined;
  const registry = {
    streamSimple(_effectiveModel: Model, _requestContext: Context, options: RegistryStreamOptions) {
      receivedOptions = options;
      return { result: async () => result() };
    },
  } as unknown as ModelRegistry;

  await completeModel(registry, model({ thinkingLevelMap: { off: null, minimal: null } }), context(), {
    signal,
    cacheRetention: "none",
    sessionId: "session",
  });

  assert.deepEqual(receivedOptions, { signal, cacheRetention: "none", sessionId: "session", reasoning: "low" });
});

test("copies without mutating the model when auth overrides its base URL", async () => {
  const selectedModel = model();
  let receivedModel: Model | undefined;
  const registry = {
    getProvider() {
      return {
        streamSimple(effectiveModel: Model) {
          receivedModel = effectiveModel;
          return { result: async () => result() };
        },
      };
    },
    async getApiKeyAndHeaders() {
      return { ok: true as const, baseUrl: "https://auth.example.test" };
    },
  } as unknown as ModelRegistry;

  await completeModel(registry, selectedModel, context(), {
    signal: new AbortController().signal,
    cacheRetention: "none",
    sessionId: "session",
  });

  assert.notStrictEqual(receivedModel, selectedModel);
  assert.equal(receivedModel?.baseUrl, "https://auth.example.test");
  assert.equal(selectedModel.baseUrl, "https://original.example.test");
});

test("adds the selected non-off reasoning level and returns the provider result", async () => {
  const selectedModel = model({ thinkingLevelMap: { off: null, minimal: null } });
  let receivedOptions: StreamOptions | undefined;
  const expected = result();
  const registry = {
    getProvider() {
      return {
        streamSimple(_effectiveModel: Model, _context: Context, options: StreamOptions) {
          receivedOptions = options;
          return { result: async () => expected };
        },
      };
    },
    async getApiKeyAndHeaders() {
      return { ok: true as const };
    },
  } as unknown as ModelRegistry;

  assert.strictEqual(
    await completeModel(registry, selectedModel, context(), {
      signal: new AbortController().signal,
      cacheRetention: "none",
      sessionId: "session",
    }),
    expected,
  );
  assert.equal(receivedOptions?.reasoning, "low");
});

test("fails before dispatch when model capabilities, provider, or auth are unavailable", async () => {
  let providerLookups = 0;
  let authLookups = 0;
  let dispatches = 0;
  const provider = {
    streamSimple() {
      dispatches += 1;
      return { result: async () => result() };
    },
  };
  const registry = {
    getProvider() {
      providerLookups += 1;
      return provider;
    },
    async getApiKeyAndHeaders() {
      authLookups += 1;
      return { ok: false as const, error: "No authentication" };
    },
  } as unknown as ModelRegistry;
  const options = { signal: new AbortController().signal, cacheRetention: "none" as const, sessionId: "session" };

  await assert.rejects(
    completeModel(registry, model({ thinkingLevelMap: unsupportedThinkingLevels }), context(), options),
    /thinking level/,
  );
  assert.equal(providerLookups, 0);
  assert.equal(authLookups, 0);

  const noProvider = { ...registry, getProvider: () => undefined } as unknown as ModelRegistry;
  await assert.rejects(completeModel(noProvider, model({ reasoning: false }), context(), options), /provider/);
  assert.equal(authLookups, 0);

  await assert.rejects(completeModel(registry, model({ reasoning: false }), context(), options), /No authentication/);
  assert.equal(dispatches, 0);
});
