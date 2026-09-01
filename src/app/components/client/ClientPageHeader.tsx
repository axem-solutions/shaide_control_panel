"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import SystemUpdateAltIcon from "@mui/icons-material/SystemUpdateAlt";
import { Box, Button, IconButton, Stack, Tooltip } from "@mui/material";
import shaideLogo from "@/assets/shaide.svg";
import ExportLogsPanel from "@/app/components/client/ExportLogsDialog";
import MonoLabel from "@/app/components/server/ui/MonoLabel";
import StatusBadge from "@/app/components/server/ui/StatusBadge";
import StatusDot from "@/app/components/server/ui/StatusDot";
import { API_ROUTE_BASE } from "@/lib/api-route-base";
import { clearSelectedEmbeddingModel } from "@/app/knowledge_center/GlobalSettingsDialog";
import { CONTROL_PANEL_BASE_PATH } from "@/lib/api-route-base";
import { clearClientSessionState, replaceWithDocumentNavigation } from "@/lib/client-session";
import { getDaysUntil, getExactLabel, isPast } from "@/lib/time-labels";

const LICENSE_EXPIRY_WARNING_DAYS = 7;
const LOGO_WIDTH = 132;

export type PageHeaderProps = {
  title: string;
  showHome?: boolean;
  showLogout?: boolean;
  showRole?: boolean;
  isAdmin?: boolean;
  username?: string;
  disableLogoLink?: boolean;
  licenseExpiresAt?: string;
};

export default function PageHeader({
  title,
  showHome = false,
  showLogout = true,
  showRole = true,
  isAdmin = false,
  username,
  disableLogoLink = false,
  licenseExpiresAt,
}: PageHeaderProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [exportLogsOpen, setExportLogsOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const daysUntilLicenseExpiry = licenseExpiresAt ? getDaysUntil(licenseExpiresAt) : null;
  const isLicenseExpired = licenseExpiresAt ? isPast(licenseExpiresAt) : false;
  const isLicenseExpiringSoon =
    !isLicenseExpired &&
    daysUntilLicenseExpiry !== null &&
    daysUntilLicenseExpiry <= LICENSE_EXPIRY_WARNING_DAYS;

  const handleLogout = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch(`${API_ROUTE_BASE}/logout`, { method: "POST" });
    } catch {
      // continue even if the request fails
    }

    clearSelectedEmbeddingModel();
    await clearClientSessionState();
    replaceWithDocumentNavigation(CONTROL_PANEL_BASE_PATH);
  }, [loggingOut]);

  return (
    <Box
      component="header"
      sx={{
        width: "100%",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        flexWrap: "wrap",
        px: "var(--layout-pad-x)",
        py: "20px",
        borderBottom: "1px solid var(--ax-surface)",
        backgroundColor: "var(--ax-black)",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 0 }}>
        <Image
          src={shaideLogo}
          alt="Shaide"
          width={shaideLogo.width}
          height={shaideLogo.height}
          priority
          style={{
            width: LOGO_WIDTH,
            height: "auto",
            cursor: disableLogoLink ? "default" : "pointer",
          }}
          onClick={disableLogoLink ? undefined : () => router.push("/home")}
        />
        <Box sx={{ width: "1px", height: 18, backgroundColor: "var(--ax-line-strong)" }} />
        <MonoLabel spacing="widest" sx={{ whiteSpace: "nowrap" }}>
          {title}
        </MonoLabel>
      </Box>

      <Stack direction="row" alignItems="center" spacing={1.5}>
        {showRole && (
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              px: "4px",
              cursor: "default",
            }}
          >
            <StatusDot tone={isAdmin ? "admin" : "user"} />
            <MonoLabel spacing="wide">
              {username || (isAdmin ? "Admin" : "User")}
            </MonoLabel>
          </Box>
        )}

        {isHydrated && isLicenseExpired && licenseExpiresAt && (
          <Tooltip title={getExactLabel(licenseExpiresAt)}>
            <span>
              <StatusBadge tone="danger">License expired</StatusBadge>
            </span>
          </Tooltip>
        )}

        {isHydrated && isLicenseExpiringSoon && licenseExpiresAt && (
          <Tooltip title={getExactLabel(licenseExpiresAt)}>
            <span>
              <StatusBadge tone="warning">
                {daysUntilLicenseExpiry === 0
                  ? "License expires today"
                  : `License expires in ${daysUntilLicenseExpiry} day${daysUntilLicenseExpiry === 1 ? "" : "s"}`}
              </StatusBadge>
            </span>
          </Tooltip>
        )}

        {showHome && (
          <Tooltip title="Home">
            <IconButton component={Link} href="/home" aria-label="Go to Home">
              <HomeOutlinedIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
        )}

        {isAdmin && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => setExportLogsOpen(true)}
            title="Download logs"
            startIcon={<SystemUpdateAltIcon sx={{ fontSize: 14 }} />}
            sx={{ borderRadius: "var(--radius-chrome)" }}
          >
            <MonoLabel sx={{ color: "inherit" }}>Logs</MonoLabel>
          </Button>
        )}

        {showLogout && (
          <Tooltip title="Log out">
            <IconButton aria-label="Log out" onClick={handleLogout} disabled={loggingOut}>
              <LogoutIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {isAdmin && <ExportLogsPanel open={exportLogsOpen} onClose={() => setExportLogsOpen(false)} />}
    </Box>
  );
}
