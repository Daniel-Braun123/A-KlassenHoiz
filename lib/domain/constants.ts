export const SPIEL_STATUS = [
  "geplant",
  "beendet",
  "verschoben",
  "abgesagt",
  "abgebrochen",
] as const;

export const TIPPRUNDE_STATUS = ["active", "archived", "deleted"] as const;
export const MITGLIEDSCHAFT_STATUS = ["active", "removed"] as const;
export const EINLADUNG_STATUS = ["active", "revoked", "expired"] as const;
export const TIPPRUNDE_ROLLE = ["nutzer", "admin", "co_admin"] as const;
export const WERTUNGSTYP = ["exakt", "tordifferenz", "tendenz", "keine"] as const;
export const SPIELTAG_ABSCHNITT = ["hinrunde", "rueckrunde", "nachholspiele", "frei"] as const;

export const BERLIN_TIME_ZONE = "Europe/Berlin";
export const EINLADUNG_GUELTIGKEIT_TAGE = 7;

export const VERBOTENE_WETTBEGRIFFE = ["Wette", "Einsatz", "Quote", "Auszahlung"] as const;
