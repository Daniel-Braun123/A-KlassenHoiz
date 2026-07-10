"use client";

import { Link2 } from "lucide-react";
import { useState } from "react";

import { EinladungQrCode } from "@/components/admin/einladung-qr-code";
import { Feedback } from "@/components/ui/primitives";

type EinladungPanelProps = {
  tipprundeId: string;
  className?: string;
};

type EinladungResponse =
  | {
      einladungslink: string;
      einladung: {
        expiresAt: string;
      };
    }
  | {
      error: {
        message: string;
      };
    };

export function EinladungPanel({ tipprundeId, className }: EinladungPanelProps) {
  const [einladungslink, setEinladungslink] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageKind, setMessageKind] = useState<"success" | "error">("success");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreateEinladung() {
    setIsSubmitting(true);
    setMessage(null);

    const response = await fetch(`/api/tipprunden/${tipprundeId}/einladung`, {
      method: "POST",
    });
    const payload = (await response.json().catch(() => null)) as EinladungResponse | null;

    setIsSubmitting(false);

    if (!response.ok || !payload || "error" in payload) {
      setMessageKind("error");
      setMessage(
        payload && "error" in payload
          ? payload.error.message
          : "Einladungslink konnte nicht erstellt werden.",
      );
      return;
    }

    setEinladungslink(payload.einladungslink);
    setExpiresAt(payload.einladung.expiresAt);
    setMessageKind("success");
    setMessage("Neuer Einladungslink ist aktiv. Der alte Link ist ungültig.");
  }

  return (
    <section className={["admin-action-card", className].filter(Boolean).join(" ")}>
      <div className="admin-card-icon">
        <Link2 aria-hidden="true" size={22} />
      </div>
      <h2>Einladungslink</h2>
      <p>Es ist immer nur ein Link aktiv. Ein neuer Link ersetzt den bisherigen Link.</p>
      <button
        type="button"
        onClick={handleCreateEinladung}
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? "Link generieren..." : "Neuen Link generieren"}
      </button>
      {message ? <Feedback kind={messageKind}>{message}</Feedback> : null}
      {einladungslink ? (
        <div className="link-box">
          <label>
            Aktiver Einladungslink
            <input readOnly value={einladungslink} />
          </label>
          {expiresAt ? <p>Gültig bis {new Date(expiresAt).toLocaleString("de-DE")}.</p> : null}
        </div>
      ) : null}
      <EinladungQrCode einladungslink={einladungslink} />
    </section>
  );
}
