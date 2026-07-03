import { describe, expect, it } from "vitest";

import { AppError } from "@/lib/domain/errors";
import {
  archiveTipprunde,
  createTipprunde,
  permanentlyDeleteTipprunde,
  type TipprundeRecord,
  type TipprundenRepository,
} from "@/lib/domain/tipprunden-repository";

function createRepository(): TipprundenRepository & {
  memberships: Array<{ tipprundeId: string; nutzerId: string; rolle: string }>;
  tipprunden: Map<string, TipprundeRecord>;
} {
  const tipprunden = new Map<string, TipprundeRecord>();
  const memberships: Array<{ tipprundeId: string; nutzerId: string; rolle: string }> = [];

  return {
    tipprunden,
    memberships,
    async insertTipprunde(input) {
      const tipprunde: TipprundeRecord = {
        id: "tipprunde-1",
        name: input.name,
        status: "active",
        besitzerNutzerId: input.besitzerNutzerId,
      };
      tipprunden.set(tipprunde.id, tipprunde);
      return tipprunde;
    },
    async insertMitgliedschaft(input) {
      memberships.push({
        tipprundeId: input.tipprundeId,
        nutzerId: input.nutzerId,
        rolle: input.rolle,
      });
    },
    async getTipprundeById(id) {
      return tipprunden.get(id) ?? null;
    },
    async updateTipprundeStatus(id, status) {
      const tipprunde = tipprunden.get(id);
      if (!tipprunde) {
        throw new Error("not found");
      }
      tipprunde.status = status;
      return tipprunde;
    },
  };
}

describe("US1 Tipprunde contract", () => {
  it("creates a private Tipprunde and Admin membership for the creator", async () => {
    const repository = createRepository();

    const result = await createTipprunde(repository, {
      name: "A-Klasse Runde",
      besitzerNutzerId: "nutzer-1",
      tipprundenNickname: "Chef",
    });

    expect(result.name).toBe("A-Klasse Runde");
    expect(result.status).toBe("active");
    expect(repository.memberships).toEqual([
      {
        tipprundeId: "tipprunde-1",
        nutzerId: "nutzer-1",
        rolle: "admin",
      },
    ]);
  });

  it("rejects blank Tipprunde names", async () => {
    await expect(
      createTipprunde(createRepository(), {
        name: "   ",
        besitzerNutzerId: "nutzer-1",
        tipprundenNickname: "Chef",
      }),
    ).rejects.toMatchObject({ code: "tipprunde_name_required" });
  });

  it("archives only when the caller has owner rights", async () => {
    const repository = createRepository();
    await createTipprunde(repository, {
      name: "A-Klasse Runde",
      besitzerNutzerId: "nutzer-1",
      tipprundenNickname: "Chef",
    });

    await expect(
      archiveTipprunde(repository, {
        tipprundeId: "tipprunde-1",
        callerNutzerId: "nutzer-2",
        isGlobalAdmin: false,
      }),
    ).rejects.toBeInstanceOf(AppError);

    const archived = await archiveTipprunde(repository, {
      tipprundeId: "tipprunde-1",
      callerNutzerId: "nutzer-1",
      isGlobalAdmin: false,
    });

    expect(archived.status).toBe("archived");
  });

  it("requires an explicit safety confirmation for permanent delete", async () => {
    const repository = createRepository();
    await createTipprunde(repository, {
      name: "A-Klasse Runde",
      besitzerNutzerId: "nutzer-1",
      tipprundenNickname: "Chef",
    });

    await expect(
      permanentlyDeleteTipprunde(repository, {
        tipprundeId: "tipprunde-1",
        callerNutzerId: "nutzer-1",
        isGlobalAdmin: false,
        confirmation: "delete",
      }),
    ).rejects.toMatchObject({ code: "delete_confirmation_required" });

    const deleted = await permanentlyDeleteTipprunde(repository, {
      tipprundeId: "tipprunde-1",
      callerNutzerId: "nutzer-1",
      isGlobalAdmin: false,
      confirmation: "A-Klasse Runde",
    });

    expect(deleted.status).toBe("deleted");
  });

  it("allows a global App-Admin to permanently delete with safety confirmation", async () => {
    const repository = createRepository();
    await createTipprunde(repository, {
      name: "A-Klasse Runde",
      besitzerNutzerId: "nutzer-1",
      tipprundenNickname: "Chef",
    });

    const deleted = await permanentlyDeleteTipprunde(repository, {
      tipprundeId: "tipprunde-1",
      callerNutzerId: "global-admin",
      isGlobalAdmin: true,
      confirmation: "A-Klasse Runde",
    });

    expect(deleted.status).toBe("deleted");
  });
});
