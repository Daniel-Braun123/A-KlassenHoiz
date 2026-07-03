import { requireAuthenticatedProfile } from "@/lib/auth/guards";
import {
  createDemoSpieltagTippView,
  createSpieltagTippView,
} from "@/lib/domain/spieltag-view-service";
import { createSupabaseTippsRepository } from "@/lib/domain/tipps-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SpieltagTipps } from "@/components/tipps/spieltag-tipps";

export default async function SpieltagTippPage({
  params,
}: {
  params: Promise<{ tipprundeId: string; spieltagId: string }>;
}) {
  const { tipprundeId, spieltagId } = await params;

  if (
    (tipprundeId === "demo-tipprunde" || tipprundeId === "zweite-tipprunde") &&
    spieltagId === "demo-spieltag"
  ) {
    return (
      <main>
        <SpieltagTipps view={createDemoSpieltagTippView()} />
      </main>
    );
  }

  const { user } = await requireAuthenticatedProfile();
  const supabase = await createSupabaseServerClient();
  const view = await createSpieltagTippView(createSupabaseTippsRepository(supabase), {
    tipprundeId,
    spieltagId,
    nutzerId: user.id,
  });

  return (
    <main>
      <SpieltagTipps view={view} />
    </main>
  );
}
