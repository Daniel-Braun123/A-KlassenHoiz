import { RanglisteTable } from "@/components/ranglisten/rangliste-table";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import {
  createDemoSpieltagRangliste,
  createSupabaseRanglistenRepository,
  getSpieltagRangliste,
} from "@/lib/domain/ranglisten-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SpieltagRanglistePage({
  params,
}: {
  params: Promise<{ tipprundeId: string; spieltagId: string }>;
}) {
  const { tipprundeId, spieltagId } = await params;

  if (tipprundeId === "demo-tipprunde" && spieltagId === "demo-spieltag") {
    return (
      <main>
        <RanglisteTable title="Spieltagsrangliste" entries={createDemoSpieltagRangliste()} />
      </main>
    );
  }

  const user = await requireAuthenticatedUser();
  const supabase = await createSupabaseServerClient();
  const entries = await getSpieltagRangliste(createSupabaseRanglistenRepository(supabase), {
    tipprundeId,
    spieltagId,
    nutzerId: user.id,
  });

  return (
    <main>
      <RanglisteTable title="Spieltagsrangliste" entries={entries} />
    </main>
  );
}
