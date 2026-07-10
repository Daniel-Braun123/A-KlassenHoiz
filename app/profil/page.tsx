import Link from "next/link";
import { ArrowLeft, BadgeCheck, LogOut, Mail, Shield, UserRound } from "lucide-react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { PageHeader } from "@/components/ui/primitives";
import { requireAuthenticatedProfile } from "@/lib/auth/guards";

export default async function ProfilPage() {
  const { user, profile } = await requireAuthenticatedProfile();

  return (
    <main className="profile-page">
      <PageHeader
        eyebrow="Profil"
        title="Meine Daten"
        actions={
          <Link className="button-link secondary" href="/">
            <ArrowLeft aria-hidden="true" size={18} />
            Zurück
          </Link>
        }
      />

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

      <section className="profile-details profile-settings" aria-label="Profileinstellungen">
        <ThemeToggle />
      </section>

      <section className="profile-details profile-settings" aria-label="Sitzung">
        <form className="profile-logout" action="/auth/signout" method="post">
          <div>
            <span>
              <LogOut aria-hidden="true" size={16} />
              Sitzung
            </span>
            <strong>Du kannst dich hier von diesem Konto abmelden.</strong>
          </div>
          <button className="button-link danger-button" type="submit">
            <LogOut aria-hidden="true" size={18} />
            Abmelden
          </button>
        </form>
      </section>
    </main>
  );
}
