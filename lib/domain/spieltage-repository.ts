import type { SupabaseClient } from "@supabase/supabase-js";

import {
  assertCanManageContent,
  requireNonBlank,
  type ContentManagerRepositoryPart,
} from "@/lib/domain/content-management";
import { AppError } from "@/lib/domain/errors";
import type { SpieltagAbschnitt } from "@/lib/domain/types";

export type SpieltagRecord = {
  id: string;
  tipprundeId: string;
  name: string;
  abschnitt: SpieltagAbschnitt;
  nummer: number;
  sortOrder: number;
};

export type SpieltageRepository = ContentManagerRepositoryPart & {
  listSpieltage(tipprundeId: string): Promise<SpieltagRecord[]>;
  getNextSpieltagNummer(tipprundeId: string, abschnitt: SpieltagAbschnitt): Promise<number>;
  insertSpieltag(input: {
    tipprundeId: string;
    name: string;
    abschnitt: SpieltagAbschnitt;
    nummer: number;
    sortOrder: number;
  }): Promise<SpieltagRecord>;
  updateSpieltag(
    spieltagId: string,
    input: { name?: string; abschnitt?: SpieltagAbschnitt; sortOrder?: number },
  ): Promise<SpieltagRecord>;
  deleteSpieltag(spieltagId: string): Promise<void>;
};

function mapSpieltag(row: {
  id: string;
  tipprunde_id: string;
  name: string;
  abschnitt: SpieltagAbschnitt;
  nummer: number;
  sort_order: number;
}): SpieltagRecord {
  return {
    id: row.id,
    tipprundeId: row.tipprunde_id,
    name: row.name,
    abschnitt: row.abschnitt,
    nummer: row.nummer,
    sortOrder: row.sort_order,
  };
}

function requireAbschnitt(value: unknown): SpieltagAbschnitt {
  if (value === "hinrunde" || value === "rueckrunde") {
    return value as SpieltagAbschnitt;
  }

  throw new AppError("Ungültiger Spieltag-Abschnitt.", "spieltag_abschnitt_invalid", 400);
}

function formatSpieltagName(abschnitt: SpieltagAbschnitt, nummer: number): string {
  const label = abschnitt === "rueckrunde" ? "Rückrunde" : "Hinrunde";
  return `${label} Spieltag ${nummer}`;
}

function normalizeSortOrder(value: unknown): number {
  const sortOrder = Number(value);
  if (!Number.isInteger(sortOrder)) {
    throw new AppError(
      "Die Sortierung muss eine ganze Zahl sein.",
      "spieltag_sort_order_invalid",
      400,
    );
  }

  return sortOrder;
}

export async function createSpieltag(
  repository: SpieltageRepository,
  input: {
    tipprundeId: string;
    callerNutzerId: string;
    abschnitt: unknown;
    name?: string;
    nummer?: number;
    sortOrder?: unknown;
    isGlobalAdmin?: boolean;
  },
): Promise<SpieltagRecord> {
  await assertCanManageContent(repository, input);
  const abschnitt = requireAbschnitt(input.abschnitt);
  const nummer =
    input.nummer ?? (await repository.getNextSpieltagNummer(input.tipprundeId, abschnitt));
  const name =
    input.name === undefined || input.name.trim() === ""
      ? formatSpieltagName(abschnitt, nummer)
      : requireNonBlank(
          input.name,
          "Bitte gib einen Spieltag-Namen ein.",
          "spieltag_name_required",
        );

  return repository.insertSpieltag({
    tipprundeId: input.tipprundeId,
    name,
    abschnitt,
    nummer,
    sortOrder: nummer,
  });
}

