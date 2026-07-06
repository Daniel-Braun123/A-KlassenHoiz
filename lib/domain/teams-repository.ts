import type { SupabaseClient } from "@supabase/supabase-js";

import {
  assertCanManageContent,
  normalizeOptionalUrl,
  requireNonBlank,
  type ContentManagerRepositoryPart,
} from "@/lib/domain/content-management";
import { AppError } from "@/lib/domain/errors";

export type TeamRecord = {
  id: string;
  tipprundeId: string;
  name: string;
  logoUrl: string | null;
};

export type TeamsRepository = ContentManagerRepositoryPart & {
  listTeams(tipprundeId: string): Promise<TeamRecord[]>;
  insertTeam(input: {
    tipprundeId: string;
    name: string;
    logoUrl: string | null;
  }): Promise<TeamRecord>;
  updateTeam(
    teamId: string,
    input: { name?: string; logoUrl?: string | null },
  ): Promise<TeamRecord>;
  deleteTeam(teamId: string): Promise<void>;
};

function mapTeam(row: {
  id: string;
  tipprunde_id: string;
  name: string;
  logo_url?: string | null;
}): TeamRecord {
  return {
    id: row.id,
    tipprundeId: row.tipprunde_id,
    name: row.name,
    logoUrl: row.logo_url ?? null,
  };
}

export async function createTeam(
  repository: TeamsRepository,
  input: {
    tipprundeId: string;
    callerNutzerId: string;
    name: string;
    logoUrl?: string | null;
    isGlobalAdmin?: boolean;
  },
): Promise<TeamRecord> {
  await assertCanManageContent(repository, input);

  return repository.insertTeam({
    tipprundeId: input.tipprundeId,
    name: requireNonBlank(input.name, "Bitte gib einen Vereinsnamen ein.", "verein_name_required"),
    logoUrl: normalizeOptionalUrl(input.logoUrl),
  });
}

export async function updateTeam(
  repository: TeamsRepository,
  input: {
    tipprundeId: string;
    teamId: string;
    callerNutzerId: string;
    name?: string;
    logoUrl?: string | null;
    isGlobalAdmin?: boolean;
  },
): Promise<TeamRecord> {
  await assertCanManageContent(repository, input);

  return repository.updateTeam(input.teamId, {
    name:
      input.name === undefined
        ? undefined
        : requireNonBlank(input.name, "Bitte gib einen Vereinsnamen ein.", "verein_name_required"),
    logoUrl: input.logoUrl === undefined ? undefined : normalizeOptionalUrl(input.logoUrl),
  });
}

export async function deleteTeam(
  repository: TeamsRepository,
  input: {
    tipprundeId: string;
    teamId: string;
    callerNutzerId: string;
    isGlobalAdmin?: boolean;
  },
): Promise<void> {
  await assertCanManageContent(repository, input);
  await repository.deleteTeam(input.teamId);
}

export function createSupabaseTeamsRepository(supabase: SupabaseClient): TeamsRepository {
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
    async listTeams(tipprundeId) {
      const { data, error } = await supabase
        .from("teams")
        .select("id, tipprunde_id, name, logo_url")
        .eq("tipprunde_id", tipprundeId)
        .order("name", { ascending: true });

      if (error) {
        throw new AppError("Vereine konnten nicht geladen werden.", "vereine_load_failed", 500);
      }

      return (data ?? []).map(mapTeam);
    },
    async insertTeam(input) {
      const { data, error } = await supabase
        .from("teams")
        .insert({
          tipprunde_id: input.tipprundeId,
          name: input.name,
          logo_url: input.logoUrl,
        })
        .select("id, tipprunde_id, name, logo_url")
        .single();

      if (error || !data) {
        if (error?.code === "23505") {
          throw new AppError(
            "Diesen Vereinsnamen gibt es in der Tipprunde bereits.",
            "verein_name_duplicate",
            409,
          );
        }

        throw new AppError("Verein konnte nicht erstellt werden.", "verein_create_failed", 500);
      }

      return mapTeam(data);
    },
    async updateTeam(teamId, input) {
      const updatePayload: Record<string, string | null> = {};
      if (input.name !== undefined) {
        updatePayload.name = input.name;
      }
      if (input.logoUrl !== undefined) {
        updatePayload.logo_url = input.logoUrl;
      }

      const { data, error } = await supabase
        .from("teams")
        .update(updatePayload)
        .eq("id", teamId)
        .select("id, tipprunde_id, name, logo_url")
        .single();

      if (error || !data) {
        if (error?.code === "23505") {
          throw new AppError(
            "Diesen Vereinsnamen gibt es in der Tipprunde bereits.",
            "verein_name_duplicate",
            409,
          );
        }

        throw new AppError("Verein konnte nicht aktualisiert werden.", "verein_update_failed", 500);
      }

      return mapTeam(data);
    },
    async deleteTeam(teamId) {
      const { error } = await supabase.from("teams").delete().eq("id", teamId);
      if (error) {
        throw new AppError("Verein konnte nicht gelöscht werden.", "verein_delete_failed", 500);
      }
    },
  };
}
