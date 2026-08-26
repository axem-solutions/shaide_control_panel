import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";

/** `h1` + subtitle, with an optional right-aligned action. */
export default function PageIntro({
  title,
  subtitle,
  action,
  hideTitle = false,
  gutterBottom = 32,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  hideTitle?: boolean;
  gutterBottom?: number;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 3,
        flexWrap: "wrap",
        marginBottom: `${gutterBottom}px`,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="h1"
          component="h1"
          sx={
            hideTitle
              ? {
                  position: "absolute",
                  width: "1px",
                  height: "1px",
                  padding: 0,
                  margin: "-1px",
                  overflow: "hidden",
                  clip: "rect(0 0 0 0)",
                  clipPath: "inset(50%)",
                  whiteSpace: "nowrap",
                  border: 0,
                }
              : { marginBottom: subtitle ? "8px" : 0 }
          }
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="subtitle1" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
    </Box>
  );
}
