import Link from "next/link";
import { BarChart3, CalendarDays, Home, Settings, Trophy } from "lucide-react";
import type { ReactNode } from "react";

import { RegisterTipprundeHeaderTitle } from "@/components/navigation/global-topbar";
import { NoConnectionMessage } from "@/components/pwa/no-connection-message";
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
  const canManageTipprunde =
    activeTipprunde.rolle === "admin" || activeTipprunde.rolle === "co_admin";

  return (
    <div className="mobile-shell">
      <RegisterTipprundeHeaderTitle
        tipprundeId={activeTipprunde.id}
        tipprundeName={activeTipprunde.name}
      />
      <header className="mobile-shell-header">
        <Link className="app-brand" href="/">
          <span className="app-brand-mark">
            <Trophy aria-hidden="true" size={18} />
          </span>
          A-KlassenHoiz
        </Link>
      </header>
      <NoConnectionMessage />
      <div className="mobile-shell-content">{children}</div>
      <nav className="mobile-nav" aria-label="Mobile Navigation">
        <Link href="/">
          <Home aria-hidden="true" size={19} />
          Home
        </Link>
        <Link href={spieltagPath}>
          <CalendarDays aria-hidden="true" size={19} />
          Tippen
        </Link>
        <Link href={`/${activeTipprunde.id}/rangliste`}>
          <BarChart3 aria-hidden="true" size={19} />
          Rangliste
        </Link>
        {canManageTipprunde ? (
          <Link href={`/admin/tipprunden/${activeTipprunde.id}`}>
            <Settings aria-hidden="true" size={19} />
            Verwalten
          </Link>
        ) : null}
      </nav>
    </div>
  );
}
