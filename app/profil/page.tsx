import Link from "next/link";

import { requireAuthenticatedProfile } from "@/lib/auth/guards";

export default async function ProfilPage() {
  const { user, profile } = await requireAuthenticatedProfile();

  return (
    <main className="profile-page">
      <header className="home-header">
        <div>
          <p className="eyebrow">Profil</p>
          <h1>Meine Daten</h1>
        </div>
        <Link className="button-link secondary" href="/">
          Zurueck
        </Link>
      </header>

      <section className="profile-details" aria-label="Profildaten">
        <div>
          <span>Anzeigename</span>
          <strong>{profile.anzeigename}</strong>
        </div>
        <div>
          <span>E-Mail</span>
          <strong>{profile.email}</strong>
        </div>
        <div>
          <span>Nutzer-ID</span>
          <strong>{user.id}</strong>
        </div>
        <div>
          <span>Globaler App-Admin</span>
          <strong>{profile.isGlobalAdmin ? "Ja" : "Nein"}</strong>
        </div>
      </section>
    </main>
  );
}
