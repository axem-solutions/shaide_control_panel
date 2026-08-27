export type FileStatusTone = "success" | "processing" | "neutral";

export function getFileStatusTone(status: string): FileStatusTone {
  const normalized = status.trim().toLowerCase();
  if (normalized === "uploading" || normalized === "processing" || normalized === "reprocessing") {
    return "processing";
  }
  if (normalized === "ready" || normalized === "processed") {
    return "success";
  }
  return "neutral";
}

export function getFileStatusColor(status: string) {
  const tone = getFileStatusTone(status);
  if (tone === "processing") {
    return "var(--ax-orange)";
  }
  if (tone === "success") {
    return "var(--ax-success)";
  }
  return "var(--ax-fg-muted)";
}

export function getFileStatusLabel(status: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized === "processed") {
    return "Ready";
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

/**
 * Raw MIME types are visual noise in the file list, so map the ones we accept to
 * short uppercase labels and derive a sensible one for anything else.
 */
const MIME_TYPE_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/vnd.ms-excel": "XLS",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "application/vnd.ms-powerpoint": "PPT",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
  "application/vnd.oasis.opendocument.text": "ODT",
  "application/rtf": "RTF",
  "application/json": "JSON",
  "application/xml": "XML",
  "application/zip": "ZIP",
  "application/octet-stream": "FILE",
  "text/plain": "TXT",
  "text/markdown": "MD",
  "text/csv": "CSV",
  "text/html": "HTML",
  "image/png": "PNG",
  "image/jpeg": "JPEG",
  "image/gif": "GIF",
  "image/svg+xml": "SVG",
  "image/webp": "WEBP",
};

export function getFileTypeLabel(mimeType?: string) {
  const normalized = (mimeType ?? "").trim().toLowerCase();
  if (!normalized) {
    return "FILE";
  }

  const known = MIME_TYPE_LABELS[normalized];
  if (known) {
    return known;
  }

  // e.g. "application/vnd.custom.thing+xml; charset=utf-8" -> "THING"
  const subtype = normalized.split(";")[0].split("/").pop() ?? normalized;
  const tail = subtype.split("+")[0].split(".").pop() ?? subtype;
  const cleaned = tail.replace(/[^a-z0-9-]/g, "").toUpperCase();
  return cleaned || "FILE";
}

export function getFileDeleteDisabledReason(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "uploading") {
    return "Cannot delete a file while it is uploading.";
  }
  if (normalized === "processing" || normalized === "reprocessing") {
    return "Cannot delete a file while it is processing.";
  }
  return "";
}

export function formatFileSize(size: number | null) {
  if (size === null) {
    return "unknown size";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  const kb = size / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(1)} MB`;
}
