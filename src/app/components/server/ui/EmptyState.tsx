import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";

/** The one shared empty / not-found / no-match block. */
export default function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 1.5,
        paddingY: "56px",
        paddingX: 3,
      }}
    >
      {icon}
      <Typography variant="h3" component="p">
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ color: "var(--ax-fg-dim)", maxWidth: 480 }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ marginTop: 1 }}>{action}</Box>}
    </Box>
  );
}
