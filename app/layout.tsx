import type { Metadata, Viewport } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Home } from "lucide-react";

import "./globals.css";

export const metadata: Metadata = {
  title: "A-KlassenHoiz",
  description: "Private Tippspiel-App für lokale Fußballspiele.",
  applicationName: "A-KlassenHoiz",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "A-KlassenHoiz",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b2a3a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body>
        <header className="global-topbar" aria-label="App Navigation">
          <Link className="global-home-link" href="/" aria-label="Zur Home-Übersicht">
            <Home aria-hidden="true" size={22} />
          </Link>
        </header>
        {children}
      </body>
    </html>
  );
}
