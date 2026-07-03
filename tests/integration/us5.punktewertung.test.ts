import { describe, expect, it } from "vitest";

import {
  recalculatePunktewertungen,
  type PunktewertungRecord,
  type PunktewertungRepository,
  type TippForPunktewertung,
} from "@/lib/domain/punktewertung-service";

function createRepository(tipps: TippForPunktewertung[]): PunktewertungRepository & {
  wertungen: Map<string, PunktewertungRecord>;
} {
  const wertungen = new Map<string, PunktewertungRecord>();

  return {
    wertungen,
    async listTippsForSpiel(spielId) {
      return tipps.filter((tipp) => tipp.spielId === spielId);
    },
    async upsertPunktewertung(input) {
      const key = `${input.spielId}:${input.nutzerId}`;
      const existing = wertungen.get(key);
      const wertung: PunktewertungRecord = {
        id: existing?.id ?? `wertung-${wertungen.size + 1}`,
        spielId: input.spielId,
        nutzerId: input.nutzerId,
        tipprundeId: input.tipprundeId,
        punkte: input.punkte,
        wertungstyp: input.wertungstyp,
        calculatedAt: input.calculatedAt,
      };
      wertungen.set(key, wertung);
      return wertung;
    },
  };
}

describe("US5 Punktewertung", () => {
  it("calculates 4/3/2/0 Punkte and treats draw Tordifferenz analog", async () => {
    const repository = createRepository([
      {
        spielId: "spiel-1",
        tipprundeId: "tipprunde-1",
        nutzerId: "exakt",
        heimtoreTipp: 2,
        auswaertstoreTipp: 1,
      },
      {
        spielId: "spiel-1",
        tipprundeId: "tipprunde-1",
        nutzerId: "differenz",
        heimtoreTipp: 3,
        auswaertstoreTipp: 2,
      },
      {
        spielId: "spiel-1",
        tipprundeId: "tipprunde-1",
        nutzerId: "tendenz",
        heimtoreTipp: 1,
        auswaertstoreTipp: 0,
      },
      {
        spielId: "spiel-1",
        tipprundeId: "tipprunde-1",
        nutzerId: "keine",
        heimtoreTipp: 1,
        auswaertstoreTipp: 1,
      },
      {
        spielId: "spiel-2",
        tipprundeId: "tipprunde-1",
        nutzerId: "draw-differenz",
        heimtoreTipp: 2,
        auswaertstoreTipp: 2,
      },
    ]);

    const normal = await recalculatePunktewertungen(repository, {
      spielId: "spiel-1",
      tipprundeId: "tipprunde-1",
      ergebnis: { heimtore: 2, auswaertstore: 1 },
      now: new Date("2026-08-01T18:00:00.000Z"),
    });
    const draw = await recalculatePunktewertungen(repository, {
      spielId: "spiel-2",
      tipprundeId: "tipprunde-1",
      ergebnis: { heimtore: 1, auswaertstore: 1 },
      now: new Date("2026-08-01T18:00:00.000Z"),
    });

    expect(
      normal.map((wertung) => [wertung.nutzerId, wertung.punkte, wertung.wertungstyp]),
    ).toEqual([
      ["exakt", 4, "exakt"],
      ["differenz", 3, "tordifferenz"],
      ["tendenz", 2, "tendenz"],
      ["keine", 0, "keine"],
    ]);
    expect(draw).toEqual([
      expect.objectContaining({
        nutzerId: "draw-differenz",
        punkte: 3,
        wertungstyp: "tordifferenz",
      }),
    ]);
  });

  it("is idempotent and replaces existing Punktewertungen after Ergebnis changes", async () => {
    const repository = createRepository([
      {
        spielId: "spiel-1",
        tipprundeId: "tipprunde-1",
        nutzerId: "nutzer-1",
        heimtoreTipp: 2,
        auswaertstoreTipp: 1,
      },
    ]);

    await recalculatePunktewertungen(repository, {
      spielId: "spiel-1",
      tipprundeId: "tipprunde-1",
      ergebnis: { heimtore: 2, auswaertstore: 1 },
      now: new Date("2026-08-01T18:00:00.000Z"),
    });
    await recalculatePunktewertungen(repository, {
      spielId: "spiel-1",
      tipprundeId: "tipprunde-1",
      ergebnis: { heimtore: 2, auswaertstore: 1 },
      now: new Date("2026-08-01T18:05:00.000Z"),
    });
    expect(repository.wertungen).toHaveLength(1);
    expect([...repository.wertungen.values()][0]).toMatchObject({
      punkte: 4,
      wertungstyp: "exakt",
    });

    await recalculatePunktewertungen(repository, {
      spielId: "spiel-1",
      tipprundeId: "tipprunde-1",
      ergebnis: { heimtore: 3, auswaertstore: 1 },
      now: new Date("2026-08-01T19:00:00.000Z"),
    });

    expect(repository.wertungen).toHaveLength(1);
    expect([...repository.wertungen.values()][0]).toMatchObject({
      punkte: 2,
      wertungstyp: "tendenz",
    });
  });
});
