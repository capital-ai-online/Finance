# CAPITAL-AI Runbook: Deployment-Rollback und Backup

## Document ID

RUNBOOK-0001

## Bezug

ARCH-AUDIT-0002 (Enterprise FinTech Architecture Audit), Kapitel 14.5, Maßnahme H7
„Deployment-Rollback und Backup-Verfahren".

## Status

Aktiv

## Geltungsbereich

Dieses Runbook beschreibt, wie ein fehlgeschlagenes oder fehlerhaftes Produktiv-Deployment von
CAPITAL-AI zurückgerollt wird und wie die Datenbasis (Supabase) im Notfall wiederhergestellt
werden kann. Es deckt die Anwendungsebene (Render-Deployment) und die Datenebene (Supabase
Postgres) getrennt ab, weil beide unterschiedliche Wiederherstellungsmechanismen haben und ein
Rollback der einen Ebene die andere nicht automatisch mitzieht.

Automatisierter Teil dieses Runbooks: `npm run predeploy:check`
(`scripts/automation/verifyDeploymentReadiness.ts`). Das Skript prüft vor jedem Deploy
automatisierbare Vorbedingungen (siehe Abschnitt 4) und läuft als eigener Schritt in der
CI-Pipeline (`.github/workflows/ci.yml`). Es ersetzt dieses Runbook nicht — es verhindert nur
eine Teilmenge der Fehler, die sonst erst nach dem Deploy sichtbar würden.

---

## 1. Anwendungsebene: Rollback eines Render-Deployments

CAPITAL-AI läuft auf Render.com als Docker-Service (`render.yaml`, `runtime: docker`) mit
`healthCheckPath: /healthz`. Render nutzt diesen Health-Check für automatisches
Zero-Downtime-Deployment: ein neuer Deploy wird erst dann live geschaltet, wenn der neue
Container innerhalb der Render-eigenen Frist erfolgreich auf `/healthz` antwortet. Schlägt der
Health-Check fehl, bleibt die vorherige Version aktiv und der fehlerhafte Deploy wird nicht
ausgerollt — das ist der Regelfall und erfordert **kein manuelles Eingreifen**.

Manuelles Eingreifen ist nur nötig, wenn ein Deploy zwar den Health-Check besteht, sich aber im
Betrieb als fehlerhaft herausstellt (z. B. ein Bug, der erst bei echtem Nutzerverkehr auftritt,
oder ein funktionaler Regressionsfehler wie die in ARCH-AUDIT-0002 dokumentierten P0-Vorfälle).

### 1.1 Manueller Rollback über das Render-Dashboard

1. Render-Dashboard öffnen → Service `capital-ai` → Tab **Events** bzw. **Deploys**.
2. Den letzten bekannten funktionierenden Deploy identifizieren (Commit-Hash mit dem
   Produktiv-Code vor der fehlerhaften Änderung abgleichen, z. B. über `git log`).
3. Bei diesem Deploy-Eintrag **„Rollback to this deploy"** auswählen (Render führt dafür einen
   erneuten Build/Deploy des historischen Commits aus — es wird kein Container-Image
   zwischengespeichert und wiederverwendet).
4. Nach dem Rollback: `GET /healthz` gegen die Produktions-URL prüfen, danach die
   ursprünglich vom Vorfall betroffene Funktion manuell verifizieren.

### 1.2 Rollback per Git, falls das Dashboard nicht verfügbar ist

Da Render bei `push`-Trigger auf `main` automatisch deployt (`.github/workflows/ci.yml`
läuft für denselben Branch), ist ein Rollback auch über einen Revert-Commit möglich:

```bash
git fetch origin main
git revert <fehlerhafter-commit-hash> --no-edit
git push origin main
```

Dies löst denselben CI-Pipeline-Lauf und denselben Render-Auto-Deploy-Mechanismus wie jeder
reguläre Merge aus. Dieser Weg ist vorzuziehen, wenn der Fehler bereits genau einem Commit
zugeordnet werden kann, weil er im Git-Verlauf nachvollziehbar bleibt (im Gegensatz zum
Dashboard-Rollback, der keinen neuen Commit erzeugt).

### 1.3 Was ein Rollback NICHT abdeckt

