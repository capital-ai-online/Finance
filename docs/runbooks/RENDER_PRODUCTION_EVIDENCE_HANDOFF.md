# CAPITAL-AI Runbook — Render Production Evidence & Configuration Handoff

**Runbook ID:** RUNBOOK-RENDER-0001  
**Date:** 2026-08-03  
**Status:** ACTIVE  
**Related:** RENDER-AUDIT-0001 / ADR-0037

---

## 1. Zweck

Dieses Runbook wird verwendet, sobald ein Human Operator direkten Zugriff auf das Render-Dashboard oder die Render API/CLI besitzt.

Es hat zwei Ziele:

1. den tatsächlichen Production State beweissicher zu erfassen, ohne Secrets zu kopieren;
2. geplante Render-Konfigurationsänderungen kontrolliert aus ADR-0037 in die Production Control Plane zu überführen.

Das Runbook ist absichtlich so aufgebaut, dass ein Agent die Architektur vorbereiten kann, ohne selbst Production Secrets zu benötigen.

---

## 2. Was NIEMALS dokumentiert wird

Nicht in GitHub, PR, Chat, Ticket oder Screenshot-Dokumentation übernehmen:

- Secret-Werte;
- API Tokens;
- OAuth Client Secrets;
- SMTP Password;
- Supabase Service/Secret Keys;
- Stripe Secret/Webhook Secret;
- TOTP Encryption Key;
- Render API Tokens;
- Deploy Hook URLs;
- private registry credentials;
- vollständige Secret Files.

Erlaubt sind:

- Key-Namen;
- Service-/Project-/Environment IDs, soweit nicht als Credential verwendbar;
- Commit SHA;
- boolesche Zustände;
- Region/Plan;
- Domainnamen;
- nicht-sensitive Policy-Werte;
- Secret-Rotationsdatum ohne Secret-Inhalt.

---

## 3. Evidence Capture — Workspace

Render Dashboard → Workspace.

Erfassen:

```text
Workspace name:
Workspace plan:
Admin users / roles reviewed: YES|NO
Render GitHub App scope reviewed: YES|NO
Notification default: failures|all|none
Notification destination: email|slack|both|none
```

Keine personenbezogenen Details unnötig in technische Dokumente übernehmen; Rollen-/Owner-Evidence genügt.

---

## 4. Evidence Capture — Project / Environment

Erfassen:

```text
Project name:
Environment name:
Environment protection: enabled|disabled
Cross-environment connections blocked: enabled|disabled
Environment-scoped env groups:
  - <name only>
```

### Ziel nach ADR-0037

Production soll — soweit Render-Plan/Architektur dies unterstützt — als geschütztes Project Environment betrieben werden.

---

## 5. Evidence Capture — Service General

Service `capital-ai` → Settings.

Erfassen:

```text
Service ID:
Service type:
Runtime:
Repository:
Branch:
Region:
Instance type:
Root directory:
Dockerfile path:
Docker command override:
Health check path:
Max shutdown delay:
Maintenance mode:
```

### Sofortige Abbruchkriterien

Nicht eigenständig ändern, wenn der Istwert von Repository/ADR abweicht. Stattdessen als Drift Finding dokumentieren.

---

## 6. Evidence Capture — Build & Deploy

Erfassen:

```text
Auto Deploy:
  commit | checksPass | off

Overlapping Deploy Policy:
  <actual value>

Build Filters:
  included paths:
  ignored paths:

Pre-deploy command:
Preview/service preview policy:
Current live deploy commit SHA:
Last successful deploy commit SHA:
Last failed deploy commit SHA (if applicable):
```

### Zielzustand

Production Auto Deploy soll nach ADR-0037 `After CI Checks Pass` / `checksPass` verwenden.

Vor Änderung prüfen, dass verpflichtende GitHub Checks für `main` tatsächlich existieren und nicht regelmäßig `skipped` werden.

---

## 7. Evidence Capture — Scaling

Erfassen:

```text
Scaling mode: manual|autoscaling
Current instances:
Autoscaling min:
Autoscaling max:
CPU target:
Memory target:
```

### ADR-0037 Gate

Solange wiederkehrende Background Jobs im Web-Prozess laufen:

```text
current instances MUST be 1
autoscaling MUST be disabled
```

Eine Abweichung ist als **P0 Scaling Risk** zu behandeln und nicht als normale Performance-Einstellung.

---

## 8. Evidence Capture — Disk / Filesystem

Erfassen:

```text
Persistent disk attached: yes|no
Mount path:
Disk size:
```

### Interpretation

Wenn `no`:

- `/app/uploads` ist als ephemer zu behandeln;
- lokale Subscription-/Credit-Fallbacks dürfen nicht als durable gelten.

Wenn `yes`:

- sofort dokumentieren, dass Multi-Instance-Scaling nicht möglich ist;
- dokumentieren, dass Zero-Downtime Deploys für den Service entfallen;
- prüfen, warum der Disk existiert und ob er durch Supabase/Object Storage ersetzt werden kann.

Disk nicht entfernen, bevor die Datenklassifikation und ein Backup/Migrationsplan vorliegen.

---

## 9. Evidence Capture — Domains / Network Edge

Erfassen:

```text
Custom domains:
  - capital-ai.online
  - <others>

Canonical redirect:
onrender.com subdomain reachable: yes|no
TLS certificate status:
Inbound IP rules:
```

### Ziel

Wenn die Render-Subdomain nicht für Betrieb/Monitoring benötigt wird, ADR-0037-konform prüfen, ob `renderSubdomainPolicy: disabled` sinnvoll ist.

---

## 10. Evidence Capture — Environment Variables

Nur **Namen** vergleichen.

