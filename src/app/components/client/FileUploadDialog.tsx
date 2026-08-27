"use client";

import { useMemo, useState, type DragEvent, type ReactNode } from "react";
import {
	Alert,
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import ArrowGlyph from "@/app/components/server/ui/ArrowGlyph";
import MonoLabel from "@/app/components/server/ui/MonoLabel";
import Panel from "@/app/components/server/ui/Panel";
import StatusDot from "@/app/components/server/ui/StatusDot";
import { formatFileSize, getFileTypeLabel } from "@/lib/file-labels";

export type FileUploadResult = { ok: boolean; error?: string };

export type FileUploadDialogProps = {
	canOpen?: boolean;
	triggerLabel: string;
	dialogTitle?: string;
	acceptExtensions?: string[];
	allowedMimeTypes?: string[];
	isAllowedFile?: (file: File) => boolean;
	invalidFileErrorText?: string;
	helperText?: string;
	maxFileSize?: number | null;
	maxFileSizeErrorText?: string;
	onUpload: (file: File) => Promise<FileUploadResult>;
	onOpen?: () => void;
	onUploaded?: () => void;
	children?: ReactNode;
};

export default function FileUploadDialog({
	canOpen = true,
	triggerLabel,
	dialogTitle,
	acceptExtensions,
	allowedMimeTypes,
	isAllowedFile,
	invalidFileErrorText = "This file type is not allowed.",
	helperText,
	maxFileSize,
	maxFileSizeErrorText = "File is too large.",
	onUpload,
	onOpen,
	onUploaded,
	children,
}: FileUploadDialogProps) {
	const [open, setOpen] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [isDragActive, setIsDragActive] = useState(false);
	const [error, setError] = useState("");
	const [isUploading, setIsUploading] = useState(false);

	const acceptString = useMemo(
		() =>
			acceptExtensions && acceptExtensions.length > 0
				? acceptExtensions.map((ext) => `.${ext}`).join(",")
				: undefined,
		[acceptExtensions],
	);
	const hasSelectedFile = Boolean(selectedFile);

	if (!canOpen) {
		return null;
	}

	const defaultIsAllowedFile = (file: File) => {
		if (!acceptExtensions?.length && !allowedMimeTypes?.length) {
			return true;
		}
		const extension = file.name.split(".").pop()?.toLowerCase();
		return Boolean(
			(extension && acceptExtensions?.includes(extension)) ||
				(allowedMimeTypes && allowedMimeTypes.includes(file.type)),
		);
	};

	const resetState = () => {
		setSelectedFile(null);
		setIsDragActive(false);
		setError("");
	};

	const handleOpen = () => {
		resetState();
		onOpen?.();
		setOpen(true);
	};

	const handleClose = () => {
		setOpen(false);
	};

	const applyFileSelection = (fileList: FileList | null) => {
		if (!fileList || fileList.length === 0) {
			setSelectedFile(null);
			setError("");
			return;
		}

		if (fileList.length > 1) {
			setSelectedFile(null);
			setError("Only one file can be uploaded.");
			return;
		}

		const file = fileList[0];
		if (!(isAllowedFile ?? defaultIsAllowedFile)(file)) {
			setSelectedFile(null);
			setError(invalidFileErrorText);
			return;
		}

		if (maxFileSize != null && file.size > maxFileSize) {
			setSelectedFile(null);
			setError(maxFileSizeErrorText);
			return;
		}

		setSelectedFile(file);
		setError("");
	};

	const handleDrop = (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		setIsDragActive(false);
		applyFileSelection(event.dataTransfer.files);
	};

	const handleUpload = async () => {
		if (!selectedFile) {
			return;
		}

		setError("");
		setIsUploading(true);

		try {
			const result = await onUpload(selectedFile);
			if (!result.ok) {
				setError(result.error || "Upload failed.");
				return;
			}
			handleClose();
			onUploaded?.();
		} catch {
			setError("Upload failed.");
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<>
			<Button variant="contained" onClick={handleOpen}>
				{triggerLabel}
				<ArrowGlyph />
			</Button>
			<Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
				<DialogTitle
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						gap: 2,
					}}
				>
					{dialogTitle ?? triggerLabel}
					<IconButton
						color="inherit"
						size="small"
						onClick={handleClose}
						aria-label="Close upload dialog"
					>
						<CloseIcon sx={{ fontSize: 16 }} />
					</IconButton>
				</DialogTitle>
				<DialogContent sx={{ display: "grid", gap: 2.5 }}>
					<Box
						onDragOver={(event) => {
							event.preventDefault();
							setIsDragActive(true);
						}}
						onDragLeave={() => setIsDragActive(false)}
						onDrop={handleDrop}
						sx={{
							border: `1px dashed ${isDragActive ? "var(--ax-orange)" : "var(--ax-surface)"}`,
							backgroundColor: isDragActive ? "rgba(223,104,3,0.06)" : "var(--ax-black)",
							padding: "32px 24px",
							textAlign: "center",
							transition: "border-color 150ms ease, background-color 150ms ease",
						}}
					>
						<Box sx={{ display: "grid", gap: 1.5, justifyItems: "center" }}>
							<FileUploadIcon sx={{ fontSize: 28, color: "var(--ax-fg-dim)" }} />
							<MonoLabel spacing="wide" sx={{ color: "var(--ax-fg-muted)" }}>
								{hasSelectedFile ? "File ready for upload" : "Drag and drop a file here"}
							</MonoLabel>
							<Button component="label" variant="outlined" size="small">
								{hasSelectedFile ? "Replace file" : "Select file"}
								<input
									hidden
									type="file"
									accept={acceptString}
									onChange={(event) => applyFileSelection(event.target.files)}
								/>
							</Button>
							{helperText && (
								<Typography variant="caption" sx={{ color: "var(--ax-fg-dim)" }}>
									{helperText}
								</Typography>
							)}
						</Box>
					</Box>

					{selectedFile && (
						<Panel padding={20}>
							<Typography variant="h6" component="p" sx={{ wordBreak: "break-word" }}>
								{selectedFile.name}
							</Typography>
							<Typography variant="caption" sx={{ color: "var(--ax-fg-muted)", marginTop: "8px", display: "block" }}>
								{getFileTypeLabel(selectedFile.type)} • {formatFileSize(selectedFile.size)}
							</Typography>
						</Panel>
					)}

					{error && <Alert severity="error">{error}</Alert>}

					{isUploading && (
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<StatusDot tone="processing" />
							<Typography variant="body2" sx={{ color: "var(--ax-orange)" }}>
								Uploading…
							</Typography>
						</Box>
					)}

					{children}
				</DialogContent>
				<DialogActions>
					<Button onClick={handleClose} variant="outlined" disabled={isUploading}>
						Cancel
					</Button>
					<Button variant="contained" disabled={!selectedFile || isUploading} onClick={handleUpload}>
						{isUploading ? "Uploading…" : "Upload"}
						<ArrowGlyph />
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}
