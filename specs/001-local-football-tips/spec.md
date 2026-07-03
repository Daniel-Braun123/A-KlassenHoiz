# Feature Specification: A-KlassenHoiz Lokales Fussball-Tippspiel

**Feature Branch**: `main`

**Created**: 2026-07-03

**Status**: Draft

**Input**: User description: "Web-App A-KlassenHoiz: private mobile-first Tippspiel-App fuer lokale bayerische Fussballspiele mit Registrierung, privaten Tipprunden, manueller Spielverwaltung, Tippabgabe, Punkteberechnung, Ranglisten und PWA-Basisfunktionalitaet."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Private Tipprunde erstellen und verwalten (Priority: P1)

Als registrierter Nutzer moechte ich eine private Tipprunde erstellen, damit ich
Freunde, Mannschaftskollegen oder Vereinsmitglieder zu einem lokalen Tippspiel
einladen kann.

**Why this priority**: Ohne Tipprunde gibt es keinen fachlichen Kern der App.
Die Erstellung definiert Rollen, Mitgliedschaft, Einladungen und den Raum fuer
alle Spieltage, Tipps und Ranglisten.

**Independent Test**: Ein neuer Nutzer registriert sich, erstellt eine
Tipprunde, erhaelt Admin-Rechte, erzeugt einen Einladungslink und sieht die
Tipprunde in seiner eigenen Tipprunden-Auswahl.

**Acceptance Scenarios**:

1. **Given** ein registrierter Nutzer ohne Tipprunde, **When** er eine neue
   Tipprunde mit Namen erstellt, **Then** wird er als Tipprunden-Admin
   eingetragen und die Tipprunde ist privat.
2. **Given** ein Tipprunden-Admin, **When** er einen neuen Einladungslink
   erzeugt, **Then** wird der bisher aktive Einladungslink ungueltig, der neue
   Link ist 7 Tage gueltig und ein QR-Code kann auf denselben Link verweisen.
3. **Given** ein Tipprunden-Admin und ein Mitglied, **When** der Admin das
   Mitglied zum Co-Admin macht, **Then** darf dieses Mitglied Spieltage, Spiele,
   Teams/Vereine, Logos und Ergebnisse verwalten, ohne Besitzerrechte zu
   erhalten.
4. **Given** ein Tipprunden-Admin, **When** er eine Tipprunde archiviert oder
   per Sicherheitsabfrage endgueltig loescht, **Then** ist sie fuer normale
   Nutzung nicht mehr aktiv und die Aktion ist auf Besitzer/Admin oder globalen
   App-Admin beschraenkt.

---

### User Story 2 - Einer privaten Tipprunde beitreten (Priority: P1)

Als Nutzer moechte ich per Einladungslink oder QR-Code einer privaten Tipprunde
beitreten, damit ich an einem lokalen Tippspiel teilnehmen kann.

**Why this priority**: Der Beitritt ist die Voraussetzung fuer Teilnahme,
Tippabgabe und Ranglisten. Private Links halten die Runde bewusst geschlossen.

**Independent Test**: Ein Nutzer oeffnet einen gueltigen Einladungslink, meldet
sich an oder registriert sich, waehlt einen Tipprunden-Nickname und erscheint
als Mitglied der Tipprunde.

**Acceptance Scenarios**:

1. **Given** ein gueltiger Einladungslink, **When** ein angemeldeter Nutzer den
   Link oeffnet und einen Tipprunden-Nickname bestaetigt, **Then** ist er
   Mitglied der Tipprunde.
2. **Given** ein abgelaufener oder ungueltiger Einladungslink, **When** ein
   Nutzer ihn oeffnet, **Then** erhaelt er eine verstaendliche Meldung und tritt
   keiner Tipprunde bei.
3. **Given** ein Mitglied wurde entfernt, **When** es die Tipprunde oeffnen will,
   **Then** darf es Inhalte dieser Tipprunde nicht mehr sehen.

---

### User Story 3 - Spieltage, Spiele und Teams/Vereine manuell pflegen (Priority: P1)

Als Tipprunden-Admin oder Co-Admin moechte ich Spieltage, Spiele, Teams/Vereine und
Vereinslogos manuell pflegen, damit lokale Spielplaene ohne BFV-Import genutzt
werden koennen.

