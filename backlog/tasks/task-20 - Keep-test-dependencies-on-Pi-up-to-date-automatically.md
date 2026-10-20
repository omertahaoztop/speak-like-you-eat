---
id: TASK-20
title: Keep test dependencies on Pi up to date automatically
status: To Do
assignee: []
created_date: '2026-10-20 14:55'
labels:
  - chore
dependencies: []
ordinal: 20000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The Pi packages SLYE is tested against are pinned to an exact version in devDependencies. The system-prompt bug (TASK-19) stayed hidden for weeks because the lockfile kept tests on Pi 0.84.1 while users ran 0.86+. Without an update mechanism the new pin (1.3.0) will go stale the same way. Raised by the final review of fix/slye-system-prompt.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A Renovate/Dependabot config or a scheduled CI job proposes or tests updates of @earendil-works/pi-ai, pi-coding-agent and pi-tui
- [ ] #2 A failing check against a newer Pi version is visible without anyone bumping the pin by hand
<!-- AC:END -->
