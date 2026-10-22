---
id: decision-7
title: Use a repository-scoped GitHub App and require green CI on main
date: '2026-10-22 16:12'
status: accepted
---
## Context

Release Please previously authenticated with `GITHUB_TOKEN`. GitHub places pull-request workflows created by that token's PR events into an approval-required state, so release PR checks needed a human click. Separately, `main` had no enforced merge checks. The operator wants checks to start automatically while keeping merges manual and blocking them until CI passes on an up-to-date branch.

An existing owner-controlled GitHub App could supply an installation token if its private key and appropriate repository permissions were available. The owner's GitHub Apps registration page showed no registered Apps before this setup. Installing a third-party App does not give the repository owner that App's private key or make its identity reusable by this workflow. A personal access token could also trigger CI, but would tie release automation to a person's credentials and token lifecycle.

## Decision

Use a dedicated private GitHub App, `slye-release-wtfzambo`, owned by `wtfzambo` and installed only on `speak-like-you-eat`. Disable webhooks, do not request user OAuth authorization during installation, and leave device flow disabled. Grant repository Contents, Issues, and Pull requests write permissions, plus GitHub's mandatory Metadata read permission; no repository administration, Actions, Workflows, or account permissions.

Store the non-secret client ID in the repository Actions variable `RELEASE_APP_CLIENT_ID` and the PEM private key in the repository Actions secret `RELEASE_APP_PRIVATE_KEY`. The release workflow uses `actions/create-github-app-token` to mint an installation token scoped to the current repository, passes that token only to Release Please, and revokes it at job completion. Installation tokens expire after at most one hour. Do not fall back to `GITHUB_TOKEN` for Release Please when App authentication fails.

Retain `GITHUB_TOKEN` with Contents write permission for the existing exact-tag repository-dispatch publishing bridge. Keep npm trusted publishing through OIDC unchanged; neither an npm token nor a personal GitHub token is introduced.

Enforce a `main` ruleset requiring a pull request, the existing `check` status from the GitHub Actions integration, and a branch up to date with `main`. Require no second-person review and grant no bypass, including to the owner or release App. Do not enable auto-merge or change external-contributor workflow approval settings. The declaration lives in `.github/main-ruleset.json`; it must also be applied to the live repository setting.

## Consequences

- App-authored release PRs can start the existing CI without the manual workflow-approval step. This does not approve or merge those PRs and does not bypass required CI.
- A separate App keeps this automation's repository access and revocation independent of other integrations. Reusing an appropriate owner-controlled App remains technically possible; it is not required for this repository and would couple its permissions and key rotation to other users of that App.
- The private key is a long-lived credential that can mint short-lived tokens. It still needs protection and rotation; short token lifetime does not make a leaked private key harmless. Deleting the local PEM copy does not revoke the registered key. GitHub does not reveal an uploaded repository secret's value; replace it rather than trying to retrieve it.
- Repository secrets are available to eligible trusted workflows, not a per-file vault restricted exclusively to `release.yml`. Protect write access and workflow changes. Normal fork pull-request checks do not receive these secrets, and `pr.yml` does not reference the App key.
- No bypass means a required-check outage prevents merges until checks recover. This is intentional. Strict up-to-date checks can also require a manual **Update branch** on a release PR after unrelated main commits.
- Renaming a required check requires a reviewed ruleset update. Ruleset PUT replaces the supplied configuration, so reconcile live UI changes before applying the file; do not silently discard protections or disable checks to land a PR.
- App registration and repository protection can be configured before the workflow change lands. Production Release Please uses the App only after the configuration PR merges; registration alone does not activate that workflow change.

Implementation and verification: [TASK-22](../tasks/task-22%20-%20Run-release-PR-checks-automatically-and-require-green-CI-on-main.md). Setup, recovery, and operator commands: [release procedure](../docs/runbooks/doc-5%20-%20SLYE-release-procedure.md). GitHub's event/token behavior: [Triggering a workflow](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).
