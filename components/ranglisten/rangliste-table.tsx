import type { DerivedRanglisteEintrag } from "@/lib/scoring/derive-ranglisten";

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
        <p>Noch keine Punkte vorhanden.</p>
      ) : (
        <div className="rangliste-table-wrap">
          <table className="rangliste-table">
            <thead>
              <tr>
                <th scope="col">Platz</th>
                <th scope="col">Anzeigename</th>
                <th scope="col">Punkte</th>
                <th scope="col">Exakte Tipps</th>
                <th scope="col">Richtige Tordifferenz</th>
                <th scope="col">Richtige Tendenz</th>
                <th scope="col">Abgegebene Tipps</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.nutzerId}>
                  <td>Platz {entry.platzierung}</td>
                  <td>{nameForEntry(entry)}</td>
                  <td>{entry.punkte}</td>
                  <td>{entry.anzahlExakteTipps}</td>
                  <td>{entry.anzahlTordifferenzTipps}</td>
                  <td>{entry.anzahlTendenzTipps}</td>
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