**Why this priority**: V1 soll ohne externe Datenquelle nutzbar sein. Manuelle
Pflege macht die App fuer lokale bayerische Ligen sofort einsetzbar.

**Independent Test**: Ein Admin erstellt Teams/Vereine, hinterlegt Logo-URLs,
erstellt einen Spieltag mit Hinrunde/Rueckrunde-Zuordnung und fuegt mehrere
Spiele mit Anstosszeiten hinzu.

**Acceptance Scenarios**:

1. **Given** ein Admin in einer Tipprunde, **When** er einen frei benannten
   Spieltag erstellt, **Then** kann dieser mehrere Spiele mit unterschiedlichen
   Kalendertagen und Uhrzeiten enthalten.
2. **Given** ein Spiel ist geplant, **When** der Admin es verschiebt, **Then**
   bleiben vorhandene Tipps erhalten und die neue Anstosszeit in der Zeitzone
   Europe/Berlin bestimmt die neue Tippfrist.
3. **Given** ein Team/Verein hat keine, eine ungueltige oder nicht ladbare
   Logo-URL, **When** es in Spielplan oder Tippmaske angezeigt wird, **Then**
   erscheint automatisch ein neutrales Fallback-Logo.

---

### User Story 4 - Kompletten Spieltag schnell tippen (Priority: P1)

Als Mitglied einer Tipprunde moechte ich die Spiele eines Spieltags schnell auf
dem Smartphone tippen und bis zur jeweiligen Tippfrist aendern koennen.

**Why this priority**: Die Tippabgabe ist der zentrale Nutzerwert. Mobile
Bedienung und schnelle Eingabe entscheiden, ob die App im Alltag genutzt wird.

**Independent Test**: Ein Mitglied oeffnet den aktuellen Spieltag auf dem Handy,
gibt fuer jedes noch offene Spiel einen Tipp ein, aendert einen Tipp vor Anpfiff
und kann ein bereits gesperrtes Spiel nicht mehr aendern.

**Acceptance Scenarios**:

1. **Given** ein Spiel mit zukuenftiger Anstosszeit, **When** ein Mitglied einen
   Tipp eingibt, **Then** wird der Tipp gespeichert und bleibt fuer den Nutzer
   sichtbar.
2. **Given** die Anstosszeit eines Spiels ist erreicht, **When** ein Mitglied den
   Tipp aendern will, **Then** ist die Tippaenderung fuer dieses Spiel gesperrt.
3. **Given** ein Spiel desselben Spieltags hat noch keine abgelaufene Tippfrist,
   **When** ein Mitglied dieses Spiel tippt, **Then** bleibt die Tippabgabe
   moeglich, auch wenn andere Spiele des Spieltags bereits gesperrt sind.
4. **Given** fremde Tipps fuer ein Spiel, **When** die Tippfrist noch nicht
   abgelaufen ist, **Then** sind diese Tipps fuer andere Mitglieder verborgen.

---

### User Story 5 - Ergebnisse eintragen und Punkte berechnen (Priority: P1)

Als Tipprunden-Admin oder Co-Admin moechte ich Ergebnisse eintragen und aendern,
damit Punkte und Ranglisten automatisch korrekt aktualisiert werden.

**Why this priority**: Ohne Ergebnisverwaltung und Punkteberechnung ist die
Tipprunde nicht auswertbar.

**Independent Test**: Ein Admin traegt ein Ergebnis ein, die App berechnet
Punkte fuer alle abgegebenen Tipps nach dem definierten Punktesystem und die
Ranglisten aktualisieren sich.

**Acceptance Scenarios**:

1. **Given** Ergebnis `2:1` und Tipp `2:1`, **When** das Spiel gewertet wird,
   **Then** erhaelt der Nutzer 4 Punkte.
2. **Given** Ergebnis `2:1` und Tipp `3:2`, **When** das Spiel gewertet wird,
   **Then** erhaelt der Nutzer 3 Punkte.
3. **Given** Ergebnis `2:1` und Tipp `1:0`, **When** das Spiel gewertet wird,
   **Then** erhaelt der Nutzer 2 Punkte.
