import Link from "next/link";

import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="register-heading">
        <h1 id="register-heading">Registrieren</h1>
        <RegisterForm />
        <p>
          Schon registriert? <Link href="/login">Anmelden</Link>
        </p>
      </section>
    </main>
  );
}
