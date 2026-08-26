import type { ReactNode } from "react";
import { Box } from "@mui/material";

type Tone = "danger" | "warning" | "success" | "neutral";

const TONES: Record<Tone, { fg: string; border: string; bg: string }> = {
  danger: { fg: "var(--ax-magenta)", border: "var(--ax-magenta)", bg: "var(--ax-danger-soft)" },
  warning: { fg: "var(--ax-orange)", border: "var(--ax-orange)", bg: "var(--ax-accent-soft)" },
  success: { fg: "var(--ax-success)", border: "var(--ax-success)", bg: "rgba(57,196,99,0.12)" },
  neutral: { fg: "var(--ax-fg-muted)", border: "var(--ax-surface)", bg: "var(--ax-tag-bg)" },
};

/** Tinted + bordered state badge — licence expiry, upload state. */
export default function StatusBadge({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  const t = TONES[tone];
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        padding: "2px 8px",
        backgroundColor: t.bg,
        border: `1px solid ${t.border}`,
        borderRadius: "var(--radius-sm)",
        fontSize: 10,
        fontWeight: 600,
        lineHeight: 1.6,
        color: t.fg,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Box>
  );
}
