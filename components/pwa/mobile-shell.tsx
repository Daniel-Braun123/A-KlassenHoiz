import Link from "next/link";
import type { ReactNode } from "react";

import { NoConnectionMessage } from "@/components/pwa/no-connection-message";
import { TipprundenSwitcher } from "@/components/tipps/tipprunden-switcher";
import { getTipprundeStartPath, type ActiveTipprundeOption } from "@/lib/domain/active-tipprunde";

type MobileShellProps = {
  activeTipprundeId: string;
  tipprunden: ActiveTipprundeOption[];
  children: ReactNode;
};

export function MobileShell({ activeTipprundeId, tipprunden, children }: MobileShellProps) {
  const activeTipprunde = tipprunden.find((tipprunde) => tipprunde.id === activeTipprundeId) ??
    tipprunden[0] ?? {
      id: activeTipprundeId,
      name: "Tipprunde",
      currentSpieltagId: "demo-spieltag",
    };
  const spieltagPath = getTipprundeStartPath(activeTipprunde);

  return (
    <div className="mobile-shell">
      <header className="mobile-shell-header">
        <Link className="app-brand" href="/">
          A-KlassenHoiz
        </Link>
        <TipprundenSwitcher activeTipprundeId={activeTipprunde.id} tipprunden={tipprunden} />
      </header>
      <NoConnectionMessage />
      <div className="mobile-shell-content">{children}</div>
      <nav className="mobile-nav" aria-label="Mobile Navigation">
        <Link href={spieltagPath}>Jetzt tippen</Link>
        <Link href={`/${activeTipprunde.id}/rangliste`}>Rangliste</Link>
        <Link href={spieltagPath}>Aktueller Spieltag</Link>
      </nav>
    </div>
  );
}