Ein Rollback auf Anwendungsebene macht keine Datenbankänderungen rückgängig. Wenn der
fehlerhafte Deploy bereits Schreibzugriffe mit falscher Logik ausgeführt hat (z. B. fehlerhafte
Daten in Supabase geschrieben), muss das getrennt behandelt werden — siehe Abschnitt 2.

---

## 2. Datenebene: Supabase Backup und Wiederherstellung

Das aktive Supabase-Projekt ist `ryzywoktpmyhwzxmstyu` (Postgres 17, Region `eu-west-1`).

### 2.1 Wichtiger Hinweis zur tatsächlichen Backup-Konfiguration

**Dieses Runbook kann die tatsächlich aktive Backup-Stufe (Plan-Tier, Retention-Zeitraum,
Point-in-Time-Recovery-Fenster) nicht angeben.** Die dafür verfügbaren Werkzeuge in dieser
Session (`mcp__Supabase__get_project`) liefern Projekt-Metadaten (Region, Postgres-Version,
Status), aber keine Backup-/Retention-Konfiguration. Gemäß der No-Demo-Data-Policy
(`docs/DATENSCHUTZ_PROTOKOLL.md`) wird dieser Wert hier bewusst **nicht** geschätzt oder
angenommen.

**Vor dem ersten Ernstfall muss der Betreiber daher manuell verifizieren:**
Supabase-Dashboard → Projekt `AIFINANCIAL` → **Settings → Database → Backups**. Dort steht die
tatsächliche Backup-Frequenz und Aufbewahrungsdauer des aktuellen Plans. Dieser Wert sollte
nach Prüfung als Ergänzung in dieses Runbook eingetragen werden (Abschnitt 2.2), damit er beim
nächsten Vorfall sofort verfügbar ist, statt erneut nachgeschlagen werden zu müssen.

### 2.2 Verifizierte Backup-Konfiguration

*(Vom Betreiber auszufüllen, nachdem Abschnitt 2.1 im Dashboard geprüft wurde. Solange dieser
Abschnitt leer ist, gilt: Backup-Konfiguration nicht verifiziert.)*

- Plan-Tier: —
- Automatisches Backup-Intervall: —
- Retention-Zeitraum: —
- Point-in-Time-Recovery verfügbar: —

### 2.3 Wiederherstellung über die Supabase-eigene Backup-Funktion

Sofern laut Abschnitt 2.2 automatische Backups aktiv sind, ist die Supabase-eigene
Wiederherstellung der bevorzugte Weg (Dashboard → Database → Backups → gewünschten Zeitpunkt
auswählen → Restore). Dies überschreibt den aktuellen Datenbankzustand mit dem gewählten
historischen Stand für das gesamte Projekt — es gibt keine tabellen- oder zeilenweise
Teilwiederherstellung über diesen Weg.

### 2.4 Manuelle Sicherung per `pg_dump` (planunabhängiger Fallback)

Unabhängig vom Plan-Tier kann jederzeit ein manueller Dump erstellt werden, z. B. vor einer
riskanten Migration oder als zusätzliche Absicherung neben den automatischen Backups:

```bash
# Connection-String aus Supabase-Dashboard: Settings → Database → Connection string (URI)
pg_dump "postgresql://postgres:<PASSWORT>@db.ryzywoktpmyhwzxmstyu.supabase.co:5432/postgres" \
  --format=custom \
  --file="capital-ai-backup-$(date +%Y%m%d-%H%M%S).dump"
```

Wiederherstellung eines solchen Dumps (z. B. in ein neues/leeres Projekt zur Untersuchung, oder
zurück in das bestehende Projekt im Notfall):

```bash
pg_restore --dbname="postgresql://postgres:<PASSWORT>@<ZIEL-HOST>:5432/postgres" \
  --clean --if-exists \
  capital-ai-backup-<ZEITSTEMPEL>.dump
```

`--clean --if-exists` lässt `pg_restore` bestehende Objekte vor der Wiederherstellung löschen,
statt bei bereits existierenden Tabellen abzubrechen. Diese Flags sind bei einer
Wiederherstellung in ein produktives, bereits befülltes Projekt entsprechend riskant und nur im
Notfall mit vorheriger Bestätigung zu verwenden — sie überschreiben den Zielstand vollständig.

### 2.5 Strukturelle Wiederherstellung aus `supabase/migrations/`

