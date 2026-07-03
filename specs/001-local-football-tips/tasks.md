# Tasks: A-KlassenHoiz Lokales Fussball-Tippspiel

**Input**: Design documents from `/specs/001-local-football-tips/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-contract.md, quickstart.md

**Tests**: Required for new business logic by project governance. Write focused failing tests before implementation for scoring, deadlines, invitations, roles, RLS policies and ranking behavior.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US7)
- All tasks include exact file paths

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the web app, tooling and planned project structure without implementing feature behavior.

- [x] T001 Initialize the Next.js TypeScript project configuration in `package.json`
- [x] T002 [P] Configure TypeScript settings in `tsconfig.json`
- [x] T003 [P] Configure Next.js application settings in `next.config.ts`
- [x] T004 [P] Configure linting and formatting in `eslint.config.mjs` and `.prettierrc.json`
- [x] T005 [P] Create the application route directories in `app/(auth)/`, `app/(tipprunden)/`, `app/admin/` and `app/api/`
- [x] T006 [P] Create shared source directories in `components/admin/`, `components/tipps/`, `components/ranglisten/`, `components/pwa/`, `lib/auth/`, `lib/supabase/`, `lib/domain/`, `lib/scoring/` and `lib/timezone/`
- [x] T007 [P] Create test directories in `tests/unit/`, `tests/integration/`, `tests/e2e/` and `supabase/tests/`
- [x] T008 [P] Add environment template variables for Supabase project configuration in `.env.example`
- [x] T009 [P] Configure unit, integration and e2e test scripts in `package.json`
- [x] T010 [P] Configure PWA metadata entry points in `app/manifest.ts` and `components/pwa/install-status.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core domain, Supabase, authorization and validation foundation that must exist before any user story implementation.

- [x] T011 Create shared German domain enums and constants in `lib/domain/constants.ts`
- [x] T012 Create shared domain types for Nutzer, Tipprunde, Mitgliedschaft, Einladung, Spieltag, Spiel, TeamVerein, Tipp, Ergebnis, Punktewertung and Rangliste in `lib/domain/types.ts`
- [x] T013 [P] Create Europe/Berlin date-time helpers and tests in `lib/timezone/berlin.ts` and `tests/unit/timezone.berlin.test.ts`
- [x] T014 [P] Create scoring test cases for exact result, Tordifferenz, Tendenz and zero Punkte in `tests/unit/scoring.calculate.test.ts`
- [x] T015 [P] Create ranking derivation test cases for equal Platzierung and alphabetical tie sorting in `tests/unit/ranglisten.derive.test.ts`
- [x] T016 [P] Create permission matrix tests for Nutzer, Admin, Co-Admin and global App-Admin in `tests/unit/permissions.matrix.test.ts`
- [x] T017 Implement deterministic scoring functions in `lib/scoring/calculate-punkte.ts`
- [x] T018 Implement derived Rangliste functions in `lib/scoring/derive-ranglisten.ts`
- [x] T019 Implement role and membership permission helpers in `lib/auth/permissions.ts`
- [x] T020 Implement Supabase browser and server clients in `lib/supabase/client.ts` and `lib/supabase/server.ts`
- [x] T021 Create Supabase migration for initial schema, explicit grants and RLS policies in `supabase/migrations/001_initial_schema.sql`
- [x] T022 Create Supabase policy tests for member visibility, own Tipp writes and Admin/Co-Admin writes in `supabase/tests/rls_policies.test.sql`
- [x] T023 Create seed data for local validation in `supabase/seed.sql`
- [x] T024 Create reusable route guards for authenticated Nutzer and Tipprunden membership in `lib/auth/guards.ts`
- [x] T025 Create shared user-facing error helpers that avoid betting terminology in `lib/domain/errors.ts`

**Checkpoint**: Foundation ready. No user story work starts until T011-T025 are complete.

---

## Phase 3: User Story 1 - Private Tipprunde erstellen und verwalten (Priority: P1)

**Goal**: A registered Nutzer can create a private Tipprunde, become Admin, manage core ownership state and generate the active invitation.

**Independent Test**: Register/login, create a Tipprunde, verify Admin membership, generate an Einladungslink, appoint a Co-Admin and archive/permanently delete with correct restrictions.

