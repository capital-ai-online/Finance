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

## Status

Aktiv — Recovery-Baseline zuletzt read-only verifiziert am **29.08.2026**.

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
`healthCheckPath: /healthz`. Der am 29.08.2026 read-only verifizierte Plattformzustand hat
**Auto-Deploy deaktiviert**. Production-Deployments bleiben damit an den vorgesehenen
GitHub-/Governance-Pfad gebunden und werden nicht allein durch einen Branch-Push ausgelöst.

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
Code-Revert erforderlich ist:

```bash
git fetch origin main
git switch -c hotfix/revert-<incident> origin/main
git revert <fehlerhafter-commit-hash> --no-edit
git push -u origin hotfix/revert-<incident>
```

Danach wird der Revert als Pull Request gegen den aktuellen `main` geprüft. Vor dem PR ist erneut
ein Main-Abgleich einschließlich Korrelations-/Konfliktprüfung durchzuführen. Die bestehenden
Required Checks und Owner-/Governance-Gates bleiben wirksam.

### 1.3 Grenzen eines Anwendung-Rollbacks

Ein Render- oder Git-Rollback:

- macht keine bereits ausgeführten Datenbankmutationen rückgängig;
- stellt keine gelöschten Storage-Objekte wieder her;
- ersetzt keine Secret-Rotation;
- ist kein vollständiger Infrastruktur-Zeitmaschinen-Snapshot.

Bei möglicher Datenkorruption gilt Abschnitt 2.

---

## 2. Datenebene: Supabase Backup und Wiederherstellung

### 2.1 Verifizierte Plattform-Baseline — 29.08.2026

Read-only gegen die aktive Supabase-Organisation und das Projekt verifiziert:

- Organisation: `AIFINANCIAL`
- Plan: **Free**
- Projekt: `ryzywoktpmyhwzxmstyu`
- Projektstatus: **ACTIVE_HEALTHY**
- Region: `eu-west-1`
- Postgres: **17.6.1.127** / Engine 17

Die aktuelle Supabase-Dokumentation unterscheidet klar zwischen den Plänen:

- automatische tägliche Plattform-Backups werden für **Pro, Team und Enterprise** bereitgestellt;
- Free-Projekte sollen ihre Daten regelmäßig selbst exportieren;
- Point-in-Time Recovery (PITR) ist als Add-on für **Pro, Team und Enterprise** vorgesehen und
  setzt mindestens Small Compute voraus.

Damit darf CAPITAL-AI unter dem aktuell verifizierten Free-Plan **keine automatische tägliche
Provider-Retention und kein PITR als Recovery-Garantie behaupten**.

### 2.2 Aktueller Recovery-Contract

| Merkmal | Verifizierter Stand | Governance-Folge |
|---|---|---|
| Plan | Free | keine Pro-/Team-/Enterprise-Backup-Garantie annehmen |
| Automatische tägliche Backups | für aktuellen Plan nicht als nutzbare Recovery-Baseline belegt | eigener Off-site-Dump erforderlich |
| Provider-Retention | nicht als nutzbare Free-Plan-Retention belegt | keine Retention-Zahl erfinden |
| PITR | unter aktuellem Plan nicht verfügbar | RPO kann nicht aus PITR abgeleitet werden |
| RPO | **UNVERIFIED**, bis ein wiederkehrender Off-site-Backup-Lauf mit Evidence existiert | Produktionsreife-Gap |
| RTO | **UNVERIFIED**, bis ein Restore-Drill gemessen wurde | Produktionsreife-Gap |

Ein bloß vorhandenes Dump-Skript oder ein einmaliger Dump ist **kein** Nachweis eines RPO/RTO.
RPO und RTO dürfen erst nach wiederholbarer Sicherung und mindestens einem verifizierten Restore-
Drill als belastbare Werte veröffentlicht werden.

### 2.3 Verbindlicher Free-Plan-Fallback

Bis zu einem dokumentierten Plan-Upgrade ist vor riskanten Datenbankänderungen mindestens ein
logischer Export außerhalb des Repositorys zu erzeugen. Secrets, Connection Strings und Dumps
dürfen nicht committed werden.

Bevorzugt mit Supabase CLI:

```bash
supabase db dump --db-url "$SUPABASE_DB_URL" --file "capital-ai-$(date +%Y%m%d-%H%M%S).sql"
```

Alternativ mit PostgreSQL:

```bash
pg_dump "$SUPABASE_DB_URL" \
  --format=custom \
  --file="capital-ai-backup-$(date +%Y%m%d-%H%M%S).dump"
```

Für jeden produktionsrelevanten Backup-Lauf sind mindestens zu erfassen:

- UTC-Zeitpunkt;
- Quellprojekt/Environment ohne Secret-Werte;
- Backup-Dateigröße;
- SHA-256 des Artefakts;
- Off-site-Ziel/Retention-Klasse;
- ausführender Owner/Workflow;
- Ergebnis der Integritätsprüfung.

### 2.4 Restore-Drill

Restore niemals ungeprüft direkt über eine produktive Datenbank ausführen. Für einen Drill ist ein
separates Ziel zu verwenden. Beispiel für einen Custom-Format-Dump:

```bash
pg_restore --dbname="$SUPABASE_RESTORE_TARGET_URL" \
  --clean --if-exists \
  capital-ai-backup-<ZEITSTEMPEL>.dump
```

Nach dem Restore mindestens prüfen:

1. Schema-/Migrationsstand;
2. Row Counts bzw. definierte Datenintegritätsindikatoren;
3. Auth-/RLS-relevante Tabellen;
4. Subscription-/Stripe-Konsistenz ohne Zahlungsprovider zu mutieren;
5. Audit-/Governance-Evidence;
6. gemessene Restore-Dauer.

Erst daraus darf ein belastbarer RTO-Wert abgeleitet werden.

### 2.5 Strukturelle Wiederherstellung

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
zusätzlich folgende manuelle Gates:

- Main-/Commit-Identität bestätigt;
- Backup-Evidence vor destruktiver Datenmutation vorhanden;
- Restore-Ziel eindeutig vom Produktionsziel getrennt;
- Secret-Werte nicht in Logs, PRs oder Evidence kopiert;
- bei Produktionsrestore explizite Owner-Freigabe;
- nach Restore Datenintegritäts- und Auth/RLS-Verifikation.

---

## 5. Provider-Referenzen

Provider-Verhalten ist vor einem realen Recovery erneut gegen den aktuellen Stand zu prüfen.

- Supabase Database Backups: `https://supabase.com/docs/guides/platform/backups`
- Supabase Production Checklist: `https://supabase.com/docs/guides/deployment/going-into-prod`
- Render Deploys: `https://render.com/docs/deploys`
- Render Rollbacks: `https://render.com/docs/rollbacks`
- Render Health Checks: `https://render.com/docs/health-checks`

---

## 6. Offene Recovery-Evidence

Der Dokumentations-Gap ist jetzt präzisiert, aber noch nicht durch einen operativen Restore-Drill
geschlossen:

- [ ] wiederkehrender Off-site-Dump mit definierter Retention eingerichtet;
- [ ] mindestens ein Restore-Drill auf separatem Ziel erfolgreich;
- [ ] daraus gemessenen RPO/RTO-Contract dokumentiert;
- [ ] bei Plan-Upgrade Provider-Backup-/PITR-Baseline erneut verifiziert.
