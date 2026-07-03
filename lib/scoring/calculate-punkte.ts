import type { Score, Wertungstyp } from "@/lib/domain/types";

export type PunkteResult = {
  punkte: number;
  wertungstyp: Wertungstyp;
};

function tendenz(score: Score): "heim" | "auswaerts" | "unentschieden" {
  if (score.heimtore > score.auswaertstore) {
    return "heim";
  }

  if (score.heimtore < score.auswaertstore) {
    return "auswaerts";
  }

  return "unentschieden";
}

function tordifferenz(score: Score): number {
  return score.heimtore - score.auswaertstore;
}

function isSameOrHigherScoreline(ergebnis: Score, tipp: Score): boolean {
  return tipp.heimtore >= ergebnis.heimtore && tipp.auswaertstore >= ergebnis.auswaertstore;
}

export function calculatePunkte(ergebnis: Score, tipp: Score): PunkteResult {
  if (ergebnis.heimtore === tipp.heimtore && ergebnis.auswaertstore === tipp.auswaertstore) {
    return { punkte: 4, wertungstyp: "exakt" };
  }

  if (tendenz(ergebnis) !== tendenz(tipp)) {
    return { punkte: 0, wertungstyp: "keine" };
  }

  if (
    tordifferenz(ergebnis) === tordifferenz(tipp) &&
    (tendenz(ergebnis) === "unentschieden" || isSameOrHigherScoreline(ergebnis, tipp))
  ) {
    return { punkte: 3, wertungstyp: "tordifferenz" };
  }

  return { punkte: 2, wertungstyp: "tendenz" };
}
