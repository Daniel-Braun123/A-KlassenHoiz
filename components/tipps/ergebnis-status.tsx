export function ErgebnisStatus({ isChanged }: { isChanged: boolean }) {
  if (!isChanged) {
    return <span className="ergebnis-status">Ergebnis</span>;
  }

  return <span className="ergebnis-status changed">Geändertes Ergebnis</span>;
}
