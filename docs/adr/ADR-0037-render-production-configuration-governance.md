# Architectural Decision Record (ADR-0037)
## Render Production Configuration Governance, Stateless Runtime & Reproducible Deployment Contract

**Status:** ACCEPTED  
**Implementation-Status:** 🔴 HIGH PRIORITY / IN PROGRESS  
**Date:** 2026-08-03  
**Version:** 0.6.0  
**Priority:** P0/P1  
**Related audit:** `docs/architecture/RENDER_PRODUCTION_CONFIGURATION_AUDIT.md`  
**Related ADR:** ADR-0009, ADR-0011, ADR-0017, ADR-0030, ADR-0035  
**Dependency:** ADR-0036 is being developed independently in PR #75; ADR-0037 must not overwrite its PR-governance scope.

---

## 1. Kontext

CAPITAL-AI wird als Docker-basierter Render Web Service betrieben. Das Repository enthält mit `render.yaml`, `Dockerfile`, `/healthz`, GitHub CI und Deployment-Readiness bereits wesentliche Produktionsbausteine.

Der Render-Audit vom 03.08.2026 zeigt jedoch, dass die tatsächliche Production Configuration noch nicht vollständig als reproduzierbarer Architekturvertrag vorliegt:

- `render.yaml` definiert nur Service Type, Name, Docker Runtime, Health Check und Secret-Platzhalter;
- Region, Instance Plan, Scaling, Auto-Deploy-Policy, Environment Protection, Domains, Shutdown Delay und weitere Controls sind nicht repositoryseitig festgeschrieben;
- der Server bindet fest auf Port 3000 statt auf den Render-`PORT`-Vertrag;
- der öffentliche Health Check ist primär Liveness und bildet kritische Readiness nicht explizit ab;
- ein expliziter `SIGTERM`-/Graceful-Shutdown-Flow fehlt;
- Background Jobs laufen im Web-Prozess und verhindern ein sicheres horizontales Scale-out;
- lokale Subscription-/Credit-Fallbacks können auf das Render-Dateisystem geschrieben werden, das standardmäßig ephemeral ist;
- das aktuelle Env-Inventory-Gate kann dynamisch zusammengesetzte Environment-Schlüssel übersehen;
- das bestehende Rollback-Runbook beschreibt Teile der heutigen Render-Rollback-Semantik nicht mehr korrekt.

Ein direkter Render-Connector stand beim Audit nicht zur Verfügung. Dashboard-only Werte bleiben daher bis zur Production-Evidence-Erhebung unverifiziert und dürfen nicht geschätzt werden.

---

## 2. Problem Statement

Ein Enterprise-FinTech-System darf seine Produktionswahrheit nicht aus einer Mischung aus:

```text
partial render.yaml
+ undocumented Dashboard settings
+ runtime fallbacks
+ implicit agent knowledge
```

ableiten.

Ohne einen verbindlichen Contract entstehen insbesondere folgende Fehlerklassen:

1. **Configuration Drift:** Dashboard und Repository entwickeln sich auseinander.
2. **Non-Reproducible Recovery:** ein neu erstellter Service erhält andere Region-/Plan-/Deploy-Einstellungen.
3. **Silent Data Loss:** lokaler Fallback wird bei Restart/Deploy verworfen.
4. **Unsafe Scaling:** zusätzliche Web-Instanzen duplizieren Scheduler/Background Jobs.
5. **Partial Readiness:** Render schaltet eine Instanz live, obwohl kritische Teilfunktionen nicht verfügbar sind.
6. **Shutdown Races:** Deploys beenden laufende Jobs/Requests unkontrolliert.
7. **Deployment Bypass:** Production deployt vor oder unabhängig von verpflichtenden CI Gates.
8. **Incident Ambiguity:** Rollback-/Environment-Wirkung ist nicht vollständig bekannt.

---

## 3. Entscheidung

### 3.1 Render Production Configuration wird ein geschützter Architekturvertrag

Die Render-Konfiguration wird in drei klar getrennte Klassen aufgeteilt:

```text
A. IaC-managed
B. Secret-managed
C. Operational-managed
```

