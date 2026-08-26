# control_panel

TypeScript/Next.js web UI for shaide. Publishes a Docker image to `ghcr.io/axem-solutions/control_panel`.

## UI work

The visual layer is a themed MUI app driven by three files — read README's
"Design system" section before touching any page:

- `src/app/globals.css` — the single source of design tokens (`--ax-*`). No hex
  literal belongs in a `.tsx` file.
- `src/app/theme.ts` — the MUI theme. Anything that applies to every instance of a
  component goes here, not in an `sx` prop.
- `src/app/components/server/ui/` — shared presentational primitives. Use one before
  writing new markup; add one as soon as a pattern shows up on a second page.

`sx` is for layout only. Verify with `npm run lint && npm run build`.

## Releasing

**Run from `main`:**
```
npx tsx scripts/release.ts <version> [changelog-file] [pr-body-file]
```
Bumps `package.json`, updates `CHANGELOG.md`, creates a `release/vX.Y.Z` branch, and opens a PR titled `RELEASE vX.Y.Z`.

Merging the PR triggers CI (`release.yml`) to create the `vX.Y.Z` tag, push Docker images (`ghcr.io/axem-solutions/control_panel:vX.Y.Z` and `:latest`), and create the GitHub Release automatically.

**Via AI agent (Claude Code or Codex):**
```
/release control_panel vX.Y.Z
```
or: "release control_panel vX.Y.Z"

The agent reads git history since the last tag, drafts a CHANGELOG entry, asks for confirmation, runs the script, and prints the Jira Release notes for you to paste manually into the `shaide control panel vX.Y.Z` release in the shaide Jira project.

**Prerequisites:** Be on `main` with a clean working tree and push access.
