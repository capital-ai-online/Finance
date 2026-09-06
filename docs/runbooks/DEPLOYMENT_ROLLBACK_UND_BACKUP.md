# CAPITAL-AI Runbook: Deployment-Rollback und Backup

## Document ID

RUNBOOK-0001

## Bezug

ARCH-AUDIT-0002, ADR-0037 sowie die Production-/Security-Governance von CAPITAL-AI.

Verwandte kanonische Dokumente:

- `docs/architecture/RENDER_PRODUCTION_CONFIGURATION_AUDIT.md`
- `docs/adr/ADR-0037-render-production-configuration-governance.md`
- `docs/runbooks/RENDER_PRODUCTION_EVIDENCE_HANDOFF.md`
- `docs/security/SECURITY_HARDENING_2026-08-29.md`
- `.github/workflows/ops-recovery-evidence.yml`
- `scripts/operations/recoveryDumpIntegrity.mjs`

## Status

Aktiv — Recovery-Baseline am **06.09.2026** erneut read-only gegen den verbundenen Provider korreliert; operativer Evidence-Harness im OPS-08-SEC-07-Branch implementiert, Ausführung noch nicht als PASS behauptet.

## Geltungsbereich

Dieses Runbook trennt bewusst zwei Recovery-Ebenen:

1. **Anwendung/Deployment:** Render-Service und Git-Stand.
2. **Daten:** Supabase Postgres und Nutzdaten.

Ein Rollback auf einer Ebene stellt die andere Ebene **nicht** automatisch wieder her.

Automatisierbare Vorbedingungen werden zusätzlich über `npm run predeploy:check` geprüft. Dieser
Gate ersetzt weder einen Restore-Test noch die hier beschriebenen Incident-Schritte.

---

## 1. Anwendungsebene: Render-Rollback

Der produktive Render-Service `Finance` nutzt Docker, Branch `main`, Region Frankfurt und
`healthCheckPath: /healthz`. Der read-only verifizierte Plattformzustand hat **Auto-Deploy
deaktiviert**. Production-Deployments bleiben damit an den vorgesehenen GitHub-/Governance-Pfad
gebunden und werden nicht allein durch einen Branch-Push ausgelöst.

### 1.1 Sofort-Rollback in Render

Wenn ein bereits aktivierter Deploy fachlich fehlerhaft ist:

1. Incident und aktuellen Production-Commit erfassen.
2. Im Render-Dashboard den letzten bekannten guten erfolgreichen Deploy anhand Commit-SHA und
   Evidence identifizieren.
3. Rollback dieses Deploys ausführen.
4. `/healthz` prüfen.
5. Zusätzlich die konkret betroffene fachliche Funktion, Auth/IAM und relevante Provider prüfen.
6. Deployment-/Incident-Evidence dokumentieren.

`/healthz` allein ist kein vollständiger fachlicher Regressionstest.

### 1.2 Nachvollziehbarer Git-Revert

Direkte Änderungen an `main` sind für CAPITAL-AI **nicht** der normale Recovery-Pfad. Wenn ein
Code-Revert erforderlich ist, wird ein frischer regelkonformer Branch aus dem dann aktuellen
`main` erstellt, der fehlerhafte Commit per `git revert` rückgängig gemacht und der Revert über den
normalen Human-gated PR-Pfad geführt. Die jeweils aktuelle Branch-Namenskonvention aus
`/AGENTS.md` ist verbindlich; historische `hotfix/*` Beispiele sind nicht authorisierend.

### 1.3 Grenzen eines Anwendung-Rollbacks

Ein Render- oder Git-Rollback:

- macht keine bereits ausgeführten Datenbankmutationen rückgängig;
- stellt keine gelöschten Storage-Objekte wieder her;
- ersetzt keine Secret-Rotation;
- ist kein vollständiger Infrastruktur-Zeitmaschinen-Snapshot.

Bei möglicher Datenkorruption gilt Abschnitt 2.

---

## 2. Datenebene: Supabase Backup und Wiederherstellung

### 2.1 Verifizierte Plattform-Baseline — 06.09.2026

Read-only gegen die aktive Supabase-Organisation und das Projekt verifiziert:

- Organisation: `AIFINANCIAL`
- Plan: **Free**
- Projekt: `ryzywoktpmyhwzxmstyu`
- Projektstatus: **ACTIVE_HEALTHY**
- Region: `eu-west-1`
- Postgres: **17.6.1.127** / Engine 17
- `auth.users`: **5** Zeilen zum Korrelationszeitpunkt
- `auth.identities`: **5** Zeilen zum Korrelationszeitpunkt
- Supabase Storage: **0 Buckets / 0 Objects** zum Korrelationszeitpunkt

