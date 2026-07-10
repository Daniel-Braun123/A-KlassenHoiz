"use client";

import Link from "next/link";
import { BarChart3, CalendarDays, Home, Settings, Trophy, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { RegisterTipprundeHeaderTitle } from "@/components/navigation/global-topbar";
import { NoConnectionMessage } from "@/components/pwa/no-connection-message";
import { TipprundenSwitcher } from "@/components/tipps/tipprunden-switcher";
import { getTipprundeStartPath, type ActiveTipprundeOption } from "@/lib/domain/active-tipprunde";

type MobileShellProps = {
  activeTipprundeId: string;
  tipprunden: ActiveTipprundeOption[];
  children: ReactNode;
};

function navItemClass(isActive: boolean): string | undefined {
  return isActive ? "is-active" : undefined;
}

export function AppShell({ activeTipprundeId, tipprunden, children }: MobileShellProps) {
  const pathname = usePathname();
  const activeTipprunde = tipprunden.find((tipprunde) => tipprunde.id === activeTipprundeId) ??
    tipprunden[0] ?? {
      id: activeTipprundeId,
      name: "Tipprunde",
      currentSpieltagId: "demo-spieltag",
    };
  const spieltagPath = getTipprundeStartPath(activeTipprunde);
  const canManageTipprunde =
    activeTipprunde.rolle === "admin" || activeTipprunde.rolle === "co_admin";
  const isTippenActive = pathname.includes("/spieltage/") && !pathname.endsWith("/rangliste");
  const isRanglisteActive = pathname.endsWith("/rangliste");
  const isAdminActive = pathname.startsWith("/admin/");

  return (
    <div className="app-shell mobile-shell">
      <RegisterTipprundeHeaderTitle
        tipprundeId={activeTipprunde.id}
        tipprundeName={activeTipprunde.name}
      />

      <header className="app-mobile-header">
        <Link className="app-mobile-home" href="/" aria-label="Zur Home-Übersicht">
          <Home aria-hidden="true" size={20} />
        </Link>
        <strong title={activeTipprunde.name}>{activeTipprunde.name}</strong>
        <Link className="app-mobile-profile" href="/profil" aria-label="Profil">
          <UserRound aria-hidden="true" size={20} />
        </Link>
      </header>

      <aside className="app-sidebar">
        <Link className="app-sidebar-brand" href="/" aria-label="A-KlassenHoiz Home">
          <span className="app-brand-mark">
            <Trophy aria-hidden="true" size={20} />
          </span>
          <span className="app-sidebar-label">A-KlassenHoiz</span>
        </Link>
        <div className="app-sidebar-context">
          <span className="app-sidebar-label">Aktive Tipprunde</span>
          {tipprunden.length > 1 ? (
            <TipprundenSwitcher activeTipprundeId={activeTipprunde.id} tipprunden={tipprunden} />
          ) : (
            <strong className="app-sidebar-label" title={activeTipprunde.name}>
              {activeTipprunde.name}
            </strong>
          )}
        </div>
        <nav className="mobile-nav app-navigation" aria-label="Mobile Navigation">
          <Link
            href="/"
            className={navItemClass(pathname === "/")}
            aria-current={pathname === "/" ? "page" : undefined}
          >
            <Home aria-hidden="true" size={20} />
            <span>Home</span>
          </Link>
          <Link
            href={spieltagPath}
            className={navItemClass(isTippenActive)}
            aria-current={isTippenActive ? "page" : undefined}
          >
            <CalendarDays aria-hidden="true" size={20} />
            <span>Tippen</span>
          </Link>
          <Link
            href={`/${activeTipprunde.id}/rangliste`}
            className={navItemClass(isRanglisteActive)}
            aria-current={isRanglisteActive ? "page" : undefined}
          >
            <BarChart3 aria-hidden="true" size={20} />
            <span>Rangliste</span>
          </Link>
          {canManageTipprunde ? (
            <Link
              href={`/admin/tipprunden/${activeTipprunde.id}`}
              className={navItemClass(isAdminActive)}
              aria-current={isAdminActive ? "page" : undefined}
            >
              <Settings aria-hidden="true" size={20} />
              <span>Verwalten</span>
            </Link>
          ) : null}
        </nav>
        <Link className="app-sidebar-profile" href="/profil">
          <UserRound aria-hidden="true" size={20} />
          <span className="app-sidebar-label">Profil</span>
        </Link>
      </aside>

      <div className="app-shell-main">
        <NoConnectionMessage />
        <div className="mobile-shell-content">{children}</div>
      </div>

      <nav className="mobile-nav app-mobile-navigation" aria-label="Mobile Navigation">
        <Link
          href="/"
          className={navItemClass(pathname === "/")}
          aria-current={pathname === "/" ? "page" : undefined}
        >
          <Home aria-hidden="true" size={19} />
          Home
        </Link>
        <Link
          href={spieltagPath}
          className={navItemClass(isTippenActive)}
          aria-current={isTippenActive ? "page" : undefined}
        >
          <CalendarDays aria-hidden="true" size={19} />
          Tippen
        </Link>
        <Link
          href={`/${activeTipprunde.id}/rangliste`}
          className={navItemClass(isRanglisteActive)}
          aria-current={isRanglisteActive ? "page" : undefined}
        >
          <BarChart3 aria-hidden="true" size={19} />
          Rangliste
        </Link>
        {canManageTipprunde ? (
          <Link
            href={`/admin/tipprunden/${activeTipprunde.id}`}
            className={navItemClass(isAdminActive)}
            aria-current={isAdminActive ? "page" : undefined}
          >
            <Settings aria-hidden="true" size={19} />
            Verwalten
          </Link>
        ) : null}
      </nav>
    </div>
  );
}

export const MobileShell = AppShell;
