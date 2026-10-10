"use client";

import { useId, useState } from "react";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Alert, Box, Button, Checkbox, Collapse, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControl, FormControlLabel, FormHelperText, InputLabel,
  ListItemText, MenuItem, Radio, RadioGroup, Select, TextField,
} from "@mui/material";
import { parseModelMutation } from "@/lib/model-mutations";
import { NATIVE_FIM_MODES, REASONING_EFFORT_VALUES, type ModelKind, type ModelMutation } from "@/lib/model-types";
import Panel from "../components/server/ui/Panel";

const INITIAL_VALUES = {
  name: "",
  variant: "",
  endpoint: "",
  api_schema: "open_ai",
  platform: "",
  max_generated_tokens: "4096",
  context_size: "32768",
  vector_size: "768",
  completions_endpoint: "",
  responses_endpoint: "",
  daily_input_token_limit: "",
  daily_output_token_limit: "",
  max_images_per_request: "",
  max_image_bytes: "",
  max_image_width_px: "",
  max_image_height_px: "",
  native_fim_mode: "",
  fim_prompt_template: "",
};

type Field = keyof typeof INITIAL_VALUES;
const GRID = { display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 };
const FULL_WIDTH = { gridColumn: "1 / -1" };
const numberValue = (value: string) => value.trim() === "" ? null : Number(value);

