import { describe, expect, it } from "vitest";

import { getTipprundeStartPath } from "@/lib/domain/active-tipprunde";
import { readActiveTipprundeMembership } from "@/lib/domain/active-tipprunde-memberships";

describe("active Tipprunde routing", () => {
  it("routes to the current Spieltag when one exists", () => {
    expect(
      getTipprundeStartPath({
        id: "tipprunde-1",
        currentSpieltagId: "spieltag-1",
      }),
    ).toBe("/tipprunde-1/spieltage/spieltag-1");
  });

  it("routes to the Rangliste when a real Tipprunde has no current Spieltag yet", () => {
    expect(
      getTipprundeStartPath({
        id: "tipprunde-ohne-spieltag",
        currentSpieltagId: null,
      }),
    ).toBe("/tipprunde-ohne-spieltag/rangliste");
  });

  it("maps only active Tipprunden from membership rows", () => {
    expect(
      readActiveTipprundeMembership({
        rolle: "admin",
        tipprunden: { id: "tipprunde-1", name: "A-Klasse", status: "active" },
      }),
    ).toEqual({ id: "tipprunde-1", name: "A-Klasse", rolle: "admin" });

    expect(
      readActiveTipprundeMembership({
        rolle: "admin",
        tipprunden: { id: "tipprunde-2", name: "Archiv", status: "archived" },
      }),
    ).toBeNull();

    expect(
      readActiveTipprundeMembership({
        rolle: "admin",
        tipprunden: { id: "tipprunde-3", name: "Papierkorb", status: "deleted" },
      }),
    ).toBeNull();
  });
});
