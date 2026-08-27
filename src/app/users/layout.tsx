import type { ReactNode } from "react";
import SectionPageLayout from "../components/server/SectionPageLayout";

export default function UsersLayout({ children }: { children: ReactNode }) {
  return <SectionPageLayout title="Users" showHome>{children}</SectionPageLayout>;
}
