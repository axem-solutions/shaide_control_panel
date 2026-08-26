import { Box } from "@mui/material";

/** 18px-high mono box: `R/W` when writable, a square `r` when read-only. */
export default function AccessBadge({ canWrite }: { canWrite: boolean }) {
  return (
    <Box
      component="span"
      title={canWrite ? "Read-write access" : "Read-only access"}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: 18,
        ...(canWrite ? { padding: "0 5px" } : { width: 18 }),
        border: "1px solid var(--ax-line-strong)",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        fontWeight: 600,
        color: "text.secondary",
        textTransform: "uppercase",
        lineHeight: 1,
        letterSpacing: canWrite ? "0.05em" : 0,
        flexShrink: 0,
      }}
    >
      {canWrite ? "R/W" : "r"}
    </Box>
  );
}
