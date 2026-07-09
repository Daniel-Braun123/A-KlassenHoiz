"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { TeamLogo } from "@/components/admin/team-logo";
import { ErgebnisStatus } from "@/components/tipps/ergebnis-status";
import { isSpielVorbei } from "@/lib/domain/tippfristen";
import type { SpielStatus } from "@/lib/domain/types";

type ErgebnisSpieltag = {
  id: string;
  name: string;
};

type ErgebnisVerein = {
  id: string;
  name: string;
  logoUrl: string | null;
};

type ErgebnisSpiel = {
  id: string;
  spieltagId: string;
  heimteamId: string;
  auswaertsteamId: string;
  anstosszeit: string;
  status: SpielStatus;
  ergebnis: { heimtore: number; auswaertstore: number } | null;
};

type ErgebnisFormProps = {
  tipprundeId: string;
  spieltage: ErgebnisSpieltag[];
  spiele: ErgebnisSpiel[];
  vereine: ErgebnisVerein[];
  onErgebnisSaved?: (input: {
    spielId: string;
    ergebnis: { heimtore: number; auswaertstore: number };
  }) => void;
};

type ApiResponse = {
  error?: { message: string };
  ergebnis?: { heimtore: number; auswaertstore: number };
};

function findVerein(vereine: ErgebnisVerein[], vereinId: string) {
  return vereine.find((verein) => verein.id === vereinId) ?? null;
}

function findSpieltag(spieltage: ErgebnisSpieltag[], spieltagId: string) {
  return spieltage.find((spieltag) => spieltag.id === spieltagId) ?? null;
}

function formatAnpfiff(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(new Date(value));
}

function SpielOption({ spiel, vereine }: { spiel: ErgebnisSpiel; vereine: ErgebnisVerein[] }) {
  const heimverein = findVerein(vereine, spiel.heimteamId);
  const auswaertsverein = findVerein(vereine, spiel.auswaertsteamId);

  return (
    <span className="ergebnis-spiel-option-content">
      <span className="ergebnis-spiel-team">
        <TeamLogo name={heimverein?.name ?? "Heimverein"} logoUrl={heimverein?.logoUrl} />
        <span>{heimverein?.name ?? "Heimverein"}</span>
      </span>
      <span className="ergebnis-spiel-separator">-</span>
      <span className="ergebnis-spiel-team">
        <TeamLogo
          name={auswaertsverein?.name ?? "Auswärtsverein"}
          logoUrl={auswaertsverein?.logoUrl}
        />
        <span>{auswaertsverein?.name ?? "Auswärtsverein"}</span>
      </span>
      <time dateTime={spiel.anstosszeit}>{formatAnpfiff(spiel.anstosszeit)}</time>
    </span>
  );
}

