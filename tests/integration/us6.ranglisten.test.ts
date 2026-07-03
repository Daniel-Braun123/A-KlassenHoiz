import { describe, expect, it } from "vitest";

import {
  getGesamtRangliste,
  getSpieltagRangliste,
  type PunktewertungForRangliste,
  type RanglistenRepository,
} from "@/lib/domain/ranglisten-service";

function createRepository(punktewertungen: PunktewertungForRangliste[]): RanglistenRepository {
  return {
    async getAktiveMitgliedschaft(tipprundeId, nutzerId) {
      return tipprundeId === "tipprunde-1" && nutzerId === "mitglied-1"
        ? { rolle: "nutzer" }
        : null;
    },
    async listPunktewertungenForTipprunde(tipprundeId) {
      return punktewertungen.filter((wertung) => wertung.tipprundeId === tipprundeId);
    },
    async listPunktewertungenForSpieltag(tipprundeId, spieltagId) {
      return punktewertungen.filter(
        (wertung) => wertung.tipprundeId === tipprundeId && wertung.spieltagId === spieltagId,
      );
    },
    async listVergangeneSpieltagErgebnisse() {
      return [];
    },
  };
}

describe("US6 Ranglisten", () => {
  const punktewertungen: PunktewertungForRangliste[] = [
    {
      spielId: "spiel-1",
      spieltagId: "spieltag-1",
      nutzerId: "nutzer-anna",
      tipprundeId: "tipprunde-1",
      tipprundenNickname: "Anna",
      anzeigename: "Anna A.",
      punkte: 4,
      wertungstyp: "exakt",
    },
    {
      spielId: "spiel-2",
      spieltagId: "spieltag-1",
      nutzerId: "nutzer-anna",
      tipprundeId: "tipprunde-1",
      tipprundenNickname: "Anna",
      anzeigename: "Anna A.",
      punkte: 2,
      wertungstyp: "tendenz",
    },
    {
      spielId: "spiel-1",
      spieltagId: "spieltag-1",
      nutzerId: "nutzer-berta",
      tipprundeId: "tipprunde-1",
      tipprundenNickname: "Berta",
      anzeigename: "Berta B.",
      punkte: 3,
      wertungstyp: "tordifferenz",
    },
    {
      spielId: "spiel-2",
      spieltagId: "spieltag-1",
      nutzerId: "nutzer-berta",
      tipprundeId: "tipprunde-1",
      tipprundenNickname: "Berta",
      anzeigename: "Berta B.",
      punkte: 3,
      wertungstyp: "tordifferenz",
    },
    {
      spielId: "spiel-3",
      spieltagId: "spieltag-2",
      nutzerId: "nutzer-clara",
      tipprundeId: "tipprunde-1",
      tipprundenNickname: null,
      anzeigename: "Clara C.",
      punkte: 4,
      wertungstyp: "exakt",
    },
  ];

  it("derives Gesamt- and Spieltagsranglisten from Punktewertungen", async () => {
    const repository = createRepository(punktewertungen);

    const gesamt = await getGesamtRangliste(repository, {
      tipprundeId: "tipprunde-1",
      nutzerId: "mitglied-1",
    });
    const spieltag = await getSpieltagRangliste(repository, {
      tipprundeId: "tipprunde-1",
      spieltagId: "spieltag-1",
      nutzerId: "mitglied-1",
    });

    expect(
      gesamt.map((entry) => [entry.platzierung, entry.tipprundenNickname, entry.punkte]),
    ).toEqual([
      [1, "Anna", 6],
      [1, "Berta", 6],
      [3, null, 4],
    ]);
    expect(gesamt[0]).toMatchObject({
      anzahlExakteTipps: 1,
      anzahlTordifferenzTipps: 0,
      anzahlTendenzTipps: 1,
      anzahlAbgegebeneTipps: 2,
    });
    expect(
      spieltag.map((entry) => [entry.platzierung, entry.tipprundenNickname, entry.punkte]),
    ).toEqual([
      [1, "Anna", 6],
      [1, "Berta", 6],
    ]);
  });

  it("rejects non-members server-side", async () => {
    const repository = createRepository(punktewertungen);

    await expect(
      getGesamtRangliste(repository, {
        tipprundeId: "tipprunde-1",
        nutzerId: "fremd-1",
      }),
    ).rejects.toMatchObject({ code: "membership_required" });
  });
});
