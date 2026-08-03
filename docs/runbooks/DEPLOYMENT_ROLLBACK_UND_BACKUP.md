# CAPITAL-AI Runbook: Deployment-Rollback und Backup

## Document ID

RUNBOOK-0001

## Bezug

ARCH-AUDIT-0002 (Enterprise FinTech Architecture Audit), Kapitel 14.5, Maßnahme H7
„Deployment-Rollback und Backup-Verfahren".

Zusätzliche Render-Governance seit 03.08.2026:

- `docs/architecture/RENDER_PRODUCTION_CONFIGURATION_AUDIT.md` (RENDER-AUDIT-0001)
- `docs/adr/ADR-0037-render-production-configuration-governance.md`
- `docs/runbooks/RENDER_PRODUCTION_EVIDENCE_HANDOFF.md`

Für aktuelle Render-Dashboard-/Service-Konfigurationsdetails ist `RENDER_PRODUCTION_EVIDENCE_HANDOFF.md` maßgeblich. Dieses Runbook behandelt den Recovery-Ablauf.

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
`healthCheckPath: /healthz`. Render nutzt diesen Health-Check für Deployment Readiness: ein neuer
Deploy wird erst dann live geschaltet, wenn die neue Instanz erfolgreich auf den konfigurierten
Health-Check antwortet. Schlägt der neue Deploy vor dem Traffic-Switch fehl, bleibt die vorherige
funktionierende Version aktiv.

**Wichtig:** `/healthz` bestätigt derzeit vor allem Prozess-Liveness und keine vollständige
fachliche Readiness aller externen Abhängigkeiten. ADR-0037 definiert deshalb die Weiterentwicklung
zu einem expliziten Readiness Contract.

Manuelles Eingreifen ist nötig, wenn ein Deploy zwar den Health-Check besteht, sich aber im
Betrieb als fehlerhaft herausstellt (z. B. ein Bug, der erst bei echtem Nutzerverkehr auftritt,
oder ein funktionaler Regressionsfehler wie die in ARCH-AUDIT-0002 dokumentierten P0-Vorfälle).

### 1.1 Manueller Rollback über das Render-Dashboard

Aktuelle Render-Semantik (erneut verifiziert 03.08.2026): Render kann bei einem Rollback auf einen
vorherigen erfolgreichen Deploy dessen vorhandenes Build-Artefakt wiederverwenden. Ein Rollback
ist deshalb nicht mit einem vollständigen Neu-Build des historischen Commits gleichzusetzen.

Ablauf:

1. Render-Dashboard öffnen → Service `capital-ai` → Tab **Deploys**.
2. Den letzten bekannten funktionierenden Deploy anhand von Commit-SHA, Zeitpunkt und Incident-
   Evidence identifizieren.
3. Bei diesem erfolgreichen Deploy **Rollback** auswählen.
4. Vor Bestätigung prüfen, dass der Ziel-Deploy tatsächlich die gewünschte Code-/Build-Version
   enthält und keine Datenbank-Rücksetzung erwartet wird.
5. Rollback ausführen.
6. Nach dem Rollback: Render Health Check und die ursprünglich betroffene Funktion gezielt
   verifizieren; ein grüner `/healthz` allein ist kein fachlicher Regressionstest.

#### Auto-Deploy-Schutz nach Dashboard-Rollback

Render deaktiviert beim Rollback über das Dashboard automatische Deploys. Das schützt davor,
dass ein nachfolgender Push den fehlerhaften Zustand unmittelbar wieder einführt.

Nach erfolgreicher Ursachenbehebung muss Auto-Deploy bewusst wieder auf den gemäß ADR-0037
freigegebenen Zustand gesetzt werden. Zielzustand für Production ist `After CI Checks Pass`
(`autoDeployTrigger: checksPass`), sobald Dashboard Evidence und GitHub Required Checks dies
bestätigen.

#### Was beim Render-Rollback nicht pauschal auf den historischen Zustand zurückkehrt

Ein Render-Rollback ist kein vollständiger Infrastruktur-Zeitmaschinen-Snapshot. Je nach
Konfiguration verwenden einzelne Service-Einstellungen weiterhin den aktuellen Zustand.
Insbesondere sind Persistent Disks und bestimmte gemeinsam genutzte Environment-Group-Zustände
separat zu betrachten. Vor einem Rollback mit Configuration Drift daher immer
`RENDER_PRODUCTION_EVIDENCE_HANDOFF.md` heranziehen.

### 1.2 Rollback per Git, falls ein nachvollziehbarer Revert gewünscht ist

Ein `git revert` ist eine **andere Recovery-Methode** als ein Render Instant Rollback. Er erzeugt
einen neuen Git-Commit, der die fehlerhafte Codeänderung zurücknimmt.

```bash
git fetch origin main
git revert <fehlerhafter-commit-hash> --no-edit
git push origin main
```

