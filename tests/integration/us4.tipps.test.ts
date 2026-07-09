import { describe, expect, it } from "vitest";

import {
  submitTipp,
  type SpielForTipp,
  type TippRecord,
  type TippsRepository,
} from "@/lib/domain/tipps-repository";
import { createSpieltagTippView } from "@/lib/domain/spieltag-view-service";

function createRepository(): TippsRepository & {
  tipps: Map<string, TippRecord>;
  spiele: Map<string, SpielForTipp>;
} {
  const spiele = new Map<string, SpielForTipp>([
    [
      "spiel-1",
      {
        id: "spiel-1",
        tipprundeId: "tipprunde-1",
        spieltagId: "spieltag-1",
        heimteamName: "FC Hoiz",
        auswaertsteamName: "SV Wald",
        anstosszeit: "2026-08-01T13:30:00.000Z",
        status: "geplant",
        ergebnis: null,
      },
    ],
    [
      "spiel-2",
      {
        id: "spiel-2",
        tipprundeId: "tipprunde-1",
        spieltagId: "spieltag-1",
        heimteamName: "TSV Spät",
        auswaertsteamName: "SC Abend",
        anstosszeit: "2026-08-01T15:00:00.000Z",
        status: "geplant",
        ergebnis: null,
      },
    ],
  ]);
  const tipps = new Map<string, TippRecord>([
    [
      "spiel-1:fremd-1",
      {
        id: "tipp-fremd-1",
        spielId: "spiel-1",
        tipprundeId: "tipprunde-1",
        nutzerId: "fremd-1",
        heimtoreTipp: 1,
        auswaertstoreTipp: 1,
        submittedAt: "2026-08-01T10:00:00.000Z",
        updatedAt: "2026-08-01T10:00:00.000Z",
      },
    ],
    [
      "spiel-2:fremd-1",
      {
        id: "tipp-fremd-2",
        spielId: "spiel-2",
        tipprundeId: "tipprunde-1",
        nutzerId: "fremd-1",
        heimtoreTipp: 2,
        auswaertstoreTipp: 0,
        submittedAt: "2026-08-01T10:00:00.000Z",
        updatedAt: "2026-08-01T10:00:00.000Z",
      },
    ],
  ]);

  return {
    tipps,
    spiele,
    async getAktiveMitgliedschaft(tipprundeId, nutzerId) {
      if (tipprundeId !== "tipprunde-1") {
        return null;
      }
      return nutzerId === "nutzer-1" || nutzerId === "fremd-1" ? { rolle: "nutzer" } : null;
    },
    async getSpielForTipp(tipprundeId, spielId) {
      const spiel = spiele.get(spielId);
      return spiel?.tipprundeId === tipprundeId ? spiel : null;
    },
    async upsertTipp(input) {
      const nowIso = input.now.toISOString();
      const key = `${input.spielId}:${input.nutzerId}`;
      const existing = tipps.get(key);
      const tipp: TippRecord = {
        id: existing?.id ?? `tipp-${tipps.size + 1}`,
        spielId: input.spielId,
        tipprundeId: input.tipprundeId,
        nutzerId: input.nutzerId,
        heimtoreTipp: input.heimtoreTipp,
        auswaertstoreTipp: input.auswaertstoreTipp,
        submittedAt: existing?.submittedAt ?? nowIso,
        updatedAt: nowIso,
      };
      tipps.set(key, tipp);
      return tipp;
    },
    async listSpieleForSpieltag(tipprundeId, spieltagId) {
      return [...spiele.values()].filter(
        (spiel) => spiel.tipprundeId === tipprundeId && spiel.spieltagId === spieltagId,
      );
    },
    async listTippsForSpieltag(tipprundeId, spieltagId) {
      const spielIds = new Set(
        [...spiele.values()]
          .filter((spiel) => spiel.tipprundeId === tipprundeId && spiel.spieltagId === spieltagId)
          .map((spiel) => spiel.id),
      );
      return [...tipps.values()].filter(
        (tipp) => tipp.tipprundeId === tipprundeId && spielIds.has(tipp.spielId),
      );
    },
  };
}