### Tests for User Story 1

- [x] T026 [P] [US1] Create contract tests for create/archive/delete Tipprunde operations in `tests/integration/us1.tipprunde.contract.test.ts`
- [x] T027 [P] [US1] Create role management tests for Admin and Co-Admin boundaries in `tests/integration/us1.roles.test.ts`
- [x] T028 [P] [US1] Create e2e test for Tipprunde creation and Admin dashboard access in `tests/e2e/us1-create-tipprunde.spec.ts`

### Implementation for User Story 1

- [x] T029 [US1] Implement registration/login pages for email/password and Anzeigename in `app/(auth)/login/page.tsx` and `app/(auth)/register/page.tsx`
- [x] T030 [US1] Implement authenticated landing logic for no/one/multiple Tipprunden in `app/(tipprunden)/page.tsx`
- [x] T031 [US1] Implement Tipprunde creation operation in `app/api/tipprunden/route.ts`
- [x] T032 [US1] Implement Tipprunde repository operations in `lib/domain/tipprunden-repository.ts`
- [x] T033 [US1] Implement Admin role assignment and membership creation in `lib/domain/mitgliedschaften-service.ts`
- [x] T034 [US1] Implement owner-only archive and permanent delete operations in `app/api/tipprunden/[tipprundeId]/archive/route.ts` and `app/api/tipprunden/[tipprundeId]/route.ts`
- [x] T035 [US1] Implement Co-Admin role management operation in `app/api/tipprunden/[tipprundeId]/members/[nutzerId]/role/route.ts`
- [x] T036 [US1] Implement Tipprunde admin overview UI in `app/admin/tipprunden/[tipprundeId]/page.tsx`

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Einer privaten Tipprunde beitreten (Priority: P1)

**Goal**: A Nutzer can join a private Tipprunde through the active Einladungslink or QR-Code target and set a Tipprunden-Nickname.

**Independent Test**: Generate two invitation links, verify the old link is invalid, join with the new link, and reject expired or revoked links.

### Tests for User Story 2

- [x] T037 [P] [US2] Create invitation rotation and expiry tests in `tests/integration/us2.einladungen.test.ts`
- [x] T038 [P] [US2] Create e2e test for joining by Einladungslink and Tipprunden-Nickname in `tests/e2e/us2-join-tipprunde.spec.ts`

### Implementation for User Story 2

- [x] T039 [US2] Implement one-active-link invitation service with 7-day validity in `lib/domain/einladungen-service.ts`
- [x] T040 [US2] Implement create invitation operation in `app/api/tipprunden/[tipprundeId]/einladung/route.ts`
- [x] T041 [US2] Implement join invitation operation in `app/api/einladungen/[token]/join/route.ts`
- [x] T042 [US2] Implement join page with Tipprunden-Nickname form in `app/(tipprunden)/einladungen/[token]/page.tsx`
- [x] T043 [US2] Implement QR-Code display using a simple library when available in `components/admin/einladung-qr-code.tsx`
- [x] T044 [US2] Implement invitation link management UI in `components/admin/einladung-panel.tsx`

**Checkpoint**: User Story 2 is independently functional and testable.

---

## Phase 5: User Story 3 - Spieltage, Spiele und Teams/Vereine manuell pflegen (Priority: P1)

**Goal**: Admins and Co-Admins can manually maintain Teams/Vereine, Logo-URLs, Spieltage and Spiele with German Spiel status values.

**Independent Test**: Create Teams/Vereine, create a Hinrunde Spieltag, add Spiele with Europe/Berlin Anstosszeiten, set `verschoben`, and verify invalid logos use Fallback-Logo.

### Tests for User Story 3

- [ ] T045 [P] [US3] Create integration tests for Team/Verein CRUD and Fallback-Logo behavior in `tests/integration/us3.teams.test.ts`
- [ ] T046 [P] [US3] Create integration tests for Spieltag and Spiel CRUD with German status values in `tests/integration/us3.spiele.test.ts`
- [ ] T047 [P] [US3] Create e2e admin maintenance test in `tests/e2e/us3-admin-spielplan.spec.ts`

