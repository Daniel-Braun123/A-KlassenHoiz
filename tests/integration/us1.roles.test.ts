import { describe, expect, it } from "vitest";

import {
  changeMitgliedschaftRolle,
  type MitgliedschaftenRepository,
} from "@/lib/domain/mitgliedschaften-service";

function createRepository(): MitgliedschaftenRepository {
  const memberships = new Map<
    string,
    {
      id: string;
      tipprundeId: string;
      nutzerId: string;
      rolle: "nutzer" | "admin" | "co_admin";
      status: "active";
    }
  >([
    [
      "owner",
      {
        id: "owner",
        tipprundeId: "tipprunde-1",
        nutzerId: "nutzer-1",
        rolle: "admin",
        status: "active",
      },
    ],
    [
      "member",
      {
        id: "member",
        tipprundeId: "tipprunde-1",
        nutzerId: "nutzer-2",
        rolle: "nutzer",
        status: "active",
      },
    ],
    [
      "coadmin",
      {
        id: "coadmin",
        tipprundeId: "tipprunde-1",
        nutzerId: "nutzer-3",
        rolle: "co_admin",
        status: "active",
      },
    ],
  ]);

  return {
    async getTipprundeOwnerId() {
      return "nutzer-1";
    },
    async getMitgliedschaftByNutzer(tipprundeId, nutzerId) {
      return (
        [...memberships.values()].find(
          (membership) =>
            membership.tipprundeId === tipprundeId && membership.nutzerId === nutzerId,
        ) ?? null
      );
    },
    async updateMitgliedschaftRolle(mitgliedschaftId, rolle) {
      const membership = memberships.get(mitgliedschaftId);
      if (!membership) {
        throw new Error("not found");
      }
      membership.rolle = rolle;
      return membership;
    },
  };
}

describe("US1 role management", () => {
  it("allows owner Admin to appoint a Co-Admin", async () => {
    const result = await changeMitgliedschaftRolle(createRepository(), {
      tipprundeId: "tipprunde-1",
      targetNutzerId: "nutzer-2",
      callerNutzerId: "nutzer-1",
      rolle: "co_admin",
      isGlobalAdmin: false,
    });

    expect(result.rolle).toBe("co_admin");
  });

  it("allows owner Admin to remove Co-Admin rights", async () => {
    const result = await changeMitgliedschaftRolle(createRepository(), {
      tipprundeId: "tipprunde-1",
      targetNutzerId: "nutzer-3",
      callerNutzerId: "nutzer-1",
      rolle: "nutzer",
      isGlobalAdmin: false,
    });

    expect(result.rolle).toBe("nutzer");
  });

  it("rejects Co-Admin attempts to change roles", async () => {
    await expect(
      changeMitgliedschaftRolle(createRepository(), {
        tipprundeId: "tipprunde-1",
        targetNutzerId: "nutzer-2",
        callerNutzerId: "nutzer-3",
        rolle: "co_admin",
        isGlobalAdmin: false,
      }),
    ).rejects.toMatchObject({ code: "owner_required" });
  });

  it("does not allow changing the owner Admin role through Co-Admin management", async () => {
    await expect(
      changeMitgliedschaftRolle(createRepository(), {
        tipprundeId: "tipprunde-1",
        targetNutzerId: "nutzer-1",
        callerNutzerId: "nutzer-1",
        rolle: "nutzer",
        isGlobalAdmin: false,
      }),
    ).rejects.toMatchObject({ code: "owner_role_locked" });
  });
});
