# API Contract: A-KlassenHoiz V1

## Purpose

This contract documents protected application operations that the web app must
provide. Route names are planning-level contracts and may be implemented as
server actions or HTTP routes, but behavior, authorization and validation must
remain equivalent.

## Authentication

- Nutzer register and log in with email/password.
- All Tipprunden data operations require an authenticated Nutzer.
- Email addresses are not exposed to normal Nutzer.

## Common Rules

- All Anstosszeiten and Tippfristen are interpreted as Europe/Berlin.
- All protected writes require server-side authorization checks.
- Supabase RLS policies must also enforce member, owner, Admin and Co-Admin
  boundaries.
- Error responses must be user-friendly and avoid betting terminology.

## Operations

### Create Tipprunde

`POST /tipprunden`

**Actor**: authenticated Nutzer

**Input**

- `name`
- optional initial `tipprundenNickname`

**Outcome**

- Creates private active Tipprunde.
- Creates membership for creator as Tipprunden-Admin.

### Archive Tipprunde

`POST /tipprunden/{tipprundeId}/archive`

**Actor**: owner Admin

**Outcome**

- Marks Tipprunde archived.
- Tipprunde is no longer active for normal use.

### Permanently Delete Tipprunde

`DELETE /tipprunden/{tipprundeId}`

**Actor**: owner Admin or global App-Admin

**Input**

- explicit safety confirmation

**Outcome**

- Marks or removes Tipprunde according to implementation policy.
- Co-Admins are forbidden.

### Create Invitation

`POST /tipprunden/{tipprundeId}/einladung`

**Actor**: Tipprunden-Admin

**Outcome**

- Revokes the previous active Einladungslink for the Tipprunde.
- Creates a new active Einladungslink with default 7-day validity.
- Provides QR-Code target data when a simple QR-Code library can be used without
  complex extra infrastructure. Einladungslink remains the required V1 path.

### Join Tipprunde

`POST /einladungen/{token}/join`

**Actor**: authenticated Nutzer

**Input**

- `tipprundenNickname`

**Outcome**

- Adds Nutzer as active member if token is valid and not expired.
- Rejects revoked, expired or invalid tokens.

### Manage Co-Admins

`POST /tipprunden/{tipprundeId}/members/{nutzerId}/role`

**Actor**: owner Admin

**Input**

- `role`: `nutzer` or `co_admin`

**Outcome**

- Updates membership role.
- Owner Admin role cannot be removed through this operation.

### Create/Update Liga

`POST /tipprunden/{tipprundeId}/liga`

`PATCH /tipprunden/{tipprundeId}/liga`

**Actor**: Admin or Co-Admin

**Input**

- `name`

**Outcome**

- Creates or updates the single Liga for the Tipprunde.
- Rejects creating a second Liga for the same Tipprunde.
- Unlocks Verein, Spieltag, Spiel and Ergebnis management after the Liga exists.

### Create/Update Verein

`POST /tipprunden/{tipprundeId}/teams`

`PATCH /tipprunden/{tipprundeId}/teams/{teamId}`

**Actor**: Admin or Co-Admin

**Input**

- `name`
- optional `logoUrl`
- optional future external metadata

**Outcome**

- Stores Verein data.
- Rejects duplicate Verein names within the same Tipprunde.
- UI must use Fallback-Logo if Logo-URL is missing or invalid.

### Create Spieltag

`POST /tipprunden/{tipprundeId}/spieltage`

**Actor**: Admin or Co-Admin

**Input**

- `abschnitt`: `hinrunde` or `rueckrunde`

**Outcome**

- Requires an existing Liga.
- Creates the next numbered Spieltag for the chosen Abschnitt.
- Generates display name from Abschnitt and Nummer.
- Rejects duplicate `(tipprundeId, abschnitt, nummer)` states.

### Update/Delete Spieltag

`PATCH /tipprunden/{tipprundeId}/spieltage/{spieltagId}`

`DELETE /tipprunden/{tipprundeId}/spieltage/{spieltagId}`

**Actor**: Admin or Co-Admin

**Input**

- optional `abschnitt` when supported by implementation

**Outcome**

- Keeps Spieltag uniqueness and generated naming rules intact.

### Create/Update Spiel

`POST /tipprunden/{tipprundeId}/spiele`

`PATCH /tipprunden/{tipprundeId}/spiele/{spielId}`

**Actor**: Admin or Co-Admin

**Input**

- `spieltagId`
- `heimvereinId`
- `auswaertsvereinId`
- `anstossDatum`
- `anstossUhrzeit`
- optional `status`: `geplant`, `verschoben` or `abgesagt` in creation UI
- optional future external metadata

**Outcome**

- Creates or updates Spiel.
- Requires existing Liga, Spieltag and Vereine.
- Rejects identical Heimverein and Auswaertsverein.
- Verschobene Spiele keep existing Tipps and receive new Tippfrist from
  updated Anstosszeit.

### Submit Tipp

`PUT /tipprunden/{tipprundeId}/spiele/{spielId}/tipp`

**Actor**: active member

**Input**

- `heimtoreTipp`
- `auswaertstoreTipp`

**Outcome**

- Creates or updates own Tipp before Spiel-Anstosszeit.
- Rejects changes at or after Tippfrist.

### Enter Ergebnis

`PUT /tipprunden/{tipprundeId}/spiele/{spielId}/ergebnis`

**Actor**: Admin or Co-Admin

**Input**

- `heimtore`
- `auswaertstore`
- optional `reason`

**Outcome**

- Stores Ergebnis.
- Historizes changes when an existing Ergebnis is replaced.
- Triggers idempotent Punktewertung updates. Ranglisten are derived from
  Punktewertungen and are not manually edited.

### Get Spieltag View

`GET /tipprunden/{tipprundeId}/spieltage/{spieltagId}`

**Actor**: active member

**Outcome**

- Returns Spieltag, Spiele, Vereine, own Tipps, Ergebnisse where
  available and Tipp visibility flags.
- Returns Tipps anderer Nutzer only after each Spiel's Tippfrist.

### Get Rangliste

`GET /tipprunden/{tipprundeId}/rangliste`

`GET /tipprunden/{tipprundeId}/spieltage/{spieltagId}/rangliste`

**Actor**: active member

**Outcome**

- Returns Gesamt- or Spieltagsrangliste with Punkte, Platzierung and V1
  statistics.

## Contract Test Focus

- Non-members cannot read Tipprunde resources.
- Normal Nutzer cannot access Admin/Co-Admin operations.
- Co-Admins cannot permanently delete Tipprunden or transfer Besitzerrechte.
- Liga must exist before Verein, Spieltag, Spiel or Ergebnis management.
- Duplicate Verein names in one Tipprunde are rejected.
- Spieltag numbering is automatic and unique per Abschnitt.
- Heimverein and Auswaertsverein cannot be identical.
- Tipps lock independently at Anstosszeit.
- Einladungslink rotation invalidates previous link.
- Ergebnis changes are historized and scoring remains idempotent.
- Ranglisten are returned from derived views/queries, not manually stored
  ranking rows.
