import type { SupabaseClient } from "@supabase/supabase-js";

import {
  assertCanManageContent,
  type ContentManagerRepositoryPart,
} from "@/lib/domain/content-management";
import { AppError } from "@/lib/domain/errors";

export type ErgebnisRecord = {
  id: string;
  spielId: string;
  heimtore: number;
  auswaertstore: number;
  enteredBy: string;
  enteredAt: string;
  updatedAt: string;
  isChangedAfterScoring: boolean;
};

export type ErgebnisAenderungRecord = {
  id: string;
  spielId: string;
  oldHeimtore: number | null;
  oldAuswaertstore: number | null;
  newHeimtore: number;
  newAuswaertstore: number;
  changedBy: string;
  changedAt: string;
  reason: string | null;
};

export type ErgebnisseRepository = ContentManagerRepositoryPart & {
  getSpiel(spielId: string): Promise<{ id: string; tipprundeId: string } | null>;
  getErgebnisBySpiel(spielId: string): Promise<ErgebnisRecord | null>;
  insertErgebnis(input: {
    spielId: string;
    heimtore: number;
    auswaertstore: number;
    enteredBy: string;
    now: string;
  }): Promise<ErgebnisRecord>;
  updateErgebnis(input: {
    spielId: string;
    heimtore: number;
    auswaertstore: number;
    enteredBy: string;
    now: string;
  }): Promise<ErgebnisRecord>;
  insertErgebnisAenderung(input: {
    spielId: string;
    oldHeimtore: number;
    oldAuswaertstore: number;
    newHeimtore: number;
    newAuswaertstore: number;
    changedBy: string;
    changedAt: string;
    reason: string | null;
  }): Promise<ErgebnisAenderungRecord>;
};

function requireScore(value: number): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new AppError(
      "Ergebnisse muessen nicht-negative ganze Zahlen sein.",
      "ergebnis_score_invalid",
      400,
    );
  }

  return value;
}

function normalizeReason(value?: string | null): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed || null;
}

function mapErgebnis(row: {
  id: string;
  spiel_id: string;
  heimtore: number;
  auswaertstore: number;
  entered_by: string;
  entered_at: string;
  updated_at: string;
  is_changed_after_scoring: boolean;
}): ErgebnisRecord {
  return {
    id: row.id,
    spielId: row.spiel_id,
    heimtore: row.heimtore,
    auswaertstore: row.auswaertstore,
    enteredBy: row.entered_by,
    enteredAt: row.entered_at,
    updatedAt: row.updated_at,
    isChangedAfterScoring: row.is_changed_after_scoring,
  };
}

function mapAenderung(row: {
  id: string;
  spiel_id: string;
  old_heimtore: number | null;
  old_auswaertstore: number | null;
  new_heimtore: number;
  new_auswaertstore: number;
  changed_by: string;
  changed_at: string;
  reason: string | null;
}): ErgebnisAenderungRecord {
  return {
    id: row.id,
    spielId: row.spiel_id,
    oldHeimtore: row.old_heimtore,
    oldAuswaertstore: row.old_auswaertstore,
    newHeimtore: row.new_heimtore,
    newAuswaertstore: row.new_auswaertstore,
    changedBy: row.changed_by,
    changedAt: row.changed_at,
    reason: row.reason,
  };
}

export async function enterErgebnis(
  repository: ErgebnisseRepository,
  input: {
    tipprundeId: string;
    spielId: string;
    callerNutzerId: string;
    heimtore: number;
    auswaertstore: number;
    reason?: string | null;
    now?: Date;
    isGlobalAdmin?: boolean;
  },
): Promise<ErgebnisRecord> {
  await assertCanManageContent(repository, input);

  const spiel = await repository.getSpiel(input.spielId);
  if (!spiel || spiel.tipprundeId !== input.tipprundeId) {
    throw new AppError("Spiel nicht gefunden.", "spiel_not_found", 404);
  }

  const heimtore = requireScore(input.heimtore);
  const auswaertstore = requireScore(input.auswaertstore);
  const now = (input.now ?? new Date()).toISOString();
  const existing = await repository.getErgebnisBySpiel(input.spielId);

  if (!existing) {
    return repository.insertErgebnis({
      spielId: input.spielId,
      heimtore,
      auswaertstore,
      enteredBy: input.callerNutzerId,
      now,
    });
  }

  const changed = existing.heimtore !== heimtore || existing.auswaertstore !== auswaertstore;
  if (!changed) {
    return existing;
  }

  await repository.insertErgebnisAenderung({
    spielId: input.spielId,
    oldHeimtore: existing.heimtore,
    oldAuswaertstore: existing.auswaertstore,
    newHeimtore: heimtore,
    newAuswaertstore: auswaertstore,
    changedBy: input.callerNutzerId,
    changedAt: now,
    reason: normalizeReason(input.reason),
  });

  return repository.updateErgebnis({
    spielId: input.spielId,
    heimtore,
    auswaertstore,
    enteredBy: input.callerNutzerId,
    now,
  });
}

