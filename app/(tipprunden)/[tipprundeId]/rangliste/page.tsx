import { RanglisteTable } from "@/components/ranglisten/rangliste-table";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import {
  createDemoGesamtRangliste,
  createSupabaseRanglistenRepository,
  getGesamtRangliste,
} from "@/lib/domain/ranglisten-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function GesamtRanglistePage({
  params,
}: {
  params: Promise<{ tipprundeId: string }>;
}) {
  const { tipprundeId } = await params;

  if (tipprundeId === "demo-tipprunde") {
    return (
      <main>
        <RanglisteTable title="Gesamtrangliste" entries={createDemoGesamtRangliste()} />
      </main>
    );
  }

  const user = await requireAuthenticatedUser();
  const supabase = await createSupabaseServerClient();
  const entries = await getGesamtRangliste(createSupabaseRanglistenRepository(supabase), {
    tipprundeId,
    nutzerId: user.id,
  });

  return (
    <main>
      <RanglisteTable title="Gesamtrangliste" entries={entries} />
    </main>
  );
}
