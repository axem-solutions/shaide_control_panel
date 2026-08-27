"use client";

import { useState } from "react";
import { Box, IconButton, TextField, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import FieldLabel from "@/app/components/server/ui/FieldLabel";
import { API_ROUTE_BASE } from "@/lib/api-route-base";
import { getIsTrialDeployment } from "@/lib/client-session";
import FileUploadDialog, { type FileUploadResult } from "@/app/components/client/FileUploadDialog";

const ALLOWED_EXTENSIONS = [
	"pdf",
	"docx",
];
const ALLOWED_MIME_TYPES = [
	"application/pdf",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const BASE_TAGS = ["API", "Guide", "Release", "FAQ"];

const TRIAL_MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

type UploadDocumentDialogProps = {
	canOpen: boolean;
	organizationId?: number;
	onUploadStarted?: () => void;
};

export default function UploadDocumentDialog({
	canOpen,
	organizationId,
	onUploadStarted,
}: UploadDocumentDialogProps) {
	// TODO: Set to true and restore upload tag UI once backend tag support is implemented.
	const isTagBackendReady = false;
	// TODO: Set to true and restore upload notes UI once backend notes support is implemented.
	const isNotesBackendReady = false;
	const [selectedTags, setSelectedTags] = useState<Set<string>>(() => new Set());
	const [tags, setTags] = useState(BASE_TAGS);
	const [addingTag, setAddingTag] = useState(false);
	const [newTag, setNewTag] = useState("");
	const [notes, setNotes] = useState("");
	const [isTrialDeployment] = useState(() => getIsTrialDeployment());
	const isTagReady = Boolean(newTag.trim());
	const maxFileSize = isTrialDeployment ? TRIAL_MAX_FILE_SIZE : null;

	if (!canOpen) {
		return null;
	}

	const resetTagState = () => {
		setSelectedTags(new Set());
		setAddingTag(false);
		setNewTag("");
		setNotes("");
	};

	const handleToggleTag = (tag: string) => {
		setSelectedTags((current) => {
			const next = new Set(current);
			if (next.has(tag)) {
				next.delete(tag);
			} else {
				next.add(tag);
			}
			return next;
		});
	};

	const handleAddTag = () => {
		const trimmed = newTag.trim();
		if (!trimmed) {
			return;
		}

		if (!tags.includes(trimmed)) {
			setTags((current) => [...current, trimmed]);
		}
		setSelectedTags((current) => new Set(current).add(trimmed));
		setAddingTag(false);
		setNewTag("");
	};

	const handleUpload = async (file: File): Promise<FileUploadResult> => {
		if (!organizationId) {
			return { ok: false, error: "Missing organization id." };
		}

		try {
			const presignedResponse = await fetch(`${API_ROUTE_BASE}/object-storage/presigned-url`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					organization_id: organizationId,
					file_name: file.name,
					content_type: file.type || "application/octet-stream",
				}),
			});

			const presignedPayload = (await presignedResponse.json().catch(() => null)) as
				| { presigned_url?: string; error?: string }
				| null;

			if (!presignedResponse.ok || !presignedPayload?.presigned_url) {
				return { ok: false, error: presignedPayload?.error || "Unable to get upload url." };
			}

			onUploadStarted?.();

			const uploadResponse = await fetch(presignedPayload.presigned_url, {
				method: "PUT",
				headers: {
					"Content-Type": file.type || "application/octet-stream",
				},
				body: file,
			});

			if (!uploadResponse.ok) {
				return { ok: false, error: "Upload failed." };
			}

			return { ok: true };
		} catch {
			return { ok: false, error: "Upload failed." };
		}
	};

	return (
		<FileUploadDialog
			canOpen={canOpen}
			triggerLabel="Upload Document"
			acceptExtensions={ALLOWED_EXTENSIONS}
			allowedMimeTypes={ALLOWED_MIME_TYPES}
			invalidFileErrorText="Only PDF or DOCX files are allowed."
			helperText={
				isTrialDeployment ? "Upload a PDF or DOCX file up to 20 MB" : "Upload a PDF or DOCX file"
			}
			maxFileSize={maxFileSize}
			maxFileSizeErrorText="File size must not exceed 20 MB on trial deployments."
			onUpload={handleUpload}
			onOpen={resetTagState}
		>
			{isTagBackendReady && (
				<Box sx={{ display: "grid", gap: 1 }}>
					<FieldLabel>Tags (optional)</FieldLabel>
					<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
						{tags.map((tag) => {
							const isSelected = selectedTags.has(tag);
							return (
								<Box
									key={tag}
									component="button"
									type="button"
									onClick={() => handleToggleTag(tag)}
									sx={{
										display: "inline-flex",
										alignItems: "center",
										gap: 0.5,
										padding: "4px 10px",
										borderRadius: "var(--radius-sm)",
										border: `1px solid ${isSelected ? "var(--ax-orange)" : "var(--ax-surface)"}`,
										backgroundColor: isSelected ? "var(--ax-accent-soft)" : "var(--ax-tag-bg)",
										color: isSelected ? "var(--ax-orange)" : "var(--ax-fg)",
										fontFamily: "inherit",
										fontSize: 12,
										fontWeight: 500,
										cursor: "pointer",
										transition: "border-color 150ms ease, background-color 150ms ease",
										"&:hover": { borderColor: "var(--ax-orange)" },
									}}
								>
									{isSelected && <CheckIcon sx={{ fontSize: 13 }} />}
									{tag}
								</Box>
							);
						})}
						{addingTag ? (
							<TextField
								autoFocus
								value={newTag}
								onChange={(event) => setNewTag(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === "Enter") {
										event.preventDefault();
										handleAddTag();
									}
								}}
								onBlur={() => {
									if (!newTag.trim()) {
										setAddingTag(false);
										setNewTag("");
									}
								}}
								placeholder="New tag"
								sx={{ width: 160 }}
								InputProps={{
									endAdornment: (
										<Tooltip title={isTagReady ? "Confirm tag" : "Enter a tag to confirm"}>
											<span>
												<IconButton
													color="inherit"
													size="small"
													aria-label="Confirm new tag"
													onClick={handleAddTag}
													disabled={!isTagReady}
												>
													<CheckIcon sx={{ fontSize: 15 }} />
												</IconButton>
											</span>
										</Tooltip>
									),
								}}
							/>
						) : (
							<Tooltip title="Add tag">
								<IconButton
									color="inherit"
									onClick={() => setAddingTag(true)}
									aria-label="Add tag"
									sx={{ border: "1px dashed var(--ax-surface)" }}
								>
									<AddIcon sx={{ fontSize: 16 }} />
								</IconButton>
							</Tooltip>
						)}
					</Box>
				</Box>
			)}
			{isNotesBackendReady && (
				<Box sx={{ display: "grid", gap: 1 }}>
					<FieldLabel htmlFor="upload-notes">Notes (optional)</FieldLabel>
					<TextField
						id="upload-notes"
						value={notes}
						onChange={(event) => setNotes(event.target.value)}
						placeholder="Anything worth recording about this document."
						fullWidth
						multiline
						minRows={3}
					/>
				</Box>
			)}
		</FileUploadDialog>
	);
}
