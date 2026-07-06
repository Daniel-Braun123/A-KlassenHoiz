# Feature Specification: Rangliste nach Spieltag filtern

**Feature Branch**: `[002-rangliste-spieltag-filter]`

**Created**: 2026-07-06

**Status**: Draft

**Input**: User description: "Es soll möglich sein in der Rangliste nach Spieltage zu sortieren um zu sehen wie die jeweilige Tabelle an gewissen Spieltagen aussieht. Die Rangliste-Seite soll ein Dropdown haben. Bei Auswahl eines Spieltags sollen nur Punkte aus diesem Spieltag gezählt werden. Auswählbar sind alle Spieltage, die vollständig vorbei sind, also bei denen kein Spiel mehr nach dem aktuellen Datum liegt."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Spieltag in der Rangliste auswählen (Priority: P1)

Ein aktives Mitglied einer Tipprunde öffnet die Rangliste und kann dort über ein Dropdown zwischen der Gesamtrangliste und vergangenen Spieltagen wechseln. Wenn ein Spieltag ausgewählt wird, sieht das Mitglied die Tabelle nur für diesen Spieltag.

**Why this priority**: Der wichtigste Nutzen ist, dass Nutzer nicht nur den Gesamtstand sehen, sondern nachvollziehen können, wer an einem bestimmten Spieltag besonders gut getippt hat.

**Independent Test**: Kann vollständig getestet werden, indem eine Tipprunde mit mehreren vergangenen Spieltagen, Mitgliedern, Tipps und Punktewertungen geöffnet wird und das Dropdown auf einzelne Spieltage gestellt wird.

**Acceptance Scenarios**:

1. **Given** ein aktives Mitglied sieht die Rangliste einer Tipprunde, **When** es im Dropdown einen vergangenen Spieltag auswählt, **Then** zeigt die Tabelle nur Punkte und abgegebene Tipps dieses Spieltags.
2. **Given** ein aktives Mitglied hat einen Spieltag ausgewählt, **When** es im Dropdown wieder "Gesamt" auswählt, **Then** zeigt die Tabelle wieder die Gesamtrangliste über alle gewerteten Spiele.
3. **Given** ein Spieltag ist noch nicht vollständig vorbei, **When** das Mitglied die Ranglisten-Auswahl öffnet, **Then** ist dieser Spieltag nicht als Filteroption auswählbar.

---

### User Story 2 - Mobile Rangliste ohne horizontales Scrollen nutzen (Priority: P1)

Ein Nutzer öffnet die Rangliste auf dem Smartphone und kann den gewünschten Spieltag auswählen, ohne horizontal scrollen zu müssen. Die Rangliste bleibt kompakt und zeigt nur die wichtigsten Werte.

**Why this priority**: Die App ist mobile-first; Ranglisten müssen auf kleinen Bildschirmen schnell lesbar und bedienbar sein.

**Independent Test**: Kann auf einem Smartphone-Viewport getestet werden, indem die Rangliste geöffnet, das Dropdown bedient und die Tabelle ohne horizontales Scrollen geprüft wird.

**Acceptance Scenarios**:

1. **Given** ein Nutzer verwendet ein Smartphone, **When** er die Rangliste öffnet, **Then** sind Dropdown und Tabelle vollständig innerhalb der Bildschirmbreite sichtbar.
2. **Given** ein Nutzer wählt einen Spieltag auf dem Smartphone aus, **When** die Tabelle aktualisiert wird, **Then** bleiben Platzierung, Name, Punkte und abgegebene Tipps ohne horizontales Scrollen sichtbar.

---

### User Story 3 - Mitglieder mit 0 Punkten im Spieltag sehen (Priority: P2)

Ein Nutzer sieht in der Spieltagsrangliste alle aktiven Mitglieder der Tipprunde, auch wenn diese am ausgewählten Spieltag keine Punkte erzielt oder keinen Tipp abgegeben haben.

**Why this priority**: Die Spieltagsrangliste soll vollständig und vergleichbar sein, nicht nur die Mitglieder anzeigen, die Punktewertungen besitzen.

**Independent Test**: Kann getestet werden, indem ein vergangener Spieltag mit mehreren Mitgliedern geöffnet wird, von denen mindestens eines keine Punktewertung an diesem Spieltag hat.

**Acceptance Scenarios**:

1. **Given** ein aktives Mitglied hat am ausgewählten Spieltag keine Punktewertung, **When** die Spieltagsrangliste angezeigt wird, **Then** erscheint dieses Mitglied mit 0 Punkten.
2. **Given** mehrere Mitglieder haben am ausgewählten Spieltag 0 Punkte, **When** die Tabelle sortiert wird, **Then** erhalten sie gemäß bestehender Ranglistenlogik gleiche Platzierungen bei gleicher Punktzahl und werden innerhalb gleicher Punktzahl alphabetisch sortiert.

### Edge Cases

