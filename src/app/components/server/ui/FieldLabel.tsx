import type { ReactNode } from "react";
import { Box } from "@mui/material";

/** External 15px/500 label above an input — the design uses no floating labels. */
export default function FieldLabel({
  id,
  htmlFor,
  children,
}: {

  id?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <Box
      component="label"
      id={id}
      htmlFor={htmlFor}
      sx={{
        display: "block",
        fontSize: "var(--fs-small)",
        fontWeight: 500,
        color: "text.primary",
      }}
    >
      {children}
    </Box>
  );
}