describe("US4 Tipps", () => {
  it("creates and updates the authenticated Nutzer's own Tipp before Anstosszeit", async () => {
    const repository = createRepository();

    const created = await submitTipp(repository, {
      tipprundeId: "tipprunde-1",
      spielId: "spiel-1",
      nutzerId: "nutzer-1",
      heimtoreTipp: 2,
      auswaertstoreTipp: 1,
      now: new Date("2026-08-01T13:00:00.000Z"),
    });
    expect(created).toMatchObject({ heimtoreTipp: 2, auswaertstoreTipp: 1 });

    const updated = await submitTipp(repository, {
      tipprundeId: "tipprunde-1",
      spielId: "spiel-1",
      nutzerId: "nutzer-1",
      heimtoreTipp: 3,
      auswaertstoreTipp: 2,
      now: new Date("2026-08-01T13:10:00.000Z"),
    });
    expect(updated).toMatchObject({ id: created.id, heimtoreTipp: 3, auswaertstoreTipp: 2 });
  });

  it("blocks Tipp changes after the individual Spiel-Anstosszeit but keeps later Spiele open", async () => {
    const repository = createRepository();

    await expect(
      submitTipp(repository, {
        tipprundeId: "tipprunde-1",
        spielId: "spiel-1",
        nutzerId: "nutzer-1",
        heimtoreTipp: 1,
        auswaertstoreTipp: 0,
        now: new Date("2026-08-01T14:00:00.000Z"),
      }),
    ).rejects.toMatchObject({ code: "tippfrist_abgelaufen" });

    await expect(
      submitTipp(repository, {
        tipprundeId: "tipprunde-1",
        spielId: "spiel-2",
        nutzerId: "nutzer-1",
        heimtoreTipp: 1,
        auswaertstoreTipp: 0,
        now: new Date("2026-08-01T14:00:00.000Z"),
      }),
    ).resolves.toMatchObject({ spielId: "spiel-2" });
  });

  it("rejects non-members and negative scores", async () => {
    const repository = createRepository();

    await expect(
      submitTipp(repository, {
        tipprundeId: "tipprunde-1",
        spielId: "spiel-1",
        nutzerId: "nicht-mitglied",
        heimtoreTipp: 1,
        auswaertstoreTipp: 0,
        now: new Date("2026-08-01T13:00:00.000Z"),
      }),
    ).rejects.toMatchObject({ code: "membership_required" });

    await expect(
      submitTipp(repository, {
        tipprundeId: "tipprunde-1",
        spielId: "spiel-1",
        nutzerId: "nutzer-1",
        heimtoreTipp: -1,
        auswaertstoreTipp: 0,
        now: new Date("2026-08-01T13:00:00.000Z"),
      }),
    ).rejects.toMatchObject({ code: "tipp_score_invalid" });
  });

  it("shows own Tipps always and hides foreign Tipps until the Spiel-specific Tippfrist", async () => {
    const repository = createRepository();
    await submitTipp(repository, {
      tipprundeId: "tipprunde-1",
      spielId: "spiel-1",
      nutzerId: "nutzer-1",
      heimtoreTipp: 3,
      auswaertstoreTipp: 1,
      now: new Date("2026-08-01T13:00:00.000Z"),
    });

    const view = await createSpieltagTippView(repository, {
      tipprundeId: "tipprunde-1",
      spieltagId: "spieltag-1",
      nutzerId: "nutzer-1",
      now: new Date("2026-08-01T14:00:00.000Z"),
    });

    expect(view.spiele[0]).toMatchObject({
      id: "spiel-1",
      eigenerTipp: { heimtoreTipp: 3, auswaertstoreTipp: 1 },
      fremdeTippsSichtbar: true,
      istLive: true,
      ergebnisAusstehend: false,
    });
    expect(view.spiele[0].fremdeTipps).toHaveLength(1);
    expect(view.spiele[1]).toMatchObject({
      id: "spiel-2",
      eigenerTipp: null,
      fremdeTippsSichtbar: false,
      fremdeTipps: [],
      istTippbar: true,
      istLive: false,
      ergebnisAusstehend: false,
    });
  });

  it("marks a finished Spiel without Ergebnis as waiting for Ergebnis", async () => {
    const repository = createRepository();

    const view = await createSpieltagTippView(repository, {
      tipprundeId: "tipprunde-1",
      spieltagId: "spieltag-1",
      nutzerId: "nutzer-1",
      now: new Date("2026-08-01T15:01:00.000Z"),
    });

    expect(view.spiele[0]).toMatchObject({
      id: "spiel-1",
      istLive: false,
      ergebnisAusstehend: true,
    });
  });

  it("keeps a Spiel live for exactly 90 minutes after Anstoss", async () => {
    const repository = createRepository();

    const liveView = await createSpieltagTippView(repository, {
      tipprundeId: "tipprunde-1",
      spieltagId: "spieltag-1",
      nutzerId: "nutzer-1",
      now: new Date("2026-08-01T15:00:00.000Z"),
    });
    expect(liveView.spiele[0]).toMatchObject({
      id: "spiel-1",
      status: "geplant",
      istLive: true,
      ergebnisAusstehend: false,
    });

    const finishedView = await createSpieltagTippView(repository, {
      tipprundeId: "tipprunde-1",
      spieltagId: "spieltag-1",
      nutzerId: "nutzer-1",
      now: new Date("2026-08-01T15:00:01.000Z"),
    });
    expect(finishedView.spiele[0]).toMatchObject({
      id: "spiel-1",
      status: "beendet",
      istLive: false,
      ergebnisAusstehend: true,
    });
  });

  it("shows the live state during the 90 minute window even if an Ergebnis exists", async () => {
    const repository = createRepository();
    const spiel = repository.spiele.get("spiel-1");
    if (!spiel) {
      throw new Error("missing fixture");
    }
    repository.spiele.set("spiel-1", {
      ...spiel,
      ergebnis: { heimtore: 1, auswaertstore: 0 },
    });

    const view = await createSpieltagTippView(repository, {
      tipprundeId: "tipprunde-1",
      spieltagId: "spieltag-1",
      nutzerId: "nutzer-1",
      now: new Date("2026-08-01T14:30:00.000Z"),
    });

    expect(view.spiele[0]).toMatchObject({
      id: "spiel-1",
      istLive: true,
      ergebnis: { heimtore: 1, auswaertstore: 0 },
    });
  });

  it("shows an empty Spieltag view without loading Tipps when no Spiele exist", async () => {
    let tippsLoaded = false;
    const repository: Pick<TippsRepository, "listSpieleForSpieltag" | "listTippsForSpieltag"> = {
      async listSpieleForSpieltag() {
        return [];
      },
      async listTippsForSpieltag() {
        tippsLoaded = true;
        return [];
      },
    };

    const view = await createSpieltagTippView(repository, {
      tipprundeId: "tipprunde-neu",
      spieltagId: "spieltag-leer",
      nutzerId: "nutzer-1",
      now: new Date("2026-08-01T14:00:00.000Z"),
    });

    expect(view).toMatchObject({
      tipprundeId: "tipprunde-neu",
      spieltagId: "spieltag-leer",
      spiele: [],
    });
    expect(tippsLoaded).toBe(false);
  });
});
