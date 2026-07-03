import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "A-KlassenHoiz",
  description: "Private Tippspiel-App fuer lokale Fussballspiele.",
  applicationName: "A-KlassenHoiz",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "A-KlassenHoiz",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#14532d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
