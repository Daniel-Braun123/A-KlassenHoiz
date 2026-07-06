"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

const TIPPRUNDE_NAME_STORAGE_KEY = "a-klassenhoiz.tipprunde-names";
const TIPPRUNDE_NAME_EVENT = "a-klassenhoiz.tipprunde-name-change";

function readTipprundeNames(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(TIPPRUNDE_NAME_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeTipprundeName(tipprundeId: string, tipprundeName: string) {
  const names = readTipprundeNames();
  names[tipprundeId] = tipprundeName;
  window.localStorage.setItem(TIPPRUNDE_NAME_STORAGE_KEY, JSON.stringify(names));
  window.dispatchEvent(new CustomEvent(TIPPRUNDE_NAME_EVENT));
}

function getTipprundeIdFromPathname(pathname: string | null): string | null {
  const segments = (pathname ?? "").split("/").filter(Boolean);
  const [first, second, third] = segments;

  if (first === "admin" && second === "tipprunden" && third && third !== "neu") {
    return third;
  }

  if (!first || ["admin", "einladungen", "login", "profil", "register"].includes(first)) {
    return null;
  }

  return first;
}

function subscribeToTipprundeNames(callback: () => void) {
  window.addEventListener(TIPPRUNDE_NAME_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(TIPPRUNDE_NAME_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getTitleForPathname(pathname: string | null) {
  const tipprundeId = getTipprundeIdFromPathname(pathname);
  return tipprundeId ? (readTipprundeNames()[tipprundeId] ?? "") : "";
}

export function RegisterTipprundeHeaderTitle({
  tipprundeId,
  tipprundeName,
}: {
  tipprundeId: string;
  tipprundeName: string;
}) {
  useEffect(() => {
    writeTipprundeName(tipprundeId, tipprundeName);
  }, [tipprundeId, tipprundeName]);

  return null;
}

export function GlobalTopbar() {
  const pathname = usePathname();
  const title = useSyncExternalStore(
    subscribeToTipprundeNames,
    () => getTitleForPathname(pathname),
    () => "",
  );

  return (
    <header className="global-topbar" aria-label="App Navigation">
      <Link className="global-home-link" href="/" aria-label="Zur Home-Übersicht">
        <Home aria-hidden="true" size={22} />
      </Link>
      {title ? <span className="global-tipprunde-title">{title}</span> : null}
    </header>
  );
}
