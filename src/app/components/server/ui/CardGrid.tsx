import type { ReactNode } from "react";
import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";

/** Three of these plus two gaps fit the 1110px column of a 1280px laptop. */
const CARD_MAX = 352;
const CARD_MIN = 280;
const GAP = 24;

/**
 * Centred card row — home tiles and the collections grid.
 *
 * Flex, not CSS grid. Grid gives uniform track widths but always packs the last
 * row from the left: five cards in a four-track row left a lone card with a
 * 918px gap beside it. `justify-content: center` on a wrapping flex row centres
 * *every* line, including an incomplete final one.
 *
 * The cards do not grow (`flex: 0 1`), so they stay the same width on a full row
 * and on a short one — growing would make a lone trailing card wider than the
 * cards above it. `CARD_MAX` is sized so three still share one row on a 1280px
 * laptop; below roughly a 1200px window they wrap, centred.
 */
export default function CardGrid({
  children,
  sx,
}: {
  children: ReactNode;
  sx?: SxProps<Theme>;
}) {
  return (
    <Box
      sx={[
        {
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: `${GAP}px`,
          width: "100%",
          minWidth: 0,
          "& > *": {
            flex: `0 1 ${CARD_MAX}px`,
            // min() so a phone narrower than the card floor still cannot overflow
            minWidth: `min(${CARD_MIN}px, 100%)`,
            maxWidth: "100%",
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  );
}
