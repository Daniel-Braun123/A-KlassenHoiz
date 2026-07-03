import type { SupabaseClient } from "@supabase/supabase-js";

import { AppError } from "@/lib/domain/errors";
import type { SpielStatus, TipprundeRolle, Wertungstyp } from "@/lib/domain/types";
import {
  deriveRangliste,
  type DerivedRanglisteEintrag,
  type RanglisteQuelle,
} from "@/lib/scoring/derive-ranglisten";

export type PunktewertungForRangliste = {
  spielId: string;
  spieltagId: string;
  nutzerId: string;
  tipprundeId: string;
  tipprundenNickname: string | null;
  anzeigename: string;
  punkte: number;
  wertungstyp: Wertungstyp;
};

export type ErgebnisSpielView = {
  spielId: string;
  heimteamName: string;
  auswaertsteamName: string;
  heimtore: number;
  auswaertstore: number;
  anstosszeit: string;
  status: SpielStatus;
  isChangedAfterScoring: boolean;
};

export type SpieltagErgebnisseView = {
  spieltagId: string;
  name: string;
  sortOrder: number;
  spiele: ErgebnisSpielView[];
};

export type RanglistenRepository = {
  getAktiveMitgliedschaft(
    tipprundeId: string,
    nutzerId: string,
  ): Promise<{ rolle: TipprundeRolle } | null>;
  listPunktewertungenForTipprunde(tipprundeId: string): Promise<PunktewertungForRangliste[]>;
  listPunktewertungenForSpieltag(
    tipprundeId: string,
    spieltagId: string,
  ): Promise<PunktewertungForRangliste[]>;
  listVergangeneSpieltagErgebnisse(tipprundeId: string): Promise<SpieltagErgebnisseView[]>;
};

async function assertActiveMember(
  repository: Pick<RanglistenRepository, "getAktiveMitgliedschaft">,
  input: { tipprundeId: string; nutzerId: string },
): Promise<void> {
  const membership = await repository.getAktiveMitgliedschaft(input.tipprundeId, input.nutzerId);
  if (!membership) {
    throw new AppError("Du bist kein Mitglied dieser Tipprunde.", "membership_required", 403);
  }
}

function aggregatePunktewertungen(rows: PunktewertungForRangliste[]): DerivedRanglisteEintrag[] {
  const grouped = new Map<string, RanglisteQuelle>();

  for (const row of rows) {
    const existing = grouped.get(row.nutzerId);
    const next: RanglisteQuelle = existing ?? {
      nutzerId: row.nutzerId,
      tipprundeId: row.tipprundeId,
      tipprundenNickname: row.tipprundenNickname,
      anzeigename: row.anzeigename,
      punkte: 0,
      anzahlExakteTipps: 0,
      anzahlTordifferenzTipps: 0,
      anzahlTendenzTipps: 0,
      anzahlAbgegebeneTipps: 0,
    };

    next.punkte += row.punkte;
    next.anzahlAbgegebeneTipps = (next.anzahlAbgegebeneTipps ?? 0) + 1;
    if (row.wertungstyp === "exakt") {
      next.anzahlExakteTipps = (next.anzahlExakteTipps ?? 0) + 1;
    }
    if (row.wertungstyp === "tordifferenz") {
      next.anzahlTordifferenzTipps = (next.anzahlTordifferenzTipps ?? 0) + 1;
    }
    if (row.wertungstyp === "tendenz") {
      next.anzahlTendenzTipps = (next.anzahlTendenzTipps ?? 0) + 1;
    }

    grouped.set(row.nutzerId, next);
  }

  return deriveRangliste([...grouped.values()]);
}

export async function getGesamtRangliste(
  repository: RanglistenRepository,
  input: { tipprundeId: string; nutzerId: string },
): Promise<DerivedRanglisteEintrag[]> {
  await assertActiveMember(repository, input);
  return aggregatePunktewertungen(
    await repository.listPunktewertungenForTipprunde(input.tipprundeId),
  );
}

export async function getSpieltagRangliste(
  repository: RanglistenRepository,
  input: { tipprundeId: string; spieltagId: string; nutzerId: string },
): Promise<DerivedRanglisteEintrag[]> {
  await assertActiveMember(repository, input);
  return aggregatePunktewertungen(
    await repository.listPunktewertungenForSpieltag(input.tipprundeId, input.spieltagId),
  );
}

export async function getVergangeneSpieltagErgebnisse(
  repository: RanglistenRepository,
  input: { tipprundeId: string; nutzerId: string },
): Promise<SpieltagErgebnisseView[]> {
  await assertActiveMember(repository, input);
  return repository.listVergangeneSpieltagErgebnisse(input.tipprundeId);
}

