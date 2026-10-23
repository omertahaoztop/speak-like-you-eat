---
id: TASK-23
title: Use Markdown headings and tables in ELI5 and show the rewrite model
status: In Progress
assignee:
  - '@zambo'
created_date: '2026-10-23 08:56'
updated_date: '2026-10-23 09:26'
labels:
  - eli5
  - ui
  - omp
dependencies: []
references:
  - >-
    backlog/decisions/decision-6 -
    Show-Rewrite-and-Simple-tabs-on-Pi-with-two-parallel-completions.md
documentation:
  - doc-1
priority: high
type: feature
ordinal: 23000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Live use on 2026-10-22: ELI5 bold section titles blend into the text, and ELI5 turned a comparison table into bullets, which reads much worse. The operator also wants to see which model produced a companion card, discreetly. One configured model keeps serving both tabs (operator decision, unchanged). Operator choices: level-2 Markdown headings for ELI5 parts (Pi shows ## headings coloured without the hash marks); model name small, muted and right-aligned on the card heading line, also on OMP. The label must reflect the model that produced the card, so it is stored with the card at rewrite time; existing cards have no stored model and show none.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The built-in ELI5 prompt asks for each part after the bottom line to start with a level-2 Markdown heading (`## `) written in the target language, instead of a bold heading
- [x] #2 The built-in ELI5 prompt keeps every Markdown table as a table with its rows and columns, allowing only plainer cell wording; the Light prompt is unchanged
- [x] #3 Small live trials with Haiku 5.5 and DeepSeek V4.1 Flash on targets containing tables show ELI5 keeps tables as tables and uses ## headings; results are recorded as observations, not guarantees
- [ ] #4 New Pi and OMP companion cards store the producing model display name and render it muted and right-aligned on the heading line; on narrow widths it is omitted rather than wrapping the heading, and tab clicks keep working
- [ ] #5 Cards created before this change, and cards without a stored model, render exactly as before
- [x] #6 Specification, README and tests cover the new prompt rules and model label; formatter, linter, type checker and tests pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Prompt (src/model-rewrite.ts, ELI5 only): the structure rule asks for each part after the bottom line to start with a level-2 Markdown heading (`## `) written in the target language, replacing the bold-heading wording. Add one positive Content rule: keep every Markdown table as a Markdown table with the same rows and columns, placed where it fits in the new structure; cell wording may become plainer. Light prompt untouched.
2. Persistence (src/index.ts): RewriteEntryData gains optional `model` (display name: trimmed model.name, else model.id) written on both the Pi tabbed and the single-Light (OMP) append; parseRewriteEntryData accepts only a nonblank string; old entries parse unchanged.
3. Rendering (src/tabs.ts): one small heading-line component used by both buildLegacyCard and buildTabbedCard; when a model name is given and heading + gap + label fit the inner width, pad and append theme.fg("muted", name) right-aligned; otherwise render the heading exactly as today. Tab hit-testing unchanged (label after the tabs). OMP host-defect plain fallback stays as is.
4. Tests: prompt assertions; appended entries carry model on Pi and OMP; label rendered muted and right-aligned at wide width, omitted at narrow width, absent for entries without model; tab clicks still map correctly with a label.
5. Docs via Backlog CLI: doc-1 spec (heading/table rules, model label and stored field), README card description. Then live trials Haiku 5.5 and DeepSeek V4.1 Flash on targets with tables, recorded in task notes. Paired taste/spec review before commit; docs + final review before merge.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation (implementer 4966a0ca-ecb4-480, two rounds): ELI5 structure now asks for level-2 Markdown headings; new Content bullet keeps Markdown tables as tables with the same rows and columns; Light prompt untouched. New Pi tabbed and single (OMP) cards persist `model` = trimmed model name, else id; parse accepts only nonblank strings. Heading line component in src/tabs.ts renders a muted right-aligned label only when it fits with a 2-space gap, else delegates to the previous Text heading so cards without a label are byte-identical (orchestrator review caught and fixed an unwrapped-heading overflow at narrow widths and a dropped legacy bold). Also fixed a pre-existing test isolation bug: onboarding "/slye model writes the selected trusted project configuration" read the developer's real global slye.json (PI_CODING_AGENT_DIR now isolated like its neighbours). npm run check 140/140.
Live trials 2026-10-23 (lab harness /tmp/slye-spike/lab4.ts, production prompts imported from src): 3 table targets (Italian model comparison with jargon, English release status, Spanish cost table) x haiku-5-5 and deepseek-v4.1-flash x ELI5/Light x 2 runs = 24 calls, all stop. ELI5 tables kept: haiku 6/6, deepseek 5/6 (one run turned the table into bullets; another kept the table but also duplicated it as bullets with jargon left in cells). ELI5 ## headings 12/12, bold headings 0. Light kept tables 12/12. Observations from a small manual trial, not guarantees.

Paired review: taste 5e665e8a-7beb-4c0 (no must-fix) and spec 6f0b61ac-eb87-407 (two must-fixes). Fixed: OMP label rendering now tested (OMP test theme gained fg; model-bearing OMP card shows label right-aligned at 120, omitted narrow; host-defect fallback also shows it); doc-1 line saying OMP renders as before now notes the label. Applied minors: field renamed modelName (display label, not a model reference); one shared getModelDisplayName in model-picker.ts used by picker and cards (untrimmed name, else id); legacy card added to narrow-width overflow test; MIN_LABEL_GAP boundary test. Orchestrator removed the duplicated OMP fallback label logic by exporting buildLabelledHeadingLine from tabs.ts (no OMP-missing TUI imports; npm run check:omp-load passes against installed OMP). Kept the onboarding PI_CODING_AGENT_DIR isolation fix on this branch (spec reviewer flagged it as unrelated scope; it fixes a local-only failing test and is test-only). npm run check 140/140.
<!-- SECTION:NOTES:END -->
