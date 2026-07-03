"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type EinladungJoinFormProps = {
  token: string;
};

type JoinResponse =
  | {
      membership: {
        tipprundeId: string;
      };
    }
  | {
      error: {
        message: string;
      };
    };

export function EinladungJoinForm({ token }: EinladungJoinFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const response = await fetch(`/api/einladungen/${token}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipprundenNickname: String(formData.get("tipprundenNickname") ?? ""),
      }),
    });
    const payload = (await response.json().catch(() => null)) as JoinResponse | null;

    setIsSubmitting(false);

    if (!response.ok || !payload || "error" in payload) {
      setMessage(
        payload && "error" in payload
          ? payload.error.message
          : "Beitritt zur Tipprunde konnte nicht abgeschlossen werden.",
      );
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <label>
        Tipprunden-Nickname
        <input name="tipprundenNickname" type="text" autoComplete="nickname" required />
      </label>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Beitreten..." : "Beitreten"}
      </button>
      {message ? <p role="alert">{message}</p> : null}
    </form>
  );
}
