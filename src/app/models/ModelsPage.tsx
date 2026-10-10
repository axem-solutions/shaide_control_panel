"use client";

import { useMemo, useState } from "react";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddCustomModelDialog from "./AddCustomModelDialog";
import { API_ROUTE_BASE } from "@/lib/api-route-base";
import type {
  InstalledModel,
  ModelKind,
  ModelMutation,
  PlatformModel,
} from "@/lib/model-types";
import EmptyState from "../components/server/ui/EmptyState";
import PageIntro from "../components/server/ui/PageIntro";
import Panel from "../components/server/ui/Panel";
import StatusBadge from "../components/server/ui/StatusBadge";

type Props = {
  initialInstalledModels: InstalledModel[];
  platformModels: PlatformModel[];
  initialError?: string;
  catalogError?: string;
};

type ErrorPayload = { error?: string };

async function modelRequest(method: "GET" | "POST" | "DELETE", body?: unknown) {
  const response = await fetch(`${API_ROUTE_BASE}/models`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = (await response.json().catch(() => ({}))) as ErrorPayload & {
    models?: InstalledModel[];
  };
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status}).`);
  return payload;
}

function kindLabel(kind: ModelKind) {
  return kind === "generative" ? "Generative" : "Embedding";
}

function platformKey(model: PlatformModel) {
  return `${model.kind}:${model.name}`;
}

function PlatformModelPanel({
  models,
  selectedKey,
  onSelected,
  onAdd,
  busy,
}: {
  models: PlatformModel[];
  selectedKey: string;
  onSelected: (value: string) => void;
  onAdd: () => void;
  busy: boolean;
}) {
  const selected = models.find((model) => platformKey(model) === selectedKey);

  return (
    <Panel padding={24}>
      <Box sx={{ display: "grid", gap: 2.5 }}>
        <Box>
          <Typography variant="h4" component="h2">Add from AI Platform</Typography>
          <Typography variant="body2" color="text.secondary">
            Select a model deployed by this installation.
          </Typography>
        </Box>
        {models.length ? (
          <>
            <TextField
              select
              fullWidth
              label="Available model"
              value={selectedKey}
              onChange={(event) => onSelected(event.target.value)}
            >
              {models.map((model) => (
                <MenuItem key={platformKey(model)} value={platformKey(model)}>
                  {model.name} · {kindLabel(model.kind)}
                </MenuItem>
              ))}
            </TextField>
            {selected && (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <StatusBadge tone="warning">{kindLabel(selected.kind)}</StatusBadge>
                <StatusBadge tone="neutral">{selected.platform || "AI Platform"}</StatusBadge>
                <Typography variant="body2" color="text.secondary">
                  {selected.kind === "generative"
                    ? `${selected.context_size.toLocaleString()} token context`
                    : `${selected.vector_size.toLocaleString()} dimensions`}
                </Typography>
              </Box>
            )}
            <Button variant="contained" startIcon={<AddIcon />} disabled={!selected || busy} onClick={onAdd}>
              {busy ? "Adding…" : "Add model"}
            </Button>
          </>
        ) : (
          <EmptyState
            title="No AI Platform models available"
            description="Every catalog model is already installed, or the deployment catalog is empty."
          />
        )}
      </Box>
    </Panel>
  );
}

function InstalledModelsTable({
  models,
  onDelete,
  busyKey,
}: {
  models: InstalledModel[];
  onDelete: (model: InstalledModel) => void;
  busyKey: string | null;
}) {
  return (
    <Panel padding={0}>
      {models.length ? (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Model</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Platform</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {models.map((model) => {
                const key = `${model.kind}:${model.id}`;
                return (
                  <TableRow key={key}>
                    <TableCell>
                      <Typography variant="body2">{model.name}</Typography>
                      {model.variant && model.variant !== model.name && (
                        <Typography variant="caption" color="text.secondary">{model.variant}</Typography>
                      )}
                    </TableCell>
                    <TableCell><StatusBadge tone="neutral">{kindLabel(model.kind)}</StatusBadge></TableCell>
                    <TableCell>{model.platform || "—"}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="inherit"
                        aria-label={`Remove ${model.name}`}
                        disabled={busyKey === key}
                        onClick={() => onDelete(model)}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <EmptyState title="No models installed" description="Add a model to make it available through shaide." />
      )}
    </Panel>
  );
}

export default function ModelsPage({
  initialInstalledModels,
  platformModels,
  initialError,
  catalogError,
}: Props) {
  const [installed, setInstalled] = useState(initialInstalledModels);
  const [selectedKey, setSelectedKey] = useState("");
  const [error, setError] = useState(initialError);
  const [addingPlatform, setAddingPlatform] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [addingCustom, setAddingCustom] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<InstalledModel | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const availableModels = useMemo(
    () => platformModels.filter((candidate) => !installed.some((model) => model.kind === candidate.kind && model.name === candidate.name)),
    [installed, platformModels],
  );

  const refresh = async () => {
    const payload = await modelRequest("GET");
    if (payload.models) setInstalled(payload.models);
  };

  const add = async (mutation: ModelMutation, custom: boolean) => {
    setError(undefined);
    if (custom) {
      setAddingCustom(true);
    } else {
      setAddingPlatform(true);
    }
    try {
      await modelRequest("POST", mutation);
      await refresh();
      setSelectedKey("");
      if (custom) setCustomOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to add model.");
    } finally {
      if (custom) {
        setAddingCustom(false);
      } else {
        setAddingPlatform(false);
      }
    }
  };

  const addSelected = () => {
    const selected = availableModels.find((model) => platformKey(model) === selectedKey);
    if (!selected) return;
    const { kind, ...model } = selected;
    void add({ kind, model } as ModelMutation, false);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const key = `${pendingDelete.kind}:${pendingDelete.id}`;
    setDeletingKey(key);
    setError(undefined);
    try {
      await modelRequest("DELETE", { kind: pendingDelete.kind, id: pendingDelete.id });
      setInstalled((current) => current.filter((model) => `${model.kind}:${model.id}` !== key));
      setPendingDelete(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to remove model.");
    } finally {
      setDeletingKey(null);
    }
  };

  return (
    <Box>
      <PageIntro
        title="Models"
        subtitle="Manage the models available through shaide."
        action={<Button variant="outlined" startIcon={<AddIcon />} onClick={() => { setError(undefined); setCustomOpen(true); }}>Add custom model</Button>}
      />
      <Box sx={{ display: "grid", gap: 3 }}>
        {error && <Alert severity="error">{error}</Alert>}
        {catalogError && <Alert severity="warning">{catalogError}</Alert>}
        <PlatformModelPanel
          models={availableModels}
          selectedKey={selectedKey}
          onSelected={setSelectedKey}
          onAdd={addSelected}
          busy={addingPlatform}
        />
        <Box>
          <Typography variant="h4" component="h2" sx={{ marginBottom: 2 }}>Installed models</Typography>
          <InstalledModelsTable models={installed} onDelete={setPendingDelete} busyKey={deletingKey} />
        </Box>
      </Box>

      {customOpen && <AddCustomModelDialog
        error={error}
        busy={addingCustom}
        onClose={() => setCustomOpen(false)}
        onSubmit={(mutation) => void add(mutation, true)}
      />}
      <Dialog open={Boolean(pendingDelete)} onClose={() => !deletingKey && setPendingDelete(null)}>
        <DialogTitle>Remove model?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            {pendingDelete ? `${pendingDelete.name} will no longer be available through shaide.` : ""}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingDelete(null)} disabled={Boolean(deletingKey)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => void confirmDelete()} disabled={Boolean(deletingKey)}>
            {deletingKey ? "Removing…" : "Remove model"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
