import Link from "next/link";

import { chooseTipprundenLanding } from "@/lib/domain/tipprunden-landing";

export default function TipprundenLandingPage() {
  const decision = chooseTipprundenLanding({ tipprunden: [] });

  return (
    <main className="tipprunden-page">
      <h1>Meine Tipprunden</h1>
      {decision.type === "onboarding" ? (
        <section className="stack">
          <p>Du bist noch in keiner Tipprunde.</p>
          <Link className="button-link" href="/admin/tipprunden/neu">
            Tipprunde erstellen
          </Link>
          <Link className="button-link secondary" href="/login">
            Per Einladungslink beitreten
          </Link>
        </section>
      ) : null}
    </main>
  );
}
