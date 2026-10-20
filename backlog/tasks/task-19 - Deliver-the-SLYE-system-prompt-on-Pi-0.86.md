---
id: TASK-19
title: Deliver the SLYE system prompt on Pi 0.86+
status: Done
assignee:
  - '@zambo'
created_date: '2026-10-20 13:07'
updated_date: '2026-10-20 13:26'
labels:
  - bug
dependencies: []
priority: high
ordinal: 19000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Since pi-ai 0.86.0 (Pi 0.86, 2026-09-19), provider streamSimple implementations expect a normalized TranscriptContext and silently ignore Context.systemPrompt. SLYE calls registry.getProvider(...).streamSimple with a raw Context, so on Pi 0.86+ the rewrite model receives only the user message: the built-in rules and any slye-prompt.md are dropped, which explains near-literal rewrites. Reproduced 2026-10-20 with Pi 1.3.0: a fake provider received roles ["user"] only, and a real gpt-oss:120b call with a pirate system prompt ignored it through SLYE but obeyed it through ctx.modelRegistry.streamSimple. Tests missed it because the lockfile resolved the host peers to Pi 0.84.1. The benchmark used runtime.completeSimple, which normalizes, so its results stay valid. OMP uses its own provider path that still reads systemPrompt and is out of scope beyond keeping it unchanged.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 On Pi 0.86+ the selected system prompt (built-in or slye-prompt.md) reaches the provider request as a system message
- [x] #2 A regression test sends a SLYE completion through a real Pi ModelRegistry to a local HTTP provider and fails if the system prompt is missing from the request
- [x] #3 Hosts whose registry has no streamSimple (Pi 0.85 and earlier, the OMP adapter) keep the existing provider path and its tests pass
- [x] #4 Development dependencies pin the Pi host packages to 1.3.0 so tests and type checks run against the current host API
- [x] #5 The specification describes the completion path accurately and FINDINGS.md records the falsified assumption
- [x] #6 npm run check passes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. devDependencies: pin @earendil-works/pi-ai, pi-coding-agent, pi-tui to 1.3.0 (peerDependencies stay "*"); refresh package-lock.json.
2. src/model-completion.ts: type the context parameter as pi-ai Context. Compute request options once (reasoning only when level is not off). If the registry exposes streamSimple (Pi 0.86+), call registry.streamSimple(model, context, requestOptions).result(): it normalizes systemPrompt into the transcript and applies request auth. Otherwise keep the existing getProvider + getApiKeyAndHeaders path unchanged (Pi 0.85-, OMP adapter), with one comment on the raw-Context cast at that library edge.
3. Fix test typings broken by the 1.3.0 types without weakening assertions.
4. Unit test: registry with streamSimple receives the context unchanged plus signal/cacheRetention/sessionId/reasoning and getProvider is not called.
5. Regression test: real ModelRuntime + ModelRegistry from a temp models.json pointing at a local HTTP server (openai-completions, SSE reply); completeModel must send a system message containing the prompt.
6. Docs: spec doc-1 completion-path sentence; FINDINGS.md entry. CHANGELOG is release-please generated (fix: commit).
7. npm run check; reviewers; manual pirate check on real Pi.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verification 2026-10-20: real Pi 1.3.0 session with ollama-cloud/deepseek-v4.1-flash and a pirate slye-prompt.md: main produced a normal answer, this branch produced "Arrr..." pirate rewrite. Regression test test/system-prompt-delivery.test.ts fails on main src/model-completion.ts (actual role user) and passes with the fix. npm run check: 130 tests pass, biome and tsc clean. taste-reviewer and spec-reviewer: no must-fix; minor readability findings applied (named ProviderContext cast, plain if for reasoning, split registry tests, explicit regression prompt, once("listening"), spec "why" clause moved to FINDINGS). Not done: end-to-end OMP host run (OMP keeps the unchanged provider path); Pi virtual-model routing via registry.streamSimple is an untested edge case.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
On Pi 0.86+ SLYE now sends rewrites through ModelRegistry.streamSimple, so the built-in or custom system prompt reaches the model again; older Pi and OMP keep the provider path. Pi host devDependencies pinned to 1.3.0. Added a real-ModelRegistry/local-HTTP regression test that fails without the fix, a registry-path unit test, a spec update and a FINDINGS entry. Verified with npm run check and a real-model pirate-prompt comparison of main vs branch.
<!-- SECTION:FINAL_SUMMARY:END -->
