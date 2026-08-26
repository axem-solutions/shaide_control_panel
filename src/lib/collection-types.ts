export type OrganizationFileStatus = "uploading" | "processing" | "reprocessing" | "ready" | "failed" | string;

export type OrganizationFile = {
  hash: string;
  name: string;
  size: number | null;
  mime_type: string;
  status: OrganizationFileStatus;
  uploaded_at: string;
};

export type OrganizationCollection = {
  id: number;
  name: string;
  description: string;
  can_users_upload: boolean;
  embedding_model_id?: number;
  users: number[];
  files: OrganizationFile[];
  created_at: string;
  updated_at: string;
};
