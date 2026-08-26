import type { ReactNode } from "react";
import SectionPageLayout from "../components/server/SectionPageLayout";

export default function KnowledgeCenterLayout({ children }: { children: ReactNode }) {
  return <SectionPageLayout title="Knowledge Center" showHome>{children}</SectionPageLayout>;
}
