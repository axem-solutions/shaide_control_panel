import { Box } from "@mui/material";

type StatusDotProps = { tone: "admin" | "user" | "processing" };

/** 6px role dot in the header, 8px pulsing dot for in-flight work. */
export default function StatusDot({ tone }: StatusDotProps) {
  const isProcessing = tone === "processing";
  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        display: "inline-block",
        flexShrink: 0,
        width: isProcessing ? 8 : 6,
        height: isProcessing ? 8 : 6,
        borderRadius: "50%",
        backgroundColor: tone === "user" ? "var(--ax-fg-muted)" : "var(--ax-orange)",
        boxShadow: tone === "admin" ? "0 0 6px var(--ax-orange)" : "none",
        animation: isProcessing ? "pulse 1.1s ease-in-out infinite" : "none",
      }}
    />
  );
}
