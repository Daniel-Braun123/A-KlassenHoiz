"use client";

import { Save } from "lucide-react";
import { useState, type FormEvent } from "react";

import { TeamLogo } from "@/components/admin/team-logo";
import type { SpielTippView } from "@/lib/domain/spieltag-view-service";
import { calculatePunkte } from "@/lib/scoring/calculate-punkte";

type TippCardProps = {
  tipprundeId: string;
  spiel: SpielTippView;
};

function formatAnstossUhrzeit(value: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatAnstossDatum(value: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

function getSpielCenter(spiel: SpielTippView) {
  if (spiel.istLive) {
    return { kind: "live" as const, label: "LIVE" };
  }

  if (spiel.ergebnis) {
    return {
      kind: "score" as const,
      label: `${spiel.ergebnis.heimtore} : ${spiel.ergebnis.auswaertstore}`,
    };
  }

  if (spiel.ergebnisAusstehend) {
    return { kind: "pending" as const, label: "Spiel vorbei", detail: "Ergebnis lädt" };
  }

  return { kind: "time" as const, label: formatAnstossUhrzeit(spiel.anstosszeit) };
}

function getTippStatus(
  spiel: SpielTippView,
): { kind: "points" | "forgotten" | "empty"; label: string } {
  if (spiel.eigenerTipp && spiel.ergebnis) {
    const result = calculatePunkte(
      {
        heimtore: spiel.ergebnis.heimtore,
        auswaertstore: spiel.ergebnis.auswaertstore,
      },
      {
        heimtore: spiel.eigenerTipp.heimtoreTipp,
        auswaertstore: spiel.eigenerTipp.auswaertstoreTipp,
      },
    );

    return { kind: "points", label: `+${result.punkte}` };
  }

  if (!spiel.eigenerTipp && !spiel.istTippbar) {
    return { kind: "forgotten", label: "Tipp vergessen" };
  }

  return { kind: "empty", label: "" };
}

export function TippCard({ tipprundeId, spiel }: TippCardProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const center = getSpielCenter(spiel);
  const tippStatus = getTippStatus(spiel);

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

    setMessage("Gespeichert.");
  }

  return (
    <article className="tipp-card compact-tipp-card" data-testid={`tipp-card-${spiel.id}`}>
      <div
        className="tipp-matchup"
        aria-label={`${spiel.heimteamName} gegen ${spiel.auswaertsteamName}`}
      >
        <span className="tipp-team tipp-team-home">
          <span className="tipp-team-name">{spiel.heimteamName}</span>
          <span className="tipp-team-logo" aria-hidden="true">
            <TeamLogo name={spiel.heimteamName} logoUrl={spiel.heimteamLogoUrl} />
          </span>
        </span>
        <span className="tipp-center-wrap">
          <span
            className={[
              "tipp-center",
              center.kind === "score" ? "has-score" : "",
              center.kind === "live" ? "is-live" : "",
              center.kind === "pending" ? "is-pending" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label={
              center.kind === "live"
                ? "Live"
                : center.kind === "pending"
                  ? `${center.label}, ${center.detail}`
                  : center.label
            }
          >
            <span>{center.label}</span>
            {center.kind === "live" ? <span className="live-dot" aria-hidden="true" /> : null}
            {center.kind === "pending" ? (
              <span className="tipp-center-detail">{center.detail}</span>
            ) : null}
          </span>
          <span className="tipp-date">{formatAnstossDatum(spiel.anstosszeit)}</span>
        </span>
        <span className="tipp-team tipp-team-away">
          <span className="tipp-team-logo" aria-hidden="true">
            <TeamLogo name={spiel.auswaertsteamName} logoUrl={spiel.auswaertsteamLogoUrl} />
          </span>
          <span className="tipp-team-name">{spiel.auswaertsteamName}</span>
        </span>
      </div>

      <form className="compact-tipp-form" onSubmit={handleSubmit}>
        <span className="tipp-form-label">Dein Tipp</span>
        <label>
          <span className="sr-only">Heimtore</span>
          <input
            name="heimtoreTipp"
            type="number"
            min={0}
            placeholder="0"
            defaultValue={spiel.eigenerTipp?.heimtoreTipp ?? ""}
            disabled={!spiel.istTippbar || isSubmitting}
            inputMode="numeric"
            aria-label="Heimtore"
          />
        </label>
        <span aria-hidden="true" className="tipp-separator">
          :
        </span>
        <label>
          <span className="sr-only">Auswärtstore</span>
          <input
            name="auswaertstoreTipp"
            type="number"
            min={0}
            placeholder="0"
            defaultValue={spiel.eigenerTipp?.auswaertstoreTipp ?? ""}
            disabled={!spiel.istTippbar || isSubmitting}
            inputMode="numeric"
            aria-label="Auswärtstore"
          />
        </label>
        <span
          className={[
            "tipp-status-badge",
            tippStatus.kind === "points" ? "has-points" : "",
            tippStatus.kind === "forgotten" ? "is-forgotten" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-label={tippStatus.label || undefined}
        >
          {tippStatus.label}
        </span>
        <button
          type="submit"
          disabled={!spiel.istTippbar || isSubmitting}
          aria-label="Tipp speichern"
        >
          <Save aria-hidden="true" size={17} />
          <span className="sr-only">Speichern</span>
        </button>
      </form>

      {message ? <p role="status">{message}</p> : null}
    </article>
  );
}
