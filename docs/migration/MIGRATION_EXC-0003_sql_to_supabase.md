# Migration Report — EXC-0003

## Enterprise Migration

### Migration ID

MIG-EXC-0003

### Titel

Überführung der Quota-Migration aus `sql/` nach `supabase/migrations/`

### Version

1.0.0

### Status

**Completed** — Strukturmigration durchgeführt und verifiziert

### Datum

2026-07-30

### Kategorie

Structural Migration gemäß ESS-0001-CONTRACTS Chapter 14, *Migration Categories*

### ADR-Referenz

ADR-0011 — Bestandsschutz und Zielstruktur für die Root-Abweichungen

### Verantwortlich

Security Center (Eigentümer `supabase/` gemäß Chapter 16, *Directory Ownership*)

---

# Enterprise Purpose

Dieser Report dokumentiert die Auflösung der registrierten Ausnahme EXC-0003 gemäß
ESS-0001-CONTRACTS Chapter 14.

Er weist nach, dass die Überführung reproduzierbar, inhaltsneutral und rückführbar erfolgt ist.

---

# Abgrenzung

Diese Migration ist eine **Structural Migration**, keine **Data Migration**.

Es wurde ausschließlich ein Artefakt im Repository verschoben.

Es wurde **kein** SQL gegen eine Datenbank ausgeführt.

Es wurden **keine** Daten verändert.

Der Data Migration Contract aus Chapter 14 greift erst bei der Ausführung des enthaltenen
SQL gegen eine Zielumgebung und ist nicht Gegenstand dieser Migration.

---

# Ausgangszustand

```text
sql/
  001_user_quota.sql

supabase/migrations/
  20260711000000_iam.sql
```

**Verletzte Contracts**

| Contract | Verletzung |
|---|---|
| Chapter 2 — Repository Root | `sql/` ist kein zugelassenes Root-Verzeichnis |
| Chapter 2 — File Placement Rules | derselbe Artefakttyp an zwei Orten |
| Chapter 3 — Directory Responsibility | eine Verantwortung besitzt genau ein Verzeichnis |

---

# Zielzustand

```text
supabase/migrations/
  20260711000000_iam.sql
  20260730000000_user_quota.sql
```

`sql/` existiert nicht mehr.

---

# Durchführung

| Schritt | Maßnahme | Ergebnis |
|---|---|---|
| 1 | Prüfsumme des Ausgangsartefakts gebildet | `10c791c4…c80196` |
| 2 | Referenzanalyse über das gesamte Repository | keine Code-Referenz gefunden |
| 3 | Prüfung auf automatische Migrationsausführung | kein Runner vorhanden |
| 4 | Verschiebung als Git-Rename | Ähnlichkeit 100 % |
| 5 | Prüfsumme des Zielartefakts gebildet | `10c791c4…c80196` |
| 6 | Leeres Verzeichnis `sql/` entfernt | Root-Abweichung beseitigt |

**Prüfsummenvergleich**

```text
vorher   10c791c4e413c99b9825efdf6cf1482098cf6824e1b623a83fac73a722c80196
nachher  10c791c4e413c99b9825efdf6cf1482098cf6824e1b623a83fac73a722c80196
```

Die Prüfsummen sind identisch. Der Inhalt wurde nicht verändert.

---

# Bewusste Entscheidung zur Inhaltsneutralität

Die Datei wurde **byteidentisch** übernommen.

Es wurde ausdrücklich **kein** Provenienz-Header, kein ADR-Verweis und kein Migrationshinweis
in die SQL-Datei eingefügt, obwohl Chapter 7 solche Referenzen für Enterprise-Artefakte
grundsätzlich vorsieht.

**Begründung**

Bei einer Strukturmigration ist die byteweise Gleichheit der stärkste verfügbare Nachweis der
Inhaltsneutralität. Jede Ergänzung — auch eine rein redaktionelle — hätte die Prüfsumme
verändert und damit genau den Nachweis zerstört, den Chapter 14 für eine reproduzierbare
Migration verlangt.

