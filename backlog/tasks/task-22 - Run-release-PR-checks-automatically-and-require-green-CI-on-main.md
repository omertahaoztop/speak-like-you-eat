---
id: TASK-22
title: Run release PR checks automatically and require green CI on main
status: In Progress
assignee:
  - '@zambo'
created_date: '2026-10-22 15:46'
updated_date: '2026-10-22 16:49'
labels:
  - ci
  - release
dependencies: []
references:
  - >-
    https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow
documentation:
  - doc-5
priority: high
type: chore
ordinal: 22000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
At task start, Release Please created pull requests with GITHUB_TOKEN, so GitHub held their pull_request workflows for manual approval, and main had neither branch protection nor rulesets. The operator approved a repository-scoped GitHub App for Release Please and main protection with mandatory up-to-date CI, no bypass (including administrators), no external reviewer requirement and no automatic merge/publication. Preserve protections for external contributions and npm OIDC publishing. App registration, credentials, main protection and hosted smoke verification are complete; production workflow activation remains pending configuration PR merge.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Release Please uses a short-lived token from a GitHub App installed only for speak-like-you-eat, with only necessary repository permissions; private key stays in GitHub secrets and never in Git or logs
- [x] #2 An App-authored test or release PR starts the existing CI automatically without clicking Approve workflows to run, verified by a hosted run
- [x] #3 An active main ruleset requires a pull request, the GitHub Actions check job, and a branch up to date with main, with no bypass actors and zero required external review approvals
- [x] #4 Pending or failed required checks block merge while successful current-head CI allows it, without performing an unapproved merge or publication
- [x] #5 Release runbook and reproducible workflow/ruleset configuration describe setup, permissions, verification and recovery; no unrelated product/prompt/configuration changes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Work on chore/release-ci-protection from current origin/main (1.5.0), preserve the finished tabs feature. Inspect current GitHub Actions check identity and ruleset API; register one private GitHub App on the owner account with webhooks disabled and contents/issues/pull_requests write only, install it only for this repository, store client ID as RELEASE_APP_CLIENT_ID and its private key as RELEASE_APP_PRIVATE_KEY. Browser login/confirmation is human-gated; do not read daily Chrome cookies or automate 2FA.
2. Use actions/create-github-app-token@v3 in release.yml to mint a current-repository token with explicit needed permissions; give it only to Release Please. Retain GITHUB_TOKEN for the existing exact-tag publish dispatch bridge and retain npm OIDC. Reduce now-unneeded native GITHUB_TOKEN permissions.
3. Version a small declarative main ruleset JSON with PR required, zero review approvals, required GitHub Actions check (verified integration ID), strict up-to-date policy and no bypass actors; apply and inspect it through gh API. Do not enable auto-merge, weaken external-PR settings, or introduce scheduled automation.
4. Update authoritative release runbook doc-5 through Backlog CLI with App setup, secret rotation and ruleset verification; record choice rationale. Delegate workflow/config implementation to implementer; pair taste/spec before commit, docs then final-reviewer once before merge.
5. Run no-call project gates and workflow/schema checks; validate the main rule via API and a pending-to-green PR, and verify an App-authored disposable test PR triggers CI without human approval. Close/delete only explicitly created smoke resources afterward. Do not merge or publish automatically; final integration/activation needs approval if its merge would be required.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-10-22 hosted verification: registered private GitHub App slye-release-wtfzambo (App5428791), installed174183288 with selected repository speak-like-you-eat only, contents/issues/pull_requests write plus mandatory metadata read. RELEASE_APP_CLIENT_ID variable and RELEASE_APP_PRIVATE_KEY secret uploaded. App JWT and installation token tested without printing credentials; GET installation/repositories returned exactly this repo. Every temporary token revoked; downloaded PEM moved into restricted temporary storage for testing then deleted with smoke script. No credentials entered Git or task notes.
Main ruleset25653617 active: exact refs/heads/main, required PR, reviewcount0, GitHubActions check integration15368, strict up-to-date true, bypass_actors[]; live API reports current_user_can_bypass=never and effective branch rules confirm both requirements. allow_auto_merge remainsfalse; no external-contributor approval settings changed.
Disposable App-authored non-draft PR15: https://github.com/wtfzambo/speak-like-you-eat/pull/15. Pull-request run39810370129 started automatically (no approval); pending check and intentional one-test failure both produced mergeStateStatus BLOCKED. Expectedfailure:139pass/1fail in140tests. Same App removed only the disposable failing test, emitting synchronize automatically; run39810646229 on heada7378e6826daa22e1286ff04282d0ca5a9b09d13 succeeded, PR mergeStateStatus CLEAN and mergeable MERGEABLE. PR15 closed unmerged and its temporary branch deleted, with404 confirming deletion. No release or publication occurred during this verification.
Independent local verification: npm run check139/139; both benchmark dry-runs; frozen manifest no-diff; npm pack dry-run16files; git diff --check clean. Paired taste/spec reviews323c2b0a andf2891eac found no must-fix. Doc minors clarified GitHubActions integrationID/provenance, native PR-checkbox nonreliance, actual ruleID and safe recovery without disabling protection. Retain native repository checkbox setting: it does not grant missing workflow token write permissions, and changing unrelated settings was not requested.
Production activation is still pending a reviewed configuration PR merge: main release.yml currently uses the old GITHUB_TOKEN until this branch lands. Do not mark AC1 production-complete or TASK22 Done before activation verification. Main protection and App registration are already live independently of that merge.