Die aktuelle Supabase-Dokumentation unterscheidet klar zwischen den Plänen:

- automatische tägliche Plattform-Backups werden für **Pro, Team und Enterprise** bereitgestellt;
- Free-Projekte sollen ihre Daten regelmäßig selbst exportieren;
- Point-in-Time Recovery (PITR) ist als Add-on für **Pro, Team und Enterprise** vorgesehen und
  setzt mindestens Small Compute voraus;
- PITR erreicht laut aktueller Provider-Dokumentation im Worst Case ein RPO von ungefähr zwei
  Minuten, ist aber unter dem aktuell verifizierten Free-Plan keine verfügbare CAPITAL-AI-Baseline.

Damit darf CAPITAL-AI unter dem aktuell verifizierten Free-Plan **keine automatische tägliche
Provider-Retention und kein PITR als Recovery-Garantie behaupten**.

### 2.2 Supabase-Dump-Semantik und Recovery-Grenze

Der aktuelle Supabase-CLI-Vertrag unterscheidet Schema- und Datensicherung:

- der normale Schema-Dump filtert providerverwaltete Schemas wie `auth` und `storage`, weil deren
  Struktur vom Ziel-Supabase bereitgestellt wird;
- der dokumentierte `--data-only --use-copy`-Dump enthält dagegen die relevanten Auth-/Storage-
  Daten, einschließlich `auth.users`;
- Supabase Storage **Binärobjekte** liegen außerhalb des logischen Datenbank-Dumps und benötigen
  einen eigenen Backup-/Transfer-Pfad.

Für CAPITAL-AI folgt daraus ein fail-closed Vertrag:

1. `auth.users` und `auth.identities` müssen im produktionsbezogenen Datendump vorhanden sein;
2. `storage.buckets` und `storage.objects` müssen als Datenbank-Metadaten vorhanden sein;
3. solange kein Binärobjekt-Backup implementiert und autorisiert ist, muss der Recovery-Workflow
   fehlschlagen, sobald `storage.objects` mehr als `0` Zeilen enthält;
4. ein leerer Storage-Zustand darf als aktueller, eng begrenzter Zustand verwendet werden, aber
   nicht als dauerhafte Annahme.

### 2.3 OPS-08-SEC-07 Recovery Objectives

Die folgenden Werte sind der owner-directed technische Zielvertrag für den aktuellen Free-Plan-
Fallback. Sie sind **Ziele**, keine bereits gemessenen Zusicherungen:

| Ziel | Wert | Begründung | Evidence-Gate |
|---|---:|---|---|
| Datenbank-RPO | **≤ 24 Stunden** | täglicher, verschlüsselter logischer Export auf separatem Provider-Speicher | erst `MEASURED/OPERATING`, wenn wiederkehrende erfolgreiche Runs mit Zeitstempel/Hash vorliegen |
| Datenbank-Restore-RTO | **≤ 60 Minuten** | isolierter Restore eines vollständigen logischen Backup-Sets inkl. Integritätsprüfung | erst `MEASURED`, wenn mindestens ein isolierter Drill erfolgreich und zeitlich gemessen ist |
| Full-Service-RTO | **UNVERIFIED / nicht aus DB-Restore ableiten** | Render, Provider-Konfiguration, Secrets und externe Dienste haben eigene Recovery-Semantik | eigener End-to-End-Recovery-Drill erforderlich |

Ein einmaliger Dump oder ein grün gerenderter Workflow-Code beweist weder RPO noch RTO. Security-
`VERIFIED/CLOSED` bleibt ausschließlich bei `CAPITAL-AI-SEC`.

### 2.4 Kanonischer Free-Plan Evidence-Harness

`.github/workflows/ops-recovery-evidence.yml` operationalisiert den bestehenden Runbook-Vertrag,
ohne eine zweite Recovery-Architektur einzuführen:

- täglicher Schedule `02:17 UTC` plus manueller Drill-Modus;
- Ausführung ausschließlich auf `main`;
- exakter Checkout von `github.sha` mit immutable Action-Pin und ohne persistierte Git-Credentials;
- zusätzliche fail-closed Aktivierung über Repository-Variable
  `OPS_RECOVERY_EXECUTION_ENABLED=true`;
