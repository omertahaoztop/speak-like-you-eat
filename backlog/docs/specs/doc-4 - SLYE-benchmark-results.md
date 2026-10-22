---
id: doc-4
title: SLYE benchmark results
type: specification
created_date: '2026-08-14 17:23'
updated_date: '2026-10-22 14:22'
---
# SLYE benchmark results

## Status, date, and scope

Completed 2026-08-14. This report covers 117 approved calls: phase one made 108 calls across six fixed public English fixtures and 18 model/thinking configurations; phase two made nine calls across three discriminating fixtures and Terra off, GPT-OSS 120B low, and DeepSeek V4 Flash off. Calls were sequential, had a 45-second local deadline and an 8,192 total-output ceiling, used the exact isolated SLYE payload, and used no judge model.

The six-fixture corpus covers backup cliché, inflated prose, an already-clear control, technical literals, Markdown with fenced code, and bounded recent-context/prompt-injection resistance.

Scope caveat (2026-08-17): phase two used the exact production prompt at benchmark time. The post-1.0 target-language preservation hardening changes only language/context instructions and has not been separately benchmarked. Historical results and fingerprints remain evidence for the frozen prompts, not the current exact prompt.

## Human review method

Human review used blind Q/F/S scoring locked before identity reveal. Q is rewrite quality, F is semantic and factual fidelity, and S is preservation and safety; each is a human rating from 0 to 2, and Q accepts half-points. The phase-one score SHA-256 is `bbe90c535ac1a0d0e243dc3f4f0cae6bf97955eb0302e1cebf88d8a9b732979e`; the phase-two score SHA-256 is `87381478f7a4fefb409b75bf720b599dda31328dcdf43a8e79c9f8a58e85e585`.

All averages are only over this small fixed corpus. They describe this evidence, not a general model ranking.

## Reproducibility and run totals

Phase one used manifest fingerprint `80d7d401fe9862d3d558efc4ba8b674014dd3e7e975f02d77cc3b37c30fbd759`; phase two used `59fc67e920727f25b40b1fd874cda6b51aff9f98426ae09af27275a4fda96728`. Frozen prompt snapshots preserve both tested prompts. All 108 phase-one calls and all nine phase-two calls had normal stop; there were no errors or timeouts.

| Phase | Input tokens | Output tokens | Reasoning tokens | Total (input + output) | Summed latency | Median per call | Maximum latency | OpenRouter-equivalent cost |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| One | 54,871 | 41,325 | 3,196 | 96,196 | 547,647ms | 3,800.5ms | 34,797ms | USD 0.06482709 |
| Two | 2,784 | 702 | 0 | 3,486 | 24,112ms | 1,701ms | 8,766ms | USD 0.00238211 |

Reasoning tokens are a subset of output tokens and the total, not an additional token category.

## Phase-one aggregate

The table preserves the reviewed aggregate order: fidelity and safety come first, then Q, then mean latency. Q alone does not define the recommendation. Scores have three decimals; latency is in seconds. The cost is the exact decimal sum of six stored per-row usage costs, is an OpenRouter-equivalent estimate, and is not actual provider billing.

| Model | Thinking | Mean Q | Mean F | Mean S | Mean latency | Median latency | Maximum latency | Six-call cost |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Terra (openai-codex/gpt-5.6-terra) | high | 1.833 | 2.000 | 2.000 | 3.700s | 3.924s | 4.173s | $0.00466400 |
| Terra (openai-codex/gpt-5.6-terra) | off | 1.833 | 2.000 | 2.000 | 4.064s | 4.033s | 4.754s | $0.00450800 |
| GPT-OSS 120B (ollama-cloud/gpt-oss:120b) | high | 1.833 | 2.000 | 2.000 | 11.352s | 10.923s | 18.464s | $0.00127093 |
| GPT-OSS 120B (ollama-cloud/gpt-oss:120b) | low | 1.750 | 2.000 | 2.000 | 1.562s | 1.379s | 2.296s | $0.00017647 |
| DeepSeek V4 Flash (ollama-cloud/deepseek-v4-flash:0731) | off | 1.667 | 2.000 | 2.000 | 1.321s | 1.232s | 1.745s | $0.00034174 |
| Luna (openai-codex/gpt-5.6-luna) | off | 1.667 | 2.000 | 2.000 | 3.905s | 3.924s | 5.278s | $0.00051500 |
| DeepSeek V4 Flash (ollama-cloud/deepseek-v4-flash:0731) | max | 1.667 | 2.000 | 2.000 | 4.914s | 3.765s | 10.055s | $0.00161266 |
| DeepSeek V4 Flash (ollama-cloud/deepseek-v4-flash:0731) | high | 1.667 | 2.000 | 2.000 | 5.719s | 5.140s | 10.786s | $0.00100786 |
| Luna (openai-codex/gpt-5.6-luna) | high | 1.667 | 2.000 | 2.000 | 6.048s | 5.469s | 8.275s | $0.00083000 |
| Haiku (anthropic/claude-haiku-4-5) | high | 1.583 | 2.000 | 2.000 | 1.641s | 1.695s | 2.068s | $0.01733500 |
| GPT-OSS 20B (ollama-cloud/gpt-oss:20b) | high | 1.583 | 2.000 | 2.000 | 17.246s | 14.771s | 34.797s | $0.00121384 |
| Gemma 4 31B (ollama-cloud/gemma4:31b) | max | 1.500 | 2.000 | 2.000 | 5.286s | 5.761s | 8.302s | $0.00151488 |
| Luna (openai-codex/gpt-5.6-luna) | max | 1.500 | 2.000 | 2.000 | 8.236s | 8.124s | 11.070s | $0.00146300 |
| GPT-OSS 20B (ollama-cloud/gpt-oss:20b) | low | 1.417 | 2.000 | 2.000 | 1.667s | 1.666s | 1.779s | $0.00013887 |
| Gemma 4 31B (ollama-cloud/gemma4:31b) | high | 1.417 | 2.000 | 2.000 | 5.159s | 4.184s | 10.797s | $0.00153630 |
| Terra (openai-codex/gpt-5.6-terra) | max | 1.417 | 2.000 | 2.000 | 6.635s | 6.265s | 12.174s | $0.00924800 |
| Haiku (anthropic/claude-haiku-4-5) | off | 1.833 | 1.833 | 2.000 | 1.693s | 1.696s | 2.112s | $0.01713500 |
| Gemma 4 31B (ollama-cloud/gemma4:31b) | off | 1.750 | 1.833 | 2.000 | 1.129s | 0.970s | 1.757s | $0.00031554 |

