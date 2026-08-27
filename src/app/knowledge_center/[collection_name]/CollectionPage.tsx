"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import AccessBadge from "@/app/components/server/ui/AccessBadge";
import Panel from "@/app/components/server/ui/Panel";
import CreateCollectionDialog, { type CollectionUser } from "../CreateCollectionDialog";
import FileListView from "./FileListView";
import UploadDocumentDialog from "./UploadDocumentDialog";
import { API_ROUTE_BASE } from "@/lib/api-route-base";
import { getCollectionFromPayloadById, type CollectionsApiPayload } from "@/lib/collection-utils";
import { getExactLabel, getRelativeLabel } from "@/lib/time-labels";
import type { OrganizationFile } from "@/lib/collection-types";

type CollectionPageProps = {
	name: string;
	description: string;
	collectionId?: number;
	collectionFiles: OrganizationFile[];
	canUsersUpload: boolean;
	collectionUserIds: number[];
	updatedAt?: string;
	isAdmin: boolean;
	users: CollectionUser[];
	usersError?: string;
	currentAuthToken?: string;
	existingCollectionNames?: string[];
};

type LiveCollection = {
	name: string;
	description: string;
	canUsersUpload: boolean;
	userIds: number[];
	files: OrganizationFile[];
	updatedAt?: string;
};