- Source-Korrelation auf das freigegebene Supabase-Projekt `ryzywoktpmyhwzxmstyu`;
- Supabase CLI auf eine konkrete Version gepinnt;
- logischer Export von Rollen, Schema und Daten;
- pre-encryption Coverage-Gate über `scripts/operations/recoveryDumpIntegrity.mjs`;
- explizite Auth-Coverage über `auth.users` und `auth.identities`;
- explizite Storage-Metadaten-Coverage über `storage.buckets` und `storage.objects`;
- fail-closed Abbruch bei vorhandenen Storage-Objekten, solange kein Binary-Backup existiert;
- SHA-256-Evidence für Klartextbestandteile vor Löschung;
- client-seitige `age`-X25519-Verschlüsselung;
- nur das **verschlüsselte** Backup plus nicht-sensitive JSON-Evidence wird als GitHub-Actions-
  Artefakt abgelegt;
- Retention: 35 Tage, damit mindestens 30 tägliche Generationen überlappend belegbar sind;
- Restore-Drill ausschließlich in einer isolierten lokalen Supabase-Instanz des GitHub Runners;
- kein Workflow-Schritt enthält einen Production-`restore`, Provider-Planwechsel oder andere
  Production-Mutation.

Der Workflow erwartet folgende geschützte Inputs, speichert deren Werte aber nicht im Repository:

| Input | Typ | Zweck |
|---|---|---|
| `SUPABASE_DB_URL` | GitHub Secret | read-only Quelle für logischen Dump; muss zum erlaubten Project Ref korrelieren |
| `OPS_RECOVERY_AGE_RECIPIENT` | GitHub Variable | öffentlicher X25519-Empfänger zum Verschlüsseln |
| `OPS_RECOVERY_AGE_IDENTITY` | GitHub Secret | private Identität nur für den manuellen isolierten Restore-Drill |
| `OPS_RECOVERY_EXECUTION_ENABLED` | GitHub Variable | expliziter Execution Switch; Default/fehlend = kein Backup-Job |

Das Setzen oder Ändern dieser GitHub Secrets/Variablen ist **nicht** durch dieses Repository-Paket
autorisiert. Es ist eine separate geschützte External-/Execution-Host-Konfiguration.

### 2.5 Backup-Evidence Contract

Für jeden erfolgreichen produktionsbezogenen Backup-Lauf werden mindestens erfasst:

- UTC Start/Ende;
- Source Project Ref ohne Secret-Werte;
- Repository/Commit/Workflow-Run-Identität;
- Backup-Dauer;
- Größe der Klartextbestandteile vor Löschung;
- SHA-256 von Rollen-, Schema- und Datenexport;
- Anzahl erfasster `public`-Relationen;
- Anzahl und Row Counts der recovery-kritischen Auth-Relationen;
- Anzahl und Row Counts der recovery-kritischen Storage-Metadatenrelationen;
- expliziter Storage-Binary-Coverage-Status;
- Größe und SHA-256 des verschlüsselten Artefakts;
- Verschlüsselungsverfahren;
- Off-site-Ziel und Retention;
- RPO-Ziel und wahrheitsgemäßer Status;
- Restore-Drill-Status, sofern angefordert;
- ausdrückliche Kennzeichnung, dass Security Closure nicht behauptet wird.

### 2.6 Isolierter Restore-Drill

Restore niemals ungeprüft direkt über eine produktive Datenbank ausführen. Der kanonische Drill im
Evidence-Harness:

1. entschlüsselt das Backup nur im kurzlebigen GitHub Runner;
2. startet eine lokale, isolierte Supabase-Instanz;
3. spielt Rollen, Schema und Daten mit `ON_ERROR_STOP` in einer Transaktion ein;
4. erzeugt erneut einen logischen Datendump des Restore-Ziels;
5. vergleicht alle `public`-Relationen sowie `auth.users`, `auth.identities`, `storage.buckets` und
   `storage.objects` über Row-Anzahl und order-unabhängigen SHA-256-Multiset-Fingerprint;
6. behandelt andere providerinterne Auth-/Storage-Hilfstabellen nicht als CAPITAL-AI-Vertrag,
   damit legitime providerseitige Versionsunterschiede keinen falschen Recovery-Fehler erzeugen;
7. misst die Restore-Dauer;
8. failt, wenn Integrität/Coverage nicht stimmt oder die Datenbank-Restore-Dauer über 3600 Sekunden
   liegt;
9. entfernt sensible temporäre Dateien und stoppt die lokale Supabase-Instanz.

Der Datenbank-Drill deckt **nicht** automatisch ab:

- Supabase Storage-Binärinhalte — der Workflow bleibt bei vorhandenen Objekten absichtlich
  fail-closed, bis ein eigener autorisierter Binary-Backup-Pfad existiert;
