import type { ReactNode } from "react";
import { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "./providers";

const generalSans = localFont({
  src: "../../public/fonts/GeneralSans-Medium.ttf",
  weight: "500",
  style: "normal",
  display: "swap",
  variable: "--ax-font-general-sans",
});

export const metadata: Metadata = { title: "Control Panel" };

export default function RootLayout(
  { children }: { children: ReactNode },
) {
  return (
    <html lang="en" className={generalSans.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