Ob und wann Render diesen Revert deployt, hängt von der tatsächlichen Auto-Deploy-Konfiguration
ab. Nach ADR-0037 soll Production erst nach bestandenen CI Checks deployen. Daher darf dieses
Runbook nicht mehr pauschal voraussetzen, dass jeder Push auf `main` sofort einen Render-Deploy
auslöst.

Dieser Weg ist sinnvoll, wenn:

- die Ursache klar einem Commit zugeordnet ist;
- der Revert selbst CI-/Security-Gates durchlaufen soll;
- der Git-Verlauf den Recovery-Schritt dauerhaft abbilden soll.

Ein Render Dashboard Rollback ist dagegen sinnvoll, wenn Time-to-Recovery wichtiger ist und ein
bekannter guter Build sofort wiederhergestellt werden soll.

### 1.3 Was ein Rollback NICHT abdeckt

Ein Rollback auf Anwendungsebene macht keine Datenbankänderungen rückgängig. Wenn der
fehlerhafte Deploy bereits Schreibzugriffe mit falscher Logik ausgeführt hat (z. B. fehlerhafte
Daten in Supabase geschrieben), muss das getrennt behandelt werden — siehe Abschnitt 2.

Zusätzlich gilt nach ADR-0037:

- lokaler Render-Dateisystemzustand ist ohne verifizierten Persistent Disk als ephemeral zu
  behandeln;
- ein Code-Rollback darf nicht als Wiederherstellung von Subscription-/Credit-Dateien betrachtet
  werden;
- Secret-Rotation wird niemals durch Rückkehr zu einem möglicherweise kompromittierten alten
  Secret ersetzt.

---

## 2. Datenebene: Supabase Backup und Wiederherstellung

Das aktive Supabase-Projekt ist `ryzywoktpmyhwzxmstyu` (Postgres 17, Region `eu-west-1`).

### 2.1 Wichtiger Hinweis zur tatsächlichen Backup-Konfiguration

**Dieses Runbook kann die tatsächlich aktive Backup-Stufe (Plan-Tier, Retention-Zeitraum,
Point-in-Time-Recovery-Fenster) nicht angeben.** Die dafür verfügbaren Werkzeuge in der
ursprünglichen Audit-Session lieferten Projekt-Metadaten, aber keine vollständige
Backup-/Retention-Konfiguration. Gemäß der No-Demo-Data-Policy wird dieser Wert bewusst **nicht**
geschätzt oder angenommen.

**Vor dem ersten Ernstfall muss der Betreiber daher manuell verifizieren:**
Supabase-Dashboard → Projekt → **Settings/Database/Backups** entsprechend der aktuellen Supabase-
UI. Dort steht die tatsächliche Backup-Frequenz und Aufbewahrungsdauer des aktuellen Plans.
Dieser Wert sollte nach Prüfung als Evidence ergänzt werden.

### 2.2 Verifizierte Backup-Konfiguration

*(Vom Betreiber auszufüllen, nachdem Abschnitt 2.1 im Dashboard geprüft wurde. Solange dieser
Abschnitt leer ist, gilt: Backup-Konfiguration nicht verifiziert.)*

- Plan-Tier: —
- Automatisches Backup-Intervall: —
- Retention-Zeitraum: —
- Point-in-Time-Recovery verfügbar: —

### 2.3 Wiederherstellung über die Supabase-eigene Backup-Funktion

Sofern laut Abschnitt 2.2 automatische Backups aktiv sind, ist die Supabase-eigene
Wiederherstellung der bevorzugte Weg. Vor jeder produktiven Wiederherstellung sind die aktuelle
Supabase-Dokumentation, der genaue Restore-Scope und der erwartete Datenverlust seit dem
Wiederherstellungspunkt zu prüfen.

### 2.4 Manuelle Sicherung per `pg_dump` (planunabhängiger Fallback)

Unabhängig vom Plan-Tier kann ein manueller Dump vor einer riskanten Migration als zusätzliche
Absicherung verwendet werden:

```bash
# SUPABASE_DB_URL vorher manuell und NUR lokal in der Shell setzen.
pg_dump "$SUPABASE_DB_URL" \
  --format=custom \
  --file="capital-ai-backup-$(date +%Y%m%d-%H%M%S).dump"
```

Wiederherstellung eines solchen Dumps:

```bash
# SUPABASE_RESTORE_TARGET_URL nur lokal in der Shell setzen.
pg_restore --dbname="$SUPABASE_RESTORE_TARGET_URL" \
  --clean --if-exists \
  capital-ai-backup-<ZEITSTEMPEL>.dump
```

`--clean --if-exists` kann bestehende Objekte löschen. Eine Anwendung gegen ein produktives,
befülltes Ziel ist deshalb ein destruktiver Datenbankvorgang und nur mit expliziter Production-
Freigabe zulässig.

