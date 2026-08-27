import { Suspense } from "react";
import type { Metadata } from "next";
import LoginPage from "./login/LoginPage";

export const metadata: Metadata = { title: "Control Panel | Login" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
