"use client";

import { useRouter } from "next/navigation";

export type SpieltagOption = {
  id: string;
  name: string;
};

type SpieltagSelectProps = {
  tipprundeId: string;
  spieltagId: string;
  spieltage: SpieltagOption[];
};

export function SpieltagSelect({ tipprundeId, spieltagId, spieltage }: SpieltagSelectProps) {
  const router = useRouter();

  if (spieltage.length <= 1) {
    return null;
  }

  return (
    <label className="spieltag-select">
      <span className="sr-only">Spieltag auswählen</span>
      <select
        aria-label="Spieltag auswählen"
        value={spieltagId}
        onChange={(event) => router.push(`/${tipprundeId}/spieltage/${event.target.value}`)}
      >
        {spieltage.map((spieltag) => (
          <option key={spieltag.id} value={spieltag.id}>
            {spieltag.name}
          </option>
        ))}
      </select>
    </label>
  );
}
