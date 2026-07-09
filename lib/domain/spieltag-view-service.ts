import {
  getAutomatischerSpielStatus,
  isSpielVorbei,
  shouldRevealFremdeTipps,
} from "@/lib/domain/tippfristen";
import type { SpielStatus } from "@/lib/domain/types";
import type { SpielForTipp, TippRecord, TippsRepository } from "@/lib/domain/tipps-repository";

export type SpieltagTippView = {
  tipprundeId: string;
  spieltagId: string;
  spiele: SpielTippView[];
};

export type SpielTippView = SpielForTipp & {
  istTippbar: boolean;
  istLive: boolean;
  ergebnisAusstehend: boolean;
  eigenerTipp: TippRecord | null;
  fremdeTippsSichtbar: boolean;
  fremdeTipps: TippRecord[];
};

function isSpielLive({
  now,
  anstosszeit,
  status,
}: {
  now: Date;
  anstosszeit: string;
  status: SpielStatus;
}): boolean {
  return (
    status === "geplant" &&
    now.getTime() >= new Date(anstosszeit).getTime() &&
    !isSpielVorbei({ now, anstosszeit })
  );
}

function isErgebnisAusstehend({
  status,
  hasErgebnis,
}: {
  status: SpielStatus;
  hasErgebnis: boolean;
}): boolean {
  return status === "beendet" && !hasErgebnis;
}

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
      const automatischerStatus = getAutomatischerSpielStatus({
        now,
        anstosszeit: spiel.anstosszeit,
        spielStatus: spiel.status,
      });

      return {
        ...spiel,
        status: automatischerStatus,
        istTippbar:
          automatischerStatus === "geplant" &&
          now.getTime() < new Date(spiel.anstosszeit).getTime(),
        istLive: isSpielLive({
          now,
          anstosszeit: spiel.anstosszeit,
          status: automatischerStatus,
        }),
        ergebnisAusstehend: isErgebnisAusstehend({
          status: automatischerStatus,
          hasErgebnis: Boolean(spiel.ergebnis),
        }),
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
  spieltagId = "demo-spieltag",
): SpieltagTippView {
  const spiele: SpielForTipp[] = [
    {
      id: "spiel-gesperrt",
      tipprundeId: "demo-tipprunde",
      spieltagId,
      heimteamName: "FC Hoiz",
      auswaertsteamName: "SV Wald",
      heimteamLogoUrl: null,
      auswaertsteamLogoUrl: null,
      anstosszeit: "2026-08-01T13:30:00.000Z",
      status: "geplant",
      ergebnis: null,
    },
    {
      id: "spiel-offen",
      tipprundeId: "demo-tipprunde",
      spieltagId,
      heimteamName: "TSV Spät",
      auswaertsteamName: "SC Abend",
      heimteamLogoUrl: null,
      auswaertsteamLogoUrl: null,
      anstosszeit: "2026-08-01T15:00:00.000Z",
      status: "geplant",
      ergebnis: null,
    },
    {
      id: "spiel-ergebnis",
      tipprundeId: "demo-tipprunde",
      spieltagId,
      heimteamName: "TSV Ergebnis",
      auswaertsteamName: "SV Punkte",
      heimteamLogoUrl: null,
      auswaertsteamLogoUrl: null,
      anstosszeit: "2026-07-31T13:30:00.000Z",
      status: "beendet",
      ergebnis: { heimtore: 3, auswaertstore: 1 },
    },
    {
      id: "spiel-vergessen",
      tipprundeId: "demo-tipprunde",
      spieltagId,
      heimteamName: "FC Verpasst",
      auswaertsteamName: "SC Frist",
      heimteamLogoUrl: null,
      auswaertsteamLogoUrl: null,
      anstosszeit: "2026-07-30T13:30:00.000Z",
      status: "beendet",
      ergebnis: { heimtore: 1, auswaertstore: 0 },
    },
  ];

  return {
    tipprundeId: "demo-tipprunde",
    spieltagId,
    spiele: spiele.map((spiel) => {
      const automatischerStatus = getAutomatischerSpielStatus({
        now,
        anstosszeit: spiel.anstosszeit,
        spielStatus: spiel.status,
      });

      return {
        ...spiel,
        status: automatischerStatus,
        istTippbar:
          automatischerStatus === "geplant" &&
          now.getTime() < new Date(spiel.anstosszeit).getTime(),
        istLive: isSpielLive({
          now,
          anstosszeit: spiel.anstosszeit,
          status: automatischerStatus,
        }),
        ergebnisAusstehend: isErgebnisAusstehend({
          status: automatischerStatus,
          hasErgebnis: Boolean(spiel.ergebnis),
        }),
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
            : spiel.id === "spiel-ergebnis"
              ? {
                  id: "demo-tipp-ergebnis",
                  spielId: "spiel-ergebnis",
                  tipprundeId: "demo-tipprunde",
                  nutzerId: "demo-user",
                  heimtoreTipp: 2,
                  auswaertstoreTipp: 0,
                  submittedAt: "2026-07-31T12:00:00.000Z",
                  updatedAt: "2026-07-31T12:00:00.000Z",
                }
              : null,
        fremdeTippsSichtbar: shouldRevealFremdeTipps({ now, anstosszeit: spiel.anstosszeit }),
        fremdeTipps: [],
      };
    }),
  };
}
