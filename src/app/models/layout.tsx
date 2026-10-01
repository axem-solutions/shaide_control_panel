import type { ReactNode } from "react";
import SectionPageLayout from "../components/server/SectionPageLayout";

export default function ModelsLayout({ children }: { children: ReactNode }) {
  return <SectionPageLayout title="Models" showHome>{children}</SectionPageLayout>;
}