### 2.5 Strukturelle Wiederherstellung aus `supabase/migrations/`

Unabhängig von jedem Backup ist das Datenbankschema als Sequenz versionierter Migrationen im
Repository nachvollziehbar (`supabase/migrations/*.sql`). Im Extremfall lässt sich damit die
Struktur — nicht die Nutzdaten — rekonstruieren.

```bash
for f in supabase/migrations/*.sql; do
  psql "$SUPABASE_DB_URL" -f "$f"
done
```

Dies ersetzt kein Daten-Backup.

---

## 3. Ablauf im Vorfall

1. Incident klassifizieren: Code/Deploy, Render Configuration, Daten, Secret oder Kombination?
2. Aktuellen Production Commit und Service Configuration Evidence erfassen.
3. Time-to-Recovery entscheiden:
   - Render Instant Rollback für schnellen bekannten guten Build;
   - Git Revert für nachvollziehbaren Code-Recovery-Pfad.
4. Wenn Daten betroffen sind: Anwendung und Datenbank getrennt behandeln.
5. Nach Recovery:
   - Health;
   - betroffene fachliche Funktion;
   - Auth/IAM;
   - relevante externe Provider;
   - Logs/Alerts
   prüfen.
6. Auto-Deploy-Zustand nach Render Dashboard Rollback bewusst kontrollieren.
7. Incident Evidence und Root Cause dokumentieren.

---

## 4. Automatisierte Pre-Deploy-Prüfung

`npm run predeploy:check` (`scripts/automation/verifyDeploymentReadiness.ts`) prüft vor Deploys
unter anderem:

1. `render.yaml` definiert `healthCheckPath`.
2. Statisch erkennbare serverseitige Environment-Variablen sind gegen Blueprint-/Alias-Listen
   geprüft.
3. `supabase/migrations/` besitzt gültige Migrationsdateien.
4. Dependency-/Lockfile-/SBOM-Policy.
5. Traceability, RAG Evidence und Prompt Registry.

### Bekannte Grenze seit RENDER-AUDIT-0001

Die Environment-Abdeckung ist **nicht vollständig**, wenn Schlüssel dynamisch zusammengesetzt
oder über Wrapper wie `getStripeVar(key)` an `getCleanEnv(key)` weitergegeben werden.

Beispiele, die daher separat durch ADR-0037 / Production Env Contract abgedeckt werden müssen:

```text
STRIPE_PRICE_ID_STARTER_MONTHLY
STRIPE_PRICE_ID_STARTER_YEARLY
STRIPE_PRICE_ID_PRO_MONTHLY
STRIPE_PRICE_ID_PRO_YEARLY
STRIPE_ID_FOUNDER / STRIPE_PRICE_ID_FOUNDER
STRIPE_PRICE_ID_EXPORT_PDF
```

Der bestehende Gate ist weiterhin wertvoll, darf aber bis zur zentralen Env-Contract-
Implementierung nicht als vollständiger Beweis der Render-Environment-Konfiguration gelten.

---

## 5. Render Configuration Recovery

Bei einer fehlerhaften Dashboard-/Blueprint-Konfigurationsänderung:

1. keine Secret-Werte in Tickets/PRs kopieren;
2. vorherigen Setting-Fingerprint/Evidence verwenden;
3. dokumentieren, welche Änderung einen Deploy/Restart ausgelöst hat;
4. Konfiguration zurücksetzen oder via verifiziertem Blueprint korrigieren;
5. neuen Deploy/Health/Smoke-Test abwarten;
6. Secret nur dann auf alten Wert setzen, wenn ausdrücklich bestätigt ist, dass es nicht
   kompromittiert wurde — bei Credential Incidents stattdessen rotieren/revoken;
7. Audit/ADR/Runbook aktualisieren.

---

## Verwandte Dokumente

- `docs/architecture/ENTERPRISE_FINTECH_ARCHITECTURE_AUDIT.md`
- `docs/architecture/RENDER_PRODUCTION_CONFIGURATION_AUDIT.md`
- `docs/adr/ADR-0037-render-production-configuration-governance.md`
- `docs/runbooks/RENDER_PRODUCTION_EVIDENCE_HANDOFF.md`
- `render.yaml`
- `Dockerfile`
- `scripts/automation/verifyDeploymentReadiness.ts`
- `.github/workflows/ci.yml`
- `docs/DATENSCHUTZ_PROTOKOLL.md`

## Provider-Referenzen

- Render Deploys: `https://render.com/docs/deploys`
- Render Rollbacks: `https://render.com/docs/rollbacks`
- Render Health Checks: `https://render.com/docs/health-checks`
- Render Persistent Disks: `https://render.com/docs/disks`

Provider-Verhalten ist bei jedem relevanten Recovery-Prozess erneut gegen den aktuellen Stand zu prüfen.
