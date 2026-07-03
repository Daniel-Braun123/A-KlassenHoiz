import { ErgebnisStatus } from "@/components/tipps/ergebnis-status";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import {
  createDemoVergangeneErgebnisse,
  createSupabaseRanglistenRepository,
  getVergangeneSpieltagErgebnisse,
  type SpieltagErgebnisseView,
} from "@/lib/domain/ranglisten-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function ErgebnisseListe({ spieltage }: { spieltage: SpieltagErgebnisseView[] }) {
  return (
    <section className="ergebnisse-page" aria-labelledby="ergebnisse-heading">
      <h1 id="ergebnisse-heading">Vergangene Spieltage und Ergebnisse</h1>
      {spieltage.length === 0 ? (
        <p>Noch keine Ergebnisse vorhanden.</p>
      ) : (
        <div className="ergebnisse-list">
          {spieltage.map((spieltag) => (
            <section key={spieltag.spieltagId} className="ergebnisse-spieltag">
              <h2>{spieltag.name}</h2>
              <div className="ergebnisse-spiele">
                {spieltag.spiele.map((spiel) => (
                  <article key={spiel.spielId} className="ergebnis-row">
                    <div>
                      <strong>{spiel.heimteamName}</strong>
                      <span>{spiel.auswaertsteamName}</span>
                    </div>
                    <p className="ergebnis-score">
                      {spiel.heimtore}:{spiel.auswaertstore}
                    </p>
                    <ErgebnisStatus isChanged={spiel.isChangedAfterScoring} />
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function ErgebnissePage({
  params,
}: {
  params: Promise<{ tipprundeId: string }>;
}) {
  const { tipprundeId } = await params;

  if (tipprundeId === "demo-tipprunde") {
    return (
      <main>
        <ErgebnisseListe spieltage={createDemoVergangeneErgebnisse()} />
      </main>
    );
  }

  const user = await requireAuthenticatedUser();
  const supabase = await createSupabaseServerClient();
  const spieltage = await getVergangeneSpieltagErgebnisse(
    createSupabaseRanglistenRepository(supabase),
    {
      tipprundeId,
      nutzerId: user.id,
    },
  );

  return (
    <main>
      <ErgebnisseListe spieltage={spieltage} />
    </main>
  );
}
