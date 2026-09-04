"use client";

import { useSearchParams } from "next/navigation";
import type { AnimationEvent as ReactAnimationEvent, FormEvent } from "react";
import { Box, Button, InputAdornment, TextField, Typography } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import { API_ROUTE_BASE } from "@/lib/api-route-base";
import { CONTROL_PANEL_BASE_PATH } from "@/lib/api-route-base";
import {
	persistClientSessionFlags,
	replaceWithDocumentNavigation,
} from "@/lib/client-session";
import ArrowGlyph from "@/app/components/server/ui/ArrowGlyph";
import FieldLabel from "@/app/components/server/ui/FieldLabel";
import Panel from "@/app/components/server/ui/Panel";
import LoginErrorModal from "./LoginErrorModal";
import PageHeader from "../components/client/ClientPageHeader";

type LoginState = {
	status: "idle" | "loading" | "success" | "error";
	message: string;
};

const USERNAME_FIELD_ID = "login-username";
const PASSWORD_FIELD_ID = "login-password";

export default function LoginPage() {
	const searchParams = useSearchParams();
	const usernameInputRef = useRef<HTMLInputElement>(null);
	const passwordInputRef = useRef<HTMLInputElement>(null);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [hasAutofillValue, setHasAutofillValue] = useState(false);
	const [state, setState] = useState<LoginState>({
		status: "idle",
		message: "",
	});
	const [showPassword, setShowPassword] = useState(false);
	const [isErrorOpen, setIsErrorOpen] = useState(false);
	const [modalTitle, setModalTitle] = useState("Sign-in failed");
	const [modalDescription, setModalDescription] = useState(
		"Invalid username or password.",
	);
	const isSubmitDisabled =
		state.status === "loading" || ((!username || !password) && !hasAutofillValue);

	useEffect(() => {
		const syncFieldsFromInputs = () => {
			const usernameInput = usernameInputRef.current;
			const passwordInput = passwordInputRef.current;

			const nextUsername = usernameInput?.value ?? "";
			setUsername((currentValue) =>
				currentValue === nextUsername ? currentValue : nextUsername,
			);

			const nextPassword = passwordInput?.value ?? "";
			setPassword((currentValue) =>
				currentValue === nextPassword ? currentValue : nextPassword,
			);

			let nextHasAutofill = false;
			for (const input of [usernameInput, passwordInput]) {
				if (!input) {
					continue;
				}

				try {
					nextHasAutofill =
						nextHasAutofill ||
						input.matches(":-webkit-autofill") ||
						input.matches(":-internal-autofill-selected");
				} catch {
					// Selector unsupported in this browser; fall back to the values above.
				}
			}
			setHasAutofillValue((currentValue) =>
				currentValue === nextHasAutofill ? currentValue : nextHasAutofill,
			);
		};

		syncFieldsFromInputs();
		const intervalId = window.setInterval(syncFieldsFromInputs, 200);

		window.addEventListener("focus", syncFieldsFromInputs);
		window.addEventListener("pageshow", syncFieldsFromInputs);
		document.addEventListener("visibilitychange", syncFieldsFromInputs);

		return () => {
			window.clearInterval(intervalId);
			window.removeEventListener("focus", syncFieldsFromInputs);
			window.removeEventListener("pageshow", syncFieldsFromInputs);
			document.removeEventListener("visibilitychange", syncFieldsFromInputs);
		};
	}, []);

	useEffect(() => {
		const reason = searchParams.get("reason");
		if (reason === "expired") {
			setModalTitle("Session expired");
			setModalDescription(
				"You were signed out because your session ended. Please sign in again.",
			);
			setIsErrorOpen(true);
		}
	}, [searchParams]);

	const showError = useCallback((title: string, description: string) => {
		setModalTitle(title);
		setModalDescription(description);
		setIsErrorOpen(true);
	}, []);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		let finalUsername = usernameInputRef.current?.value ?? username;
		let finalPassword = passwordInputRef.current?.value ?? password;

		if (!finalUsername || !finalPassword) {
			await new Promise((resolve) => window.setTimeout(resolve, 0));
			finalUsername = usernameInputRef.current?.value ?? finalUsername;
			finalPassword = passwordInputRef.current?.value ?? finalPassword;
		}

		setUsername(finalUsername);
		setPassword(finalPassword);

		if (!finalUsername || !finalPassword) {
			showError(
				"Missing credentials",
				"Please provide both your username and password to sign in.",
			);
			return;
		}

		setState({ status: "loading", message: "Signing in..." });

		try {
			const response = await fetch(`${API_ROUTE_BASE}/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username: finalUsername, password: finalPassword }),
			});

			const payload = await response.json().catch(() => ({
				error: "Invalid response.",
			}));

			if (!response.ok || payload.error) {
				const message = payload.error || "Login failed.";
				setState({ status: "error", message });
				showError("Sign-in failed", message);
				return;
			}

			setState({ status: "success", message: "Authenticated successfully." });
			persistClientSessionFlags({ isTrial: Boolean(payload.is_trial) });
			replaceWithDocumentNavigation(`${CONTROL_PANEL_BASE_PATH}/home`);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			setState({ status: "error", message });
			showError("Sign-in failed", message);
		}
	};

	const handleAutofillAnimationStart = (
		event: ReactAnimationEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		if (event.animationName === "login-autofill-start") {
			setHasAutofillValue(true);
			setUsername(usernameInputRef.current?.value ?? "");
			setPassword(passwordInputRef.current?.value ?? "");
		}
	};

	const autofillSx = {
		"& input:-webkit-autofill": {
			animationName: "login-autofill-start",
			animationDuration: "0.01s",
		},
		"@keyframes login-autofill-start": { from: {}, to: {} },
	} as const;

	return (
		<Box className="section-page-root">
			<LoginErrorModal
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
								<FieldLabel htmlFor={USERNAME_FIELD_ID}>Username</FieldLabel>
								<TextField
									id={USERNAME_FIELD_ID}
									inputRef={usernameInputRef}
									type="text"
									defaultValue=""
									onChange={(event) => setUsername(event.target.value)}
									onInput={(event) =>
										setUsername((event.currentTarget as HTMLInputElement).value)
									}
									inputProps={{ onAnimationStart: handleAutofillAnimationStart }}
									placeholder="Enter your username"
									autoComplete="username"
									fullWidth
									sx={autofillSx}
								/>
							</Box>

							<Box sx={{ display: "grid", gap: 1 }}>
								<FieldLabel htmlFor={PASSWORD_FIELD_ID}>Password</FieldLabel>
								<TextField
									id={PASSWORD_FIELD_ID}
									inputRef={passwordInputRef}
									type={showPassword ? "text" : "password"}
									defaultValue=""
									onChange={(event) => setPassword(event.target.value)}
									onInput={(event) =>
										setPassword((event.currentTarget as HTMLInputElement).value)
									}
									inputProps={{ onAnimationStart: handleAutofillAnimationStart }}
									placeholder="Enter your password"
									autoComplete="current-password"
									fullWidth
									sx={{
										"& .MuiOutlinedInput-root": { paddingRight: 0 },
										"& .MuiOutlinedInput-input": {
											fontFamily: "var(--font-mono)",
											letterSpacing: "0.05em",
											fontSize: "var(--fs-body)",
										},
										...autofillSx,
									}}
									InputProps={{
										endAdornment: (
											<InputAdornment position="end" sx={{ height: "auto", maxHeight: "none", marginLeft: 0 }}>
												<Box
													component="button"
													type="button"
													onClick={() => setShowPassword((prev) => !prev)}
													title={showPassword ? "Hide password" : "Show password"}
													aria-label={showPassword ? "Hide password" : "Show password"}
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
													{showPassword ? "Hide" : "Show"}
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
