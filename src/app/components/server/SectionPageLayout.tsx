import type { ReactNode } from "react";
import { Box } from "@mui/material";
import ServerPageHeader from "./PageHeader";

type SectionPageLayoutProps = {
  children: ReactNode;
  title: string;
  showHome?: boolean;
  showLogout?: boolean;
  disableLogoLink?: boolean;
  fullWidth?: boolean;
};

export default function SectionPageLayout({
  children,
  title,
  showHome = false,
  showLogout = true,
  disableLogoLink = false,
  fullWidth = false,
}: SectionPageLayoutProps) {
  return (
    <Box className="section-page-root">
      <ServerPageHeader
        title={title}
        showHome={showHome}
        showLogout={showLogout}
        disableLogoLink={disableLogoLink}
      />
      <Box
        component="main"
        className="section-page-main"
        sx={fullWidth ? { display: "flex", flexDirection: "column", minHeight: 0 } : undefined}
      >
        <Box
          className={
            fullWidth ? "section-page-content section-page-content--full" : "section-page-content"
          }
          sx={
            fullWidth
              ? { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }
              : undefined
          }
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
