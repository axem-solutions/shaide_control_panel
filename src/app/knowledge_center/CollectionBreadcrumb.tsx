"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Box, Menu, MenuItem } from "@mui/material";
import MonoLabel from "../components/server/ui/MonoLabel";
import { sortStringsAsc } from "@/lib/list-utils";

type CollectionBreadcrumbProps = {
  collections: string[];
  currentName: string;
};

export default function CollectionBreadcrumb({
  collections,
  currentName,
}: CollectionBreadcrumbProps) {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const sortedCollections = useMemo(() => {
    return [...collections].sort(sortStringsAsc);
  }, [collections]);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (name: string) => {
    handleClose();
    router.push(`/knowledge_center/${encodeURIComponent(name)}`);
  };

  return (
    <Box
      component="nav"
      aria-label="Breadcrumb"
      sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}
    >
      <Box component={Link} href="/knowledge_center" sx={{ textDecoration: "none" }}>
        <MonoLabel spacing="wide" sx={{ "&:hover": { color: "var(--ax-fg)" } }}>
          Collections
        </MonoLabel>
      </Box>
      <MonoLabel spacing="wide" sx={{ color: "var(--ax-fg-dim)" }}>
        /
      </MonoLabel>
      <Box
        component="button"
        type="button"
        onClick={handleOpen}
        sx={{
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          textAlign: "left",
          minWidth: 0,
        }}
      >
        <MonoLabel
          spacing="wide"
          sx={{
            color: "var(--ax-fg)",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
          }}
        >
          {currentName}
        </MonoLabel>
      </Box>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {sortedCollections.length === 0 ? (
          <MenuItem disabled>No collections</MenuItem>
        ) : (
          sortedCollections.map((name) => (
            <MenuItem
              key={name}
              selected={name === currentName}
              onClick={() => handleSelect(name)}
            >
              {name}
            </MenuItem>
          ))
        )}
      </Menu>
    </Box>
  );
}
