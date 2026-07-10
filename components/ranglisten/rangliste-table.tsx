import type { DerivedRanglisteEintrag } from "@/lib/scoring/derive-ranglisten";
import { EmptyState } from "@/components/ui/primitives";

type RanglisteTableProps = {
  title: string;
  entries: DerivedRanglisteEintrag[];
};

function nameForEntry(entry: DerivedRanglisteEintrag): string {
  return entry.tipprundenNickname || entry.anzeigename;
}

export function RanglisteTable({ title, entries }: RanglisteTableProps) {
  return (
    <section className="rangliste-section" aria-labelledby={`${title}-heading`}>
      <h1 id={`${title}-heading`}>{title}</h1>
      {entries.length === 0 ? (
        <EmptyState title="Noch keine Punkte">
          <p>Sobald Ergebnisse gewertet sind, erscheint hier die Rangliste.</p>
        </EmptyState>
      ) : (
        <div className="rangliste-table-wrap">
          <table className="rangliste-table">
            <thead>
              <tr>
                <th scope="col" aria-label="Platzierung">
                  #
                </th>
                <th scope="col">Name</th>
                <th scope="col" aria-label="Punkte">
                  P
                </th>
                <th scope="col">Tipps</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.nutzerId}>
                  <td>{entry.platzierung}</td>
                  <td>{nameForEntry(entry)}</td>
                  <td>{entry.punkte}</td>
                  <td>{entry.anzahlAbgegebeneTipps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
