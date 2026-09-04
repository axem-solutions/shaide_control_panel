import "server-only";

const ENABLED_VALUES = new Set(["true", "1", "yes", "on"]);

export function isKnowledgeCenterEnabled(): boolean {
  const raw = process.env.KNOWLEDGE_CENTER_ENABLED?.trim().toLowerCase();
  return raw !== undefined && ENABLED_VALUES.has(raw);
}
