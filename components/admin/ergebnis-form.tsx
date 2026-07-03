"use client";

import { useState, type FormEvent } from "react";

import { ErgebnisStatus } from "@/components/tipps/ergebnis-status";

type ErgebnisFormProps = {
  tipprundeId: string;
};

type ApiResponse = { error?: { message: string } };

export function ErgebnisForm({ tipprundeId }: ErgebnisFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const spielId = String(formData.get("spielId") ?? "").trim();
    if (!spielId) {
      setIsSubmitting(false);
      setMessage("Bitte gib eine Spiel-ID ein.");
      return;
    }

    const response = await fetch(`/api/tipprunden/${tipprundeId}/spiele/${spielId}/ergebnis`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        heimtore: Number(formData.get("heimtore")),
        auswaertstore: Number(formData.get("auswaertstore")),
        reason: String(formData.get("reason") ?? ""),
      }),
    });
    const payload = (await response.json().catch(() => null)) as ApiResponse | null;
    setIsSubmitting(false);

    if (!response.ok) {
      setMessage(payload?.error?.message ?? "Ergebnis konnte nicht gespeichert werden.");
      return;
    }

    setMessage("Ergebnis gespeichert und Punkte neu berechnet.");
  }

  return (
    <div>
      <h2>Ergebnisse</h2>
      <ErgebnisStatus isChanged />
      <form className="stack compact-form" onSubmit={handleSubmit}>
        <label>
          Spiel-ID für Ergebnis
          <input name="spielId" type="text" required />
        </label>
        <label>
          Heimtore Ergebnis
          <input name="heimtore" type="number" min={0} required />
        </label>
        <label>
          Auswärtstore Ergebnis
          <input name="auswaertstore" type="number" min={0} required />
        </label>
        <label>
          Änderungsgrund
          <input name="reason" type="text" />
        </label>
        <button type="submit" disabled={isSubmitting}>
          Ergebnis speichern
        </button>
      </form>
      {message ? <p role="status">{message}</p> : null}
    </div>
  );
}
