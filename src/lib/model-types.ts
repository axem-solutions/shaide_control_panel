export type ModelKind = "generative" | "embedding";

export const REASONING_EFFORT_VALUES = ["none", "minimal", "low", "medium", "high", "xhigh"] as const;
export const NATIVE_FIM_MODES = ["completions_suffix", "fim_tokens"] as const;

export type InstalledModel = {
  id: number;
  kind: ModelKind;
  name: string;
  platform?: string;
  variant?: string;
  contextSize?: number;
};

export type GenerativeModelInput = {
  name: string;
  variant: string;
  chat_completions_endpoint: string;
  completions_endpoint?: string | null;
  responses_endpoint?: string | null;
  api_schema: string;
  daily_input_token_limit?: number | null;
  daily_output_token_limit?: number | null;
  supports_images?: boolean;
  reasoning_effort_values?: string[];
  max_images_per_request?: number | null;
  max_image_bytes?: number | null;
  max_image_width_px?: number | null;
  max_image_height_px?: number | null;
  max_generated_tokens: number;
  context_size: number;
  platform?: string | null;
  native_fim_mode?: "completions_suffix" | "fim_tokens" | null;
  fim_prompt_template?: string | null;
};

export type EmbeddingModelInput = {
  url: string;
  name: string;
  vector_size: number;
  platform?: string | null;
  api_schema?: string | null;
  daily_input_token_limit?: number | null;
};

export type PlatformGenerativeModel = GenerativeModelInput & {
  kind: "generative";
};

export type PlatformEmbeddingModel = EmbeddingModelInput & {
  kind: "embedding";
};

export type PlatformModel = PlatformGenerativeModel | PlatformEmbeddingModel;

export type ModelMutation =
  | { kind: "generative"; model: GenerativeModelInput }
  | { kind: "embedding"; model: EmbeddingModelInput };

export type ModelDeletion = { kind: ModelKind; id: number };
