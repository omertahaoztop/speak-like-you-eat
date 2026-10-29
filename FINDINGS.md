# Findings

## 2026-08-18 — Companion output styles did not justify their complexity

**Hypothesis.** Curated output styles inside the SLYE companion would add enough distinct user value to justify their config, commands, prompt branches, tests, benchmark, and maintenance complexity.

**Evidence.** An explicitly approved but never-merged local experiment ran 48 rows (four proposed styles × four fixtures × Terra off, DeepSeek off, GPT-OSS 120B low), manifest fingerprint `ea97236150fa1f4c9cb55133d9f065a2b1ec66a4c246a0a986c6d41818ca6125`. Blind score SHA-256 `730bc3aef51e398698b1ea80a4b0532cb32e905c52a2b37065b882b00b380142`. Raw checksum-manifest SHA-256 `933bb018ae785fc5b8ef91fee62ea796fda95fb8eed9ae1dd0fe71ad203bdce8`. The operator's qualitative review of Terra outputs found only `concise` produced clear added value; `structured` and `action-first` did not. The frozen blind gates also found DeepSeek action-first translated an Italian target, GPT-OSS plain corrupted a protected URL, and GPT-OSS structured averaged 1.25 Style adherence. Local ignored evidence remains under `benchmark/.work/styles/`, including `archive/style-manifest.json`; the feature branch was deleted without merge.

**Practical consequence.** Keep SLYE single-purpose as a plain-language companion. When users want output styles, compose a dedicated output-style extension on the original response before SLYE instead of adding a second style system inside SLYE. Do not retry companion styles without materially new evidence.

**Links.** [SLYE MVP specification](backlog/docs/specs/doc-1%20-%20SLYE-MVP-specification.md)

## 2026-10-20 — Provider-level `streamSimple` no longer receives the system prompt on Pi 0.86+

**Hypothesis.** Passing `{ systemPrompt, messages }` to `registry.getProvider(...).streamSimple` sends the system prompt to the model on every supported Pi host.

**Evidence.** Since pi-ai 0.86.0, provider `streamSimple` implementations expect a `TranscriptContext` produced by `normalizeContext()` and ignore `Context.systemPrompt`. With Pi 1.3.0, a local fake provider received only `["user"]` messages from SLYE's rewrite request. With real models and a pirate system prompt (`ollama-cloud/gpt-oss:120b` through `completeModel`, then `ollama-cloud/deepseek-v4.1-flash` with a pirate `slye-prompt.md` in a full Pi session), the `main` path returned an ordinary answer while the fixed build, which calls `ModelRegistry.streamSimple`, returned pirate speak. Tests had not caught it for two reasons: the lockfile resolved the host packages to Pi 0.84.1, and the payload tests used a mock provider that asserted on `systemPrompt` at the mock, so they would have passed against Pi 1.3.0 too. The benchmark ran on Pi 0.84.1, where providers still read `Context.systemPrompt` directly, so its results are unaffected; on Pi 0.86+, `ModelRuntime.completeSimple` normalizes the context.

**Practical consequence.** On Pi 0.86+, send secondary completions through `ctx.modelRegistry.streamSimple` (or another normalizing entry point), never a raw `Context` to a provider. Only a test through a real `ModelRegistry` catches this class of bug: keep the host packages pinned in `devDependencies` and the `test/system-prompt-delivery.test.ts` regression, which uses a real `ModelRegistry` against a local HTTP provider.

**Links.** TASK-19; [SLYE MVP specification](backlog/docs/specs/doc-1%20-%20SLYE-MVP-specification.md)

## 2026-10-22 — A pinned reviewer model was silently replaced by the session model

**Hypothesis.** Pinning a reviewer to a model guarantees that the selected reviewer session uses that model.

**Evidence.** The retired `ollama-cloud/deepseek-v4-flash:0731` pin was followed by `claude-opus-5-5` in prior TASK-21 taste, specification, and documentation logs. After the local reviewer pin was corrected to `ollama-cloud/deepseek-v4.1-flash`, the docs-review log `8ceadc3e-be5c-4b5` recorded that model. These are observed session outcomes, not proof of a universal Pi fallback algorithm.

**Practical consequence.** When availability changes, verify the actual logged provider and model, keep the `.pi/agents/` pins and local `.pandino` assignment aligned, and use `fallback-runner` visibly if the pin is unavailable.

**Links.** [TASK-21](backlog/tasks/task-21%20-%20Add-Rewrite-and-Simple-tabs-to-the-SLYE-companion-card-on-Pi.md)

## 2026-10-23 — Prior conversation context did not improve rewrites and made ELI5 import outside content

**Hypothesis.** Sending each rewrite the last two user-led turns of conversation, including intermediate assistant prose, gives the model topic understanding that produces a better rewrite than the target alone.

**Evidence.** A live ELI5 card came out more than twice as long as its target because the context held an earlier near-duplicate status message, which ELI5 merged in. A trial on 12 real final responses from local Pi sessions compared full context, user messages only, and no context across ELI5 and Light with Claude Haiku 5.5 and DeepSeek V4.1 Flash, two runs each (288 calls). Heavy copying of content from outside the target into ELI5 occurred only with full context (3 of 48 runs, including invented steps); Light never copied and kept the same length in every variant. No case showed context improving a rewrite. A prompt telling ELI5 to use only the target did not stop Haiku from copying (2 of 3 runs).

**Practical consequence.** Send only the target response. Do not reintroduce conversation context to improve rewrite quality without new evidence that it helps; prompt wording alone does not stop a model from using context it receives.

**Links.** TASK-23; [decision-8](backlog/decisions/decision-8%20-%20Send-only-the-target-response-to-the-rewrite-model.md); [SLYE MVP specification](backlog/docs/specs/doc-1%20-%20SLYE-MVP-specification.md)
