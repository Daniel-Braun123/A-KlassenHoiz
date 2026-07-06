import type { Metadata, Viewport } from "next";
import Script from "next/script";
import type { ReactNode } from "react";

import { GlobalTopbar } from "@/components/navigation/global-topbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "A-KlassenHoiz",
  description: "Private Tippspiel-App für lokale Fußballspiele.",
  applicationName: "A-KlassenHoiz",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "A-KlassenHoiz",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" data-theme="dark" suppressHydrationWarning>
      <body>
        <Script id="theme-initializer" strategy="beforeInteractive">
          {`
            try {
              var theme = window.localStorage.getItem("a-klassenhoiz.theme");
              var nextTheme = theme === "light" ? "light" : "dark";
              document.documentElement.dataset.theme = nextTheme;
              document.documentElement.style.colorScheme = nextTheme;
            } catch (_) {
              document.documentElement.dataset.theme = "dark";
              document.documentElement.style.colorScheme = "dark";
            }
          `}
        </Script>
        <GlobalTopbar />
        {children}
      </body>
    </html>
  );
}
