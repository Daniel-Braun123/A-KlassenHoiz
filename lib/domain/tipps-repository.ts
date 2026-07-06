import type { SupabaseClient } from "@supabase/supabase-js";

import { AppError } from "@/lib/domain/errors";
import { canSubmitTipp } from "@/lib/domain/tippfristen";
import type { SpielStatus, TipprundeRolle } from "@/lib/domain/types";

export type SpielForTipp = {
  id: string;
  tipprundeId: string;
  spieltagId: string;
  heimteamName: string;
  auswaertsteamName: string;
  heimteamLogoUrl?: string | null;
  auswaertsteamLogoUrl?: string | null;
  anstosszeit: string;
  status: SpielStatus;
  ergebnis: { heimtore: number; auswaertstore: number } | null;
};

export type TippRecord = {
  id: string;
  spielId: string;
  tipprundeId: string;
  nutzerId: string;
  heimtoreTipp: number;
  auswaertstoreTipp: number;
  submittedAt: string;
  updatedAt: string;
};

export type TippsRepository = {
  getAktiveMitgliedschaft(
    tipprundeId: string,
    nutzerId: string,
  ): Promise<{ rolle: TipprundeRolle } | null>;
  getSpielForTipp(tipprundeId: string, spielId: string): Promise<SpielForTipp | null>;
  upsertTipp(input: {
    tipprundeId: string;
    spielId: string;
    nutzerId: string;
    heimtoreTipp: number;
    auswaertstoreTipp: number;
    now: Date;
  }): Promise<TippRecord>;
  listSpieleForSpieltag(tipprundeId: string, spieltagId: string): Promise<SpielForTipp[]>;
  listTippsForSpieltag(tipprundeId: string, spieltagId: string): Promise<TippRecord[]>;
};

function requireScore(value: number, code: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new AppError("Tipps muessen nicht-negative ganze Zahlen sein.", code, 400);
  }

  return value;
}

function mapTipp(row: {
  id: string;
  spiel_id: string;
  tipprunde_id: string;
  nutzer_id: string;
  heimtore_tipp: number;
  auswaertstore_tipp: number;
  submitted_at: string;
  updated_at: string;
}): TippRecord {
  return {
    id: row.id,
    spielId: row.spiel_id,
    tipprundeId: row.tipprunde_id,
    nutzerId: row.nutzer_id,
    heimtoreTipp: row.heimtore_tipp,
    auswaertstoreTipp: row.auswaertstore_tipp,
    submittedAt: row.submitted_at,
    updatedAt: row.updated_at,
  };
}

function mapSpiel(row: {
  id: string;
  tipprunde_id: string;
  spieltag_id: string;
  anstosszeit: string;
  status: SpielStatus;
  heimteam?:
    | { name: string; logo_url?: string | null }
    | Array<{ name: string; logo_url?: string | null }>
    | null;
  auswaertsteam?:
    | { name: string; logo_url?: string | null }
    | Array<{ name: string; logo_url?: string | null }>
    | null;
  ergebnisse?:
    | { heimtore: number; auswaertstore: number }
    | { heimtore: number; auswaertstore: number }[]
    | null;
}): SpielForTipp {
  const heimteam = Array.isArray(row.heimteam) ? row.heimteam[0] : row.heimteam;
  const auswaertsteam = Array.isArray(row.auswaertsteam) ? row.auswaertsteam[0] : row.auswaertsteam;
  const ergebnis = Array.isArray(row.ergebnisse) ? row.ergebnisse[0] : row.ergebnisse;

  return {
    id: row.id,
    tipprundeId: row.tipprunde_id,
    spieltagId: row.spieltag_id,
    heimteamName: heimteam?.name ?? "Heimteam",
    auswaertsteamName: auswaertsteam?.name ?? "Auswaertsteam",
    heimteamLogoUrl: heimteam?.logo_url ?? null,
    auswaertsteamLogoUrl: auswaertsteam?.logo_url ?? null,
    anstosszeit: row.anstosszeit,
    status: row.status,
    ergebnis: ergebnis
      ? { heimtore: ergebnis.heimtore, auswaertstore: ergebnis.auswaertstore }
      : null,
  };
}

