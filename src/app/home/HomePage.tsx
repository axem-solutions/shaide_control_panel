import type { ReactNode } from "react";
import Link from "next/link";
import { isAppEnabled, isKnowledgeCenterEnabled } from "@/lib/feature-flags";
import { isAdminSession } from "@/lib/session-signature";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import { Box, Typography } from "@mui/material";
import ArrowLink from "../components/server/ui/ArrowLink";
import CardGrid from "../components/server/ui/CardGrid";
import EmptyState from "../components/server/ui/EmptyState";
import PageIntro from "../components/server/ui/PageIntro";
import Panel from "../components/server/ui/Panel";

type Tile = {
  href: string;
  title: string;
  description: string;
  action: string;
  icon: ReactNode;
  external?: boolean;
};

const ICON_SX = { fontSize: 22, color: "var(--ax-orange)" } as const;

/** The shaide App is served next to the Control Panel, not under its basePath. */
const APP_PATH = "/app";

function HomeTile({ tile }: { tile: Tile }) {
  return (
    <Panel
      component={tile.external ? "a" : Link}
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

function homeSubtitle(isAdmin: boolean, knowledgeCenterEnabled: boolean) {
  if (isAdmin) {
    return knowledgeCenterEnabled
      ? "Manage users and knowledge collections."
      : "Manage users and view system logs.";
  }

  return knowledgeCenterEnabled ? "Browse the collections shared with you." : undefined;
}

export default async function HomePage() {
  const isAdmin = await isAdminSession();
  const knowledgeCenterEnabled = isKnowledgeCenterEnabled();
  const appEnabled = isAppEnabled();

  const tiles: Tile[] = [];

  if (knowledgeCenterEnabled) {
    tiles.push({
      href: "/knowledge_center",
      title: "Knowledge Center",
      description: isAdmin
        ? "Create collections to assign knowledge to users and manage permissions."
        : "Browse the collections shared with you and upload documents where enabled.",
      action: "Browse",
      icon: <MenuBookIcon sx={ICON_SX} />,
    });
  }

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

  if (appEnabled) {
    tiles.push({
      href: APP_PATH,
      title: "App",
      description: "Chat with the shaide App.",
      action: "Open",
      icon: <AutoAwesomeOutlinedIcon sx={ICON_SX} />,
      external: true,
    });
  }

  return (
    <Box>
      <PageIntro
        title="Control Panel"
        subtitle={homeSubtitle(isAdmin, knowledgeCenterEnabled)}
        gutterBottom={32}
      />
      {tiles.length > 0 ? (
        <CardGrid>
          {tiles.map((tile) => (
            <HomeTile key={tile.href} tile={tile} />
          ))}
        </CardGrid>
      ) : (
        <EmptyState
          title="Nothing available"
          description="No control panel services are enabled for your account. Please contact your administrator."
        />
      )}
    </Box>
  );
}
