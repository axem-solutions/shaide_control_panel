This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

The app is served under the `/control-panel` base path, so it lives at
[http://localhost:3000/control-panel](http://localhost:3000/control-panel).

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Docker

Build the image:

```bash
docker build -t control-panel:latest .
```

Run the container:

```bash
docker run --rm -p 3000:3000 --name control-panel control-panel:latest
```

Then open [http://localhost:3000/control-panel](http://localhost:3000/control-panel).

Environment setup:

- Copy `.env.example` to `.env` for local development and adjust variables as needed.

The UI self-hosts its font (see "Design system" below); no request leaves the deployment at runtime.

## Feature availability

Two environment variables set by the installer decide which tiles the Control Panel home
page offers. Both are **opt-in**: a tile appears only when its variable is set to `true`
(`1`/`yes`/`on` also count), so an installation that does not run the service never
advertises it. Both are parsed in `src/lib/feature-flags.ts`.

| Variable | Controls |
|---|---|
| `KNOWLEDGE_CENTER_ENABLED` | The Knowledge Center tile and the `/knowledge_center` routes. |
| `APP_ENABLED` | The App tile, linking out to the shaide App. |

### `KNOWLEDGE_CENTER_ENABLED`

`KNOWLEDGE_CENTER_ENABLED` tells the UI whether the Knowledge Center service is part of
this installation. It is **opt-in**: the Knowledge Center tile only appears on the
Control Panel home page — for admins and normal users alike — when the variable is set
to `true` (`1`/`yes`/`on` also count). Unset or any other value hides it, so an
installation that does not run the service never advertises it.

The `/knowledge_center` routes guard on the same flag and redirect to `/home` when it is
off, so the feature is not reachable by URL either. The guard lives in the page components
(`src/lib/feature-flags.ts` is read from the Node runtime) rather than in `src/middleware.ts`,
because middleware runs on the Edge runtime, where `process.env` is inlined at build time —
the flag has to stay a deployment-time setting, not a build-time one.

The Knowledge Center API routes (`/api/organization-collection`, its `/file` child,
`/api/object-storage/presigned-url` and `/api/embedding-models`) enforce the same flag through
`requireKnowledgeCenter()` in `src/app/api/_utils.ts`, answering 404 when the service is off so
an authenticated caller cannot reach them by hand.

The Users page follows the flag too: collection membership is Knowledge Center data, so with
the service off it skips the membership request entirely and drops the Collections column, its
sort option and the collection links, rather than warning about a backend that is not there.

### `APP_ENABLED`

`APP_ENABLED` adds an "App" tile that sends the user to the shaide App. The App is a
separate deployment served next to the Control Panel, so the tile is a plain anchor to
`/app` rather than a `next/link`: `next/link` prefixes the `basePath` and would point at
`/control-panel/app`, a route this app does not serve. Routing `/app` to the App is the
ingress's job — the Control Panel only renders the link.

## Design system

The UI is a themed MUI app. Three files hold the whole visual layer — change them,
not individual pages.

| File | Holds |
|---|---|
| `src/app/globals.css` | **The single source of design tokens.** The `--ax-*` palette, type scale, radii, layout constants, `@keyframes pulse`, scrollbars and the page-shell classes. No `.tsx` file may contain a hex literal. |
| `src/app/theme.ts` | The MUI theme: palette, typography variants and every `components.*` override. If a rule applies to *every* instance of a component it belongs here, not in an `sx` prop. |
| `src/app/theme-tokens.ts` | The raw palette values, used **only** by `theme.ts`. MUI parses `palette.*` colours with `alpha()`/`lighten()`, so CSS custom properties cannot be used there. Keep it in sync with the `--ax-*` block in `globals.css`. |

Rules of thumb:

- `sx` is for layout only — flex/grid, gaps, sizing, one-off positioning. Colours,
  borders, radii and font sizes come from the theme or a `var(--ax-*)` token.
- The palette is near-monochrome on `#000`. Orange (`--ax-orange`) is an accent —
  links, active/selected state, the admin dot, focus rings — never a button fill.
  The primary button is white on black; radius is `0` almost everywhere.
- Every surface is defined by a 1px `--ax-surface` hairline rather than a shadow.
  The only shadow, `--ax-shadow-card`, is for modals and the login card.

### Shared primitives

Presentational building blocks live in `src/app/components/server/ui/` (props in,
markup out — no data fetching, usable from server *and* client components). Reach for
one of these before writing new markup, and add to them as soon as a pattern appears
on a second page:

`AccessBadge` · `ArrowGlyph` · `ArrowLink` · `CardGrid` · `EmptyState` · `FieldLabel` ·
`MonoLabel` · `PageIntro` · `Panel` · `RadioCard` · `StatusBadge` · `StatusDot` · `Tag`

`Panel` is the workhorse container (hairline + ink surface, with an optional
hairline-split footer); `CardGrid` lays out every card collection (it keeps card
widths uniform and the group centred at any card count — read its comment before
replacing it with a plain `auto-fill`/`auto-fit` grid). `MonoLabel` renders the uppercase mono micro-labels used for
page labels, table headers and ghost-button text.

### Fonts

General Sans Medium is committed to `public/fonts/` and loaded in
`src/app/layout.tsx` through `next/font/local`, which publishes it as
`--ax-font-general-sans`. It is deliberately **not** a plain `@font-face` pointing at
`/fonts/...`: `src/middleware.ts` intercepts that path and redirects it to the login
page, so the font would 307 on every request. `next/font` emits the file under
`_next/static/media`, which the middleware matcher excludes.

Only the Medium (500) face ships; 400/600 fall back to the system sans stack declared
on `--ax-font-sans`.

## Grafana logs integration

The `/logs` page renders a Grafana dashboard in an iframe, proxied admin-only through
`src/app/grafana/[...path]/route.ts` — deliberately mounted at `/grafana`, not `/api/grafana`,
because Grafana's own `root_url` has to match this path and shouldn't need to change per
environment. App-side config is `GRAFANA_FQDN`/`GRAFANA_PORT` in `.env.example`. Required
`grafana.ini` settings (`domain`/`csrf_trusted_origins` are environment-specific, set separately):

```ini
[security]
allow_embedding = true   # otherwise Grafana blocks being framed, iframe stays blank

[server]                 # the proxy strips /control-panel/grafana before forwarding, so
root_url = %(protocol)s://%(domain)s/control-panel/grafana/  # Grafana must be told it's
serve_from_sub_path = false                                  # served from that sub-path

[auth.anonymous]         # safe only because a NetworkPolicy restricts Grafana to
enabled = true           # control-panel alone, which itself gates every request via
org_role = Viewer        # its own admin check — revisit if that policy is ever removed
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## CI

1. ci.yml — Triggers on every pull request, on pushes to `main`, and manually
   from the Actions tab. This is the required status check that must pass before
   a PR can be merged. Runs:
   - `npm run lint` — ESLint catches code quality issues and TypeScript rule
     violations early, before the build.
   - `npm run check-types` — `tsc --noEmit` across the whole project. `next build`
     only type-checks files reachable from the app, so this is what covers test
     files.
   - `npm test` — the vitest suite (unit + jsdom component tests).
   - `npm run build` — validates all imports and routes, and confirms the app
     actually compiles to a deployable artifact.
2. publish.yml — Triggers on every push to main (i.e. after a PR is merged).
   Builds the Docker image and pushes it to GHCR tagged as `dev` and `dev-<sha>`.

## Commit Conventions

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):
`<type>[(scope)]: <subject>`.

```
feat: add reasoning effort setting
fix(ci): download only installer artifacts
```

Allowed types: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`,
`revert`, `style`, `test`.

Git hooks are installed automatically by `npm install`, no extra setup needed:

- `pre-commit` runs `npm run lint`.
- `commit-msg` validates the message against the rules above.
- `pre-push` runs `npm run check-types`.