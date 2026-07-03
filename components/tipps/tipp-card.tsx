"use client";

import { useState, type FormEvent } from "react";

import type { SpielTippView } from "@/lib/domain/spieltag-view-service";

type TippCardProps = {
  tipprundeId: string;
  spiel: SpielTippView;
};

function formatAnstosszeit(value: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function TippCard({ tipprundeId, spiel }: TippCardProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const response = await fetch(`/api/tipprunden/${tipprundeId}/spiele/${spiel.id}/tipp`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        heimtoreTipp: Number(formData.get("heimtoreTipp")),
        auswaertstoreTipp: Number(formData.get("auswaertstoreTipp")),
      }),
    });
    const payload = (await response.json().catch(() => null)) as {
      error?: { message: string };
    } | null;

    setIsSubmitting(false);

    if (!response.ok) {
      setMessage(payload?.error?.message ?? "Tipp konnte nicht gespeichert werden.");
      return;
    }

    setMessage("Tipp gespeichert.");
  }

  return (
    <article className="tipp-card" data-testid={`tipp-card-${spiel.id}`}>
      <header className="tipp-card-header">
        <div>
          <p className="eyebrow">{formatAnstosszeit(spiel.anstosszeit)}</p>
          <h2>
            {spiel.heimteamName} - {spiel.auswaertsteamName}
          </h2>
        </div>
        <span className={spiel.istTippbar ? "status-open" : "status-locked"}>
          {spiel.istTippbar ? "Offen" : "Gesperrt"}
        </span>
      </header>

      <form className="tipp-form" onSubmit={handleSubmit}>
        <label>
          Heimtore
          <input
            name="heimtoreTipp"
            type="number"
            min={0}
            defaultValue={spiel.eigenerTipp?.heimtoreTipp ?? ""}
            disabled={!spiel.istTippbar || isSubmitting}
            inputMode="numeric"
          />
        </label>
        <label>
          Auswaertstore
          <input
            name="auswaertstoreTipp"
            type="number"
            min={0}
            defaultValue={spiel.eigenerTipp?.auswaertstoreTipp ?? ""}
            disabled={!spiel.istTippbar || isSubmitting}
            inputMode="numeric"
          />
        </label>
        <button type="submit" disabled={!spiel.istTippbar || isSubmitting}>
          Tipp speichern
        </button>
      </form>

      {spiel.eigenerTipp ? (
        <p>
          Dein Tipp: {spiel.eigenerTipp.heimtoreTipp}:{spiel.eigenerTipp.auswaertstoreTipp}
        </p>
      ) : null}
      {spiel.fremdeTippsSichtbar ? (
        <p>{spiel.fremdeTipps.length} fremde Tipps sichtbar.</p>
      ) : (
        <p>Fremde Tipps bis zur Tippfrist verborgen.</p>
      )}
      {message ? <p role="status">{message}</p> : null}
    </article>
  );
}
