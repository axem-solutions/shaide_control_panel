export type HighlightedPart = {
  value: string;
  isMatch: boolean;
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function splitTextByQuery(text: string, query?: string): HighlightedPart[] {
  const normalizedQuery = query?.trim();
  if (!normalizedQuery) {
    return [{ value: text, isMatch: false }];
  }

  const safeQuery = escapeRegExp(normalizedQuery);
  const regex = new RegExp(`(${safeQuery})`, "ig");

  return text
    .split(regex)
    .filter((part) => part.length > 0)
    .map((part) => ({
      value: part,
      isMatch: part.toLowerCase() === normalizedQuery.toLowerCase(),
    }));
}
