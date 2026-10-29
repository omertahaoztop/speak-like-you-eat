import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { buildRewriteContext } from "../src/model-rewrite.ts";
import { BENCHMARK_CORPUS, type BenchmarkFixture, verifyCorpusInvariants } from "./corpus.ts";
import type { HistoricalRewriteRequest } from "./historical-request.ts";
import {
  type ActualThinking,
  BENCHMARK_CANDIDATES,
  type BenchmarkCandidate,
  type ProviderThinking,
  type RequestedThinking,
  validateCandidateMatrix,
} from "./matrix.ts";
import { buildPhaseOneContext } from "./prompt-variants.ts";

export const OUTPUT_TOKEN_CEILING = 8_192;
export const DEADLINE_MS = 45_000;
const HAIKU_ANSWER_TOKENS = 1_024;
const HAIKU_THINKING_BUDGET = 7_168;
const MONEY_SCALE = 1_000_000_000_000n;
const ESTIMATED_INPUT_OVERHEAD_TOKENS = 16;
const CONSERVATIVE_INPUT_OVERHEAD_TOKENS = 256;

export type OpenRouterPrice = {
  prompt: string;
  completion: string;
  input_cache_read: string;
  input_cache_write?: string;
  input_cache_write_1h?: string;
};

type PriceSnapshot = {
  source: string;
  fetchedAt: string;
  currency: "USD";
  note: string;
  models: Record<string, OpenRouterPrice>;
};

export type CompletionReasoning = Exclude<ActualThinking, "off">;

export type CompletionPlan = {
  completionMethod: "completeSimple";
  cacheRetention: "none";
  reasoning: CompletionReasoning | null;
  requestMaxTokens: number;
  haikuHighThinkingBudget: number | null;
};

export type ManifestRow = CompletionPlan & {
  callId: string;
  fixture: string;
  canonicalModel: string;
  provider: string;
  model: string;
  requestedThinking: RequestedThinking;
  actualPiThinking: ActualThinking;
  expectedProviderThinking: ProviderThinking;
  payloadSha256: string;
  inputTokenEstimate: number;
  inputTokenUpperBound: number;
  outputTokenCeiling: number;
  deadlineMs: number;
  priceModel: string;
};

export type BenchmarkSuiteMetadata = {
  id: string;
  promptVariantId: string;
  systemPrompt: string;
  phaseOneBaselineFingerprint: string;
  fixtureIds: readonly string[];
  candidateIds: readonly string[];
};

export type BenchmarkManifest = {
  version: 1;
  callCount: number;
  outputTokenCeiling: number;
  deadlineMs: number;
  rows: readonly ManifestRow[];
  summaries: {
    byCanonicalModel: Record<string, number>;
    byRequestedThinking: Record<string, number>;
  };
  pricing: {
    source: string;
    fetchedAt: string;
    currency: "USD";
    note: string;
    estimatedInputMethod: string;
    conservativeInputMethod: string;
    prices: Record<string, OpenRouterPrice>;
    estimatedInputAtOutputCeilingCost: string;
    conservativeMaximumCost: string;
  };
  fingerprint: string;
  suite?: BenchmarkSuiteMetadata;
};

export type CallIdentity = Pick<
  ManifestRow,
  | "fixture"
  | "payloadSha256"
  | "provider"
  | "model"
  | "canonicalModel"
  | "requestedThinking"
  | "actualPiThinking"
  | "expectedProviderThinking"
  | "completionMethod"
  | "cacheRetention"
  | "reasoning"
  | "requestMaxTokens"
  | "haikuHighThinkingBudget"
  | "outputTokenCeiling"
  | "deadlineMs"
  | "priceModel"
>;

export type RewriteContextBuilder = (request: HistoricalRewriteRequest) => ReturnType<typeof buildRewriteContext>;

export type BuildManifestForOptions = {
  fixtures: readonly BenchmarkFixture[];
  candidates: readonly BenchmarkCandidate[];
  buildContext: RewriteContextBuilder;
  suiteMetadata?: BenchmarkSuiteMetadata;
};

