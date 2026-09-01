"use client";

import { CssBaseline, ThemeProvider } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { registerSessionExpiryRedirect } from "@/lib/session-activity";
import theme from "./theme";

export default function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  useEffect(() => {
    return registerSessionExpiryRedirect(pathname);
  }, [pathname]);

  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
