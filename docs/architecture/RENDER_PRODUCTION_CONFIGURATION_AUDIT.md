# CAPITAL-AI — Render Production Configuration Audit

**Audit ID:** RENDER-AUDIT-0001  
**Audit date:** 2026-08-03  
**Status:** COMPLETE FOR AVAILABLE EVIDENCE / DASHBOARD EVIDENCE PENDING  
**Priority:** HIGH  
**System:** CAPITAL-AI / `capital-ai.online`  
**Repository:** `SvenKulessa/Finance`  
**Related ADR:** ADR-0037  
**Related runbook:** `docs/runbooks/DEPLOYMENT_ROLLBACK_UND_BACKUP.md`

---

## 1. Zweck

Dieses Dokument beschreibt die Render-Produktionsarchitektur von CAPITAL-AI so vollständig, dass zukünftige Änderungen, Deployments, Rollbacks und Modulerweiterungen nicht mehr von implizitem Wissen im Render-Dashboard abhängen.

Ziel ist eine belastbare Trennung zwischen:

1. **Repository-/Infrastructure-as-Code-Wahrheit** (`render.yaml`, Dockerfile, Server-Code, CI);
2. **Render-Plattform-Wahrheit** (Service-, Environment-, Deploy-, Skalierungs- und Security-Einstellungen);
3. **Runtime-Wahrheit** (welcher Build/Commit läuft tatsächlich, welche Abhängigkeiten sind betriebsbereit);
4. **externen Provider-Abhängigkeiten** (Supabase, Stripe, SMTP, AI-/Market-Data-Provider);
5. **operativer Wahrheit** (Monitoring, Rollback, Incident Response, Secret Rotation).

Damit soll verhindert werden, dass ein Agent, ein späterer Entwickler oder ein Modell eine lokale Einstellung für die vollständige Produktionsarchitektur hält und dadurch unabsichtlich einen partiellen, nicht reproduzierbaren oder unsicheren Zustand erzeugt.

---

## 2. Audit-Grenzen und Beweisstatus

Für diese Session stand **kein Render-Connector/Plugin** zur Verfügung. Das Render-Dashboard konnte daher nicht direkt ausgelesen werden. Es werden keinerlei Dashboard-Werte erfunden.

Jede Aussage ist deshalb mit einem Evidence-Status zu lesen:

| Status | Bedeutung |
|---|---|
| `VERIFIED_REPO` | Direkt aus dem aktuellen `main`-Repository belegt. |
| `VERIFIED_PROVIDER` | Gegen aktuelle offizielle Render-Dokumentation geprüft. |
| `UNVERIFIED_DASHBOARD` | Nur im Render-Dashboard/API verifizierbar; aktuell nicht ausgelesen. |
| `INFERRED` | Aus mehreren belegten Komponenten ableitbar, aber nicht direkt aus Render bestätigt. |
| `RISK` | Architektur-/Security-Lücke, die aus belegten Fakten entsteht. |

### Nicht verifizierbar in dieser Session

Insbesondere folgende aktuelle Dashboard-Werte konnten nicht direkt aus Render gelesen werden:

- Workspace-/Plan-Tier;
- Service-ID;
- tatsächliche Region;
- aktueller Instance Type;
- aktuelle Anzahl Instanzen / Autoscaling;
- Projekt- und Environment-Zuordnung;
- Protected-Environment-Status;
- Cross-Environment-Network-Isolation;
- Auto-Deploy-Einstellung;
- Overlapping Deploy Policy;
- Build Filters;
- Service Preview / Preview Environment Einstellungen;
- Docker Command Override;
- Root Directory / Dockerfile Path Overrides;
- Persistent Disk;
- `onrender.com`-Subdomain Policy;
- Custom-Domain-Liste im Dashboard;
- Maintenance Mode;
- Notification-/Webhook-Konfiguration;
- Environment Groups und Secret Files;
- manuell hinzugefügte Environment-Variablen, die nicht in `render.yaml` erscheinen.

Diese Werte werden in Abschnitt 12 als verpflichtende Production-Evidence-Checkliste geführt.

---

## 3. Verifizierter Ist-Zustand

### 3.1 Render Blueprint

`render.yaml` definiert aktuell genau einen Service:

```yaml
services:
  - type: web
    name: capital-ai
    runtime: docker
    healthCheckPath: /healthz
```

**Evidence:** `render.yaml` (`VERIFIED_REPO`).

Damit sind folgende Eigenschaften repositoryseitig belegt:

- öffentlicher Render Web Service;
- Servicename `capital-ai`;
- Docker Runtime;
- HTTP Health Check unter `/healthz`;
- Environment-Variable-Namen als `sync: false`-Placeholder.

