import type { SpielStatus } from "@/lib/domain/types";

export const SPIEL_LIVE_WINDOW_MS = 90 * 60 * 1000;

export function canSubmitTipp({
  now,
  anstosszeit,
  spielStatus,
}: {
  now: Date;
  anstosszeit: string | Date;
  spielStatus: SpielStatus;
}): boolean {
  return spielStatus === "geplant" && now.getTime() < new Date(anstosszeit).getTime();
}

export function shouldRevealFremdeTipps({
  now,
  anstosszeit,
}: {
  now: Date;
  anstosszeit: string | Date;
}): boolean {
  return now.getTime() >= new Date(anstosszeit).getTime();
}

export function isSpielVorbei({
  now,
  anstosszeit,
}: {
  now: Date;
  anstosszeit: string | Date;
}): boolean {
  return now.getTime() > new Date(anstosszeit).getTime() + SPIEL_LIVE_WINDOW_MS;
}
