"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
	Alert,
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	IconButton,
	LinearProgress,
	MenuItem,
	Select,
	Tooltip,
	Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SettingsIcon from "@mui/icons-material/Settings";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ArrowGlyph from "../components/server/ui/ArrowGlyph";
import FieldLabel from "../components/server/ui/FieldLabel";
import { API_ROUTE_BASE } from "@/lib/api-route-base";

type EmbeddingModel = {
	id: number;
	name: string;
};

type CollectionFile = {
	status: string;
};

type CollectionInfo = {
	id: number;
	name: string;
	description: string;
	can_users_upload: boolean;
	embedding_model_id?: number;
	files?: CollectionFile[];
};

const SELECTED_EMBEDDING_MODEL_KEY = "shaide_selected_embedding_model_id";

function getStoredModelId(): number | null {
	if (typeof window === "undefined") return null;
	const stored = sessionStorage.getItem(SELECTED_EMBEDDING_MODEL_KEY);
	if (!stored) return null;
	const parsed = Number(stored);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function storeModelId(modelId: number | null) {
	if (typeof window === "undefined") return;
	if (modelId !== null && modelId > 0) {
		sessionStorage.setItem(SELECTED_EMBEDDING_MODEL_KEY, String(modelId));
	} else {
		sessionStorage.removeItem(SELECTED_EMBEDDING_MODEL_KEY);
	}
}

export function getSelectedEmbeddingModelId(): number | null {
	return getStoredModelId();
}

export function clearSelectedEmbeddingModel() {
	if (typeof window === "undefined") return;
	sessionStorage.removeItem(SELECTED_EMBEDDING_MODEL_KEY);
}

export default function GlobalSettingsDialog() {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [models, setModels] = useState<EmbeddingModel[]>([]);
	const [collections, setCollections] = useState<CollectionInfo[]>([]);
	const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
	const [initialModelId, setInitialModelId] = useState<number | null>(null);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [saveError, setSaveError] = useState<string | null>(null);

	const hasProcessingFiles = useMemo(() => {
		return collections.some((c) =>
			c.files?.some((f) => {
				const s = f.status.trim().toLowerCase();
				return s === "processing" || s === "reprocessing" || s === "uploading";
			}),
		);
	}, [collections]);

	const hasCollections = collections.length > 0;
	const isRealChange =
		initialModelId !== null &&
		selectedModelId !== null &&
		selectedModelId !== initialModelId;
	const hasChanged =
		selectedModelId !== null && selectedModelId !== initialModelId;

	useEffect(() => {
		if (!open) return;

		let cancelled = false;
		setLoading(true);
		setError(null);
		setSaveError(null);

		Promise.all([
			fetch(`${API_ROUTE_BASE}/embedding-models`).then(async (res) => {
				if (!res.ok) {
					const body = await res.json().catch(() => null);
					throw new Error(
						(body as { error?: string })?.error || `Error ${res.status}`,
					);
				}
				return res.json();
			}),
			fetch(`${API_ROUTE_BASE}/organization-collection`).then(async (res) => {
				if (!res.ok) {
					const body = await res.json().catch(() => null);
					throw new Error(
						(body as { error?: string })?.error || `Error ${res.status}`,
					);
				}
				return res.json();
			}),
		])
			.then(
				([modelsData, collectionsData]: [
					{ models?: unknown[] },
					{ collections?: CollectionInfo[] },
				]) => {
					if (cancelled) return;

					const fetchedModels: EmbeddingModel[] = Array.isArray(
						modelsData?.models,
					)
						? (modelsData.models.filter(
								(m: unknown): m is EmbeddingModel =>
									!!m &&
									typeof m === "object" &&
									typeof (m as Record<string, unknown>).id === "number" &&
									typeof (m as Record<string, unknown>).name === "string",
							) as EmbeddingModel[])
						: [];
					setModels(fetchedModels);

					const fetchedCollections: CollectionInfo[] = Array.isArray(
						collectionsData?.collections,
					)
						? collectionsData.collections
						: [];
					setCollections(fetchedCollections);

					// When collections exist, always use the first collection's
					// embedding_model_id as the source of truth.
					if (fetchedCollections.length > 0) {
						const collectionModelId =
							fetchedCollections[0].embedding_model_id ?? null;
						if (
							collectionModelId !== null &&
							fetchedModels.some((m) => m.id === collectionModelId)
						) {
							setSelectedModelId(collectionModelId);
							setInitialModelId(collectionModelId);
							storeModelId(collectionModelId);
						} else {
							setSelectedModelId(null);
							setInitialModelId(null);
						}
					} else {
						// No collections — fall back to sessionStorage
						const storedId = getStoredModelId();
						if (
							storedId !== null &&
							fetchedModels.some((m) => m.id === storedId)
						) {
							setSelectedModelId(storedId);
							setInitialModelId(storedId);
						} else {
							setSelectedModelId(null);
							setInitialModelId(null);
						}
					}
				},
			)
			.catch((err) => {
				if (!cancelled)
					setError(
						err instanceof Error ? err.message : "Failed to load data.",
					);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [open]);

	const handleSave = async () => {
		if (selectedModelId === null) return;

		setSaving(true);
		setSaveError(null);

		try {
			if (collections.length > 0) {
				const errors: string[] = [];
				for (const collection of collections) {
					try {
						const res = await fetch(
							`${API_ROUTE_BASE}/organization-collection`,
							{
								method: "PATCH",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({
									organization_id: collection.id,
									name: collection.name,
									description: collection.description ?? "",
									can_users_upload: Boolean(collection.can_users_upload),
									embedding_model_id: selectedModelId,
								}),
							},
						);

						if (!res.ok) {
							const payload = await res.json().catch(() => null);
							const msg =
								(payload as { error?: string })?.error ||
								`Failed to update collection "${collection.name}" (${res.status}).`;
							errors.push(msg);
						}
					} catch (fetchErr) {
						errors.push(
							`Network error updating "${collection.name}": ${fetchErr instanceof Error ? fetchErr.message : "unknown"}`,
						);
					}
				}

				if (errors.length > 0) {
					setSaveError(errors.join(" | "));
					return;
				}
			}

			storeModelId(selectedModelId);

			setOpen(false);
			router.refresh();
		} catch (err) {
			setSaveError(
				err instanceof Error ? err.message : "Failed to save settings.",
			);
		} finally {
			setSaving(false);
		}
	};

	const handleClose = () => {
		if (!saving) setOpen(false);
	};

	return (
		<>
			<Tooltip title="Global Settings">
				<IconButton aria-label="Global Settings" onClick={() => setOpen(true)}>
					<SettingsIcon sx={{ fontSize: 17 }} />
				</IconButton>
			</Tooltip>

			<Dialog
				open={open}
				onClose={handleClose}
				disableScrollLock
				fullWidth
				maxWidth="xs"
			>
				<DialogTitle
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						gap: 2,
					}}
				>
					Global Settings
					<IconButton color="inherit" size="small" aria-label="Close" onClick={handleClose}>
						<CloseIcon sx={{ fontSize: 16 }} />
					</IconButton>
				</DialogTitle>
				<DialogContent
					sx={{
						display: "flex",
						flexDirection: "column",
						gap: 2.5,
					}}
				>
					<Typography variant="body2" color="text.secondary">
						Configure the embedding model used across all collections.
					</Typography>

					{error && (
						<Alert severity="error">
							{error}
						</Alert>
					)}

					{saveError && (
						<Alert severity="error">
							{saveError}
						</Alert>
					)}

					{loading ? (
						<Box sx={{ py: 3 }}>
							<LinearProgress />
						</Box>
					) : (
						<>
							{!hasCollections && selectedModelId === null && (
								<Alert severity="info">
									No collections exist yet. Please select an embedding model
									before creating your first collection.
								</Alert>
							)}

							<FormControl fullWidth>
								<FieldLabel id="embedding-model-label">Embedding Model</FieldLabel>
								<Select
									id="embedding-model"
									labelId="embedding-model-label"
									displayEmpty
									sx={{ marginTop: "8px" }}
									value={selectedModelId ?? ""}
									onChange={(e) => {
										const val = e.target.value;
										setSelectedModelId(
											typeof val === "number" ? val : Number(val),
										);
									}}
									disabled={models.length === 0 || saving}
								>
									{models.map((model) => (
										<MenuItem key={model.id} value={model.id}>
											{model.name}
										</MenuItem>
									))}
									{models.length === 0 && (
										<MenuItem value="" disabled>
											No models available
										</MenuItem>
									)}
								</Select>
							</FormControl>

							{hasCollections && isRealChange && !hasProcessingFiles && (
								<Alert
									severity="warning"
									variant="outlined"
									icon={<WarningAmberIcon />}
								>
									Saving this change will reprocess all documents across
									every collection in the Knowledge Center. This may take
									some time depending on the number of documents.
								</Alert>
							)}

							{hasProcessingFiles && (
								<Alert severity="error">
									Some documents are currently being processed. The
									embedding model cannot be changed until all processing is
									complete.
								</Alert>
							)}
						</>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={handleClose} variant="outlined" disabled={saving}>
						Cancel
					</Button>
					<Button
						variant="contained"
						disabled={
							loading ||
							saving ||
							selectedModelId === null ||
							!hasChanged ||
							hasProcessingFiles
						}
						onClick={handleSave}
					>
						{saving ? "Saving…" : "Save"}
						<ArrowGlyph />
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}
