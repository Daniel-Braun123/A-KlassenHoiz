import { TipprundeAdminOverview } from "@/components/admin/tipprunde-admin-overview";
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

export default async function TipprundeAdminPage({
  params,
}: {
  params: Promise<{ tipprundeId: string }>;
}) {
  const { tipprundeId } = await params;
  const tipprundeName = await loadTipprundeName(tipprundeId);

  return (
    <main>
      <TipprundeAdminOverview tipprundeId={tipprundeId} tipprundeName={tipprundeName} />
    </main>
  );
}
