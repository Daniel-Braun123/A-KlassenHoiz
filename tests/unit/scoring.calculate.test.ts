import { describe, expect, it } from "vitest";

import { calculatePunkte } from "@/lib/scoring/calculate-punkte";

describe("calculatePunkte", () => {
  it("awards 4 Punkte for exact Ergebnis", () => {
    expect(
      calculatePunkte({ heimtore: 2, auswaertstore: 1 }, { heimtore: 2, auswaertstore: 1 }),
    ).toEqual({
      punkte: 4,
      wertungstyp: "exakt",
    });
  });

  it("awards 3 Punkte for correct winner and Tordifferenz", () => {
    expect(
      calculatePunkte({ heimtore: 2, auswaertstore: 1 }, { heimtore: 3, auswaertstore: 2 }),
    ).toEqual({
      punkte: 3,
      wertungstyp: "tordifferenz",
    });
  });

  it("awards 3 Punkte for draw with correct Tordifferenz", () => {
    expect(
      calculatePunkte({ heimtore: 1, auswaertstore: 1 }, { heimtore: 2, auswaertstore: 2 }),
    ).toEqual({
      punkte: 3,
      wertungstyp: "tordifferenz",
    });
  });

  it("awards 2 Punkte for correct Tendenz only", () => {
    expect(
      calculatePunkte({ heimtore: 2, auswaertstore: 1 }, { heimtore: 1, auswaertstore: 0 }),
    ).toEqual({
      punkte: 2,
      wertungstyp: "tendenz",
    });
  });

  it("awards 0 Punkte for wrong Tendenz", () => {
    expect(
      calculatePunkte({ heimtore: 2, auswaertstore: 1 }, { heimtore: 1, auswaertstore: 1 }),
    ).toEqual({
      punkte: 0,
      wertungstyp: "keine",
    });
  });
});
