import type { SupabaseClient } from "@supabase/supabase-js";

import { AppError } from "@/lib/domain/errors";
import type { TipprundeRolle } from "@/lib/domain/types";

export type MitgliedschaftRecord = {
  id: string;
  tipprundeId: string;
  nutzerId: string;
  rolle: TipprundeRolle;
  status: "active" | "removed";
};

export type MitgliedschaftenRepository = {
  getTipprundeOwnerId(tipprundeId: string): Promise<string | null>;
  getMitgliedschaftByNutzer(
    tipprundeId: string,
    nutzerId: string,
  ): Promise<MitgliedschaftRecord | null>;
  updateMitgliedschaftRolle(
    mitgliedschaftId: string,
    rolle: "nutzer" | "co_admin",
  ): Promise<MitgliedschaftRecord>;
};

function mapMitgliedschaft(row: {
  id: string;
  tipprunde_id: string;
  nutzer_id: string;
  rolle: TipprundeRolle;
  status: "active" | "removed";
}): MitgliedschaftRecord {
  return {
    id: row.id,
    tipprundeId: row.tipprunde_id,
    nutzerId: row.nutzer_id,
    rolle: row.rolle,
    status: row.status,
  };
}

export async function changeMitgliedschaftRolle(
  repository: MitgliedschaftenRepository,
  input: {
    tipprundeId: string;
    targetNutzerId: string;
    callerNutzerId: string;
    rolle: "nutzer" | "co_admin";
    isGlobalAdmin: boolean;
  },
): Promise<MitgliedschaftRecord> {
  const ownerId = await repository.getTipprundeOwnerId(input.tipprundeId);
  if (!ownerId) {
    throw new AppError("Tipprunde nicht gefunden.", "tipprunde_not_found", 404);
  }

  if (!input.isGlobalAdmin && input.callerNutzerId !== ownerId) {
    throw new AppError("Nur der Besitzer/Admin darf Co-Admins verwalten.", "owner_required", 403);
  }

  if (input.targetNutzerId === ownerId) {
    throw new AppError(
      "Die Besitzerrolle kann hier nicht geaendert werden.",
      "owner_role_locked",
      400,
    );
  }

  const target = await repository.getMitgliedschaftByNutzer(
    input.tipprundeId,
    input.targetNutzerId,
  );
  if (!target || target.status !== "active") {
    throw new AppError("Mitgliedschaft nicht gefunden.", "membership_not_found", 404);
  }

  return repository.updateMitgliedschaftRolle(target.id, input.rolle);
}

export function createSupabaseMitgliedschaftenRepository(
  supabase: SupabaseClient,
): MitgliedschaftenRepository {
  return {
    async getTipprundeOwnerId(tipprundeId) {
      const { data, error } = await supabase
        .from("tipprunden")
        .select("besitzer_nutzer_id")
        .eq("id", tipprundeId)
        .maybeSingle();

      if (error) {
        throw new AppError("Tipprunde konnte nicht geladen werden.", "tipprunde_load_failed", 500);
      }

      return data?.besitzer_nutzer_id ?? null;
    },
    async getMitgliedschaftByNutzer(tipprundeId, nutzerId) {
      const { data, error } = await supabase
        .from("mitgliedschaften")
        .select("id, tipprunde_id, nutzer_id, rolle, status")
        .eq("tipprunde_id", tipprundeId)
        .eq("nutzer_id", nutzerId)
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
    async updateMitgliedschaftRolle(mitgliedschaftId, rolle) {
      const { data, error } = await supabase
        .from("mitgliedschaften")
        .update({ rolle })
        .eq("id", mitgliedschaftId)
        .select("id, tipprunde_id, nutzer_id, rolle, status")
        .single();

      if (error || !data) {
        throw new AppError("Rolle konnte nicht aktualisiert werden.", "role_update_failed", 500);
      }

      return mapMitgliedschaft(data);
    },
  };
}