function OffenesErgebnisItem({
  spiel,
  spieltage,
  vereine,
  isSelected,
  onSelect,
}: {
  spiel: ErgebnisSpiel;
  spieltage: ErgebnisSpieltag[];
  vereine: ErgebnisVerein[];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const heimverein = findVerein(vereine, spiel.heimteamId);
  const auswaertsverein = findVerein(vereine, spiel.auswaertsteamId);
  const spieltag = findSpieltag(spieltage, spiel.spieltagId);

  return (
    <button
      type="button"
      className="offenes-ergebnis-item"
      aria-current={isSelected ? "true" : undefined}
      onClick={onSelect}
    >
      <span className="offenes-ergebnis-matchup">
        <span className="ergebnis-spiel-team">
          <TeamLogo name={heimverein?.name ?? "Heimverein"} logoUrl={heimverein?.logoUrl} />
          <span>{heimverein?.name ?? "Heimverein"}</span>
        </span>
        <span className="ergebnis-spiel-separator">-</span>
        <span className="ergebnis-spiel-team">
          <TeamLogo
            name={auswaertsverein?.name ?? "Auswärtsverein"}
            logoUrl={auswaertsverein?.logoUrl}
          />
          <span>{auswaertsverein?.name ?? "Auswärtsverein"}</span>
        </span>
      </span>
      <span className="offenes-ergebnis-meta">
        <span>{spieltag?.name ?? "Spieltag"}</span>
        <time dateTime={spiel.anstosszeit}>{formatAnpfiff(spiel.anstosszeit)}</time>
      </span>
    </button>
  );
}

function ErgebnisMatchup({
  spiel,
  vereine,
  mode,
  disabled = false,
}: {
  spiel: ErgebnisSpiel;
  vereine: ErgebnisVerein[];
  mode: "display" | "input";
  disabled?: boolean;
}) {
  const heimverein = findVerein(vereine, spiel.heimteamId);
  const auswaertsverein = findVerein(vereine, spiel.auswaertsteamId);

  return (
    <div className="ergebnis-result-matchup">
      <span className="ergebnis-result-team ergebnis-result-team-home">
        <span className="ergebnis-result-team-name">{heimverein?.name ?? "Heimverein"}</span>
        <span className="ergebnis-result-logo" aria-hidden="true">
          <TeamLogo name={heimverein?.name ?? "Heimverein"} logoUrl={heimverein?.logoUrl} />
        </span>
      </span>

      <span className="ergebnis-result-center">
        {mode === "display" && spiel.ergebnis ? (
          <span
            className="ergebnis-result-score"
            aria-label={`Ergebnis ${spiel.ergebnis.heimtore} zu ${spiel.ergebnis.auswaertstore}`}
          >
            {spiel.ergebnis.heimtore} : {spiel.ergebnis.auswaertstore}
          </span>
        ) : (
          <span className="ergebnis-result-inputs">
            <label>
              <span className="sr-only">Heimtore</span>
              <input
                name="heimtore"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="0"
                defaultValue={spiel.ergebnis?.heimtore ?? ""}
                required
                disabled={disabled}
                aria-label="Heimtore"
              />
            </label>
            <span aria-hidden="true">:</span>
            <label>
              <span className="sr-only">Auswärtstore</span>
              <input
                name="auswaertstore"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="0"
                defaultValue={spiel.ergebnis?.auswaertstore ?? ""}
                required
                disabled={disabled}
                aria-label="Auswärtstore"
              />
            </label>
          </span>
        )}
        <time dateTime={spiel.anstosszeit}>{formatAnpfiff(spiel.anstosszeit)}</time>
      </span>

      <span className="ergebnis-result-team ergebnis-result-team-away">
        <span className="ergebnis-result-logo" aria-hidden="true">
          <TeamLogo
            name={auswaertsverein?.name ?? "Auswärtsverein"}
            logoUrl={auswaertsverein?.logoUrl}
          />
        </span>
        <span className="ergebnis-result-team-name">
          {auswaertsverein?.name ?? "Auswärtsverein"}
        </span>
      </span>
    </div>
  );
}

export function ErgebnisForm({
  tipprundeId,
  spieltage,
  spiele,
  vereine,
  onErgebnisSaved,
}: ErgebnisFormProps) {
  const [selectedSpieltagId, setSelectedSpieltagId] = useState(spieltage[0]?.id ?? "");
  const [selectedSpielId, setSelectedSpielId] = useState("");
  const [editingErgebnisSpielId, setEditingErgebnisSpielId] = useState<string | null>(null);
  const [isSpielDropdownOpen, setIsSpielDropdownOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const effectiveSpieltagId = selectedSpieltagId || spieltage[0]?.id || "";

  const spieleForSelectedSpieltag = useMemo(
    () => spiele.filter((spiel) => spiel.spieltagId === effectiveSpieltagId),
    [effectiveSpieltagId, spiele],
  );
  const selectedSpiel =
    spieleForSelectedSpieltag.find((spiel) => spiel.id === selectedSpielId) ?? null;
  const effectiveSpielId = selectedSpiel?.id ?? "";
  const selectedSpieltag =
    spieltage.find((spieltag) => spieltag.id === effectiveSpieltagId) ?? null;
  const hasExistingErgebnis = Boolean(selectedSpiel?.ergebnis);
  const isAenderungsmodus = Boolean(
    selectedSpiel && hasExistingErgebnis && editingErgebnisSpielId === selectedSpiel.id,
  );
  const selectedSpielIstVorbei = selectedSpiel
    ? isSpielVorbei({ now, anstosszeit: selectedSpiel.anstosszeit })
    : false;
  const offeneErgebnisSpiele = useMemo(
    () =>
      spiele
        .filter(
          (spiel) =>
            !spiel.ergebnis &&
            spiel.status !== "verschoben" &&
            spiel.status !== "abgesagt" &&
            isSpielVorbei({ now, anstosszeit: spiel.anstosszeit }),
        )
        .sort((a, b) => new Date(a.anstosszeit).getTime() - new Date(b.anstosszeit).getTime()),
    [now, spiele],
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 1_000);

    return () => window.clearInterval(intervalId);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!selectedSpiel) {
      setMessage("Bitte wähle ein Spiel aus.");
      return;
    }

    if (!isSpielVorbei({ now: new Date(), anstosszeit: selectedSpiel.anstosszeit })) {
      setMessage("Ergebnisse können erst nach Spielende eingetragen werden.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const reason = String(formData.get("reason") ?? "").trim();
    if (isAenderungsmodus && !reason) {
      setMessage("Bitte gib einen Änderungsgrund ein.");
      return;
    }

    setIsSubmitting(true);
    const response = await fetch(
      `/api/tipprunden/${tipprundeId}/spiele/${selectedSpiel.id}/ergebnis`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heimtore: Number(formData.get("heimtore")),
          auswaertstore: Number(formData.get("auswaertstore")),
          reason,
        }),
      },
    );
    const payload = (await response.json().catch(() => null)) as ApiResponse | null;
    setIsSubmitting(false);

    if (!response.ok) {
      setMessage(payload?.error?.message ?? "Ergebnis konnte nicht gespeichert werden.");
      return;
    }

    if (payload?.ergebnis) {
      onErgebnisSaved?.({ spielId: selectedSpiel.id, ergebnis: payload.ergebnis });
    }

    setEditingErgebnisSpielId(null);
    setMessage("Ergebnis gespeichert und Punkte neu berechnet.");
  }

  if (!spieltage.length) {
    return (
      <div className="ergebnis-flow">
        <div className="empty-state compact-empty">
          <p>Lege zuerst einen Spieltag an, bevor du Ergebnisse einträgst.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ergebnis-flow">
      <section className="offene-ergebnisse" aria-labelledby="offene-ergebnisse-heading">
        <div className="offene-ergebnisse-heading">
          <div>
            <p className="eyebrow">Offene Ergebnisse</p>
            <h3 id="offene-ergebnisse-heading">Eintragen möglich</h3>
          </div>
          <span
            className="offene-ergebnisse-count"
            aria-label={`${offeneErgebnisSpiele.length} offene Ergebnisse`}
          >
            {offeneErgebnisSpiele.length}
          </span>
        </div>

        {offeneErgebnisSpiele.length ? (
          <div className="offene-ergebnisse-list">
            {offeneErgebnisSpiele.map((spiel) => (
              <OffenesErgebnisItem
                key={spiel.id}
                spiel={spiel}
                spieltage={spieltage}
                vereine={vereine}
                isSelected={spiel.id === effectiveSpielId}
                onSelect={() => {
                  setSelectedSpieltagId(spiel.spieltagId);
                  setSelectedSpielId(spiel.id);
                  setEditingErgebnisSpielId(null);
                  setIsSpielDropdownOpen(false);
                  setMessage(null);
                }}
              />
            ))}
          </div>
        ) : (
          <p className="offene-ergebnisse-empty">Keine offenen Ergebnisse.</p>
        )}
      </section>

      <label>
        Spieltag
        <select
          value={effectiveSpieltagId}
          onChange={(event) => {
            setSelectedSpieltagId(event.target.value);
            setSelectedSpielId("");
            setEditingErgebnisSpielId(null);
            setIsSpielDropdownOpen(false);
            setMessage(null);
          }}
        >
          {spieltage.map((spieltag) => (
            <option key={spieltag.id} value={spieltag.id}>
              {spieltag.name}
            </option>
          ))}
        </select>
      </label>

      {spieleForSelectedSpieltag.length ? (
        <div className="ergebnis-spiel-dropdown">
          <span className="form-label">Spiel</span>
          <button
            type="button"
            className="ergebnis-spiel-trigger"
            aria-label="Spiel auswählen"
            aria-haspopup="listbox"
            aria-expanded={isSpielDropdownOpen}
            onClick={() => setIsSpielDropdownOpen((current) => !current)}
          >
            {selectedSpiel ? (
              <SpielOption spiel={selectedSpiel} vereine={vereine} />
            ) : (
              <span>Spiel auswählen</span>
            )}
            <ChevronDown aria-hidden="true" size={18} />
          </button>

          {isSpielDropdownOpen ? (
            <div className="ergebnis-spiel-listbox" role="listbox" aria-label="Spiel auswählen">
              {spieleForSelectedSpieltag.map((spiel) => (
                <button
                  key={spiel.id}
                  type="button"
                  role="option"
                  aria-selected={spiel.id === effectiveSpielId}
                  onClick={() => {
                    setSelectedSpielId(spiel.id);
                    setEditingErgebnisSpielId(null);
                    setIsSpielDropdownOpen(false);
                    setMessage(null);
                  }}
                >
                  <SpielOption spiel={spiel} vereine={vereine} />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="empty-state compact-empty">
          <p>Für {selectedSpieltag?.name ?? "diesen Spieltag"} sind noch keine Spiele angelegt.</p>
        </div>
      )}

      {selectedSpiel ? (
        <form
          key={`${selectedSpiel.id}-${isAenderungsmodus ? "edit" : "view"}`}
          className="ergebnis-entry-form"
          onSubmit={handleSubmit}
        >
          <div className="ergebnis-result-card">
            <ErgebnisMatchup
              spiel={selectedSpiel}
              vereine={vereine}
              mode={hasExistingErgebnis && !isAenderungsmodus ? "display" : "input"}
              disabled={!selectedSpielIstVorbei}
            />
            {isAenderungsmodus ? <ErgebnisStatus isChanged /> : null}
          </div>

          {!selectedSpielIstVorbei ? (
            <p className="ergebnis-lock-hint">Ergebnis erst nach Spielende möglich.</p>
          ) : null}

          {isAenderungsmodus ? (
            <label>
              Änderungsgrund
              <input
                name="reason"
                type="text"
                required
                placeholder="z. B. Korrektur Spielbericht"
              />
            </label>
          ) : null}

          {hasExistingErgebnis && !isAenderungsmodus ? (
            <button
              type="button"
              className="secondary-button"
              disabled={!selectedSpielIstVorbei}
              onClick={() => {
                setEditingErgebnisSpielId(selectedSpiel.id);
                setMessage(null);
              }}
            >
              Ergebnis ändern
            </button>
          ) : (
            <button type="submit" disabled={isSubmitting || !selectedSpielIstVorbei}>
              Ergebnis speichern
            </button>
          )}
        </form>
      ) : null}

      {message ? <p role="status">{message}</p> : null}
    </div>
  );
}
