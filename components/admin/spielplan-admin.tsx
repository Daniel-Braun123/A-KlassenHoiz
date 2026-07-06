"use client";

import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Layers3,
  Plus,
  ShieldCheck,
  Swords,
  Trophy,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { ErgebnisForm } from "@/components/admin/ergebnis-form";
import { TeamLogo } from "@/components/admin/team-logo";
import { RegisterTipprundeHeaderTitle } from "@/components/navigation/global-topbar";

type SpielplanAdminProps = {
  tipprundeId: string;
  tipprundeName: string;
};

type Liga = {
  id: string;
  tipprundeId: string;
  name: string;
};

type Verein = {
  id: string;
  tipprundeId: string;
  name: string;
  logoUrl: string | null;
};

type Spieltag = {
  id: string;
  tipprundeId: string;
  name: string;
  abschnitt: "hinrunde" | "rueckrunde";
  nummer: number;
  sortOrder: number;
};

type Spiel = {
  id: string;
  tipprundeId: string;
  spieltagId: string;
  heimteamId: string;
  auswaertsteamId: string;
  anstosszeit: string;
  status: "geplant" | "beendet" | "verschoben" | "abgesagt" | "abgebrochen";
  ergebnis: { heimtore: number; auswaertstore: number } | null;
};

type ApiResponse<T> = T & { error?: { message: string } };
type ActiveTab = "vereine" | "spieltage" | "ergebnisse";

const DEMO_LIGA: Liga = {
  id: "demo-liga",
  tipprundeId: "demo-tipprunde",
  name: "A-Klasse Nord",
};

const DEMO_VEREINE: Verein[] = [
  { id: "verein-1", tipprundeId: "demo-tipprunde", name: "FC Hoiz", logoUrl: null },
  { id: "verein-2", tipprundeId: "demo-tipprunde", name: "SV Bretterbach", logoUrl: null },
];

const DEMO_SPIELTAGE: Spieltag[] = [
  {
    id: "spieltag-1",
    tipprundeId: "demo-tipprunde",
    name: "Hinrunde Spieltag 1",
    abschnitt: "hinrunde",
    nummer: 1,
    sortOrder: 1,
  },
];

const DEMO_SPIELE: Spiel[] = [
  {
    id: "spiel-1",
    tipprundeId: "demo-tipprunde",
    spieltagId: "spieltag-1",
    heimteamId: "verein-1",
    auswaertsteamId: "verein-2",
    anstosszeit: "2026-08-01T13:30:00.000Z",
    status: "geplant",
    ergebnis: null,
  },
  {
    id: "spiel-2",
    tipprundeId: "demo-tipprunde",
    spieltagId: "spieltag-1",
    heimteamId: "verein-2",
    auswaertsteamId: "verein-1",
    anstosszeit: "2026-08-02T13:30:00.000Z",
    status: "beendet",
    ergebnis: { heimtore: 1, auswaertstore: 1 },
  },
];

const STATUS_OPTIONS = ["geplant", "verschoben", "abgesagt"] as const;
const LIVE_WINDOW_MS = 90 * 60 * 1000;

function abschnittLabel(abschnitt: Spieltag["abschnitt"]) {
  return abschnitt === "rueckrunde" ? "Rückrunde" : "Hinrunde";
}

function formatAnpfiff(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(new Date(value));
}

function formatAnpfiffUhrzeit(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  }).format(new Date(value));
}

function isSpielLive(spiel: Spiel, now = new Date()) {
  const anstoss = new Date(spiel.anstosszeit).getTime();
  const current = now.getTime();

  return spiel.status === "geplant" && current >= anstoss && current <= anstoss + LIVE_WINDOW_MS;
}

function getSpielMitte(spiel: Spiel, now = new Date()) {
  if (isSpielLive(spiel, now)) {
    return { kind: "live" as const, label: "LIVE" };
  }

  if (spiel.ergebnis) {
    return {
      kind: "score" as const,
      label: `${spiel.ergebnis.heimtore} : ${spiel.ergebnis.auswaertstore}`,
    };
  }

  return { kind: "time" as const, label: formatAnpfiffUhrzeit(spiel.anstosszeit) };
}

