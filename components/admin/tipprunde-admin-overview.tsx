"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, CalendarPlus, ShieldCheck, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { EinladungPanel } from "@/components/admin/einladung-panel";
import { RegisterTipprundeHeaderTitle } from "@/components/navigation/global-topbar";
import { Feedback, PageHeader } from "@/components/ui/primitives";
import { clearActiveTipprundeId } from "@/lib/domain/active-tipprunde";

type TipprundeAdminOverviewProps = {
  tipprundeId: string;
  tipprundeName: string;
};

type AdminMessage = { kind: "success" | "error"; text: string };

export function TipprundeAdminOverview({
  tipprundeId,
  tipprundeName,
}: TipprundeAdminOverviewProps) {
  const router = useRouter();
  const [message, setMessage] = useState<AdminMessage | null>(null);
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
      setMessage({
        kind: "error",
        text: payload?.error?.message ?? "Aktion konnte nicht ausgeführt werden.",
      });
      return false;
    }

    setMessage({ kind: "success", text: "Änderung gespeichert." });
    return true;
  }

  async function handleArchive() {
    await submitJson(`/api/tipprunden/${tipprundeId}/archive`, { method: "POST" });
  }

  async function handleDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const success = await submitJson(`/api/tipprunden/${tipprundeId}`, {
      method: "DELETE",
      body: { confirmation: String(formData.get("confirmation") ?? "") },
    });

    if (success) {
      clearActiveTipprundeId();
      router.push("/");
      router.refresh();
    }
  }

  async function handleRoleChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nutzerId = String(formData.get("nutzerId") ?? "").trim();
    if (!nutzerId) {
      setMessage({ kind: "error", text: "Bitte gib die Nutzer-ID des Mitglieds ein." });
      return;
    }

    await submitJson(`/api/tipprunden/${tipprundeId}/members/${nutzerId}/role`, {
      method: "POST",
      body: { rolle: String(formData.get("rolle") ?? "nutzer") },
    });
  }

  return (
    <section className="admin-panel" aria-labelledby="tipprunde-admin-heading">
      <RegisterTipprundeHeaderTitle tipprundeId={tipprundeId} tipprundeName={tipprundeName} />
      <PageHeader
        eyebrow={tipprundeName}
        title="Tipprunde verwalten"
        description="Spielbetrieb, Mitglieder und Einladungen an einem Ort organisieren."
        headingId="tipprunde-admin-heading"
      />
      {message ? <Feedback kind={message.kind}>{message.text}</Feedback> : null}
      <div className="admin-actions tipprunde-admin-actions">
        <section className="admin-action-card primary-card admin-card-feature">
          <div className="admin-card-icon">
            <CalendarPlus aria-hidden="true" size={22} />
          </div>
          <h2>Spielplan</h2>
          <p>
            Teams, Spieltage, Spiele, Logos und Ergebnisse pflegen. Das ist der wichtigste
            Arbeitsbereich für Admins.
          </p>
          <Link className="button-link" href={`/admin/tipprunden/${tipprundeId}/spielplan`}>
            Spielplan verwalten
          </Link>
        </section>
        <EinladungPanel tipprundeId={tipprundeId} className="admin-card-invite" />
        <section className="admin-action-card admin-card-side">
          <div className="admin-card-icon">
            <ShieldCheck aria-hidden="true" size={22} />
          </div>
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
        <section className="admin-danger-zone" aria-labelledby="danger-zone-heading">
          <header>
            <p className="eyebrow">Sensible Aktionen</p>
            <h2 id="danger-zone-heading">Deaktivieren oder löschen</h2>
          </header>
          <div className="admin-danger-actions">
            <section className="admin-action-card admin-card-compact admin-card-archive">
              <div className="admin-card-icon">
                <Archive aria-hidden="true" size={22} />
              </div>
              <h2>Archivieren</h2>
              <p>Tipprunde für normale Nutzung deaktivieren.</p>
              <button
                type="button"
                onClick={handleArchive}
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                Archivieren
              </button>
            </section>
            <section className="admin-action-card danger-card admin-card-compact">
              <div className="admin-card-icon">
                <Trash2 aria-hidden="true" size={22} />
              </div>
              <h2>Endgültig löschen</h2>
              <p>Nur mit Sicherheitsprüfung und Besitzer/Admin-Rechten.</p>
              <form className="stack" onSubmit={handleDelete}>
                <label>
                  Tipprunden-Namen zur Sicherheitsprüfung
                  <input name="confirmation" type="text" required />
                </label>
                <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
                  Endgültig löschen
                </button>
              </form>
            </section>
          </div>
        </section>
      </div>
    </section>
  );
}
