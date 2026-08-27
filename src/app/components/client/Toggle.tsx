"use client";

import { Box } from "@mui/material";

type ToggleProps = {
	isToggled: boolean;
	onToggle: () => void;
	ariaLabel?: string;
};

/**
 * Squared 44×22 switch — the design has no pill switch.
 * Mirrors the MUI `Switch` styling in `providers.tsx`.
 */
export default function Toggle({
	isToggled,
	onToggle,
	ariaLabel = "Toggle",
}: ToggleProps) {
	return (
		<Box
			role="checkbox"
			aria-checked={isToggled}
			aria-label={ariaLabel}
			onClick={onToggle}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					onToggle();
				}
			}}
			tabIndex={0}
			sx={{
				mr: 1.5,
				position: "relative",
				width: 44,
				height: 22,
				borderRadius: "var(--radius-sm)",
				backgroundColor: isToggled ? "var(--ax-accent-soft-strong)" : "var(--ax-black)",
				border: `1px solid ${isToggled ? "var(--ax-orange)" : "var(--ax-surface)"}`,
				cursor: "pointer",
				flexShrink: 0,
				transition: "background-color 150ms ease, border-color 150ms ease",
				"&:hover": { borderColor: isToggled ? "var(--ax-orange)" : "var(--ax-surface-2)" },
			}}
		>
			<Box
				sx={{
					position: "absolute",
					top: 2,
					left: isToggled ? 24 : 2,
					width: 16,
					height: 16,
					backgroundColor: isToggled ? "var(--ax-orange)" : "var(--ax-fg-muted)",
					transition: "left 150ms ease, background-color 150ms ease",
				}}
			/>
		</Box>
	);
}