Nicht im Blueprint festgelegt sind unter anderem Region, Plan, Branch, Auto-Deploy-Policy, Domain Policy, Shutdown Delay, Skalierung und Environment Protection.

### 3.2 Secrets und Runtime-Konfiguration

Der Blueprint enthält zahlreiche `sync: false` Variablen. Das ist für Secret-Werte grundsätzlich korrekt: Render hält den Wert außerhalb des Repositorys.

Belegte Gruppen:

- Supabase;
- Stripe;
- Gemini / Anthropic / OpenAI;
- Market-Data-Provider;
- SMTP;
- IAM/TOTP;
- Metrics;
- Social-Media OAuth Clients;
- Google Analytics Measurement ID.

`sync: false` bedeutet jedoch nicht, dass der Wert heute tatsächlich gesetzt oder korrekt ist. Bei bestehenden Blueprints werden neue `sync: false`-Variablen nicht automatisch befüllt; sie müssen im Dashboard gesetzt werden.

### 3.3 Docker Build

Der Produktionscontainer verwendet eine Multi-Stage-Struktur:

```text
node:22-alpine builder
  -> npm ci
  -> Vite/esbuild production build

node:22-alpine runner
  -> npm ci --only=production
  -> non-root user capitalai
  -> /app/uploads + /app/docs
  -> CMD npm run start
```

Positive Punkte:

- reproduzierbarer Lockfile-Build mit `npm ci`;
- Development Dependencies werden nicht in den Runtime-Layer übernommen;
- Produktionsprozess läuft als Non-Root-User;
- `.env`, `.git` und `.github` werden über `.dockerignore` nicht in den Build-Kontext übernommen;
- Docker enthält einen lokalen Healthcheck.

### 3.4 HTTP Server

Der Express-Prozess bindet aktuell fest auf:

```ts
const PORT = 3000;
app.listen(PORT, "0.0.0.0", ...)
```

Das `0.0.0.0`-Binding ist für Render korrekt. Die feste Portnummer entspricht jedoch nicht dem empfohlenen Render-Vertrag (`process.env.PORT`, standardmäßig 10000). Render kann andere Ports häufig automatisch erkennen, aber diese Erkennung sollte nicht Teil der Architekturvertrauensbasis sein.

### 3.5 Render Health Check

`/healthz` antwortet derzeit mit:

- `status: ok`;
- Zeitstempel;
- Prozess-Uptime;
- `configured` Flags für Supabase, Gemini, Anthropic und OpenAI.

Der Endpoint führt bewusst keine externen Netzwerkprüfungen aus.

Das bedeutet:

- sehr gute Liveness-Eigenschaft;
- schneller Healthcheck;
- aber keine vollständige Readiness-Aussage für kritische Produktionsabhängigkeiten.

`runIamSchemaHealthCheck()` wird beim Serverstart ausgeführt, blockiert den Start bei Fehlern aber bewusst nicht. Die Anwendung kann deshalb Render-seitig `healthy` werden, obwohl bestimmte privilegierte IAM-Funktionen fail-closed nicht verfügbar sind.

### 3.6 Deployment / CI

Aktuelle GitHub-CI auf `main` führt aus:

```text
npm ci
npm audit --omit=dev --audit-level=high
npm run lint
npm test
npm run build
npm run predeploy:check
```

Das ist eine gute technische Gate-Basis.

Ob Render aktuell mit **On Commit**, **After CI Checks Pass** oder **Off** arbeitet, ist jedoch nicht im Blueprint definiert und damit `UNVERIFIED_DASHBOARD`.

### 3.7 Deployment Readiness Gate

`scripts/automation/verifyDeploymentReadiness.ts` prüft unter anderem:

- Health Check im Blueprint;
- Environment-Variablen-Abdeckung;
- Migrationen;
- Lockfile / Dependency Policy / SBOM;
- Traceability;
- RAG Evidence;
- Prompt Registry.

Wichtig: Der Env-Scanner erkennt nur statische Aufrufe wie:

```ts
getCleanEnv('KEY')
```

Dynamische Aufrufe werden nicht vollständig erkannt.

Beispiel in `server/stripe.ts`:

```ts
getStripeVar('STRIPE_PRICE_ID_STARTER_YEARLY')
getStripeVar('STRIPE_PRICE_ID_PRO_YEARLY')
```

`getStripeVar()` ruft intern `getCleanEnv(key)` mit einer dynamischen Variable auf. Damit können Environment-Schlüssel vom aktuellen Regex-Gate übersehen werden.

### 3.8 Dateisystem und lokale Fallback-Persistenz

Render-Webservices besitzen standardmäßig ein **ephemeres Dateisystem**.

Der Code schreibt gleichzeitig lokale Fallback-Daten nach:

```text
/app/uploads/subscriptions.json
```

und weitere lokale Credit-/Fallback-Zustände unter `uploads/`.

