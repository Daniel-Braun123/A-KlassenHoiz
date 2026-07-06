import { describe, expect, it } from "vitest";

import {
  enterErgebnis,
  type ErgebnisAenderungRecord,
  type ErgebnisRecord,
  type ErgebnisseRepository,
} from "@/lib/domain/ergebnisse-repository";

function createRepository(): ErgebnisseRepository & {
  ergebnisse: Map<string, ErgebnisRecord>;
  aenderungen: ErgebnisAenderungRecord[];
} {
  const ergebnisse = new Map<string, ErgebnisRecord>();
  const aenderungen: ErgebnisAenderungRecord[] = [];

  return {
    ergebnisse,
    aenderungen,
    async getAktiveMitgliedschaft(_tipprundeId, nutzerId) {
      if (nutzerId === "admin-1") {
        return { rolle: "admin" };
      }
      if (nutzerId === "coadmin-1") {
        return { rolle: "co_admin" };
      }
      if (nutzerId === "nutzer-1") {
        return { rolle: "nutzer" };
      }
      return null;
    },
    async getSpiel(spielId) {
      return spielId === "spiel-1" ? { id: "spiel-1", tipprundeId: "tipprunde-1" } : null;
    },
    async getErgebnisBySpiel(spielId) {
      return ergebnisse.get(spielId) ?? null;
    },
    async insertErgebnis(input) {
      const ergebnis: ErgebnisRecord = {
        id: "ergebnis-1",
        spielId: input.spielId,
        heimtore: input.heimtore,
        auswaertstore: input.auswaertstore,
        enteredBy: input.enteredBy,
        enteredAt: input.now,
        updatedAt: input.now,
        isChangedAfterScoring: false,
      };
      ergebnisse.set(input.spielId, ergebnis);
      return ergebnis;
    },
    async updateErgebnis(input) {
      const existing = ergebnisse.get(input.spielId);
      if (!existing) {
        throw new Error("not found");
      }
      const updated: ErgebnisRecord = {
        ...existing,
        heimtore: input.heimtore,
        auswaertstore: input.auswaertstore,
        enteredBy: input.enteredBy,
        updatedAt: input.now,
        isChangedAfterScoring: true,
      };
      ergebnisse.set(input.spielId, updated);
      return updated;
    },
    async insertErgebnisAenderung(input) {
      const aenderung: ErgebnisAenderungRecord = {
        id: `aenderung-${aenderungen.length + 1}`,
        spielId: input.spielId,
        oldHeimtore: input.oldHeimtore,
        oldAuswaertstore: input.oldAuswaertstore,
        newHeimtore: input.newHeimtore,
        newAuswaertstore: input.newAuswaertstore,
        changedBy: input.changedBy,
        changedAt: input.changedAt,
        reason: input.reason,
      };
      aenderungen.push(aenderung);
      return aenderung;
    },
  };
}

describe("US5 Ergebnis-Historie", () => {
  it("allows Admins and Co-Admins to enter and change Ergebnisse", async () => {
    const repository = createRepository();

    const first = await enterErgebnis(repository, {
      tipprundeId: "tipprunde-1",
      spielId: "spiel-1",
      callerNutzerId: "admin-1",
      heimtore: 2,
      auswaertstore: 1,
      now: new Date("2026-08-01T16:00:00.000Z"),
    });
    expect(first).toMatchObject({ heimtore: 2, auswaertstore: 1, isChangedAfterScoring: false });
    expect(repository.aenderungen).toHaveLength(0);

    const changed = await enterErgebnis(repository, {
      tipprundeId: "tipprunde-1",
      spielId: "spiel-1",
      callerNutzerId: "coadmin-1",
      heimtore: 3,
      auswaertstore: 1,
      reason: "Korrektur Spielbericht",
      now: new Date("2026-08-01T17:00:00.000Z"),
    });

    expect(changed).toMatchObject({ heimtore: 3, auswaertstore: 1, isChangedAfterScoring: true });
    expect(repository.aenderungen).toEqual([
      expect.objectContaining({
        oldHeimtore: 2,
        oldAuswaertstore: 1,
        newHeimtore: 3,
        newAuswaertstore: 1,
        changedBy: "coadmin-1",
        changedAt: "2026-08-01T17:00:00.000Z",
        reason: "Korrektur Spielbericht",
      }),
    ]);
  });

  it("requires a reason when an existing Ergebnis is changed", async () => {
    const repository = createRepository();

    await enterErgebnis(repository, {
      tipprundeId: "tipprunde-1",
      spielId: "spiel-1",
      callerNutzerId: "admin-1",
      heimtore: 2,
      auswaertstore: 1,
      now: new Date("2026-08-01T16:00:00.000Z"),
    });

    await expect(
      enterErgebnis(repository, {
        tipprundeId: "tipprunde-1",
        spielId: "spiel-1",
        callerNutzerId: "coadmin-1",
        heimtore: 3,
        auswaertstore: 1,
        now: new Date("2026-08-01T17:00:00.000Z"),
      }),
    ).rejects.toMatchObject({ code: "ergebnis_reason_required" });
  });

  it("rejects normal Nutzer and invalid scores", async () => {
    const repository = createRepository();

    await expect(
      enterErgebnis(repository, {
        tipprundeId: "tipprunde-1",
        spielId: "spiel-1",
        callerNutzerId: "nutzer-1",
        heimtore: 1,
        auswaertstore: 0,
      }),
    ).rejects.toMatchObject({ code: "content_manager_required" });

    await expect(
      enterErgebnis(repository, {
        tipprundeId: "tipprunde-1",
        spielId: "spiel-1",
        callerNutzerId: "admin-1",
        heimtore: -1,
        auswaertstore: 0,
      }),
    ).rejects.toMatchObject({ code: "ergebnis_score_invalid" });
  });

  it("does not create history or changed markers when the Ergebnis is unchanged", async () => {
    const repository = createRepository();

    const first = await enterErgebnis(repository, {
      tipprundeId: "tipprunde-1",
      spielId: "spiel-1",
      callerNutzerId: "admin-1",
      heimtore: 1,
      auswaertstore: 1,
      now: new Date("2026-08-01T16:00:00.000Z"),
    });
    const repeated = await enterErgebnis(repository, {
      tipprundeId: "tipprunde-1",
      spielId: "spiel-1",
      callerNutzerId: "coadmin-1",
      heimtore: 1,
      auswaertstore: 1,
      now: new Date("2026-08-01T17:00:00.000Z"),
    });

    expect(repeated).toEqual(first);
    expect(repository.aenderungen).toHaveLength(0);
    expect(repeated.isChangedAfterScoring).toBe(false);
  });
});
