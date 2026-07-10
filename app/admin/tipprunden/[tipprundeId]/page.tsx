import { redirect } from "next/navigation";

import { TipprundeAdminOverview } from "@/components/admin/tipprunde-admin-overview";
import { AppShell } from "@/components/pwa/mobile-shell";
import type { ActiveTipprundeOption } from "@/lib/domain/active-tipprunde";
import { readActiveTipprundeMembership } from "@/lib/domain/active-tipprunde-memberships";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function loadTipprundeName(tipprundeId: string): Promise<string | null> {
  if (tipprundeId === "demo-tipprunde") {
    return "Demo Tipprunde";
  }

  if (tipprundeId === "zweite-tipprunde") {
    return "Zweite Tipprunde";
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("tipprunden")
    .select("name, status")
    .eq("id", tipprundeId)
    .maybeSingle();

  if (!data || data.status !== "active") {
    return null;
  }

  return data.name ? String(data.name) : "Tipprunde";
}

function demoOptions(): ActiveTipprundeOption[] {
  return [
    {
      id: "demo-tipprunde",
      name: "Demo Tipprunde",
      currentSpieltagId: "demo-spieltag",
      rolle: "admin",
    },
    {
      id: "zweite-tipprunde",
      name: "Zweite Tipprunde",
      currentSpieltagId: "demo-spieltag",
      rolle: "admin",
    },
  ];
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

async function loadUserTipprunden(tipprundeId: string): Promise<ActiveTipprundeOption[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const name = await loadTipprundeName(tipprundeId);
    return name ? [{ id: tipprundeId, name, currentSpieltagId: null }] : [];
  }

  const { data } = await supabase
    .from("mitgliedschaften")
    .select("rolle, tipprunden:tipprunde_id(id, name, status)")
    .eq("nutzer_id", user.id)
    .eq("status", "active");
  const tipprunden = (data ?? [])
    .map((row) => readActiveTipprundeMembership(row))
    .filter((tipprunde): tipprunde is ActiveTipprundeOption => Boolean(tipprunde));

  if (tipprunden.length === 0) {
    const name = await loadTipprundeName(tipprundeId);
    return name ? [{ id: tipprundeId, name, currentSpieltagId: null }] : [];
  }

  return Promise.all(
    tipprunden.map(async (tipprunde) => ({
      ...tipprunde,
      currentSpieltagId: await loadCurrentSpieltagId(tipprunde.id),
    })),
  );
}

export default async function TipprundeAdminPage({
  params,
}: {
  params: Promise<{ tipprundeId: string }>;
}) {
  const { tipprundeId } = await params;
  const tipprundeName = await loadTipprundeName(tipprundeId);
  if (!tipprundeName) {
    redirect("/");
  }

  const tipprunden =
    tipprundeId === "demo-tipprunde" || tipprundeId === "zweite-tipprunde"
      ? demoOptions()
      : await loadUserTipprunden(tipprundeId);

  return (
    <AppShell activeTipprundeId={tipprundeId} tipprunden={tipprunden}>
      <main>
        <TipprundeAdminOverview tipprundeId={tipprundeId} tipprundeName={tipprundeName} />
      </main>
    </AppShell>
  );
}
