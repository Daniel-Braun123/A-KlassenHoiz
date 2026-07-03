export type RanglisteQuelle = {
  nutzerId: string;
  tipprundeId: string;
  spieltagId?: string;
  tipprundenNickname?: string | null;
  anzeigename: string;
  punkte: number;
  anzahlExakteTipps?: number;
  anzahlTordifferenzTipps?: number;
  anzahlTendenzTipps?: number;
  anzahlAbgegebeneTipps?: number;
};

export type DerivedRanglisteEintrag = Required<
  Pick<
    RanglisteQuelle,
    | "nutzerId"
    | "tipprundeId"
    | "anzeigename"
    | "punkte"
    | "anzahlExakteTipps"
    | "anzahlTordifferenzTipps"
    | "anzahlTendenzTipps"
    | "anzahlAbgegebeneTipps"
  >
> & {
  spieltagId?: string;
  tipprundenNickname?: string | null;
  platzierung: number;
};

function displayName(entry: RanglisteQuelle): string {
  return (entry.tipprundenNickname || entry.anzeigename).toLocaleLowerCase("de-DE");
}

export function deriveRangliste(entries: RanglisteQuelle[]): DerivedRanglisteEintrag[] {
  const sorted = [...entries].sort((a, b) => {
    if (a.punkte !== b.punkte) {
      return b.punkte - a.punkte;
    }

    return displayName(a).localeCompare(displayName(b), "de-DE");
  });

  let previousPunkte: number | undefined;
  let previousPlatzierung = 0;

  return sorted.map((entry, index) => {
    const platzierung =
      previousPunkte === entry.punkte && previousPunkte !== undefined
        ? previousPlatzierung
        : index + 1;

    previousPunkte = entry.punkte;
    previousPlatzierung = platzierung;

    return {
      nutzerId: entry.nutzerId,
      tipprundeId: entry.tipprundeId,
      spieltagId: entry.spieltagId,
      tipprundenNickname: entry.tipprundenNickname,
      anzeigename: entry.anzeigename,
      punkte: entry.punkte,
      platzierung,
      anzahlExakteTipps: entry.anzahlExakteTipps ?? 0,
      anzahlTordifferenzTipps: entry.anzahlTordifferenzTipps ?? 0,
      anzahlTendenzTipps: entry.anzahlTendenzTipps ?? 0,
      anzahlAbgegebeneTipps: entry.anzahlAbgegebeneTipps ?? 0,
    };
  });
}