export async function updateSpieltag(
  repository: SpieltageRepository,
  input: {
    tipprundeId: string;
    spieltagId: string;
    callerNutzerId: string;
    name?: string;
    abschnitt?: unknown;
    sortOrder?: unknown;
    isGlobalAdmin?: boolean;
  },
): Promise<SpieltagRecord> {
  await assertCanManageContent(repository, input);

  return repository.updateSpieltag(input.spieltagId, {
    name:
      input.name === undefined
        ? undefined
        : requireNonBlank(
            input.name,
            "Bitte gib einen Spieltag-Namen ein.",
            "spieltag_name_required",
          ),
    abschnitt: input.abschnitt === undefined ? undefined : requireAbschnitt(input.abschnitt),
    sortOrder: input.sortOrder === undefined ? undefined : normalizeSortOrder(input.sortOrder),
  });
}

export async function deleteSpieltag(
  repository: SpieltageRepository,
  input: {
    tipprundeId: string;
    spieltagId: string;
    callerNutzerId: string;
    isGlobalAdmin?: boolean;
  },
): Promise<void> {
  await assertCanManageContent(repository, input);
  await repository.deleteSpieltag(input.spieltagId);
}

export function createSupabaseSpieltageRepository(supabase: SupabaseClient): SpieltageRepository {
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
    async listSpieltage(tipprundeId) {
      const { data, error } = await supabase
        .from("spieltage")
        .select("id, tipprunde_id, name, abschnitt, nummer, sort_order")
        .eq("tipprunde_id", tipprundeId)
        .order("abschnitt", { ascending: true })
        .order("nummer", { ascending: true })
        .order("sort_order", { ascending: true });

      if (error) {
        throw new AppError("Spieltage konnten nicht geladen werden.", "spieltage_load_failed", 500);
      }

      return (data ?? []).map(mapSpieltag);
    },
    async getNextSpieltagNummer(tipprundeId, abschnitt) {
      const { data, error } = await supabase
        .from("spieltage")
        .select("nummer")
        .eq("tipprunde_id", tipprundeId)
        .eq("abschnitt", abschnitt)
        .order("nummer", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw new AppError(
          "Nächste Spieltag-Nummer konnte nicht ermittelt werden.",
          "spieltag_nummer_load_failed",
          500,
        );
      }

      return Number(data?.nummer ?? 0) + 1;
    },
    async insertSpieltag(input) {
      const { data, error } = await supabase
        .from("spieltage")
        .insert({
          tipprunde_id: input.tipprundeId,
          name: input.name,
          abschnitt: input.abschnitt,
          nummer: input.nummer,
          sort_order: input.sortOrder,
        })
        .select("id, tipprunde_id, name, abschnitt, nummer, sort_order")
        .single();

      if (error || !data) {
        if (error?.code === "23505") {
          throw new AppError(
            "Diesen Spieltag gibt es in diesem Abschnitt bereits.",
            "spieltag_duplicate",
            409,
          );
        }

        throw new AppError("Spieltag konnte nicht erstellt werden.", "spieltag_create_failed", 500);
      }

      return mapSpieltag(data);
    },
    async updateSpieltag(spieltagId, input) {
      const updatePayload: Record<string, string | number> = {};
      if (input.name !== undefined) {
        updatePayload.name = input.name;
      }
      if (input.abschnitt !== undefined) {
        updatePayload.abschnitt = input.abschnitt;
      }
      if (input.sortOrder !== undefined) {
        updatePayload.sort_order = input.sortOrder;
      }

      const { data, error } = await supabase
        .from("spieltage")
        .update(updatePayload)
        .eq("id", spieltagId)
        .select("id, tipprunde_id, name, abschnitt, nummer, sort_order")
        .single();

      if (error || !data) {
        if (error?.code === "23505") {
          throw new AppError(
            "Diesen Spieltag gibt es in diesem Abschnitt bereits.",
            "spieltag_duplicate",
            409,
          );
        }

        throw new AppError(
          "Spieltag konnte nicht aktualisiert werden.",
          "spieltag_update_failed",
          500,
        );
      }

      return mapSpieltag(data);
    },
    async deleteSpieltag(spieltagId) {
      const { error } = await supabase.from("spieltage").delete().eq("id", spieltagId);
      if (error) {
        throw new AppError(
          "Spieltag konnte nicht geloescht werden.",
          "spieltag_delete_failed",
          500,
        );
      }
    },
  };
}
