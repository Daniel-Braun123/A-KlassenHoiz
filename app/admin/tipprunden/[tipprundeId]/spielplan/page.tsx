import { SpielplanAdmin } from "@/components/admin/spielplan-admin";

export default async function SpielplanAdminPage({
  params,
}: {
  params: Promise<{ tipprundeId: string }>;
}) {
  const { tipprundeId } = await params;

  return (
    <main>
      <SpielplanAdmin tipprundeId={tipprundeId} />
    </main>
  );
}