Jede Produktionseinstellung MUSS genau einer Klasse zugeordnet sein.

#### A. IaC-managed

Diese Werte sollen nach erfolgreicher Dashboard-Evidence im `render.yaml` bzw. einer daraus abgeleiteten Render-IaC-Struktur die Source of Truth bilden:

- Service type/name/runtime;
- repository + production branch;
- region;
- plan/compute class;
- autoDeployTrigger;
- healthCheckPath;
- maxShutdownDelaySeconds;
- manual scaling / autoscaling policy;
- custom domains;
- Render subdomain policy;
- Dockerfile path/context/command where applicable;
- build filters;
- Project/Environment topology where supported;
- Environment protection/network isolation where supported;
- preview policy.

#### B. Secret-managed

Secret-Werte bleiben außerhalb des Repositories in Render.

Repository speichert ausschließlich den Contract:

```text
key
classification
required/optional
build/runtime scope
owner
rotation impact
dependent components
```

Keine Secret-Werte, Deploy Hook URLs oder Access Tokens werden dokumentiert.

#### C. Operational-managed

Nicht vollständig per Blueprint repräsentierbare Einstellungen werden mit Evidence dokumentiert:

- notification destinations;
- workspace member roles;
- GitHub App installation scope;
- operational webhooks;
- incident contacts.

---

### 3.2 Production Web Tier ist stateless

Der Render Web Service darf keinen authoritative Business State im lokalen Dateisystem halten.

Insbesondere verboten als durable Source of Truth:

- Subscription Status;
- Billing Entitlements;
- PDF/Credit Balances;
- IAM State;
- Approval State;
- Financial user state.

Zulässige lokale Daten:

- bounded temporary files;
- regenerierbare caches;
- non-authoritative diagnostics.

Persistenter Business State gehört in Supabase/Postgres oder einen explizit freigegebenen durable Service.

### Konsequenz für Render Disk

Ein Render Persistent Disk wird **nicht** als Standardlösung für diese Business-Daten eingeführt.

Begründung:

- Disk bindet den Service an eine Instanz;
- Multi-Instance-Scaling ist nicht möglich;
- Zero-Downtime Deploys werden deaktiviert;
- Disk löst keine Multi-Service-/Transaction-Semantik.

Ein Disk benötigt künftig ein separates ADR mit exaktem Datentyp und Downtime-/Scaling-Folgen.

---

### 3.3 Web Request Plane und Background Execution Plane werden getrennt

Der aktuelle Web-Prozess enthält HTTP-Serving und wiederkehrende Background-Aktionen.

Zielarchitektur:

```text
Render Web Service
  - HTTP/API
  - auth/billing endpoints
  - stateless request processing

Render Worker / controlled scheduler
  - scheduled market refresh coordination
  - alert evaluation
  - snapshot jobs
  - non-request documentary jobs, where applicable

Supabase / lock store
  - idempotency
  - lease/leader coordination
  - durable job state
```

Bis diese Trennung technisch abgeschlossen und getestet ist:

```text
numInstances = 1
AUTOSCALING = FORBIDDEN
```

für den aktuellen kombinierten Web-Prozess.

Eine Skalierungsänderung vor Abschluss gilt als protected architectural change.

---

### 3.4 Render Port Contract ist verbindlich

Die Anwendung muss ihren HTTP-Port aus `process.env.PORT` lesen und weiterhin an `0.0.0.0` binden.

Normativer Contract:

```ts
const PORT = Number(process.env.PORT || 3000);
```

Ein hartcodierter Production-Port ist nicht mehr zulässig.

Docker-internes `EXPOSE` und lokaler Docker-Healthcheck müssen mit demselben Portmodell kompatibel sein.

---

### 3.5 Production Deployments dürfen CI nicht umgehen

Für den production-linked Render Service gilt als Ziel:

```yaml
autoDeployTrigger: checksPass
```

Ein Production Deploy darf nicht allein durch einen Commit auf `main` ausgelöst werden, wenn verpflichtende CI Checks fehlen oder fehlschlagen.

Da Render `success`, `neutral` und `skipped` als bestanden interpretieren kann, gilt zusätzlich:

