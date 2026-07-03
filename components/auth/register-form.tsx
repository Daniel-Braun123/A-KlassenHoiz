"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const anzeigename = String(formData.get("anzeigename") ?? "").trim();
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { anzeigename },
      },
    });

    setIsSubmitting(false);

    if (error) {
      setMessage("Registrierung fehlgeschlagen. Bitte prüfe deine Angaben.");
      return;
    }

    if (!data.session) {
      setMessage("Registrierung erstellt. Bitte prüfe deine E-Mail zur Bestätigung.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <label>
        Anzeigename
        <input name="anzeigename" type="text" autoComplete="nickname" required />
      </label>
      <label>
        E-Mail
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Passwort
        <input name="password" type="password" autoComplete="new-password" required minLength={8} />
      </label>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Konto erstellen..." : "Konto erstellen"}
      </button>
      {message ? <p role="alert">{message}</p> : null}
    </form>
  );
}
