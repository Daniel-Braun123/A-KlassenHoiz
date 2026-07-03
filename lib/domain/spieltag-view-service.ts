import { shouldRevealFremdeTipps } from "@/lib/domain/tippfristen";
import type { SpielForTipp, TippRecord, TippsRepository } from "@/lib/domain/tipps-repository";

export type SpieltagTippView = {
  tipprundeId: string;
  spieltagId: string;
  spiele: SpielTippView[];
};

export type SpielTippView = SpielForTipp & {
  istTippbar: boolean;
  eigenerTipp: TippRecord | null;
  fremdeTippsSichtbar: boolean;
  fremdeTipps: TippRecord[];
};

export async function createSpieltagTippView(
  repository: Pick<TippsRepository, "listSpieleForSpieltag" | "listTippsForSpieltag">,
  input: {
    tipprundeId: string;
    spieltagId: string;
    nutzerId: string;
    now?: Date;
  },
): Promise<SpieltagTippView> {
  const now = input.now ?? new Date();
  const spiele = await repository.listSpieleForSpieltag(input.tipprundeId, input.spieltagId);

  if (spiele.length === 0) {
    return {
      tipprundeId: input.tipprundeId,
      spieltagId: input.spieltagId,
      spiele: [],
    };
  }

  const tipps = await repository.listTippsForSpieltag(input.tipprundeId, input.spieltagId);

  return {
    tipprundeId: input.tipprundeId,
    spieltagId: input.spieltagId,
    spiele: spiele.map((spiel) => {
      const spielTipps = tipps.filter((tipp) => tipp.spielId === spiel.id);
      const eigenerTipp = spielTipps.find((tipp) => tipp.nutzerId === input.nutzerId) ?? null;
      const fremdeTippsSichtbar = shouldRevealFremdeTipps({ now, anstosszeit: spiel.anstosszeit });

      return {
        ...spiel,
        istTippbar:
          spiel.status === "geplant" && now.getTime() < new Date(spiel.anstosszeit).getTime(),
        eigenerTipp,
        fremdeTippsSichtbar,
        fremdeTipps: fremdeTippsSichtbar
          ? spielTipps.filter((tipp) => tipp.nutzerId !== input.nutzerId)
          : [],
      };
    }),
  };
}

export function createDemoSpieltagTippView(
  now = new Date("2026-08-01T14:00:00.000Z"),
): SpieltagTippView {
  const spiele: SpielForTipp[] = [
    {
      id: "spiel-gesperrt",
      tipprundeId: "demo-tipprunde",
      spieltagId: "demo-spieltag",
      heimteamName: "FC Hoiz",
      auswaertsteamName: "SV Wald",
      anstosszeit: "2026-08-01T13:30:00.000Z",
      status: "geplant",
    },
    {
      id: "spiel-offen",
      tipprundeId: "demo-tipprunde",
      spieltagId: "demo-spieltag",
      heimteamName: "TSV Spaet",
      auswaertsteamName: "SC Abend",
      anstosszeit: "2026-08-01T15:00:00.000Z",
      status: "geplant",
    },
  ];

  return {
    tipprundeId: "demo-tipprunde",
    spieltagId: "demo-spieltag",
    spiele: spiele.map((spiel) => ({
      ...spiel,
      istTippbar:
        spiel.status === "geplant" && now.getTime() < new Date(spiel.anstosszeit).getTime(),
      eigenerTipp:
        spiel.id === "spiel-gesperrt"
          ? {
              id: "demo-tipp",
              spielId: "spiel-gesperrt",
              tipprundeId: "demo-tipprunde",
              nutzerId: "demo-user",
              heimtoreTipp: 2,
              auswaertstoreTipp: 1,
              submittedAt: "2026-08-01T12:00:00.000Z",
              updatedAt: "2026-08-01T12:00:00.000Z",
            }
          : null,
      fremdeTippsSichtbar: shouldRevealFremdeTipps({ now, anstosszeit: spiel.anstosszeit }),
      fremdeTipps: [],
    })),
  };
}
