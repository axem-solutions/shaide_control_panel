import type { ElementType, ReactNode } from "react";
import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";

type PanelProps = {
  children: ReactNode;
  /**
   * Section split off by a hairline. The design always insets that hairline by the
   * panel padding, so the footer lives inside the padded box, not below it.
   */
  footer?: ReactNode;
  /** space above the hairline */
  footerGap?: number;
  /** space below the hairline */
  footerPad?: number;
  /** 32px for content cards, 20px for list rows */
  padding?: number;
  /** dashed hairline — empty-state hero and drop zones */
  dashed?: boolean;
  /** clickable panels get an orange hover edge, static ones lift to --ax-surface-2 */
  hover?: "none" | "subtle" | "accent";
  component?: ElementType;
  /** set together with `component={Link}` to make the whole panel clickable */
  href?: string;
  sx?: SxProps<Theme>;
  bodySx?: SxProps<Theme>;
  footerSx?: SxProps<Theme>;
};

/** Hairline + ink surface. The workhorse container of the redesign. */
export default function Panel({
  children,
  footer,
  footerGap = 24,
  footerPad = 24,
  padding = 32,
  dashed = false,
  hover = "none",
  component = "div",
  href,
  sx,
  bodySx,
  footerSx,
}: PanelProps) {
  const hoverColor =
    hover === "accent" ? "var(--ax-orange)" : hover === "subtle" ? "var(--ax-surface-2)" : null;

  return (
    <Box
      component={component}
      {...(href ? { href } : {})}
      sx={[
        {
          display: "flex",
          flexDirection: "column",
          padding: `${padding}px`,
          border: `1px ${dashed ? "dashed" : "solid"} var(--ax-surface)`,
          backgroundColor: dashed ? "var(--ax-black)" : "var(--ax-ink)",
          borderRadius: 0,
          minWidth: 0,
          transition: "border-color 150ms ease",
          ...(hoverColor ? { "&:hover": { borderColor: hoverColor } } : {}),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box sx={[{ minWidth: 0 }, ...(Array.isArray(bodySx) ? bodySx : [bodySx])]}>{children}</Box>
      {footer != null && (
        <Box
          sx={[
            {
              marginTop: `${footerGap}px`,
              paddingTop: `${footerPad}px`,
              borderTop: "1px solid var(--ax-surface)",
              minWidth: 0,
            },
            ...(Array.isArray(footerSx) ? footerSx : [footerSx]),
          ]}
        >
          {footer}
        </Box>
      )}
    </Box>
  );
}