function findVerein(vereine: Verein[], vereinId: string) {
  return vereine.find((verein) => verein.id === vereinId) ?? null;
}

function normalizeVereinsname(name: string) {
  return name.trim().toLocaleLowerCase("de-DE");
}

function StatusMessage({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <div className="admin-toast" role="status">
      <CheckCircle2 aria-hidden="true" size={18} />
      <span>{message}</span>
    </div>
  );
}

function VereinSelect({
  id,
  name,
  label,
  vereine,
  value,
  excludedVereinId,
  excludedVereinName,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  vereine: Verein[];
  value: string;
  excludedVereinId?: string;
  excludedVereinName?: string;
  onChange: (value: string) => void;
}) {
  const selectedVerein = findVerein(vereine, value);
  const normalizedExcludedName = excludedVereinName
    ? normalizeVereinsname(excludedVereinName)
    : null;
  const selectableVereine = vereine.filter(
    (verein) =>
      verein.id !== excludedVereinId &&
      (!normalizedExcludedName || normalizeVereinsname(verein.name) !== normalizedExcludedName),
  );

  return (
    <label>
      {label}
      <select
        id={id}
        name={name}
        value={value}
        required
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Verein auswählen</option>
        {selectableVereine.map((verein) => (
          <option key={verein.id} value={verein.id}>
            {verein.name}
          </option>
        ))}
      </select>
      {selectedVerein ? (
        <span className="verein-select-preview">
          <TeamLogo name={selectedVerein.name} logoUrl={selectedVerein.logoUrl} />
          <span>{selectedVerein.name}</span>
        </span>
      ) : null}
    </label>
  );
}

