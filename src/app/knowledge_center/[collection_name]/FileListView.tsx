"use client";

import { useEffect, useMemo, useState } from "react";
import {
	Alert,
	Box,
	Button,
	Checkbox,
	FormControl,
	IconButton,
	Menu,
	MenuItem,
	OutlinedInput,
	Select,
	Tooltip,
	Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import DeleteFileDialog from "./DeleteFileDialog";
import EmptyState from "@/app/components/server/ui/EmptyState";
import Panel from "@/app/components/server/ui/Panel";
import StatusDot from "@/app/components/server/ui/StatusDot";
import Tag from "@/app/components/server/ui/Tag";
import {
	formatFileSize,
	getFileDeleteDisabledReason,
	getFileTypeLabel,
	getFileStatusColor,
	getFileStatusLabel,
	getFileStatusTone,
} from "@/lib/file-labels";
import {
	includesNormalized,
	normalizeSearchTerm,
	sortStringsAsc,
	sortStringsDesc,
	uniqueSortedStrings,
} from "@/lib/list-utils";
import { API_ROUTE_BASE } from "@/lib/api-route-base";
import { getExactLabel, getRelativeLabel } from "@/lib/time-labels";
import type { OrganizationFile } from "@/lib/collection-types";

type FileListViewProps = {
	isAdmin: boolean;
	canUsersUpload: boolean;
	files: OrganizationFile[];
	organizationId?: number;
	onFileDeleted?: () => void;
};

type SortOption = "name-asc" | "name-desc" | "uploaded-asc" | "uploaded-desc";
type TagFilterMode = "any" | "all";

const SORT_LABELS: Record<SortOption, string> = {
	"uploaded-desc": "Newest",
	"uploaded-asc": "Oldest",
	"name-asc": "Name (A-Z)",
	"name-desc": "Name (Z-A)",
};

/** Green ✓ Ready, pulsing-orange Processing, plain otherwise. */
function FileStatus({ status }: { status: string }) {
	const tone = getFileStatusTone(status);
	return (
		<Box
			component="span"
			sx={{
				display: "inline-flex",
				alignItems: "center",
				gap: tone === "processing" ? 0.75 : 0.5,
				color: getFileStatusColor(status),
			}}
		>
			{tone === "processing" && <StatusDot tone="processing" />}
			{tone === "success" && <Box component="span">✓</Box>}
			{getFileStatusLabel(status)}
		</Box>
	);
}

export default function FileListView({
	isAdmin,
	canUsersUpload,
	files,
	organizationId,
	onFileDeleted,
}: FileListViewProps) {
	// TODO: Set to true and restore tag UI controls once backend tag support is implemented.
	const isTagBackendReady = false;
	const [isHydrated, setIsHydrated] = useState(false);
	const [searchValue, setSearchValue] = useState("");
	const [sortValue, setSortValue] = useState<SortOption>("uploaded-desc");
	const [tagFilters, setTagFilters] = useState<string[]>([]);
	const [tagFilterMode, setTagFilterMode] = useState<TagFilterMode>("any");
	const [tagMenuAnchor, setTagMenuAnchor] = useState<null | HTMLElement>(null);
	const [deleteTarget, setDeleteTarget] = useState<OrganizationFile | null>(
		null
	);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const canShowDeleteAction = isAdmin || canUsersUpload;
	const tagMenuOpen = Boolean(tagMenuAnchor);

	useEffect(() => {
		setIsHydrated(true);
	}, []);

	const allFiles = useMemo(() => files, [files]);

	const getFileTags = (file: OrganizationFile) => {
		const mimeTag = file.mime_type.includes("/")
			? file.mime_type.split("/")[1]
			: file.mime_type;
		return [mimeTag.toLowerCase()];
	};

	const allTags = useMemo(() => {
		return uniqueSortedStrings(allFiles.flatMap(getFileTags));
	}, [allFiles]);

	const filteredFiles = useMemo(() => {
		const normalizedSearch = normalizeSearchTerm(searchValue);
		const matchesSearch = (name: string) => includesNormalized(name, normalizedSearch);
		const matchesTags = (tags: string[]) => {
			if (tagFilters.length === 0) {
				return true;
			}
			if (tagFilterMode === "all") {
				return tagFilters.every((tag) => tags.includes(tag));
			}
			return tagFilters.some((tag) => tags.includes(tag));
		};

		const filtered = allFiles.filter((file) => {
			return matchesSearch(file.name) && matchesTags(getFileTags(file));
		});

		return [...filtered].sort((a, b) => {
			const aMs = Date.parse(a.uploaded_at);
			const bMs = Date.parse(b.uploaded_at);
			switch (sortValue) {
				case "name-asc":
					return sortStringsAsc(a.name, b.name);
				case "name-desc":
					return sortStringsDesc(a.name, b.name);
				case "uploaded-asc":
					return aMs - bMs;
				case "uploaded-desc":
					return bMs - aMs;
				default:
					return 0;
			}
		});
	}, [allFiles, searchValue, sortValue, tagFilters, tagFilterMode]);

	const tagJoiner = tagFilterMode === "all" ? " and " : " or ";
	const tagSummary =
		tagFilters.length === 0
			? "All tags"
			: tagFilters.length <= 2
				? tagFilters.join(tagJoiner)
				: `${tagFilters.slice(0, 2).join(tagJoiner)} +${tagFilters.length - 2}`;

	const handleTagMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
		setTagMenuAnchor(event.currentTarget);
	};

	const handleTagMenuClose = () => {
		setTagMenuAnchor(null);
	};

	const handleToggleTag = (tag: string) => {
		setTagFilters((current) =>
			current.includes(tag)
				? current.filter((value) => value !== tag)
				: [...current, tag]
		);
	};

	const handleTagClick = (tag: string) => {
		handleToggleTag(tag);
	};

	const handleDeleteOpen = (file: OrganizationFile) => {
		setDeleteError(null);
		setDeleteTarget(file);
		setIsDeleteOpen(true);
	};

	const handleDeleteClose = () => {
		if (isDeleting) {
			return;
		}
		setIsDeleteOpen(false);
	};

	const handleDeleteConfirm = async () => {
		if (!organizationId || !deleteTarget?.hash) {
			setDeleteError("Missing organization or file identifier.");
			return;
		}

		setDeleteError(null);
		setIsDeleting(true);

		try {
			const response = await fetch(`${API_ROUTE_BASE}/organization-collection/file`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					organization_id: organizationId,
					file_hash: deleteTarget.hash,
				}),
			});

			const payload = (await response.json().catch(() => null)) as
				| { error?: string }
				| null;

			if (!response.ok) {
				setDeleteError(payload?.error || "Unable to delete file.");
				return;
			}

			setIsDeleteOpen(false);
			onFileDeleted?.();
		} catch {
			setDeleteError("Unable to delete file.");
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<Box sx={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
			{deleteError && <Alert severity="error">{deleteError}</Alert>}

			<Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
				<OutlinedInput
					value={searchValue}
					onChange={(event) => setSearchValue(event.target.value)}
					placeholder="Search files..."
					inputProps={{ "aria-label": "Search files" }}
					sx={{ flex: 1, minWidth: 240 }}
				/>
				<FormControl sx={{ minWidth: 180 }}>
					<Select
						value={sortValue}
						onChange={(event) => setSortValue(event.target.value as SortOption)}
						inputProps={{ "aria-label": "Sort by" }}
						renderValue={(value) => `Sort by: ${SORT_LABELS[value as SortOption]}`}
					>
						<MenuItem value="uploaded-desc">Newest</MenuItem>
						<MenuItem value="uploaded-asc">Oldest</MenuItem>
						<MenuItem value="name-asc">Name (A-Z)</MenuItem>
						<MenuItem value="name-desc">Name (Z-A)</MenuItem>
					</Select>
				</FormControl>
				{isTagBackendReady && (
					<Box sx={{ display: "flex" }}>
						<OutlinedInput
							value={tagSummary}
							onClick={handleTagMenuOpen}
							readOnly
							inputProps={{ "aria-label": "Filter tags" }}
							endAdornment={<KeyboardArrowDownIcon sx={{ fontSize: 18, marginRight: "10px" }} />}
							sx={{
								minWidth: 200,
								cursor: "pointer",
								"& input": { cursor: "pointer" },
							}}
						/>
						<Menu anchorEl={tagMenuAnchor} open={tagMenuOpen} onClose={handleTagMenuClose}>
							<Box sx={{ px: 2, py: 1 }}>
								<Typography variant="caption" color="text.secondary">
									Match
								</Typography>
								<Box sx={{ display: "flex", gap: 1, mt: 1 }}>
									<Button
										variant={tagFilterMode === "any" ? "contained" : "outlined"}
										onClick={() => setTagFilterMode("any")}
										size="small"
									>
										Any (OR)
									</Button>
									<Button
										variant={tagFilterMode === "all" ? "contained" : "outlined"}
										onClick={() => setTagFilterMode("all")}
										size="small"
									>
										All (AND)
									</Button>
								</Box>
							</Box>
							{allTags.length === 0 ? (
								<MenuItem disabled>No tags</MenuItem>
							) : (
								allTags.map((tag) => (
									<MenuItem key={tag} onClick={() => handleToggleTag(tag)}>
										<Checkbox checked={tagFilters.includes(tag)} size="small" />
										<Typography variant="body2">{tag}</Typography>
									</MenuItem>
								))
							)}
						</Menu>
					</Box>
				)}
			</Box>

			{filteredFiles.length === 0 ? (
				<EmptyState
					title="No documents"
					description="No files match your search and filters."
				/>
			) : (
				<Box sx={{ display: "grid", gap: 1.5, width: "100%", minWidth: 0 }}>
					{filteredFiles.map((file) => {
						const deleteDisabledReason = getFileDeleteDisabledReason(file.status);
						const isDeleteDisabled = deleteDisabledReason.length > 0;

						return (
							<Panel
								key={`${file.hash}-${file.uploaded_at}`}
								padding={20}
								sx={{ opacity: isDeleteDisabled ? 0.8 : 1 }}
								bodySx={{
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									gap: 2,
								}}
							>
								<Box sx={{ flex: 1, minWidth: 0 }}>
								<Typography
									variant="h6"
									component="h3"
									sx={{
										marginBottom: "8px",
										wordBreak: "break-word",
										overflowWrap: "anywhere",
									}}
								>
									{file.name}
								</Typography>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 1.5,
										flexWrap: "wrap",
										fontSize: 12,
										color: "text.secondary",
									}}
								>
									<Box component="span" title={file.mime_type}>
										{getFileTypeLabel(file.mime_type)} • {formatFileSize(file.size)}
									</Box>
									<FileStatus status={file.status} />
									<Box
										component="span"
										title={isHydrated ? getExactLabel(file.uploaded_at) : undefined}
									>
										{isHydrated
											? `Uploaded ${getRelativeLabel(file.uploaded_at)}`
											: "Uploaded --"}
									</Box>
									{isTagBackendReady && (
										<Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
											{getFileTags(file).map((tag) => (
												<Box
													key={tag}
													component="button"
													type="button"
													onClick={() => handleTagClick(tag)}
													sx={{
														background: "none",
														border: "none",
														padding: 0,
														cursor: "pointer",
													}}
												>
													<Tag>{tag}</Tag>
												</Box>
											))}
										</Box>
									)}
								</Box>
								</Box>

								{canShowDeleteAction && (
									<Tooltip
										title={isDeleteDisabled ? deleteDisabledReason : `Delete ${file.name}`}
									>
										<span>
											<IconButton
												color="inherit"
												aria-label={`Delete ${file.name}`}
												disabled={isDeleteDisabled}
												onClick={() => handleDeleteOpen(file)}
												sx={{ border: "1px solid var(--ax-surface)" }}
											>
												<DeleteOutlineIcon sx={{ fontSize: 15 }} />
											</IconButton>
										</span>
									</Tooltip>
								)}
							</Panel>
						);
					})}
				</Box>
			)}

			<DeleteFileDialog
				open={isDeleteOpen}
				fileName={deleteTarget?.name}
				onClose={handleDeleteClose}
				onConfirm={handleDeleteConfirm}
				isLoading={isDeleting}
				onExited={() => setDeleteTarget(null)}
			/>
		</Box>
	);
}
