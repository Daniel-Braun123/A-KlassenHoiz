import Link from "next/link";

import { EinladungJoinForm } from "@/components/tipps/einladung-join-form";

export default async function EinladungJoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <main>
      <section className="admin-panel" aria-labelledby="join-heading">
        <p className="eyebrow">Einladung</p>
        <h1 id="join-heading">Tipprunde beitreten</h1>
        <p>Wähle deinen Anzeigenamen für diese Tipprunde.</p>
        <EinladungJoinForm token={token} />
        <p>
          Noch nicht angemeldet? <Link href="/login">Anmelden</Link> oder{" "}
          <Link href="/register">Registrieren</Link>
        </p>
      </section>
    </main>
  );
}
