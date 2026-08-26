import Link from "next/link";
import { Alert, Box, Typography } from "@mui/material";
import {
	getCollectionDescription,
	truncateCollectionDescription,
} from "@/lib/collection-labels";
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

export default function CollectionsPage({ collections, error, isAdmin }: CollectionsPageProps) {
	return (
		<Box sx={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
			{error && <Alert severity="warning">{error}</Alert>}

			<CardGrid>
				{collections.map((collection) => {
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
										<Box component="span" title={getExactLabel(collection.updated_at)}>
											Updated {getRelativeLabel(collection.updated_at)}
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
