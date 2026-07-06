import type { SupabaseClient } from "@supabase/supabase-js";

import { SPIEL_STATUS } from "@/lib/domain/constants";
import {
  assertCanManageContent,
  type ContentManagerRepositoryPart,
} from "@/lib/domain/content-management";
import { AppError } from "@/lib/domain/errors";
import type { SpielStatus } from "@/lib/domain/types";
import { berlinWallTimeToUtc } from "@/lib/timezone/berlin";

export type SpielRecord = {
  id: string;
  tipprundeId: string;
  spieltagId: string;
  heimteamId: string;
  auswaertsteamId: string;
  anstosszeit: string;
  timezone: "Europe/Berlin";
  status: SpielStatus;
  ergebnis: { heimtore: number; auswaertstore: number } | null;
};

export type SpieleRepository = ContentManagerRepositoryPart & {
  listSpiele(tipprundeId: string, spieltagId?: string): Promise<SpielRecord[]>;
  insertSpiel(input: {
    tipprundeId: string;
    spieltagId: string;
    heimteamId: string;
    auswaertsteamId: string;
    anstosszeit: string;
    status: SpielStatus;
  }): Promise<SpielRecord>;
  updateSpiel(
    spielId: string,
    input: {
      spieltagId?: string;
      heimteamId?: string;
      auswaertsteamId?: string;
      anstosszeit?: string;
      status?: SpielStatus;
    },
  ): Promise<SpielRecord>;
  deleteSpiel(spielId: string): Promise<void>;
};

function mapSpiel(row: {
  id: string;
  tipprunde_id: string;
  spieltag_id: string;
  heimteam_id: string;
  auswaertsteam_id: string;
  anstosszeit: string;
  timezone: "Europe/Berlin";
  status: SpielStatus;
  ergebnisse?:
    | { heimtore: number; auswaertstore: number }
    | { heimtore: number; auswaertstore: number }[]
    | null;
}): SpielRecord {
  const ergebnis = Array.isArray(row.ergebnisse) ? row.ergebnisse[0] : row.ergebnisse;

  return {
    id: row.id,
    tipprundeId: row.tipprunde_id,
    spieltagId: row.spieltag_id,
    heimteamId: row.heimteam_id,
    auswaertsteamId: row.auswaertsteam_id,
    anstosszeit: row.anstosszeit,
    timezone: row.timezone,
    status: row.status,
    ergebnis: ergebnis
      ? { heimtore: ergebnis.heimtore, auswaertstore: ergebnis.auswaertstore }
      : null,
  };
}

function requireSpielStatus(value: unknown): SpielStatus {
  if (typeof value === "string" && SPIEL_STATUS.includes(value as SpielStatus)) {
    return value as SpielStatus;
  }

  throw new AppError("Ungueltiger Spielstatus.", "spiel_status_invalid", 400);
}

function requireId(value: string, field: string, code: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new AppError(`${field} ist erforderlich.`, code, 400);
  }

  return trimmed;
}

function toBerlinIso(date: string, time: string): string {
  return berlinWallTimeToUtc(date, time).toISOString();
}

function validateTeamsDiffer(heimteamId: string, auswaertsteamId: string): void {
  if (heimteamId === auswaertsteamId) {
    throw new AppError(
      "Heimverein und Auswärtsverein müssen unterschiedlich sein.",
      "spiel_vereine_must_differ",
      400,
    );
  }
}

export async function createSpiel(
  repository: SpieleRepository,
  input: {
    tipprundeId: string;
    callerNutzerId: string;
    spieltagId: string;
    heimteamId: string;
    auswaertsteamId: string;
    anstossDatum: string;
    anstossUhrzeit: string;
    status: unknown;
    isGlobalAdmin?: boolean;
  },
): Promise<SpielRecord> {
  await assertCanManageContent(repository, input);

  const heimteamId = requireId(input.heimteamId, "Heimverein", "spiel_heimteam_required");
  const auswaertsteamId = requireId(
    input.auswaertsteamId,
    "Auswärtsverein",
    "spiel_auswaertsteam_required",
  );
  validateTeamsDiffer(heimteamId, auswaertsteamId);

  return repository.insertSpiel({
    tipprundeId: input.tipprundeId,
    spieltagId: requireId(input.spieltagId, "Spieltag", "spiel_spieltag_required"),
    heimteamId,
    auswaertsteamId,
    anstosszeit: toBerlinIso(input.anstossDatum, input.anstossUhrzeit),
    status: requireSpielStatus(input.status),
  });
}

