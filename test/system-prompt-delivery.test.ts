import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { ModelRegistry, ModelRuntime } from "@earendil-works/pi-coding-agent";
import { completeModel } from "../src/model-completion.ts";
import { buildRewriteContext } from "../src/model-rewrite.ts";

const SYSTEM_PROMPT = "SLYE regression system prompt";

type ChatCompletionRequest = { messages: Array<{ role: string; content: string }> };

test("regression: system prompt reaches provider through the Pi ModelRegistry", async (t) => {
  let requestBody: ChatCompletionRequest | undefined;
  const server = createServer((request, response) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk: string) => {
      body += chunk;
    });
    request.on("end", () => {
      requestBody = JSON.parse(body) as ChatCompletionRequest;
      response.writeHead(200, { "content-type": "text/event-stream" });
      response.write(
        'data: {"id":"c","object":"chat.completion.chunk","created":0,"model":"fake-model","choices":[{"index":0,"delta":{"role":"assistant","content":"Plain."},"finish_reason":null}]}\n\n',
      );
      response.write(
        'data: {"id":"c","object":"chat.completion.chunk","created":0,"model":"fake-model","choices":[{"index":0,"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":1,"completion_tokens":1,"total_tokens":2}}\n\n',
      );
      response.end("data: [DONE]\n\n");
    });
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(
    () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error === undefined ? resolve() : reject(error)));
      }),
  );

  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("The fake provider server has no TCP address.");
  }

  const directory = await mkdtemp(join(tmpdir(), "slye-system-prompt-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const modelsPath = join(directory, "models.json");
  await writeFile(
    modelsPath,
    JSON.stringify({
      providers: {
        fake: {
          baseUrl: `http://127.0.0.1:${address.port}/v1`,
          api: "openai-completions",
          apiKey: "test-key",
          models: [{ id: "fake-model", reasoning: false }],
        },
      },
    }),
  );

  const runtime = await ModelRuntime.create({
    modelsPath,
    authPath: join(directory, "auth.json"),
    modelsStorePath: join(directory, "models-store.json"),
    refreshOnCreate: false,
  });
  const registry = new ModelRegistry(runtime);
  const model = registry.find("fake", "fake-model");
  assert.ok(model);

  const response = await completeModel(
    registry,
    model,
    buildRewriteContext({ target: "Make this plain.", context: [] }, SYSTEM_PROMPT),
    {
      signal: new AbortController().signal,
      cacheRetention: "none",
      sessionId: "system-prompt-regression",
    },
  );

  assert.ok(requestBody, "The fake provider received no request.");
  assert.deepEqual(requestBody.messages[0], { role: "system", content: SYSTEM_PROMPT });
  assert.equal(response.stopReason, "stop");
  assert.deepEqual(response.content, [{ type: "text", text: "Plain." }]);
});
