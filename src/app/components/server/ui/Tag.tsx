import type { ReactNode } from "react";
import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";

/** 2px-radius pill — collection tags, file tags. */
export default function Tag({
  children,
  sx,
}: {
  children: ReactNode;
  sx?: SxProps<Theme>;
}) {
  return (
    <Box
      component="span"
      sx={[
        {
          display: "inline-block",
          padding: "4px 10px",
          backgroundColor: "var(--ax-tag-bg)",
          border: "1px solid var(--ax-surface)",
          borderRadius: "var(--radius-sm)",
          fontSize: 12,
          fontWeight: 500,
          lineHeight: 1.3,
          color: "text.primary",
          maxWidth: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  );
}