export function SpielplanAdmin({ tipprundeId, tipprundeName }: SpielplanAdminProps) {
  const isDemo = tipprundeId === "demo-tipprunde";
  const [activeTab, setActiveTab] = useState<ActiveTab>("vereine");
  const [liga, setLiga] = useState<Liga | null>(isDemo ? DEMO_LIGA : null);
  const [vereine, setVereine] = useState<Verein[]>(isDemo ? DEMO_VEREINE : []);
  const [spieltage, setSpieltage] = useState<Spieltag[]>(isDemo ? DEMO_SPIELTAGE : []);
  const [spiele, setSpiele] = useState<Spiel[]>(isDemo ? DEMO_SPIELE : []);
  const [selectedSpieltagId, setSelectedSpieltagId] = useState(DEMO_SPIELTAGE[0]?.id ?? "");
  const [heimvereinId, setHeimvereinId] = useState(DEMO_VEREINE[0]?.id ?? "");
  const [auswaertsvereinId, setAuswaertsvereinId] = useState(DEMO_VEREINE[1]?.id ?? "");
  const [spielStatus, setSpielStatus] = useState<(typeof STATUS_OPTIONS)[number]>("geplant");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!isDemo);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedSpieltag = useMemo(
    () => spieltage.find((spieltag) => spieltag.id === selectedSpieltagId) ?? spieltage[0] ?? null,
    [selectedSpieltagId, spieltage],
  );
  const spieleForSelectedSpieltag = useMemo(
    () =>
      selectedSpieltag ? spiele.filter((spiel) => spiel.spieltagId === selectedSpieltag.id) : [],
    [selectedSpieltag, spiele],
  );

  function resetSpielForm(form: HTMLFormElement) {
    form.reset();
    setHeimvereinId("");
    setAuswaertsvereinId("");
    setSpielStatus("geplant");
  }

  function handleHeimvereinChange(value: string) {
    setHeimvereinId(value);
    const nextHeimverein = findVerein(vereine, value);
    const currentAuswaertsverein = findVerein(vereine, auswaertsvereinId);
    if (
      value &&
      currentAuswaertsverein &&
      (value === auswaertsvereinId ||
        normalizeVereinsname(nextHeimverein?.name ?? "") ===
          normalizeVereinsname(currentAuswaertsverein.name))
    ) {
      setAuswaertsvereinId("");
    }
  }

  function handleAuswaertsvereinChange(value: string) {
    setAuswaertsvereinId(value);
    const nextAuswaertsverein = findVerein(vereine, value);
    const currentHeimverein = findVerein(vereine, heimvereinId);
    if (
      value &&
      currentHeimverein &&
      (value === heimvereinId ||
        normalizeVereinsname(nextAuswaertsverein?.name ?? "") ===
          normalizeVereinsname(currentHeimverein.name))
    ) {
      setHeimvereinId("");
    }
  }

  function handleErgebnisSaved(input: {
    spielId: string;
    ergebnis: { heimtore: number; auswaertstore: number };
  }) {
    setSpiele((current) =>
      current.map((spiel) =>
        spiel.id === input.spielId ? { ...spiel, ergebnis: input.ergebnis } : spiel,
      ),
    );
  }

  useEffect(() => {
    if (isDemo) {
      return;
    }

    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      setMessage(null);

      const ligaResponse = await fetch(`/api/tipprunden/${tipprundeId}/liga`);
      const ligaPayload = (await ligaResponse.json().catch(() => null)) as ApiResponse<{
        liga: Liga | null;
      }> | null;

      if (!isMounted) {
        return;
      }

      if (!ligaResponse.ok) {
        setMessage(ligaPayload?.error?.message ?? "Liga konnte nicht geladen werden.");
        setIsLoading(false);
        return;
      }

      setLiga(ligaPayload?.liga ?? null);

      if (ligaPayload?.liga) {
        await loadSpielplanData();
      }

      if (isMounted) {
        setIsLoading(false);
      }
    }

    async function loadSpielplanData() {
      const [vereineResponse, spieltageResponse, spieleResponse] = await Promise.all([
        fetch(`/api/tipprunden/${tipprundeId}/teams`),
        fetch(`/api/tipprunden/${tipprundeId}/spieltage`),
        fetch(`/api/tipprunden/${tipprundeId}/spiele`),
      ]);

      const [vereinePayload, spieltagePayload, spielePayload] = await Promise.all([
        vereineResponse.json().catch(() => null) as Promise<ApiResponse<{
          vereine: Verein[];
        }> | null>,
        spieltageResponse.json().catch(() => null) as Promise<ApiResponse<{
          spieltage: Spieltag[];
        }> | null>,
        spieleResponse.json().catch(() => null) as Promise<ApiResponse<{ spiele: Spiel[] }> | null>,
      ]);

      if (!isMounted) {
        return;
      }

      if (!vereineResponse.ok || !spieltageResponse.ok || !spieleResponse.ok) {
        setMessage("Spielplan-Daten konnten nicht vollständig geladen werden.");
        return;
      }

      const nextSpieltage = spieltagePayload?.spieltage ?? [];
      setVereine(vereinePayload?.vereine ?? []);
      setSpieltage(nextSpieltage);
      setSpiele(spielePayload?.spiele ?? []);
      setSelectedSpieltagId((current) => current || nextSpieltage[0]?.id || "");
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [isDemo, tipprundeId]);

  async function submitJson<T>(
    url: string,
    options: { method: "POST" | "PATCH" | "DELETE"; body?: Record<string, unknown> },
  ): Promise<ApiResponse<T> | null> {
    setIsSubmitting(true);
    setMessage(null);

    const response = await fetch(url, {
      method: options.method,
      headers: { "Content-Type": "application/json" },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;
    setIsSubmitting(false);

    if (!response.ok) {
      setMessage(payload?.error?.message ?? "Änderung konnte nicht gespeichert werden.");
      return null;
    }

    return payload;
  }

  async function handleCreateLiga(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "");

    if (isDemo) {
      setLiga({ ...DEMO_LIGA, name });
      setMessage("Liga gespeichert.");
      return;
    }

    const payload = await submitJson<{ liga: Liga }>(`/api/tipprunden/${tipprundeId}/liga`, {
      method: "POST",
      body: { name },
    });

    if (payload?.liga) {
      setLiga(payload.liga);
      setMessage("Liga gespeichert. Jetzt kannst du Vereine und Spieltage anlegen.");
      form.reset();
    }
  }

  async function handleCreateVerein(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "");
    const logoUrl = String(formData.get("logoUrl") ?? "");
    const normalizedName = normalizeVereinsname(name);

    if (
      normalizedName &&
      vereine.some((verein) => normalizeVereinsname(verein.name) === normalizedName)
    ) {
      setMessage("Diesen Verein gibt es in dieser Tipprunde bereits.");
      return;
    }

    if (isDemo) {
      const verein = {
        id: `verein-${vereine.length + 1}`,
        tipprundeId,
        name,
        logoUrl: logoUrl || null,
      };
      setVereine((current) => [...current, verein]);
      setMessage("Verein angelegt.");
      form.reset();
      return;
    }

    const payload = await submitJson<{ verein: Verein }>(`/api/tipprunden/${tipprundeId}/teams`, {
      method: "POST",
      body: { name, logoUrl },
    });

    if (payload?.verein) {
      setVereine((current) =>
        [...current, payload.verein].sort((left, right) => left.name.localeCompare(right.name)),
      );
      setMessage("Verein angelegt.");
      form.reset();
    }
  }

  async function handleCreateSpieltag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const abschnitt = String(formData.get("abschnitt") ?? "hinrunde");

    if (isDemo) {
      const nummer =
        Math.max(
          0,
          ...spieltage
            .filter((spieltag) => spieltag.abschnitt === abschnitt)
            .map((spieltag) => spieltag.nummer),
        ) + 1;
      const spieltag = {
        id: `spieltag-${spieltage.length + 1}`,
        tipprundeId,
        name: `${abschnitt === "rueckrunde" ? "Rückrunde" : "Hinrunde"} Spieltag ${nummer}`,
        abschnitt: abschnitt as Spieltag["abschnitt"],
        nummer,
        sortOrder: nummer,
      };
      setSpieltage((current) => [...current, spieltag]);
      setSelectedSpieltagId(spieltag.id);
      setMessage("Spieltag angelegt.");
      return;
    }

    const payload = await submitJson<{ spieltag: Spieltag }>(
      `/api/tipprunden/${tipprundeId}/spieltage`,
      {
        method: "POST",
        body: { abschnitt },
      },
    );

    if (payload?.spieltag) {
      setSpieltage((current) => [...current, payload.spieltag]);
      setSelectedSpieltagId(payload.spieltag.id);
      setMessage("Spieltag angelegt.");
    }
  }

  async function handleCreateSpiel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const body = {
      spieltagId: String(formData.get("spieltagId") ?? ""),
      heimteamId: heimvereinId,
      auswaertsteamId: auswaertsvereinId,
      anstossDatum: String(formData.get("anstossDatum") ?? ""),
      anstossUhrzeit: String(formData.get("anstossUhrzeit") ?? ""),
      status: spielStatus,
    };

    if (!body.heimteamId || !body.auswaertsteamId) {
      setMessage("Bitte wähle Heimverein und Auswärtsverein aus.");
      return;
    }

    if (body.heimteamId === body.auswaertsteamId) {
      setMessage("Heimverein und Auswärtsverein müssen unterschiedlich sein.");
      return;
    }

    const heimverein = findVerein(vereine, body.heimteamId);
    const auswaertsverein = findVerein(vereine, body.auswaertsteamId);
    if (
      heimverein &&
      auswaertsverein &&
      normalizeVereinsname(heimverein.name) === normalizeVereinsname(auswaertsverein.name)
    ) {
      setMessage("Heimverein und Auswärtsverein müssen unterschiedlich sein.");
      return;
    }

    if (isDemo) {
      const spiel = {
        id: `spiel-${spiele.length + 1}`,
        tipprundeId,
        spieltagId: body.spieltagId,
        heimteamId: body.heimteamId,
        auswaertsteamId: body.auswaertsteamId,
        anstosszeit: `${body.anstossDatum}T${body.anstossUhrzeit}:00.000Z`,
        status: body.status as Spiel["status"],
        ergebnis: null,
      };
      setSpiele((current) => [...current, spiel]);
      setMessage("Spiel angelegt.");
      resetSpielForm(form);
      return;
    }

    const payload = await submitJson<{ spiel: Spiel }>(`/api/tipprunden/${tipprundeId}/spiele`, {
      method: "POST",
      body,
    });

    if (payload?.spiel) {
      setSpiele((current) => [...current, payload.spiel]);
      setMessage("Spiel angelegt.");
      resetSpielForm(form);
    }
  }

  return (
    <section className="admin-panel spielplan-admin" aria-labelledby="spielplan-heading">
      <RegisterTipprundeHeaderTitle tipprundeId={tipprundeId} tipprundeName={tipprundeName} />
      <div className="admin-page-header">
        <p className="eyebrow">Tipprunde {tipprundeId}</p>
        <h1 id="spielplan-heading">Spielplan verwalten</h1>
        <p>
          Baue den Spielplan in einer klaren Reihenfolge auf: Liga, Vereine, Spieltage und danach
          die einzelnen Spiele.
        </p>
      </div>

      <StatusMessage message={message} />

      {isLoading ? (
        <section className="admin-action-card">
          <h2>Spielplan wird geladen</h2>
          <p>Die Verwaltungsdaten werden vorbereitet.</p>
        </section>
      ) : null}

      {!isLoading && !liga ? (
        <section className="admin-action-card liga-gate">
          <div className="admin-card-icon">
            <Trophy aria-hidden="true" size={22} />
          </div>
          <h2>Liga</h2>
          <p>Lege zuerst die Liga dieser Tipprunde an. Danach öffnen sich Vereine und Spieltage.</p>
          <form className="stack" onSubmit={handleCreateLiga}>
            <label>
              Liganame
              <input name="name" type="text" placeholder="z. B. A-Klasse Nord" required />
            </label>
            <button type="submit" disabled={isSubmitting}>
              Liga speichern
            </button>
          </form>
        </section>
      ) : null}

      {!isLoading && liga ? (
        <>
          <section className="spielplan-summary" aria-label="Spielplan Übersicht">
            <article className="summary-tile">
              <div className="admin-card-icon">
                <Trophy aria-hidden="true" size={20} />
              </div>
              <div>
                <span>Liga</span>
                <h2>{liga.name}</h2>
              </div>
            </article>
            <article className="summary-tile">
              <div className="admin-card-icon">
                <UsersRound aria-hidden="true" size={20} />
              </div>
              <div>
                <span>Vereine</span>
                <strong>{vereine.length}</strong>
              </div>
            </article>
            <article className="summary-tile">
              <div className="admin-card-icon">
                <CalendarDays aria-hidden="true" size={20} />
              </div>
              <div>
                <span>Spieltage</span>
                <strong>{spieltage.length}</strong>
              </div>
            </article>
            <article className="summary-tile">
              <div className="admin-card-icon">
                <Swords aria-hidden="true" size={20} />
              </div>
              <div>
                <span>Spiele</span>
                <strong>{spiele.length}</strong>
              </div>
            </article>
          </section>

          <div className="spielplan-tabs" role="tablist" aria-label="Spielplanbereiche">
            {[
              { id: "vereine", label: "Vereine", icon: UsersRound },
              { id: "spieltage", label: "Spieltage & Spiele", icon: CalendarDays },
              { id: "ergebnisse", label: "Ergebnisse", icon: ClipboardCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={activeTab === tab.id ? "is-active" : undefined}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                >
                  <Icon aria-hidden="true" size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === "vereine" ? (
            <section className="spielplan-workspace" aria-labelledby="vereine-heading">
              <div className="workspace-main admin-action-card">
                <div className="section-heading-row">
                  <div>
                    <p className="eyebrow">Vereine</p>
                    <h2 id="vereine-heading">Verein anlegen</h2>
                  </div>
                  <div className="admin-card-icon">
                    <Plus aria-hidden="true" size={20} />
                  </div>
                </div>
                <form className="stack" onSubmit={handleCreateVerein}>
                  <label>
                    Vereinsname
                    <input name="name" type="text" placeholder="z. B. FC Hoiz" required />
                  </label>
                  <label>
                    Logo-URL
                    <input name="logoUrl" type="url" placeholder="https://..." />
                  </label>
                  <button type="submit" disabled={isSubmitting}>
                    Verein anlegen
                  </button>
                </form>
              </div>

              <aside className="workspace-side admin-action-card">
                <h2>Vereinsliste</h2>
                {vereine.length ? (
                  <div className="verein-list">
                    {vereine.map((verein) => (
                      <div key={verein.id} className="verein-row">
                        <TeamLogo name={verein.name} logoUrl={verein.logoUrl} />
                        <span>{verein.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Noch keine Vereine angelegt.</p>
                )}
              </aside>
            </section>
          ) : null}

          {activeTab === "spieltage" ? (
            <section className="spielplan-workspace" aria-labelledby="spieltage-heading">
              <div className="workspace-main admin-action-card">
                <div className="section-heading-row">
                  <div>
                    <p className="eyebrow">Spielplan</p>
                    <h2 id="spieltage-heading">Spieltage & Spiele</h2>
                  </div>
                  <div className="admin-card-icon">
                    <Layers3 aria-hidden="true" size={20} />
                  </div>
                </div>

                <form className="inline-creator" onSubmit={handleCreateSpieltag}>
                  <label>
                    Abschnitt
                    <select name="abschnitt" defaultValue="hinrunde">
                      <option value="hinrunde">Hinrunde</option>
                      <option value="rueckrunde">Rückrunde</option>
                    </select>
                  </label>
                  <button type="submit" disabled={isSubmitting}>
                    Nächsten Spieltag anlegen
                  </button>
                </form>

                <div className="spieltag-picker" aria-label="Spieltage">
                  {spieltage.map((spieltag) => (
                    <button
                      key={spieltag.id}
                      type="button"
                      className={selectedSpieltag?.id === spieltag.id ? "is-active" : undefined}
                      onClick={() => setSelectedSpieltagId(spieltag.id)}
                    >
                      <span>{abschnittLabel(spieltag.abschnitt)}</span>
                      <strong>Spieltag {spieltag.nummer}</strong>
                    </button>
                  ))}
                </div>

                {selectedSpieltag && vereine.length >= 2 ? (
                  <form className="spiel-form-grid" onSubmit={handleCreateSpiel}>
                    <input type="hidden" name="spieltagId" value={selectedSpieltag.id} />
                    <VereinSelect
                      id="heimverein"
                      name="heimteamId"
                      label="Heimverein"
                      vereine={vereine}
                      value={heimvereinId}
                      excludedVereinId={auswaertsvereinId}
                      excludedVereinName={findVerein(vereine, auswaertsvereinId)?.name}
                      onChange={handleHeimvereinChange}
                    />
                    <VereinSelect
                      id="auswaertsverein"
                      name="auswaertsteamId"
                      label="Auswärtsverein"
                      vereine={vereine}
                      value={auswaertsvereinId}
                      excludedVereinId={heimvereinId}
                      excludedVereinName={findVerein(vereine, heimvereinId)?.name}
                      onChange={handleAuswaertsvereinChange}
                    />
                    <label>
                      Anpfiff-Datum
                      <input name="anstossDatum" type="date" required />
                    </label>
                    <label>
                      Anpfiff-Uhrzeit
                      <input name="anstossUhrzeit" type="time" required />
                    </label>
                    <label>
                      Status
                      <select
                        name="status"
                        value={spielStatus}
                        onChange={(event) =>
                          setSpielStatus(event.target.value as (typeof STATUS_OPTIONS)[number])
                        }
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button type="submit" disabled={isSubmitting}>
                      Spiel anlegen
                    </button>
                  </form>
                ) : (
                  <div className="empty-state compact-empty">
                    <div className="empty-state-icon">
                      <ShieldCheck aria-hidden="true" size={22} />
                    </div>
                    <p>
                      Lege mindestens zwei Vereine und einen Spieltag an, dann kannst du Spiele
                      erstellen.
                    </p>
                  </div>
                )}
              </div>

              <aside className="workspace-side admin-action-card">
                <h2>Spiele im Spieltag</h2>
                {selectedSpieltag ? <p>{selectedSpieltag.name}</p> : null}
                {spieleForSelectedSpieltag.length ? (
                  <div className="spiel-list">
                    {spieleForSelectedSpieltag.map((spiel) => {
                      const heimverein = findVerein(vereine, spiel.heimteamId);
                      const auswaertsverein = findVerein(vereine, spiel.auswaertsteamId);
                      const spielMitte = getSpielMitte(spiel);
                      return (
                        <div key={spiel.id} className="spiel-row">
                          <div
                            className="spiel-matchup"
                            aria-label={`${heimverein?.name ?? "Heimverein"} gegen ${
                              auswaertsverein?.name ?? "Auswärtsverein"
                            }`}
                          >
                            <span className="sr-only">
                              {heimverein?.name ?? "Heimverein"} gegen{" "}
                              {auswaertsverein?.name ?? "Auswärtsverein"}
                            </span>
                            <span className="spiel-club-logo" aria-hidden="true">
                              <TeamLogo
                                name={heimverein?.name ?? "Heimverein"}
                                logoUrl={heimverein?.logoUrl}
                              />
                            </span>
                            <span
                              className={[
                                "spiel-center",
                                spielMitte.kind === "score" ? "has-score" : "",
                                spielMitte.kind === "live" ? "is-live" : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              aria-hidden="true"
                            >
                              <span>{spielMitte.label}</span>
                              {spielMitte.kind === "live" ? (
                                <span className="live-dot" aria-hidden="true" />
                              ) : null}
                            </span>
                            <span className="spiel-club-logo" aria-hidden="true">
                              <TeamLogo
                                name={auswaertsverein?.name ?? "Auswärtsverein"}
                                logoUrl={auswaertsverein?.logoUrl}
                              />
                            </span>
                          </div>
                          <small className="sr-only">
                            {formatAnpfiff(spiel.anstosszeit)} · {spiel.status}
                          </small>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p>Noch keine Spiele für diesen Spieltag.</p>
                )}
              </aside>
            </section>
          ) : null}

          {activeTab === "ergebnisse" ? (
            <section className="spielplan-workspace" aria-labelledby="ergebnisse-heading">
              <div className="workspace-main admin-action-card">
                <div className="section-heading-row">
                  <div>
                    <p className="eyebrow">Ergebnisse</p>
                    <h2 id="ergebnisse-heading">Ergebnisse</h2>
                  </div>
                  <div className="admin-card-icon">
                    <ClipboardCheck aria-hidden="true" size={20} />
                  </div>
                </div>
                <ErgebnisForm
                  tipprundeId={tipprundeId}
                  spieltage={spieltage}
                  spiele={spiele}
                  vereine={vereine}
                  onErgebnisSaved={handleErgebnisSaved}
                />
              </div>
              <aside className="workspace-side admin-action-card">
                <h2>Hinweis</h2>
                <p>
                  Ergebnisse pflegst du bewusst getrennt vom Spielplan. Nach Änderungen werden
                  Punktewertungen automatisch neu berechnet.
                </p>
              </aside>
            </section>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