## Phase-two matched comparison

Original scores are the phase-one baseline for the three matched fixtures; promoted scores use the phase-two prompt. Each cost below is the exact decimal sum of the three promoted row costs.

| Model/config | Original Q | Promoted Q | Delta Q | Promoted F/S | Promoted mean latency | Promoted three-call cost |
| --- | ---: | ---: | ---: | --- | ---: | ---: |
| Terra (openai-codex/gpt-5.6-terra), off | 1.667 | 2.000 | +0.333 | 2 / 2 | 2.973s | $0.00212100 |
| GPT-OSS 120B (ollama-cloud/gpt-oss:120b), low | 1.667 | 1.500 | -0.167 | 2 / 2 | 4.033s | $0.00007589 |
| DeepSeek V4 Flash (ollama-cloud/deepseek-v4-flash:0731), off | 1.333 | 1.500 | +0.167 | 2 / 2 | 1.031s | $0.00018522 |

GPT-OSS 120B low's 4.033-second promoted mean was distorted by one 8.766-second row; its other two rows were 1.701 seconds and 1.631 seconds.

## Findings and recommendations

- Terra off is the quality-first choice and the only phase-two candidate to fully fix the backup cliché.
- DeepSeek V4 Flash off is the low-latency choice, at about one-third of Terra's mean latency across both phases.
- GPT-OSS 120B low is cost-oriented: its phase-two estimate is 59% cheaper than DeepSeek's. It is prompt-sensitive, tied DeepSeek on promoted Q, and regressed on inflated prose.
- GPT-OSS 20B was tested across all six fixtures at low and high thinking: low scored Q 1.417 at 1.667 seconds mean latency; high scored Q 1.583 at 17.246 seconds mean latency and 34.797 seconds maximum latency. It is not recommended. This is distinct from the GPT-OSS 120B low regression on phase two.
- Higher thinking was not reliably beneficial. Every safety score was 2. The only phase-one fidelity regressions were Haiku off and Gemma off on inflated prose.

## Price interpretation and limitations

Prices are public OpenRouter snapshot comparative estimates only. Aggregate and candidate costs are sums of per-row usage priced with the frozen manifest snapshot. Actual Pi provider subscription, quota, and billing may differ. The evidence is directional, not universal: it comes from a small English-only corpus, one completion per fixture and configuration, human preference ratings, changing provider/model versions and latency, and a phase-two subset of only three fixtures and three configurations.

## Final recommendation

These recommendations record the benchmark at its 2026-08-14 run date, not the current model ranking. `ollama-cloud/deepseek-v4-flash:0731` has since been retired; see the [current model guidance](doc-1%20-%20SLYE-MVP-specification.md#benchmark-guidance).

| Priority | Model/config | Trade-off |
| --- | --- | --- |
| Quality first | Terra (openai-codex/gpt-5.6-terra), off | Strongest matched quality and only full backup-cliché fix; slower than DeepSeek. |
| Low latency | DeepSeek V4 Flash (ollama-cloud/deepseek-v4-flash:0731), off | About one-third of Terra's mean latency across both phases; lower promoted Q than Terra. |
| Cost-oriented | GPT-OSS 120B (ollama-cloud/gpt-oss:120b), low | Lowest promoted three-call estimate; tied DeepSeek on promoted Q but prompt-sensitive. |

The table's thinking labels record explicit tested configurations, not user-selectable SLYE controls; the runtime level is derived from current model metadata.