Die Herkunftsdokumentation erfolgt deshalb ausschließlich in diesem Report und in der
Exception Registry.

Eine spätere inhaltliche Ergänzung der Datei ist als eigene Änderung mit eigener
Versionsbewertung möglich.

---

# Namensgebung

Die Zieldatei folgt der im Verzeichnis bereits verwendeten Konvention

```text
<YYYYMMDDHHMMSS>_<name>.sql
```

Gewählt wurde `20260730000000_user_quota.sql`.

**Begründung des Zeitstempels**

Die Git-Historie liefert kein belastbares Ursprungsdatum: sowohl `001_user_quota.sql` als auch
`20260711000000_iam.sql` wurden im selben Sammel-Commit `75c42a4` hinzugefügt. Ein früheres
Datum wäre eine nicht belegbare Behauptung.

Der Zeitstempel bezeichnet daher den Zeitpunkt, zu dem das Artefakt in den verwalteten
Migrationsbestand aufgenommen wurde. Diese Aussage ist nachprüfbar.

**Auswirkung auf die Ausführungsreihenfolge**

Keine. Die Quota-Migration erzeugt `public.user_quota` mit eigener Funktion, eigenem Trigger
und eigener Policy. Sie besitzt keine Abhängigkeit zur IAM-Migration — weder Fremdschlüssel
noch gemeinsame Objekte. Die lexikografische Einordnung nach der IAM-Migration ist damit
funktional folgenlos.

---

# Validierung

| Prüfung | Ergebnis |
|---|---|
| Inhalt unverändert | ✓ Prüfsummen identisch |
| Git-Rename erkannt | ✓ Ähnlichkeit 100 %, Historie erhalten |
| Keine Code-Referenz auf `sql/` | ✓ keine Treffer in `*.ts`, `*.tsx`, `*.json`, `*.yaml` |
| Kein automatischer Migrations-Runner | ✓ kein Verzeichnis-Scan auf `sql/` oder `supabase/migrations/` |
| Kein `supabase/config.toml` vorhanden | ✓ keine CLI-gesteuerte automatische Anwendung |
| Namenskonvention eingehalten | ✓ Zeitstempel-Format wie bestehende Migration |
| Root-Abweichung beseitigt | ✓ `sql/` existiert nicht mehr |
| Keine Datenbankänderung ausgeführt | ✓ ausschließlich Repository-Operation |

---

# Idempotenz des enthaltenen SQL

Für den Fall einer erneuten Ausführung gegen eine Umgebung, in der die Tabelle bereits
existiert, ist das enthaltene SQL vollständig wiederholbar formuliert:

```sql
create table if not exists public.user_quota (…)
create index if not exists idx_user_quota_email …
create or replace function public.touch_user_quota_updated_at() …
drop trigger if exists trg_touch_user_quota …
drop policy if exists "service_role_full_access" …
```

Eine erneute Anwendung verändert weder Struktur noch Daten.

Dies ist relevant, weil der Dateikopf angibt, das Skript sei bereits vor dem 0.5.0-Build gegen
Staging und Produktion ausgeführt worden. Die Aufnahme in den Migrationsbestand kann daher
nicht zu einem Fehler führen.

---

# Rollback

**Strategie**

Vollständige Umkehrung durch Rücknahme des Git-Renames.

```bash
mkdir -p sql
git mv supabase/migrations/20260730000000_user_quota.sql sql/001_user_quota.sql
```

**Voraussetzungen** keine

**Risiken** keine — es wurde kein Zustand außerhalb des Repositorys verändert

**Rollback-Tests** Prüfsummenvergleich nach Rücknahme

**Rollback-Version** identisch mit der Ausgangsversion, da inhaltsneutral

Ein Datenbank-Rollback ist nicht erforderlich und nicht möglich, da keine Datenbankoperation
stattgefunden hat.

---

# Befund während der Migration

## FND-EXC-0003-01 — Die Migration ist im aktuellen Codebestand verwaist

**Stufe** Medium

