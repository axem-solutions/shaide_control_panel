"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Alert, Box, FormControl, MenuItem, Select, Typography } from "@mui/material";
import {
	getCollectionDescription,
	truncateCollectionDescription,
} from "@/lib/collection-labels";
import { sortStringsAsc, sortStringsDesc } from "@/lib/list-utils";
import { getExactLabel, getRelativeLabel } from "@/lib/time-labels";
import type { OrganizationCollection } from "@/lib/collection-types";
import AccessBadge from "../components/server/ui/AccessBadge";
import ArrowLink from "../components/server/ui/ArrowLink";
import CardGrid from "../components/server/ui/CardGrid";
import Panel from "../components/server/ui/Panel";

type CollectionsPageProps = {
	collections: OrganizationCollection[];
	error?: string;
	isAdmin: boolean;
};

type SortOption = "updated-desc" | "updated-asc" | "name-asc" | "name-desc";

const SORT_LABELS: Record<SortOption, string> = {
	"updated-desc": "Recently updated",
	"updated-asc": "Least recently updated",
	"name-asc": "Name (A-Z)",
	"name-desc": "Name (Z-A)",
};

/** Unparseable timestamps sort as the epoch rather than poisoning the comparator with NaN. */
function getUpdatedMs(collection: OrganizationCollection) {
	const parsedMs = Date.parse(collection.updated_at);
	return Number.isNaN(parsedMs) ? 0 : parsedMs;
}

export default function CollectionsPage({ collections, error, isAdmin }: CollectionsPageProps) {
	// Relative/exact timestamps depend on the reader's clock and time zone, so they are
	// rendered only after hydration - the same guard the collection detail page uses.
	const [isHydrated, setIsHydrated] = useState(false);
	const [sortValue, setSortValue] = useState<SortOption>("updated-desc");

	useEffect(() => {
		setIsHydrated(true);
	}, []);

	const sortedCollections = useMemo(() => {
		return [...collections].sort((a, b) => {
			switch (sortValue) {
				case "name-asc":
					return sortStringsAsc(a.name, b.name);
				case "name-desc":
					return sortStringsDesc(a.name, b.name);
				case "updated-asc":
					return getUpdatedMs(a) - getUpdatedMs(b);
				case "updated-desc":
					return getUpdatedMs(b) - getUpdatedMs(a);
				default:
					return 0;
			}
		});
	}, [collections, sortValue]);

	return (
		<Box sx={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
			{error && <Alert severity="warning">{error}</Alert>}

			{collections.length > 1 && (
				<Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
					<FormControl sx={{ minWidth: 240 }}>
						<Select
							value={sortValue}
							onChange={(event) => setSortValue(event.target.value as SortOption)}
							inputProps={{ "aria-label": "Sort collections by" }}
							renderValue={(value) => `Sort by: ${SORT_LABELS[value as SortOption]}`}
						>
							{(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
								<MenuItem key={option} value={option}>
									{SORT_LABELS[option]}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Box>
			)}

			<CardGrid>
				{sortedCollections.map((collection) => {
					const usersCount = collection.users?.length ?? 0;
					const filesCount = collection.files?.length ?? 0;
					const documentLabel = filesCount === 1 ? "document" : "documents";
					const canUsersManageFiles = Boolean(collection.can_users_upload);
					const description = getCollectionDescription(collection.description);
					const href = `/knowledge_center/${encodeURIComponent(collection.name)}`;

					return (
						<Panel
							key={collection.id}
							component={Link}
							href={href}
							hover="accent"
							footerGap={16}
							footerPad={16}
							sx={{
								minHeight: 300,
								justifyContent: "space-between",
								textDecoration: "none",
								color: "inherit",
								"&:hover": { opacity: 1 },
							}}
							footerSx={{ display: "grid", gap: 1.5 }}
							footer={
								<>
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 1,
											fontSize: 14,
											flexWrap: "wrap",
										}}
									>
										<Box component="strong" sx={{ color: "text.primary" }}>
											{filesCount}
										</Box>
										<Box component="span" sx={{ color: "text.secondary" }}>
											{documentLabel}
										</Box>
										<AccessBadge canWrite={canUsersManageFiles} />
									</Box>
									<Typography sx={{ fontSize: 12, color: "var(--ax-fg-dim)" }}>
										<Box
											component="span"
											title={isHydrated ? getExactLabel(collection.updated_at) : undefined}
										>
											{isHydrated ? `Updated ${getRelativeLabel(collection.updated_at)}` : "Updated --"}
										</Box>
										{isAdmin && ` • ${usersCount} ${usersCount === 1 ? "user" : "users"}`}
									</Typography>
									<Box sx={{ marginTop: "8px" }}>
										<ArrowLink>Open</ArrowLink>
									</Box>
								</>
							}
						>
							<Typography
								variant="h3"
								component="h2"
								sx={{
									marginBottom: "8px",
									wordBreak: "break-word",
									overflowWrap: "anywhere",
								}}
							>
								{collection.name}
							</Typography>
							<Typography
								variant="body2"
								sx={{
									color: "var(--ax-fg-dim)",
									wordBreak: "break-word",
									overflowWrap: "anywhere",
								}}
							>
								{truncateCollectionDescription(description)}
							</Typography>
						</Panel>
					);
				})}
			</CardGrid>
		</Box>
	);
}
