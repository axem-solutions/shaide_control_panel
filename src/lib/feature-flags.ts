import "server-only";

/** Values that switch a boolean env var on; anything else counts as off. */
const ENABLED_VALUES = new Set(["true", "1", "yes", "on"]);

/**
 * Deployment feature flags are opt-in: the installer switches a service on
 * explicitly, so an installation that does not run the backing service never
 * advertises it. Unset, empty or any unrecognised value means off.
 */
function isEnvFlagEnabled(value: string | undefined): boolean {
  const raw = value?.trim().toLowerCase();
  return raw !== undefined && ENABLED_VALUES.has(raw);
}

/** `KNOWLEDGE_CENTER_ENABLED` — whether the Knowledge Center service is installed. */
export function isKnowledgeCenterEnabled(): boolean {
  return isEnvFlagEnabled(process.env.KNOWLEDGE_CENTER_ENABLED);
}

/** `APP_ENABLED` — whether the shaide App is deployed alongside the Control Panel. */
export function isAppEnabled(): boolean {
  return isEnvFlagEnabled(process.env.APP_ENABLED);
}
