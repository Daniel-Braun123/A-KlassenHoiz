import { describe, expect, it } from "vitest";

import {
  createLiga,
  getLiga,
  type LigaRecord,
  type LigenRepository,
} from "@/lib/domain/ligen-repository";

function createRepository(): LigenRepository & { ligen: Map<string, LigaRecord> } {
  const ligen = new Map<string, LigaRecord>();

  return {
    ligen,
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
    async findLigaByTipprunde(tipprundeId) {
      return [...ligen.values()].find((liga) => liga.tipprundeId === tipprundeId) ?? null;
    },
    async insertLiga(input) {
      if ([...ligen.values()].some((liga) => liga.tipprundeId === input.tipprundeId)) {
        throw Object.assign(new Error("exists"), { code: "liga_already_exists" });
      }

      const liga: LigaRecord = {
        id: `liga-${ligen.size + 1}`,
        tipprundeId: input.tipprundeId,
        name: input.name,
      };
      ligen.set(liga.id, liga);
      return liga;
    },
    async updateLiga(tipprundeId, input) {
      const liga = [...ligen.values()].find((entry) => entry.tipprundeId === tipprundeId);
      if (!liga) {
        throw new Error("not found");
      }

      const updated = { ...liga, ...input };
      ligen.set(updated.id, updated);
      return updated;
    },
  };
}

describe("US3 Liga-first Spielplan", () => {
  it("requires Admin or Co-Admin and creates one Liga per Tipprunde", async () => {
    const repository = createRepository();

    const liga = await createLiga(repository, {
      tipprundeId: "tipprunde-1",
      callerNutzerId: "admin-1",
      name: "A-Klasse Nord",
    });

    expect(liga).toMatchObject({ name: "A-Klasse Nord", tipprundeId: "tipprunde-1" });
    await expect(
      createLiga(repository, {
        tipprundeId: "tipprunde-1",
        callerNutzerId: "coadmin-1",
        name: "A-Klasse Süd",
      }),
    ).rejects.toMatchObject({ code: "liga_already_exists" });
  });

  it("keeps Liga creation blocked for normal Nutzer and blank names", async () => {
    const repository = createRepository();

    await expect(
      createLiga(repository, {
        tipprundeId: "tipprunde-1",
        callerNutzerId: "nutzer-1",
        name: "A-Klasse Nord",
      }),
    ).rejects.toMatchObject({ code: "content_manager_required" });

    await expect(
      createLiga(repository, {
        tipprundeId: "tipprunde-1",
        callerNutzerId: "admin-1",
        name: "  ",
      }),
    ).rejects.toMatchObject({ code: "liga_name_required" });
  });

  it("loads the Liga for active Tipprunden members", async () => {
    const repository = createRepository();
    await createLiga(repository, {
      tipprundeId: "tipprunde-1",
      callerNutzerId: "admin-1",
      name: "A-Klasse Nord",
    });

    await expect(
      getLiga(repository, {
        tipprundeId: "tipprunde-1",
        callerNutzerId: "nutzer-1",
      }),
    ).resolves.toMatchObject({ name: "A-Klasse Nord" });
  });
});
