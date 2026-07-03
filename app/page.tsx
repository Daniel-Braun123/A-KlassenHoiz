import Link from "next/link";
import { ArrowRight, Plus, ShieldCheck, Trophy, UserRound } from "lucide-react";

import { ActiveTipprundeLink } from "@/components/tipps/tipprunden-switcher";
import { requireAuthenticatedProfile } from "@/lib/auth/guards";
import type { ActiveTipprundeOption } from "@/lib/domain/active-tipprunde";
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

function readTipprundeMembership(row: {
  rolle?: unknown;
  tipprunden?: unknown;
}): ActiveTipprundeOption | null {
  const relation = Array.isArray(row.tipprunden) ? row.tipprunden[0] : row.tipprunden;
  if (!relation || typeof relation !== "object" || !("id" in relation) || !("name" in relation)) {
    return null;
  }

  return {
    id: String((relation as { id: string }).id),
    name: String((relation as { name: string }).name),
    rolle:
      row.rolle === "admin" || row.rolle === "co_admin" || row.rolle === "nutzer"
        ? row.rolle
        : null,
  };
}

async function listActiveTipprundenForUser(nutzerId: string): Promise<ActiveTipprundeOption[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("mitgliedschaften")
    .select("rolle, tipprunden:tipprunde_id(id, name)")
    .eq("nutzer_id", nutzerId)
    .eq("status", "active");

  if (error) {
    throw new AppError("Tipprunden konnten nicht geladen werden.", "tipprunden_load_failed", 500);
  }

  const tipprunden = (data ?? [])
    .map((row) => readTipprundeMembership(row))
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
  showProfileLink,
}: {
  tipprunden: ActiveTipprundeOption[];
  profile?: HomeProfile;
  showProfileLink: boolean;
}) {
  return (
    <main className="tipprunden-page">
      <header className="home-header">
        <div>
          <p className="eyebrow">A-KlassenHoiz</p>
          <h1>Meine Tipprunden</h1>
          {profile ? <p>Servus {profile.anzeigename}, hier ist deine Übersicht.</p> : null}
        </div>
        <nav className="home-actions" aria-label="Home Aktionen">
          {showProfileLink ? (
            <Link className="button-link secondary" href="/profil">
              <UserRound aria-hidden="true" size={18} />
              Profil
            </Link>
          ) : null}
          <Link className="button-link" href="/admin/tipprunden/neu">
            <Plus aria-hidden="true" size={18} />
            Tipprunde erstellen
          </Link>
        </nav>
      </header>

      {tipprunden.length === 0 ? (
        <section className="empty-state">
          <div className="empty-state-icon">
            <Trophy aria-hidden="true" size={28} />
          </div>
          <h2>Noch keine Tipprunde</h2>
          <p>Du bist noch in keiner Tipprunde.</p>
          <Link className="button-link secondary" href="/login">
            <ArrowRight aria-hidden="true" size={18} />
            Per Einladungslink beitreten
          </Link>
        </section>
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
        <p className="eyebrow">A-KlassenHoiz</p>
        <h1>Lokale Fußballtipps, sauber organisiert.</h1>
        <p>Private Tippspiel-App für lokale Fußballspiele.</p>
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
        showProfileLink={false}
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

  return (
    <HomeOverview
      tipprunden={tipprunden}
      profile={{ anzeigename: profile.anzeigename }}
      showProfileLink
    />
  );
}
