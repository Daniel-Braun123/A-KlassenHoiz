# Implementation Plan: A-KlassenHoiz Lokales Fussball-Tippspiel

**Branch**: `main` | **Date**: 2026-07-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-local-football-tips/spec.md`

## Summary

A-KlassenHoiz will be implemented as a mobile-first private Tippspiel web app
for local Bavarian football rounds. V1 covers email/password login, private
Tipprunden, invitations, manual Liga/Verein/Spieltag/Spiel/Ergebnis management,
Tippabgabe until each Anstosszeit, idempotent Punkteberechnung, Ranglisten and
PWA basics. BFV import, scraping, push notifications, offline Tippabgabe and
real-money betting features remain out of scope.

The preferred technical approach is a TypeScript/Next.js PWA backed by the
existing Supabase project `A-KlassenHoiz` for Auth, Postgres, Row Level Security,
Storage-ready metadata and server-side business operations. Supabase remains a
planned implementation choice, not a user-facing product dependency.

## Technical Context

**Language/Version**: TypeScript, Node.js, React and Next.js using the current
stable versions available at implementation time. Use a concrete version only
after project initialization confirms it through `package.json` and the
lockfile.

**Primary Dependencies**: Next.js App Router, React, Supabase JS 2.x,
`@supabase/ssr`, QR-code generation library, PWA manifest/service-worker tooling,
test runner and browser automation tooling selected during implementation

**Storage**: Supabase Postgres in Supabase project `A-KlassenHoiz`; project
reference, URL and keys are supplied through environment/configuration, not
hardcoded in planning or application code. Logo URLs are stored as text in V1;
Storage is reserved for later logo uploads.

**Testing**: Unit tests for scoring, Ranglisten, deadlines and permissions;
integration tests for authenticated user journeys and Supabase RLS policies;
end-to-end mobile viewport tests for Tippabgabe, invitations, admin flows,
Ranglisten and PWA installability

**Target Platform**: Responsive web app and installable PWA for modern mobile
browsers, with desktop support for admin workflows

**Project Type**: Full-stack web application with Supabase-backed data and
server-side authorization checks

**Performance Goals**: Users can submit a Spieltag with 8 Spiele in under 3
minutes; primary mobile navigation reaches Jetzt tippen, Rangliste and current
Spieltag within two taps; Punktewertungen update idempotently after result
changes and Ranglisten derive from those updates without manual edits.

**Constraints**: V1 uses Europe/Berlin for all Anstosszeiten and Tippfristen;
no BFV import; no scraping; no offline Tippabgabe; no push notifications; one
active Einladungslink per Tipprunde; 7-day default invitation validity; private
Tipprunden only; Spiel status values are `geplant`, `beendet`, `verschoben`,
`abgesagt` and `abgebrochen`; QR-Code generation is included only when a simple
QR-Code library can be used without complex extra infrastructure; the
Einladungslink remains the mandatory V1 path; no real-money betting terminology
or features.

**Scale/Scope**: MVP targets private local Tipprunden with multiple members,
multiple Tipprunden per Nutzer, manually entered Spieltage and typical local
league match volumes. The model must stay extensible for future BFV metadata.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Spec before plan: PASS. `spec.md` exists and is quality-checked.
- Plan before tasks: PASS. This command creates planning artifacts only; no
  `tasks.md` or implementation code is produced.
- Clarify unclear requirements: PASS. The spec contains no open clarification
  markers and user follow-up answers are incorporated.
- Tests for new business logic: PASS. Test strategy covers scoring, Ranglisten,
  deadline locking, invitation validity, role permissions and RLS policy
  behavior.
- Relevant builds/tests/lints after changes: PASS. Quickstart defines validation
  gates to run after implementation tasks create the application.
- Supabase security: PASS. Research and design require explicit grants plus RLS
  policies for exposed tables, and avoid authorization decisions based on
  user-editable metadata.

Post-design re-check: PASS. Data model, contracts and quickstart preserve these
gates and add no implementation work.

## Project Structure

### Documentation (this feature)

```text
specs/001-local-football-tips/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- api-contract.md
`-- checklists/
    `-- requirements.md
