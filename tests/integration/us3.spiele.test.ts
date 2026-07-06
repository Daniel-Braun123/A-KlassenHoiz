import { describe, expect, it } from "vitest";

import {
  createSpiel,
  deleteSpiel,
  updateSpiel,
  type SpielRecord,
  type SpieleRepository,
} from "@/lib/domain/spiele-repository";
import {
  createSpieltag,
  deleteSpieltag,
  updateSpieltag,
  type SpieltagRecord,
  type SpieltageRepository,
} from "@/lib/domain/spieltage-repository";

function createMembershipResolver() {
  return async (_tipprundeId: string, nutzerId: string) => {
    if (nutzerId === "admin-1") {
      return { rolle: "admin" as const };
    }
    if (nutzerId === "coadmin-1") {
      return { rolle: "co_admin" as const };
    }
    if (nutzerId === "nutzer-1") {
      return { rolle: "nutzer" as const };
    }
    return null;
  };
}

function createSpieltagRepository(): SpieltageRepository & {
  spieltage: Map<string, SpieltagRecord>;
} {
  const spieltage = new Map<string, SpieltagRecord>();
  const getAktiveMitgliedschaft = createMembershipResolver();

  return {
    spieltage,
    getAktiveMitgliedschaft,
    async insertSpieltag(input) {
      const spieltag: SpieltagRecord = {
        id: `spieltag-${spieltage.size + 1}`,
        tipprundeId: input.tipprundeId,
        name: input.name,
        abschnitt: input.abschnitt,
        nummer: input.nummer,
        sortOrder: input.sortOrder,
      };
      spieltage.set(spieltag.id, spieltag);
      return spieltag;
    },
    async updateSpieltag(spieltagId, input) {
      const spieltag = spieltage.get(spieltagId);
      if (!spieltag) {
        throw new Error("not found");
      }

      const updated = { ...spieltag, ...input };
      spieltage.set(spieltagId, updated);
      return updated;
    },
    async deleteSpieltag(spieltagId) {
      spieltage.delete(spieltagId);
    },
    async listSpieltage(tipprundeId) {
      return [...spieltage.values()].filter((spieltag) => spieltag.tipprundeId === tipprundeId);
    },
    async getNextSpieltagNummer(tipprundeId, abschnitt) {
      const highest = [...spieltage.values()]
        .filter(
          (spieltag) => spieltag.tipprundeId === tipprundeId && spieltag.abschnitt === abschnitt,
        )
        .reduce((max, spieltag) => Math.max(max, spieltag.nummer), 0);
      return highest + 1;
    },
  };
}

function createSpielRepository(): SpieleRepository & { spiele: Map<string, SpielRecord> } {
  const spiele = new Map<string, SpielRecord>();
  const getAktiveMitgliedschaft = createMembershipResolver();

  return {
    spiele,
    getAktiveMitgliedschaft,
    async listSpiele(tipprundeId, spieltagId) {
      return [...spiele.values()].filter(
        (spiel) =>
          spiel.tipprundeId === tipprundeId && (!spieltagId || spiel.spieltagId === spieltagId),
      );
    },
    async insertSpiel(input) {
      const spiel: SpielRecord = {
        id: `spiel-${spiele.size + 1}`,
        tipprundeId: input.tipprundeId,
        spieltagId: input.spieltagId,
        heimteamId: input.heimteamId,
        auswaertsteamId: input.auswaertsteamId,
        anstosszeit: input.anstosszeit,
        timezone: "Europe/Berlin",
        status: input.status,
        ergebnis: null,
      };
      spiele.set(spiel.id, spiel);
      return spiel;
    },
    async updateSpiel(spielId, input) {
      const spiel = spiele.get(spielId);
      if (!spiel) {
        throw new Error("not found");
      }

      const updated = { ...spiel, ...input };
      spiele.set(spielId, updated);
      return updated;
    },
    async deleteSpiel(spielId) {
      spiele.delete(spielId);
    },
  };
}

