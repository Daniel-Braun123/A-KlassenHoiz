import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { MobileShell } from "@/components/pwa/mobile-shell";
import type { ActiveTipprundeOption } from "@/lib/domain/active-tipprunde";
import { readActiveTipprundeMembership } from "@/lib/domain/active-tipprunde-memberships";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function demoOptions(): ActiveTipprundeOption[] {
  return [
    { id: "demo-tipprunde", name: "Demo Tipprunde", currentSpieltagId: "demo-spieltag" },
    { id: "zweite-tipprunde", name: "Zweite Tipprunde", currentSpieltagId: "demo-spieltag" },
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

async function loadUserTipprunden(
  tipprundeId: string,
): Promise<{ tipprunden: ActiveTipprundeOption[]; hasActiveRequestedTipprunde: boolean }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      tipprunden: [{ id: tipprundeId, name: "Tipprunde", currentSpieltagId: null }],
      hasActiveRequestedTipprunde: true,
    };
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
    return { tipprunden: [], hasActiveRequestedTipprunde: false };
  }

  const hydratedTipprunden = await Promise.all(
    tipprunden.map(async (tipprunde) => ({
      ...tipprunde,
      currentSpieltagId: await loadCurrentSpieltagId(tipprunde.id),
    })),
  );

  return {
    tipprunden: hydratedTipprunden,
    hasActiveRequestedTipprunde: hydratedTipprunden.some(
      (tipprunde) => tipprunde.id === tipprundeId,
    ),
  };
}

export default async function TipprundeLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ tipprundeId: string }>;
}) {
  const { tipprundeId } = await params;
  const { tipprunden, hasActiveRequestedTipprunde } =
    tipprundeId === "demo-tipprunde" || tipprundeId === "zweite-tipprunde"
      ? { tipprunden: demoOptions(), hasActiveRequestedTipprunde: true }
      : await loadUserTipprunden(tipprundeId);

  if (!hasActiveRequestedTipprunde) {
    redirect("/");
  }

  return (
    <MobileShell activeTipprundeId={tipprundeId} tipprunden={tipprunden}>
      {children}
    </MobileShell>
  );
}