type ProfileRow = {
  id: string;
  anzeigename: string;
};

type MitgliedschaftRow = {
  nutzer_id: string;
  tipprunden_nickname: string | null;
};

async function loadNames(
  supabase: SupabaseClient,
  tipprundeId: string,
  nutzerIds: string[],
): Promise<Map<string, { anzeigename: string; tipprundenNickname: string | null }>> {
  if (nutzerIds.length === 0) {
    return new Map();
  }

  const [{ data: profiles, error: profilesError }, { data: memberships, error: membershipsError }] =
    await Promise.all([
      supabase.from("profiles").select("id, anzeigename").in("id", nutzerIds),
      supabase
        .from("mitgliedschaften")
        .select("nutzer_id, tipprunden_nickname")
        .eq("tipprunde_id", tipprundeId)
        .in("nutzer_id", nutzerIds),
    ]);

  if (profilesError || membershipsError) {
    throw new AppError("Nutzernamen konnten nicht geladen werden.", "names_load_failed", 500);
  }

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const membershipById = new Map(
    (memberships ?? []).map((membership) => [membership.nutzer_id, membership]),
  );

  return new Map(
    nutzerIds.map((nutzerId) => {
      const profile = profileById.get(nutzerId) as ProfileRow | undefined;
      const membership = membershipById.get(nutzerId) as MitgliedschaftRow | undefined;

      return [
        nutzerId,
        {
          anzeigename: profile?.anzeigename ?? "Nutzer",
          tipprundenNickname: membership?.tipprunden_nickname ?? null,
        },
      ];
    }),
  );
}

function readSpieltagId(spieleRelation: unknown): string {
  if (Array.isArray(spieleRelation)) {
    return String(spieleRelation[0]?.spieltag_id ?? "");
  }

  if (spieleRelation && typeof spieleRelation === "object" && "spieltag_id" in spieleRelation) {
    return String((spieleRelation as { spieltag_id?: string }).spieltag_id ?? "");
  }

  return "";
}

function mapPunktewertungRow(
  row: {
    spiel_id: string;
    nutzer_id: string;
    tipprunde_id: string;
    punkte: number;
    wertungstyp: Wertungstyp;
    spiele?: unknown;
  },
  names: Map<string, { anzeigename: string; tipprundenNickname: string | null }>,
): PunktewertungForRangliste {
  const name = names.get(row.nutzer_id);

  return {
    spielId: row.spiel_id,
    spieltagId: readSpieltagId(row.spiele),
    nutzerId: row.nutzer_id,
    tipprundeId: row.tipprunde_id,
    tipprundenNickname: name?.tipprundenNickname ?? null,
    anzeigename: name?.anzeigename ?? "Nutzer",
    punkte: row.punkte,
    wertungstyp: row.wertungstyp,
  };
}