`render.yaml` definiert keinen Persistent Disk. Ob im Dashboard manuell ein Disk angebunden ist, ist aktuell nicht verifiziert.

Dies ist für Billing-/Entitlement-Daten architektonisch kritisch: Ein lokaler Fallback kann scheinbar erfolgreich geschrieben werden und bei Restart/Deploy anschließend verschwinden.

Für CAPITAL-AI sollte persistenter Business State **nicht** durch einen Render Disk gelöst werden, weil ein Disk horizontale Skalierung verhindert und Zero-Downtime-Deployments abschaltet. Persistenter Subscription-/Credit-State gehört in Supabase/Postgres; lokale Dateien dürfen höchstens Cache/diagnostische Artefakte darstellen.

### 3.9 Background Work im Web-Prozess

Beim Start des Webservers werden zusätzlich ausgeführt:

- Recursive Document Hygiene File Watcher;
- Market-Data Pre-Caching;
- 60-Sekunden Market-Data Refresh;
- Daily Snapshot Recording;
- Alert Evaluation.

Damit ist der Web-Prozess derzeit nicht vollständig stateless.

Bei mehreren Render-Instanzen würden diese Jobs auf **jeder Instanz** laufen. Das kann verursachen:

- doppelte Provider-Abfragen;
- doppelte Alert-Auswertung;
- konkurrierende Snapshot-Writes;
- Rate-Limit-Verbrauch;
- inkonsistente In-Memory-Caches;
- schwer nachvollziehbare Race Conditions.

Die aktuelle Anwendung darf deshalb nicht einfach durch Erhöhen von `numInstances` oder Aktivieren von Autoscaling horizontal skaliert werden, bevor diese Background-Verantwortlichkeiten getrennt wurden.

### 3.10 Shutdown-Verhalten

Render sendet bei Zero-Downtime-Deploys `SIGTERM` an die alte Instanz und wartet standardmäßig bis zu 30 Sekunden auf einen geordneten Shutdown.

Im aktuellen Repository wurde kein expliziter `SIGTERM`-Handler gefunden.

Dadurch fehlen kontrollierte Schritte wie:

- HTTP Server `close()` / Request Drain;
- Stoppen von Intervallen/Watchern;
- Abschluss oder Abbruch laufender Jobs;
- Schließen externer Verbindungen;
- definiertes Exit-Verhalten.

### 3.11 Rollback-Dokumentation

Das bestehende Runbook beschreibt den Render-Dashboard-Rollback teilweise veraltet als erneuten Build des historischen Commits.

Aktuelle Render-Dokumentation beschreibt dagegen die Wiederverwendung des Build-Artefakts eines vorhandenen erfolgreichen Deployments. Zusätzlich deaktiviert ein Dashboard-Rollback automatische Deploys als Schutz gegen sofortige Wiedereinführung des fehlerhaften Commits.

Dieser Dokumentationsdrift ist im Incident-Fall relevant und muss korrigiert werden.

---

## 4. Verifizierte Prozessketten

### 4.1 Source-to-Production

```text
GitHub repository
      |
      v
GitHub CI
  - dependencies
  - SCA
  - typecheck
  - tests
  - build
  - deployment readiness
      |
      v
Render Git integration             [Auto-Deploy Policy aktuell UNVERIFIED]
      |
      v
Docker build
      |
      v
new Render instance
      |
      v
GET /healthz
      |
      +-- pass -> traffic switch
      |
      +-- fail -> old deploy remains live
      |
      v
old instance receives SIGTERM
```

### 4.2 Runtime Request Chain

```text
Internet
  |
  v
Render / Cloudflare edge
  - DDoS protection
  - HTTP -> HTTPS
  - TLS termination
  |
  v
Render internal proxy
  |
  v
Express 0.0.0.0:3000
  |
  +-- requestContext / security headers
  +-- metrics
  +-- CORS
  +-- rate limits
  +-- API routers
  +-- React SPA/static assets
```

### 4.3 Configuration Chain

```text
render.yaml names
      |
      +--> sync:false placeholders
      |         |
      |         v
      |   Render Dashboard secret values
      |
      +--> Docker build environment
      |         |
      |         +--> explicitly declared VITE_* ARG values
      |
      +--> Runtime environment
                |
                v
            getCleanEnv()
```

### 4.4 Persistence Chain

```text
Primary durable state
    -> Supabase/Postgres

Temporary process state
    -> memory cache

Current fallback files
    -> /app/uploads/*
    -> Render filesystem (persistence UNVERIFIED; default ephemeral)
```

Normativer Zielzustand:

```text
Business-critical state -> Supabase/Postgres only
Cache                  -> memory / dedicated cache
Generated export       -> object storage / bounded transient file
No entitlement truth   -> local Render filesystem
```

---

