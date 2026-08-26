"use client";

import { useSearchParams } from "next/navigation";
import type { AnimationEvent as ReactAnimationEvent, FormEvent } from "react";
import { Box, Button, InputAdornment, TextField, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { API_ROUTE_BASE } from "@/lib/api-route-base";
import { CONTROL_PANEL_BASE_PATH } from "@/lib/api-route-base";
import {
	persistClientSessionFlags,
	replaceWithDocumentNavigation,
} from "@/lib/client-session";
import ArrowGlyph from "@/app/components/server/ui/ArrowGlyph";
import FieldLabel from "@/app/components/server/ui/FieldLabel";
import Panel from "@/app/components/server/ui/Panel";
import LicenseKeyErrorModal from "./LicenseKeyErrorModal";
import PageHeader from "../components/client/ClientPageHeader";

type LoginState = {
	status: "idle" | "loading" | "success" | "error";
	message: string;
	authToken: string;
};

const LICENSE_KEY_FIELD_ID = "login-license-key";

export default function LoginPage() {
	const searchParams = useSearchParams();
	const usernameInputRef = useRef<HTMLInputElement>(null);
	const [username, setUsername] = useState("");
	const [hasAutofillValue, setHasAutofillValue] = useState(false);
	const [state, setState] = useState<LoginState>({
		status: "idle",
		message: "",
		authToken: "",
	});
	const [showKey, setShowKey] = useState(false);
	const [isErrorOpen, setIsErrorOpen] = useState(false);
	const [modalTitle, setModalTitle] = useState("Invalid License Key");
	const [modalDescription, setModalDescription] = useState(
		"The provided License Key is not valid.",
	);
	const isSubmitDisabled =
		state.status === "loading" || (!username && !hasAutofillValue);

	useEffect(() => {
		const syncUsernameFromInput = () => {
			const input = usernameInputRef.current;
			const nextValue = input?.value ?? "";
			setUsername((currentValue) =>
				currentValue === nextValue ? currentValue : nextValue,
			);

			let nextHasAutofill = false;
			if (input) {
				try {
					nextHasAutofill =
						input.matches(":-webkit-autofill") ||
						input.matches(":-internal-autofill-selected");
				} catch {
					nextHasAutofill = false;
				}
			}
			setHasAutofillValue((currentValue) =>
				currentValue === nextHasAutofill ? currentValue : nextHasAutofill,
			);
		};

		syncUsernameFromInput();
		const intervalId = window.setInterval(syncUsernameFromInput, 200);

		window.addEventListener("focus", syncUsernameFromInput);
		window.addEventListener("pageshow", syncUsernameFromInput);
		document.addEventListener("visibilitychange", syncUsernameFromInput);

		return () => {
			window.clearInterval(intervalId);
			window.removeEventListener("focus", syncUsernameFromInput);
			window.removeEventListener("pageshow", syncUsernameFromInput);
			document.removeEventListener("visibilitychange", syncUsernameFromInput);
		};
	}, []);

	useEffect(() => {
		const reason = searchParams.get("reason");
		if (reason === "expired") {
			setModalTitle("Session expired");
			setModalDescription(
				"You were signed out due to inactivity. Please sign in again.",
			);
			setIsErrorOpen(true);
		}
	}, [searchParams]);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const latestUsernameValue = usernameInputRef.current?.value ?? username;
		let finalUsernameValue = latestUsernameValue;
		setUsername(latestUsernameValue);

		if (!latestUsernameValue) {
			await new Promise((resolve) => window.setTimeout(resolve, 0));
			const delayedUsernameValue = usernameInputRef.current?.value ?? "";
			if (delayedUsernameValue) {
				finalUsernameValue = delayedUsernameValue;
				setUsername(delayedUsernameValue);
			}
		}

		if (!finalUsernameValue) {
			setModalTitle("Missing License Key");
			setModalDescription("Please provide your License Key to sign in.");
			setIsErrorOpen(true);
			return;
		}

		setState({ status: "loading", message: "Signing in...", authToken: "" });

		try {
			const response = await fetch(`${API_ROUTE_BASE}/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username: finalUsernameValue }),
			});

			const payload = await response.json().catch(() => ({
				error: "Invalid response.",
				auth_token: "",
			}));

			if (!response.ok || payload.error) {
				setState({
					status: "error",
					message: payload.error || "Login failed.",
					authToken: "",
				});
				setModalTitle("Invalid License Key");
				setModalDescription(payload.error || "The provided License Key is not valid.");
				setIsErrorOpen(true);
				return;
			}

			setState({
				status: "success",
				message: "Authenticated successfully.",
				authToken: payload.auth_token || "",
			});
			persistClientSessionFlags({ isTrial: Boolean(payload.is_trial) });
			replaceWithDocumentNavigation(`${CONTROL_PANEL_BASE_PATH}/home`);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			setState({
				status: "error",
				message,
				authToken: "",
			});
			setModalTitle("Invalid License Key");
			setModalDescription(message);
			setIsErrorOpen(true);
		}
	};

	const handleAutofillAnimationStart = (
		event: ReactAnimationEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		if (event.animationName === "login-autofill-start") {
			setHasAutofillValue(true);
			setUsername(event.currentTarget.value);
		}
	};

	return (
		<Box className="section-page-root">
			<LicenseKeyErrorModal
				open={isErrorOpen}
				onClose={() => {
					setIsErrorOpen(false);
					if (window.location.search.includes("reason")) {
						window.history.replaceState(null, "", window.location.pathname);
					}
				}}
				title={modalTitle}
				description={modalDescription}
			/>
			<PageHeader
				title="Login Page"
				disableLogoLink
				showLogout={false}
				showRole={false}
			/>
			<Box
				component="main"
				sx={{
					flex: 1,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					padding: "48px 24px",
				}}
			>
				<Box sx={{ width: "100%", maxWidth: 420 }}>
					<Panel
						padding={40}
						footerGap={32}
						sx={{ boxShadow: "var(--ax-shadow-card)", paddingBlock: "48px" }}
						footerSx={{ textAlign: "center" }}
						footer={
							<Typography
								sx={{ fontSize: "var(--fs-caption)", color: "var(--ax-fg-dim)", opacity: 0.7 }}
							>
								Secure. No external APIs. Runs on-premises only.
							</Typography>
						}
					>
						<Typography
							variant="h2"
							component="h1"
							sx={{ marginBottom: "24px", textAlign: "center" }}
						>
							Sign in to shaide
						</Typography>

						<Box
							sx={{
								height: "1px",
								backgroundColor: "var(--ax-surface)",
								marginBottom: "32px",
							}}
						/>

						<Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2.5 }}>
							<Box sx={{ display: "grid", gap: 1 }}>
								<FieldLabel htmlFor={LICENSE_KEY_FIELD_ID}>License Key</FieldLabel>
								<TextField
									id={LICENSE_KEY_FIELD_ID}
									inputRef={usernameInputRef}
									type={showKey ? "text" : "password"}
									defaultValue=""
									onChange={(event) => setUsername(event.target.value)}
									onInput={(event) =>
										setUsername((event.currentTarget as HTMLInputElement).value)
									}
									inputProps={{ onAnimationStart: handleAutofillAnimationStart }}
									placeholder="Enter your license key"
									autoComplete="current-password"
									fullWidth
									sx={{
										"& .MuiOutlinedInput-root": { paddingRight: 0 },
										"& .MuiOutlinedInput-input": {
											fontFamily: "var(--font-mono)",
											letterSpacing: "0.05em",
											fontSize: "var(--fs-body)",
										},
										"& input:-webkit-autofill": {
											animationName: "login-autofill-start",
											animationDuration: "0.01s",
										},
										"@keyframes login-autofill-start": { from: {}, to: {} },
									}}
									InputProps={{
										endAdornment: (
											<InputAdornment position="end" sx={{ height: "auto", maxHeight: "none", marginLeft: 0 }}>
												<Box
													component="button"
													type="button"
													onClick={() => setShowKey((prev) => !prev)}
													title={showKey ? "Hide license key" : "Show license key"}
													aria-label={showKey ? "Hide license key" : "Show license key"}
													sx={{
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														alignSelf: "stretch",
														width: 44,
														minHeight: 46,
														padding: 0,
														background: "transparent",
														border: "none",
														borderLeft: "1px solid var(--ax-surface)",
														color: "var(--ax-fg-muted)",
														fontFamily: "var(--font-mono)",
														fontSize: 10,
														fontWeight: 600,
														letterSpacing: "0.05em",
														textTransform: "uppercase",
														cursor: "pointer",
														transition: "color 150ms ease",
														"&:hover": { color: "var(--ax-fg)" },
													}}
												>
													{showKey ? "Hide" : "Show"}
												</Box>
											</InputAdornment>
										),
									}}
								/>
							</Box>

							<Box sx={{ display: "flex", justifyContent: "flex-end" }}>
								<Button type="submit" variant="contained" disabled={isSubmitDisabled}>
									{state.status === "loading" ? "Signing in..." : "Sign in"}
									<ArrowGlyph />
								</Button>
							</Box>
						</Box>
					</Panel>
				</Box>
			</Box>
		</Box>
	);
}
