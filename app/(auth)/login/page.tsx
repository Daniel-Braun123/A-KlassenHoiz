import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="login-heading">
        <h1 id="login-heading">Anmelden</h1>
        <LoginForm />
        <p>
          Noch kein Konto? <Link href="/register">Registrieren</Link>
        </p>
      </section>
    </main>
  );
}