## 5. Priorisierte Findings

| ID | Priorität | Finding | Status |
|---|---|---|---|
| RND-F-001 | **P0** | Business-/Entitlement-Fallback schreibt auf potenziell ephemeres Render-Dateisystem. | OPEN |
| RND-F-002 | **P0** | Horizontale Skalierung ist wegen eingebetteter Background Jobs derzeit nicht safe. | OPEN |
| RND-F-003 | **P1** | Render Port Contract wird nicht verwendet; Port 3000 ist hartcodiert. | OPEN |
| RND-F-004 | **P1** | `render.yaml` ist keine vollständige Service-Source-of-Truth; Dashboard Drift bleibt möglich. | OPEN |
| RND-F-005 | **P1** | Auto-Deploy ist nicht als `checksPass` codiert/verifiziert. | UNVERIFIED |
| RND-F-006 | **P1** | Kein explizites SIGTERM/Graceful-Shutdown-Verhalten. | OPEN |
| RND-F-007 | **P1** | Health Check misst Liveness, aber nicht definierte Production Readiness. | OPEN |
| RND-F-008 | **P1** | Environment-Inventar-Gate kann dynamische Env-Key-Aufrufe übersehen. | OPEN |
| RND-F-009 | **P1** | Region/Plan/Instance Count/Scaling fehlen aus IaC und sind nicht reproduzierbar dokumentiert. | UNVERIFIED |
| RND-F-010 | **P1** | Bestehendes Rollback-Runbook enthält veraltete Render-Rollback-Semantik. | OPEN |
| RND-F-011 | **P2** | Secret-Diagnostik loggt Key-Prefixe/Längen und sollte minimiert werden. | OPEN |
| RND-F-012 | **P2** | Render Notification-/Unhealthy-Alerting ist nicht dokumentiert/verifiziert. | UNVERIFIED |
| RND-F-013 | **P2** | `onrender.com`-Subdomain-Policy und Domain Source-of-Truth sind nicht dokumentiert. | UNVERIFIED |
| RND-F-014 | **P2** | Docker Base Image verwendet einen beweglichen Tag statt vollständig reproduzierbarem Digest. | OPEN |
| RND-F-015 | **P2** | Public `/healthz` veröffentlicht Provider-Konfigurationsflags. | OPEN |
| RND-F-016 | **P2** | External uptime probe / user-path smoke monitoring nicht dokumentiert. | UNVERIFIED |

---

## 6. Findings im Detail

### RND-F-001 — P0 — Ephemeral Business-State Fallback

`server/db.ts` schreibt Subscription-Fallbacks lokal unter `uploads/subscriptions.json` und betrachtet die lokale Speicherung bei Remote-Problemen als Fallback.

Render dokumentiert, dass das Dateisystem standardmäßig bei Deploy/Restart verloren geht.

**Risiko:**

- Abo-/Credit-Zustand kann nach erfolgreichem Request später verschwinden;
- Webhook-/Billing-Zustand kann zwischen Supabase und lokaler Datei divergieren;
- Restart oder Deploy wird unbeabsichtigt zu einem Daten-Lifecycle-Event.

**Entscheidung:**

Lokale Dateien dürfen niemals authoritative Subscription-, Billing-, IAM- oder Credit-Daten sein.

**Empfehlung:**

- Supabase bleibt einzige durable Source of Truth;
- bei Supabase-Schreibfehlern fail closed oder durable Queue/Retry verwenden;
- kein Render Disk als Ersatz für die Datenbank einführen, solange horizontale Skalierung/Zero-Downtime erforderlich ist.

### RND-F-002 — P0 — Web- und Worker-Verantwortung vermischt

Der Webprozess führt Scheduler-/Background-Verantwortung aus.

**Risiko bei Scaling:** Jeder neue Web-Replica vervielfacht die Jobs.

**Ziel:**

```text
Render Web Service
  -> HTTP/API only

Render Background Worker / controlled scheduler
  -> recurring market refresh coordination
  -> alert evaluation
  -> documentary background work where appropriate

Supabase / distributed lock
  -> idempotency / leader coordination
```

Bis diese Trennung abgeschlossen ist:

> `numInstances = 1` und Autoscaling dürfen nicht ohne Architekturentscheidung aktiviert werden.

### RND-F-003 — P1 — Hardcoded Port

Aktuell:

```ts
const PORT = 3000;
```

Ziel:

```ts
const PORT = Number(process.env.PORT || 3000);
```

und Docker-/Healthcheck müssen denselben Portvertrag nutzen.

### RND-F-004 — P1 — Unvollständige Infrastructure as Code

Aktuell codiert der Blueprint nur einen Bruchteil des Services.

Für reproduzierbare Production müssen mindestens bewusst festgelegt oder als `dashboard-managed` dokumentiert werden:

