import { describe, expect, it } from "vitest";

import { deriveRangliste } from "@/lib/scoring/derive-ranglisten";

describe("deriveRangliste", () => {
  it("sorts by Punkte descending and assigns competition Platzierung", () => {
    const rangliste = deriveRangliste([
      {
        nutzerId: "u3",
        tipprundeId: "t1",
        anzeigename: "Clara",
        punkte: 7,
      },
      {
        nutzerId: "u1",
        tipprundeId: "t1",
        anzeigename: "Anna",
        punkte: 10,
      },
      {
        nutzerId: "u2",
        tipprundeId: "t1",
        anzeigename: "Berta",
        punkte: 10,
      },
    ]);

    expect(rangliste.map((entry) => [entry.nutzerId, entry.platzierung])).toEqual([
      ["u1", 1],
      ["u2", 1],
      ["u3", 3],
    ]);
  });

  it("uses Tipprunden-Nickname before Anzeigename for tied alphabetical sorting", () => {
    const rangliste = deriveRangliste([
      {
        nutzerId: "u1",
        tipprundeId: "t1",
        anzeigename: "Zoe",
        tipprundenNickname: "Zebra",
        punkte: 5,
      },
      {
        nutzerId: "u2",
        tipprundeId: "t1",
        anzeigename: "Anna",
        tipprundenNickname: "Alpha",
        punkte: 5,
      },
    ]);

    expect(rangliste.map((entry) => entry.nutzerId)).toEqual(["u2", "u1"]);
  });
});
