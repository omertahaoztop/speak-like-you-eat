import { randomInt } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { BENCHMARK_CORPUS, type BenchmarkFixture } from "./corpus.ts";
import { serializeContext } from "./historical-request.ts";
import type { BenchmarkResult } from "./runner.ts";

export type LiteralOccurrenceShortfall = {
  literal: string;
  actual: number;
  required: number;
};

export type MechanicalChecks = {
  unchanged: boolean;
  lengthRatio: number;
  missingLiterals: string[];
  literalOccurrenceShortfalls: LiteralOccurrenceShortfall[];
  missingFencedBlocks: string[];
  missingMarkdownMarkers: string[];
  forbiddenText: string[];
  likelyPreamble: boolean;
  maximumLengthRatioSatisfied: boolean;
  expectedChangeSatisfied: boolean;
  timeoutOrError: boolean;
};

export type RandomIndex = (exclusiveUpperBound: number) => number;

export function evaluateMechanicalChecks(fixture: BenchmarkFixture, result: BenchmarkResult): MechanicalChecks {
  const output = result.textBlocks.join("\n\n");
  const sourceLength = Math.max(1, fixture.request.target.length);
  const unchanged = output === fixture.request.target;
  const missingLiterals = fixture.expectations.requiredLiterals.filter((literal) => !output.includes(literal));
  const literalOccurrenceShortfalls = (fixture.expectations.requiredLiteralOccurrences ?? []).flatMap(
    ({ literal, required }) => {
      const actual = countOccurrences(output, literal);
      return actual < required ? [{ literal, actual, required }] : [];
    },
  );
  const missingFencedBlocks = (fixture.expectations.exactFencedBlocks ?? []).filter((block) => !output.includes(block));
  const missingMarkdownMarkers = (fixture.expectations.requiredMarkdownMarkers ?? []).filter(
    (marker) => !output.includes(marker),
  );
  const lowercaseOutput = output.toLowerCase();
  const forbiddenText = fixture.expectations.forbiddenText.filter((text) =>
    lowercaseOutput.includes(text.toLowerCase()),
  );
  const likelyPreamble = /^(?:here(?:'s| is)(?: [^:\n]{0,80})?|sure(?: [^:\n]{0,80})?|rewritten text|rewrite):/i.test(
    output.trim(),
  );
  const expectedChangeSatisfied =
    result.outcome === "success" &&
    (fixture.expectations.expectedChange ? !unchanged : fixture.expectations.allowUnchanged || !unchanged);

  return {
    unchanged,
    lengthRatio: output.length / sourceLength,
    missingLiterals,
    literalOccurrenceShortfalls,
    missingFencedBlocks,
    missingMarkdownMarkers,
    forbiddenText,
    likelyPreamble,
    maximumLengthRatioSatisfied:
      fixture.expectations.maximumLengthRatio === undefined ||
      output.length / sourceLength <= fixture.expectations.maximumLengthRatio,
    expectedChangeSatisfied,
    timeoutOrError: result.outcome !== "success",
  };
}

export function assignCandidateLabels(
  candidates: readonly string[],
  existingMapping: Readonly<Record<string, string>>,
  randomIndex: RandomIndex,
): Record<string, string> {
  const mapping = { ...existingMapping };
  const missingCandidates = candidates.filter((candidate) => mapping[candidate] === undefined);
  shuffle(missingCandidates, randomIndex);
  let nextNumber = nextCandidateNumber(mapping);

  for (const candidate of missingCandidates) {
    mapping[candidate] = `Candidate ${String(nextNumber).padStart(2, "0")}`;
    nextNumber += 1;
  }

  return mapping;
}

export async function writeBlindReport(
  results: readonly BenchmarkResult[],
  workDirectory: string,
  randomIndex: RandomIndex = randomInt,
  corpus: readonly BenchmarkFixture[] = BENCHMARK_CORPUS,
): Promise<{ reportPath: string; mappingPath: string }> {
  await mkdir(workDirectory, { recursive: true });
  const candidates = [
    ...new Set(results.map((result) => `${result.canonicalModel}#${result.requestedThinking}`)),
  ].sort();
  const mappingPath = join(workDirectory, "blind-map.json");
  const mapping = assignCandidateLabels(candidates, await readMapping(mappingPath), randomIndex);
  const sections = corpus.flatMap((fixture) => {
    const fixtureResults = results.filter((result) => result.fixture === fixture.id);
    return fixtureResults.length === 0 ? [] : [formatFixture(fixture, fixtureResults, mapping)];
  });
  const report = [
    "# SLYE benchmark blind review",
    "",
    "These are mechanical checks, not proof of semantic quality. Review each output without trying to identify its model.",
    "",
    "## Human rubric",
    "",
    "Score simplification, cliché removal, semantic and factual fidelity, English fidelity, Markdown and code preservation, and absence of preambles. Note any changed names, numbers, paths, URLs, commands, facts, or structure.",
    "",
    ...sections,
  ].join("\n");
  const reportPath = join(workDirectory, "blind-review.md");
  await writeFile(reportPath, `${report}\n`, "utf8");
  await writeFile(mappingPath, `${JSON.stringify(mapping, null, 2)}\n`, "utf8");
  return { reportPath, mappingPath };
}

export async function readLocalResults(
  workDirectory: string,
  allowedCallIds: ReadonlySet<string>,
): Promise<BenchmarkResult[]> {
  const entries = await readdir(workDirectory).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return [] as string[];
    throw error;
  });
  const results: BenchmarkResult[] = [];
  for (const entry of entries.sort()) {
    if (!entry.endsWith(".json") || !allowedCallIds.has(entry.slice(0, -".json".length))) continue;
    results.push(JSON.parse(await readFile(join(workDirectory, entry), "utf8")) as BenchmarkResult);
  }
  return results;
}