- `region`;
- `plan`;
- `branch`;
- `autoDeployTrigger`;
- `healthCheckPath`;
- `maxShutdownDelaySeconds`;
- `numInstances` / `scaling`;
- `domains`;
- `renderSubdomainPolicy`;
- `dockerfilePath` / `dockerContext` soweit relevant;
- `buildFilter`;
- Environment-/Project-Zuordnung;
- Environment Protection / Network Isolation;
- Preview Policy;
- Environment Groups.

### RND-F-005 — P1 — Deploy darf CI nicht umgehen

Für Production wird empfohlen:

```yaml
autoDeployTrigger: checksPass
```

Dadurch deployt Render erst nach erfolgreichen GitHub Checks. Dieser Wert muss im Dashboard verifiziert und anschließend in der IaC-Source-of-Truth festgeschrieben werden.

**Wichtig:** `neutral` und `skipped` gelten bei Render ebenfalls als passender Check-Ausgang. Kritische Gates dürfen deshalb nicht über Workflow-Bedingungen still `skipped` werden.

### RND-F-006 — P1 — Graceful Shutdown

CAPITAL-AI benötigt einen zentralen Shutdown Coordinator.

Minimaler Zielablauf:

```text
SIGTERM
  -> mark not-ready
  -> stop accepting new work
  -> server.close()
  -> clear intervals/watchers
  -> allow in-flight HTTP requests to finish
  -> finish/abort bounded jobs
  -> flush logs/audit
  -> exit(0)
```

`maxShutdownDelaySeconds` muss anschließend an das getestete Drain-Fenster angepasst werden.

### RND-F-007 — P1 — Readiness Contract fehlt

`/healthz` ist ein guter Prozess-Liveness-Endpoint, aber aktuell kein vollständiger Readiness Gate.

Ziel ist eine explizite Dependency Classification:

| Abhängigkeit | Startup-kritisch | Request-kritisch | Health-Verhalten |
|---|---:|---:|---|
| Express/runtime | Ja | Ja | hard fail |
| IAM Schema | für Admin/IAM ja | ja | degraded/not-ready nach Policy |
| Supabase | für auth/billing durable state ja | vielfach | cached bounded readiness |
| Stripe | nein beim Boot | Billing only | feature degraded |
| AI Provider | nein | AI features | feature degraded |
| Market Data | nein | Screening quality | feature degraded/fallback |
| SMTP | nein | mail flows | feature degraded |

Nicht jede externe API darf Render-Healthchecks direkt blockieren. Entscheidend ist ein dokumentierter, gecachter Readiness-Zustand statt ungeplanter Netzwerkaufrufe pro Health Request.

### RND-F-008 — P1 — Environment Contract ist unvollständig prüfbar

Das Readiness-Skript erkennt dynamisch gebildete Schlüssel nicht zuverlässig.

Besonders relevant:

```text
STRIPE_PRICE_ID_STARTER_MONTHLY
STRIPE_PRICE_ID_STARTER_YEARLY
STRIPE_PRICE_ID_PRO_MONTHLY
STRIPE_PRICE_ID_PRO_YEARLY
STRIPE_ID_FOUNDER / STRIPE_PRICE_ID_FOUNDER
STRIPE_PRICE_ID_EXPORT_PDF
```

Der aktuelle Blueprint enthält nur die Basis-Price-IDs. Ob die erweiterten IDs im Dashboard existieren, muss verifiziert werden.

Ziel ist ein typisiertes, zentrales `production-env-contract`-Manifest, aus dem:

- `render.yaml`;
- Predeploy Validation;
- Dokumentation;
- Production Handoff

konsistent abgeleitet werden.

### RND-F-009 — P1 — Region/Compute nicht dokumentiert

Render verwendet bei neuen Services ohne `region` standardmäßig Oregon. Region kann nach Erstellung nicht geändert werden.

Da CAPITAL-AI primär EU-Kontext besitzt und Supabase in EU betrieben wird, muss die aktuelle Render-Region zwingend dokumentiert werden. Ein Neuaufbau aus dem aktuellen Blueprint könnte sonst einen anderen geografischen Zustand erzeugen.

Keine Region wird in diesem Audit erfunden. Zielregion ist erst nach Datenfluss-/Latenz-/Compliance-Entscheidung festzuschreiben.

### RND-F-010 — P1 — Rollback-Wissen ist veraltet

Das bestehende Runbook muss an die aktuelle Render-Rollback-Semantik angepasst werden:

- Render kann vorhandene Build-Artefakte wiederverwenden;
- Dashboard-Rollback deaktiviert Autodeploys;
- Rollback stellt nicht automatisch alle aktuellen Service-Level-Konfigurationen zurück;
- Environment Groups besitzen besondere Rollback-Semantik;
- Disk-State wird nicht durch Code-Rollback zurückgesetzt.

