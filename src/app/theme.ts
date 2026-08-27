import { createTheme } from "@mui/material";
import type {} from "@mui/x-date-pickers/themeAugmentation";
import { ax } from "./theme-tokens";

/**
 * The whole re-skin lives here and in `globals.css`.
 *
 * - `palette` is the only place that sees raw colour values (MUI parses them,
 *   so a CSS custom property cannot be used there — see `theme-tokens.ts`).
 * - every `components.*` rule reads a `--ax-*` custom property from `globals.css`.
 * - if a visual rule applies to every instance of a component it belongs here,
 *   not in an `sx` prop on a page.
 */

const HAIRLINE = "1px solid var(--ax-surface)";
const MONO_LABEL = {
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: "0.05em",
  textTransform: "uppercase" as const,
};

const theme = createTheme({
  palette: {
    mode: "dark",
    common: { black: ax.black, white: ax.fg },
    background: { default: ax.black, paper: ax.ink },
    primary: { main: ax.orange, contrastText: ax.black },
    secondary: { main: ax.fg, contrastText: ax.black },
    warning: { main: ax.orange, contrastText: ax.black },
    error: { main: ax.magenta, contrastText: ax.fg },
    success: { main: ax.success, contrastText: ax.black },
    info: { main: ax.info, contrastText: ax.black },
    divider: ax.surface,
    text: { primary: ax.fg, secondary: ax.fgMuted, disabled: ax.fgDim },
    action: {
      hover: "rgba(255,255,255,0.03)",
      selected: "rgba(223,104,3,0.08)",
      disabledOpacity: 0.5,
    },
  },

  shape: { borderRadius: 0 },

  typography: {
    fontFamily: "var(--font-sans)",
    fontWeightRegular: 500,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    h1: { fontSize: "var(--fs-h2)", fontWeight: 500, lineHeight: 1.13, letterSpacing: "-0.01em" },
    h2: { fontSize: "var(--fs-h4)", fontWeight: 500, lineHeight: 1.15, letterSpacing: "-0.01em" },
    h3: { fontSize: "var(--fs-lead)", fontWeight: 500, lineHeight: 1.2 },
    h4: { fontSize: 18, fontWeight: 500, lineHeight: 1.3 },
    h5: { fontSize: 16, fontWeight: 500, lineHeight: 1.4 },
    h6: { fontSize: 15, fontWeight: 500, lineHeight: 1.4 },
    subtitle1: { fontSize: "var(--fs-body)", fontWeight: 500, lineHeight: 1.5 },
    subtitle2: { fontSize: "var(--fs-small)", fontWeight: 500, lineHeight: 1.5 },
    body1: { fontSize: "var(--fs-body)", fontWeight: 500, lineHeight: 1.5 },
    body2: { fontSize: "var(--fs-small)", fontWeight: 500, lineHeight: 1.5 },
    caption: { fontSize: 12, fontWeight: 500, lineHeight: 1.4 },
    overline: { ...MONO_LABEL, lineHeight: 1.4, display: "inline-block" },
    button: { fontSize: 13.7, fontWeight: 500, textTransform: "none" },
  },

  components: {
    /* ---------- global ---------- */
    MuiCssBaseline: {
      styleOverrides: {
        "*:focus-visible": {
          outline: "1px solid var(--ax-orange)",
          outlineOffset: "2px",
        },
        "::selection": { background: "var(--ax-accent-soft-strong)", color: "var(--ax-fg)" },
        a: {
          color: "var(--ax-orange)",
          textDecoration: "none",
          transition: "opacity 150ms ease",
          "&:hover": { opacity: 0.85 },
        },
        code: { fontFamily: "var(--font-mono)" },
        "input::placeholder, textarea::placeholder": {
          color: "var(--ax-fg-dim)",
          opacity: 1,
        },
      },
    },

    /* ---------- surfaces ---------- */
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "var(--ax-ink)",
          borderRadius: 0,
          boxShadow: "none",
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: "var(--ax-ink)",
          border: HAIRLINE,
          borderRadius: 0,
          boxShadow: "none",
        },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: "var(--ax-surface)" } },
    },

    /* ---------- buttons ---------- */
    MuiButton: {
      defaultProps: { disableElevation: true, disableRipple: true },
      styleOverrides: {
        root: {
          borderRadius: 0,
          textTransform: "none",
          fontSize: 13.7,
          fontWeight: 500,
          minHeight: 41,
          padding: "12px 20px",
          boxShadow: "none",
          gap: 8,
          transition: "opacity 150ms ease, background-color 150ms ease, border-color 150ms ease",
          "&.Mui-disabled": { opacity: 0.5, cursor: "not-allowed", pointerEvents: "auto" },
        },
        contained: {
          backgroundColor: "var(--ax-fg)",
          color: "var(--ax-black)",
          border: "none",
          "&:hover": { backgroundColor: "var(--ax-fg)", opacity: 0.85 },
          "&.Mui-disabled": { backgroundColor: "var(--ax-fg)", color: "var(--ax-black)" },
        },
        containedError: {
          backgroundColor: "var(--ax-danger-soft)",
          border: "1px solid var(--ax-magenta)",
          color: "var(--ax-magenta)",
          "&:hover": { backgroundColor: "var(--ax-danger-soft-hover)", opacity: 1 },
          "&.Mui-disabled": {
            backgroundColor: "var(--ax-danger-soft)",
            color: "var(--ax-magenta)",
          },
        },
        outlined: {
          backgroundColor: "var(--ax-btn-ghost-bg)",
          border: HAIRLINE,
          color: "var(--ax-fg)",
          "&:hover": {
            backgroundColor: "var(--ax-btn-ghost-bg)",
            borderColor: "var(--ax-surface-2)",
          },
        },
        outlinedError: {
          borderColor: "var(--ax-magenta)",
          color: "var(--ax-magenta)",
          backgroundColor: "var(--ax-danger-soft)",
          "&:hover": {
            borderColor: "var(--ax-magenta)",
            backgroundColor: "var(--ax-danger-soft-hover)",
          },
        },
        text: {
          color: "var(--ax-fg-muted)",
          padding: "10px 12px",
          "&:hover": { backgroundColor: "var(--ax-btn-ghost-bg)", color: "var(--ax-fg)" },
        },
        sizeSmall: { minHeight: 32, padding: "0 12px", fontSize: 13 },
        sizeLarge: { minHeight: 48, padding: "14px 24px" },
      },
    },
    MuiIconButton: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          width: 32,
          height: 32,
          borderRadius: "var(--radius-chrome)",
          backgroundColor: "var(--ax-btn-ghost-bg)",
          border: HAIRLINE,
          color: "var(--ax-fg)",
          transition: "opacity 150ms ease, border-color 150ms ease",
          "&:hover": {
            backgroundColor: "var(--ax-btn-ghost-bg)",
            borderColor: "var(--ax-surface-2)",
          },
          "&.Mui-disabled": { opacity: 0.5, color: "var(--ax-fg)" },
        },
        /* transparent chrome — modal close, file-row delete */
        colorInherit: {
          backgroundColor: "transparent",
          color: "var(--ax-fg-muted)",
          "&:hover": { backgroundColor: "transparent", borderColor: "var(--ax-surface-2)" },
        },
        sizeSmall: { width: 30, height: 30 },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          ...MONO_LABEL,
          borderRadius: 0,
          border: HAIRLINE,
          color: "var(--ax-fg-muted)",
          "&.Mui-selected": {
            backgroundColor: "var(--ax-accent-soft)",
            borderColor: "var(--ax-orange)",
            color: "var(--ax-orange)",
          },
        },
      },
    },

    /* ---------- form controls ---------- */
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "var(--ax-black)",
          borderRadius: 0,
          fontSize: "var(--fs-small)",
          "& .MuiOutlinedInput-notchedOutline": {
            border: HAIRLINE,
            transition: "border-color 150ms ease",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "var(--ax-surface-2)" },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--ax-orange)",
            borderWidth: 1,
          },
          "&.Mui-error .MuiOutlinedInput-notchedOutline": { borderColor: "var(--ax-magenta)" },
          "&.Mui-disabled": { opacity: 0.5 },
        },
        input: {
          padding: "12px 14px",
          "&::placeholder": { color: "var(--ax-fg-dim)", opacity: 1 },
        },
        inputSizeSmall: { padding: "11px 14px" },
        multiline: { padding: 0 },
      },
    },
    MuiInputBase: {
      styleOverrides: { root: { fontSize: "var(--fs-small)", color: "var(--ax-fg)" } },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: "var(--fs-small)",
          color: "var(--ax-fg-muted)",
          "&.Mui-focused": { color: "var(--ax-orange)" },
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: { color: "var(--ax-fg)", "&.Mui-focused": { color: "var(--ax-fg)" } },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: { fontSize: 12, color: "var(--ax-fg-dim)", marginLeft: 0, marginTop: 6 },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        label: { fontSize: "var(--fs-small)", color: "var(--ax-fg)" },
      },
    },
    MuiSelect: {
      defaultProps: { MenuProps: { disableScrollLock: true } },
      styleOverrides: {
        icon: { color: "var(--ax-fg-muted)" },
        select: { paddingTop: 12, paddingBottom: 12 },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: "var(--ax-ink)",
          border: HAIRLINE,
          borderRadius: 0,
          boxShadow: "var(--ax-shadow-card)",
        },
        list: { paddingTop: 4, paddingBottom: 4 },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: "var(--fs-small)",
          borderRadius: 0,
          "&:hover": { backgroundColor: "var(--ax-row-hover)" },
          "&.Mui-selected": {
            backgroundColor: "var(--ax-accent-soft)",
            color: "var(--ax-orange)",
            "&:hover": { backgroundColor: "var(--ax-accent-soft)" },
          },
        },
      },
    },
    MuiCheckbox: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          color: "var(--ax-fg-dim)",
          borderRadius: 0,
          "&.Mui-checked": { color: "var(--ax-orange)" },
        },
      },
    },
    MuiRadio: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          color: "var(--ax-fg-dim)",
          "&.Mui-checked": { color: "var(--ax-orange)" },
        },
      },
    },
    MuiSwitch: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: { width: 44, height: 22, padding: 0, overflow: "visible" },
        switchBase: {
          padding: 3,
          color: "var(--ax-fg-muted)",
          "&.Mui-checked": {
            transform: "translateX(22px)",
            color: "var(--ax-orange)",
            "& + .MuiSwitch-track": {
              backgroundColor: "var(--ax-accent-soft-strong)",
              borderColor: "var(--ax-orange)",
              opacity: 1,
            },
          },
        },
        thumb: {
          width: 16,
          height: 16,
          borderRadius: 0,
          boxShadow: "none",
          backgroundColor: "currentColor",
        },
        track: {
          borderRadius: "var(--radius-sm)",
          backgroundColor: "var(--ax-black)",
          border: HAIRLINE,
          opacity: 1,
        },
      },
    },

    /* ---------- dialogs ---------- */
    MuiBackdrop: {
      styleOverrides: {
        root: { backgroundColor: "var(--ax-scrim)", backdropFilter: "blur(4px)" },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: "var(--ax-ink)",
          border: HAIRLINE,
          borderRadius: 0,
          boxShadow: "var(--ax-shadow-card)",
          backgroundImage: "none",
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: "var(--fs-h4)",
          fontWeight: 500,
          lineHeight: 1.15,
          padding: "24px 28px",
          borderBottom: HAIRLINE,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: 28,
          "&.MuiDialogContent-root": { paddingTop: 28 },
        },
      },
    },
    MuiDialogContentText: {
      styleOverrides: { root: { color: "var(--ax-fg-muted)", fontSize: "var(--fs-small)" } },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: { padding: "20px 28px", borderTop: HAIRLINE, gap: 12, "& > :not(:first-of-type)": { marginLeft: 0 } },
      },
    },

    /* ---------- table ---------- */
    MuiTableContainer: {
      styleOverrides: { root: { backgroundColor: "transparent", borderRadius: 0 } },
    },
    MuiTable: {
      styleOverrides: { root: { borderCollapse: "collapse" } },
    },
    MuiTableHead: {
      styleOverrides: {
        root: { "& .MuiTableRow-root": { backgroundColor: "var(--ax-black)" } },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: 16,
          borderBottom: HAIRLINE,
          fontSize: "var(--fs-small)",
          color: "var(--ax-fg)",
        },
        head: {
          ...MONO_LABEL,
          color: "var(--ax-fg-muted)",
          letterSpacing: "0.05em",
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          "& .MuiTableRow-root:hover": { backgroundColor: "var(--ax-row-hover)" },
          "& .MuiTableRow-root:last-of-type .MuiTableCell-root": { borderBottom: "none" },
        },
      },
    },

    /* ---------- data display ---------- */
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: "var(--radius-sm)",
          backgroundColor: "var(--ax-tag-bg)",
          border: HAIRLINE,
          fontSize: 12,
          fontWeight: 500,
          height: 26,
          color: "var(--ax-fg)",
        },
        outlined: { backgroundColor: "var(--ax-tag-bg)" },
        label: { paddingLeft: 10, paddingRight: 10 },
        sizeSmall: { height: 24, fontSize: 12 },
        deleteIcon: { color: "var(--ax-fg-dim)", "&:hover": { color: "var(--ax-fg)" } },
      },
    },
    MuiAlert: {
      defaultProps: { variant: "outlined" },
      styleOverrides: {
        root: { borderRadius: 0, border: HAIRLINE, fontSize: "var(--fs-small)" },
        outlinedWarning: {
          borderColor: "var(--ax-orange)",
          backgroundColor: "var(--ax-accent-soft)",
          color: "var(--ax-fg)",
          "& .MuiAlert-icon": { color: "var(--ax-orange)" },
        },
        outlinedError: {
          borderColor: "var(--ax-magenta)",
          backgroundColor: "rgba(255,0,64,0.10)",
          color: "var(--ax-fg)",
          "& .MuiAlert-icon": { color: "var(--ax-magenta)" },
        },
        outlinedInfo: {
          borderColor: "var(--ax-surface-2)",
          backgroundColor: "var(--ax-btn-ghost-bg)",
          color: "var(--ax-fg)",
          "& .MuiAlert-icon": { color: "var(--ax-fg-muted)" },
        },
        outlinedSuccess: {
          borderColor: "var(--ax-success)",
          backgroundColor: "rgba(57,196,99,0.10)",
          color: "var(--ax-fg)",
          "& .MuiAlert-icon": { color: "var(--ax-success)" },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "var(--ax-ink)",
          border: HAIRLINE,
          borderRadius: 0,
          color: "var(--ax-fg)",
          fontSize: 12,
          fontWeight: 500,
          padding: "6px 10px",
          boxShadow: "var(--ax-shadow-card)",
        },
        arrow: { color: "var(--ax-ink)" },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 40, borderBottom: HAIRLINE },
        indicator: { height: 2, backgroundColor: "var(--ax-orange)" },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          ...MONO_LABEL,
          letterSpacing: "0.1em",
          minHeight: 40,
          padding: "0 16px",
          color: "var(--ax-fg-muted)",
          "&.Mui-selected": { color: "var(--ax-fg)" },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: "var(--ax-orange)",
          textDecoration: "none",
          transition: "opacity 150ms ease",
          "&:hover": { opacity: 0.85, textDecoration: "none" },
        },
      },
    },
    MuiBreadcrumbs: {
      styleOverrides: {
        root: { ...MONO_LABEL, letterSpacing: "0.1em", color: "var(--ax-fg-muted)" },
        separator: { marginLeft: 8, marginRight: 8, color: "var(--ax-fg-dim)" },
      },
    },

    /* ---------- feedback ---------- */
    MuiLinearProgress: {
      styleOverrides: {
        root: { height: 2, borderRadius: 0, backgroundColor: "var(--ax-surface)" },
        bar: { backgroundColor: "var(--ax-orange)" },
      },
    },
    MuiCircularProgress: {
      styleOverrides: { root: { color: "var(--ax-orange)" } },
    },

    /* ---------- date pickers (§8 export-logs dialog) ---------- */
    MuiPickersDay: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          fontSize: 13,
          "&:hover": { backgroundColor: "var(--ax-row-hover)" },
          "&.Mui-selected": {
            backgroundColor: "var(--ax-orange)",
            color: "var(--ax-black)",
            "&:hover": { backgroundColor: "var(--ax-orange)" },
            "&:focus": { backgroundColor: "var(--ax-orange)" },
          },
          "&.MuiPickersDay-today": { borderColor: "var(--ax-orange)" },
        },
      },
    },
    MuiDateCalendar: {
      styleOverrides: { root: { backgroundColor: "var(--ax-ink)" } },
    },
    MuiPickersCalendarHeader: {
      styleOverrides: { label: { fontSize: "var(--fs-small)", fontWeight: 500 } },
    },
    MuiDayCalendar: {
      styleOverrides: {
        weekDayLabel: { ...MONO_LABEL, fontSize: 10, color: "var(--ax-fg-dim)" },
      },
    },
    MuiPickerPopper: {
      styleOverrides: {
        paper: {
          backgroundColor: "var(--ax-ink)",
          border: HAIRLINE,
          borderRadius: 0,
          boxShadow: "var(--ax-shadow-card)",
        },
      },
    },
  },
});

export default theme;
