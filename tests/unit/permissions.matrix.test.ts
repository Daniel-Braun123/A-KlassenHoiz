import { describe, expect, it } from "vitest";

import {
  canArchiveTipprunde,
  canManageCoAdmins,
  canManageTipprundeContent,
  canPermanentlyDeleteTipprunde,
  canSubmitOwnTipp,
  canTransferBesitzerrechte,
  canViewTipprunde,
} from "@/lib/auth/permissions";

describe("permission matrix", () => {
  it("allows active members and global admins to view Tipprunden", () => {
    expect(canViewTipprunde({ rolle: "nutzer" })).toBe(true);
    expect(canViewTipprunde({ isGlobalAdmin: true })).toBe(true);
    expect(canViewTipprunde({})).toBe(false);
  });

  it("allows Admins and Co-Admins to manage content", () => {
    expect(canManageTipprundeContent({ rolle: "admin" })).toBe(true);
    expect(canManageTipprundeContent({ rolle: "co_admin" })).toBe(true);
    expect(canManageTipprundeContent({ rolle: "nutzer" })).toBe(false);
  });

  it("restricts Co-Admins from owner-level operations", () => {
    expect(canManageCoAdmins({ rolle: "co_admin", isOwner: false })).toBe(false);
    expect(canArchiveTipprunde({ rolle: "co_admin", isOwner: false })).toBe(false);
    expect(canPermanentlyDeleteTipprunde({ rolle: "co_admin", isOwner: false })).toBe(false);
    expect(canTransferBesitzerrechte()).toBe(false);
  });

  it("allows owner Admin or global App-Admin to permanently delete", () => {
    expect(canPermanentlyDeleteTipprunde({ rolle: "admin", isOwner: true })).toBe(true);
    expect(canPermanentlyDeleteTipprunde({ isGlobalAdmin: true })).toBe(true);
  });

  it("allows own Tipp only before Anstosszeit for planned Spiele", () => {
    const anstosszeit = new Date("2026-07-03T16:30:00.000Z");

    expect(
      canSubmitOwnTipp({
        isOwnTipp: true,
        now: new Date("2026-07-03T16:29:00.000Z"),
        anstosszeit,
        spielStatus: "geplant",
      }),
    ).toBe(true);
    expect(
      canSubmitOwnTipp({
        isOwnTipp: true,
        now: anstosszeit,
        anstosszeit,
        spielStatus: "geplant",
      }),
    ).toBe(false);
    expect(
      canSubmitOwnTipp({
        isOwnTipp: true,
        now: new Date("2026-07-03T16:29:00.000Z"),
        anstosszeit,
        spielStatus: "verschoben",
      }),
    ).toBe(false);
  });
});
