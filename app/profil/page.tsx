import Link from "next/link";
import { ArrowLeft, BadgeCheck, Mail, Shield, UserRound } from "lucide-react";

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
          <ArrowLeft aria-hidden="true" size={18} />
          Zurück
        </Link>
      </header>

      <section className="profile-details" aria-label="Profildaten">
        <div>
          <span>
            <UserRound aria-hidden="true" size={16} />
            Anzeigename
          </span>
          <strong>{profile.anzeigename}</strong>
        </div>
        <div>
          <span>
            <Mail aria-hidden="true" size={16} />
            E-Mail
          </span>
          <strong>{profile.email}</strong>
        </div>
        <div>
          <span>
            <BadgeCheck aria-hidden="true" size={16} />
            Nutzer-ID
          </span>
          <strong>{user.id}</strong>
        </div>
        <div>
          <span>
            <Shield aria-hidden="true" size={16} />
            Globaler App-Admin
          </span>
          <strong>{profile.isGlobalAdmin ? "Ja" : "Nein"}</strong>
        </div>
      </section>
    </main>
  );
}