Docs reviewer9837a849 found two must-fixes: add a formal decision for App-vs-token and strict no-bypass policy; warn that ruleset PUT replaces whole configuration and can discard UI-only protections. PUT warning and operational minors are addressed through backlog doc update. Allow-state evidence is executable without a merge: gh pr view reports BLOCKED then CLEAN/MERGEABLE, already observed on smokePR15. Added concrete Update branch recovery for unchanged ReleasePlease PRs and variable/secret inventory commands. Decision content is gated on an explicit operator exception: installed backlog1.53.0 decision create supports title/status only and has no decision update/content command; requested permission to fill only the new decision7 body directly, preserving CLI-created metadata. No workaround or unapproved direct edit performed. Production activation still awaits reviewed configuration PR merge; source branch not yet committed/pushed.

2026-10-22: operator explicitly authorized filling only the new decision-7 content directly because the CLI lacks content/update support. Created decision metadata through backlog decision create, then filled its context/decision/consequences without altering CLI metadata. Records reuse eligibility (owner-controlled App/key/permissions), dedicated App isolation, private-key vs short-lived-token lifecycle, secret exposure boundaries, no-bypass outage trade-off, branch-update friction, and activation only after configuration PR merge. Runbook links the decision through backlog doc update. No new credentials or repository settings changed during this explanation/documentation slice.

Decision-7 content and links verified: CLI-created metadata preserved and linked task/runbook paths resolve. User explanation screenshots captured from actual current GitHub App installation, repository Actions secret listing (name only, no secret value), and client-ID variable listing. Saved outside Git under /Users/wtfzambo/.pi/browser-artifacts/slye-release-app/. Started the one whole-branch final review as agent14912f7f-c1ed-499 after docs must-fixes; result is pending, not inferred. No commit, push, configuration PR, merge or production authentication activation yet.

Final review14912f7f-c1ed-499 completed on actual openai/gpt-6.1-sol: verdict merge, no must-fix or minor findings. This means ready for user-controlled configuration PR/manual merge, not authorization to merge or publish. Reviewer independently passed139tests, Biome and TypeScript. Orchestrator re-read workflow/runbook/ruleset/decision, confirmed live rule25653617 still active/current_user_can_bypass never and repository variable/secret names present, then reran npm run check139/139, both benchmark dry-runs, frozen manifest diff,16-file npm pack dry-run, YAML/JSON parsing and whitespace checks successfully. Runbook setup/recovery and full-replacement warning, decision rationale and live ruleset declaration satisfy AC5; no product/prompt changes. After discussing PAT vs App for this solo project, operator chose to retain the already working, verified App without broadening its repository access. Operator authorized committing all changes and updating pickup; production activation remains pending separate manual merge and post-merge ReleasePlease authentication verification.

Handoff 2026-10-22: committed implementation, declarative ruleset, decision7, runbook and task in102f7e95d8eba989717fbaa55a24440554522810; pushed origin/chore/release-ci-protection. Configuration PR16: https://github.com/wtfzambo/speak-like-you-eat/pull/16. Hosted PR check passed in run39817053611 on that exact head; GitHub reported CLEAN/MERGEABLE. Final housekeeping commit changes only task notes and pickup, with its current-head CI to be verified before reporting done. Existing paired/docs/final reviews remain applicable; no repeated review needed for the trivial handoff metadata. All implementation is ready. AC1 intentionally remains unchecked and task stays In Progress until user manually merges PR16 and the ensuing main ReleasePlease run proves App-token authentication. No merge, workflow dispatch, release or publication was performed. Local secret-material scan of staged additions clean; no personal configuration touched.
<!-- SECTION:NOTES:END -->
