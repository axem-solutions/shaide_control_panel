"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
	Alert,
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	Tab,
	Tabs,
	TextField,
	Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import Toggle from "../components/client/Toggle";
import ArrowGlyph from "../components/server/ui/ArrowGlyph";
import FieldLabel from "../components/server/ui/FieldLabel";
import MonoLabel from "../components/server/ui/MonoLabel";
import RadioCard from "../components/server/ui/RadioCard";
import { API_ROUTE_BASE } from "@/lib/api-route-base";
import { getSelectedEmbeddingModelId } from "./GlobalSettingsDialog";
import type { User } from "@/lib/user-types";

export type CollectionUser = User;

const COLLECTION_NAME_PATTERN = /^[A-Za-z0-9\- ]+$/;

function getCollectionNameError(
	value: string,
	existingNames: string[],
	ownName?: string,
): string | null {
	const trimmedValue = value.trim();
	if (!trimmedValue) {
		return null;
	}

	if (!COLLECTION_NAME_PATTERN.test(trimmedValue)) {
		return "Collection name can only contain letters, numbers, spaces, and -.";
	}

	const lowerValue = trimmedValue.toLowerCase();
	const isOwnName = ownName && lowerValue === ownName.trim().toLowerCase();
	if (
		!isOwnName &&
		existingNames.some((n) => n.trim().toLowerCase() === lowerValue)
	) {
		return "A collection with this name already exists.";
	}

	return null;
}

type CreateCollectionDialogProps = {
	isAdmin: boolean;
	users: CollectionUser[];
	usersError?: string;
	currentAuthToken?: string;
	onSaved?: () => void;
	mode?: "create" | "edit";
	collectionId?: number;
	initialName?: string;
	initialDescription?: string;
	initialCanUsersUpload?: boolean;
	initialAssignedUserIds?: number[];
	hasProcessingFiles?: boolean;
	triggerVariant?: "button" | "icon";
	iconAriaLabel?: string;
	existingCollectionNames?: string[];
	fallbackEmbeddingModelId?: number;
};