### Implementation for User Story 3

- [ ] T048 [US3] Implement Team/Verein repository and validation in `lib/domain/teams-repository.ts`
- [ ] T049 [US3] Implement Spieltag repository and validation in `lib/domain/spieltage-repository.ts`
- [ ] T050 [US3] Implement Spiel repository with statuses `geplant`, `beendet`, `verschoben`, `abgesagt` and `abgebrochen` in `lib/domain/spiele-repository.ts`
- [ ] T051 [US3] Implement Team/Verein API operations in `app/api/tipprunden/[tipprundeId]/teams/route.ts` and `app/api/tipprunden/[tipprundeId]/teams/[teamId]/route.ts`
- [ ] T052 [US3] Implement Spieltag API operations in `app/api/tipprunden/[tipprundeId]/spieltage/route.ts` and `app/api/tipprunden/[tipprundeId]/spieltage/[spieltagId]/route.ts`
- [ ] T053 [US3] Implement Spiel API operations in `app/api/tipprunden/[tipprundeId]/spiele/route.ts` and `app/api/tipprunden/[tipprundeId]/spiele/[spielId]/route.ts`
- [ ] T054 [US3] Implement Fallback-Logo component in `components/admin/team-logo.tsx`
- [ ] T055 [US3] Implement admin Spielplan management UI in `app/admin/tipprunden/[tipprundeId]/spielplan/page.tsx`

**Checkpoint**: User Story 3 is independently functional and testable.

---

## Phase 6: User Story 4 - Kompletten Spieltag schnell tippen (Priority: P1)

**Goal**: Members can quickly submit and edit Tipps per Spiel until each Spiel's Anstosszeit while later Spiele remain tippable.

**Independent Test**: Submit Tipps for an 8-Spiel Spieltag on mobile, edit before Anstosszeit, reject after Anstosszeit, and keep later Spiele open.

### Tests for User Story 4

- [ ] T056 [P] [US4] Create unit tests for Tippfrist locking per Spiel in `tests/unit/tipps.deadline.test.ts`
- [ ] T057 [P] [US4] Create integration tests for own Tipp create/update authorization in `tests/integration/us4.tipps.test.ts`
- [ ] T058 [P] [US4] Create e2e mobile viewport test for quickly tipping a Spieltag in `tests/e2e/us4-tipps-mobile.spec.ts`

### Implementation for User Story 4

- [ ] T059 [US4] Implement Tipp deadline validation in `lib/domain/tippfristen.ts`
- [ ] T060 [US4] Implement Tipp repository and upsert behavior in `lib/domain/tipps-repository.ts`
- [ ] T061 [US4] Implement submit Tipp operation in `app/api/tipprunden/[tipprundeId]/spiele/[spielId]/tipp/route.ts`
- [ ] T062 [US4] Implement Spieltag Tipp view data loader in `lib/domain/spieltag-view-service.ts`
- [ ] T063 [US4] Implement mobile Tipp input components in `components/tipps/tipp-card.tsx` and `components/tipps/spieltag-tipps.tsx`
- [ ] T064 [US4] Implement selected Spieltag Tipp page in `app/(tipprunden)/[tipprundeId]/spieltage/[spieltagId]/page.tsx`

**Checkpoint**: User Story 4 is independently functional and testable.

---

## Phase 7: User Story 5 - Ergebnisse eintragen und Punkte berechnen (Priority: P1)

**Goal**: Admins and Co-Admins can enter/change Ergebnisse, changes are historized, Punktewertungen update idempotently and Ranglisten derive from Punktewertungen.

**Independent Test**: Enter sample Ergebnisse, verify 4/3/2/0 scoring, re-run recalculation, change Ergebnis, verify history and derived Ranglisten.

### Tests for User Story 5

- [ ] T065 [P] [US5] Create Ergebnis history integration tests in `tests/integration/us5.ergebnisse-history.test.ts`
- [ ] T066 [P] [US5] Create idempotent Punktewertung integration tests in `tests/integration/us5.punktewertung.test.ts`
- [ ] T067 [P] [US5] Create e2e admin Ergebnis entry test in `tests/e2e/us5-ergebnisse.spec.ts`