### RND-F-011 — P2 — Secret Diagnostics

Der Server loggt für Stripe-Schlüssel `Configured`, Länge und Präfixe.

Auch wenn keine vollständigen Secrets ausgegeben werden, sollte Production Logging keine Secret-Form-Metadaten benötigen.

Ziel:

```text
stripe.secretKey.configured = true|false
stripe.webhookSecret.configured = true|false
```

ohne Key-Fragmente.

### RND-F-012 — P2 — Render Notifications

Mindestens Failure Notifications für folgende Render-Ereignisse sollten aktiv und dokumentiert sein:

- Build/Deploy failure;
- unhealthy service;
- Docker image pull failure;
- optional erfolgreiche Production Deploys.

Ziel: E-Mail und/oder Slack/Webhook mit Incident-Prozess verknüpfen.

### RND-F-013 — P2 — Alternate Host Surface

Render erlaubt bei Custom Domains standardmäßig weiterhin die `onrender.com`-Subdomain, sofern sie nicht deaktiviert wird.

Zu prüfen:

- wird die Render-Subdomain operativ benötigt?
- wenn nein: `renderSubdomainPolicy: disabled` erwägen;
- Custom Domains (`capital-ai.online`, gewünschte `www`-Policy) als IaC dokumentieren.

### RND-F-014 — P2 — Base Image Reproducibility

`node:22-alpine` ist ein beweglicher Tag.

Für reproduzierbare Supply Chain sollte das Image nach getestetem Upgrade-Prozess auf einen kontrollierten Digest bzw. eine ausreichend immutable Referenz gepinnt werden. Updates erfolgen dann bewusst über Dependency-/Container-Renovation statt unsichtbar zwischen Builds.

### RND-F-015 — P2 — Health Endpoint Information Disclosure

`/healthz` zeigt öffentlich, welche Provider konfiguriert sind.

Diese Information ist nicht hochsensitiv, aber für Liveness nicht notwendig. Ein minimaler öffentlicher Health Contract reduziert Fingerprinting.

### RND-F-016 — P2 — External Probe

Render Health Checks prüfen die Instanz intern. Ein externer Probe sollte zusätzlich einen echten Benutzerpfad simulieren und Alerting auslösen.

Dabei sollte die Render-/Cloudflare Request-ID (`CF-Ray`) bzw. die CAPITAL-AI Correlation-ID mitgeführt werden, damit externe Ausfälle zu Logs korreliert werden können.

---

## 7. Security- und Reliability-Bewertung

| Control | Reifegrad | Bewertung |
|---|---|---|
| TLS / HTTPS | Hoch | Render verwaltet TLS und HTTP→HTTPS. |
| DDoS | Hoch | Render stellt Cloudflare-basierten DDoS-Schutz bereit. |
| Container User | Hoch | Non-root Runtime vorhanden. |
| Health Check | Mittel/Hoch | HTTP Health vorhanden, Readiness-Semantik zu schwach. |
| CI Gate | Hoch im Repo | Render-Verknüpfung `checksPass` nicht verifiziert. |
| IaC Coverage | Niedrig/Mittel | Blueprint beschreibt nur Teil der Produktion. |
| Secret Storage | Mittel/Hoch | `sync:false` korrekt, tatsächliche Werte/Groups nicht verifiziert. |
| Secret Inventory | Mittel | Dynamische Env Keys können Gate umgehen. |
| Graceful Shutdown | Niedrig | kein expliziter SIGTERM Coordinator. |
| Horizontal Scaling | Niedrig | Background Jobs verhindern sicheren Scale-out. |
| Persistence | Kritisch | lokale Business-Fallbacks + standardmäßig ephemeres FS. |
| Rollback Knowledge | Mittel | Runbook teilweise veraltet. |
| Production Environment Protection | Unbekannt | Dashboard-only Evidence fehlt. |
| Notifications | Unbekannt | Dashboard-only Evidence fehlt. |
| External Monitoring | Unbekannt | nicht dokumentiert. |

---

## 8. Empfohlene Zielarchitektur

```text
                         GitHub
                           |
                    protected main
                           |
                    Required CI Checks
                           |
                           v
                 Render Blueprint / IaC
                 single source of truth
                           |
                  autoDeploy=checksPass
                           |
                           v
                  CAPITAL-AI Project
                 Production Environment
                    [PROTECTED]
                           |
        +------------------+------------------+
        |                                     |
        v                                     v
 Render Web Service                     Worker/Scheduler
 HTTP/API only                          background only
 stateless                              idempotent jobs
        |                                     |
        +------------------+------------------+
                           |
                           v
                      Supabase
                 durable state / locks
                           |
        +------------------+------------------+
        |                  |                  |
      Stripe             SMTP             AI/Data APIs
```

