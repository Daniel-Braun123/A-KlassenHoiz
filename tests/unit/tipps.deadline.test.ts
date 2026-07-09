import { describe, expect, it } from "vitest";

import {
  canSubmitTipp,
  getAutomatischerSpielStatus,
  shouldRevealFremdeTipps,
} from "@/lib/domain/tippfristen";

describe("US4 Tippfristen", () => {
  it("allows Tipp submission before the Spiel-Anstosszeit in Europe/Berlin", () => {
    expect(
      canSubmitTipp({
        now: new Date("2026-08-01T13:29:59.000Z"),
        anstosszeit: "2026-08-01T13:30:00.000Z",
        spielStatus: "geplant",
      }),
    ).toBe(true);
  });

  it("locks Tipp submission at and after the Spiel-Anstosszeit", () => {
    expect(
      canSubmitTipp({
        now: new Date("2026-08-01T13:30:00.000Z"),
        anstosszeit: "2026-08-01T13:30:00.000Z",
        spielStatus: "geplant",
      }),
    ).toBe(false);
    expect(
      canSubmitTipp({
        now: new Date("2026-08-01T13:31:00.000Z"),
        anstosszeit: "2026-08-01T13:30:00.000Z",
        spielStatus: "geplant",
      }),
    ).toBe(false);
  });

  it("keeps later Spiele of the same Spieltag tippable while earlier Spiele are locked", () => {
    const now = new Date("2026-08-01T14:00:00.000Z");

    expect(
      canSubmitTipp({
        now,
        anstosszeit: "2026-08-01T13:30:00.000Z",
        spielStatus: "geplant",
      }),
    ).toBe(false);
    expect(
      canSubmitTipp({
        now,
        anstosszeit: "2026-08-01T15:00:00.000Z",
        spielStatus: "geplant",
      }),
    ).toBe(true);
  });

  it("reveals fremde Tipps only after each Spiel's Tippfrist", () => {
    expect(
      shouldRevealFremdeTipps({
        now: new Date("2026-08-01T13:29:59.000Z"),
        anstosszeit: "2026-08-01T13:30:00.000Z",
      }),
    ).toBe(false);
    expect(
      shouldRevealFremdeTipps({
        now: new Date("2026-08-01T13:30:00.000Z"),
        anstosszeit: "2026-08-01T13:30:00.000Z",
      }),
    ).toBe(true);
  });

  it("marks planned Spiele as beendet only after the 90 minute window", () => {
    expect(
      getAutomatischerSpielStatus({
        now: new Date("2026-08-01T15:00:00.000Z"),
        anstosszeit: "2026-08-01T13:30:00.000Z",
        spielStatus: "geplant",
      }),
    ).toBe("geplant");

    expect(
      getAutomatischerSpielStatus({
        now: new Date("2026-08-01T15:00:01.000Z"),
        anstosszeit: "2026-08-01T13:30:00.000Z",
        spielStatus: "geplant",
      }),
    ).toBe("beendet");
  });

  it("keeps manual Sonderstatus unchanged after the 90 minute window", () => {
    expect(
      getAutomatischerSpielStatus({
        now: new Date("2026-08-01T15:00:01.000Z"),
        anstosszeit: "2026-08-01T13:30:00.000Z",
        spielStatus: "verschoben",
      }),
    ).toBe("verschoben");

    expect(
      getAutomatischerSpielStatus({
        now: new Date("2026-08-01T15:00:01.000Z"),
        anstosszeit: "2026-08-01T13:30:00.000Z",
        spielStatus: "abgesagt",
      }),
    ).toBe("abgesagt");
  });
});