> Kritische Required Checks dürfen nicht durch optionale Workflow-Bedingungen zu `skipped` werden.

Die GitHub-Required-Check-Architektur wird durch ADR-0036 ergänzt; ADR-0037 definiert die Render-Seite dieses Vertrages.

---

### 3.6 Production Environment muss geschützt werden

Wenn der aktuelle Render Workspace/Plan diese Funktion unterstützt und der Service einem Project Environment zugeordnet ist, wird Production als `Protected Environment` betrieben.

Ziel:

- destruktive Dashboard-Aktionen nur Admins;
- Production Secrets nur autorisierte Admins;
- environment-scoped Environment Groups;
- Cross-Environment-Netzwerkzugriffe nach Architekturbedarf blockieren.

Wichtig: Render weist darauf hin, dass Blueprint-managed Ressourcen trotz Environment Protection weiterhin über Repository-/Blueprint-Änderungen verändert werden können. Daher sind GitHub CODEOWNERS/Branch Rules zwingender Teil des Gesamtschutzes.

---

### 3.7 Health wird in Liveness und Readiness getrennt

#### Liveness

Beantwortet ausschließlich:

> Läuft der Prozess und kann HTTP bedienen?

Keine externen Provider-Netzwerkaufrufe pro Probe.

#### Readiness

Beantwortet:

> Darf diese Instanz Production Traffic erhalten?

Readiness verwendet eine dokumentierte Dependency-Policy und bounded/cached checks.

Nicht jede optionale API darf die gesamte Anwendung unready machen.

Kritische Dependency-Gruppen werden explizit klassifiziert:

```text
CORE_RUNTIME
AUTH_IAM
DURABLE_STATE
BILLING
AI_OPTIONAL
MARKET_DATA_DEGRADED_ALLOWED
SMTP_OPTIONAL
```

Render `healthCheckPath` wird erst nach implementiertem und getestetem Readiness Contract auf den dafür vorgesehenen Endpoint umgestellt.

---

### 3.8 Graceful Shutdown ist verpflichtend

CAPITAL-AI implementiert einen zentralen Shutdown Coordinator für `SIGTERM`.

Normative Reihenfolge:

```text
SIGTERM
  -> readiness=false
  -> stop scheduling new jobs
  -> stop watchers/intervals
  -> stop accepting new HTTP work
  -> drain in-flight requests
  -> settle bounded operations
  -> flush security/audit logs where possible
  -> close provider/client resources
  -> exit(0)
```

`maxShutdownDelaySeconds` wird nicht willkürlich gewählt, sondern anhand eines Tests festgelegt.

---

### 3.9 Environment Contract wird zentralisiert

Die Anwendung benötigt einen kanonischen Production Env Contract, der dynamisch genutzte Schlüssel ebenfalls kennt.

Der Contract umfasst mindestens:

- Supabase URLs/keys;
- Stripe secrets + webhook;
- alle aktiven monthly/yearly/one-time Price IDs;
- TOTP Encryption;
- SMTP;
- AI Provider Keys;
- Market Data Provider Keys;
- Metrics;
- Social OAuth Clients;
- public Vite build variables.

Der Contract muss Quelle für automatisierte Validierung und Dokumentation sein.

Reguläre Expressions über `getCleanEnv('literal')` allein reichen nicht als vollständiger Nachweis.

---

### 3.10 Rollback Knowledge muss provideraktuell sein

Das Runbook muss folgende Render-Eigenschaften korrekt widerspiegeln:

- Dashboard-Rollback kann vorhandene Build-Artefakte wiederverwenden;
- Dashboard-Rollback deaktiviert automatische Deploys;
- Code-Rollback ist kein Datenbank-Rollback;
- ein Rollback setzt nicht automatisch jede aktuelle Servicekonfiguration zurück;
- Environment Groups und Disks besitzen eigene Semantik;
- ein Git-Revert und ein Render Instant Rollback sind unterschiedliche Recovery-Mechanismen.

Providerverhalten wird bei relevanten Render-Änderungen erneut gegen aktuelle Dokumentation geprüft.

---

### 3.11 Production Region ist explizite Architekturentscheidung