```

### Source Code (repository root)

```text
app/
|-- (auth)/
|-- (tipprunden)/
|-- admin/
|-- api/
`-- manifest.ts

components/
|-- admin/
|-- tipps/
|-- ranglisten/
`-- pwa/

lib/
|-- auth/
|-- supabase/
|-- domain/
|-- scoring/
`-- timezone/

supabase/
|-- migrations/
|-- seed.sql
`-- tests/

tests/
|-- unit/
|-- integration/
`-- e2e/
```

**Structure Decision**: Use a single Next.js application with co-located
application routes and shared domain libraries. Supabase migrations and database
policy tests live under `supabase/`; browser and business-logic tests live under
`tests/`. This keeps the MVP compact while preserving boundaries for scoring,
authorization and future BFV import work.

## Complexity Tracking

No constitution violations require complexity justification.

## Change Plan 2026-07-04: Liga-first Spielplanverwaltung

### Summary

The existing US3 Spielplan admin flow will be redesigned from a generic manual
form surface into a Liga-first workflow. Each Tipprunde has exactly one Liga.
Admins and Co-Admins must create that Liga first. Only after that can they
manage Vereine, Spieltage, Spiele and Ergebnisse. User-facing terminology moves
from Team/Team-Verein wording to Verein.

### Data and Migration Plan

- Add a `ligen` table with a unique `tipprunde_id` constraint.
- Add/confirm unique Verein name enforcement per Tipprunde.
- Add a numeric Spieltag field such as `nummer` and constrain
  `(tipprunde_id, abschnitt, nummer)` to be unique.
- Restrict revised Spieltag Abschnitt values for the creation flow to
  `hinrunde` and `rueckrunde`.
- Keep existing tables and data non-destructively where possible. Existing
  early/test data may be tolerated, but migrations must not drop user data
  without explicit approval.
- Preserve RLS and service-role isolation for the new Liga table and changed
  constraints.

### Domain and API Plan

- Introduce Liga repository/service operations with Admin/Co-Admin checks.
- Rename user-facing Team operations to Verein while allowing existing internal
  table names if that keeps the migration low-risk.
- Add validation for duplicate Verein names within a Tipprunde.
- Add Spieltag creation logic that calculates the next available Nummer per
  Tipprunde and Abschnitt.
- Add Spiel validation that blocks identical Heimverein/Auswaertsverein.
- Keep Europe/Berlin handling for Anpfiff/Anstosszeit.
- Keep full Spiel status support in the domain, but creation UI should expose
  `geplant` by default and optionally `verschoben`/`abgesagt`.

### UX Plan

- Spielplan-Verwaltung first shows a focused Liga creation step when no Liga
  exists.
- After Liga exists, the admin UI becomes a dashboard/tabbed workspace:
  `Vereine`, `Spieltage & Spiele`, `Ergebnisse`.
- Verein selection for Spiele uses dropdowns with logo/fallback logo and name.
- Spiele are created from inside a selected Spieltag, because this is clearer
  than forcing all Spiele during Spieltag creation.
- Ergebnis management stays reachable as its own area to separate structure
  maintenance from matchday result work.
- Use toast/status notifications for success and validation errors without
  adding betting terminology.

### Testing Plan

- Write tests before implementation for Liga creation gate, duplicate Verein
  rejection, automatic Spieltag numbering and Heim/Auswaerts validation.
- Add e2e coverage for the revised admin Spielplan flow.
- Re-run lint, typecheck, unit tests, integration tests, e2e tests and build
  after implementation.

### Non-Goals

- No BFV import.
- No logo upload; Logo-URL remains V1.
- No multi-Liga Tipprunden.
- No destructive cleanup of existing early/test data without explicit approval.
