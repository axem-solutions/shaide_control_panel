import { CONTROL_PANEL_CACHE_PREFIX } from "@/lib/api-route-base";

const IS_TRIAL_DEPLOYMENT_KEY = "shaide:is-trial-deployment";

function isControlPanelCacheName(cacheName: string) {
	const normalized = cacheName.replace(/^\/+/, "");
	return (
		normalized === CONTROL_PANEL_CACHE_PREFIX ||
		normalized.startsWith(`${CONTROL_PANEL_CACHE_PREFIX}/`) ||
		normalized.startsWith(`${CONTROL_PANEL_CACHE_PREFIX}-`) ||
		normalized.startsWith(`${CONTROL_PANEL_CACHE_PREFIX}:`)
	);
}

export async function clearClientSessionState() {
	if (typeof window === "undefined") {
		return;
	}

	try {
		window.sessionStorage.clear();
	} catch {
		// Ignore storage cleanup failures during logout/expiry handling.
	}

	if (!("caches" in window)) {
		return;
	}

	try {
		const cacheNames = await window.caches.keys();
		const ownedCacheNames = cacheNames.filter(isControlPanelCacheName);
		await Promise.all(ownedCacheNames.map((cacheName) => window.caches.delete(cacheName)));
	} catch {
		// Ignore cache cleanup failures and continue with navigation.
	}
}

export function persistClientSessionFlags(flags: { isTrial: boolean }) {
	if (typeof window === "undefined") {
		return;
	}

	try {
		window.sessionStorage.setItem(
			IS_TRIAL_DEPLOYMENT_KEY,
			flags.isTrial ? "true" : "false",
		);
	} catch {
		// Ignore storage failures and continue with navigation.
	}
}

export function getIsTrialDeployment() {
	if (typeof window === "undefined") {
		return false;
	}

	try {
		return window.sessionStorage.getItem(IS_TRIAL_DEPLOYMENT_KEY) === "true";
	} catch {
		return false;
	}
}

export function replaceWithDocumentNavigation(path: string) {
	if (typeof window === "undefined") {
		return;
	}

	window.location.replace(path);
}