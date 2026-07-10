import Link from "next/link";
import { ArrowRight, Plus, ShieldCheck, Trophy } from "lucide-react";

import { ActiveTipprundeLink } from "@/components/tipps/tipprunden-switcher";
import { EmptyState, PageHeader } from "@/components/ui/primitives";
import { requireAuthenticatedProfile } from "@/lib/auth/guards";
import type { ActiveTipprundeOption } from "@/lib/domain/active-tipprunde";
import { readActiveTipprundeMembership } from "@/lib/domain/active-tipprunde-memberships";
import { AppError } from "@/lib/domain/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type HomeProfile = {
  anzeigename: string;
};

function roleLabel(rolle: ActiveTipprundeOption["rolle"]): string {
  if (rolle === "admin") {
    return "Admin";
  }

  if (rolle === "co_admin") {
    return "Co-Admin";
  }

  return "Mitglied";
}

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

async function listActiveTipprundenForUser(nutzerId: string): Promise<ActiveTipprundeOption[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("mitgliedschaften")
    .select("rolle, tipprunden:tipprunde_id(id, name, status)")
    .eq("nutzer_id", nutzerId)
    .eq("status", "active");

  if (error) {
    throw new AppError("Tipprunden konnten nicht geladen werden.", "tipprunden_load_failed", 500);
  }

  const tipprunden = (data ?? [])
    .map((row) => readActiveTipprundeMembership(row))
    .filter((tipprunde): tipprunde is ActiveTipprundeOption => Boolean(tipprunde));

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

function HomeOverview({
  tipprunden,
  profile,
}: {
  tipprunden: ActiveTipprundeOption[];
  profile?: HomeProfile;
}) {
  return (
    <main className="tipprunden-page">
      <PageHeader
        eyebrow="A-KlassenHoiz"
        title="Meine Tipprunden"
        description={
          profile ? `Servus ${profile.anzeigename}, hier ist deine Übersicht.` : undefined
        }
        actions={
          <nav className="home-actions" aria-label="Home Aktionen">
            <Link className="button-link" href="/admin/tipprunden/neu">
              <Plus aria-hidden="true" size={18} />
              Tipprunde erstellen
            </Link>
          </nav>
        }
      />

      {tipprunden.length === 0 ? (
        <EmptyState
          icon={<Trophy aria-hidden="true" size={24} />}
          title="Noch keine Tipprunde"
          actions={
            <Link className="button-link secondary" href="/login">
              <ArrowRight aria-hidden="true" size={18} />
              Per Einladungslink beitreten
            </Link>
          }
        >
          <p>Du bist noch in keiner Tipprunde.</p>
        </EmptyState>
      ) : (
        <section className="tipprunden-list" aria-label="Tipprunden">
          {tipprunden.map((tipprunde) => {
            const canManage = tipprunde.rolle === "admin" || tipprunde.rolle === "co_admin";

            return (
              <article className="tipprunde-card" key={tipprunde.id}>
                <div>
                  <span className="card-icon">
                    <Trophy aria-hidden="true" size={22} />
                  </span>
                  <h2>{tipprunde.name}</h2>
                  <p>
                    <ShieldCheck aria-hidden="true" size={16} />
                    {roleLabel(tipprunde.rolle)}
                  </p>
                </div>
                <div className="tipprunde-card-actions">
                  <ActiveTipprundeLink tipprunde={tipprunde}>
                    Öffnen
                    <ArrowRight aria-hidden="true" size={18} />
                  </ActiveTipprundeLink>
                  {canManage ? (
                    <Link
                      className="button-link secondary"
                      href={`/admin/tipprunden/${tipprunde.id}`}
                    >
                      Verwalten
                    </Link>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

function LoggedOutHome() {
  return (
    <main className="tipprunden-page">
      <section className="logged-out-panel">
        <div className="logged-out-brand">
          <span className="app-brand-mark">
            <Trophy aria-hidden="true" size={20} />
          </span>
          <strong>A-KlassenHoiz</strong>
        </div>
        <h1>Deine Tipprunde. Ein klarer Spieltag.</h1>
        <p>Tipps abgeben, Ergebnisse verfolgen und gemeinsam um die Spitze spielen.</p>
        <Link className="button-link" href="/login">
          <ArrowRight aria-hidden="true" size={18} />
          Anmelden
        </Link>
      </section>
    </main>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ demoTipprunden?: string }>;
}) {
  const params = await searchParams;

  if (params.demoTipprunden) {
    return (
      <HomeOverview
        tipprunden={demoTipprunden(params.demoTipprunden)}
        profile={{ anzeigename: "Demo Nutzer" }}
      />
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <LoggedOutHome />;
  }

  const { profile } = await requireAuthenticatedProfile();
  const tipprunden = await listActiveTipprundenForUser(user.id);

  return <HomeOverview tipprunden={tipprunden} profile={{ anzeigename: profile.anzeigename }} />;
}
