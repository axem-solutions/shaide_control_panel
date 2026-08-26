"use client";

import { useMemo, useState } from "react";
import { Box, OutlinedInput, Typography } from "@mui/material";
import EmptyState from "@/app/components/server/ui/EmptyState";
import Tag from "@/app/components/server/ui/Tag";
import { includesNormalized, normalizeSearchTerm } from "@/lib/list-utils";
import type { Dashboard } from "@/services/fetch-dashboards";

type LogsPanelProps = {
  dashboards: Dashboard[];
};

const PANEL_SX = {
  border: "1px solid var(--ax-surface)",
  backgroundColor: "var(--ax-ink)",
} as const;

export default function LogsPanel({ dashboards }: LogsPanelProps) {
  const [search, setSearch] = useState("");
  const [selectedUid, setSelectedUid] = useState<string | null>(dashboards[0]?.uid ?? null);

  const filteredDashboards = useMemo(() => {
    const normalizedSearch = normalizeSearchTerm(search);
    return dashboards.filter((dashboard) => {
      return (
        includesNormalized(dashboard.title, normalizedSearch) ||
        dashboard.tags.some((tag) => includesNormalized(tag, normalizedSearch))
      );
    });
  }, [dashboards, search]);

  const selectedDashboard = dashboards.find((dashboard) => dashboard.uid === selectedUid) ?? null;

  if (dashboards.length === 0) {
    return (
      <EmptyState
        title="No dashboards"
        description="No dashboards were found in Grafana."
      />
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        gap: "1px",
        alignItems: "stretch",
        flexWrap: { xs: "wrap", md: "nowrap" },
      }}
    >
      <Box
        sx={{
          ...PANEL_SX,
          width: { xs: "100%", md: "20%" },
          minWidth: { md: 240 },
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Box sx={{ padding: "16px", borderBottom: "1px solid var(--ax-surface)" }}>
          <OutlinedInput
            fullWidth
            placeholder="Search dashboards"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            inputProps={{ "aria-label": "Search dashboards" }}
          />
        </Box>
        <Box sx={{ overflowY: "auto", padding: "8px", display: "grid", gap: "4px" }}>
          {filteredDashboards.length === 0 ? (
            <Typography
              variant="body2"
              sx={{ color: "var(--ax-fg-dim)", textAlign: "center", paddingBlock: "24px" }}
            >
              No dashboards match your search.
            </Typography>
          ) : (
            filteredDashboards.map((dashboard) => {
              const isSelected = dashboard.uid === selectedUid;
              return (
                <Box
                  key={dashboard.uid}
                  component="button"
                  type="button"
                  onClick={() => setSelectedUid(dashboard.uid)}
                  sx={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontFamily: "inherit",
                    border: `1px solid ${isSelected ? "var(--ax-orange)" : "transparent"}`,
                    backgroundColor: isSelected ? "var(--ax-accent-soft)" : "transparent",
                    cursor: "pointer",
                    display: "grid",
                    gap: 1,
                    transition: "border-color 150ms ease, background-color 150ms ease",
                    "&:hover": {
                      borderColor: isSelected ? "var(--ax-orange)" : "var(--ax-surface)",
                      backgroundColor: isSelected ? "var(--ax-accent-soft)" : "var(--ax-row-hover)",
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      color: isSelected ? "var(--ax-orange)" : "text.primary",
                      wordBreak: "break-word",
                    }}
                  >
                    {dashboard.title}
                  </Typography>
                  {dashboard.tags.length > 0 && (
                    <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                      {dashboard.tags.map((tag) => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </Box>
                  )}
                </Box>
              );
            })
          )}
        </Box>
      </Box>

      <Box
        sx={{
          ...PANEL_SX,
          flex: 1,
          minWidth: 0,
          minHeight: { xs: "60vh", md: 0 },
          overflow: "hidden",
          display: "flex",
        }}
      >
        {selectedDashboard ? (
          <Box
            component="iframe"
            key={selectedDashboard.uid}
            // dashboard.url already comes back fully-qualified from Grafana's
            // /api/search (root_url is configured with our proxy's full
            // sub-path — see README's "Grafana logs integration" section),
            // so it must be used as-is. Prefixing it again here would double
            // up the path and 404.
            src={`${selectedDashboard.url}?kiosk&theme=dark`}
            title={selectedDashboard.title}
            sx={{ width: "100%", height: "100%", border: "none" }}
          />
        ) : (
          <Box sx={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "center" }}>
            <EmptyState
              title="No dashboard selected"
              description="Select a dashboard to view its logs."
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
