import { describe, expect, it } from "vitest";

import { getTipprundeStartPath } from "@/lib/domain/active-tipprunde";

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
});
