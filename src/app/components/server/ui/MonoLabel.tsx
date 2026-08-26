import type { ReactNode } from "react";
import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";

type MonoLabelProps = {
  children: ReactNode;
  /** letter-spacing ramp: header page label is wide, table headers are tight */
  spacing?: "tight" | "wide" | "widest";
  size?: number;
  sx?: SxProps<Theme>;
};

const SPACING = { tight: "0.05em", wide: "0.1em", widest: "0.14em" } as const;

/** Uppercase mono micro-label — header page label, table headers, ghost buttons. */
export default function MonoLabel({
  children,
  spacing = "tight",
  size = 11,
  sx,
}: MonoLabelProps) {
  return (
    <Box
      component="span"
      sx={[
        {
          fontFamily: "var(--font-mono)",
          fontSize: size,
          fontWeight: 500,
          letterSpacing: SPACING[spacing],
          textTransform: "uppercase",
          lineHeight: 1.4,
          color: "text.secondary",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  );
}
