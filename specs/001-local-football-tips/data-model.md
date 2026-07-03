# Data Model: A-KlassenHoiz Lokales Fussball-Tippspiel

## Overview

The domain model centers on private Tipprunden. A Nutzer can be a member of
multiple Tipprunden, and each membership carries a Tipprunden-Nickname and role.
Admins and Co-Admins manage Spieltage, Spiele, Teams/Vereine, Ergebnisse and
Einladungen. Normal Nutzer submit Tipps until each Spiel's Anstosszeit.
Punktewertungen and Ranglisten are derived idempotently from Ergebnisse and
Tipps.

## Entities

### Nutzer

**Fields**

- `id`: stable user identifier linked to the auth identity
- `email`: unique login email, not visible to normal users
- `anzeigename`: required global display name
- `echter_name`: optional
- `is_global_admin`: minimal global App-Admin flag or equivalent role marker
- `created_at`, `updated_at`

**Validation**

- Email must be unique.
- Anzeigename is required.
- Email is visible only to the account owner and global App-Admin flows.

### Tipprunde

**Fields**

- `id`
- `name`
- `besitzer_nutzer_id`
- `status`: `active`, `archived`, `deleted`
- `created_at`, `updated_at`, `archived_at`, `deleted_at`

**Relationships**

- Has many Tipprunden-Mitgliedschaften.
- Has many Spieltage, Teams/Vereine, Einladungen and Spiele through Spieltage.
- Owner is a Nutzer and has final Besitzerrechte.

**Validation**

- New Tipprunden are private and active.
- Archiving is the normal V1 delete behavior.
- Endgueltiges Loeschen requires safety confirmation and owner/global App-Admin
  rights.

**State transitions**

```text
active -> archived
archived -> active
active -> deleted
archived -> deleted
deleted -> terminal
```

### Tipprunden-Mitgliedschaft

**Fields**

- `id`
- `tipprunde_id`
- `nutzer_id`
- `rolle`: `nutzer`, `admin`, `co_admin`
- `tipprunden_nickname`
- `status`: `active`, `removed`
- `joined_at`, `removed_at`

**Validation**

- One active membership per Nutzer per Tipprunde.
- Tipprunden-Nickname is required for active membership.
- Co-Admins cannot transfer Besitzerrechte, endgueltig loeschen Tipprunden or
  change global settings.

### Einladung

**Fields**

- `id`
- `tipprunde_id`
- `token`
- `expires_at`
- `status`: `active`, `revoked`, `expired`
- `created_by`
- `created_at`, `revoked_at`

**Validation**

- At most one active Einladungslink per Tipprunde.
- Default validity is 7 days.
- Creating a new active Einladung revokes the previous active Einladung.
- QR-Code encodes the active Einladungslink when a simple QR-Code library can be
  used without complex extra infrastructure. The Einladungslink remains the
  mandatory V1 path.

### Team/Verein

**Fields**

- `id`
- `tipprunde_id`
- `name`
- `logo_url`
- `external_source`
- `external_team_id`
- `external_url`
- `created_at`, `updated_at`

**Validation**

- Name is required inside a Tipprunde.
- Missing, invalid or non-loadable Logo-URL must fall back to neutral logo.
- External fields are optional and reserved for future import.

### Spieltag

**Fields**

- `id`
- `tipprunde_id`
- `name`
- `abschnitt`: `hinrunde`, `rueckrunde`, `nachholspiele`, `frei`
- `sort_order`
- `external_source`
- `external_league_id`
- `external_matchday_id`
- `external_url`
- `last_synced_at`
- `import_status`
- `created_at`, `updated_at`

**Validation**

- Name is required and can be freely chosen.
- A Spieltag can contain Spiele across multiple calendar dates.

### Spiel

**Fields**

- `id`
- `tipprunde_id`
- `spieltag_id`
- `heimteam_id`
- `auswaertsteam_id`
- `anstosszeit`
- `timezone`: fixed to `Europe/Berlin` in V1
- `status`: `geplant`, `beendet`, `verschoben`, `abgesagt`, `abgebrochen`
- `external_source`
- `external_match_id`
- `external_url`
- `last_synced_at`
- `import_status`
- `created_at`, `updated_at`

**Validation**

