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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f8f7" },
    { media: "(prefers-color-scheme: dark)", color: "#07111f" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" data-theme="light" data-theme-preference="system" suppressHydrationWarning>
      <body>
        <Script id="theme-initializer" strategy="beforeInteractive">
          {`
            try {
              var storedTheme = window.localStorage.getItem("a-klassenhoiz.theme");
              var preference = storedTheme === "light" || storedTheme === "dark" || storedTheme === "system"
                ? storedTheme
                : "system";
              var resolvedTheme = preference === "system"
                ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
                : preference;
              document.documentElement.dataset.themePreference = preference;
              document.documentElement.dataset.theme = resolvedTheme;
              document.documentElement.style.colorScheme = resolvedTheme;
            } catch (_) {
              document.documentElement.dataset.themePreference = "system";
              document.documentElement.dataset.theme = "light";
              document.documentElement.style.colorScheme = "light";
            }
          `}
        </Script>
        <GlobalTopbar />
        {children}
      </body>
    </html>
  );
}
