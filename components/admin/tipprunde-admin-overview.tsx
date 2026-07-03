"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { EinladungPanel } from "@/components/admin/einladung-panel";

type TipprundeAdminOverviewProps = {
  tipprundeId: string;
};

export function TipprundeAdminOverview({ tipprundeId }: TipprundeAdminOverviewProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitJson(
    url: string,
    options: { method: "POST" | "DELETE"; body?: Record<string, string> },
  ) {
    setIsSubmitting(true);
    setMessage(null);

    const response = await fetch(url, {
      method: options.method,
      headers: { "Content-Type": "application/json" },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const payload = (await response.json().catch(() => null)) as {
      error?: { message: string };
    } | null;

    setIsSubmitting(false);

    if (!response.ok) {
      setMessage(payload?.error?.message ?? "Aktion konnte nicht ausgefuehrt werden.");
      return false;
    }

    setMessage("Aenderung gespeichert.");
    return true;
  }

  async function handleArchive() {
    await submitJson(`/api/tipprunden/${tipprundeId}/archive`, { method: "POST" });
  }

  async function handleDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await submitJson(`/api/tipprunden/${tipprundeId}`, {
      method: "DELETE",
      body: { confirmation: String(formData.get("confirmation") ?? "") },
    });
  }

  async function handleRoleChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nutzerId = String(formData.get("nutzerId") ?? "").trim();
    if (!nutzerId) {
      setMessage("Bitte gib die Nutzer-ID des Mitglieds ein.");
      return;
    }

    await submitJson(`/api/tipprunden/${tipprundeId}/members/${nutzerId}/role`, {
      method: "POST",
      body: { rolle: String(formData.get("rolle") ?? "nutzer") },
    });
  }

  return (
    <section className="admin-panel" aria-labelledby="tipprunde-admin-heading">
      <p className="eyebrow">Tipprunde {tipprundeId}</p>
      <h1 id="tipprunde-admin-heading">Tipprunde verwalten</h1>
      {message ? <p role="status">{message}</p> : null}
      <div className="admin-actions">
        <section>
          <h2>Grunddaten</h2>
          <p>Tipprunden-Name, Status und Besitzerrechte verwalten.</p>
        </section>
        <section>
          <h2>Spielplan</h2>
          <p>Teams, Spieltage, Spiele, Logos und Ergebnisse verwalten.</p>
          <Link className="button-link" href={`/admin/tipprunden/${tipprundeId}/spielplan`}>
            Spielplan verwalten
          </Link>
        </section>
        <EinladungPanel tipprundeId={tipprundeId} />
        <section>
          <h2>Co-Admins</h2>
          <p>Mitglieder zu Co-Admins ernennen oder Co-Admin-Rechte entfernen.</p>
          <form className="stack" onSubmit={handleRoleChange}>
            <label>
              Nutzer-ID
              <input name="nutzerId" type="text" required />
            </label>
            <label>
              Rolle
              <select name="rolle" defaultValue="co_admin">
                <option value="co_admin">Co-Admin</option>
                <option value="nutzer">Nutzer</option>
              </select>
            </label>
            <button type="submit" disabled={isSubmitting}>
              Rolle speichern
            </button>
          </form>
        </section>
        <section>
          <h2>Archivieren</h2>
          <p>Tipprunde fuer normale Nutzung deaktivieren.</p>
          <button type="button" onClick={handleArchive} disabled={isSubmitting}>
            Archivieren
          </button>
        </section>
        <section>
          <h2>Endgueltig loeschen</h2>
          <p>Nur mit Sicherheitspruefung und Besitzer/Admin-Rechten.</p>
          <form className="stack" onSubmit={handleDelete}>
            <label>
              Tipprunden-Namen zur Sicherheitspruefung
              <input name="confirmation" type="text" required />
            </label>
            <button type="submit" disabled={isSubmitting}>
              Endgueltig loeschen
            </button>
          </form>
        </section>
      </div>
    </section>
  );
}