### Repository-deklarierte Schlüssel

Aus `render.yaml` gegen Dashboard-Key-Namen abgleichen.

Zusätzlich explizit prüfen, weil dynamische Stripe-Konfiguration vom bestehenden Scanner nicht vollständig erkannt wird:

```text
STRIPE_PRICE_ID_STARTER
STRIPE_PRICE_ID_STARTER_MONTHLY
STRIPE_PRICE_ID_STARTER_YEARLY
STRIPE_PRICE_ID_PRO
STRIPE_PRICE_ID_PRO_MONTHLY
STRIPE_PRICE_ID_PRO_YEARLY
STRIPE_PRICE_ID_ENTERPRISE
STRIPE_ID_FOUNDER or STRIPE_PRICE_ID_FOUNDER
STRIPE_PRICE_ID_EXPORT_PDF
```

Weiterhin prüfen:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY / VITE_SUPABASE_ANON_KEY
SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
VITE_STRIPE_PUBLISHABLE_KEY / STRIPE_PUBLISHABLE_KEY
TOTP_ENCRYPTION_KEY
SMTP_*
METRICS_TOKEN
AI provider keys
market-data provider keys
social OAuth client IDs/secrets
VITE_GA_MEASUREMENT_ID
```

### Regeln

- kein Secret-Wert ins Evidence-Dokument;
- doppelte Alias-Keys bewusst konsolidieren;
- `VITE_*` bedeutet browser-/build-visible und darf niemals ein Secret enthalten;
- neue `sync:false` Keys bei bestehendem Blueprint müssen manuell mit Wert provisioniert werden.

---

## 11. Environment Groups

Für jeden Group-Namen dokumentieren:

```text
name:
project/environment scope:
linked services:
key names only:
owner:
```

Kollisionen gleicher Variablennamen zwischen mehreren Groups vermeiden. Render garantiert die Präzedenz zwischen kollidierenden Groups nicht als langfristigen Contract.

---

## 12. Notifications / Incident Routing

Mindestens folgende Render-Events müssen einen dokumentierten Empfänger besitzen:

```text
build/deploy failed
running service unhealthy
Docker pull failed
```

Optional `all notifications` für successful deploy/recovery.

Incident-Routing muss erklären:

```text
who receives alert
where it is recorded
who decides rollback
how GitHub commit/deploy ID is correlated
```

---

## 13. Pre-Change Gate

Vor jeder Render Production Mutation:

1. aktuellen Wert dokumentieren;
2. Sollwert aus ADR/PR nennen;
3. abhängige Komponenten nennen;
4. Blast Radius klassifizieren;
5. Rollback definieren;
6. prüfen, ob Setting einen Deploy/Restart auslöst;
7. prüfen, ob Secret Rotation erforderlich ist;
8. Human Approval nach CAPITAL-AI Governance;
9. Änderung durchführen;
10. Post-Change Evidence erfassen.

---

## 14. Post-Change Verification

Nach Render-Änderungen mindestens:

```text
[ ] deploy succeeded
[ ] correct commit SHA is live
[ ] Render health check passes
[ ] login/auth works
[ ] owner/IAM protected path works
[ ] Supabase durable write/read works
[ ] Stripe checkout test path appropriate to environment works
[ ] webhook endpoint reachable/configured
[ ] SMTP test where affected
[ ] critical API smoke test
[ ] no unexpected CSP/CORS regression
[ ] logs contain no new secret exposure
[ ] notification path tested if modified
```

Nicht jede Änderung benötigt jeden fachlichen Test; nicht zutreffende Punkte werden explizit `N/A` markiert, nicht still übersprungen.

---

## 15. Rollback Decision

### Code regression

Render Instant Rollback oder Git revert nach Incident-Analyse.

### Configuration regression

Aktuellen und vorherigen Service Configuration State vergleichen. Ein Code-Rollback setzt nicht automatisch jede Dashboard-Einstellung zurück.

### Secret regression

Nicht auf alte kompromittierte Secrets zurückrollen. Stattdessen neue Secret-Rotation + providerseitige Revocation.

### Data regression

Render Application Rollback ist kein Supabase Data Restore. Daten-Recovery separat nach Datenbank-Runbook.

---

## 16. Evidence Output Template

Nach vollständigem Audit einen Secret-freien Block erzeugen:

```yaml
renderProductionEvidence:
  capturedAt: <ISO timestamp>
  service:
    id: <id>
    name: capital-ai
    runtime: docker
    repo: SvenKulessa/Finance
    branch: main
    region: <verified>
    plan: <verified>
    instances: <verified>
    autoscaling: <verified>
    healthCheckPath: <verified>
    maxShutdownDelaySeconds: <verified>
    autoDeployTrigger: <verified>
    diskAttached: <yes/no>
    renderSubdomainEnabled: <yes/no>
  environment:
    project: <verified>
    name: <verified>
    protected: <yes/no>
    crossEnvironmentIsolation: <yes/no>
  domains:
    - <verified>
  environmentGroups:
    - <name only>
  notifications:
    level: <verified>
    destinations: <types only>
  deploy:
    liveCommitSha: <verified>
```

Dieses Evidence-Objekt enthält bewusst keine Secret-Werte.

---

## 17. Abschluss

Nach Ausfüllen dieses Runbooks:

1. `RENDER_PRODUCTION_CONFIGURATION_AUDIT.md` aktualisieren;
2. offene Findings neu klassifizieren;
3. ADR-0037 Implementation Status aktualisieren;
4. Render-IaC nur mit **verifizierten** Dashboard-Werten vervollständigen;
5. Production Change über separaten, reviewbaren PR/Handoff durchführen.