### Render Web Service Contract

```text
branch: main
auto deploy: after CI checks pass
PORT: Render-provided
health: explicit readiness policy
shutdown: SIGTERM drain
filesystem: disposable
business state: none
background schedulers: none
```

### Environment Contract

```text
Project: CAPITAL-AI
  Environment: Production [protected]
    Env Group: capital-ai-prod-public-config
    Env Group: capital-ai-prod-secrets
    Service: capital-ai-web
    Worker(s): dedicated background workloads
```

Secret Groups sollen environment-scoped sein, damit Dev/Staging nicht versehentlich Production Credentials verwenden können.

---

## 9. Blueprint-Zielbild

Die folgende Struktur ist **Zielbild**, nicht automatisch anzuwenden, solange die Dashboard-Werte nicht verifiziert sind:

```yaml
services:
  - type: web
    name: capital-ai
    runtime: docker
    repo: <verified repository URL>
    branch: main
    region: <VERIFIED CURRENT / APPROVED TARGET>
    plan: <VERIFIED CURRENT>
    autoDeployTrigger: checksPass
    healthCheckPath: /readyz
    maxShutdownDelaySeconds: <tested drain window>
    numInstances: 1 # until background work is separated
    domains:
      - capital-ai.online
    renderSubdomainPolicy: <verified decision>
    dockerfilePath: ./Dockerfile
    envVars:
      - fromGroup: capital-ai-prod-secrets
      - fromGroup: capital-ai-prod-config
```

Keine dieser Dashboard-abhängigen Angaben darf ohne Verifikation blind in `render.yaml` übernommen werden.

---

## 10. Production Configuration Source-of-Truth Policy

Jede Render-Einstellung muss künftig genau einer Kategorie angehören:

### A. IaC-managed

Muss in `render.yaml` stehen und darf nicht dauerhaft nur im Dashboard existieren.

Beispiele:

- Service type/name/runtime;
- repo/branch;
- region/plan;
- autoDeployTrigger;
- healthCheckPath;
- shutdown delay;
- scaling policy;
- domain policy;
- build filters;
- project/environment topology.

### B. Secret-managed

Wert bleibt bewusst ausschließlich in Render.

Repository enthält nur:

- kanonischen Variablennamen;
- Klassifikation `secret|public-config`;
- Owner;
- Rotation Policy;
- abhängige Module;
- required/optional;
- Build-time/runtime scope.

### C. Operational-managed

Dashboard-/Workspace-Einstellungen, die nicht vollständig per Blueprint modelliert werden, erhalten verpflichtende Evidence im Architektur-Dokument.

Beispiele:

- Notification destination;
- Workspace roles;
- Render GitHub App scope;
- Incident contacts.

---

## 11. Keine automatische Produktionsänderung aus diesem Audit

Dieses Audit verändert absichtlich **keine** Render-Dashboard-Einstellung.

Folgende Änderungen sind Production Control Plane Changes und benötigen den etablierten CAPITAL-AI-Handoff:

- Region/Plan/Scaling;
- Environment Protection;
- Auto-Deploy;
- Build Filters;
- Domain/Subdomain Policy;
- Persistent Disk;
- Environment Groups/Secrets;
- Notifications/Webhooks;
- Maintenance Mode;
- Render API/Deploy Hooks.

ADR-0037 definiert hierfür die Freigabe- und Evidence-Anforderungen.

---

## 12. Verpflichtende Render-Dashboard-Evidence-Checkliste

Diese Tabelle ist bei direktem Render-Zugriff vollständig auszufüllen.

| Bereich | Soll-Evidence | Aktuell |
|---|---|---|
| Workspace | Workspace name + plan | UNVERIFIED |
| Service | Service ID + service name | Name repo-verifiziert, ID UNVERIFIED |
| Source | GitHub repo + branch | UNVERIFIED DASHBOARD |
| Runtime | Docker | VERIFIED_REPO |
| Region | exakter Render Region Code | UNVERIFIED |
| Instance | Plan / CPU / RAM | UNVERIFIED |
| Scaling | manual count / autoscaling targets | UNVERIFIED |
| Project | Project name | UNVERIFIED |
| Environment | Production environment assignment | UNVERIFIED |
| Protection | Protected environment enabled | UNVERIFIED |
| Network | Cross-environment isolation | UNVERIFIED |
| Auto Deploy | `checksPass` | UNVERIFIED |
| Overlapping Deploy Policy | selected policy | UNVERIFIED |
| Health | `/healthz` or approved `/readyz` | repo=`/healthz` |
| Shutdown | max shutdown delay | UNVERIFIED |
| Docker | Dockerfile path / Docker command override | UNVERIFIED |
| Root Dir | service root directory | UNVERIFIED |
| Build Filters | included/ignored paths | UNVERIFIED |
| Pre-deploy | command, if any | UNVERIFIED |
| Domains | custom domains + redirect canonicalization | UNVERIFIED |
| Render subdomain | enabled/disabled | UNVERIFIED |
| TLS | certificate status | provider-managed, dashboard state UNVERIFIED |
| Disk | none / mount path / size | render.yaml none; Dashboard UNVERIFIED |
| Env Groups | names + project scope | UNVERIFIED |
| Env Vars | key inventory only, never values in docs | PARTIAL |
| Secret Files | filename inventory only | UNVERIFIED |
| Notifications | failure/all + destination | UNVERIFIED |
| Webhooks | event hooks and ownership | UNVERIFIED |
| Preview | off/manual/automatic + expiry | UNVERIFIED |
| Maintenance | state + configured URI | UNVERIFIED |
| GitHub Integration | Render GitHub App repository scope | UNVERIFIED |
| Deploy | current production commit SHA | UNVERIFIED in current main runtime |

