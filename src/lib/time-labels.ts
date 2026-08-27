const minuteMs = 60 * 1000;
const hourMs = 60 * minuteMs;
const dayMs = 24 * hourMs;
const weekMs = 7 * dayMs;
const monthMs = 30 * dayMs;
const yearMs = 365 * dayMs;

/**
 * Bare relative age - "16m ago", "2d ago", "recently".
 *
 * Deliberately verb-less: callers add "Updated"/"Uploaded" as the context needs.
 * Baking a verb in here rendered the file list as "Uploaded Updated 16m ago".
 */
export function getRelativeLabel(timestampIso?: string) {
  if (!timestampIso) {
    return "recently";
  }

  const parsedMs = Date.parse(timestampIso);
  if (Number.isNaN(parsedMs)) {
    return "recently";
  }

  const nowMs = Date.now();
  const diff = Math.max(0, nowMs - parsedMs);

  if (diff < hourMs) {
    const minutes = Math.max(1, Math.floor(diff / minuteMs));
    return `${minutes}m ago`;
  }

  if (diff < dayMs) {
    const hours = Math.floor(diff / hourMs);
    return `${hours}h ago`;
  }

  if (diff < weekMs) {
    const days = Math.floor(diff / dayMs);
    return `${days}d ago`;
  }

  if (diff < monthMs) {
    const weeks = Math.floor(diff / weekMs);
    return `${weeks}w ago`;
  }

  if (diff < yearMs) {
    const months = Math.floor(diff / monthMs);
    return `${months}mo ago`;
  }

  const years = Math.floor(diff / yearMs);
  return `${years}y ago`;
}

export function getDaysUntil(timestampIso: string): number | null {
  const parsedMs = Date.parse(timestampIso);
  if (Number.isNaN(parsedMs)) {
    return null;
  }
  return Math.floor((parsedMs - Date.now()) / dayMs);
}

export function isPast(timestampIso: string): boolean {
  const parsedMs = Date.parse(timestampIso);
  return !Number.isNaN(parsedMs) && parsedMs < Date.now();
}

export function getExactLabel(timestampIso?: string) {
  if (!timestampIso) {
    return "Unknown update time";
  }

  const parsedMs = Date.parse(timestampIso);
  if (Number.isNaN(parsedMs)) {
    return "Unknown update time";
  }

  const { timeZone } = new Intl.DateTimeFormat().resolvedOptions();
  return new Date(timestampIso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  });
}
