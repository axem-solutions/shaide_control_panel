/**
 * Raw palette values for the MUI theme.
 *
 * `src/app/globals.css` is the single source of design tokens for everything that
 * renders through CSS. This file exists only because MUI parses `palette.*` values
 * with `alpha()` / `lighten()` / `getContrastText()`, which cannot handle a CSS
 * custom property. Every rule outside `palette` — all of `components.*` — reads
 * `var(--ax-*)` instead.
 *
 * Keep these in sync with the `--ax-*` block in `globals.css`.
 */
export const ax = {
  black: "#000000",
  ink: "#0E0E0E",
  ink2: "#080808",
  surface: "#222222",
  surface2: "#444444",
  fg: "#FFFFFF",
  fgMuted: "#BABABA",
  fgDim: "#8F8F8F",
  orange: "#DF6803",
  magenta: "#FF0040",
  success: "#39C463",
  info: "#4FC3F7",
} as const;
