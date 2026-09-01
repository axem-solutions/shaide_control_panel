import type { ReactNode } from "react";
import Link from "next/link";
import { isAdminSession } from "@/lib/session-signature";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import { Box, Typography } from "@mui/material";
import ArrowLink from "../components/server/ui/ArrowLink";
import CardGrid from "../components/server/ui/CardGrid";
import PageIntro from "../components/server/ui/PageIntro";
import Panel from "../components/server/ui/Panel";

type Tile = {
  href: string;
  title: string;
  description: string;
  action: string;
  icon: ReactNode;
};

const ICON_SX = { fontSize: 22, color: "var(--ax-orange)" } as const;

function HomeTile({ tile }: { tile: Tile }) {
  return (
    <Panel
      component={Link}
      href={tile.href}
      hover="accent"
      padding={32}
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: 240,
        textDecoration: "none",
        color: "inherit",
        "&:hover": { opacity: 1 },
      }}
      bodySx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
      footerSx={{ textAlign: "center" }}
      footer={<ArrowLink>{tile.action}</ArrowLink>}
    >
      <Box sx={{ textAlign: "center" }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            margin: "0 auto 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid var(--ax-orange)",
          }}
        >
          {tile.icon}
        </Box>
        <Typography variant="h4" component="h2" sx={{ marginBottom: "12px" }}>
          {tile.title}
        </Typography>
        <Typography variant="body2" sx={{ color: "var(--ax-fg-dim)" }}>
          {tile.description}
        </Typography>
      </Box>
    </Panel>
  );
}

export default async function HomePage() {
  const isAdmin = await isAdminSession();

  const tiles: Tile[] = [
    {
      href: "/knowledge_center",
      title: "Knowledge Center",
      description: isAdmin
        ? "Create collections to assign knowledge to users and manage permissions."
        : "Browse the collections shared with you and upload documents where enabled.",
      action: "Browse",
      icon: <MenuBookIcon sx={ICON_SX} />,
    },
  ];

  if (isAdmin) {
    tiles.push(
      {
        href: "/users",
        title: "Users",
        description: "View and filter users, and manage their collection access.",
        action: "Manage",
        icon: <PersonOutlineIcon sx={ICON_SX} />,
      },
      {
        href: "/logs",
        title: "Logs",
        description: "View system logs and metrics dashboards.",
        action: "View",
        icon: <QueryStatsIcon sx={ICON_SX} />,
      },
    );
  }

  return (
    <Box>
      <PageIntro
        title="Control Panel"
        subtitle={
          isAdmin
            ? "Manage users and knowledge collections."
            : "Browse the collections shared with you."
        }
        gutterBottom={32}
      />
      <CardGrid>
        {tiles.map((tile) => (
          <HomeTile key={tile.href} tile={tile} />
        ))}
      </CardGrid>
    </Box>
  );
}
