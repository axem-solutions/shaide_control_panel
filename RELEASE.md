# Releasing control_panel

## Releasing

From within the products working directory, ask the agent:

```
/release control_panel vX.Y.Z
```

or: "release control_panel vX.Y.Z"

The agent reads git history since the last tag, drafts a CHANGELOG entry, asks for confirmation, runs the release script (creating the release branch and PR), then prints the Jira Release notes for you to paste manually into the `shaide control panel vX.Y.Z` release.

**Merge the PR.** CI (`release.yml`) will automatically create the tag, push Docker images, and create the GitHub Release.

## Running the script directly

```bash
npx tsx scripts/release.ts vX.Y.Z [changelog-file] [pr-body-file] [--dry-run]
```

## Hotfix release

1. Branch from the production tag:
   ```bash
   git checkout -b hotfix-vX.Y.Z vX.Y.0
   ```
2. Apply the minimal fix and commit
3. Run the release script: `npx tsx scripts/release.ts vX.Y.Z`

## What happens automatically

| Step | How |
|---|---|
| Version bump | `scripts/release.ts` bumps `package.json` |
| CHANGELOG update | AI-drafted from git log, inserted by `scripts/release.ts` |
| Release branch + PR | `scripts/release.ts` |
| Git tag | CI `release.yml` triggered by PR merge |
| Docker images `:vX.Y.Z` + `:latest` | CI `release.yml` |
| GitHub Release | CI `release.yml` |
| Jira Release notes | AI agent generates content; you paste it into `shaide control panel vX.Y.Z` manually |
