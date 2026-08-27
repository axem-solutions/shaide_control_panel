import "server-only";

const ENABLED_VALUES = new Set(["true", "1", "yes", "on"]);

export function isKnowledgeCenterEnabled(): boolean {
  const raw = process.env.CONTROL_PANEL_ENABLED?.trim().toLowerCase();
  return raw !== undefined && ENABLED_VALUES.has(raw);
}
