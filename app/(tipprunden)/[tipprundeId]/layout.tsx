import type { ReactNode } from "react";

import { MobileShell } from "@/components/pwa/mobile-shell";
import type { ActiveTipprundeOption } from "@/lib/domain/active-tipprunde";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function demoOptions(): ActiveTipprundeOption[] {
  return [
    { id: "demo-tipprunde", name: "Demo Tipprunde", currentSpieltagId: "demo-spieltag" },
    { id: "zweite-tipprunde", name: "Zweite Tipprunde", currentSpieltagId: "demo-spieltag" },
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
    return [{ id: tipprundeId, name: "Tipprunde", currentSpieltagId: null }];
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
    return [{ id: tipprundeId, name: "Tipprunde", currentSpieltagId: null }];
  }

  return Promise.all(
    tipprunden.map(async (tipprunde) => ({
      ...tipprunde,
      currentSpieltagId: await loadCurrentSpieltagId(tipprunde.id),
    })),
  );
}

export default async function TipprundeLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ tipprundeId: string }>;
}) {
  const { tipprundeId } = await params;
  const tipprunden =
    tipprundeId === "demo-tipprunde" || tipprundeId === "zweite-tipprunde"
      ? demoOptions()
      : await loadUserTipprunden(tipprundeId);

  return (
    <MobileShell activeTipprundeId={tipprundeId} tipprunden={tipprunden}>
      {children}
    </MobileShell>
  );
}
