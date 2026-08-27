"use client";

import {
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
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

export type DeleteFileDialogProps = {
	open: boolean;
	fileName?: string | null;
	onClose: () => void;
	onConfirm: () => void;
	isLoading?: boolean;
	onExited?: () => void;
};

export default function DeleteFileDialog({
	open,
	fileName,
	onClose,
	onConfirm,
	isLoading = false,
	onExited,
}: DeleteFileDialogProps) {
	const safeFileName = fileName ?? "this file";

	return (
		<Dialog
			open={open}
			onClose={onClose}
			fullWidth
			maxWidth="xs"
			aria-labelledby="delete-file-dialog"
			TransitionProps={{ onExited }}
		>
			<DialogTitle
				id="delete-file-dialog"
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 2,
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
					<WarningAmberIcon sx={{ fontSize: 22, color: "var(--ax-magenta)" }} />
					<Box component="span" sx={{ minWidth: 0 }}>
						Delete document
					</Box>
				</Box>
				<IconButton color="inherit" size="small" aria-label="Close" onClick={onClose}>
					<CloseIcon sx={{ fontSize: 16 }} />
				</IconButton>
			</DialogTitle>
			<DialogContent>
				<Typography variant="body2" color="text.secondary">
					This action cannot be undone. {safeFileName} will be permanently deleted.
				</Typography>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} variant="outlined" disabled={isLoading}>
					Cancel
				</Button>
				<Button
					onClick={onConfirm}
					variant="contained"
					color="error"
					disabled={isLoading}
					startIcon={<DeleteOutlineIcon sx={{ fontSize: 16 }} />}
				>
					{isLoading ? "Deleting…" : "Delete document"}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
