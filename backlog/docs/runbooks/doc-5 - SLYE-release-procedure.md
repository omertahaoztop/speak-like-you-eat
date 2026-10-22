---
id: doc-5
title: SLYE release procedure
type: guide
created_date: '2026-08-15 17:48'
updated_date: '2026-10-22 14:21'
---
# SLYE release procedure

## Release policy

Release Please reads Conventional Commits on `main`. Use `fix:` for a patch release and `feat:` for a minor release normally. With `bump-minor-pre-major: true`, a breaking change before 1.0 bumps the minor version rather than jumping to 1.0.0. Use `feat!:` or a `BREAKING CHANGE:` footer only for a breaking change. This project makes stable releases only: no prerelease versions and no alternate npm channel.

A releasable commit causes Release Please to open or update a release PR. Merge that PR to create the stable `vX.Y.Z` tag and GitHub Release. Only a created release sends the repository dispatch event, which starts `publish.yml` at that exact tag and publishes it to npm as `latest`. Creating or updating a release PR does not publish anything.

## One-time GitHub Actions setting

Keep the repository's default workflow permissions read-only. In Settings > Actions > General, enable “Allow GitHub Actions to create and approve pull requests” so Release Please can create its release PR with `GITHUB_TOKEN`. This broader checkbox is used only for PR creation here; each workflow still declares its least required permissions.

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
