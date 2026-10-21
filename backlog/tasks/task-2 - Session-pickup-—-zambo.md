---
id: TASK-2
title: Session pickup — zambo
status: To Do
assignee:
  - '@zambo'
created_date: '2026-08-13 23:04'
updated_date: '2026-10-21 16:32'
labels:
  - continuity
  - handoff
dependencies: []
priority: high
type: task
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
WHERE WE LEFT OFF
2026-10-21 18:45. Repository /Users/wtfzambo/mystuff/01_projects/speak-like-you-eat on branch feature/slye-tabs, three commits ahead of main at 4c117b7 "feat: turn the second SLYE tab into an ELI5 rewrite", local only with no upstream, working tree clean. npm run check passes 137 of 137 tests. TASK-21 (ELI5 and Light tabs on the Pi card) is In Progress with all nine criteria unchecked. The code, the tests, spec doc-1, README, decision-6 and runbooks doc-2 and doc-6 already describe ELI5 and Light, so what remains is the operator's manual checks and the choice of ELI5 prompt.

The ELI5 prompt is still being tuned. /private/tmp/slye-spike holds a throwaway prompt lab. lab2.ts registers a /lab command, drive-lab2.py drives it through a pty, targets2.json holds 16 real targets, and eli5-v5.txt to eli5-v9.txt are candidate prompts. Round 4 (lab2-r4.json, 18:28) compared candidate v9 against the Simple prompt on four targets (long-ai-answer, orca-token, pandino-status, aws-accounts) with ollama-cloud/deepseek-v4.1-flash and openai/gpt-6-luna. src/model-rewrite.ts still holds the earlier structured ELI5 prompt, and v9 (bottom line first, labeled sections, about half the length) exists only in /private/tmp/slye-spike/eli5-v9.txt.

Separately, /private/tmp/slye-probe is a git worktree of this repository on branch pandino-probe-task26 at 3a6fb69, holding an installation of the pandino branch task-26-skills-and-playbooks for the probe of Pandino TASK-26.6. It carries a stale copy of this file.

WHAT'S NEXT
1. Decide whether eli5-v9.txt replaces ELI5_SYSTEM_PROMPT. Read /private/tmp/slye-spike/lab2-r4.json and compare the v9 and simple outputs for each of the four targets.
2. If you adopt v9, put the prompt into src/model-rewrite.ts, update the prompt assertions in test/model-rewrite.test.ts, run npm run check, commit on feature/slye-tabs, and record the change in TASK-21.
3. Do the two manual checks TASK-21 still needs, light and dark readability (doc-2 TASK-21 step 4) and ELI5 quality on four or five real responses with the configured model (step 5).
4. Check the TASK-21 criteria against that evidence and close it. TASK-21 stays Pi only, and OMP keeps one call and no tabs.
5. Decide what to do with the two temporary trees. /private/tmp/slye-spike holds the prompt lab and its rounds, and /private/tmp/slye-probe is the Pandino probe worktree named in Pandino TASK-26.6.

WAITING ON / GATED BY
As of 2026-10-21, the operator's choice of ELI5 prompt and the two manual checks, which only the operator can run in a real Pi session. No credentials or external services are pending. Nothing on feature/slye-tabs has been pushed and no release is prepared.

VERIFY
git -C /Users/wtfzambo/mystuff/01_projects/speak-like-you-eat status -sb is clean on feature/slye-tabs at 4c117b7 with main not ahead. npm run check passes 137 tests. ls /private/tmp/slye-spike/eli5-v9.txt /private/tmp/slye-spike/lab2-r4.json finds both files. git worktree list shows /private/tmp/slye-probe on pandino-probe-task26 at 3a6fb69. backlog doctor reports no problems.
<!-- SECTION:DESCRIPTION:END -->