4. **Given** Ergebnis `1:1` und Tipp `2:2`, **When** das Spiel gewertet wird,
   **Then** erhaelt der Nutzer 3 Punkte.
5. **Given** ein bereits gewertetes Ergebnis wird geaendert, **When** die
   Aenderung gespeichert wird, **Then** werden Punkte und Ranglisten automatisch
   neu berechnet und die Ergebnis-Aenderung wird historisiert.
6. **Given** dieselben Ergebnisse und Tipps werden mehrfach neu berechnet,
   **When** die Punkteberechnung erneut ausgefuehrt wird, **Then** entsteht
   immer derselbe korrekte Punkte- und Ranglistenstand.

---

### User Story 6 - Ranglisten und Ergebnisse ansehen (Priority: P2)

Als Mitglied einer Tipprunde moechte ich Gesamt- und Spieltagsranglisten sowie
vergangene Spieltage sehen, damit ich meinen Stand und die Entwicklung der Runde
verfolgen kann.

**Why this priority**: Ranglisten machen die Tipprunde motivierend und geben
Rueckmeldung nach jedem gewerteten Spieltag.

**Independent Test**: Ein Mitglied oeffnet Gesamt- und Spieltagsrangliste,
sieht Punkte, Platzierungen, eigene Werte und vergangene Ergebnisse.

**Acceptance Scenarios**:

1. **Given** mehrere Mitglieder haben Punkte, **When** die Gesamtrangliste
   geoeffnet wird, **Then** werden Mitglieder nach Gesamtpunkten absteigend
   sortiert.
2. **Given** zwei Mitglieder haben gleich viele Punkte, **When** die Rangliste
   angezeigt wird, **Then** erhalten sie dieselbe Platzierung und werden
   innerhalb der Punktgleichheit alphabetisch nach Tipprunden-Nickname oder
   Anzeigename sortiert.
3. **Given** ein Spieltag ist ausgewaehlt, **When** die Spieltagsrangliste
   geoeffnet wird, **Then** werden nur die Punkte dieses Spieltags beruecksichtigt.

---

### User Story 7 - Mobile App-aehnliche Nutzung (Priority: P2)

Als Nutzer moechte ich A-KlassenHoiz auf dem Smartphone einfach nutzen und zum
Homescreen hinzufuegen koennen, damit sich die Web-App wie eine kleine Sport-App
anfuehlt.

**Why this priority**: Die Zielnutzung findet vor allem auf dem Handy statt,
oft kurz vor Spielbeginn oder unterwegs.

**Independent Test**: Ein Nutzer oeffnet die App auf dem Smartphone, navigiert
zu Tippabgabe, Rangliste und aktuellem Spieltag und kann die App mit Icon und
passendem Namen zum Homescreen hinzufuegen.

**Acceptance Scenarios**:

1. **Given** ein Nutzer hat genau eine Tipprunde, **When** er sich anmeldet,
   **Then** landet er direkt auf der Startseite dieser Tipprunde.
2. **Given** ein Nutzer hat mehrere Tipprunden, **When** er sich anmeldet,
   **Then** sieht er zuerst eine Tipprunden-Auswahl und kann die aktive
   Tipprunde wechseln.
3. **Given** ein Nutzer ist in keiner Tipprunde, **When** er sich anmeldet,
   **Then** sieht er eine Onboarding-Seite mit Tipprunde erstellen und per Link
   oder QR-Code beitreten.
4. **Given** keine Internetverbindung, **When** der Nutzer eine Aktion ausfuehrt,
   **Then** erhaelt er eine einfache Meldung, dass keine Verbindung besteht.

### Edge Cases

- Ein Nutzer versucht, dieselbe E-Mail-Adresse mehrfach zu registrieren.
- Ein Nutzer oeffnet einen abgelaufenen, ungueltigen oder bereits ersetzten
  Einladungslink.
- Ein eingeloggter Nutzer versucht, eine Tipprunde zu sehen, in der er kein
  Mitglied ist.
