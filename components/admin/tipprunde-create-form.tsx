"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Feedback } from "@/components/ui/primitives";

export function TipprundeCreateForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/tipprunden", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(formData.get("name") ?? ""),
        tipprundenNickname: String(formData.get("tipprundenNickname") ?? ""),
      }),
    });
    const payload = (await response.json().catch(() => null)) as
      { tipprunde?: { id: string } } | { error?: { message: string } } | null;

    setIsSubmitting(false);

    if (!response.ok || !payload || !("tipprunde" in payload) || !payload.tipprunde) {
      setMessage(
        payload && "error" in payload && payload.error
          ? payload.error.message
          : "Tipprunde konnte nicht erstellt werden.",
      );
      return;
    }

    router.push(`/admin/tipprunden/${payload.tipprunde.id}`);
    router.refresh();
  }

  return (
    <form className="stack create-tipprunde-form" onSubmit={handleSubmit}>
      <label>
        Tipprunden-Name
        <input name="name" type="text" placeholder="z. B. A-Klasse Nord 2026" required />
      </label>
      <label>
        Anzeigename in der Tipprunde
        <input
          name="tipprundenNickname"
          type="text"
          autoComplete="nickname"
          placeholder="z. B. Coach Tom"
        />
      </label>
      <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
        {isSubmitting ? "Erstellen..." : "Tipprunde erstellen"}
      </button>
      {message ? <Feedback kind="error">{message}</Feedback> : null}
    </form>
  );
}
