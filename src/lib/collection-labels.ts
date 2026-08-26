export function getCollectionDescription(description?: string) {
  const trimmed = description?.trim();
  return trimmed && trimmed.length > 0
    ? trimmed
    : "";
}

export function getCollectionNameFontSize(name: string) {
  const length = name.length || 1;
  const base = 1.35;
  const shrinkPerChar = 0.01;
  const computed = base - Math.max(0, length - 24) * shrinkPerChar;
  return `${Math.max(0.85, Math.min(base, computed))}rem`;
}

export function truncateCollectionDescription(description: string, limit = 128) {
  if (description.length <= limit) {
    return description;
  }
  return `${description.slice(0, limit).trimEnd()}...`;
}
