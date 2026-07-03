# A-KlassenHoiz

Mobile-first Web-App fuer private Tipprunden zu lokalen Fussballspielen.

## Voraussetzungen

- Node.js mit npm
- Supabase CLI fuer lokale Datenbank-/Policy-Checks
- Ein Supabase-Projekt mit Auth, Postgres und den Migrationen aus `supabase/migrations`

## Setup

```bash
npm install
cp .env.example .env.local
```

Danach `.env.local` lokal befuellen. Projekt-Refs, URLs und Keys werden nur ueber Environment/Config gesetzt und nicht in der Dokumentation festgeschrieben.

Erwartete Variablen:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_PROJECT_REF=
SUPABASE_SERVICE_ROLE_KEY=
APP_URL=http://localhost:3000
```

`SUPABASE_SERVICE_ROLE_KEY` darf niemals als `NEXT_PUBLIC_*` Variable verwendet oder in Client-Code importiert werden.

## Entwicklung

```bash
npm run dev
```

Die App laeuft standardmaessig auf `http://localhost:3000`.

## Checks

```bash
npm run lint
npm run typecheck
npm run test
npm run test:integration
npm run test:e2e
npm run build
```

## Supabase

Migrationen liegen unter `supabase/migrations`. Die initiale Migration enthaelt:

- explizite Grants fuer `authenticated` und `service_role`
- aktivierte RLS fuer Public-Tabellen
- Policies fuer aktive Mitgliedschaften, Admin-/Co-Admin-Rechte und eigene Tipps

Hilfreiche CLI-Kommandos:

```bash
supabase --version
supabase db --help
supabase db advisors --help
```

Ein Advisor-Lauf gegen ein echtes Projekt sollte mit lokaler Konfiguration erfolgen, ohne Secrets in Logs oder Commits auszugeben.

## PWA

Das Manifest ist unter `/manifest.webmanifest` erreichbar. Das App-Icon liegt in `public/icon.svg`. Offline-Tippabgabe und Push-Benachrichtigungen sind in V1 nicht enthalten.