### Implementation for User Story 5

- [ ] T068 [US5] Implement Ergebnis repository and change history in `lib/domain/ergebnisse-repository.ts`
- [ ] T069 [US5] Implement idempotent Punktewertung service in `lib/domain/punktewertung-service.ts`
- [ ] T070 [US5] Implement Ergebnis entry operation in `app/api/tipprunden/[tipprundeId]/spiele/[spielId]/ergebnis/route.ts`
- [ ] T071 [US5] Implement Ergebnis admin UI in `components/admin/ergebnis-form.tsx`
- [ ] T072 [US5] Implement changed Ergebnis marker in `components/tipps/ergebnis-status.tsx`

**Checkpoint**: User Story 5 is independently functional and testable.

---

## Phase 8: User Story 6 - Ranglisten und Ergebnisse ansehen (Priority: P2)

**Goal**: Members can view Gesamt- and Spieltagsranglisten plus past Spieltage and Ergebnisse.

**Independent Test**: Open Gesamt- and Spieltagsrangliste, verify same Platzierung for ties and alphabetical sorting within equal Punkte.

### Tests for User Story 6

- [ ] T073 [P] [US6] Create integration tests for derived Gesamt- and Spieltagsranglisten in `tests/integration/us6.ranglisten.test.ts`
- [ ] T074 [P] [US6] Create e2e test for viewing Ranglisten and past Ergebnisse in `tests/e2e/us6-ranglisten.spec.ts`

### Implementation for User Story 6

- [ ] T075 [US6] Implement derived Rangliste query service in `lib/domain/ranglisten-service.ts`
- [ ] T076 [US6] Implement Rangliste API operations in `app/api/tipprunden/[tipprundeId]/rangliste/route.ts` and `app/api/tipprunden/[tipprundeId]/spieltage/[spieltagId]/rangliste/route.ts`
- [ ] T077 [US6] Implement Rangliste components in `components/ranglisten/rangliste-table.tsx`
- [ ] T078 [US6] Implement Gesamt- and Spieltagsrangliste pages in `app/(tipprunden)/[tipprundeId]/rangliste/page.tsx` and `app/(tipprunden)/[tipprundeId]/spieltage/[spieltagId]/rangliste/page.tsx`
- [ ] T079 [US6] Implement past Spieltage and Ergebnisse view in `app/(tipprunden)/[tipprundeId]/ergebnisse/page.tsx`

**Checkpoint**: User Story 6 is independently functional and testable.

---

## Phase 9: User Story 7 - Mobile App-aehnliche Nutzung (Priority: P2)

**Goal**: Users get mobile-first navigation, remembered active Tipprunde, PWA basics and a simple no-connection message.

**Independent Test**: On mobile viewport, verify login routing for no/one/multiple Tipprunden, two-tap access to Jetzt tippen/Rangliste/current Spieltag, homescreen install metadata and no-connection message.

### Tests for User Story 7

- [ ] T080 [P] [US7] Create e2e tests for no/one/multiple Tipprunde login routing in `tests/e2e/us7-routing.spec.ts`
- [ ] T081 [P] [US7] Create e2e tests for PWA manifest and mobile navigation in `tests/e2e/us7-pwa-mobile.spec.ts`

### Implementation for User Story 7

- [ ] T082 [US7] Implement active Tipprunde persistence in `lib/domain/active-tipprunde.ts`
- [ ] T083 [US7] Implement mobile navigation shell in `components/pwa/mobile-shell.tsx`
- [ ] T084 [US7] Implement Tipprunden switcher in `components/tipps/tipprunden-switcher.tsx`
- [ ] T085 [US7] Implement PWA manifest metadata in `app/manifest.ts`
- [ ] T086 [US7] Implement no-connection message component in `components/pwa/no-connection-message.tsx`
- [ ] T087 [US7] Wire mobile-first layout into `app/(tipprunden)/[tipprundeId]/layout.tsx`

**Checkpoint**: User Story 7 is independently functional and testable.

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Validate the complete MVP against quickstart scenarios and harden security, wording and mobile quality.