Unabhängig von jedem Backup ist das vollständige Datenbankschema (Tabellen, Indizes, RLS
Policies) als Sequenz versionierter Migrationsdateien im Repository nachvollziehbar
(`supabase/migrations/*.sql`, Namenskonvention `YYYYMMDDHHMMSS_beschreibung.sql`). Im
Extremfall — vollständiger Datenverlust ohne nutzbares Backup — lässt sich damit die
Datenbankstruktur (nicht die Daten selbst) durch sequenzielles Einspielen aller Migrationen in
ein neues Supabase-Projekt rekonstruieren:

```bash
for f in supabase/migrations/*.sql; do
  psql "postgresql://postgres:<PASSWORT>@<NEUES-PROJEKT-HOST>:5432/postgres" -f "$f"
done
```

Dies ersetzt kein Daten-Backup — nach der Strukturwiederherstellung sind alle Tabellen leer.
Es begrenzt aber den Schaden eines Totalverlusts auf reine Nutzdaten statt auf die gesamte
Anwendung.

---

## 3. Ablauf im Vorfall (Kurzfassung)

1. Vorfall eingrenzen: betrifft er die Anwendung (fehlerhafter Code/Deploy) oder die Daten
   (fehlerhafte/verlorene Datenbankinhalte) oder beides?
2. Anwendungsebene: Abschnitt 1.1 oder 1.2 — Rollback auf den letzten bekannten guten Deploy.
3. Datenebene, falls betroffen: Abschnitt 2.2 prüfen (welche Wiederherstellung steht laut
   verifizierter Konfiguration zur Verfügung), dann 2.3 oder 2.4 anwenden.
4. Nach jeder Wiederherstellung: `/healthz` prüfen, danach die ursprünglich betroffene Funktion
   gezielt manuell nachvollziehen (nicht nur den Health-Check als ausreichend werten — er prüft
   nur Prozess-Erreichbarkeit, keine fachliche Korrektheit).
5. Vorfall im Nachgang dokumentieren (Ursache, Zeitpunkt, betroffener Umfang, Behebung) —
   dieses Runbook selbst nennt keinen festen Ablageort dafür; bis ein solcher Prozess etabliert
   ist, genügt ein Eintrag im entsprechenden PR oder Issue.

---

## 4. Automatisierte Pre-Deploy-Prüfung

`npm run predeploy:check` (`scripts/automation/verifyDeploymentReadiness.ts`) prüft vor jedem
Deploy automatisiert:

1. `render.yaml` definiert `healthCheckPath` (Voraussetzung für Abschnitt 1 dieses Runbooks —
   ohne Health-Check kann Render einen fehlgeschlagenen Deploy nicht automatisch erkennen).
2. Jede im Server-Code über `getCleanEnv()` referenzierte Umgebungsvariable ist entweder in
   `render.yaml` gelistet, Teil einer bekannten Alternativnamen-Gruppe, oder auf der bekannten
   Optional-Liste (hartkodierter Fallback im Code) — verhindert einen Deploy, der wegen einer
   fehlenden Pflichtvariable zur Laufzeit fehlschlägt oder eine Funktion fail-closed
   deaktiviert, ohne dass das vor dem Deploy auffällt.
3. `supabase/migrations/` ist nicht leer und jede Datei folgt der Zeitstempel-Namenskonvention
   (Voraussetzung für Abschnitt 2.5 dieses Runbooks).

Das Skript läuft als eigener Schritt in `.github/workflows/ci.yml` und bricht den CI-Lauf bei
einem Fehler ab (`process.exit(1)`). Es ist bewusst auf strukturelle, automatisierbare
Vorbedingungen begrenzt — es ersetzt weder die manuelle Backup-Verifikation aus Abschnitt 2.1
noch den fachlichen Nachvollzug aus Abschnitt 3, Schritt 4.

---

## Verwandte Dokumente

- `docs/architecture/ENTERPRISE_FINTECH_ARCHITECTURE_AUDIT.md` (ARCH-AUDIT-0002), Kapitel 14.5
- `render.yaml`
- `scripts/automation/verifyDeploymentReadiness.ts`
- `.github/workflows/ci.yml`
- `docs/DATENSCHUTZ_PROTOKOLL.md` — No-Demo-Data-Policy, Grund für den expliziten
  Nicht-Verifizierbar-Hinweis in Abschnitt 2.1
