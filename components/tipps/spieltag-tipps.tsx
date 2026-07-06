import { TippCard } from "@/components/tipps/tipp-card";
import { SpieltagSelect, type SpieltagOption } from "@/components/tipps/spieltag-select";
import type { SpieltagTippView } from "@/lib/domain/spieltag-view-service";

type SpieltagTippsProps = {
  view: SpieltagTippView;
  spieltage: SpieltagOption[];
};

export function SpieltagTipps({ view, spieltage }: SpieltagTippsProps) {
  return (
    <section className="tipps-page" aria-labelledby="spieltag-tippen-heading">
      <h1 id="spieltag-tippen-heading" className="sr-only">
        Spieltag tippen
      </h1>
      <SpieltagSelect
        tipprundeId={view.tipprundeId}
        spieltagId={view.spieltagId}
        spieltage={spieltage}
      />
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