- [ ] T088 [P] Run Supabase security review for explicit grants, RLS policies and service-role isolation in `supabase/tests/security-review.md`
- [ ] T089 [P] Add copy review to avoid Wette/Einsatz/Quote/Auszahlung terminology in `tests/unit/copy.terminology.test.ts`
- [ ] T090 [P] Add accessibility checks for mobile forms and navigation in `tests/e2e/accessibility-mobile.spec.ts`
- [ ] T091 [P] Add README setup notes for environment/configuration without Supabase project refs in `README.md`
- [ ] T092 Run all quickstart scenarios and record outcomes in `specs/001-local-football-tips/quickstart-results.md`
- [ ] T093 Run final lint, typecheck, unit, integration, e2e and build commands from `package.json`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup and blocks all user stories.
- **US1 (Phase 3)**: First MVP slice after Foundation.
- **US2 (Phase 4)**: Depends on Tipprunde membership foundation and benefits from US1 invitation/admin UI.
- **US3 (Phase 5)**: Depends on Tipprunde roles from Foundation and US1.
- **US4 (Phase 6)**: Depends on Spiele from US3.
- **US5 (Phase 7)**: Depends on Tipps from US4 and Spiele from US3.
- **US6 (Phase 8)**: Depends on Punktewertungen from US5.
- **US7 (Phase 9)**: Can proceed after Foundation, but final validation depends on US1-US6 navigation targets.
- **Polish**: Depends on all selected user stories.

### User Story Dependencies

- **US1**: Independent MVP admin/group slice after Foundation.
- **US2**: Requires a Tipprunde and Admin invitation capability from US1.
- **US3**: Requires Admin/Co-Admin rights from US1.
- **US4**: Requires Spiele and Spieltage from US3.
- **US5**: Requires Tipps from US4 and Spiele from US3.
- **US6**: Requires Punktewertungen from US5.
- **US7**: Cross-cutting mobile/PWA experience; can start early after Foundation but completes last.

### Within Each User Story

- Tests first, then domain services/repositories, then operations/routes, then UI integration.
- Tasks marked [P] can run in parallel if they touch different files.
- Each checkpoint must pass before relying on that story in later phases.

## Parallel Opportunities

- Setup tasks T002-T010 can run in parallel after T001.
- Foundational tests T013-T016 can run in parallel.
- US1 tests T026-T028 can run in parallel.
- US2 tests T037-T038 can run in parallel.
- US3 tests T045-T047 can run in parallel.
- US4 tests T056-T058 can run in parallel.
- US5 tests T065-T067 can run in parallel.
- US6 tests T073-T074 can run in parallel.
- US7 tests T080-T081 can run in parallel.
- Polish tasks T088-T091 can run in parallel.

## Parallel Example: User Story 5

```bash
Task: "Create Ergebnis history integration tests in tests/integration/us5.ergebnisse-history.test.ts"
Task: "Create idempotent Punktewertung integration tests in tests/integration/us5.punktewertung.test.ts"
Task: "Create e2e admin Ergebnis entry test in tests/e2e/us5-ergebnisse.spec.ts"
```

## Implementation Strategy

### MVP First

1. Complete Setup and Foundational phases.
2. Complete US1 to create and manage a private Tipprunde.
3. Add US2 and US3 so a real group can join and receive manually managed Spiele.
4. Add US4 and US5 for Tippabgabe, Ergebnisse and Punktewertung.
5. Add US6 and US7 for Ranglisten and mobile/PWA completion.

### Incremental Delivery

1. Foundation ready.
2. US1 demo: create private Tipprunde and manage roles.
3. US2 demo: join via active Einladungslink and optional QR-Code.
4. US3 demo: create Spieltag with Spiele and Teams/Vereine.
5. US4 demo: submit mobile Tipps until Tippfrist.
6. US5 demo: enter Ergebnisse and idempotently update Punktewertungen.
7. US6/US7 demo: view Ranglisten and install/use mobile PWA basics.

## Notes

- No implementation should start before this `tasks.md` is reviewed.
- Supabase project identifiers stay in environment/configuration, not committed docs or client code.
- Ranglisten are derived from Punktewertungen and must not be manually edited.
- QR-Code is optional in V1 only when a simple library works without complex extra infrastructure; Einladungslink is required.
