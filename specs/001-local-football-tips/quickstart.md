# Quickstart: A-KlassenHoiz Validation Guide

## Purpose

This guide defines how to validate the V1 implementation after tasks are
generated and implemented. It is not an implementation script and contains no
application code.

## Prerequisites

- Node.js 22 LTS-compatible runtime.
- npm available locally.
- Supabase project `A-KlassenHoiz` available; project reference, URL and keys
  are provided through environment/configuration.
- Supabase CLI installed before database migrations or local Supabase validation
  tasks are executed.
- Environment variables for the app and Supabase project configured by the
  implementation tasks.

## Expected Commands After Implementation

The exact scripts will be created during implementation, but the project must
provide equivalents for:

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run test:integration
npm run test:e2e
npm run build
```

Supabase validation must include database policy checks and advisors where the
installed CLI supports them:

```bash
supabase --version
supabase db --help
supabase db advisors --help
```

If the Supabase CLI is unavailable, implementation tasks must document the
fallback validation through the Supabase MCP tools.

## End-to-End Validation Scenarios

### Scenario 1: Create private Tipprunde

1. Register a Nutzer with email/password and Anzeigename.
2. Create a new Tipprunde.
3. Verify the creator is Tipprunden-Admin.
4. Generate an Einladungslink.
5. Verify the link expires after 7 days and, when a simple QR-Code library is
   used, the QR-Code points to the same target.

**Expected outcome**: Tipprunde is private, active and visible only to the
creator until another Nutzer joins.

### Scenario 2: Rotate invitation

1. Generate an Einladungslink for a Tipprunde.
2. Generate a second Einladungslink.
3. Attempt to join with the old link.
4. Join with the new link.

**Expected outcome**: Old link is invalid; new link allows immediate join after
login and Tipprunden-Nickname entry.

### Scenario 3: Manage Spieltag and Spiele

1. As Admin or Co-Admin, create Teams/Vereine with and without Logo-URLs.
2. Create Spieltag `Spieltag 1` in Hinrunde.
3. Add at least 8 Spiele with Anstosszeiten in Europe/Berlin.
4. Change one Spiel to `verschoben` and update Anstosszeit.

**Expected outcome**: Spiele appear under the Spieltag; missing/invalid logos
show Fallback-Logo; verschobenes Spiel keeps existing Tipps and uses the new
Tippfrist.

### Scenario 4: Submit and lock Tipps

1. As a normal member, submit Tipps for all Spiele in a Spieltag.
2. Change a Tipp before the Spiel's Anstosszeit.
3. Attempt to change the same Tipp at or after Anstosszeit.
4. Verify later Spiele remain tippable.

**Expected outcome**: Tipp changes are accepted before Tippfrist and rejected
after Tippfrist per Spiel.

### Scenario 5: Tipp visibility

1. Have two members submit Tipps for the same Spiel.
2. Before Anstosszeit, each member views the Spiel.
3. After Anstosszeit, each member views the Spiel again.

**Expected outcome**: Own Tipps are always visible; Tipps anderer Nutzer are
hidden before Tippfrist and visible after Tippfrist.

### Scenario 6: Ergebnis and idempotent Punkteberechnung

1. Enter Ergebnis `2:1` for a Spiel with sample Tipps `2:1`, `3:2`, `1:0`,
   `1:1`.
2. Verify Punkte `4`, `3`, `2`, `0`.
3. Re-run Punkteberechnung without changing Ergebnis or Tipps.
4. Change Ergebnis and verify Ergebnis-Aenderung history.

**Expected outcome**: Recalculation is idempotent; Punktewertungen update to the
correct state after each Ergebnis change; Ranglisten derive from the current
Punktewertungen.

### Scenario 7: Ranglisten

1. Open Gesamtrangliste for a Tipprunde.
2. Open Spieltagsrangliste for a specific Spieltag.
3. Create a tie on Punkte.

**Expected outcome**: Ranglisten sort by Punkte descending; equal Punkte receive
same Platzierung such as Platz 1, Platz 1, Platz 3; tied members sort
alphabetically by Tipprunden-Nickname or Anzeigename.

### Scenario 8: Role boundaries

1. As normal Nutzer, attempt Admin-only operations.
2. As Co-Admin, manage Spieltage, Spiele, Teams/Vereine and Ergebnisse.
3. As Co-Admin, attempt endgueltiges Loeschen or owner transfer.
4. As owner Admin or global App-Admin, perform permanent delete flow with safety
   confirmation.

**Expected outcome**: Server-side checks and RLS reject unauthorized operations.

### Scenario 9: PWA basics

1. Open the app on a mobile browser.
2. Verify mobile layout for login, Tipprunden selection, Jetzt tippen,
   Rangliste and Spieltag.
3. Add the app to the smartphone homescreen.
4. Disable connectivity and perform a protected action.

**Expected outcome**: App has manifest, icon, theme color and homescreen-suitable
behavior; no-connection message appears; offline Tippabgabe is not supported in
V1.

## Validation Gates

- All unit tests pass.
- All integration tests pass, including database authorization policy checks.
- All end-to-end mobile viewport tests pass.
- Build, lint and typecheck pass.
- Supabase security review confirms explicit grants, RLS enabled on exposed
  tables and no service-role key in public clients.