describe("US3 Spieltage und Spiele", () => {
  it("creates Spieltage with automatic numbers per Hinrunde and Rückrunde", async () => {
    const repository = createSpieltagRepository();

    const hinrunde1 = await createSpieltag(repository, {
      tipprundeId: "tipprunde-1",
      callerNutzerId: "admin-1",
      abschnitt: "hinrunde",
    });
    expect(hinrunde1).toMatchObject({
      name: "Hinrunde Spieltag 1",
      abschnitt: "hinrunde",
      nummer: 1,
      sortOrder: 1,
    });

    const hinrunde2 = await createSpieltag(repository, {
      tipprundeId: "tipprunde-1",
      callerNutzerId: "coadmin-1",
      abschnitt: "hinrunde",
    });
    expect(hinrunde2).toMatchObject({ name: "Hinrunde Spieltag 2", nummer: 2 });

    const rueckrunde1 = await createSpieltag(repository, {
      tipprundeId: "tipprunde-1",
      callerNutzerId: "admin-1",
      abschnitt: "rueckrunde",
    });
    expect(rueckrunde1).toMatchObject({ name: "Rückrunde Spieltag 1", nummer: 1 });

    await expect(
      createSpieltag(repository, {
        tipprundeId: "tipprunde-1",
        callerNutzerId: "admin-1",
        abschnitt: "nachholspiele",
      }),
    ).rejects.toMatchObject({ code: "spieltag_abschnitt_invalid" });

    const updated = await updateSpieltag(repository, {
      tipprundeId: "tipprunde-1",
      spieltagId: hinrunde1.id,
      callerNutzerId: "coadmin-1",
      name: "Hinrunde Spieltag 1 - aktualisiert",
    });
    expect(updated).toMatchObject({ name: "Hinrunde Spieltag 1 - aktualisiert" });

    await deleteSpieltag(repository, {
      tipprundeId: "tipprunde-1",
      spieltagId: hinrunde1.id,
      callerNutzerId: "coadmin-1",
    });
    expect(repository.spieltage.has(hinrunde1.id)).toBe(false);
  });

  it("manages Spiele with German status values and Europe/Berlin Anstosszeit", async () => {
    const repository = createSpielRepository();

    const spiel = await createSpiel(repository, {
      tipprundeId: "tipprunde-1",
      callerNutzerId: "admin-1",
      spieltagId: "spieltag-1",
      heimteamId: "team-1",
      auswaertsteamId: "team-2",
      anstossDatum: "2026-08-01",
      anstossUhrzeit: "15:30",
      status: "geplant",
    });

    expect(spiel).toMatchObject({
      status: "geplant",
      timezone: "Europe/Berlin",
      anstosszeit: "2026-08-01T13:30:00.000Z",
    });

    const updated = await updateSpiel(repository, {
      tipprundeId: "tipprunde-1",
      spielId: spiel.id,
      callerNutzerId: "coadmin-1",
      heimteamId: "team-1",
      auswaertsteamId: "team-2",
      anstossDatum: "2026-08-02",
      anstossUhrzeit: "17:00",
      status: "verschoben",
    });
    expect(updated).toMatchObject({
      status: "verschoben",
      anstosszeit: "2026-08-02T15:00:00.000Z",
    });

    await deleteSpiel(repository, {
      tipprundeId: "tipprunde-1",
      spielId: spiel.id,
      callerNutzerId: "admin-1",
    });
    expect(repository.spiele.has(spiel.id)).toBe(false);
  });

  it("rejects invalid roles, invalid status values and identical teams", async () => {
    const repository = createSpielRepository();

    await expect(
      createSpiel(repository, {
        tipprundeId: "tipprunde-1",
        callerNutzerId: "nutzer-1",
        spieltagId: "spieltag-1",
        heimteamId: "team-1",
        auswaertsteamId: "team-2",
        anstossDatum: "2026-08-01",
        anstossUhrzeit: "15:30",
        status: "geplant",
      }),
    ).rejects.toMatchObject({ code: "content_manager_required" });

    await expect(
      createSpiel(repository, {
        tipprundeId: "tipprunde-1",
        callerNutzerId: "admin-1",
        spieltagId: "spieltag-1",
        heimteamId: "team-1",
        auswaertsteamId: "team-1",
        anstossDatum: "2026-08-01",
        anstossUhrzeit: "15:30",
        status: "geplant",
      }),
    ).rejects.toMatchObject({ code: "spiel_vereine_must_differ" });

    await expect(
      createSpiel(repository, {
        tipprundeId: "tipprunde-1",
        callerNutzerId: "admin-1",
        spieltagId: "spieltag-1",
        heimteamId: "team-1",
        auswaertsteamId: "team-2",
        anstossDatum: "2026-08-01",
        anstossUhrzeit: "15:30",
        status: "offen",
      }),
    ).rejects.toMatchObject({ code: "spiel_status_invalid" });
  });
});