Die tatsächliche Render-Region wird als Production Evidence erfasst.

Da Render die Region eines bestehenden Services nicht nachträglich ändern lässt, darf kein Agent blind `region: frankfurt` oder eine andere Region in den Blueprint schreiben.

Ein Regionswechsel erfordert:

- Latenzbewertung;
- Datenfluss-/Compliance-Bewertung;
- externe Provider-Topologie;
- DNS-/Domain-Cutover-Plan;
- neuer Service / Migration Plan;
- Rollback Plan.

---

### 3.12 Monitoring besteht aus internem und externem Signal

Mindestens:

```text
Render health check
+ Render failure/unhealthy notifications
+ external HTTP probe
+ CAPITAL-AI metrics/log correlation
```

Ein internes Healthcheck-Signal allein gilt nicht als vollständiges Production Monitoring.

---

## 4. High-Priority Finding Matrix

| Finding | Priority | Decision |
|---|---|---|
| Ephemeral entitlement fallback | P0 | durable Business State only in Supabase/approved store |
| Web + Background mixed | P0 | split execution planes; block autoscaling until done |
| Hardcoded port | P1 | use Render `PORT` contract |
| Partial Blueprint | P1 | complete IaC after evidence collection |
| Auto Deploy unknown | P1 | verify and target `checksPass` |
| Graceful shutdown absent | P1 | central SIGTERM coordinator |
| Readiness unclear | P1 | define liveness/readiness contract |
| Dynamic env keys | P1 | central env contract |
| Region/plan/scale unknown | P1 | mandatory dashboard evidence + IaC |
| Rollback docs drift | P1 | update runbook |

---

## 5. Production Change Authorization

Render Production Settings sind Teil der Production Control Plane.

Änderungen an folgenden Bereichen erfolgen nicht still aus einer Entwicklungsumgebung oder durch einen Agenten:

- region;
- plan;
- scaling;
- disk;
- custom domains;
- subdomain policy;
- environment protection;
- network isolation;
- auto deploy;
- secrets/environment groups;
- deploy hooks/API credentials;
- maintenance mode;
- notifications affecting incident routing.

Jede Änderung benötigt:

1. Current-State Evidence;
2. geplanten Sollzustand;
3. Impact/Blast Radius;
4. Rollback Plan;
5. zuständige Human-Freigabe nach CAPITAL-AI Governance;
6. post-change verification;
7. Dokumentations-/Traceability-Update.

---

## 6. Implementation Phases

### Phase A — Production Evidence / no mutation

- Render Dashboard Werte vollständig erfassen;
- Secret-Key-Inventar nur als Namen erfassen;
- current deploy commit dokumentieren;
- Region/Plan/Scaling/AutoDeploy/Environment Protection dokumentieren;
- Disk-Status verifizieren.

### Phase B — Runtime Safety

- PORT Contract;
- Graceful Shutdown;
- Readiness Contract;
- local authoritative state entfernen;
- secret diagnostic logging reduzieren.

### Phase C — Execution Plane Separation

- Background Jobs aus Web-Service lösen;
- idempotency/lease semantics;
- Worker/Scheduler Deployment;
- danach Scaling neu entscheiden.

### Phase D — IaC Completion

- verified Dashboard Config in Blueprint übernehmen;
- environment groups / project environment;
- `checksPass`;
- domains/subdomain policy;
- shutdown/scaling;
- blueprint validation in CI.

### Phase E — Resilience

- notifications;
- external probe;
- recovery drill;
- recreate-from-IaC drill;
- rollback drill.

---

## 7. Nicht gewählte Alternativen

### Alternative A — Alles im Dashboard lassen

**Abgelehnt.**

Grund: nicht reproduzierbar, Agenten kennen den echten Zustand nicht, hoher Drift-/Recovery-Risk.

### Alternative B — Alle Secret-Werte in `render.yaml`

**Abgelehnt.**

Grund: Credential Exposure / Repository Leakage.

### Alternative C — Render Disk für lokale Subscription-Dateien

**Abgelehnt als Standardarchitektur.**

Grund: Single-Instance-Bindung, kein Zero-Downtime Deploy, falsche Persistence-Schicht für relationale Billing-Wahrheit.