- externe Stripe-/AI-/Market-Data-Providerzustände;
- Render-Konfiguration oder Secrets;
- vollständige Service-Wiederanlaufzeit.

### 2.7 Strukturelle Wiederherstellung

`supabase/migrations/*.sql` ist die kanonische Schema-Historie. Sie kann die Struktur
rekonstruieren, **nicht** die Nutzdaten. Migrationen ersetzen daher kein Backup.

---

## 3. Incident-Ablauf

1. Incident klassifizieren: Code/Deploy, Konfiguration, Daten, Credential oder Kombination.
2. Aktuellen Production Commit, Render Deploy und relevante Provider-Evidence erfassen.
3. Schreibende Prozesse stoppen oder einschränken, wenn weitere Datenkorruption möglich ist.
4. Anwendung und Datenbank getrennt recovern.
5. Bei Credential-Incident: rotieren/revoken statt auf alte Secrets zurückzugehen.
6. Nach Recovery mindestens Health, Fachfunktion, Auth/IAM, Datenintegrität und Provider prüfen.
7. Root Cause, Recovery-Zeit und verbleibenden Datenverlust dokumentieren.
8. RPO/RTO-Evidence nur mit tatsächlich gemessenen Werten aktualisieren.

---

## 4. Pre-Deploy- und Recovery-Gates

`npm run predeploy:check` deckt automatisierbare Repository-Voraussetzungen ab, darunter
Deployment-Konfiguration, Migrationen und Supply-Chain-/Governance-Checks. Für Recovery gelten
zusätzlich folgende Gates:

- Main-/Commit-Identität bestätigt;
- Backup-Evidence vor destruktiver Datenmutation vorhanden;
- `auth.users` / `auth.identities` im Backup-Coverage-Gate vorhanden;
- Storage-Binary-Coverage entweder implementiert oder `storage.objects=0`;
- Restore-Ziel eindeutig vom Produktionsziel getrennt;
- Secret-Werte nicht in Logs, PRs oder Evidence kopiert;
- bei Produktionsrestore explizite Owner-Freigabe;
- nach Restore Datenintegritäts- und Auth/RLS-Verifikation;
- RPO/RTO-Zielwerte nicht als gemessene Werte ausgeben, solange die Evidence fehlt.

---

## 5. Provider-Referenzen

Provider-Verhalten ist vor einem realen Recovery erneut gegen den aktuellen Stand zu prüfen.

- Supabase Database Backups: `https://supabase.com/docs/guides/platform/backups`
- Supabase CLI Backup/Restore: `https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore`
- Supabase Production Checklist: `https://supabase.com/docs/guides/deployment/going-into-prod`
- Render Deploys: `https://render.com/docs/deploys`
- Render Rollbacks: `https://render.com/docs/rollbacks`
- Render Health Checks: `https://render.com/docs/health-checks`

---

## 6. OPS-08-SEC-07 Exit-Gate Status

Repository-seitig ist der wiederholbare Evidence-Harness implementiert. Das operative Exit Gate
bleibt bis zur tatsächlichen Execution offen:

- [x] Free-Plan-/Provider-Baseline current-state read-only korreliert;
- [x] aktuelle Auth- und Storage-Coverage read-only korreliert;
- [x] RPO-Ziel ≤24 h definiert;
- [x] Datenbank-Restore-RTO-Ziel ≤60 min definiert;
- [x] wiederkehrender verschlüsselter Off-site-Backup-Harness implementiert;
- [x] Auth-Coverage und Storage-Binary-Grenze fail-closed implementiert;
- [x] isolierter gemessener Restore-Drill im Harness implementiert;
- [ ] geschützte GitHub Inputs/Execution Switch separat konfiguriert;
- [ ] mindestens zwei aufeinanderfolgende geplante Backup-Runs erfolgreich und Evidence verfügbar;
- [ ] mindestens ein isolierter Restore-Drill erfolgreich, Auth/Public/Storage-Integrität PASS und Dauer gemessen;
- [ ] RPO aus tatsächlichen Backup-Zeitpunkten als `MEASURED/OPERATING` belegt;
- [ ] bei künftigem Supabase-Storage-Einsatz Binary-Backup vor Aktivierung/Weiterbetrieb des Recovery-Gates gelöst;
- [ ] Full-Service-RTO bleibt explizit separat oder wird durch eigenen E2E-Drill gemessen;
- [ ] CAPITAL-AI-SEC unabhängige Verifikation abgeschlossen.