export function completionPlanFor(candidate: BenchmarkCandidate): CompletionPlan {
  if (candidate.actualThinking === "off") {
    return {
      completionMethod: "completeSimple",
      cacheRetention: "none",
      reasoning: null,
      requestMaxTokens: OUTPUT_TOKEN_CEILING,
      haikuHighThinkingBudget: null,
    };
  }

  if (candidate.canonicalModel === "anthropic/claude-haiku-4-5" && candidate.actualThinking === "high") {
    return {
      completionMethod: "completeSimple",
      cacheRetention: "none",
      reasoning: "high",
      requestMaxTokens: HAIKU_ANSWER_TOKENS,
      haikuHighThinkingBudget: HAIKU_THINKING_BUDGET,
    };
  }

  return {
    completionMethod: "completeSimple",
    cacheRetention: "none",
    reasoning: candidate.actualThinking,
    requestMaxTokens: OUTPUT_TOKEN_CEILING,
    haikuHighThinkingBudget: null,
  };
}

export async function buildManifest(): Promise<BenchmarkManifest> {
  return buildManifestFor({
    fixtures: BENCHMARK_CORPUS,
    candidates: BENCHMARK_CANDIDATES,
    buildContext: buildPhaseOneContext,
  });
}

export async function buildManifestFor(options: BuildManifestForOptions): Promise<BenchmarkManifest> {
  verifyCorpusInvariants();
  validateCandidateMatrix();
  const prices = await loadPrices();
  const rows = buildRows(options.fixtures, options.candidates, options.buildContext);
  const summaries = buildSummaries(rows);
  const pricing = buildPricing(rows, prices);
  const withoutFingerprint = {
    version: 1 as const,
    callCount: rows.length,
    outputTokenCeiling: OUTPUT_TOKEN_CEILING,
    deadlineMs: DEADLINE_MS,
    rows,
    summaries,
    pricing,
    // Phase-one byte stability requires `suite` to be absent, not null or undefined.
    ...(options.suiteMetadata === undefined ? {} : { suite: options.suiteMetadata }),
  };

  return {
    ...withoutFingerprint,
    fingerprint: sha256(stableJson(withoutFingerprint)),
  };
}

export async function writeManifest(manifest: BenchmarkManifest, path: URL = manifestUrl()): Promise<void> {
  await writeFile(path, `${stablePrettyJson(manifest)}\n`, "utf8");
}

export function callIdFor(identity: CallIdentity): string {
  return sha256(stableJson(identity));
}