export function createSupabaseErgebnisseRepository(supabase: SupabaseClient): ErgebnisseRepository {
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
    async getSpiel(spielId) {
      const { data, error } = await supabase
        .from("spiele")
        .select("id, tipprunde_id")
        .eq("id", spielId)
        .maybeSingle();

      if (error) {
        throw new AppError("Spiel konnte nicht geladen werden.", "spiel_load_failed", 500);
      }

      return data ? { id: data.id, tipprundeId: data.tipprunde_id } : null;
    },
    async getErgebnisBySpiel(spielId) {
      const { data, error } = await supabase
        .from("ergebnisse")
        .select(
          "id, spiel_id, heimtore, auswaertstore, entered_by, entered_at, updated_at, is_changed_after_scoring",
        )
        .eq("spiel_id", spielId)
        .maybeSingle();

      if (error) {
        throw new AppError("Ergebnis konnte nicht geladen werden.", "ergebnis_load_failed", 500);
      }

      return data ? mapErgebnis(data) : null;
    },
    async insertErgebnis(input) {
      const { data, error } = await supabase
        .from("ergebnisse")
        .insert({
          spiel_id: input.spielId,
          heimtore: input.heimtore,
          auswaertstore: input.auswaertstore,
          entered_by: input.enteredBy,
          entered_at: input.now,
          updated_at: input.now,
          is_changed_after_scoring: false,
        })
        .select(
          "id, spiel_id, heimtore, auswaertstore, entered_by, entered_at, updated_at, is_changed_after_scoring",
        )
        .single();

      if (error || !data) {
        throw new AppError(
          "Ergebnis konnte nicht gespeichert werden.",
          "ergebnis_save_failed",
          500,
        );
      }

      return mapErgebnis(data);
    },
    async updateErgebnis(input) {
      const { data, error } = await supabase
        .from("ergebnisse")
        .update({
          heimtore: input.heimtore,
          auswaertstore: input.auswaertstore,
          entered_by: input.enteredBy,
          updated_at: input.now,
          is_changed_after_scoring: true,
        })
        .eq("spiel_id", input.spielId)
        .select(
          "id, spiel_id, heimtore, auswaertstore, entered_by, entered_at, updated_at, is_changed_after_scoring",
        )
        .single();

      if (error || !data) {
        throw new AppError(
          "Ergebnis konnte nicht aktualisiert werden.",
          "ergebnis_update_failed",
          500,
        );
      }

      return mapErgebnis(data);
    },
    async insertErgebnisAenderung(input) {
      const { data, error } = await supabase
        .from("ergebnis_aenderungen")
        .insert({
          spiel_id: input.spielId,
          old_heimtore: input.oldHeimtore,
          old_auswaertstore: input.oldAuswaertstore,
          new_heimtore: input.newHeimtore,
          new_auswaertstore: input.newAuswaertstore,
          changed_by: input.changedBy,
          changed_at: input.changedAt,
          reason: input.reason,
        })
        .select(
          "id, spiel_id, old_heimtore, old_auswaertstore, new_heimtore, new_auswaertstore, changed_by, changed_at, reason",
        )
        .single();

      if (error || !data) {
        throw new AppError(
          "Ergebnisaenderung konnte nicht gespeichert werden.",
          "ergebnis_history_failed",
          500,
        );
      }

      return mapAenderung(data);
    },
  };
}
