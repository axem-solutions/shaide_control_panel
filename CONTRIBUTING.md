# Contributing to the shaide Control Panel

Contributions of code, documentation, bug reports, design improvements, and
feature ideas are welcome.

By participating, you agree to follow the axem
[Code of Conduct](https://github.com/axem-solutions/.github/blob/main/CODE_OF_CONDUCT.md).

## Before you start

- Read and understand the documentation.
- Search the [existing issues](https://github.com/axem-solutions/shaide_control_panel/issues)
  before opening a new one.
- Do not open a public issue for a suspected security vulnerability. Report it
  privately to [info@axem.dev](mailto:info@axem.dev).

Questions and early proposals are also welcome in
[Discussions](https://github.com/axem-solutions/shaide_control_panel/discussions)
or on [Discord](https://discord.com/invite/Nv6hSzXruK).

## Development setup

The Control Panel is a TypeScript application built with Next.js, React, and
Material UI. Pull-request CI uses Node.js 20 and npm.

Fork the repository, clone your fork, and create a focused branch from `main`:

```bash
git clone https://github.com/<your-user>/shaide_control_panel.git
cd shaide_control_panel
git switch -c <issue-id>/short-description
```

Install the locked dependencies and create a local environment file:

```bash
npm ci
cp .env.example .env
```

Review the values in `.env`, then start the development server:

```bash
npm run dev
```

Open <http://localhost:3000/control-panel>. The application expects a reachable
shaide Server configured through the environment variables.

## Making changes

- Keep changes focused and avoid unrelated refactors.
- Preserve the existing TypeScript, Next.js, and Material UI patterns.
- Check responsive behavior and keyboard accessibility for UI changes.
- Update documentation when configuration or user-visible behavior changes.
- Never commit credentials, authentication cookies, license files, or `.env`
  files.

Use [Conventional Commits](https://www.conventionalcommits.org/) for commit
messages, for example:

```text
feat: add license activation flow
fix(auth): reject expired sessions
docs: clarify control panel configuration
```

## Validate your change

Run the same checks used by pull-request CI:

```bash
npm run lint
npm run build
```

Manually exercise the affected flows against a shaide Server. For visual
changes, check the relevant pages at common desktop and mobile widths. If the
change affects the production container, also verify it locally:

```bash
npm run docker:build
npm run docker:run
```

## Open a pull request

Push your branch and open a pull request against `main`, or the integration
branch described in the issue.
Complete the pull request template and:

- explain the change
- describe the automated and manual checks you ran
- include screenshots or a short recording for visual changes
- call out configuration, authentication, authorization, and deployment
  effects
- update documentation in the same pull request

Keep the pull request reviewable, respond to feedback, and ensure all required
checks pass. A maintainer will merge the pull request after approval.