### Alternative D — Web Service einfach autoskalieren

**Abgelehnt bis Worker Separation.**

Grund: jeder Replica startet aktuell Background Jobs.

### Alternative E — Healthcheck direkt gegen alle Provider

**Abgelehnt.**

Grund: externe transient failures würden Deployments/Instances unnötig als komplett unready markieren. Readiness benötigt Dependency Classification und bounded checks.

---

## 8. Konsequenzen

### Positiv

- Render-Architektur wird reproduzierbar;
- weniger implizite Dashboard-Abhängigkeit;
- sichere Grundlage für Multi-Agent-Entwicklung;
- klare Ownership für Secrets und Provider;
- Scaling wird erst nach Statelessness freigegeben;
- geringeres Datenverlust- und Rollback-Risiko;
- bessere Incident Response;
- klarer Disaster-Recovery-Pfad.

### Trade-offs

- mehr IaC- und Evidence-Aufwand;
- Dashboard-Konfiguration muss zunächst vollständig inventarisiert werden;
- Background Work benötigt zusätzliche Deployment-Komponenten;
- Production Readiness erfordert explizite Dependency-Klassifikation;
- Render-Config-Änderungen werden formaler und langsamer, dafür nachvollziehbar.

---

## 9. Protected Invariants

Nach Umsetzung gelten mindestens als geschützt:

```text
render.yaml production service identity
production branch
autoDeployTrigger=checksPass
PORT binding contract
health/readiness contract
graceful shutdown coordinator
stateless web-tier rule
no authoritative business state on local Render FS
numInstances=1 until worker separation
production environment protection
production env contract
custom domain/subdomain decision
rollback runbook
```

Ein späterer Agent darf diese Controls nicht als vereinfachendes Refactoring entfernen.

---

## 10. Definition of Done

ADR-0037 darf erst nach `docs/adr/resolved/` verschoben werden, wenn:

1. Render Dashboard Evidence vollständig ist;
2. Region, Plan, Instance Count/Scaling und Project Environment dokumentiert sind;
3. Production Environment Protection verifiziert ist;
4. Auto Deploy `checksPass` verifiziert ist;
5. Render-linked production branch verifiziert ist;
6. App `process.env.PORT` nutzt;
7. SIGTERM-Graceful-Shutdown getestet ist;
8. Render Health Check den akzeptierten Readiness Contract nutzt;
9. Subscription/Credit authoritative fallbacks nicht mehr auf ephemerem FS liegen;
10. Background Jobs entweder separiert oder durch getestete Singleton-/Lease-Semantik geschützt sind;
11. horizontales Scaling erst danach getestet/freigegeben ist;
12. vollständiger Env Contract CI-validiert wird;
13. Rollback Runbook aktualisiert ist;
14. failure/unhealthy notifications verifiziert sind;
15. external uptime probe dokumentiert ist;
16. IaC Disaster-Recreation Test durchgeführt wurde;
17. Traceability Matrix auf ADR-0037 und betroffene Komponenten aktualisiert wurde.

Bis dahin bleibt:

```text
Implementation-Status: HIGH PRIORITY / IN PROGRESS
```

---

## 11. Provider References — 2026-08-03

- Render Web Services / Port Binding: `https://render.com/docs/web-services`
- Render Deploys / CI / SIGTERM: `https://render.com/docs/deploys`
- Render Health Checks: `https://render.com/docs/health-checks`
- Render Blueprints: `https://render.com/docs/infrastructure-as-code`
- Render Blueprint Spec: `https://render.com/docs/blueprint-spec`
- Render Environment Variables: `https://render.com/docs/configure-environment-variables`
- Render Projects / Protected Environments: `https://render.com/docs/projects`
- Render Persistent Disks: `https://render.com/docs/disks`
- Render Scaling: `https://render.com/docs/scaling`
- Render Rollbacks: `https://render.com/docs/rollbacks`
- Render Notifications: `https://render.com/docs/notifications`
- Render Uptime Best Practices: `https://render.com/docs/uptime-best-practices`

Die Provider-Referenzen sind bei Implementierung und Re-Audit erneut zu validieren.
