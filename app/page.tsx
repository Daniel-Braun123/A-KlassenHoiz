import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ActiveTipprundeLink } from "@/components/tipps/tipprunden-switcher";
import {
  ACTIVE_TIPPRUNDE_COOKIE,
  getTipprundeStartPath,
  type ActiveTipprundeOption,
} from "@/lib/domain/active-tipprunde";
import { AppError } from "@/lib/domain/errors";
import { chooseTipprundenLanding } from "@/lib/domain/tipprunden-landing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function demoTipprunden(kind?: string): ActiveTipprundeOption[] {
  if (kind === "0") {
    return [];
  }

  if (kind === "1") {
    return [{ id: "demo-tipprunde", name: "Demo Tipprunde", currentSpieltagId: "demo-spieltag" }];
  }

  if (kind === "mehrere") {
    return [
      { id: "demo-tipprunde", name: "Demo Tipprunde", currentSpieltagId: "demo-spieltag" },
      { id: "zweite-tipprunde", name: "Zweite Tipprunde", currentSpieltagId: "demo-spieltag" },
    ];
  }

  return [];
}

function readTipprundeRelation(row: { tipprunden?: unknown }): { id: string; name: string } | null {
  const relation = Array.isArray(row.tipprunden) ? row.tipprunden[0] : row.tipprunden;
  if (!relation || typeof relation !== "object" || !("id" in relation) || !("name" in relation)) {
    return null;
  }

  return {
    id: String((relation as { id: string }).id),
    name: String((relation as { name: string }).name),
  };
}

async function listActiveTipprundenForUser(nutzerId: string): Promise<ActiveTipprundeOption[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("mitgliedschaften")
    .select("tipprunden:tipprunde_id(id, name)")
    .eq("nutzer_id", nutzerId)
    .eq("status", "active");

  if (error) {
    throw new AppError("Tipprunden konnten nicht geladen werden.", "tipprunden_load_failed", 500);
  }

  const tipprunden = (data ?? [])
    .map((row) => readTipprundeRelation(row))
    .filter((tipprunde): tipprunde is { id: string; name: string } => Boolean(tipprunde));

  return Promise.all(
    tipprunden.map(async (tipprunde) => ({
      ...tipprunde,
      currentSpieltagId: await loadCurrentSpieltagId(tipprunde.id),
    })),
  );
}

async function loadCurrentSpieltagId(tipprundeId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("spieltage")
    .select("id")
    .eq("tipprunde_id", tipprundeId)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}

function TipprundenSelection({ tipprunden }: { tipprunden: ActiveTipprundeOption[] }) {
  return (
    <main className="tipprunden-page">
      <h1>Tipprunde waehlen</h1>
      <div className="selection-list">
        {tipprunden.map((tipprunde) => (
          <ActiveTipprundeLink key={tipprunde.id} tipprunde={tipprunde}>
            {tipprunde.name} oeffnen
          </ActiveTipprundeLink>
        ))}
      </div>
    </main>
  );
}

function Onboarding() {
  return (
    <main className="tipprunden-page">
      <h1>Meine Tipprunden</h1>
      <section className="stack">
        <p>Du bist noch in keiner Tipprunde.</p>
        <Link className="button-link" href="/admin/tipprunden/neu">
          Tipprunde erstellen
        </Link>
        <Link className="button-link secondary" href="/login">
          Per Einladungslink beitreten
        </Link>
      </section>
    </main>
  );
}

function LoggedOutHome() {
  return (
    <main className="tipprunden-page">
      <h1>A-KlassenHoiz</h1>
      <p>Private Tippspiel-App fuer lokale Fussballspiele.</p>
      <Link className="button-link" href="/login">
        Anmelden
      </Link>
    </main>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ demoTipprunden?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const lastActiveTipprundeId = cookieStore.get(ACTIVE_TIPPRUNDE_COOKIE)?.value ?? null;

  if (params.demoTipprunden) {
    const tipprunden = demoTipprunden(params.demoTipprunden);
    const decision = chooseTipprundenLanding({ tipprunden, lastActiveTipprundeId });

    if (decision.type === "open") {
      const selected = tipprunden.find((tipprunde) => tipprunde.id === decision.tipprundeId);
      redirect(getTipprundeStartPath(selected ?? { id: decision.tipprundeId }));
    }

    return decision.type === "selection" ? (
      <TipprundenSelection tipprunden={tipprunden} />
    ) : (
      <Onboarding />
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <LoggedOutHome />;
  }

  const tipprunden = await listActiveTipprundenForUser(user.id);
  const decision = chooseTipprundenLanding({ tipprunden, lastActiveTipprundeId });

  if (decision.type === "open") {
    const selected = tipprunden.find((tipprunde) => tipprunde.id === decision.tipprundeId);
    redirect(getTipprundeStartPath(selected ?? { id: decision.tipprundeId }));
  }

  return decision.type === "selection" ? (
    <TipprundenSelection tipprunden={tipprunden} />
  ) : (
    <Onboarding />
  );
}
