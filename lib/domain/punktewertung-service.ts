import type { SupabaseClient } from "@supabase/supabase-js";

import { AppError } from "@/lib/domain/errors";
import type { Score, Wertungstyp } from "@/lib/domain/types";
import { calculatePunkte } from "@/lib/scoring/calculate-punkte";

export type TippForPunktewertung = {
  spielId: string;
  tipprundeId: string;
  nutzerId: string;
  heimtoreTipp: number;
  auswaertstoreTipp: number;
};

export type PunktewertungRecord = {
  id: string;
  spielId: string;
  nutzerId: string;
  tipprundeId: string;
  punkte: number;
  wertungstyp: Wertungstyp;
  calculatedAt: string;
};

export type PunktewertungRepository = {
  listTippsForSpiel(spielId: string): Promise<TippForPunktewertung[]>;
  upsertPunktewertung(input: {
    spielId: string;
    nutzerId: string;
    tipprundeId: string;
    punkte: number;
    wertungstyp: Wertungstyp;
    calculatedAt: string;
  }): Promise<PunktewertungRecord>;
};

export async function recalculatePunktewertungen(
  repository: PunktewertungRepository,
  input: {
    spielId: string;
    tipprundeId: string;
    ergebnis: Score;
    now?: Date;
  },
): Promise<PunktewertungRecord[]> {
  const calculatedAt = (input.now ?? new Date()).toISOString();
  const tipps = await repository.listTippsForSpiel(input.spielId);
  const wertungen = await Promise.all(
    tipps
      .filter((tipp) => tipp.tipprundeId === input.tipprundeId)
      .map((tipp) => {
        const result = calculatePunkte(input.ergebnis, {
          heimtore: tipp.heimtoreTipp,
          auswaertstore: tipp.auswaertstoreTipp,
        });

        return repository.upsertPunktewertung({
          spielId: input.spielId,
          tipprundeId: input.tipprundeId,
          nutzerId: tipp.nutzerId,
          punkte: result.punkte,
          wertungstyp: result.wertungstyp,
          calculatedAt,
        });
      }),
  );

  return wertungen;
}

function mapTipp(row: {
  spiel_id: string;
  tipprunde_id: string;
  nutzer_id: string;
  heimtore_tipp: number;
  auswaertstore_tipp: number;
}): TippForPunktewertung {
  return {
    spielId: row.spiel_id,
    tipprundeId: row.tipprunde_id,
    nutzerId: row.nutzer_id,
    heimtoreTipp: row.heimtore_tipp,
    auswaertstoreTipp: row.auswaertstore_tipp,
  };
}

function mapPunktewertung(row: {
  id: string;
  spiel_id: string;
  nutzer_id: string;
  tipprunde_id: string;
  punkte: number;
  wertungstyp: Wertungstyp;
  calculated_at: string;
}): PunktewertungRecord {
  return {
    id: row.id,
    spielId: row.spiel_id,
    nutzerId: row.nutzer_id,
    tipprundeId: row.tipprunde_id,
    punkte: row.punkte,
    wertungstyp: row.wertungstyp,
    calculatedAt: row.calculated_at,
  };
}

export function createSupabasePunktewertungRepository(
  supabase: SupabaseClient,
): PunktewertungRepository {
  return {
    async listTippsForSpiel(spielId) {
      const { data, error } = await supabase
        .from("tipps")
        .select("spiel_id, tipprunde_id, nutzer_id, heimtore_tipp, auswaertstore_tipp")
        .eq("spiel_id", spielId);

      if (error) {
        throw new AppError("Tipps konnten nicht geladen werden.", "tipps_load_failed", 500);
      }

      return (data ?? []).map(mapTipp);
    },
    async upsertPunktewertung(input) {
      const { data, error } = await supabase
        .from("punktewertungen")
        .upsert(
          {
            spiel_id: input.spielId,
            nutzer_id: input.nutzerId,
            tipprunde_id: input.tipprundeId,
            punkte: input.punkte,
            wertungstyp: input.wertungstyp,
            calculated_at: input.calculatedAt,
          },
          { onConflict: "spiel_id,nutzer_id" },
        )
        .select("id, spiel_id, nutzer_id, tipprunde_id, punkte, wertungstyp, calculated_at")
        .single();

      if (error || !data) {
        throw new AppError(
          "Punktewertung konnte nicht gespeichert werden.",
          "punktewertung_save_failed",
          500,
        );
      }

      return mapPunktewertung(data);
    },
  };
}
