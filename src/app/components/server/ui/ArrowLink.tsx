import type { ReactNode } from "react";
import Link from "next/link";
import { Box } from "@mui/material";
import ArrowGlyph from "./ArrowGlyph";

/**
 * Orange link with the pixel arrow — card footers, "Open" / "Browse".
 *
 * Omit `href` when an ancestor already carries the link (nested anchors are
 * invalid). In that mode it is a plain span: no hover state of its own, because
 * it is not a separate target — the whole card is the click area.
 */
export default function ArrowLink({
  href,
  children,
  size = 13,
}: {
  href?: string;
  children: ReactNode;
  size?: number;
}) {
  return (
    <Box
      {...(href ? { component: Link, href } : { component: "span" })}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        fontSize: size,
        fontWeight: 500,
        color: "var(--ax-orange)",
        textDecoration: "none",
        ...(href
          ? { transition: "opacity 150ms ease", "&:hover": { opacity: 0.85 } }
          : { pointerEvents: "none" }),
      }}
    >
      {children}
      <ArrowGlyph />
    </Box>
  );
}
