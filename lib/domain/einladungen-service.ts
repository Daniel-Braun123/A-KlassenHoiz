import { randomBytes } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import { EINLADUNG_GUELTIGKEIT_TAGE } from "@/lib/domain/constants";
import { AppError } from "@/lib/domain/errors";
import type { EinladungStatus, TipprundeRolle } from "@/lib/domain/types";

export type EinladungRecord = {
  id: string;
  tipprundeId: string;
  token: string;
  expiresAt: string;
  status: EinladungStatus;
  createdBy: string;
  createdAt: string;
  revokedAt?: string | null;
};

export type EinladungMitgliedschaftRecord = {
  tipprundeId: string;
  nutzerId: string;
  rolle: TipprundeRolle;
  tipprundenNickname: string;
  status: "active" | "removed";
};

export type EinladungenRepository = {
  getAktiveMitgliedschaft(
    tipprundeId: string,
    nutzerId: string,
  ): Promise<EinladungMitgliedschaftRecord | null>;
  revokeActiveEinladungen(tipprundeId: string, revokedAt: string): Promise<void>;
  insertEinladung(input: {
    tipprundeId: string;
    token: string;
    expiresAt: string;
    createdBy: string;
    createdAt: string;
  }): Promise<EinladungRecord>;
  getEinladungByToken(token: string): Promise<EinladungRecord | null>;
  insertMitgliedschaft(input: {
    tipprundeId: string;
    nutzerId: string;
    tipprundenNickname: string;
  }): Promise<EinladungMitgliedschaftRecord>;
};

function mapEinladung(row: {
  id: string;
  tipprunde_id: string;
  token: string;
  expires_at: string;
  status: EinladungStatus;
  created_by: string;
  created_at: string;
  revoked_at?: string | null;
}): EinladungRecord {
  return {
    id: row.id,
    tipprundeId: row.tipprunde_id,
    token: row.token,
    expiresAt: row.expires_at,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    revokedAt: row.revoked_at ?? null,
  };
}

function mapMitgliedschaft(row: {
  tipprunde_id: string;
  nutzer_id: string;
  rolle: TipprundeRolle;
  tipprunden_nickname: string;
  status: "active" | "removed";
}): EinladungMitgliedschaftRecord {
  return {
    tipprundeId: row.tipprunde_id,
    nutzerId: row.nutzer_id,
    rolle: row.rolle,
    tipprundenNickname: row.tipprunden_nickname,
    status: row.status,
  };
}

function createToken(): string {
  return randomBytes(32).toString("base64url");
}

function addDefaultValidity(now: Date): string {
  const expiresAt = new Date(now);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + EINLADUNG_GUELTIGKEIT_TAGE);
  return expiresAt.toISOString();
}

function requireNickname(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new AppError(
      "Bitte gib einen Tipprunden-Nickname ein.",
      "tipprunden_nickname_required",
      400,
    );
  }

  return trimmed;
}

export async function createEinladung(
  repository: EinladungenRepository,
  input: {
    tipprundeId: string;
    createdBy: string;
    now?: Date;
    token?: string;
  },
): Promise<EinladungRecord> {
  const membership = await repository.getAktiveMitgliedschaft(input.tipprundeId, input.createdBy);
  if (membership?.rolle !== "admin") {
    throw new AppError("Nur Admins duerfen Einladungslinks erstellen.", "admin_required", 403);
  }

  const now = input.now ?? new Date();
  const createdAt = now.toISOString();
  await repository.revokeActiveEinladungen(input.tipprundeId, createdAt);

  return repository.insertEinladung({
    tipprundeId: input.tipprundeId,
    token: input.token ?? createToken(),
    expiresAt: addDefaultValidity(now),
    createdBy: input.createdBy,
    createdAt,
  });
}