- Ein normaler Nutzer versucht, Admin-Funktionen oder fremde Tipps zu aendern.
- Ein Spiel wird verschoben, nachdem bereits Tipps abgegeben wurden.
- Ein Spiel wird abgesagt und darf nicht gewertet werden.
- Ein Spiel wird abgebrochen und muss entweder mit offiziellem Ergebnis gewertet
  oder aus der Wertung genommen werden.
- Ein Ergebnis wird nachtraeglich geaendert, nachdem Punkte und Ranglisten
  bereits berechnet wurden.
- Ein Team/Verein hat keine, eine ungueltige oder eine nicht ladbare Logo-URL.
- Zwei oder mehr Mitglieder haben dieselbe Punktzahl in einer Rangliste.
- Ein Nutzer gehoert mehreren Tipprunden an und wechselt zwischen ihnen.
- Fremde Tipps duerfen vor Ablauf der jeweiligen Tippfrist nicht sichtbar sein.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow Nutzer to register and log in with a unique
  email address and password.
- **FR-002**: The system MUST require each Nutzer to have a global Anzeigename.
- **FR-003**: The system MUST prevent duplicate registration with the same email
  address.
- **FR-004**: The system MUST allow Nutzer to use the app immediately after
  registration without mandatory email confirmation in V1.
- **FR-005**: The system MUST support normal Nutzer, Tipprunden-Admins, Co-Admins
  and a minimal global App-Admin role.
- **FR-006**: The system MUST make the creator of a Tipprunde its initial
  Tipprunden-Admin.
- **FR-007**: Tipprunden-Admins MUST be able to edit and archive their
  Tipprunde in V1; archiving is the standard form of deletion for normal use.
- **FR-008**: Tipprunden-Admins MUST be able to appoint and remove Co-Admins.
- **FR-009**: Tipprunden-Admins MUST retain final Besitzerrechte that Co-Admins do
  not have.
- **FR-010**: Co-Admins MUST be able to manage Spieltage, Spiele,
  Teams/Vereine, Logos und Ergebnisse within their Tipprunde.
- **FR-011**: Co-Admins MUST NOT be able to endgueltig loeschen a Tipprunde,
  transfer Besitzerrechte or change global settings.
- **FR-012**: Endgueltiges Loeschen of a Tipprunde MUST require an explicit
  safety confirmation and MUST be restricted to the Besitzer/Admin or global
  App-Admin.
- **FR-013**: The global App-Admin role and permission model MUST be minimally
  prepared in V1 for misuse or operational intervention, but a complete global
  admin interface is not required in V1.
- **FR-014**: The system MUST allow a Nutzer to belong to multiple private
  Tipprunden.
- **FR-015**: The system MUST keep Tipprunden private in V1; they MUST NOT be
  public or searchable.
- **FR-016**: The system MUST allow joining a Tipprunde only through a valid
  Einladungslink or QR-Code.
- **FR-017**: Each Tipprunde MUST have at most one active Einladungslink in V1.
- **FR-018**: Einladungslinks MUST expire after 7 days by default.
- **FR-019**: When an Admin generates a new Einladungslink for a Tipprunde, the
  previous Einladungslink MUST become invalid.
- **FR-020**: A QR-Code MUST point to the same Einladungsziel as its
  Einladungslink when QR-Code generation is available with reasonable effort.
- **FR-021**: Any logged-in Nutzer with a valid Einladungslink MUST be able to
  join immediately without manual Admin approval in V1.
- **FR-022**: Tipprunden-Admins MUST be able to remove Mitglieder from their
  Tipprunde.
- **FR-023**: The system MUST allow each Nutzer to set a Tipprunden-Nickname per
  Tipprunde that may differ from the global Anzeigename.
- **FR-024**: The system MUST allow Admins and Co-Admins to create, edit and
  delete Spieltage.
- **FR-025**: A Spieltag MUST be a freely named league round or section, not
  necessarily a single calendar date.
- **FR-026**: The system MUST allow a Spieltag to be assigned to Hinrunde,
  Rueckrunde or a comparable free section such as Nachholspiele.
- **FR-027**: The system MUST allow a Spieltag to contain multiple Spiele with
  different calendar dates and Anstosszeiten.
- **FR-028**: The system MUST interpret all Anstosszeiten and Tippfristen in V1
  in the Europe/Berlin time zone.
