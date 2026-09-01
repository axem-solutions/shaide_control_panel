"use client";

import { useEffect, useState } from "react";
import type { UserRow } from "@/lib/user-types";
import { splitTextByQuery } from "@/lib/text-search";
import { getDaysUntil, getExactLabel, isPast } from "@/lib/time-labels";
import Link from "next/link";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import EmptyState from "@/app/components/server/ui/EmptyState";
import StatusBadge from "@/app/components/server/ui/StatusBadge";
import Tag from "@/app/components/server/ui/Tag";

const EXPIRY_WARNING_DAYS = 7;

function renderHighlightedValue(value: string, searchTerm?: string) {
  const parts = splitTextByQuery(value, searchTerm);

  return parts.map((part, index) => {
    return part.isMatch ? (
      <Box
        key={`${part.value}-${index}`}
        component="mark"
        sx={{
          backgroundColor: "var(--ax-highlight-bg)",
          color: "var(--ax-highlight-fg)",
          borderRadius: 0,
          fontWeight: 600,
        }}
      >
        {part.value}
      </Box>
    ) : (
      <Box key={`${part.value}-${index}`} component="span">
        {part.value}
      </Box>
    );
  });
}

export default function UsersTable({
  users,
  searchTerm,
}: {
  users: UserRow[];
  searchTerm?: string;
}) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return (
    <Box sx={{ border: "1px solid var(--ax-surface)", backgroundColor: "var(--ax-ink)" }}>
      {users.length === 0 ? (
        <EmptyState
          title="No matching users"
          description="No user matches the current search and filters."
        />
      ) : (
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table sx={{ width: "100%", tableLayout: "fixed" }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: "45%" }}>Username</TableCell>
                <TableCell sx={{ width: "30%" }}>Collections</TableCell>
                <TableCell sx={{ width: "25%" }}>Expires At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => {
                const daysUntilExpiry = u.expires_at ? getDaysUntil(u.expires_at) : null;
                const isExpired = u.expires_at ? isPast(u.expires_at) : false;
                const isExpiringSoon =
                  !isExpired && daysUntilExpiry !== null && daysUntilExpiry <= EXPIRY_WARNING_DAYS;

                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}
                      >
                        <Box
                          component="code"
                          sx={{
                            display: "inline-block",
                            padding: "6px 10px",
                            backgroundColor: "var(--ax-black)",
                            border: "1px solid var(--ax-surface)",
                            fontSize: 11,
                            letterSpacing: "0.02em",
                            wordBreak: "break-all",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {renderHighlightedValue(u.username, searchTerm)}
                        </Box>
                        {u.isCurrentAdmin && <StatusBadge tone="warning">Admin</StatusBadge>}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                        {(u.collectionNames ?? []).map((collectionName) => (
                          <Tag key={`${u.id}-${collectionName}`}>
                            <Box
                              component={Link}
                              href={`/knowledge_center/${encodeURIComponent(collectionName)}`}
                              sx={{ color: "inherit", textDecoration: "none" }}
                            >
                              {collectionName}
                            </Box>
                          </Tag>
                        ))}
                        {(u.collectionNames ?? []).length === 0 && (
                          <Typography variant="body2" sx={{ color: "var(--ax-fg-dim)" }}>
                            No collections
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {u.expires_at && isHydrated ? getExactLabel(u.expires_at) : "—"}
                        </Typography>
                        {isHydrated && isExpired && <StatusBadge tone="danger">Expired</StatusBadge>}
                        {isHydrated && isExpiringSoon && (
                          <StatusBadge tone="warning">
                            {daysUntilExpiry === 0
                              ? "Expires today"
                              : `Expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"}`}
                          </StatusBadge>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
