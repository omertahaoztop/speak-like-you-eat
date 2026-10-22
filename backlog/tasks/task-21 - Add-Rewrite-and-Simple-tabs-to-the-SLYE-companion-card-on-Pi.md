---
id: TASK-21
title: Add ELI5 and Light tabs to the SLYE companion card on Pi
status: In Progress
assignee:
  - '@zambo'
created_date: '2026-10-20 15:56'
updated_date: '2026-10-22 14:51'
labels:
  - feature
dependencies:
  - TASK-19
ordinal: 21000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Users find the current rewrite often too literal: when the source is not heavy jargon it comes back nearly identical. The user asked for a second, full rewrite based on the unslop skill (https://github.com/cursor/plugins/blob/main/pstack/skills/unslop/SKILL.md, MIT, Lauren Tan) and for the card to switch between the two versions with clickable tabs. Decisions agreed with the user on 2026-10-20:
- Pi only. OMP keeps todays single Simple rewrite with no tabs.
- Two parallel calls per rewrite on the same model: Simple (current prompt, or slye-prompt.md when present) and Rewrite (new built-in unslop-based prompt). Cost is doubled, also for automatic rewrites.
- If either call fails or is cancelled, no card is appended; the usual warning applies and manual /slye can retry.
- The tabs sit on the heading line: "🤌 Speak like you eat   [ Rewrite ]  Simple". Rewrite is active by default.
- Clicking a label selects it (Pi fullscreen only). ctrl+\ switches tab everywhere (alt+s does not work in iTerm2 with Option as Normal). One active tab shared by all cards, not persisted.
- The card background is the themes customMessageBg with its saturation halved at render time, so light and dark themes both work. The Pi 1.0 default violet was judged too saturated.
- Cards created before this change render as today, without tabs.
- The unslop prompt keeps the existing guarantees (editor role, language preserved, no added facts, Markdown and code unchanged, output only). It adopts the compatible unslop rules, always removes em dashes, and excludes rule 5 (vague attributions) and the structure-changing rules 16 and 17. The MIT attribution goes in a source comment, never in model output.
- Validation: manual sandbox check on 4-5 real responses, including ones where Simple comes back nearly identical. The benchmark only if that leaves doubts.
Spike evidence (2026-10-20): a Pi 1.3.0 entry renderer wrapped in MouseRegion receives clicks in fullscreen; registerShortcut + ctx.ui.setStatus re-renders the card in fullscreen and regular mode.

Superseded on 2026-10-21: the second version is now ELI5 (an ADHD-friendly reorganized rewrite, see the 2026-10-21 implementation note and decision-6), the tabs are ELI5 and Light with ELI5 active by default, and ELI5 deliberately relaxes language-mix and Markdown-structure preservation. Where the text above says Rewrite/Simple or unslop-only, the acceptance criteria and decision-6 govern.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 On Pi, an eligible rewrite makes two parallel calls (Light with the selected prompt, ELI5 with the built-in ELI5 prompt) and appends one card holding both texts
- [ ] #2 The card shows ELI5 and Light tabs on its heading line; ELI5 is active by default and the active tab is highlighted
- [ ] #3 Clicking a tab label in fullscreen selects it; ctrl+\ toggles the tab in fullscreen and regular mode; the choice applies to all cards and is not persisted
- [ ] #4 If either call fails or is cancelled, no card is appended and a manual retry remains possible
- [ ] #5 A custom slye-prompt.md replaces only the Light prompt
- [ ] #6 Cards created before this change render without tabs; OMP behavior is unchanged
- [ ] #7 The card background is the theme customMessageBg with halved saturation, readable in light and dark themes
- [ ] #8 ELI5 output leads with the main point, numbers steps, moves side topics last, and replaces jargon (including English business terms in non-English text) with plain words, without dropping facts, on real responses with the configured model
- [ ] #9 Spec, README, runbooks doc-2 and doc-6 and decision-6 describe the behavior; tests cover the criteria above; npm run check passes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Current plan, 2026-10-22 (replaces superseded unslop-only / older-Pi plans; history remains in implementation notes and Git):

1. Pi: two parallel completeRewrite calls on one configured model, Light with the selected built-in or custom prompt, ELI5 with ELI5_SYSTEM_PROMPT and its structure reminder. Append one immutable {display, rewrite, targetEntryId} only if both succeed; cancellation takes precedence over failure; manual retry stays possible. OMP passes tabs:false and retains one Light call and its original rendering.
2. src/tabs.ts: ELI5/Light heading, ELI5 initially active, fullscreen label clicks and ctrl+\ in both modes, one unpersisted active tab shared by all cards; legacy cards untabbed. Theme customMessageBg at half saturation on Pi only. Namespace access to Pi-only helpers keeps OMP loadable. Current Pi only; no old-Pi capability detection.
3. Built-in ELI5 prompt: same author voice and main language, fixed bottom-line/done/steps/facts/decisions/other order, plain language with normal technical vocabulary, positive instructions and native-language headings. Aim for half length by pruning redundant evidence and secondary detail. Preserve specified actionable content and fenced examples; allow one-line commands inline and evidentiary output/logs omitted. Leave Light prompt unchanged.
4. Evidence and user docs: README model ranking across both tabs (Haiku, Luna, DeepSeek, Gemma); current spec doc-1; runbooks doc-2/doc-5/doc-6; decision-6 rationale. Manual trials are observations, not semantic guarantees; retain their limitations. Keep local .pandino reviewer assignment aligned with corrected .pi agent pins; whole Pandino upgrade deferred.
5. Complete docs-review corrections without prompt changes, then taste/spec together on correction diff. Resolve or explicitly discuss each must-fix before commit. Operator authorized a one-sentence direct correction to decision-6 on 2026-10-22 because CLI has no decision update command; correction applied.
6. Independently verify npm run check, npm run check:omp-load with OMP installed, npm pack --dry-run --json (16 files), and integrated path. After per-commit passes, final-reviewer once against main merge base. No push, PR, merge or release without separate authorization.
7. Remaining acceptance: operator light/dark readability and final live-quality acceptance; TASK-21 remains In Progress until evidence supports acceptance.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation and three review rounds complete (2026-10-20). Verified: npm run check 137/137; check:omp-load passes on OMP 18.12.2 and fails when a static MouseRegion import is reintroduced; check:old-pi passes on Pi 0.87.1 (no shortcut, untabbed card, one call); real Pi 1.3.0 session with a fake provider: tabbed heading, Rewrite default, click switches text and highlight in fullscreen, ctrl+\ toggles in regular mode. Persisted field named `rewrite` (not shipped before). Pending operator checks: light/dark readability (doc-2 TASK-21 step 4), real-model Rewrite quality on 4-5 responses (step 5), then final review.

Operator decision 2026-10-20: support only the current Pi release. Removed hostSupportsTabs and check:old-pi; tabs are on unless the caller passes tabs:false (OMP). The namespace import of pi-tui stays because OMP lacks MouseRegion/OKHSL helpers and a named import would stop OMP from loading SLYE (check:omp-load still passes).

Live use 2026-10-21: the unslop-based Rewrite prompt kept Italian corporate jargon (worse than Simple). User redefined the goal as an ADHD-friendly, reorganized rewrite (i-have-adhd, MIT, Ayoub Ghriss). New ELI5 prompt trialled on 6 targets (3 real corporate cards, a technical Italian text, an English slop paragraph, a verbose AI answer) with deepseek-v4.1-flash, claude-opus-5-5, gpt-6-luna: jargon translated, main point first, steps numbered, code/paths intact; gpt-6-luna dropped one fact on the long answer; deepseek reorders less. Tabs renamed ELI5/Light (user choice); stored fields unchanged (display = Light, rewrite = ELI5).

Prompt trials 2026-10-21 (round 2): the first ELI5 prompt still mirrored the target layout in live use. Iterated drafts on six real long answers from local sessions (with the user question as context) across deepseek-v4.1-flash, claude-opus-5-5, gpt-6-luna, gpt-oss:120b, then claude-haiku-5-5, glm-5.3-flash, minimax-m3.1-flash, gpt-oss:20b. Final prompt: write a new text from scratch in a fixed order (bottom line, done, steps, key facts, open decisions, side notes), labels in the target language, suggestions never become steps, completed actions never dropped, about half the length. Results: haiku-5-5 best, gpt-6-luna good, deepseek fastest but shortens less; gpt-oss:20b translated to English and invented steps; glm-5.3-flash leaks reasoning into output; minimax-m3.1-flash often over 2 minutes. README recommended models updated accordingly. Operator decision: one model for both tabs; per-tab models deferred.

Live feedback 2026-10-22: ELI5 summarised but kept workplace jargon and acronyms (KPI, stakeholder, RACI, discovery, steering committee), put proposed steps under decisions, and used an English label in Italian text. Prompt now: words a smart 12-year-old knows, every jargon term and acronym replaced even if common at work, only must-type/recognise items kept; proposed steps stay steps; fixed bilingual labels; context instructions about format ignored. Fast models (deepseek) mirrored one-paragraph targets in 3 of 4 runs when the context asked for one paragraph; an ELI5-specific final reminder fixed it (4/4 structured). Trials: deepseek-v4.1-flash, claude-haiku-5-5, gpt-6-luna on 8 targets incl. the live corporate-jargon wall: all structured, jargon-word scan near zero.

Live feedback 2026-10-22 (2): ELI5 must not be dumbed down (keep field vocabulary such as class, function, KPI when plain), must drop corporate jargon, must sound like someone knowledgeable talking at the bar, and must speak in the original speaker voice (no "il testo propone"). Prompt now leads with a bar-voice instruction, first-person voice rule, technical-vocabulary exception, and an exact-meaning rule (offline is not online). Trials on corporate wall (with and without context) and an Italian code-review answer: haiku-5-5 drops nearly all corporate jargon and keeps technical terms in 3/3 runs; deepseek-v4.1-flash keeps technical terms but sometimes copies corporate jargon (1 of 3 runs heavily). Operator accepts haiku.

Prompt cleanup 2026-10-22 (operator feedback): ELI5 prompt rewritten as positive instructions only (no never/do-not rules), no per-language label lists (English default headings the model writes in the target language), and a general "reader knows the subject, no frills, friend at the bar" voice instead of word lists. Tested on 6 targets x 3 runs (Italian corporate wall with/without context, Italian code review, Spanish corporate text, AWS diagnosis, English verbose answer) with haiku-5-5 and deepseek-v4.1-flash: haiku 17-18/18 structured, 0 jargon-heavy, 0 English headings in non-English text; deepseek 13/13 structured with the ELI5 reminder vs 11/13 without (corporate wall 1/3 vs 0/3), 1 jargon-heavy run. Short canonical headings ("Done", "Good to know") were copied verbatim into non-English output; descriptive headings ("What is already done", "Useful facts") were translated reliably. ELI5 reminder kept. deepseek returned provider errors on 5 of 18 concurrent requests in these batches (single requests succeeded).

Code blocks 2026-10-22: ELI5 sometimes dropped fenced code. Trials on 10 answers with code (8 real, 2 synthetic): illustrative examples were the ones dropped; one-line commands moved inline (fine); patches/config kept. Added one positive rule: keep every fenced block as a block, including illustrative examples, next to its sentence; one-line commands may go inline; terminal output/logs used only as evidence may be cut. Blocks kept as blocks: haiku 33/63 -> 47/63 (content anywhere 52 -> 59); luna 26 -> 25/63; deepseek ~unchanged; gemma4:31b 5 -> 8/42. Operator ranking for README: haiku, luna, deepseek, gemma4.

Light trials 2026-10-22: 8 answers x 2 runs with haiku-5-5, gpt-6-luna, deepseek-v4.1-flash, gemma4:31b. No added headings were observed. Inline-code scan: Haiku, Luna and DeepSeek 164/164; Gemma 162/164. Fenced blocks matching after whitespace normalization: haiku 12/12, deepseek 12/12, luna 10/12, gemma 10/12 (dropped the illustrative snippet, stripped code comments). Corporate jargon left (of 96 source terms across Italian and Spanish walls): luna 6, gemma 10, haiku 23, deepseek 47. Average length: haiku 99%, deepseek 97%, luna 93%, gemma 84% (gemma sometimes shifts meaning). README ranking kept: haiku, luna, deepseek, gemma, with per-tab notes.

Process note 2026-10-22: the docs, taste, and spec reviewer agents were pinned to unavailable ollama-cloud/deepseek-v4-flash:0731 (the installed pi-ollama-cloud CHANGELOG retirement entry is dated 2026-09-25). Examined session logs showed claude-opus-5-5 for those reviewer runs (examples: a20d9e8b-f966-4e6 and 05dcbce4-20e8-47c), gpt-5.6-terra for implementer runs (e.g. 2d512c54-e425-484), and claude-opus-5 for the earlier final review (5e58150a-7eee-4ef). These are observations from examined logs, not proof about all review sessions or a universal fallback algorithm. Fixed by pointing the three agents at deepseek-v4.1-flash. The corrected docs reviewer ran on deepseek-v4.1-flash (log 8ceadc3e-be5c-4b5); it completed with findings now being resolved. Branch final review is still pending.

Docs review follow-up 2026-10-22: corrected corpus size (10 targets: 8 real, 2 synthetic) and inline-code scan (Gemma 162/164, not all retained). Fenced-code matching normalized whitespace; it is not a byte-for-byte preservation metric. The corpus contains 21 fenced blocks: Haiku and Luna ran three repetitions (63 block opportunities per prompt), Gemma two (42); DeepSeek also ran two successful sequential repetitions after provider failures in the first concurrent batch. Model rankings are provisional manual observations. Findings being addressed without changing production prompts; historical task/decision filenames intentionally remain stable. decision-6 overstates fact preservation but CLI decision create/list provides no update command; edit remains gated on a supported interface or operator exception.

Docs-correction per-commit reviews completed on DeepSeek V4.1 Flash: taste e8833ca8-7397-450 and spec 6da9c72f-ca11-422. Addressed readability must-fixes by listing CI commands and removing trial metrics from current spec (metrics stay here). Clarified retired benchmark table, OMP gate rationale, reminders, and denominator repetitions. Spec reviewer labelled provider-call counts possible extra scope; rejected that finding because correction mandate item 3 explicitly required counts for step 5. Counts describe existing two-call behavior, not a new budget or product rule. decision-6 phrase remains awaiting operator exception; no commit or final review yet.

Operator authorized the one-sentence direct decision-6 correction on 2026-10-22; applied without changing metadata, filenames, prompts, code or tests. Docs-review must-fixes resolved, taste/spec readability must-fixes resolved, targeted wording nits addressed. Independent checks after corrections: npm run check 138/138, installed OMP load check passes, npm pack dry-run 16 files, git diff --check clean. Committing this correction slice before the once-per-branch final review; TASK-21 remains In Progress and no push/PR/release is authorized.
<!-- SECTION:NOTES:END -->
