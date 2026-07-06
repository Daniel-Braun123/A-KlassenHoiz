import { requireAuthenticatedProfile } from "@/lib/auth/guards";
import {
  createDemoSpieltagTippView,
  createSpieltagTippView,
} from "@/lib/domain/spieltag-view-service";
import { createSupabaseTippsRepository } from "@/lib/domain/tipps-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SpieltagTipps } from "@/components/tipps/spieltag-tipps";
import type { SpieltagOption } from "@/components/tipps/spieltag-select";

function demoSpieltage(): SpieltagOption[] {
  return [
    { id: "demo-spieltag", name: "Hinrunde Spieltag 1" },
    { id: "demo-spieltag-2", name: "Hinrunde Spieltag 2" },
  ];
}

async function loadSpieltage(tipprundeId: string): Promise<SpieltagOption[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("spieltage")
    .select("id, name, abschnitt, nummer, sort_order")
    .eq("tipprunde_id", tipprundeId)
    .order("sort_order", { ascending: true })
    .order("nummer", { ascending: true });

  if (error) {
    return [];
  }

  return (data ?? []).map((spieltag) => ({
    id: String(spieltag.id),
    name: String(spieltag.name),
  }));
}

export default async function SpieltagTippPage({
  params,
}: {
  params: Promise<{ tipprundeId: string; spieltagId: string }>;
}) {
  const { tipprundeId, spieltagId } = await params;

  if (
    (tipprundeId === "demo-tipprunde" || tipprundeId === "zweite-tipprunde") &&
    demoSpieltage().some((spieltag) => spieltag.id === spieltagId)
  ) {
    return (
      <main>
        <SpieltagTipps
          view={createDemoSpieltagTippView(undefined, spieltagId)}
          spieltage={demoSpieltage()}
        />
      </main>
    );
  }

  const { user } = await requireAuthenticatedProfile();
  const supabase = await createSupabaseServerClient();
  const spieltage = await loadSpieltage(tipprundeId);
  const view = await createSpieltagTippView(createSupabaseTippsRepository(supabase), {
    tipprundeId,
    spieltagId,
    nutzerId: user.id,
  });

  return (
    <main>
      <SpieltagTipps view={view} spieltage={spieltage} />
    </main>
  );
}