export async function submitTipp(
  repository: TippsRepository,
  input: {
    tipprundeId: string;
    spielId: string;
    nutzerId: string;
    heimtoreTipp: number;
    auswaertstoreTipp: number;
    now?: Date;
  },
): Promise<TippRecord> {
  const membership = await repository.getAktiveMitgliedschaft(input.tipprundeId, input.nutzerId);
  if (!membership) {
    throw new AppError("Du bist kein Mitglied dieser Tipprunde.", "membership_required", 403);
  }

  const spiel = await repository.getSpielForTipp(input.tipprundeId, input.spielId);
  if (!spiel) {
    throw new AppError("Spiel nicht gefunden.", "spiel_not_found", 404);
  }

  const now = input.now ?? new Date();
  if (!canSubmitTipp({ now, anstosszeit: spiel.anstosszeit, spielStatus: spiel.status })) {
    throw new AppError(
      "Die Tippfrist fuer dieses Spiel ist abgelaufen.",
      "tippfrist_abgelaufen",
      409,
    );
  }

  return repository.upsertTipp({
    tipprundeId: input.tipprundeId,
    spielId: input.spielId,
    nutzerId: input.nutzerId,
    heimtoreTipp: requireScore(input.heimtoreTipp, "tipp_score_invalid"),
    auswaertstoreTipp: requireScore(input.auswaertstoreTipp, "tipp_score_invalid"),
    now,
  });
}

export function createSupabaseTippsRepository(supabase: SupabaseClient): TippsRepository {
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
    async getSpielForTipp(tipprundeId, spielId) {
      const { data, error } = await supabase
        .from("spiele")
        .select(
          "id, tipprunde_id, spieltag_id, anstosszeit, status, heimteam:heimteam_id(name, logo_url), auswaertsteam:auswaertsteam_id(name, logo_url), ergebnisse(heimtore, auswaertstore)",
        )
        .eq("tipprunde_id", tipprundeId)
        .eq("id", spielId)
        .maybeSingle();

      if (error) {
        throw new AppError("Spiel konnte nicht geladen werden.", "spiel_load_failed", 500);
      }

      return data ? mapSpiel(data) : null;
    },
    async upsertTipp(input) {
      const nowIso = input.now.toISOString();
      const { data, error } = await supabase
        .from("tipps")
        .upsert(
          {
            tipprunde_id: input.tipprundeId,
            spiel_id: input.spielId,
            nutzer_id: input.nutzerId,
            heimtore_tipp: input.heimtoreTipp,
            auswaertstore_tipp: input.auswaertstoreTipp,
            submitted_at: nowIso,
            updated_at: nowIso,
          },
          { onConflict: "spiel_id,nutzer_id" },
        )
        .select(
          "id, spiel_id, tipprunde_id, nutzer_id, heimtore_tipp, auswaertstore_tipp, submitted_at, updated_at",
        )
        .single();

      if (error || !data) {
        throw new AppError("Tipp konnte nicht gespeichert werden.", "tipp_save_failed", 500);
      }

      return mapTipp(data);
    },
    async listSpieleForSpieltag(tipprundeId, spieltagId) {
      const { data, error } = await supabase
        .from("spiele")
        .select(
          "id, tipprunde_id, spieltag_id, anstosszeit, status, heimteam:heimteam_id(name, logo_url), auswaertsteam:auswaertsteam_id(name, logo_url), ergebnisse(heimtore, auswaertstore)",
        )
        .eq("tipprunde_id", tipprundeId)
        .eq("spieltag_id", spieltagId)
        .order("anstosszeit", { ascending: true });

      if (error) {
        throw new AppError("Spiele konnten nicht geladen werden.", "spiele_load_failed", 500);
      }

      return (data ?? []).map(mapSpiel);
    },
    async listTippsForSpieltag(tipprundeId, spieltagId) {
      const { data, error } = await supabase
        .from("tipps")
        .select(
          "id, spiel_id, tipprunde_id, nutzer_id, heimtore_tipp, auswaertstore_tipp, submitted_at, updated_at, spiele!inner(spieltag_id)",
        )
        .eq("tipprunde_id", tipprundeId)
        .eq("spiele.spieltag_id", spieltagId);

      if (error) {
        throw new AppError("Tipps konnten nicht geladen werden.", "tipps_load_failed", 500);
      }

      return (data ?? []).map(mapTipp);
    },
  };
}
