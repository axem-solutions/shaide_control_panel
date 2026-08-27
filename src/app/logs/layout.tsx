import type { ReactNode } from "react";
import SectionPageLayout from "../components/server/SectionPageLayout";

export default function LogsLayout({ children }: { children: ReactNode }) {
  return (
    <SectionPageLayout title="Logs" showHome fullWidth>
      {children}
    </SectionPageLayout>
  );
}
