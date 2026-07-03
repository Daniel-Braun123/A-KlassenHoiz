import { describe, expect, it } from "vitest";

import {
  berlinWallTimeToUtc,
  formatBerlinDateTime,
  isBeforeAnstosszeit,
} from "@/lib/timezone/berlin";

describe("Europe/Berlin time helpers", () => {
  it("converts summer Berlin wall time to UTC", () => {
    expect(berlinWallTimeToUtc("2026-07-03", "18:30").toISOString()).toBe(
      "2026-07-03T16:30:00.000Z",
    );
  });

  it("converts winter Berlin wall time to UTC", () => {
    expect(berlinWallTimeToUtc("2026-01-15", "18:30").toISOString()).toBe(
      "2026-01-15T17:30:00.000Z",
    );
  });

  it("formats an instant as Berlin date time", () => {
    expect(formatBerlinDateTime(new Date("2026-07-03T16:30:00.000Z"))).toBe("2026-07-03 18:30");
  });

  it("locks tips at the exact Anstosszeit", () => {
    const anstosszeit = new Date("2026-07-03T16:30:00.000Z");

    expect(isBeforeAnstosszeit(new Date("2026-07-03T16:29:59.999Z"), anstosszeit)).toBe(true);
    expect(isBeforeAnstosszeit(new Date("2026-07-03T16:30:00.000Z"), anstosszeit)).toBe(false);
  });
});