- Heimteam and Auswaertsteam are required and must differ.
- Anstosszeit is interpreted in Europe/Berlin.
- Planned Spiele are tippable until their own Anstosszeit.
- Verschobene Spiele keep existing Tipps and use the new Anstosszeit as
  Tippfrist.
- Abgesagte Spiele are not scored.
- Abgebrochene Spiele require Admin/Co-Admin decision before scoring.

**State transitions**

```text
geplant -> verschoben -> geplant
geplant -> beendet
geplant -> abgesagt
geplant -> abgebrochen
abgebrochen -> beendet
abgebrochen -> abgesagt
```

### Tipp

**Fields**

- `id`
- `spiel_id`
- `nutzer_id`
- `tipprunde_id`
- `heimtore_tipp`
- `auswaertstore_tipp`
- `submitted_at`
- `updated_at`

**Validation**

- One Tipp per Nutzer per Spiel.
- Scores are non-negative integers.
- A Tipp can be created or changed only before the Spiel's Anstosszeit.
- Nutzer can always see their own Tipps.
- Tipps anderer Nutzer are hidden until the Spiel's Tippfrist has passed.

### Ergebnis

**Fields**

- `id`
- `spiel_id`
- `heimtore`
- `auswaertstore`
- `entered_by`
- `entered_at`
- `updated_at`
- `is_changed_after_scoring`

**Validation**

- Scores are non-negative integers.
- Only Admins and Co-Admins can enter or change Ergebnisse.
- Finished Spiele are scored after Ergebnis entry.

### Ergebnis-Aenderung

**Fields**

- `id`
- `spiel_id`
- `old_heimtore`
- `old_auswaertstore`
- `new_heimtore`
- `new_auswaertstore`
- `changed_by`
- `changed_at`
- `reason`

**Validation**

- Created whenever an existing Ergebnis changes.
- Reason is optional in V1.

### Punktewertung

**Fields**

- `id`
- `spiel_id`
- `nutzer_id`
- `tipprunde_id`
- `punkte`
- `wertungstyp`: `exakt`, `tordifferenz`, `tendenz`, `keine`
- `calculated_at`

**Validation**

- Unique per Nutzer per Spiel.
- Recalculation overwrites or deterministically upserts the same row instead of
  adding duplicate Punkte.
- Punktesystem:
  - exact Ergebnis: 4 Punkte
  - correct Tendenz plus Tordifferenz: 3 Punkte
  - correct Tendenz: 2 Punkte
  - otherwise: 0 Punkte

### Rangliste

**Nature**

- Derived view or query result over Punktewertungen. Ranglisten are not manually
  stored, manually edited or treated as source data.

**Fields**

- `tipprunde_id`
- optional `spieltag_id`
- `nutzer_id`
- `tipprunden_nickname`
- `punkte`
- `platzierung`
- `anzahl_exakte_tipps`
- `anzahl_tordifferenz_tipps`
- `anzahl_tendenz_tipps`
- `anzahl_abgegebene_tipps`

**Validation**

- Sort by Punkte descending.
- Equal Punkte receive equal Platzierung.
- Equal Punkte sort alphabetically by Tipprunden-Nickname or Anzeigename.
- Statistics are visible but not hard tie-breakers in V1.

## Authorization Model

- Normal Nutzer can read only Tipprunden where they have active membership.
- Normal Nutzer can create/update only their own Tipps before Tippfrist.
- Admins and Co-Admins can manage Spieltage, Spiele, Teams/Vereine, Logos and
  Ergebnisse inside their Tipprunde.
- Only owner Admin and global App-Admin can perform endgueltiges Loeschen.
- Global App-Admin is minimally prepared for operational intervention.
- RLS policies must mirror these rules for all exposed tables.

## Derived Logic

### Idempotent Punkteberechnung

For each scorable Spiel:

1. Read the current Ergebnis.
2. Read all Tipps for the Spiel.
3. Calculate Punkte and Wertungstyp from the current Ergebnis and each Tipp.
4. Upsert one Punktewertung per Nutzer and Spiel.
5. Read Ranglisten as derived views/queries from Punktewertungen.

Repeated execution with unchanged Ergebnisse and Tipps must produce the same
Punktewertungen and Ranglisten.
