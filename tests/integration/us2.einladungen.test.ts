import { describe, expect, it } from "vitest";

import {
  createEinladung,
  joinTipprundeByEinladung,
  type EinladungRecord,
  type EinladungenRepository,
} from "@/lib/domain/einladungen-service";

function createRepository(): EinladungenRepository & {
  einladungen: EinladungRecord[];
  mitgliedschaften: Array<{
    tipprundeId: string;
    nutzerId: string;
    rolle: "nutzer" | "admin" | "co_admin";
    tipprundenNickname: string;
    status: "active" | "removed";
  }>;
} {
  const einladungen: EinladungRecord[] = [];
  const mitgliedschaften: Array<{
    tipprundeId: string;
    nutzerId: string;
    rolle: "nutzer" | "admin" | "co_admin";
    tipprundenNickname: string;
    status: "active" | "removed";
  }> = [
    {
      tipprundeId: "tipprunde-1",
      nutzerId: "admin-1",
      rolle: "admin",
      tipprundenNickname: "Chef",
      status: "active",
    },
  ];

  return {
    einladungen,
    mitgliedschaften,
    async getAktiveMitgliedschaft(tipprundeId, nutzerId) {
      return (
        mitgliedschaften.find(
          (mitgliedschaft) =>
            mitgliedschaft.tipprundeId === tipprundeId &&
            mitgliedschaft.nutzerId === nutzerId &&
            mitgliedschaft.status === "active",
        ) ?? null
      );
    },
    async revokeActiveEinladungen(tipprundeId, revokedAt) {
      for (const einladung of einladungen) {
        if (einladung.tipprundeId === tipprundeId && einladung.status === "active") {
          einladung.status = "revoked";
          einladung.revokedAt = revokedAt;
        }
      }
    },
    async insertEinladung(input) {
      const einladung: EinladungRecord = {
        id: `einladung-${einladungen.length + 1}`,
        tipprundeId: input.tipprundeId,
        token: input.token,
        expiresAt: input.expiresAt,
        status: "active",
        createdBy: input.createdBy,
        createdAt: input.createdAt,
        revokedAt: null,
      };
      einladungen.push(einladung);
      return einladung;
    },
    async getEinladungByToken(token) {
      return einladungen.find((einladung) => einladung.token === token) ?? null;
    },
    async insertMitgliedschaft(input) {
      const membership = {
        tipprundeId: input.tipprundeId,
        nutzerId: input.nutzerId,
        rolle: "nutzer" as const,
        tipprundenNickname: input.tipprundenNickname,
        status: "active" as const,
      };
      mitgliedschaften.push(membership);
      return membership;
    },
  };
}

describe("US2 Einladungen", () => {
  it("creates one active Einladungslink with 7 days default validity and revokes the previous link", async () => {
    const repository = createRepository();
    const now = new Date("2026-07-03T10:00:00.000Z");

    const first = await createEinladung(repository, {
      tipprundeId: "tipprunde-1",
      createdBy: "admin-1",
      now,
      token: "token-alt",
    });
    const second = await createEinladung(repository, {
      tipprundeId: "tipprunde-1",
      createdBy: "admin-1",
      now,
      token: "token-neu",
    });

    expect(first.expiresAt).toBe("2026-07-10T10:00:00.000Z");
    expect(repository.einladungen).toMatchObject([
      { token: "token-alt", status: "revoked" },
      { token: "token-neu", status: "active" },
    ]);
    expect(second.status).toBe("active");
  });

  it("rejects invitation creation by non Admin members", async () => {
    const repository = createRepository();
    repository.mitgliedschaften.push({
      tipprundeId: "tipprunde-1",
      nutzerId: "nutzer-2",
      rolle: "nutzer",
      tipprundenNickname: "Mitspieler",
      status: "active",
    });

    await expect(
      createEinladung(repository, {
        tipprundeId: "tipprunde-1",
        createdBy: "nutzer-2",
        now: new Date("2026-07-03T10:00:00.000Z"),
        token: "token",
      }),
    ).rejects.toMatchObject({ code: "admin_required" });
  });

  it("lets an authenticated Nutzer join with a valid token and Tipprunden-Nickname", async () => {
    const repository = createRepository();
    await createEinladung(repository, {
      tipprundeId: "tipprunde-1",
      createdBy: "admin-1",
      now: new Date("2026-07-03T10:00:00.000Z"),
      token: "token-gueltig",
    });

    const membership = await joinTipprundeByEinladung(repository, {
      token: "token-gueltig",
      nutzerId: "nutzer-2",
      tipprundenNickname: "Knipser",
      now: new Date("2026-07-04T10:00:00.000Z"),
    });

    expect(membership).toMatchObject({
      tipprundeId: "tipprunde-1",
      nutzerId: "nutzer-2",
      rolle: "nutzer",
      tipprundenNickname: "Knipser",
      status: "active",
    });
  });

  it("rejects revoked, expired, invalid and blank-nickname invitations understandably", async () => {
    const repository = createRepository();
    await createEinladung(repository, {
      tipprundeId: "tipprunde-1",
      createdBy: "admin-1",
      now: new Date("2026-07-03T10:00:00.000Z"),
      token: "token-alt",
    });
    await createEinladung(repository, {
      tipprundeId: "tipprunde-1",
      createdBy: "admin-1",
      now: new Date("2026-07-03T10:00:00.000Z"),
      token: "token-neu",
    });

    await expect(
      joinTipprundeByEinladung(repository, {
        token: "token-alt",
        nutzerId: "nutzer-2",
        tipprundenNickname: "Knipser",
        now: new Date("2026-07-04T10:00:00.000Z"),
      }),
    ).rejects.toMatchObject({ code: "einladung_revoked" });

    await expect(
      joinTipprundeByEinladung(repository, {
        token: "token-neu",
        nutzerId: "nutzer-2",
        tipprundenNickname: "Knipser",
        now: new Date("2026-07-11T10:00:00.000Z"),
      }),
    ).rejects.toMatchObject({ code: "einladung_expired" });

    await expect(
      joinTipprundeByEinladung(repository, {
        token: "ungueltig",
        nutzerId: "nutzer-2",
        tipprundenNickname: "Knipser",
        now: new Date("2026-07-04T10:00:00.000Z"),
      }),
    ).rejects.toMatchObject({ code: "einladung_invalid" });

    await expect(
      joinTipprundeByEinladung(repository, {
        token: "token-neu",
        nutzerId: "nutzer-2",
        tipprundenNickname: "   ",
        now: new Date("2026-07-04T10:00:00.000Z"),
      }),
    ).rejects.toMatchObject({ code: "tipprunden_nickname_required" });
  });
});
