import { TippCard } from "@/components/tipps/tipp-card";
import type { SpieltagTippView } from "@/lib/domain/spieltag-view-service";

type SpieltagTippsProps = {
  view: SpieltagTippView;
};

export function SpieltagTipps({ view }: SpieltagTippsProps) {
  return (
    <section className="tipps-page" aria-labelledby="spieltag-tippen-heading">
      <p className="eyebrow">Spieltag {view.spieltagId}</p>
      <h1 id="spieltag-tippen-heading">Spieltag tippen</h1>
      {view.spiele.length === 0 ? (
        <div className="empty-state">
          <h2>Noch keine Spiele</h2>
          <p>Für diesen Spieltag sind noch keine Spiele gepflegt.</p>
        </div>
      ) : (
        <div className="tipp-list">
          {view.spiele.map((spiel) => (
            <TippCard key={spiel.id} tipprundeId={view.tipprundeId} spiel={spiel} />
          ))}
        </div>
      )}
    </section>
  );
}