export function createSupabaseRanglistenRepository(supabase: SupabaseClient): RanglistenRepository {
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
    async listPunktewertungenForTipprunde(tipprundeId) {
      const { data, error } = await supabase
        .from("punktewertungen")
        .select("spiel_id, nutzer_id, tipprunde_id, punkte, wertungstyp, spiele!inner(spieltag_id)")
        .eq("tipprunde_id", tipprundeId);

      if (error) {
        throw new AppError(
          "Punktewertungen konnten nicht geladen werden.",
          "punktewertungen_load_failed",
          500,
        );
      }

      const nutzerIds = [...new Set((data ?? []).map((row) => row.nutzer_id as string))];
      const names = await loadNames(supabase, tipprundeId, nutzerIds);

      return (data ?? []).map((row) => mapPunktewertungRow(row, names));
    },
    async listPunktewertungenForSpieltag(tipprundeId, spieltagId) {
      const { data, error } = await supabase
        .from("punktewertungen")
        .select("spiel_id, nutzer_id, tipprunde_id, punkte, wertungstyp, spiele!inner(spieltag_id)")
        .eq("tipprunde_id", tipprundeId)
        .eq("spiele.spieltag_id", spieltagId);

      if (error) {
        throw new AppError(
          "Punktewertungen konnten nicht geladen werden.",
          "punktewertungen_load_failed",
          500,
        );
      }

      const nutzerIds = [...new Set((data ?? []).map((row) => row.nutzer_id as string))];
      const names = await loadNames(supabase, tipprundeId, nutzerIds);

      return (data ?? []).map((row) => mapPunktewertungRow(row, names));
    },
    async listVergangeneSpieltagErgebnisse(tipprundeId) {
      const [{ data: spieltage, error: spieltageError }, { data: spiele, error: spieleError }] =
        await Promise.all([
          supabase
            .from("spieltage")
            .select("id, name, sort_order")
            .eq("tipprunde_id", tipprundeId)
            .order("sort_order", { ascending: true }),
          supabase
            .from("spiele")
            .select(
              "id, spieltag_id, anstosszeit, status, heimteam:heimteam_id(name), auswaertsteam:auswaertsteam_id(name), ergebnisse!inner(heimtore, auswaertstore, is_changed_after_scoring)",
            )
            .eq("tipprunde_id", tipprundeId)
            .order("anstosszeit", { ascending: true }),
        ]);

      if (spieltageError || spieleError) {
        throw new AppError(
          "Ergebnisse konnten nicht geladen werden.",
          "ergebnisse_load_failed",
          500,
        );
      }

      return (spieltage ?? [])
        .map((spieltag) => ({
          spieltagId: spieltag.id as string,
          name: spieltag.name as string,
          sortOrder: spieltag.sort_order as number,
          spiele: (spiele ?? [])
            .filter((spiel) => spiel.spieltag_id === spieltag.id)
            .map((spiel) => {
              const heimteam = Array.isArray(spiel.heimteam) ? spiel.heimteam[0] : spiel.heimteam;
              const auswaertsteam = Array.isArray(spiel.auswaertsteam)
                ? spiel.auswaertsteam[0]
                : spiel.auswaertsteam;
              const ergebnis = Array.isArray(spiel.ergebnisse)
                ? spiel.ergebnisse[0]
                : spiel.ergebnisse;

              return {
                spielId: spiel.id as string,
                heimteamName: heimteam?.name ?? "Heimteam",
                auswaertsteamName: auswaertsteam?.name ?? "Auswaertsteam",
                heimtore: ergebnis?.heimtore ?? 0,
                auswaertstore: ergebnis?.auswaertstore ?? 0,
                anstosszeit: spiel.anstosszeit as string,
                status: spiel.status as SpielStatus,
                isChangedAfterScoring: Boolean(ergebnis?.is_changed_after_scoring),
              };
            }),
        }))
        .filter((spieltag) => spieltag.spiele.length > 0);
    },
  };
}

export function createDemoGesamtRangliste(): DerivedRanglisteEintrag[] {
  return aggregatePunktewertungen([
    {
      spielId: "spiel-1",
      spieltagId: "demo-spieltag",
      nutzerId: "anna",
      tipprundeId: "demo-tipprunde",
      tipprundenNickname: "Anna",
      anzeigename: "Anna A.",
      punkte: 4,
      wertungstyp: "exakt",
    },
    {
      spielId: "spiel-2",
      spieltagId: "demo-spieltag",
      nutzerId: "anna",
      tipprundeId: "demo-tipprunde",
      tipprundenNickname: "Anna",
      anzeigename: "Anna A.",
      punkte: 2,
      wertungstyp: "tendenz",
    },
    {
      spielId: "spiel-1",
      spieltagId: "demo-spieltag",
      nutzerId: "berta",
      tipprundeId: "demo-tipprunde",
      tipprundenNickname: "Berta",
      anzeigename: "Berta B.",
      punkte: 3,
      wertungstyp: "tordifferenz",
    },
    {
      spielId: "spiel-2",
      spieltagId: "demo-spieltag",
      nutzerId: "berta",
      tipprundeId: "demo-tipprunde",
      tipprundenNickname: "Berta",
      anzeigename: "Berta B.",
      punkte: 3,
      wertungstyp: "tordifferenz",
    },
    {
      spielId: "spiel-3",
      spieltagId: "demo-spieltag-2",
      nutzerId: "clara",
      tipprundeId: "demo-tipprunde",
      tipprundenNickname: null,
      anzeigename: "Clara",
      punkte: 4,
      wertungstyp: "exakt",
    },
  ]);
}

export function createDemoSpieltagRangliste(): DerivedRanglisteEintrag[] {
  return createDemoGesamtRangliste().filter((entry) => entry.nutzerId !== "clara");
}

export function createDemoVergangeneErgebnisse(): SpieltagErgebnisseView[] {
  return [
    {
      spieltagId: "demo-spieltag",
      name: "1. Spieltag",
      sortOrder: 1,
      spiele: [
        {
          spielId: "spiel-1",
          heimteamName: "FC Hoiz",
          auswaertsteamName: "SV Wald",
          heimtore: 2,
          auswaertstore: 1,
          anstosszeit: "2026-08-01T13:30:00.000Z",
          status: "beendet",
          isChangedAfterScoring: true,
        },
      ],
    },
  ];
}
