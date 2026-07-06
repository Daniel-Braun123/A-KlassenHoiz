import type {
  EINLADUNG_STATUS,
  MITGLIEDSCHAFT_STATUS,
  SPIEL_STATUS,
  SPIELTAG_ABSCHNITT,
  TIPPRUNDE_ROLLE,
  TIPPRUNDE_STATUS,
  WERTUNGSTYP,
} from "./constants";

export type SpielStatus = (typeof SPIEL_STATUS)[number];
export type TipprundeStatus = (typeof TIPPRUNDE_STATUS)[number];
export type MitgliedschaftStatus = (typeof MITGLIEDSCHAFT_STATUS)[number];
export type EinladungStatus = (typeof EINLADUNG_STATUS)[number];
export type TipprundeRolle = (typeof TIPPRUNDE_ROLLE)[number];
export type Wertungstyp = (typeof WERTUNGSTYP)[number];
export type SpieltagAbschnitt = (typeof SPIELTAG_ABSCHNITT)[number];

export type UUID = string;
export type ISODateTime = string;

export interface Nutzer {
  id: UUID;
  email: string;
  anzeigename: string;
  echterName?: string | null;
  isGlobalAdmin: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Tipprunde {
  id: UUID;
  name: string;
  besitzerNutzerId: UUID;
  status: TipprundeStatus;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  archivedAt?: ISODateTime | null;
  deletedAt?: ISODateTime | null;
}

export interface Mitgliedschaft {
  id: UUID;
  tipprundeId: UUID;
  nutzerId: UUID;
  rolle: TipprundeRolle;
  tipprundenNickname: string;
  status: MitgliedschaftStatus;
  joinedAt: ISODateTime;
  removedAt?: ISODateTime | null;
}

export interface Einladung {
  id: UUID;
  tipprundeId: UUID;
  token: string;
  expiresAt: ISODateTime;
  status: EinladungStatus;
  createdBy: UUID;
  createdAt: ISODateTime;
  revokedAt?: ISODateTime | null;
}

export interface TeamVerein {
  id: UUID;
  tipprundeId: UUID;
  name: string;
  logoUrl?: string | null;
  externalSource?: string | null;
  externalTeamId?: string | null;
  externalUrl?: string | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Spieltag {
  id: UUID;
  tipprundeId: UUID;
  name: string;
  abschnitt: SpieltagAbschnitt;
  nummer: number;
  sortOrder: number;
  externalSource?: string | null;
  externalLeagueId?: string | null;
  externalMatchdayId?: string | null;
  externalUrl?: string | null;
  lastSyncedAt?: ISODateTime | null;
  importStatus?: string | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Spiel {
  id: UUID;
  tipprundeId: UUID;
  spieltagId: UUID;
  heimteamId: UUID;
  auswaertsteamId: UUID;
  anstosszeit: ISODateTime;
  timezone: "Europe/Berlin";
  status: SpielStatus;
  externalSource?: string | null;
  externalMatchId?: string | null;
  externalUrl?: string | null;
  lastSyncedAt?: ISODateTime | null;
  importStatus?: string | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Tipp {
  id: UUID;
  spielId: UUID;
  nutzerId: UUID;
  tipprundeId: UUID;
  heimtoreTipp: number;
  auswaertstoreTipp: number;
  submittedAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Ergebnis {
  id: UUID;
  spielId: UUID;
  heimtore: number;
  auswaertstore: number;
  enteredBy: UUID;
  enteredAt: ISODateTime;
  updatedAt: ISODateTime;
  isChangedAfterScoring: boolean;
}

export interface ErgebnisAenderung {
  id: UUID;
  spielId: UUID;
  oldHeimtore: number | null;
  oldAuswaertstore: number | null;
  newHeimtore: number;
  newAuswaertstore: number;
  changedBy: UUID;
  changedAt: ISODateTime;
  reason?: string | null;
}

export interface Punktewertung {
  id: UUID;
  spielId: UUID;
  nutzerId: UUID;
  tipprundeId: UUID;
  punkte: number;
  wertungstyp: Wertungstyp;
  calculatedAt: ISODateTime;
}

export interface RanglisteEintrag {
  tipprundeId: UUID;
  spieltagId?: UUID;
  nutzerId: UUID;
  tipprundenNickname?: string | null;
  anzeigename: string;
  punkte: number;
  platzierung: number;
  anzahlExakteTipps: number;
  anzahlTordifferenzTipps: number;
  anzahlTendenzTipps: number;
  anzahlAbgegebeneTipps: number;
}

export interface Score {
  heimtore: number;
  auswaertstore: number;
}
