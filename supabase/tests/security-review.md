# Supabase Security Review

Datum: 2026-07-03

## Scope

Review der Supabase-bezogenen MVP-Artefakte fuer Grants, RLS Policies und Service-Role-Isolation:

- `supabase/migrations/001_initial_schema.sql`
- `supabase/tests/rls_policies.test.sql`
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- Next.js App/API-Routen unter `app/`

## Referenzpunkte

- Supabase empfiehlt fuer per Data API erreichbare Tabellen explizite Grants plus aktivierte Row Level Security.
- Der aktuelle Supabase-Changelog weist auf den Wechsel zu expliziten Grants fuer neue Tabellen hin.
- Supabase warnt davor, Service-Role- oder Secret-Keys in Public Clients bzw. `NEXT_PUBLIC_*` Variablen offenzulegen.

## Ergebnisse

### Grants

Status: bestanden

- Die Migration widerruft pauschale Tabellenrechte fuer `anon` und `authenticated`.
- `authenticated` erhaelt explizite Tabellenrechte fuer die benoetigten Public-Tabellen.
- `service_role` erhaelt explizite Tabellenrechte fuer serverseitige/administrative Nutzung.
- Funktionen werden zunaechst fuer `public`, `anon` und `authenticated` widerrufen und danach gezielt fuer Helper-Funktionen wieder an `authenticated` und `service_role` vergeben.

### RLS

Status: bestanden

- RLS ist fuer alle MVP-Tabellen im Public-Schema aktiviert:
  `profiles`, `tipprunden`, `mitgliedschaften`, `einladungen`, `teams`, `spieltage`, `spiele`, `tipps`, `ergebnisse`, `ergebnis_aenderungen`, `punktewertungen`.
- Policies sind auf aktive Mitgliedschaft, Admin/Co-Admin-Rollen, Besitzerrechte oder eigene Nutzer-Daten begrenzt.
- Update-Policies nutzen `using` und `with check`, wo schreibende Operationen erlaubt sind.
- Fremde Tipps bleiben in der RLS-Policy bis zur jeweiligen Anstosszeit verborgen.

### Service-Role-Isolation

Status: bestanden

- Browser-Client nutzt nur `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Server-Client nutzt Cookie-basierte SSR-Session und gibt keine Service-Role-Keys an den Browser weiter.
- `SUPABASE_SERVICE_ROLE_KEY` ist nur als nicht-oeffentliche Environment-Variable vorgesehen.
- `.env.local` ist durch `.gitignore` ausgeschlossen.

### Security Definer Functions

Status: akzeptiertes Risiko mit Begrenzung

- Es gibt vier `security definer` Helper-Funktionen fuer RLS-Pruefungen.
- Die Funktionen liegen im Public-Schema, haben aber einen festen `search_path = public` und wurden nach `revoke all on all functions` nur gezielt an `authenticated` und `service_role` vergeben.
- Die Funktionen geben nur Boolean-Autorisierungsentscheidungen zurueck und fuehren keine Datenveraenderung aus.

### CLI/Advisor-Check

Status: teilweise verifiziert

- `SUPABASE_TELEMETRY_DISABLED=1 npx supabase --version` ergibt `2.109.0`.
- `npx supabase db --help` und `npx supabase db advisors --help` funktionieren.
- Ein echter `supabase db advisors --linked` oder `--local` Lauf wurde nicht ausgefuehrt, weil dafuer eine laufende/gelinkte Datenbankverbindung erforderlich ist und in dieser Final-Phase keine Secrets ausgegeben oder `.env.local` geaendert werden sollen.

## Ergebnis

Keine blockernden Security-Funde fuer das MVP. Vor produktivem Betrieb sollte zusaetzlich ein echter Supabase Advisor-Lauf gegen das Zielprojekt erfolgen.