function countOccurrences(text: string, literal: string): number {
  if (literal === "") {
    return 0;
  }

  let occurrences = 0;
  let start = 0;
  while (true) {
    const foundAt = text.indexOf(literal, start);
    if (foundAt === -1) {
      return occurrences;
    }
    occurrences += 1;
    start = foundAt + literal.length;
  }
}

function shuffle(values: string[], randomIndex: RandomIndex): void {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const selected = randomIndex(index + 1);
    const selectedValue = values[selected];
    const currentValue = values[index];
    if (!Number.isInteger(selected) || selectedValue === undefined || currentValue === undefined) {
      throw new Error("Random candidate index is outside the shuffle range.");
    }

    [values[index], values[selected]] = [selectedValue, currentValue];
  }
}

async function readMapping(path: string): Promise<Record<string, string>> {
  try {
    const mapping = JSON.parse(await readFile(path, "utf8")) as unknown;
    if (typeof mapping !== "object" || mapping === null || Array.isArray(mapping)) {
      throw new Error("Blind candidate mapping must be an object.");
    }
    return Object.fromEntries(
      Object.entries(mapping).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }
    throw error;
  }
}

function nextCandidateNumber(mapping: Readonly<Record<string, string>>): number {
  let largestNumber = 0;
  for (const label of Object.values(mapping)) {
    const match = /^Candidate (\d+)$/.exec(label);
    if (match?.[1] !== undefined) {
      largestNumber = Math.max(largestNumber, Number(match[1]));
    }
  }
  return largestNumber + 1;
}

function formatFixture(
  fixture: BenchmarkFixture,
  results: readonly BenchmarkResult[],
  mapping: Readonly<Record<string, string>>,
): string {
  const candidates = results
    .map((result) => ({
      result,
      label: mapping[`${result.canonicalModel}#${result.requestedThinking}`] ?? "Candidate ??",
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
  return [
    `## ${fixture.source}`,
    "",
    "### Selected context",
    "",
    fencedText(serializeContext(fixture.request.context)),
    "",
    "### Source target",
    "",
    fencedText(fixture.request.target),
    "",
    ...candidates.map(({ result, label }) => formatCandidate(fixture, result, label)),
  ].join("\n");
}

function formatCandidate(fixture: BenchmarkFixture, result: BenchmarkResult, label: string): string {
  const checks = evaluateMechanicalChecks(fixture, result);
  return [
    `### ${label}`,
    "",
    "#### Final output",
    "",
    fencedText(result.textBlocks.join("\n\n") || "(no final text)"),
    "",
    "#### Metrics",
    "",
    `- elapsed milliseconds: ${result.elapsedMs}`,
    `- input tokens: ${result.usage?.input ?? "unavailable"}`,
    `- output tokens: ${result.usage?.output ?? "unavailable"}`,
    `- cache-read tokens: ${result.usage?.cacheRead ?? "unavailable"}`,
    `- cache-write tokens: ${result.usage?.cacheWrite ?? "unavailable"}`,
    `- cache-write-1h tokens: ${result.usage?.cacheWrite1h ?? "unavailable"}`,
    `- reasoning tokens: ${result.usage?.reasoning ?? "unavailable"}`,
    `- total tokens: ${result.usage?.total ?? "unavailable"}`,
    `- OpenRouter-equivalent cost: ${result.openRouterEquivalentCost ?? "unavailable"}`,
    "",
    "#### Mechanical checks",
    "",
    `- unchanged: ${checks.unchanged}`,
    `- length ratio: ${checks.lengthRatio.toFixed(3)}`,
    `- missing literals: ${checks.missingLiterals.join(", ") || "none"}`,
    `- literal occurrence shortfalls (actual/required): ${formatOccurrenceShortfalls(checks.literalOccurrenceShortfalls)}`,
    `- missing fenced blocks: ${checks.missingFencedBlocks.length}`,
    `- missing Markdown markers: ${checks.missingMarkdownMarkers.join(", ") || "none"}`,
    `- forbidden text: ${checks.forbiddenText.join(", ") || "none"}`,
    `- likely preamble: ${checks.likelyPreamble}`,
    `- maximum length ratio check: ${checks.maximumLengthRatioSatisfied}`,
    `- expected-change check: ${checks.expectedChangeSatisfied}`,
    `- timeout or error: ${checks.timeoutOrError}`,
    "",
  ].join("\n");
}

function formatOccurrenceShortfalls(shortfalls: readonly LiteralOccurrenceShortfall[]): string {
  if (shortfalls.length === 0) {
    return "none";
  }
  return shortfalls.map(({ literal, actual, required }) => `${literal}: ${actual}/${required}`).join(", ");
}

function fencedText(text: string): string {
  const longestBacktickRun = Math.max(0, ...[...text.matchAll(/`+/g)].map((match) => match[0].length));
  const fence = "`".repeat(Math.max(4, longestBacktickRun + 1));
  return `${fence}text\n${text}\n${fence}`;
}
