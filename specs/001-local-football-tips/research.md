# Research: A-KlassenHoiz Lokales Fussball-Tippspiel

## Decision: Use Supabase as preferred backend for V1

**Rationale**: The user already created a Supabase project named
`A-KlassenHoiz`, and the feature needs email/password Auth, relational data,
row-level access control, server-side business rules and future Storage support.
Supabase Auth integrates with Postgres and RLS, which matches private
Tipprunden, member-only visibility and admin/co-admin permission checks.

**Alternatives considered**:

- Custom backend with separate hosted Postgres: more control but more setup,
  auth, session and authorization work for the MVP.
- Firebase/Firestore: simpler realtime primitives, but the relational model for
  Tipprunden, Spieltage, Spiele, Tipps, Ergebnisse and Ranglisten fits Postgres
  better.
- Backendless local-only prototype: faster to scaffold, but conflicts with the
  user's existing Supabase project and privacy requirements.

## Decision: Use Next.js, React and TypeScript for the web/PWA app

**Rationale**: The app needs mobile-first user flows, authenticated server-side
checks, PWA metadata, admin screens and quick iteration. Next.js with TypeScript
supports a compact full-stack repository and server/client separation for
Supabase SSR usage.

**Alternatives considered**:

- Vite React SPA: simpler client build, but more custom work for server-side
  auth handling and protected operations.
- Native mobile app: out of V1 scope; the spec requires a PWA, not a native app.
- SvelteKit/Nuxt: viable, but no project preference exists and Next.js has broad
  ecosystem support for Supabase SSR and PWA patterns.

## Decision: Keep all authorization enforced server-side and in RLS

**Rationale**: The spec requires Nutzer to see only their Tipprunden, normal
Nutzer to change only their own Tipps before Tippfrist, and Co-Admins/Admins to
manage protected resources. Supabase documentation states RLS should be enabled
for exposed-schema tables and combined with Auth for row-level authorization.
Server actions/API routes should enforce business invariants that are awkward or
risky to express only in client code.

**Alternatives considered**:

- Frontend-only role checks: rejected because the spec explicitly requires
  protected rights to be enforced beyond the UI.
- Service-role-only backend for all data access: rejected for normal app flows
  because it would bypass RLS and increase the blast radius of mistakes.

## Decision: Include explicit GRANTs with migrations plus RLS policies

**Rationale**: Supabase's 2026 platform change makes explicit grants required
for tables to be reachable through the Data API in new projects after
2026-05-30, with enforcement for existing projects scheduled later. Migrations
must therefore treat grants, RLS enablement and policies as one unit for every
exposed table.

**Alternatives considered**:

- Relying on default grants: rejected because current Supabase behavior is
  changing and would make the app fragile across project settings.
- Creating tables only in private schemas: useful for internal objects, but the
  web app needs authenticated client access to many domain rows under strict
  policies.

## Decision: Implement Punkteberechnung as deterministic domain logic

**Rationale**: The spec requires idempotent recalculation. The scoring function
must derive Punkte from stored Ergebnisse and Tipps without accumulating
duplicate deltas. Punktewertungen are updated deterministically after Ergebnis
changes. Ranglisten are derived views or queries over Punktewertungen and are
not manually stored or edited.

**Alternatives considered**:

- Incrementally adding/subtracting points on each result edit: rejected because
  it is error-prone under repeated recalculation and edited results.
- Manual Rangliste edits: rejected because Ranglisten must be derived from
  Punktewertungen and update automatically.

## Decision: Interpret all deadlines in Europe/Berlin

**Rationale**: V1 targets Bavarian local football. The spec explicitly requires
all Anstosszeiten and Tippfristen in Europe/Berlin. Store timestamps in a
timezone-safe representation while presenting and validating against
Europe/Berlin.

**Alternatives considered**:

- Browser-local timezone: rejected because users traveling or using non-German
  settings could see or enforce the wrong deadline.
- Naive local dates only: rejected because Spieltage can span multiple calendar
  dates and exact Anstosszeiten lock Tippabgabe.

## Decision: Define a REST-style application contract for planning

**Rationale**: The product exposes user-facing web flows and protected backend
operations. A route-oriented contract documents required behavior without
committing to final controller names or database implementation details.

**Alternatives considered**:

- Database-only contract: insufficient for user journeys and authorization
  behavior.
- Full OpenAPI now: premature before route structure is generated, and the
  current task is planning rather than implementation.

## Sources

- Supabase Auth overview: https://supabase.com/docs/guides/auth
- Supabase Row Level Security guide:
  https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Storage access control:
  https://supabase.com/docs/guides/storage/security/access-control
- Supabase changelog on explicit grants/Data API exposure:
  https://supabase.com/changelog
