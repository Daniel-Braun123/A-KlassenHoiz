import type { SupabaseClient } from "@supabase/supabase-js";

import { AppError } from "@/lib/domain/errors";
import type { TipprundeStatus, TipprundeRolle } from "@/lib/domain/types";

export type TipprundeRecord = {
  id: string;
  name: string;
  status: TipprundeStatus;
  besitzerNutzerId: string;
};

export type CreateTipprundeInput = {
  name: string;
  besitzerNutzerId: string;
  tipprundenNickname: string;
};

export type TipprundenRepository = {
  insertTipprunde(input: { name: string; besitzerNutzerId: string }): Promise<TipprundeRecord>;
  insertMitgliedschaft(input: {
    tipprundeId: string;
    nutzerId: string;
    rolle: TipprundeRolle;
    tipprundenNickname: string;
  }): Promise<void>;
  getTipprundeById(id: string): Promise<TipprundeRecord | null>;
  updateTipprundeStatus(id: string, status: TipprundeStatus): Promise<TipprundeRecord>;
};

function mapTipprunde(row: {
  id: string;
  name: string;
  status: TipprundeStatus;
  besitzer_nutzer_id: string;
}): TipprundeRecord {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    besitzerNutzerId: row.besitzer_nutzer_id,
  };
}

function requireTipprundeName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new AppError(
      "Bitte gib einen Namen fuer die Tipprunde ein.",
      "tipprunde_name_required",
      400,
    );
  }

  return trimmed;
}

function assertOwner(
  tipprunde: TipprundeRecord,
  callerNutzerId: string,
  isGlobalAdmin: boolean,
): void {
  if (!isGlobalAdmin && tipprunde.besitzerNutzerId !== callerNutzerId) {
    throw new AppError(
      "Nur der Besitzer/Admin darf diese Aktion ausfuehren.",
      "owner_required",
      403,
    );
  }
}

export async function createTipprunde(
  repository: TipprundenRepository,
  input: CreateTipprundeInput,
): Promise<TipprundeRecord> {
  const name = requireTipprundeName(input.name);
  const nickname = input.tipprundenNickname.trim() || name;
  const tipprunde = await repository.insertTipprunde({
    name,
    besitzerNutzerId: input.besitzerNutzerId,
  });

  await repository.insertMitgliedschaft({
    tipprundeId: tipprunde.id,
    nutzerId: input.besitzerNutzerId,
    rolle: "admin",
    tipprundenNickname: nickname,
  });

  return tipprunde;
}

export async function archiveTipprunde(
  repository: TipprundenRepository,
  input: { tipprundeId: string; callerNutzerId: string; isGlobalAdmin: boolean },
): Promise<TipprundeRecord> {
  const tipprunde = await repository.getTipprundeById(input.tipprundeId);
  if (!tipprunde) {
    throw new AppError("Tipprunde nicht gefunden.", "tipprunde_not_found", 404);
  }

  assertOwner(tipprunde, input.callerNutzerId, input.isGlobalAdmin);
  return repository.updateTipprundeStatus(tipprunde.id, "archived");
}

export async function permanentlyDeleteTipprunde(
  repository: TipprundenRepository,
  input: {
    tipprundeId: string;
    callerNutzerId: string;
    isGlobalAdmin: boolean;
    confirmation: string;
  },
): Promise<TipprundeRecord> {
  const tipprunde = await repository.getTipprundeById(input.tipprundeId);
  if (!tipprunde) {
    throw new AppError("Tipprunde nicht gefunden.", "tipprunde_not_found", 404);
  }

  assertOwner(tipprunde, input.callerNutzerId, input.isGlobalAdmin);

  if (input.confirmation.trim() !== tipprunde.name) {
    throw new AppError(
      "Bitte bestaetige das endgueltige Loeschen mit dem Tipprunden-Namen.",
      "delete_confirmation_required",
      400,
    );
  }

  return repository.updateTipprundeStatus(tipprunde.id, "deleted");
}

export function createSupabaseTipprundenRepository(supabase: SupabaseClient): TipprundenRepository {
  return {
    async insertTipprunde(input) {
      const { data, error } = await supabase
        .from("tipprunden")
        .insert({
          name: input.name,
          besitzer_nutzer_id: input.besitzerNutzerId,
        })
        .select("id, name, status, besitzer_nutzer_id")
        .single();

      if (error || !data) {
        throw new AppError(
          "Tipprunde konnte nicht erstellt werden.",
          "tipprunde_create_failed",
          500,
        );
      }

      return mapTipprunde(data);
    },
    async insertMitgliedschaft(input) {
      const { error } = await supabase.from("mitgliedschaften").insert({
        tipprunde_id: input.tipprundeId,
        nutzer_id: input.nutzerId,
        rolle: input.rolle,
        tipprunden_nickname: input.tipprundenNickname,
      });

      if (error) {
        throw new AppError(
          "Admin-Mitgliedschaft konnte nicht erstellt werden.",
          "membership_create_failed",
          500,
        );
      }
    },
    async getTipprundeById(id) {
      const { data, error } = await supabase
        .from("tipprunden")
        .select("id, name, status, besitzer_nutzer_id")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw new AppError("Tipprunde konnte nicht geladen werden.", "tipprunde_load_failed", 500);
      }

      return data ? mapTipprunde(data) : null;
    },
    async updateTipprundeStatus(id, status) {
      const timestampColumn =
        status === "archived" ? "archived_at" : status === "deleted" ? "deleted_at" : null;
      const updatePayload: Record<string, string> = { status };

      if (timestampColumn) {
        updatePayload[timestampColumn] = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("tipprunden")
        .update(updatePayload)
        .eq("id", id)
        .select("id, name, status, besitzer_nutzer_id")
        .single();

      if (error || !data) {
        throw new AppError(
          "Tipprunde konnte nicht aktualisiert werden.",
          "tipprunde_update_failed",
          500,
        );
      }

      return mapTipprunde(data);
    },
  };
}
