export function normalizeSearchTerm(value?: string) {
  return (value ?? "").trim().toLowerCase();
}

export function includesNormalized(haystack: string, normalizedNeedle: string) {
  if (!normalizedNeedle) {
    return true;
  }
  return haystack.toLowerCase().includes(normalizedNeedle);
}

export function sortStringsAsc(a: string, b: string) {
  return a.localeCompare(b);
}

export function sortStringsDesc(a: string, b: string) {
  return b.localeCompare(a);
}

export function uniqueSortedStrings(values: Iterable<string>) {
  return Array.from(new Set(values)).sort(sortStringsAsc);
}