- Wenn eine Tipprunde keine vollständig vergangenen Spieltage hat, zeigt das Dropdown nur "Gesamt" und keine Spieltagsoptionen.
- Wenn ein vergangener Spieltag keine Punktewertungen enthält, zeigt die Spieltagsrangliste alle aktiven Mitglieder mit 0 Punkten.
- Wenn ein Spieltag mehrere Spiele enthält und mindestens ein Spiel noch in der Zukunft liegt, gilt der Spieltag nicht als vollständig vorbei und wird nicht als Filteroption angeboten.
- Wenn ein Spiel verschoben, abgesagt oder abgebrochen ist, zählt für die Filter-Verfügbarkeit weiterhin, ob keine zugehörige Anstoßzeit mehr nach dem aktuellen Zeitpunkt liegt.
- Wenn zwei Mitglieder dieselbe Punktzahl haben, bleibt die bestehende Regel für gleiche Platzierungen bestehen.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Die Rangliste-Seite MUSS ein Dropdown zur Auswahl des Ranglisten-Kontexts anzeigen.
- **FR-002**: Das Dropdown MUSS mindestens die Option "Gesamt" enthalten.
- **FR-003**: Das Dropdown MUSS alle vollständig vergangenen Spieltage der aktuellen Tipprunde als auswählbare Optionen enthalten.
- **FR-004**: Ein Spieltag gilt als vollständig vergangen, wenn kein Spiel dieses Spieltags eine Anstoßzeit nach dem aktuellen Zeitpunkt hat.
- **FR-005**: Noch laufende oder zukünftige Spieltage DÜRFEN nicht als Spieltagsfilter auswählbar sein.
- **FR-006**: Bei Auswahl von "Gesamt" MUSS die Rangliste die Gesamtrangliste der Tipprunde anzeigen.
- **FR-007**: Bei Auswahl eines Spieltags MUSS die Rangliste nur Punktewertungen aus diesem Spieltag berücksichtigen.
- **FR-008**: Die Spieltagsrangliste MUSS alle aktiven Mitglieder der Tipprunde anzeigen, auch wenn sie am ausgewählten Spieltag 0 Punkte haben.
- **FR-009**: Die Gesamtrangliste MUSS weiterhin alle aktiven Mitglieder der Tipprunde anzeigen, auch wenn sie insgesamt 0 Punkte haben.
- **FR-010**: Die Sortierung MUSS weiterhin nach Punkten absteigend erfolgen; gleiche Punktzahl MUSS gleiche Platzierung ergeben.
- **FR-011**: Innerhalb gleicher Punktzahl MUSS alphabetisch nach Tipprunden-Nickname oder, falls nicht vorhanden, Anzeigename sortiert werden.
- **FR-012**: Die Rangliste MUSS mobile-first dargestellt werden und ohne horizontales Scrollen nutzbar sein.
- **FR-013**: Die mobile Rangliste MUSS mindestens Platzierung, Name, Punkte und abgegebene Tipps anzeigen.
- **FR-014**: Die Begriffe in der Oberfläche MÜSSEN konsistent deutsch bleiben: Rangliste, Gesamt, Spieltag, Punkte, Tipps, Name.
- **FR-015**: Der Zugriff MUSS weiterhin auf aktive Mitglieder der jeweiligen Tipprunde beschränkt bleiben.

### Key Entities *(include if feature involves data)*

- **Ranglisten-Kontext**: Die aktuelle Auswahl, ob die Tabelle als Gesamtstand oder für einen bestimmten Spieltag angezeigt wird.
- **Spieltag**: Ein Abschnitt der Tipprunde mit mehreren Spielen, der als Filteroption verfügbar wird, sobald alle seine Spiele zeitlich vorbei sind.
- **Ranglisteneintrag**: Die Darstellung eines aktiven Mitglieds mit Platzierung, Name, Punkten und abgegebenen Tipps für den gewählten Kontext.
- **Aktives Mitglied**: Nutzer einer Tipprunde mit aktiver Mitgliedschaft, der in Ranglisten unabhängig von vorhandenen Punkten sichtbar sein muss.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% der aktiven Mitglieder einer Tipprunde erscheinen in Gesamt- und Spieltagsranglisten, auch mit 0 Punkten.
- **SC-002**: Nutzer können auf einem Smartphone-Viewport ohne horizontales Scrollen zwischen Gesamt- und Spieltagsrangliste wechseln.
- **SC-003**: Für einen ausgewählten Spieltag werden ausschließlich Punkte dieses Spieltags angezeigt; dies ist anhand einer Tipprunde mit mindestens zwei Spieltagen eindeutig prüfbar.
- **SC-004**: Zukünftige oder noch nicht vollständig vergangene Spieltage erscheinen in 0 Fällen als auswählbare Spieltagsfilter.
- **SC-005**: Ein Nutzer kann den Ranglisten-Kontext in höchstens zwei Interaktionen wechseln: Dropdown öffnen und Auswahl treffen.

## Assumptions

- Die bestehende Ranglistenlogik für Platzierungen, Sortierung und 0-Punkte-Mitglieder bleibt gültig und wird auf den ausgewählten Kontext angewendet.
- "Aktuelles Datum" bedeutet der Zeitpunkt, zu dem die Rangliste angezeigt wird.
- Die Spieltagsfilterung bezieht sich fachlich auf die bestehende Tipprunde und deren Spieltage.
- Die bestehende Anzeige mit kompakten Spalten `#`, `Name`, `P` und `Tipps` bleibt die mobile-first Basis.