export default function AddCustomModelDialog({ busy, error, onClose, onSubmit }: {
  busy: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (mutation: ModelMutation) => void;
}) {
  const [kind, setKind] = useState<ModelKind>("generative");
  const [values, setValues] = useState(INITIAL_VALUES);
  const [advanced, setAdvanced] = useState(false);
  const [supportsImages, setSupportsImages] = useState(false);
  const [reasoningEfforts, setReasoningEfforts] = useState<string[]>([]);
  const advancedId = useId();
  const reasoningLabelId = useId();
  const reasoningHelpId = useId();
  const titleId = useId();
  const set = (field: Field) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
  };

  const common = {
    name: values.name,
    api_schema: values.api_schema,
    platform: values.platform || null,
    daily_input_token_limit: numberValue(values.daily_input_token_limit),
  };
  const mutation = parseModelMutation({
    kind,
    model: kind === "generative" ? {
      ...common,
      variant: values.variant.trim() || values.name,
      chat_completions_endpoint: values.endpoint,
      completions_endpoint: values.completions_endpoint || null,
      responses_endpoint: values.responses_endpoint || null,
      max_generated_tokens: numberValue(values.max_generated_tokens),
      context_size: numberValue(values.context_size),
      daily_output_token_limit: numberValue(values.daily_output_token_limit),
      supports_images: supportsImages,
      reasoning_effort_values: reasoningEfforts,
      max_images_per_request: numberValue(values.max_images_per_request),
      max_image_bytes: numberValue(values.max_image_bytes),
      max_image_width_px: numberValue(values.max_image_width_px),
      max_image_height_px: numberValue(values.max_image_height_px),
      native_fim_mode: values.native_fim_mode || null,
      fim_prompt_template: values.fim_prompt_template || null,
    } : {
      ...common,
      url: values.endpoint,
      vector_size: numberValue(values.vector_size),
    },
  });

  const numericField = (field: Field, label: string, required = false, minimum = 1) => {
    const value = numberValue(values[field]);
    const invalid = value !== null && (!Number.isSafeInteger(value) || value < minimum);
    return (
      <TextField
        key={field} type="number" label={label} required={required} disabled={busy}
        value={values[field]} onChange={set(field)} error={invalid}
        slotProps={{ htmlInput: { min: minimum, step: 1 } }}
        helperText={invalid ? `Enter a whole number of ${minimum} or more.` : !required ? "Leave blank for no limit." : undefined}
      />
    );
  };

  return (
    <Dialog open onClose={() => !busy && onClose()} fullWidth maxWidth="md" aria-labelledby={titleId}>
      <DialogTitle id={titleId}>Add custom model</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "grid", gap: 2.5, paddingTop: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <RadioGroup row aria-label="Model type" value={kind} onChange={(event) => setKind(event.target.value as ModelKind)}>
            <FormControlLabel value="generative" control={<Radio />} label="Generative" disabled={busy} />
            <FormControlLabel value="embedding" control={<Radio />} label="Embedding" disabled={busy} />
          </RadioGroup>
          <Box sx={GRID}>
            <TextField required label="Name" value={values.name} onChange={set("name")} disabled={busy} />
            {kind === "generative" && <TextField label="Variant" placeholder="Defaults to name" value={values.variant} onChange={set("variant")} disabled={busy} />}
            <TextField
              required label={kind === "generative" ? "Chat completions endpoint" : "Embeddings endpoint"}
              value={values.endpoint} onChange={set("endpoint")} sx={FULL_WIDTH} disabled={busy}
            />
            <TextField select required label="API schema" value={values.api_schema} onChange={set("api_schema")} disabled={busy}>
              <MenuItem value="open_ai">open_ai</MenuItem>
            </TextField>
            <TextField select label="Platform" value={values.platform} onChange={set("platform")} disabled={busy}
              slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}>
              <MenuItem value="">Not specified</MenuItem>
              <MenuItem value="vertex">vertex</MenuItem>
              <MenuItem value="foundry">foundry</MenuItem>
            </TextField>
            {kind === "generative" ? <>
              {numericField("max_generated_tokens", "Max generated tokens", true)}
              {numericField("context_size", "Context size", true)}
            </> : numericField("vector_size", "Vector size", true)}
          </Box>
          <Box>
            <Button aria-expanded={advanced} aria-controls={advancedId} onClick={() => setAdvanced(!advanced)}
              endIcon={advanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}>
              Advanced settings
            </Button>
            <Collapse in={advanced} id={advancedId} mountOnEnter>
              <Panel padding={24} sx={{ marginTop: 2 }}>
                <Box sx={GRID}>
                  {numericField("daily_input_token_limit", "Daily input token limit", false, 0)}
                  {kind === "generative" && <>
                    {numericField("daily_output_token_limit", "Daily output token limit", false, 0)}
                    <TextField label="Completions endpoint" value={values.completions_endpoint} onChange={set("completions_endpoint")} disabled={busy} sx={FULL_WIDTH} />
                    <TextField label="Responses endpoint" value={values.responses_endpoint} onChange={set("responses_endpoint")} disabled={busy} sx={FULL_WIDTH} />
                    <FormControl fullWidth disabled={busy} sx={FULL_WIDTH}>
                      <InputLabel id={reasoningLabelId}>Reasoning effort</InputLabel>
                      <Select<string[]> multiple labelId={reasoningLabelId} label="Reasoning effort" value={reasoningEfforts}
                        inputProps={{ "aria-describedby": reasoningHelpId }}
                        onChange={(event) => {
                          const selected = typeof event.target.value === "string" ? event.target.value.split(",") : event.target.value;
                          setReasoningEfforts(REASONING_EFFORT_VALUES.filter((value) => selected.includes(value)));
                        }}
                        renderValue={(selected) => selected.join(", ")}>
                        {REASONING_EFFORT_VALUES.map((value) => (
                          <MenuItem key={value} value={value}>
                            <Checkbox checked={reasoningEfforts.includes(value)} tabIndex={-1} disableRipple />
                            <ListItemText primary={value} />
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText id={reasoningHelpId}>Select all supported values. Leave empty if reasoning effort is unsupported.</FormHelperText>
                    </FormControl>
                    <FormControlLabel control={<Checkbox checked={supportsImages} onChange={(event) => setSupportsImages(event.target.checked)} />}
                      label="Supports images" disabled={busy} sx={FULL_WIDTH} />
                    {numericField("max_images_per_request", "Max images per request")}
                    {numericField("max_image_bytes", "Max image size (bytes)")}
                    {numericField("max_image_width_px", "Max image width (px)")}
                    {numericField("max_image_height_px", "Max image height (px)")}
                    <TextField select label="Native FIM mode" value={values.native_fim_mode} onChange={set("native_fim_mode")} disabled={busy}
                      sx={FULL_WIDTH} slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}>
                      <MenuItem value="">Not configured</MenuItem>
                      {NATIVE_FIM_MODES.map((mode) => <MenuItem key={mode} value={mode}>{mode}</MenuItem>)}
                    </TextField>
                    <TextField multiline minRows={3} label="FIM prompt template" value={values.fim_prompt_template}
                      onChange={set("fim_prompt_template")} disabled={busy} sx={FULL_WIDTH} />
                  </>}
                </Box>
              </Panel>
            </Collapse>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" onClick={() => mutation && onSubmit(mutation)} disabled={!mutation || busy}>
          {busy ? "Adding…" : "Add model"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
