import type { ReactNode } from "react";
import { Box, Radio } from "@mui/material";

/**
 * Selectable radio card — the design's "Default access" picker.
 * Selected = orange border + `--ax-accent-soft` fill.
 */
export default function RadioCard({
  selected,
  onSelect,
  title,
  hint,
  name,
  disabled = false,
}: {
  selected: boolean;
  onSelect: () => void;
  title: ReactNode;
  hint?: ReactNode;
  name: string;
  disabled?: boolean;
}) {
  return (
    <Box
      component="label"
      sx={{
        flex: 1,
        minWidth: 140,
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        padding: "12px 14px",
        border: `1px solid ${selected ? "var(--ax-orange)" : "var(--ax-surface)"}`,
        backgroundColor: selected ? "var(--ax-accent-soft)" : "transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "border-color 150ms ease, background-color 150ms ease",
        "&:hover": { borderColor: selected ? "var(--ax-orange)" : "var(--ax-surface-2)" },
      }}
    >
      <Radio
        checked={selected}
        onChange={onSelect}
        name={name}
        size="small"
        disabled={disabled}
        sx={{ padding: 0 }}
      />
      <Box sx={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
        <Box component="span" sx={{ fontSize: 13, fontWeight: 500 }}>
          {title}
        </Box>
        {hint && (
          <Box component="span" sx={{ fontSize: 11, color: "var(--ax-fg-dim)" }}>
            {hint}
          </Box>
        )}
      </Box>
    </Box>
  );
}
