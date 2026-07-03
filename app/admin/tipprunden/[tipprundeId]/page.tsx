import { TipprundeAdminOverview } from "@/components/admin/tipprunde-admin-overview";

export default async function TipprundeAdminPage({
  params,
}: {
  params: Promise<{ tipprundeId: string }>;
}) {
  const { tipprundeId } = await params;

  return (
    <main>
      <TipprundeAdminOverview tipprundeId={tipprundeId} />
    </main>
  );
}