### Evidence-Regel

Keine Secret-Werte, API-Tokens, Deploy-Hook-URLs oder Credentials in dieses Dokument kopieren.

Erlaubt sind ausschließlich Namen, IDs/Fingerprints und boolesche Konfigurationszustände, soweit sie selbst kein Secret darstellen.

---

## 13. Umsetzungsreihenfolge

### Phase 0 — sofort

1. Render Dashboard Evidence erfassen.
2. Prüfen, ob `/app/uploads` persistent ist.
3. Wenn kein Disk vorhanden: lokale Business-State-Fallbacks als Datenverlust-Risiko behandeln.
4. Current Auto-Deploy Policy prüfen.
5. Current Region/Plan/Instance Count dokumentieren.

### Phase 1 — Deployment Contract

1. `PORT`-Binding korrigieren.
2. Graceful Shutdown Coordinator implementieren.
3. Liveness/Readiness Contract definieren.
4. Render `autoDeployTrigger: checksPass` normativ festlegen.
5. Service-/Environment-Topology als Blueprint vervollständigen.
6. Rollback Runbook korrigieren.

### Phase 2 — Stateless Web Tier

1. Background Jobs aus Web-Prozess extrahieren.
2. Idempotency / distributed locks definieren.
3. lokales Subscription-/Credit-Persistieren entfernen.
4. danach Multi-Instance/Autoscaling neu bewerten.

### Phase 3 — Operational Hardening

1. Protected Production Environment;
2. environment-scoped Secret Groups;
3. Notification-/Incident Integration;
4. external uptime/smoke probe;
5. Build image digest policy;
6. controlled Preview Environment Strategy.

---

## 14. Definition of Done für ADR-0037

ADR-0037 darf erst als vollständig umgesetzt gelten, wenn:

- alle Dashboard-Evidence-Felder aus Abschnitt 12 belegt sind;
- Production Port aus `PORT` gelesen wird;
- Render Auto-Deploy nach CI Checks verifiziert ist;
- Production Environment Protection verifiziert ist;
- Region/Plan/Scaling als Source of Truth dokumentiert sind;
- keine authoritative Business-Daten auf ephemerem FS liegen;
- Background Work nicht unkontrolliert pro Web-Replica dupliziert wird;
- SIGTERM/Graceful Shutdown getestet ist;
- Readiness Contract getestet ist;
- Rollback-Runbook der aktuellen Render-Semantik entspricht;
- Environment-Key-Inventar vollständig automatisiert geprüft wird;
- Notifications und External Probe belegt sind;
- ein Disaster-Recreation-Test aus dokumentierter IaC + Secret Inventory durchgeführt wurde.

---

## 15. Offizielle Render-Referenzen — Stand 2026-08-03

- Web Services / Port Binding: `https://render.com/docs/web-services`
- Deploys / Auto Deploy / Graceful Shutdown: `https://render.com/docs/deploys`
- Health Checks: `https://render.com/docs/health-checks`
- Blueprints / IaC: `https://render.com/docs/infrastructure-as-code`
- Blueprint Spec: `https://render.com/docs/blueprint-spec`
- Environment Variables and Secrets: `https://render.com/docs/configure-environment-variables`
- Projects / Protected Environments: `https://render.com/docs/projects`
- Persistent Disks: `https://render.com/docs/disks`
- Scaling: `https://render.com/docs/scaling`
- Rollbacks: `https://render.com/docs/rollbacks`
- Notifications: `https://render.com/docs/notifications`
- Custom Domains: `https://render.com/docs/custom-domains`
- Uptime Best Practices: `https://render.com/docs/uptime-best-practices`

Provider-Anforderungen müssen bei zukünftigen Render-Architekturänderungen erneut gegen die aktuelle Dokumentation geprüft werden.