export default function CollectionPage({
	name,
	description,
	collectionId,
	collectionFiles,
	canUsersUpload,
	collectionUserIds,
	updatedAt,
	isAdmin,
	users,
	usersError,
	currentAuthToken,
	existingCollectionNames = [],
}: CollectionPageProps) {
	const [isHydrated, setIsHydrated] = useState(false);
	const [liveCollection, setLiveCollection] = useState<LiveCollection>({
		name,
		description,
		canUsersUpload,
		userIds: collectionUserIds,
		files: collectionFiles,
		updatedAt,
	});
	const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const hadActiveFilesRef = useRef(false);

	useEffect(() => {
		setIsHydrated(true);
	}, []);

	useEffect(() => {
		setLiveCollection({
			name,
			description,
			canUsersUpload,
			userIds: collectionUserIds,
			files: collectionFiles,
			updatedAt,
		});
	}, [canUsersUpload, collectionFiles, collectionUserIds, description, name, updatedAt]);

	const refreshCollectionData = useCallback(async () => {
		if (!collectionId) {
			return;
		}

		const response = await fetch(`${API_ROUTE_BASE}/organization-collection`, {
			method: "GET",
			cache: "no-store",
		});

		if (!response.ok) {
			return;
		}

		const payload = (await response.json().catch(() => null)) as CollectionsApiPayload;
		const selected = getCollectionFromPayloadById(payload, collectionId);

		if (!selected) {
			return;
		}

		setLiveCollection({
			name: selected.name,
			description: selected.description,
			canUsersUpload: selected.can_users_upload,
			userIds: selected.users,
			files: selected.files,
			updatedAt: selected.updated_at,
		});
	}, [collectionId]);

	const stopPolling = useCallback(() => {
		if (pollTimerRef.current) {
			clearInterval(pollTimerRef.current);
			pollTimerRef.current = null;
		}
	}, []);

	const stopSettleTimer = useCallback(() => {
		if (settleTimerRef.current) {
			clearTimeout(settleTimerRef.current);
			settleTimerRef.current = null;
		}
	}, []);

	const normalizeStatus = (status: string) => status.trim().toLowerCase();

	const hasUploadingFiles = useMemo(() => {
		return liveCollection.files.some((file) => normalizeStatus(file.status) === "uploading");
	}, [liveCollection.files]);

	const hasProcessingFiles = useMemo(() => {
		return liveCollection.files.some((file) => {
			const s = normalizeStatus(file.status);
			return s === "processing" || s === "reprocessing";
		});
	}, [liveCollection.files]);

	const hasActiveFiles = hasUploadingFiles || hasProcessingFiles;

	const pollIntervalMs = hasUploadingFiles ? 1500 : hasProcessingFiles ? 10_000 : null;

	useEffect(() => {
		stopPolling();

		if (!pollIntervalMs) {
			return;
		}

		pollTimerRef.current = setInterval(() => {
			void refreshCollectionData();
		}, pollIntervalMs);

		return () => {
			stopPolling();
		};
	}, [pollIntervalMs, refreshCollectionData, stopPolling]);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const handleWindowFocus = () => {
			void refreshCollectionData();
		};

		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				void refreshCollectionData();
			}
		};

		window.addEventListener("focus", handleWindowFocus);
		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			window.removeEventListener("focus", handleWindowFocus);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [refreshCollectionData]);

	useEffect(() => {
		stopSettleTimer();

		if (hadActiveFilesRef.current && !hasActiveFiles) {
			settleTimerRef.current = setTimeout(() => {
				void refreshCollectionData();
			}, 3000);
		}

		hadActiveFilesRef.current = hasActiveFiles;

		return () => {
			stopSettleTimer();
		};
	}, [hasActiveFiles, refreshCollectionData, stopSettleTimer]);

	useEffect(() => {
		return () => {
			stopPolling();
			stopSettleTimer();
		};
	}, [stopPolling, stopSettleTimer]);

	const triggerRefresh = () => {
		void refreshCollectionData();
	};

	const filesCount = (liveCollection.files ?? []).length;
	const liveUsersCount = (liveCollection.userIds ?? []).length;
	const canShowUploadDialog = isAdmin || liveCollection.canUsersUpload;

	return (
		<Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
			<Panel
				footerGap={20}
				footerPad={20}
				sx={{ marginBottom: "32px" }}
				footerSx={{
					display: "flex",
					alignItems: "center",
					gap: 3,
					flexWrap: "wrap",
					fontSize: "var(--fs-small)",
				}}
				footer={
					<>
						<Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
							<strong>{filesCount}</strong>
							<Box component="span" sx={{ color: "text.secondary" }}>
								{filesCount === 1 ? "document" : "documents"}
							</Box>
						</Box>
						{isAdmin && (
							<Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
								<strong>{liveUsersCount}</strong>
								<Box component="span" sx={{ color: "text.secondary" }}>
									{liveUsersCount === 1 ? "user" : "users"}
								</Box>
							</Box>
						)}
						<Box
							component="span"
							sx={{ color: "text.secondary" }}
							title={isHydrated ? getExactLabel(liveCollection.updatedAt) : undefined}
						>
							{isHydrated ? `Updated ${getRelativeLabel(liveCollection.updatedAt)}` : "Updated --"}
						</Box>
						{canShowUploadDialog && (
							<Box sx={{ marginLeft: "auto" }}>
								<UploadDocumentDialog
									canOpen={canShowUploadDialog}
									organizationId={collectionId}
									onUploadStarted={triggerRefresh}
								/>
							</Box>
						)}
					</>
				}
			>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: "14px",
						marginBottom: "8px",
						flexWrap: "wrap",
					}}
				>
					<Typography
						variant="h1"
						component="h1"
						sx={{ wordBreak: "break-word", overflowWrap: "anywhere", minWidth: 0 }}
					>
						{liveCollection.name}
					</Typography>
					<AccessBadge canWrite={liveCollection.canUsersUpload} />
					{isAdmin && (
						<CreateCollectionDialog
							isAdmin={isAdmin}
							users={users}
							usersError={usersError}
							currentAuthToken={currentAuthToken}
							onSaved={triggerRefresh}
							mode="edit"
							collectionId={collectionId}
							initialName={liveCollection.name}
							initialDescription={liveCollection.description}
							initialCanUsersUpload={liveCollection.canUsersUpload}
							initialAssignedUserIds={liveCollection.userIds ?? []}
							triggerVariant="icon"
							iconAriaLabel="Collection Settings"
							existingCollectionNames={existingCollectionNames}
							hasProcessingFiles={hasProcessingFiles}
						/>
					)}
				</Box>
				<Typography
					variant="subtitle1"
					color="text.secondary"
					sx={{ lineHeight: 1.6, wordBreak: "break-word", overflowWrap: "anywhere" }}
				>
					{liveCollection.description}
				</Typography>
			</Panel>

			<FileListView
				isAdmin={isAdmin}
				canUsersUpload={liveCollection.canUsersUpload}
				files={liveCollection.files}
				organizationId={collectionId}
				onFileDeleted={triggerRefresh}
			/>
		</Box>
	);
}
