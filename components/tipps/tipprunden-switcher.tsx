"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type ReactNode, useEffect } from "react";

import {
  getTipprundeStartPath,
  writeActiveTipprundeId,
  type ActiveTipprundeOption,
} from "@/lib/domain/active-tipprunde";

type TipprundenSwitcherProps = {
  activeTipprundeId: string;
  tipprunden: ActiveTipprundeOption[];
};

export function TipprundenSwitcher({ activeTipprundeId, tipprunden }: TipprundenSwitcherProps) {
  const router = useRouter();

  useEffect(() => {
    writeActiveTipprundeId(activeTipprundeId);
  }, [activeTipprundeId]);

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const selected = tipprunden.find((tipprunde) => tipprunde.id === event.target.value);
    if (!selected) {
      return;
    }

    writeActiveTipprundeId(selected.id);
    router.push(getTipprundeStartPath(selected));
  }

  return (
    <label className="tipprunden-switcher">
      Tipprunde wechseln
      <select aria-label="Tipprunde wechseln" value={activeTipprundeId} onChange={handleChange}>
        {tipprunden.map((tipprunde) => (
          <option key={tipprunde.id} value={tipprunde.id}>
            {tipprunde.name}
          </option>
        ))}
      </select>
    </label>
  );
}

type ActiveTipprundeLinkProps = {
  tipprunde: ActiveTipprundeOption;
  children: ReactNode;
};

export function ActiveTipprundeLink({ tipprunde, children }: ActiveTipprundeLinkProps) {
  return (
    <Link
      className="button-link"
      href={getTipprundeStartPath(tipprunde)}
      onClick={() => writeActiveTipprundeId(tipprunde.id)}
    >
      {children}
    </Link>
  );
}
