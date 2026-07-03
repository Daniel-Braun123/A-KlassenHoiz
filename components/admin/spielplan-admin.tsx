"use client";

import { useState, type FormEvent } from "react";

import { TeamLogo } from "@/components/admin/team-logo";
import { SPIEL_STATUS, SPIELTAG_ABSCHNITT } from "@/lib/domain/constants";

type SpielplanAdminProps = {
  tipprundeId: string;
};

type ApiResponse = { error?: { message: string } };

export function SpielplanAdmin({ tipprundeId }: SpielplanAdminProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitJson(
    url: string,
    options: { method: "POST" | "PATCH" | "DELETE"; body?: Record<string, unknown> },
  ) {
    setIsSubmitting(true);
    setMessage(null);

    const response = await fetch(url, {
      method: options.method,
      headers: { "Content-Type": "application/json" },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const payload = (await response.json().catch(() => null)) as ApiResponse | null;
    setIsSubmitting(false);

    if (!response.ok) {
      setMessage(payload?.error?.message ?? "Aenderung konnte nicht gespeichert werden.");
      return;
    }

    setMessage("Aenderung gespeichert.");
  }

  async function handleCreateTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await submitJson(`/api/tipprunden/${tipprundeId}/teams`, {
      method: "POST",
      body: {
        name: String(formData.get("name") ?? ""),
        logoUrl: String(formData.get("logoUrl") ?? ""),
      },
    });
  }

  async function handleUpdateTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const teamId = String(formData.get("teamId") ?? "").trim();
    if (!teamId) {
      setMessage("Bitte gib eine Team-ID ein.");
      return;
    }

    await submitJson(`/api/tipprunden/${tipprundeId}/teams/${teamId}`, {
      method: "PATCH",
      body: {
        name: String(formData.get("name") ?? ""),
        logoUrl: String(formData.get("logoUrl") ?? ""),
      },
    });
  }

  async function handleDeleteTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const teamId = String(new FormData(event.currentTarget).get("teamId") ?? "").trim();
    if (!teamId) {
      setMessage("Bitte gib eine Team-ID ein.");
      return;
    }

    await submitJson(`/api/tipprunden/${tipprundeId}/teams/${teamId}`, { method: "DELETE" });
  }

  async function handleCreateSpieltag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await submitJson(`/api/tipprunden/${tipprundeId}/spieltage`, {
      method: "POST",
      body: {
        name: String(formData.get("name") ?? ""),
        abschnitt: String(formData.get("abschnitt") ?? "frei"),
        sortOrder: Number(formData.get("sortOrder") ?? 0),
      },
    });
  }

  async function handleUpdateSpieltag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const spieltagId = String(formData.get("spieltagId") ?? "").trim();
    if (!spieltagId) {
      setMessage("Bitte gib eine Spieltag-ID ein.");
      return;
    }

    await submitJson(`/api/tipprunden/${tipprundeId}/spieltage/${spieltagId}`, {
      method: "PATCH",
      body: {
        name: String(formData.get("name") ?? ""),
        abschnitt: String(formData.get("abschnitt") ?? "frei"),
        sortOrder: Number(formData.get("sortOrder") ?? 0),
      },
    });
  }

  async function handleDeleteSpieltag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const spieltagId = String(new FormData(event.currentTarget).get("spieltagId") ?? "").trim();
    if (!spieltagId) {
      setMessage("Bitte gib eine Spieltag-ID ein.");
      return;
    }

    await submitJson(`/api/tipprunden/${tipprundeId}/spieltage/${spieltagId}`, {
      method: "DELETE",
    });
  }

  async function handleCreateSpiel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await submitJson(`/api/tipprunden/${tipprundeId}/spiele`, {
      method: "POST",
      body: {
        spieltagId: String(formData.get("spieltagId") ?? ""),
        heimteamId: String(formData.get("heimteamId") ?? ""),
        auswaertsteamId: String(formData.get("auswaertsteamId") ?? ""),
        anstossDatum: String(formData.get("anstossDatum") ?? ""),
        anstossUhrzeit: String(formData.get("anstossUhrzeit") ?? ""),
        status: String(formData.get("status") ?? "geplant"),
      },
    });
  }

  async function handleUpdateSpiel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const spielId = String(formData.get("spielId") ?? "").trim();
    if (!spielId) {
      setMessage("Bitte gib eine Spiel-ID ein.");
      return;
    }

    await submitJson(`/api/tipprunden/${tipprundeId}/spiele/${spielId}`, {
      method: "PATCH",
      body: {
        spieltagId: String(formData.get("spieltagId") ?? ""),
        heimteamId: String(formData.get("heimteamId") ?? ""),
        auswaertsteamId: String(formData.get("auswaertsteamId") ?? ""),
        anstossDatum: String(formData.get("anstossDatum") ?? ""),
        anstossUhrzeit: String(formData.get("anstossUhrzeit") ?? ""),
        status: String(formData.get("status") ?? "geplant"),
      },
    });
  }

  async function handleDeleteSpiel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const spielId = String(new FormData(event.currentTarget).get("spielId") ?? "").trim();
    if (!spielId) {
      setMessage("Bitte gib eine Spiel-ID ein.");
      return;
    }

    await submitJson(`/api/tipprunden/${tipprundeId}/spiele/${spielId}`, { method: "DELETE" });
  }

  return (
    <section className="admin-panel" aria-labelledby="spielplan-heading">
      <p className="eyebrow">Tipprunde {tipprundeId}</p>
      <h1 id="spielplan-heading">Spielplan verwalten</h1>
      {message ? <p role="status">{message}</p> : null}

      <div className="admin-actions">
        <section>
          <h2>Teams/Vereine</h2>
          <div className="logo-preview">
            <TeamLogo name="AK" logoUrl={null} />
            <span>Fallback-Logo</span>
          </div>
          <form className="stack" onSubmit={handleCreateTeam}>
            <label>
              Teamname
              <input name="name" type="text" required />
            </label>
            <label>
              Logo-URL
              <input name="logoUrl" type="url" />
            </label>
            <button type="submit" disabled={isSubmitting}>
              Team anlegen
            </button>
          </form>
          <form className="stack compact-form" onSubmit={handleUpdateTeam}>
            <label>
              Team-ID bearbeiten
              <input name="teamId" type="text" />
            </label>
            <label>
              Teamname bearbeiten
              <input name="name" type="text" />
            </label>
            <label>
              Logo-URL bearbeiten
              <input name="logoUrl" type="url" />
            </label>
            <button type="submit" disabled={isSubmitting}>
              Team speichern
            </button>
          </form>
          <form className="inline-form" onSubmit={handleDeleteTeam}>
            <label>
              Team-ID loeschen
              <input name="teamId" type="text" />
            </label>
            <button type="submit" disabled={isSubmitting}>
              Team loeschen
            </button>
          </form>
        </section>

        <section>
          <h2>Spieltage</h2>
          <form className="stack" onSubmit={handleCreateSpieltag}>
            <label>
              Spieltag-Name
              <input name="name" type="text" required />
            </label>
            <label>
              Abschnitt
              <select name="abschnitt" defaultValue="hinrunde">
                {SPIELTAG_ABSCHNITT.map((abschnitt) => (
                  <option key={abschnitt} value={abschnitt}>
                    {abschnitt === "hinrunde"
                      ? "Hinrunde"
                      : abschnitt === "rueckrunde"
                        ? "Rueckrunde"
                        : abschnitt === "nachholspiele"
                          ? "Nachholspiele"
                          : "Frei"}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Sortierung
              <input name="sortOrder" type="number" defaultValue={1} />
            </label>
            <button type="submit" disabled={isSubmitting}>
              Spieltag anlegen
            </button>
          </form>
          <form className="stack compact-form" onSubmit={handleUpdateSpieltag}>
            <label>
              Spieltag-ID bearbeiten
              <input name="spieltagId" type="text" />
            </label>
            <label>
              Spieltag-Name bearbeiten
              <input name="name" type="text" />
            </label>
            <label>
              Abschnitt bearbeiten
              <select name="abschnitt" defaultValue="nachholspiele">
                {SPIELTAG_ABSCHNITT.map((abschnitt) => (
                  <option key={abschnitt} value={abschnitt}>
                    {abschnitt}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Sortierung bearbeiten
              <input name="sortOrder" type="number" defaultValue={99} />
            </label>
            <button type="submit" disabled={isSubmitting}>
              Spieltag speichern
            </button>
          </form>
          <form className="inline-form" onSubmit={handleDeleteSpieltag}>
            <label>
              Spieltag-ID loeschen
              <input name="spieltagId" type="text" />
            </label>
            <button type="submit" disabled={isSubmitting}>
              Spieltag loeschen
            </button>
          </form>
        </section>

        <section>
          <h2>Spiele</h2>
          <form className="stack" onSubmit={handleCreateSpiel}>
            <label>
              Spieltag-ID fuer Spiel
              <input name="spieltagId" type="text" required />
            </label>
            <label>
              Heimteam-ID fuer Spiel
              <input name="heimteamId" type="text" required />
            </label>
            <label>
              Auswaertsteam-ID fuer Spiel
              <input name="auswaertsteamId" type="text" required />
            </label>
            <label>
              Anstossdatum fuer Spiel
              <input name="anstossDatum" type="date" required />
            </label>
            <label>
              Anstosszeit fuer Spiel
              <input name="anstossUhrzeit" type="time" required />
            </label>
            <label>
              Status fuer Spiel
              <select name="status" defaultValue="geplant">
                {SPIEL_STATUS.map((status) => (
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
          <form className="stack compact-form" onSubmit={handleUpdateSpiel}>
            <label>
              Spiel-ID bearbeiten
              <input name="spielId" type="text" />
            </label>
            <label>
              Spieltag-ID bearbeiten
              <input name="spieltagId" type="text" />
            </label>
            <label>
              Heimteam-ID bearbeiten
              <input name="heimteamId" type="text" />
            </label>
            <label>
              Auswaertsteam-ID bearbeiten
              <input name="auswaertsteamId" type="text" />
            </label>
            <label>
              Anstossdatum bearbeiten
              <input name="anstossDatum" type="date" />
            </label>
            <label>
              Anstosszeit bearbeiten
              <input name="anstossUhrzeit" type="time" />
            </label>
            <label>
              Status bearbeiten
              <select name="status" defaultValue="verschoben">
                {SPIEL_STATUS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" disabled={isSubmitting}>
              Spiel speichern
            </button>
          </form>
          <form className="inline-form" onSubmit={handleDeleteSpiel}>
            <label>
              Spiel-ID loeschen
              <input name="spielId" type="text" />
            </label>
            <button type="submit" disabled={isSubmitting}>
              Spiel loeschen
            </button>
          </form>
        </section>
      </div>
    </section>
  );
}
