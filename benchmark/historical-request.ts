// Frozen request shape of the historical benchmarks, which sent prior conversation context.
// Production sends only the target; keep this file so the frozen payloads and manifests stay reproducible.
export const MAXIMUM_CONTEXT_CHARACTERS = 8_000;

type ContextMessage = {
  role: "user" | "assistant";
  text: string;
};

export type HistoricalRewriteRequest = {
  target: string;
  context: ContextMessage[];
};

export function serializeContext(context: readonly ContextMessage[]): string {
  return context.map((message) => `${message.role}:\n${message.text}`).join("\n\n");
}