export default function CreateCollectionDialog({
	isAdmin,
	users,
	usersError,
	currentAuthToken,
	onSaved,
	mode = "create",
	collectionId,
	initialName = "",
	initialDescription = "",
	initialCanUsersUpload = false,
	initialAssignedUserIds = [],
	hasProcessingFiles = false,
	triggerVariant = "button",
	iconAriaLabel = "Collection Settings",
	existingCollectionNames = [],
	fallbackEmbeddingModelId,
}: CreateCollectionDialogProps) {
	const router = useRouter();
	const nameInputRef = useRef<HTMLInputElement>(null);
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [nameError, setNameError] = useState<string | null>(null);
	const [description, setDescription] = useState("");
	const [uploadEnabled, setUploadEnabled] = useState(false);
	const [assignedUsers, setAssignedUsers] = useState<Set<number>>(() => new Set());

	const [activeTab, setActiveTab] = useState(0);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [embeddingModelId, setEmbeddingModelId] = useState<number | null>(null);
	const [hasEmbeddingModels, setHasEmbeddingModels] = useState<boolean | null>(null);
	const [isCheckingEmbeddingModels, setIsCheckingEmbeddingModels] = useState(false);

	useEffect(() => {
		if (!open) {
			return;
		}

		const previousBodyOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		return () => {
			document.body.style.overflow = previousBodyOverflow;
		};
	}, [open]);

	const sortedUsers = useMemo(() => {
		const visibleUsers = currentAuthToken
			? users.filter((user) => user.auth_token !== currentAuthToken)
			: users;
		return [...visibleUsers].sort((a, b) => a.id - b.id);
	}, [users, currentAuthToken]);

	const isEdit = mode === "edit";
	const normalizedInitialName = useMemo(() => initialName.trim(), [initialName]);
	const normalizedInitialDescription = useMemo(
		() => initialDescription.trim(),
		[initialDescription]
	);

	const hasAssignedUsersChanged = useMemo(() => {
		const safeInitialIds = initialAssignedUserIds ?? [];
		if (assignedUsers.size !== safeInitialIds.length) {
			return true;
		}

		for (const userId of safeInitialIds) {
			if (!assignedUsers.has(userId)) {
				return true;
			}
		}

		return false;
	}, [assignedUsers, initialAssignedUserIds]);

	const hasChanges = useMemo(() => {
		if (!isEdit) {
			return true;
		}

		return (
			name.trim() !== normalizedInitialName ||
			description.trim() !== normalizedInitialDescription ||
			uploadEnabled !== initialCanUsersUpload ||
			hasAssignedUsersChanged
		);
	}, [
		description,
		hasAssignedUsersChanged,
		initialCanUsersUpload,
		isEdit,
		name,
		normalizedInitialDescription,
		normalizedInitialName,
		uploadEnabled,
	]);

	if (!isAdmin) {
		return null;
	}

	const refreshEmbeddingModelsAvailability = async () => {
		setIsCheckingEmbeddingModels(true);
		try {
			const response = await fetch(`${API_ROUTE_BASE}/embedding-models`, {
				method: "GET",
				cache: "no-store",
			});

			if (!response.ok) {
				setHasEmbeddingModels(null);
				return;
			}

			const payload = (await response.json().catch(() => null)) as
				| { models?: unknown[] }
				| null;
			const models = Array.isArray(payload?.models) ? payload.models : [];
			setHasEmbeddingModels(models.length > 0);
		} catch {
			setHasEmbeddingModels(null);
		} finally {
			setIsCheckingEmbeddingModels(false);
		}
	};

	const handleToggleUser = (id: number) => {
		setAssignedUsers((current) => {
			const next = new Set(current);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	const handleOpen = () => {
		const initialCollectionName = isEdit ? initialName : "";
		setName(initialCollectionName);
		setNameError(getCollectionNameError(initialCollectionName, existingCollectionNames, isEdit ? initialName : undefined));
		setDescription(isEdit ? initialDescription : "");
		setUploadEnabled(isEdit ? initialCanUsersUpload : false);
		setAssignedUsers(new Set(isEdit ? (initialAssignedUserIds ?? []) : []));
		setActiveTab(0);
		setSubmitError(null);
		setEmbeddingModelId(getSelectedEmbeddingModelId() ?? fallbackEmbeddingModelId ?? null);
		void refreshEmbeddingModelsAvailability();
		setOpen(true);
	};
	const handleClose = () => setOpen(false);

	const handleSubmit = async () => {
		const trimmedName = name.trim();
		if (!trimmedName) {
			setNameError("Collection name is required.");
			return;
		}

		const currentNameError = getCollectionNameError(trimmedName, existingCollectionNames, isEdit ? initialName : undefined);
		if (currentNameError) {
			setNameError(currentNameError);
			return;
		}

		if (isEdit && !Number.isInteger(collectionId)) {
			setSubmitError("Missing collection id.");
			return;
		}

		setSubmitError(null);
		setIsSubmitting(true);

		try {
			if (isEdit) {
				const currentAssignedUserIds = Array.from(assignedUsers);
				const initialUserSet = new Set(initialAssignedUserIds);
				const currentUserSet = new Set(currentAssignedUserIds);

				const add_user_ids = currentAssignedUserIds.filter(
					(userId) => !initialUserSet.has(userId)
				);

				const remove_user_ids = (initialAssignedUserIds ?? []).filter(
					(userId) => !currentUserSet.has(userId)
				);

				const response = await fetch(`${API_ROUTE_BASE}/organization-collection`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						organization_id: collectionId,
						name: trimmedName,
						description: description.trim(),
						can_users_upload: uploadEnabled,
						add_user_ids,
						remove_user_ids,
					}),
				});

				const payload = (await response.json().catch(() => null)) as
					| { error?: string }
					| null;

				if (!response.ok) {
					setSubmitError(payload?.error || "Unable to update collection.");
					return;
				}

				handleClose();

				const nameChanged = trimmedName !== normalizedInitialName;
				if (nameChanged) {
					router.push(`/knowledge_center/${encodeURIComponent(trimmedName)}`);
					router.refresh();
				} else {
					onSaved?.();
					router.refresh();
				}
				return;
			}

			const response = await fetch(`${API_ROUTE_BASE}/organization-collection`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					organization_name: trimmedName,
					organization_description: description.trim(),
					users: Array.from(assignedUsers),
					can_users_upload: uploadEnabled,
					embedding_model_id: embeddingModelId,
				}),
			});

			const payload = (await response.json().catch(() => null)) as
				| { error?: string }
				| null;

			if (!response.ok) {
				setSubmitError(payload?.error || "Unable to create collection.");
				return;
			}

			handleClose();
			onSaved?.();
			router.refresh();
		} catch {
			setSubmitError("Unable to create collection.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteCollection = async () => {
		if (!isEdit) {
			return;
		}

		if (!Number.isInteger(collectionId)) {
			setSubmitError("Missing collection id.");
			return;
		}

		setSubmitError(null);
		setIsSubmitting(true);

		try {
			const response = await fetch(`${API_ROUTE_BASE}/organization-collection`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: collectionId }),
			});

			const payload = (await response.json().catch(() => null)) as
				| { error?: string }
				| null;

			if (!response.ok) {
				setSubmitError(payload?.error || "Unable to delete collection.");
				return;
			}

			handleClose();
			router.push("/knowledge_center");
			router.refresh();
		} catch {
			setSubmitError("Unable to delete collection.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const triggerElement =
		triggerVariant === "icon" ? (
			<Button
				variant="outlined"
				size="small"
				onClick={handleOpen}
				title={iconAriaLabel}
				aria-label={iconAriaLabel}
				startIcon={<SettingsOutlinedIcon sx={{ fontSize: 14 }} />}
				sx={{ borderRadius: "var(--radius-chrome)", flexShrink: 0 }}
			>
				<MonoLabel sx={{ color: "inherit" }}>Settings</MonoLabel>
			</Button>
		) : (
			<Button variant="contained" onClick={handleOpen}>
				{isEdit ? iconAriaLabel : "New Collection"}
				<ArrowGlyph />
			</Button>
		);

	const hasNoEmbeddingModels = hasEmbeddingModels === false;
	const isCreateMissingEmbeddingModelSelection = !isEdit && embeddingModelId === null;
	const isEditBlockedByProcessingFiles = isEdit && hasProcessingFiles;
	const isSaveDisabled =
		!name.trim() ||
		Boolean(nameError) ||
		isSubmitting ||
		isCheckingEmbeddingModels ||
		hasNoEmbeddingModels ||
		isEditBlockedByProcessingFiles ||
		(isEdit && !hasChanges) ||
		isCreateMissingEmbeddingModelSelection;

	return (
		<>
			{triggerElement}
			<Dialog
				open={open}
				onClose={handleClose}
				disableScrollLock
				TransitionProps={{
					onEntered: () => {
						nameInputRef.current?.focus();
					},
				}}
				fullWidth
				maxWidth="sm"
				PaperProps={{
					sx: {
						height: "min(85vh, 700px)",
						maxHeight: "85vh",
						display: "flex",
						flexDirection: "column",
					},
				}}
			>
				<DialogTitle
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						gap: 2,
					}}
				>
					{isEdit ? iconAriaLabel : "New collection"}
					<IconButton color="inherit" size="small" aria-label="Close" onClick={handleClose}>
						<CloseIcon sx={{ fontSize: 16 }} />
					</IconButton>
				</DialogTitle>
				<Tabs
					value={activeTab}
					onChange={(_, nextValue) => setActiveTab(nextValue)}
					sx={{ paddingInline: "28px" }}
				>
					<Tab label="General" />
					<Tab label="Assign Users" />
					{isEdit && <Tab label="Danger Zone" />}
				</Tabs>
				<DialogContent
					sx={{
						flex: 1,
						minHeight: 0,
						display: "flex",
						flexDirection: "column",
						gap: 2.75,
						overflow: "auto",
					}}
				>
					{submitError && <Alert severity="error">{submitError}</Alert>}
					{hasNoEmbeddingModels && (
						<Alert severity="error">
							You cannot {isEdit ? "edit" : "create"} collections without an embedding model.
						</Alert>
					)}
					{!hasNoEmbeddingModels && !isEdit && embeddingModelId === null && (
						<Alert severity="warning">
							An embedding model must be selected in Global Settings before creating a collection.
						</Alert>
					)}
					{isEditBlockedByProcessingFiles && (
						<Alert severity="error">
							You cannot edit this collection while files are processing.
						</Alert>
					)}

					{activeTab === 0 && (
						<Box sx={{ display: "grid", gap: 2.75 }}>
							<Box sx={{ display: "grid", gap: 1 }}>
								<FieldLabel htmlFor="collection-name">Name</FieldLabel>
								<TextField
									id="collection-name"
									inputRef={nameInputRef}
									required
									value={name}
									onChange={(event) => {
										const nextName = event.target.value;
										const nextNameError = getCollectionNameError(nextName, existingCollectionNames, isEdit ? initialName : undefined);
										setName(nextName);
										setNameError(nextNameError);
									}}
									placeholder="e.g. Flight Software Specs"
									fullWidth
									error={Boolean(nameError)}
									helperText={nameError ?? " "}
								/>
							</Box>

							<Box sx={{ display: "grid", gap: 1 }}>
								<FieldLabel htmlFor="collection-description">Description</FieldLabel>
								<TextField
									id="collection-description"
									value={description}
									onChange={(event) => setDescription(event.target.value)}
									placeholder="What this collection contains."
									fullWidth
									multiline
									minRows={3}
								/>
							</Box>

							<Box sx={{ display: "grid", gap: 1 }}>
								<FieldLabel>Default access</FieldLabel>
								<Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap" }}>
									<RadioCard
										name="collection-access"
										selected={!uploadEnabled}
										onSelect={() => setUploadEnabled(false)}
										title="Read-only"
										hint="Members can view"
									/>
									<RadioCard
										name="collection-access"
										selected={uploadEnabled}
										onSelect={() => setUploadEnabled(true)}
										title="Read-write"
										hint="Members can upload"
									/>
								</Box>
							</Box>
						</Box>
					)}

					{activeTab === 1 && (
						<Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, flex: 1, minHeight: 0 }}>
							<Typography variant="body2" color="text.secondary">
								Toggle who can access this collection.
							</Typography>
							{usersError && <Alert severity="warning">{usersError}</Alert>}
							<Box
								sx={{
									flex: 1,
									minHeight: 0,
									overflowY: "auto",
									border: "1px solid var(--ax-surface)",
									backgroundColor: "var(--ax-black)",
								}}
							>
								{sortedUsers.map((user) => (
									<Box
										key={user.id}
										sx={{
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between",
											gap: 2,
											padding: "12px 16px",
											borderBottom: "1px solid var(--ax-surface)",
											"&:last-of-type": { borderBottom: "none" },
										}}
									>
										<Box
											component="code"
											sx={{ fontSize: 12, wordBreak: "break-all", minWidth: 0 }}
										>
											{user.auth_token || "No token"}
										</Box>
										<Toggle
											isToggled={assignedUsers.has(user.id)}
											onToggle={() => handleToggleUser(user.id)}
											ariaLabel={`Toggle access for user ${user.id}`}
										/>
									</Box>
								))}
								{sortedUsers.length === 0 && !usersError && (
									<Box sx={{ padding: "16px" }}>
										<Typography variant="body2" sx={{ color: "var(--ax-fg-dim)" }}>
											No users available.
										</Typography>
									</Box>
								)}
							</Box>
						</Box>
					)}

					{isEdit && activeTab === 2 && (
						<Box
							sx={{
								border: "1px solid var(--ax-magenta)",
								backgroundColor: "var(--ax-danger-soft)",
								padding: "20px",
								display: "grid",
								gap: 1.5,
								justifyItems: "start",
							}}
						>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
								<WarningAmberIcon sx={{ fontSize: 20, color: "var(--ax-magenta)" }} />
								<Typography sx={{ color: "var(--ax-magenta)", fontWeight: 600 }}>
									Delete Collection
								</Typography>
							</Box>
							<Typography variant="body2" color="text.secondary">
								This action cannot be undone. All documents will be permanently deleted.
							</Typography>
							<Button
								variant="contained"
								color="error"
								startIcon={<DeleteOutlineIcon sx={{ fontSize: 16 }} />}
								onClick={handleDeleteCollection}
								disabled={isSubmitting || !Number.isInteger(collectionId)}
							>
								{isSubmitting ? "Deleting…" : "Delete Collection"}
							</Button>
						</Box>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={handleClose} variant="outlined" disabled={isSubmitting}>
						Cancel
					</Button>
					<Button variant="contained" disabled={isSaveDisabled} onClick={handleSubmit}>
						{isSubmitting ? (isEdit ? "Saving…" : "Creating…") : isEdit ? "Save Changes" : "Create collection"}
						<ArrowGlyph />
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}
