"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  FormControl,
  MenuItem,
  OutlinedInput,
  Select,
  Switch,
  Typography,
} from "@mui/material";
import {
  includesNormalized,
  normalizeSearchTerm,
  sortStringsAsc,
} from "@/lib/list-utils";
import PageIntro from "@/app/components/server/ui/PageIntro";
import UsersTable from "./UsersTable";
import type { UserRow } from "@/lib/user-types";
import FileUploadDialog, { type FileUploadResult } from "@/app/components/client/FileUploadDialog";
import { API_ROUTE_BASE } from "@/lib/api-route-base";
import { MAX_LICENSE_FILE_SIZE_BYTES } from "@/lib/license-file";

async function uploadLicenseFile(file: File): Promise<FileUploadResult> {
  const response = await fetch(`${API_ROUTE_BASE}/license-file`, {
    method: "PUT",
    headers: { "Content-Type": "application/octet-stream" },
    body: file,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    return { ok: false, error: payload?.error || "Upload failed." };
  }

  return { ok: true };
}

type SortBy = "username" | "collections" | "expires_at";

export default function UsersTablePanel({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<SortBy>("username");
  const [search, setSearch] = useState("");
  const [showAdmin, setShowAdmin] = useState(true);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = normalizeSearchTerm(search);

    const filtered = users.filter((user) => {
      if (!showAdmin && user.isCurrentAdmin) {
        return false;
      }
      return includesNormalized(user.username, normalizedSearch);
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "collections") {
        const aCollectionsCount = a.collectionNames?.length ?? 0;
        const bCollectionsCount = b.collectionNames?.length ?? 0;

        if (bCollectionsCount !== aCollectionsCount) {
          return bCollectionsCount - aCollectionsCount;
        }

        return a.id - b.id;
      }
      if (sortBy === "expires_at") {
        if (!a.expires_at || !b.expires_at) {
          return !a.expires_at && !b.expires_at ? 0 : !a.expires_at ? 1 : -1;
        }
        return Date.parse(a.expires_at) - Date.parse(b.expires_at);
      }
      return sortStringsAsc(a.username, b.username);
    });
  }, [users, search, showAdmin, sortBy]);

  return (
    <Box>
      <PageIntro title="Users" subtitle="Manage users and collection memberships." />

      <Box
        sx={{
          display: "flex",
          gap: 2,
          marginBottom: "32px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <OutlinedInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search username..."
          inputProps={{ "aria-label": "Search username" }}
          sx={{
            flex: 1,
            minWidth: 240,
            "& .MuiOutlinedInput-input": { fontFamily: "var(--font-mono)" },
          }}
        />
        <FormControl sx={{ minWidth: 200 }}>
          <Select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortBy)}
            inputProps={{ "aria-label": "Sort by" }}
            renderValue={(value) => {
              const labels: Record<SortBy, string> = {
                username: "Username",
                collections: "Collections",
                expires_at: "Expires At",
              };
              return `Sort by: ${labels[value as SortBy]}`;
            }}
          >
            <MenuItem value="username">Username</MenuItem>
            <MenuItem value="collections">Collections</MenuItem>
            <MenuItem value="expires_at">Expires At</MenuItem>
          </Select>
        </FormControl>

        <Box
          component="label"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1.5,
            height: 46,
            paddingInline: "14px",
            border: "1px solid var(--ax-surface)",
            backgroundColor: "var(--ax-btn-ghost-bg)",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <Switch
            checked={showAdmin}
            onChange={(event) => setShowAdmin(event.target.checked)}
            inputProps={{ "aria-label": "Show admin" }}
          />
          <Typography variant="body2">Show admin</Typography>
        </Box>

        <Box sx={{ marginLeft: "auto" }}>
          <FileUploadDialog
            triggerLabel="Upload License"
            dialogTitle="Upload License File"
            helperText="Upload the license file provided for your Shaide server"
            maxFileSize={MAX_LICENSE_FILE_SIZE_BYTES}
            maxFileSizeErrorText="File size must not exceed 1 MB."
            onUpload={uploadLicenseFile}
            onUploaded={() => router.refresh()}
          />
        </Box>
      </Box>

      <UsersTable users={filteredUsers} searchTerm={search} />
    </Box>
  );
}
