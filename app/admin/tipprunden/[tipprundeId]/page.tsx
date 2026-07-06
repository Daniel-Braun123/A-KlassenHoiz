import { TipprundeAdminOverview } from "@/components/admin/tipprunde-admin-overview";
import { MobileShell } from "@/components/pwa/mobile-shell";
import type { ActiveTipprundeOption } from "@/lib/domain/active-tipprunde";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function loadTipprundeName(tipprundeId: string): Promise<string> {
  if (tipprundeId === "demo-tipprunde") {
    return "Demo Tipprunde";
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("tipprunden")
    .select("name")
    .eq("id", tipprundeId)
    .maybeSingle();

  return data?.name ? String(data.name) : "Tipprunde";
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
    return [{ id: tipprundeId, name: await loadTipprundeName(tipprundeId), currentSpieltagId: null }];
  }

  const { data } = await supabase
    .from("mitgliedschaften")
    .select("rolle, tipprunden:tipprunde_id(id, name)")
    .eq("nutzer_id", user.id)
    .eq("status", "active");
  const tipprunden = (data ?? [])
    .map((row) => readTipprundeMembership(row))
    .filter((tipprunde): tipprunde is ActiveTipprundeOption => Boolean(tipprunde));

  if (tipprunden.length === 0) {
    return [{ id: tipprundeId, name: await loadTipprundeName(tipprundeId), currentSpieltagId: null }];
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
  const tipprunden =
    tipprundeId === "demo-tipprunde" || tipprundeId === "zweite-tipprunde"
      ? demoOptions()
      : await loadUserTipprunden(tipprundeId);

  return (
    <MobileShell activeTipprundeId={tipprundeId} tipprunden={tipprunden}>
      <main>
        <TipprundeAdminOverview tipprundeId={tipprundeId} tipprundeName={tipprundeName} />
      </main>
    </MobileShell>
  );
}
