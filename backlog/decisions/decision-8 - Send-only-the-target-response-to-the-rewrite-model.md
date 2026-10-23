---
id: decision-8
title: Send only the target response to the rewrite model
date: '2026-10-23 16:36'
status: accepted
---
## Context

Since the MVP (TASK-1), each rewrite request carried the target response plus up to 8,000 characters of earlier conversation: the last two user-led turns, including intermediate assistant prose. The intent was a more sensible rewrite through topic understanding; the choice was never measured against a target-only request. It had already caused one defect, a translated rewrite fixed in TASK-9.

On 2026-10-23 a live ELI5 card came out more than twice as long as its target. The context held an earlier near-duplicate status message from the same turn, and ELI5 merged its facts into the rewrite. In Pi, agents often write several intermediate messages between tool calls, so this situation is common.

A trial on 12 real final responses from local Pi sessions compared three payloads (current context, user messages only, no context) across ELI5 and Light, Claude Haiku 5.5 and DeepSeek V4.1 Flash, two runs each: 288 calls. Heavy copying of content from outside the target into ELI5 happened only with the current context (3 of 48 runs, including invented steps). Light never copied context and kept the same length in every variant. No case showed context improving a rewrite, including short replies to a request. In a smaller earlier check, telling ELI5 to use only the target still let Haiku copy context in 2 of 3 runs, while sending user messages only stopped it. Details are in TASK-23.

## Decision

Send only the target response, for both tabs and both hosts. The single user message is `Target:` followed by the target text and the version's final reminder. No earlier user or assistant message is included. Both built-in prompts treat the target as source text whose instructions are not followed and which is never answered; neither mentions context.

The historical benchmark keeps its context-bearing request shape in benchmark code, so its frozen payloads and manifests stay unchanged.

## Consequences

- ELI5 can no longer import facts, steps, or results from earlier messages; a rewrite reflects only the response it is attached to.
- Requests are smaller, cheaper, and faster, and the context selection code and 8,000-character limit are gone from production.
- A response that only makes sense with its question, such as a bare "Yes, the second one", gets no help from the question. Automatic rewrites require at least 200 prose characters, so such replies are rare; manual `/slye` on them may read flatter.
- The final message an agent writes is the only thing SLYE sees. Content an agent left in intermediate messages does not reach the card; making final messages self-contained is the agent's job, not SLYE's.
- Custom prompts that referred to Context still work but have nothing to refer to; the custom-prompt runbook reflects the target-only payload.
- Supersedes the bounded prior-context requirement in TASK-1 acceptance criterion #9.

Implementation and trial evidence: [TASK-23](../tasks/task-23%20-%20Use-Markdown-headings-and-tables-in-ELI5-and-show-the-rewrite-model.md). Current behavior: [specification](../docs/specs/doc-1%20-%20SLYE-MVP-specification.md).