**Kategorie** Technische Schuld gemäß Chapter 12, *Technical Debt Contract*

**Nachweis**

Der Dateikopf lautet:

> "Backs `src/lib/freeTierLimits.ts`."

Die Analyse ergibt:

| Prüfung | Ergebnis |
|---|---|
| Existiert `src/lib/freeTierLimits.ts`? | nein |
| Existiert die Datei in der Git-Historie? | nein — kein einziger Commit |
| Referenzen auf `user_quota` in `*.ts` / `*.tsx` | keine |
| Referenzen auf die Tabelle in `server/` | keine |

Die Tabelle `public.user_quota` wird vom aktuellen Codebestand nicht verwendet. Das zugehörige
Modul existiert im Repository nicht und hat dort nie existiert.

**Bewertung**

Es sind zwei Erklärungen möglich, die aus dem Repository heraus nicht unterscheidbar sind:

1. Die Quota-Durchsetzung wurde entfernt oder nie in dieses Repository übernommen; die
   Migration ist ein Rückstand.
2. Die Tabelle wird von einer Komponente außerhalb dieses Repositorys verwendet.

**Bewusst nicht getroffene Entscheidung**

Die Datei wurde **nicht** gelöscht.

Eine Löschung wäre eine Entscheidung über einen möglicherweise produktiv genutzten
Datenbankzustand. Chapter 14 behält die Entfernung von Bestand ausdrücklich dem Platform
Director vor und verlangt zuvor den Nachweis, dass keine aktiven Abhängigkeiten bestehen.
Dieser Nachweis ist allein aus dem Repository nicht führbar.

**Empfehlung**

Klärung, ob `public.user_quota` in der Zielumgebung Daten enthält und von einer externen
Komponente gelesen wird. Je nach Ergebnis:

- verwendet → Quota-Durchsetzung im Code wiederherstellen oder Verwender dokumentieren
- nicht verwendet → Entfernung als eigene Data Migration mit Sicherung und Rollback

Bis zur Klärung bleibt die Migration unverändert im Bestand.

---

# Auswirkung auf die Exception Registry

| Feld | vorher | nachher |
|---|---|---|
| Status EXC-0003 | Time Limited | Revoked |
| Frist | 2026-09-30 | entfällt |
| Grund | — | Abweichung beseitigt |

Der Status `Revoked` ist gemäß Chapter 16 der zutreffende Endzustand einer nicht mehr
benötigten Ausnahme. Der Eintrag bleibt dauerhaft in der Registry erhalten und wird nicht
gelöscht.

---

# Auswirkung auf offene Befunde

| Befund | vorher | nachher |
|---|---|---|
| GAP-006 | zwei nicht zugelassene Root-Verzeichnisse (`server/`, `sql/`) | ein registriertes Root-Verzeichnis (`server/`, EXC-0001) |

Von den ursprünglich acht Root-Abweichungen ist die erste vollständig aufgelöst.

---

# Version

Diese Migration verändert keine Schnittstelle, kein Verhalten und keinen Datenbestand.

Versionsauswirkung gemäß Chapter 9: **Patch**.

Die tatsächliche Versionsvergabe obliegt dem Version Manager und ist bis zur Auflösung von
GAP-019 (vier widersprüchliche Versionsstände) ausgesetzt.

---

# Related Documents

ADR-0011 — Bestandsschutz und Zielstruktur für die Root-Abweichungen

`.ai/registry/exception-registry.json` — EXC-0003

`docs/architecture/ARCHITECTURE_GAP_REPORT.md` — GAP-006

ESS-0001-CONTRACTS Chapter 14 — Migration & Lifecycle Contracts

ESS-0001-CONTRACTS Chapter 16 — Repository Governance

---

# Version History

| Version | Status | Beschreibung |
|---|---|---|
| 1.0.0 | Completed | Strukturmigration `sql/` → `supabase/migrations/` durchgeführt und verifiziert |

---

# End of Document

MIG-EXC-0003

CAPITAL-AI Migration Report

Version 1.0.0