export function stableJson(value: unknown): string {
  if (value === undefined) {
    return "null";
  }
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
    .join(",")}}`;
}

export function stablePrettyJson(value: unknown): string {
  return JSON.stringify(JSON.parse(stableJson(value)), null, 2);
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function buildRows(
  fixtures: readonly BenchmarkFixture[],
  candidates: readonly BenchmarkCandidate[],
  buildContext: RewriteContextBuilder,
): ManifestRow[] {
  const rows: ManifestRow[] = [];
  for (const fixture of fixtures) {
    const payload = buildContext(fixture.request);
    const payloadText = stableJson(payload);
    const payloadSha256 = sha256(payloadText);
    const contextBytes = Buffer.byteLength(payloadText, "utf8");
    const inputTokenEstimate = Math.ceil(contextBytes / 4) + ESTIMATED_INPUT_OVERHEAD_TOKENS;
    const inputTokenUpperBound = contextBytes + CONSERVATIVE_INPUT_OVERHEAD_TOKENS;

    for (const candidate of candidates) {
      const completionPlan = completionPlanFor(candidate);
      const identity: CallIdentity = {
        fixture: fixture.id,
        payloadSha256,
        provider: candidate.provider,
        model: candidate.model,
        canonicalModel: candidate.canonicalModel,
        requestedThinking: candidate.requestedThinking,
        actualPiThinking: candidate.actualThinking,
        expectedProviderThinking: candidate.providerThinking,
        ...completionPlan,
        outputTokenCeiling: OUTPUT_TOKEN_CEILING,
        deadlineMs: DEADLINE_MS,
        priceModel: candidate.priceModel,
      };
      rows.push({
        callId: callIdFor(identity),
        inputTokenEstimate,
        inputTokenUpperBound,
        ...identity,
      });
    }
  }
  return rows;
}

function buildSummaries(rows: readonly ManifestRow[]): BenchmarkManifest["summaries"] {
  const byCanonicalModel: Record<string, number> = {};
  const byRequestedThinking: Record<string, number> = {};
  for (const row of rows) {
    byCanonicalModel[row.canonicalModel] = (byCanonicalModel[row.canonicalModel] ?? 0) + 1;
    byRequestedThinking[row.requestedThinking] = (byRequestedThinking[row.requestedThinking] ?? 0) + 1;
  }
  return { byCanonicalModel, byRequestedThinking };
}

function buildPricing(rows: readonly ManifestRow[], snapshot: PriceSnapshot): BenchmarkManifest["pricing"] {
  let estimatedInputAtOutputCeilingCost = 0n;
  let conservativeMaximumCost = 0n;
  const prices: Record<string, OpenRouterPrice> = {};

  for (const row of rows) {
    const price = snapshot.models[row.priceModel];
    if (price === undefined) {
      throw new Error(`No OpenRouter price for ${row.priceModel}.`);
    }
    prices[row.priceModel] = price;
    estimatedInputAtOutputCeilingCost += costAtPrice(row.inputTokenEstimate, OUTPUT_TOKEN_CEILING, price);
    conservativeMaximumCost += costAtPrice(row.inputTokenUpperBound, OUTPUT_TOKEN_CEILING, price);
  }

  return {
    source: snapshot.source,
    fetchedAt: snapshot.fetchedAt,
    currency: snapshot.currency,
    note: snapshot.note,
    estimatedInputMethod: "ceil(exact Context UTF-8 bytes / 4) + 16",
    conservativeInputMethod: "exact Context UTF-8 bytes + 256",
    prices,
    estimatedInputAtOutputCeilingCost: formatMoney(estimatedInputAtOutputCeilingCost),
    conservativeMaximumCost: formatMoney(conservativeMaximumCost),
  };
}

export function calculateOpenRouterCost(
  usage: { input: number; output: number; cacheRead?: number; cacheWrite?: number; cacheWrite1h?: number },
  price: OpenRouterPrice,
): string {
  const cacheWrite1h = usage.cacheWrite1h ?? 0;
  const normalCacheWrite = Math.max(0, (usage.cacheWrite ?? 0) - cacheWrite1h);
  const units =
    BigInt(usage.input) * decimalToUnits(price.prompt) +
    BigInt(usage.output) * decimalToUnits(price.completion) +
    BigInt(usage.cacheRead ?? 0) * decimalToUnits(price.input_cache_read) +
    BigInt(normalCacheWrite) * decimalToUnits(price.input_cache_write ?? "0") +
    BigInt(cacheWrite1h) * decimalToUnits(price.input_cache_write_1h ?? price.input_cache_write ?? "0");
  return formatMoney(units);
}

function costAtPrice(inputTokens: number, outputTokens: number, price: OpenRouterPrice): bigint {
  return BigInt(inputTokens) * decimalToUnits(price.prompt) + BigInt(outputTokens) * decimalToUnits(price.completion);
}

function decimalToUnits(value: string): bigint {
  const [whole = "", fraction = ""] = value.split(".");
  if (fraction.length > 12 || !/^\d+$/.test(whole) || !/^\d*$/.test(fraction)) {
    throw new Error(`Invalid decimal price: ${value}`);
  }
  return BigInt(whole) * MONEY_SCALE + BigInt((fraction + "0".repeat(12)).slice(0, 12));
}

function formatMoney(units: bigint): string {
  const whole = units / MONEY_SCALE;
  const fraction = (units % MONEY_SCALE).toString().padStart(12, "0").replace(/0+$/, "");
  return fraction === "" ? whole.toString() : `${whole}.${fraction}`;
}

async function loadPrices(): Promise<PriceSnapshot> {
  const file = new URL("./openrouter-prices.json", import.meta.url);
  return JSON.parse(await readFile(file, "utf8")) as PriceSnapshot;
}

function manifestUrl(): URL {
  return new URL("./manifest.json", import.meta.url);
}

export const MANIFEST_PATH = fileURLToPath(manifestUrl());