- **FR-029**: The system MUST allow Admins and Co-Admins to create, edit and
  delete Spiele manually in V1.
- **FR-030**: Each Spiel MUST have Heimteam, Auswaertsteam, Anstosszeit,
  Spieltag and Status.
- **FR-031**: The system MUST support Spiel statuses planned, finished,
  postponed, cancelled and abandoned in V1.
- **FR-032**: Planned Spiele MUST be tippable until the Spiel's own Anstosszeit.
- **FR-033**: Postponed Spiele MUST keep existing Tipps and use the new
  Anstosszeit as the new Tippfrist.
- **FR-034**: Cancelled Spiele MUST not be scored.
- **FR-035**: Abandoned Spiele MUST not be scored automatically; Admins or
  Co-Admins decide whether an official Ergebnis is entered or the Spiel is not
  scored.
- **FR-036**: Finished Spiele MUST be scored after an Ergebnis has been entered.
- **FR-037**: The system MUST allow Admins and Co-Admins to manage Teams/Vereine
  manually.
- **FR-038**: The system MUST allow a Vereinslogo to be stored as an image URL
  in V1.
- **FR-039**: The system MUST automatically show a neutral Fallback-Logo when a
  Vereinslogo-URL is missing, invalid or cannot be loaded.
- **FR-040**: The system SHOULD preserve fields or concepts that allow future
  logo uploads or external logo sources without changing the user-facing
  meaning of Teams/Vereine.
- **FR-041**: The system MUST allow members to submit or update a numeric Tipp
  for each planned Spiel until that Spiel's Anstosszeit.
- **FR-042**: The system MUST lock each Spiel's Tipp independently once its
  Anstosszeit is reached.
- **FR-043**: The system MUST keep a Nutzer's own Tipps visible to that Nutzer
  at all times.
- **FR-044**: The system MUST keep Tipps anderer Nutzer hidden until the relevant
  Spiel's Tippfrist has passed.
- **FR-045**: The system MUST allow Admins and Co-Admins to enter and change
  Ergebnisse.
- **FR-046**: Normal Nutzer MUST only be able to view Ergebnisse, not enter or
  change them.
- **FR-047**: The system MUST automatically recalculate Punkte when an Ergebnis
  is entered or changed.
- **FR-048**: Punkteberechnung MUST be idempotent: repeated recalculation with
  the same Ergebnisse and Tipps MUST always produce the same correct Punkte and
  Ranglisten.
- **FR-049**: The system MUST automatically update Gesamt- and Spieltag-
  Ranglisten after Punkte recalculation.
- **FR-050**: Ergebnis changes MUST be historized with old Ergebnis, new
  Ergebnis, timestamp and the Admin or Co-Admin who made the change.
- **FR-051**: The system SHOULD allow an optional reason for an Ergebnis change.
- **FR-052**: The system MUST visibly mark a previously scored Ergebnis as
  changed for Nutzer in V1.
- **FR-053**: The system MUST award 4 Punkte when the exact Ergebnis is correct.
- **FR-054**: The system MUST award 3 Punkte when Tendenz and Tordifferenz are
  correct, including draws with different exact scores.
- **FR-055**: The system MUST award 2 Punkte when only the Tendenz is correct.
- **FR-056**: The system MUST award 0 Punkte when neither exact Ergebnis,
  Tendenz plus Tordifferenz, nor Tendenz is correct.
- **FR-057**: The system MUST provide a Gesamtrangliste per Tipprunde.
- **FR-058**: The system MUST provide a Spieltagsrangliste per Tipprunde and
  Spieltag.
- **FR-059**: Ranglisten MUST sort primarily by Punkte descending.
- **FR-060**: Mitglieder with equal Punkte MUST receive the same Platzierung, for
  example Platz 1, Platz 1, Platz 3.
- **FR-061**: Mitglieder with equal Punkte MUST be sorted alphabetically by
  Tipprunden-Nickname or Anzeigename within the same Platzierung.
- **FR-062**: The system SHOULD show statistics for exact Tipps, correct
  Tordifferenz-Tipps, correct Tendenz-Tipps and submitted Tipps in V1, but these
  statistics MUST NOT be hard tie-breakers.