export async function joinTipprundeByEinladung(
  repository: EinladungenRepository,
  input: {
    token: string;
    nutzerId: string;
    tipprundenNickname: string;
    now?: Date;
  },
): Promise<EinladungMitgliedschaftRecord> {
  const nickname = requireNickname(input.tipprundenNickname);
  const einladung = await repository.getEinladungByToken(input.token);
  if (!einladung) {
    throw new AppError("Dieser Einladungslink ist ungueltig.", "einladung_invalid", 404);
  }

  if (einladung.status === "revoked") {
    throw new AppError(
      "Dieser Einladungslink wurde ersetzt. Bitte nutze den aktuellen Link.",
      "einladung_revoked",
      410,
    );
  }

  const now = input.now ?? new Date();
  if (einladung.status === "expired" || new Date(einladung.expiresAt).getTime() <= now.getTime()) {
    throw new AppError(
      "Dieser Einladungslink ist abgelaufen. Bitte frage nach einem neuen Link.",
      "einladung_expired",
      410,
    );
  }

  const existing = await repository.getAktiveMitgliedschaft(einladung.tipprundeId, input.nutzerId);
  if (existing) {
    return existing;
  }

  return repository.insertMitgliedschaft({
    tipprundeId: einladung.tipprundeId,
    nutzerId: input.nutzerId,
    tipprundenNickname: nickname,
  });
}

export function buildEinladungslink(origin: string, token: string): string {
  return new URL(`/einladungen/${token}`, origin).toString();
}

export function createSupabaseEinladungenRepository(
  supabase: SupabaseClient,
): EinladungenRepository {
  return {
    async getAktiveMitgliedschaft(tipprundeId, nutzerId) {
      const { data, error } = await supabase
        .from("mitgliedschaften")
        .select("tipprunde_id, nutzer_id, rolle, tipprunden_nickname, status")
        .eq("tipprunde_id", tipprundeId)
        .eq("nutzer_id", nutzerId)
        .eq("status", "active")
        .maybeSingle();

      if (error) {
        throw new AppError(
          "Mitgliedschaft konnte nicht geladen werden.",
          "membership_load_failed",
          500,
        );
      }

      return data ? mapMitgliedschaft(data) : null;
    },
    async revokeActiveEinladungen(tipprundeId, revokedAt) {
      const { error } = await supabase
        .from("einladungen")
        .update({ status: "revoked", revoked_at: revokedAt })
        .eq("tipprunde_id", tipprundeId)
        .eq("status", "active");

      if (error) {
        throw new AppError(
          "Bisheriger Einladungslink konnte nicht ungueltig gemacht werden.",
          "einladung_revoke_failed",
          500,
        );
      }
    },
    async insertEinladung(input) {
      const { data, error } = await supabase
        .from("einladungen")
        .insert({
          tipprunde_id: input.tipprundeId,
          token: input.token,
          expires_at: input.expiresAt,
          created_by: input.createdBy,
          created_at: input.createdAt,
        })
        .select("id, tipprunde_id, token, expires_at, status, created_by, created_at, revoked_at")
        .single();

      if (error || !data) {
        throw new AppError(
          "Einladungslink konnte nicht erstellt werden.",
          "einladung_create_failed",
          500,
        );
      }

      return mapEinladung(data);
    },
    async getEinladungByToken(token) {
      const { data, error } = await supabase
        .from("einladungen")
        .select("id, tipprunde_id, token, expires_at, status, created_by, created_at, revoked_at")
        .eq("token", token)
        .maybeSingle();

      if (error) {
        throw new AppError(
          "Einladungslink konnte nicht geladen werden.",
          "einladung_load_failed",
          500,
        );
      }

      return data ? mapEinladung(data) : null;
    },
    async insertMitgliedschaft(input) {
      const { data, error } = await supabase
        .from("mitgliedschaften")
        .insert({
          tipprunde_id: input.tipprundeId,
          nutzer_id: input.nutzerId,
          rolle: "nutzer",
          tipprunden_nickname: input.tipprundenNickname,
        })
        .select("tipprunde_id, nutzer_id, rolle, tipprunden_nickname, status")
        .single();

      if (error || !data) {
        throw new AppError(
          "Beitritt zur Tipprunde konnte nicht gespeichert werden.",
          "membership_join_failed",
          500,
        );
      }

      return mapMitgliedschaft(data);
    },
  };
}
