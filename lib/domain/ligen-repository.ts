import type { SupabaseClient } from "@supabase/supabase-js";

import { canViewTipprunde } from "@/lib/auth/permissions";
import {
  assertCanManageContent,
  requireNonBlank,
  type ContentManagerRepositoryPart,
} from "@/lib/domain/content-management";
import { AppError } from "@/lib/domain/errors";

export type LigaRecord = {
  id: string;
  tipprundeId: string;
  name: string;
};

export type LigenRepository = ContentManagerRepositoryPart & {
  findLigaByTipprunde(tipprundeId: string): Promise<LigaRecord | null>;
  insertLiga(input: { tipprundeId: string; name: string }): Promise<LigaRecord>;
  updateLiga(tipprundeId: string, input: { name: string }): Promise<LigaRecord>;
};

function mapLiga(row: { id: string; tipprunde_id: string; name: string }): LigaRecord {
  return {
    id: row.id,
    tipprundeId: row.tipprunde_id,
    name: row.name,
  };
}

async function assertCanViewLiga(
  repository: LigenRepository,
  input: { tipprundeId: string; callerNutzerId: string; isGlobalAdmin?: boolean },
): Promise<void> {
  if (input.isGlobalAdmin) {
    return;
  }

  const membership = await repository.getAktiveMitgliedschaft(
    input.tipprundeId,
    input.callerNutzerId,
  );
  if (!canViewTipprunde({ rolle: membership?.rolle ?? null })) {
    throw new AppError("Du bist kein Mitglied dieser Tipprunde.", "membership_required", 403);
  }
}

export async function getLiga(
  repository: LigenRepository,
  input: { tipprundeId: string; callerNutzerId: string; isGlobalAdmin?: boolean },
): Promise<LigaRecord | null> {
  await assertCanViewLiga(repository, input);
  return repository.findLigaByTipprunde(input.tipprundeId);
}

export async function createLiga(
  repository: LigenRepository,
  input: {
    tipprundeId: string;
    callerNutzerId: string;
    name: string;
    isGlobalAdmin?: boolean;
  },
): Promise<LigaRecord> {
  await assertCanManageContent(repository, input);

  const existingLiga = await repository.findLigaByTipprunde(input.tipprundeId);
  if (existingLiga) {
    throw new AppError(
      "Für diese Tipprunde gibt es bereits eine Liga.",
      "liga_already_exists",
      409,
    );
  }

  return repository.insertLiga({
    tipprundeId: input.tipprundeId,
    name: requireNonBlank(input.name, "Bitte gib einen Liganamen ein.", "liga_name_required"),
  });
}

export async function updateLiga(
  repository: LigenRepository,
  input: {
    tipprundeId: string;
    callerNutzerId: string;
    name: string;
    isGlobalAdmin?: boolean;
  },
): Promise<LigaRecord> {
  await assertCanManageContent(repository, input);

  return repository.updateLiga(input.tipprundeId, {
    name: requireNonBlank(input.name, "Bitte gib einen Liganamen ein.", "liga_name_required"),
  });
}

export function createSupabaseLigenRepository(supabase: SupabaseClient): LigenRepository {
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
    async findLigaByTipprunde(tipprundeId) {
      const { data, error } = await supabase
        .from("ligen")
        .select("id, tipprunde_id, name")
        .eq("tipprunde_id", tipprundeId)
        .maybeSingle();

      if (error) {
        throw new AppError("Liga konnte nicht geladen werden.", "liga_load_failed", 500);
      }

      return data ? mapLiga(data) : null;
    },
    async insertLiga(input) {
      const { data, error } = await supabase
        .from("ligen")
        .insert({
          tipprunde_id: input.tipprundeId,
          name: input.name,
        })
        .select("id, tipprunde_id, name")
        .single();

      if (error || !data) {
        if (error?.code === "23505") {
          throw new AppError(
            "Für diese Tipprunde gibt es bereits eine Liga.",
            "liga_already_exists",
            409,
          );
        }

        throw new AppError("Liga konnte nicht erstellt werden.", "liga_create_failed", 500);
      }

      return mapLiga(data);
    },
    async updateLiga(tipprundeId, input) {
      const { data, error } = await supabase
        .from("ligen")
        .update({ name: input.name })
        .eq("tipprunde_id", tipprundeId)
        .select("id, tipprunde_id, name")
        .single();

      if (error || !data) {
        throw new AppError("Liga konnte nicht aktualisiert werden.", "liga_update_failed", 500);
      }

      return mapLiga(data);
    },
  };
}