- **FR-063**: After login, the system MUST open the only Tipprunde directly when
  the Nutzer belongs to exactly one Tipprunde.
- **FR-064**: After login, the system MUST show a Tipprunden selection when the
  Nutzer belongs to multiple Tipprunden.
- **FR-065**: After login, the system MUST show onboarding actions to create a
  Tipprunde or join by Einladung when the Nutzer belongs to no Tipprunde.
- **FR-066**: The system MUST remember the last active Tipprunde while still
  allowing the Nutzer to switch Tipprunden at any time.
- **FR-067**: Inside a selected Tipprunde, the system MUST make "Jetzt tippen",
  Rangliste and current Spieltag easy to reach.
- **FR-068**: The system MUST provide mobile-first screens suitable for quick
  Spieltag tipping on smartphones.
- **FR-069**: The system MUST provide PWA basics in V1: installability, web app
  manifest, app icon, theme color and homescreen-suitable behavior.
- **FR-070**: The system MUST show a simple no-connection message in V1 when
  connectivity is unavailable.
- **FR-071**: The system MUST NOT provide offline Tipp submission, push
  notifications, Tippfrist reminders or complex background synchronization in V1.
- **FR-072**: The system MUST explicitly remain a private Tippspiel app without
  real-money betting, stakes, payouts, odds, bookmaker functions or public
  betting features.
- **FR-073**: User-facing language MUST use terms such as Tippspiel, Tipp
  abgeben, Tipprunde, Spieltag, Spiel, Punkte, Rangliste and Anzeigename, and
  MUST avoid Wette, Einsatz, Quote and Auszahlung.
- **FR-074**: The system MUST NOT expose email addresses to other normal Nutzer.
- **FR-075**: Visible member identity MUST primarily use Anzeigename or
  Tipprunden-Nickname; real name is optional.
- **FR-076**: Only logged-in Nutzer MUST be able to see Tipprunden.
- **FR-077**: Nutzer MUST only see Tipprunden of which they are members, except
  for global App-Admin intervention.
- **FR-078**: Normal Nutzer MUST only be able to change their own Tipps until
  the relevant Tippfrist.
- **FR-079**: Admin and Co-Admin rights MUST be enforced for all protected
  actions.
- **FR-080**: The system MUST keep V1 independent from BFV import, scraping,
  automatic synchronization and BFV data availability.
- **FR-081**: The system SHOULD retain optional external-source metadata for
  future imports, such as external source, league ID, team ID, match ID,
  matchday ID, source URL, last sync time and import status.
- **FR-082**: The later technical plan SHOULD evaluate the existing Supabase
  project named "A-KlassenHoiz" as the preferred option for authentication,
  data storage, file storage and server-side logic, while this feature
  specification remains focused on business behavior.

### Key Entities *(include if feature involves data)*

- **Nutzer**: Registriertes Konto mit eindeutiger E-Mail-Adresse,
  passwortbasiertem Login, globalem Anzeigename und optionalem echtem Namen.
- **Tipprunde**: Private Tippspiel-Gruppe mit Name, Besitzer/Admin,
  Mitgliedern, Einladungen, Spieltagen, Spielen, Ranglisten und Lebenszyklus
  wie aktiv, archiviert oder endgueltig geloescht.
- **Tipprunden-Mitgliedschaft**: Beziehung zwischen Nutzer und Tipprunde mit
  Rolle, Tipprunden-Nickname, Mitgliedsstatus und Beitrittsdatum.
- **Rolle**: Berechtigungsstufe wie normaler Nutzer, Tipprunden-Admin, Co-Admin
  oder minimaler globaler App-Admin.
- **Einladung**: Zeitlich begrenzter Beitritt ueber den aktiven
  Einladungslink und optional einen QR-Code fuer genau eine Tipprunde.
- **Spieltag**: Frei benannte Ligarunde oder Abschnitt, optional gruppiert nach
  Hinrunde, Rueckrunde oder Nachholspiele, mit mehreren Spielen.