export async function updateSpiel(
  repository: SpieleRepository,
  input: {
    tipprundeId: string;
    spielId: string;
    callerNutzerId: string;
    spieltagId?: string;
    heimteamId?: string;
    auswaertsteamId?: string;
    anstossDatum?: string;
    anstossUhrzeit?: string;
    status?: unknown;
    isGlobalAdmin?: boolean;
  },
): Promise<SpielRecord> {
  await assertCanManageContent(repository, input);

  const heimteamId = input.heimteamId
    ? requireId(input.heimteamId, "Heimverein", "spiel_heimteam_required")
    : undefined;
  const auswaertsteamId = input.auswaertsteamId
    ? requireId(input.auswaertsteamId, "Auswärtsverein", "spiel_auswaertsteam_required")
    : undefined;
  if (heimteamId && auswaertsteamId) {
    validateTeamsDiffer(heimteamId, auswaertsteamId);
  }

  return repository.updateSpiel(input.spielId, {
    spieltagId: input.spieltagId
      ? requireId(input.spieltagId, "Spieltag", "spiel_spieltag_required")
      : undefined,
    heimteamId,
    auswaertsteamId,
    anstosszeit:
      input.anstossDatum && input.anstossUhrzeit
        ? toBerlinIso(input.anstossDatum, input.anstossUhrzeit)
        : undefined,
    status: input.status === undefined ? undefined : requireSpielStatus(input.status),
  });
}

export async function deleteSpiel(
  repository: SpieleRepository,
  input: {
    tipprundeId: string;
    spielId: string;
    callerNutzerId: string;
    isGlobalAdmin?: boolean;
  },
): Promise<void> {
  await assertCanManageContent(repository, input);
  await repository.deleteSpiel(input.spielId);
}

export function createSupabaseSpieleRepository(supabase: SupabaseClient): SpieleRepository {
  return {
    async getAktiveMitgliedschaft(tipprundeId, nutzerId) {
      const { data, error } = await supabase
        .from("mitgliedschaften")
        .select("rolle")
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

      return data ? { rolle: data.rolle } : null;
    },
    async listSpiele(tipprundeId, spieltagId) {
      let query = supabase
        .from("spiele")
        .select(
          "id, tipprunde_id, spieltag_id, heimteam_id, auswaertsteam_id, anstosszeit, timezone, status, ergebnisse(heimtore, auswaertstore)",
        )
        .eq("tipprunde_id", tipprundeId)
        .order("anstosszeit", { ascending: true });

      if (spieltagId) {
        query = query.eq("spieltag_id", spieltagId);
      }

      const { data, error } = await query;

      if (error) {
        throw new AppError("Spiele konnten nicht geladen werden.", "spiele_load_failed", 500);
      }

      return (data ?? []).map(mapSpiel);
    },
    async insertSpiel(input) {
      const { data, error } = await supabase
        .from("spiele")
        .insert({
          tipprunde_id: input.tipprundeId,
          spieltag_id: input.spieltagId,
          heimteam_id: input.heimteamId,
          auswaertsteam_id: input.auswaertsteamId,
          anstosszeit: input.anstosszeit,
          timezone: "Europe/Berlin",
          status: input.status,
        })
        .select(
          "id, tipprunde_id, spieltag_id, heimteam_id, auswaertsteam_id, anstosszeit, timezone, status",
        )
        .single();

      if (error || !data) {
        throw new AppError("Spiel konnte nicht erstellt werden.", "spiel_create_failed", 500);
      }

      return mapSpiel(data);
    },
    async updateSpiel(spielId, input) {
      const updatePayload: Record<string, string> = {};
      if (input.spieltagId !== undefined) {
        updatePayload.spieltag_id = input.spieltagId;
      }
      if (input.heimteamId !== undefined) {
        updatePayload.heimteam_id = input.heimteamId;
      }
      if (input.auswaertsteamId !== undefined) {
        updatePayload.auswaertsteam_id = input.auswaertsteamId;
      }
      if (input.anstosszeit !== undefined) {
        updatePayload.anstosszeit = input.anstosszeit;
      }
      if (input.status !== undefined) {
        updatePayload.status = input.status;
      }

      const { data, error } = await supabase
        .from("spiele")
        .update(updatePayload)
        .eq("id", spielId)
        .select(
          "id, tipprunde_id, spieltag_id, heimteam_id, auswaertsteam_id, anstosszeit, timezone, status",
        )
        .single();

      if (error || !data) {
        throw new AppError("Spiel konnte nicht aktualisiert werden.", "spiel_update_failed", 500);
      }

      return mapSpiel(data);
    },
    async deleteSpiel(spielId) {
      const { error } = await supabase.from("spiele").delete().eq("id", spielId);
      if (error) {
        throw new AppError("Spiel konnte nicht geloescht werden.", "spiel_delete_failed", 500);
      }
    },
  };
}
