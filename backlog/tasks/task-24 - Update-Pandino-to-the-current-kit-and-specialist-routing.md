---
id: TASK-24
title: Update Pandino to the current kit and specialist routing
status: Done
assignee:
  - '@zambo'
created_date: '2026-10-29 20:33'
updated_date: '2026-10-29 20:45'
labels: []
dependencies: []
references:
  - 'https://github.com/wtfzambo/pandino'
type: chore
ordinal: 24000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The 2026-10-29 session audit found that SLYE still uses the August Pandino layout and Terra implementation pin, although upstream now selects Sol 6.1. The operator requested an in-place Pandino update from the coordinating session. Preserve SLYE product behavior, project-specific Backlog rules and explicit Sol final-review choice. Do not commit, push, publish, call models or launch specialist agents without separate authorization.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The pi-only installation records the current official Pandino revision, includes its update checker, playbooks and three session/update skills, and has no unresolved merge staging
- [x] #2 Seven Pi helpers are available; six specialists have available explicit pins, fallback-runner is unpinned, implementation uses Sol 6.1 medium and the saved Sol final-review choice is preserved
- [x] #3 SLYE-specific rules and personal configuration are preserved, obsolete generic snippets are replaced by current playbooks, and product source, dependencies and public behavior are unchanged
- [x] #4 The complete diff is inspected, structural installation checks and npm run check pass, and the result is left uncommitted and unpushed
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Use the clean f6b82de baseline and pi-only selection. Read current upstream installer and rules plus installed definitions and operator pickup.
2. Run the official current installer with --no-input; replace superseded Terra with Sol 6.1 while retaining saved DeepSeek reviewer and Sol final pins.
3. Merge every staged agent and generic AGENTS core, preserving the SLYE Backlog decision-body exception and Backlog-generated instructions. Remove only superseded Pandino sections and staging.
4. Inspect all changes and verify canonical helpers, model availability, skills, provenance, preserved configuration and unchanged product files. Run npm run check without inference.
5. Record verification and replace the operator pickup once. Leave the update uncommitted and unpushed on chore/update-pandino.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Updated from the clean f6b82de baseline on chore/update-pandino with the official installer and --no-input (Pi only). Installed revision 04ccfd3e4874439ccfbd56cd0c6647f84904d8c1. The executable update checker confirms that upstream main matches this revision. Resolved all seven staged candidates and removed .pandino/merge. Replaced obsolete generic snippets with eight canonical playbooks and three canonical skills.

Routing: implementer openai/gpt-6.1-sol / medium; taste, spec and docs ollama-cloud/deepseek-v4.1-flash / high; new test reviewer openai/gpt-6.1-sol / high; final reviewer retains the operator-selected openai/gpt-6.1-sol with the current canonical medium effort. Fallback runner remains unpinned. Verified seven definitions against canonical upstream bodies and all six explicit pins against the local Pi model catalogue; no inference calls or agent launches were used. Live provider access was not exercised.

Preserved the SLYE Backlog decision-body exception and Backlog-generated instructions verbatim. Hash checks confirm that repository .pi/slye.json, user ~/.pi/agent/slye.json and repository .pi/settings.json are unchanged, including prior absence where applicable. Product source, tests, benchmark, package files, release configuration and public documentation are unchanged. Only Pi was installed.

Verification: complete tracked diff inspected, new kit content compared with canonical upstream, installation/provenance/routing/configuration assertions passed, .pandino/check-update passed, git diff --check passed, npm run check passed (Biome, TypeScript and 136/136 tests). Initial check found only the upstream installer JSON indentation in .pandino/models.json; normalized that local file to the project formatter and reran the complete check successfully. Upstream indentation generation remains outside this SLYE update.

Performed the update and self-review directly under the update skill; no implementer or specialist reviewer was launched because that requires an explicit request. No product design or shipping-code changes required a sketch or new regression tests. Left all changes uncommitted and unpushed on chore/update-pandino; no release or publication. Installer downloads, backups and verification logs remain outside the repository at /tmp/slye-pandino-update.V5WlEA and are not durable project artifacts.

2026-10-29: the operator subsequently authorized committing and pushing the verified update. Publish only chore/update-pandino to origin; no PR, merge or package release is authorized by this request.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Updated the Pi-only Pandino kit to 04ccfd3, merged the current core and seven helpers, migrated the obsolete Terra implementer to Sol 6.1, added the test reviewer and preserved the explicit Sol final-review pin and SLYE rules. Verified upstream provenance, canonical content, six model pins against the catalogue, configuration preservation and unchanged product files; npm run check passes all 136 tests with lint/format/typecheck clean. Changes remain uncommitted and unpushed on chore/update-pandino.

The operator subsequently authorized commit and push of this verified update on chore/update-pandino.
<!-- SECTION:FINAL_SUMMARY:END -->
