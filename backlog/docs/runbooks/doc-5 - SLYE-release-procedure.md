---
id: doc-5
title: SLYE release procedure
type: guide
created_date: '2026-08-15 17:48'
updated_date: '2026-10-22 16:14'
---
# SLYE release procedure

## Release policy

Release Please reads Conventional Commits on `main`. Use `fix:` for a patch release and `feat:` for a minor release normally. With `bump-minor-pre-major: true`, a breaking change before 1.0 bumps the minor version rather than jumping to 1.0.0. Use `feat!:` or a `BREAKING CHANGE:` footer only for a breaking change. This project makes stable releases only: no prerelease versions and no alternate npm channel.

A releasable commit causes Release Please to open or update a release PR. Merge that PR to create the stable `vX.Y.Z` tag and GitHub Release. Only a created release sends the repository dispatch event, which starts `publish.yml` at that exact tag and publishes it to npm as `latest`. Creating or updating a release PR does not publish anything.

## One-time GitHub App setup

Authentication and merge-policy rationale: [decision-7](../../decisions/decision-7%20-%20Use-a-repository-scoped-GitHub-App-and-require-green-CI-on-main.md).

Release Please uses the private [slye-release-wtfzambo App](https://github.com/settings/apps/slye-release-wtfzambo), [installed](https://github.com/settings/installations/174183288) only on `wtfzambo/speak-like-you-eat`. Keep repository workflow defaults read-only and leave external-contributor approval settings unchanged. The previously enabled **Allow GitHub Actions to create and approve pull requests** setting may stay as-is; this workflow no longer relies on it, because its native token has no Issues or Pull requests write permission.

1. Register a private App under the repository owner's account, with webhooks disabled. Grant repository **Contents**, **Issues**, and **Pull requests** read/write permissions only; GitHub supplies the mandatory metadata read permission. No account permissions are needed.
2. Install it on **Only select repositories**, selecting `speak-like-you-eat` only.
3. Save its client ID as the repository Actions variable `RELEASE_APP_CLIENT_ID` and a generated PEM private key as the repository Actions secret `RELEASE_APP_PRIVATE_KEY`:

```sh
gh variable set RELEASE_APP_CLIENT_ID --repo wtfzambo/speak-like-you-eat --body "$APP_CLIENT_ID"
gh secret set RELEASE_APP_PRIVATE_KEY --repo wtfzambo/speak-like-you-eat < /path/to/private-key.pem
```

Keep private keys out of Git, task notes, screenshots, shell arguments, and logs. Upload the file through standard input, then remove the temporary local copy. To rotate the key, generate a replacement in the App settings, replace the repository secret, verify authentication, then revoke the old key.

`release.yml` creates a short-lived current-repository installation token with `actions/create-github-app-token` and passes it only to Release Please. The action revokes its token at job completion. Missing App configuration is an error; there is no silent fallback to `GITHUB_TOKEN`. The existing exact-tag publication dispatch still uses `GITHUB_TOKEN`, and npm publication still uses OIDC, not an npm token.

## Require green CI before merging

The repository ruleset declared in `.github/main-ruleset.json` targets `refs/heads/main`. It requires a PR and the `check` status from the GitHub Actions integration (`15368`, not the release App ID), with the branch up to date with `main`. There are no bypass actors, including administrators and the release App, and no mandatory second-person review. Merge remains manual; neither this ruleset nor App setup enables auto-merge.

The active repository rule is [25653617](https://github.com/wtfzambo/speak-like-you-eat/rules/25653617). Inspect or update that existing rule through the GitHub API, rather than creating duplicates. Before any PUT, compare the file with the live ruleset and reconcile its name, branch scope, every rule, and all bypass actors, including changes made in the UI: PUT replaces the supplied configuration rather than merging it, so omitted protections can be lost.

```sh
RULESET_ID=25653617
gh api repos/wtfzambo/speak-like-you-eat/rulesets
gh api "repos/wtfzambo/speak-like-you-eat/rulesets/$RULESET_ID"
# To update the existing rule:
gh api --method PUT "repos/wtfzambo/speak-like-you-eat/rulesets/$RULESET_ID" --input .github/main-ruleset.json
```

The JSON file alone does not activate protection. Inspect the returned rule's enforcement, target branch, required check integration, strict up-to-date policy, empty bypass list, and zero review requirement. Verify on a non-draft PR that `gh pr view "$PR_NUMBER" --repo wtfzambo/speak-like-you-eat --json headRefOid,mergeStateStatus,mergeable,statusCheckRollup` reports `BLOCKED` while the required check is pending or failed, and `CLEAN` with `MERGEABLE` after the current-head check passes. Record those states and head SHAs; do not merge a disposable verification PR merely to prove the rule.

To re-derive the required check identity, set `PR_NUMBER` to a recent PR with a successful check and inspect its head commit:

```sh
PR_HEAD_SHA=$(gh pr view "$PR_NUMBER" --repo wtfzambo/speak-like-you-eat --json headRefOid --jq .headRefOid)
gh api "repos/wtfzambo/speak-like-you-eat/commits/$PR_HEAD_SHA/check-runs" --jq '.check_runs[] | select(.name == "check") | {name, integration_id: .app.id, integration: .app.slug}'
```

For ordinary red CI, fix the PR or rerun a transient failure. If a release PR is behind `main`, use its **Update branch** button and wait for the new check. Release Please may leave an unchanged release branch untouched after a docs-only main commit; do not assume rerunning Release Please will bring that branch up to date. If App authentication fails, inspect `gh variable list --repo wtfzambo/speak-like-you-eat` and `gh secret list --repo wtfzambo/speak-like-you-eat` for the configured names, then check the linked installation and App settings (App ID `5428791`, distinct from the required GitHub Actions integration). Recover the public client ID from the variable or App settings; secret values cannot be retrieved, so replace a missing or invalid private key using the setup and rotation steps above. Do not substitute a personal token or approve workflows automatically. If an intentional check rename or provider change makes the required status impossible to satisfy, review the new status identity, update `.github/main-ruleset.json` to require that actual check, and apply the update to the existing ruleset before merging the matching configuration PR. Retain active enforcement, the PR requirement, strict up-to-date checks, and the empty bypass list; never disable protection just to land a change.

For App verification, create a disposable same-repository PR using an App installation token and confirm that the normal `pull_request` run starts without approval. Check the run's event, head SHA, actor, and result, then close the verification PR and remove its temporary branch. Such a check verifies the token/CI boundary without creating a release or publishing a package. Do not weaken the ruleset or approve workflows automatically as a workaround.

## One-time npm trusted publisher setup

The package must already exist on npm. Before creating the first automated release, enable npm account two-factor authentication in the npm browser account settings. The `npm trust` command requires npm 11.15.0 or newer and performs browser two-factor authentication.

With an npm account that has package write access, run `npm install --global npm@11.19.0` and then run `npm trust github speak-like-you-eat --file publish.yml --repo wtfzambo/speak-like-you-eat --allow-publish`. Complete the browser two-factor authentication prompt. Verify the registered relationship with `npm trust list speak-like-you-eat --json` and in the npm package settings.

The browser form is an equivalent setup path. Select GitHub Actions and enter owner `wtfzambo`, repository `speak-like-you-eat`, workflow filename `publish.yml`, no environment, and allow `npm publish`. Enter only the filename, including `.yml`; do not enter `.github/workflows/publish.yml`. The filename, case, owner, repository, and optional environment are workflow identity claims, so a mismatch fails only when publishing.

After a successful trusted-publishing verification, use npm package Settings > Publishing access to require two-factor authentication and disallow tokens, then revoke obsolete automation credentials. The workflow uses OIDC only; do not add an npm token secret.

## Workflow requirements and normal release verification

npm trusted publishing requires Node 22.14.0 or newer and npm 11.5.1 or newer. The publish workflow uses Node 24 and pins npm 11.19.0. Before publishing, it confirms the GitHub Release tag exactly matches the validated stable tag and that the release is neither a draft nor a prerelease. It also checks the tag commit's ancestry on `main` and package and lockfile versions, then runs these CI gates:

- `npm run check`
- `npm run benchmark:dry-run`
- `npm run benchmark:phase-2:dry-run`
- `git diff --exit-code -- benchmark/manifest.json benchmark/phase-2-manifest.json`
- `npm pack --dry-run --json`

After these checks pass, it runs `npm publish --access public --tag latest`. The operator-only OMP load check is documented in the [sandbox manual checks](doc-2%20-%20SLYE-sandbox-manual-checks.md#slice-5--final-package-verification); it is not CI-enforced.

After merging a release PR, verify the GitHub Release has the expected `vX.Y.Z` tag, then verify `npm view speak-like-you-eat@X.Y.Z version` and `npm view speak-like-you-eat dist-tags.latest`. Open that npm version's package page and verify its provenance points to this GitHub repository and release workflow. Trusted publishing generates provenance automatically for a public package from GitHub Actions.

npm versions are immutable. A version that already exists is a hard stop, not something to republish, retag, or overwrite.

## Exact-tag recovery

Use manual dispatch only if a non-draft, non-prerelease GitHub Release exists but its matching package version does not. First run `npm view speak-like-you-eat@X.Y.Z version`; if it exists, do not dispatch anything. If it does not exist, use the Publish package workflow's manual dispatch and enter the exact stable GitHub Release tag, such as `v0.1.2`. Do not enter a branch, a commit SHA, a prerelease, or an alternate channel. The workflow rejects invalid tags, verifies the returned GitHub Release tag exactly, rejects draft or prerelease releases, and independently confirms that the tag commit is on `main` before publishing.