- **Spiel**: Begegnung innerhalb eines Spieltags mit Heimteam, Auswaertsteam,
  Anstosszeit in Europe/Berlin, Status, optionalem Ergebnis und optionalen
  externen Herkunftsdaten.
- **Team/Verein**: Manuell gepflegtes lokales Fussballteam oder lokaler Verein
  mit Name, optionaler Logo-URL und optionalen spaeteren externen IDs.
- **Tipp**: Vorhersage eines Nutzers fuer Heim- und Auswaertstore eines Spiels,
  aenderbar bis zur Anstosszeit dieses Spiels und sichtbar nach Tippregeln.
- **Ergebnis**: Offizielles oder von Admins eingetragenes Spielergebnis, das
  fuer die Wertung genutzt wird, wenn das Spiel gewertet werden darf.
- **Ergebnis-Aenderung**: Nachweis mit altem Ergebnis, neuem Ergebnis,
  Zeitpunkt, aenderndem Admin oder Co-Admin und optionalem Grund.
- **Punktewertung**: Berechnete Punkte fuer den Tipp eines Nutzers auf ein
  Spiel auf Basis von exaktem Ergebnis, Tendenz plus Tordifferenz, Tendenz oder
  keiner Uebereinstimmung.
- **Rangliste**: Sortierte Ansicht der Mitglieder und Punkte fuer die gesamte
  Tipprunde oder einen bestimmten Spieltag.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new Nutzer can register, create a private Tipprunde and generate
  an Einladungslink in under 5 minutes.
- **SC-002**: A Nutzer invited by Einladungslink or QR-Code can join a Tipprunde and set a
  Tipprunden-Nickname in under 2 minutes.
- **SC-003**: A Tipprunden-Admin can create one Spieltag with at least 8 Spiele,
  Teams/Vereine and Anstosszeiten in under 15 minutes after Teams/Vereine are known.
- **SC-004**: A Mitglied can submit Tipps for a Spieltag with at least 8 Spiele on a
  smartphone in under 3 minutes.
- **SC-005**: 100% of Spiele become locked for Tipp changes at their own
  Anstosszeit while later Spiele remain tippable.
- **SC-006**: For a sample set covering exact Ergebnis, Tendenz plus
  Tordifferenz, Tendenz only and wrong Tipps, Punkteberechnung matches the
  defined scoring rules in 100% of cases.
- **SC-007**: After an Ergebnis is entered or changed, Gesamt- and Spieltag-
  Ranglisten reflect recalculated Punkte without requiring manual Rangliste
  edits.
- **SC-008**: Mitglieder cannot see Tipps anderer Mitglieder for a Spiel before
  that Spiel's Tippfrist in 100% of tested privacy scenarios.
- **SC-009**: A mobile Nutzer can reach "Jetzt tippen", Rangliste and current
  Spieltag from inside a selected Tipprunde with no more than two taps.
- **SC-010**: The app can be added to a smartphone homescreen with a recognizable
  name and icon in V1.
- **SC-011**: No V1 user journey requires BFV data, scraping or automated import.
- **SC-012**: User-facing copy for the core journeys avoids real-money betting
  terms and consistently frames the product as a private Tippspiel.

## Assumptions

- V1 targets private local football Tipprunden in Bayern, including leagues such
  as A-Klasse, Kreisklasse and Kreisliga, without naming fixed BFV leagues or
  clubs.
- Email confirmation is not mandatory in V1, but email addresses remain unique
  login identifiers.
- The default Einladungslink validity is 7 days.
- QR-code support is part of V1 when it is achievable with reasonable effort; if
  it proves disproportionate during planning, the Einladungslink remains the
  mandatory V1 path.
- V1 uses manually entered Spieltage, Spiele, Teams/Vereine, Logo-URLs and
  Ergebnisse.
- BFV import, scraping and synchronization are explicitly outside V1 scope, but
  future external-source metadata may be represented in the domain.
- Logo upload, external logo sources, push notifications, offline tip submission,
  bonus questions, complex statistics, form curves, native apps, public
  Tipprunden and real-money features are outside V1 scope.
- The later technical plan will evaluate Supabase as the preferred technical
  option because a Supabase project named "A-KlassenHoiz" already exists, but
  the business specification does not require a specific implementation.
