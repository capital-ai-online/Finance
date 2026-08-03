# CAPITAL-AI — Render Production Audit Part 2: Stateless Web Tier & Worker Architecture

**Audit ID:** RENDER-AUDIT-0002  
**Audit date:** 2026-08-03  
**Status:** COMPLETE FOR VERIFIED LIVE / REPOSITORY / DATABASE EVIDENCE  
**Priority:** CRITICAL / HIGH  
**System:** CAPITAL-AI / `capital-ai.online`  
**Repository:** `SvenKulessa/Finance`  
**Production service:** Render `Finance` (`srv-d91o1o9o3t8c73edi55g`)  
**Related ADR:** ADR-0037 — Render Production Configuration Governance, Stateless Runtime & Reproducible Deployment Contract  
**Previous audit:** `docs/architecture/RENDER_PRODUCTION_CONFIGURATION_AUDIT.md`

---

## 1. Ziel und Scope

Teil 2 prüft die Phase-2-Anforderungen aus ADR-0037:

1. Ist der Render-Webservice wirklich stateless?
2. Welche Business-, Audit-, Agent-, Documentary- und Runtime-Zustände liegen noch lokal im Container oder Prozessspeicher?
3. Welche Background-Jobs laufen im HTTP-Prozess?
4. Welche Jobs sind idempotent und welche erzeugen bei paralleler Ausführung doppelte Side Effects?
5. Welche Parallelität entsteht bereits durch Render Zero-Downtime Deployments bei `numInstances = 1`?
6. Welche Komponenten müssen vor horizontalem Scaling in Worker/Scheduler, Durable State oder Distributed Coordination überführt werden?

Dieser Audit verändert keine Supabase-Daten, keine Render-Skalierung und keine produktiven Business-Daten.

---

## 2. Evidence-Klassen

| Status | Bedeutung |
|---|---|
| `VERIFIED_RENDER` | Direkt im aktiven Render-Service/Deploy/Log verifiziert. |
| `VERIFIED_REPO` | Direkt aus dem aktuellen Repository gelesen. |
| `VERIFIED_SUPABASE` | Direkt gegen das aktive Produktionsprojekt gelesen. |
| `VERIFIED_RUNTIME` | Live-Verhalten in Produktionslogs belegt. |
| `RISK` | Aus verifizierten Komponenten abgeleitetes Risiko. |
| `TARGET` | Normativer Zielzustand, noch nicht automatisch implementiert. |

Keine Secret-Werte, Tokens oder Credentials werden in diesem Dokument gespeichert.

---

## 3. Aktuelle Produktionsbaseline

### Render

```text
Workspace:           AICapital
Service:             Finance
Service ID:          srv-d91o1o9o3t8c73edi55g
Repository:          SvenKulessa/Finance
Branch:              main
Runtime:             Docker
Region:              Frankfurt
Plan:                Starter
Configured instances: 1
Auto deploy:         yes
Auto deploy trigger: commit
Health check path:   nicht im Live-Service gesetzt
```

Aktueller Produktionsstand zum Rebase dieses Audits:

```text
Production commit: 24d9daecaf4100ef7dccd3c3c375ac6b0ae8bd43
Render deploy:     dep-d9o3sovk4qsc73b4vl80
Status:            live
Trigger:           new_commit
```

Bemerkung: Auch reine Dokumentations-Commits auf `main` lösen derzeit vollständige Render-Deployments aus. Das bestätigt erneut, dass `autoDeployTrigger=commit` noch nicht auf den ADR-0037-Zielzustand `checksPass` umgestellt wurde.

### Supabase

```text
Project:     AIFINANCIAL
Project ref: ryzywoktpmyhwzxmstyu
Region:      eu-west-1
Postgres:    17
Status:      ACTIVE_HEALTHY
```

Für diesen Audit relevante durable Tabellen:

- `subscriptions`
- `user_quota`
- `score_snapshots`
- `alert_subscriptions`
- `subscription_confirmations_sent`
- `security_events`
- `audit_logs_iam`
- `iam_access_log`
- `compliance_runs`
- `screening_slo_evidence`

Im aktuellen Produktionsschema fehlen dagegen dedizierte Tabellen für:

- PDF Export Credits / Credit Ledger;
- generische Worker-Leases / Leader Election;
- Alert Delivery Outbox / Delivery Idempotency;
- allgemeine System Events aus `server/systemEvents.ts`;
- Agent Runtime Registry;
- Documentary Hygiene Runtime State;
- Version Manager Runtime State.

---

## 4. Executive Result

Der aktuelle Render-Webservice ist **nicht stateless**.

Die Zustandsbindung besteht gleichzeitig auf drei Ebenen:

```text
A. Local filesystem state
   subscriptions.json
   pdf_credits.json
   system_events.json
   agents_registry.json
   document_hygiene.json
   version_manager.json
   docs/.history/*
   runtime mutations under docs/*

B. In-process state
   market-data cache
   active market-data promise
   provider cooldowns
   security rate-limit buckets
   Event Mesh registry/delivery log
   SSE client registry
   Documentary watcher/timers

C. Background side effects in HTTP process
   startup market-data prefetch
   60-second market-data refresh
   score snapshot recording
   alert evaluation/email delivery
   Documentary filesystem watcher
```

**Horizontal Scaling bleibt nicht freigabefähig.**

Noch wichtiger: Das Duplicate-Execution-Risiko tritt bereits heute bei normalen Render-Deployments auf.

---

## 5. Live-Beweis: Parallel laufende Background-Jobs während Zero-Downtime Deployment

Beim Deploy von PR #79 wurde der Übergang zwischen alter und neuer Instanz direkt beobachtet.

### Alte Instanz

```text
srv-d91o1o9o3t8c73edi55g-rlrtb
```

führte um `06:58:19Z` weiterhin den CoinMarketCap-/Market-Data-Refresh aus.

### Neue Instanz

```text
srv-d91o1o9o3t8c73edi55g-2ql5c
```

war bereits hochgefahren und führte um `06:58:32Z` ihren eigenen Market-Data-Refresh aus.

### Shutdown der alten Instanz

Die alte Instanz erhielt erst um ungefähr `06:58:34Z` SIGTERM.

Damit gilt empirisch:

```text
configured numInstances = 1
              !=
exactly one process executes scheduled work at every instant
```

Render Zero-Downtime Deployment bildet selbst bei einer konfigurierten Webinstanz ein temporäres Multi-Process-Concurrency-Fenster.

**Konsequenz:** Nicht-idempotente Background-Arbeit muss duplicate-safe sein, selbst wenn Autoscaling dauerhaft deaktiviert bleibt.

---

## 6. Durable-/Ephemeral-State-Audit

### 6.1 Subscription / Entitlement

`server/db.ts` verwendet zusätzlich zu Supabase:

```text
uploads/subscriptions.json
```

`saveSubscription()` schreibt lokal, bevor der Remote-Upsert erfolgt. `getSubscription()` kann bei fehlender Supabase-Verfügbarkeit aus der lokalen Datei lesen.

Supabase besitzt bereits eine produktive `subscriptions`-Tabelle mit:

```text
id uuid PK
user_id uuid UNIQUE -> auth.users.id
stripe_subscription_id UNIQUE
tier
status
current_period_end
expires_at
updated_at
```

### RND2-F-001 — P0

**Local Subscription Fallback kann zu veralteter Entitlement-Wahrheit werden.**

Risiken:

- pro Container unterschiedliche Datei;
- Verlust bei Restart/Deploy;
- alter Pro-/Enterprise-Tier kann bei DB-Ausfall weiter ausgeliefert werden;
- Downgrade/Cancellation kann lokal veraltet bleiben;
- nicht-transaktionale zweite Zustandsquelle;
- keine Cache-Kohärenz zwischen parallelen Instanzen.

**Ziel:** Supabase ist einzige Subscription-/Entitlement-Source-of-Truth. Privilegierte Entitlement-Entscheidungen müssen bei fehlender durable Source fail closed oder einen ausdrücklich definierten, integrity-protected und zeitlich begrenzten Cache-Vertrag verwenden. Eine freie JSON-Datei ist nicht ausreichend.

---

### 6.2 PDF Export Credits

Aktuell:

```text
uploads/pdf_credits.json
```

wird für Credit-Abfrage, Verbrauch und Stripe-Kauf verwendet.

Verbrauch:

```text
read current
  -> current - 1
  -> write JSON
```

Stripe-PDF-Kauf:

```text
checkout/webhook
  -> read current
  -> current + 3
  -> write JSON
```

Im produktiven Supabase-Schema existiert **keine PDF-Credit-Tabelle**.

### RND2-F-002 — P0

**Bezahlte PDF-Credits sind nur auf ephemerem lokalen Dateisystem authoritative.**

Risiken:

- gekaufte Credits können nach Deploy/Restart verschwinden;
- paralleles Read-Modify-Write kann Updates verlieren;
- alte/neue Render-Instanz können unterschiedliche Salden führen;
- Stripe kann Zahlung erfolgreich verbuchen, während das Entitlement später verschwindet;
- Webhook-Retry kann Credits mehrfach addieren;
- keine durable Idempotency per Stripe Event/Session.

Empfohlenes Zielmodell:

```text
pdf_credit_accounts
  user_id PK/FK
  balance
  updated_at

pdf_credit_ledger
  id
  user_id
  delta
  source
  stripe_event_id UNIQUE
  created_at
  metadata
```

Credit-Verbrauch muss atomar erfolgen, z. B. durch eine transaktionale Postgres-Funktion oder:

```sql
UPDATE pdf_credit_accounts
SET balance = balance - 1
WHERE user_id = $1
  AND balance > 0
RETURNING balance;
```

---

### 6.3 System-/Audit-Events

`server/systemEvents.ts` verwendet:

```text
uploads/system_events.json
```

Wenn die Datei fehlt, erzeugt der Code vorbefüllte Initial-/Beispielereignisse. Der Enterprise Event Mesh Publish ist nur additiv/best-effort.

### RND2-F-003 — P0

**Security-/Audit-Trail ist ephemer und enthält synthetisch vorbefüllte Ereignisse.**

Risiken:

- Audit-Historie verschwindet bei Deploy/Restart;
- Instanzen besitzen unterschiedliche Audit-Trails;
- SSE-Clients sehen nur instanzlokale Ereignisse;
- synthetische Ereignisse sind keine Betriebsbeweise;
- Konflikt mit No Demo Data Policy;
- nicht geeignet als revisionssichere Compliance Evidence.

**Ziel:** append-only/durable Audit Store. Bestehende Supabase Security-/IAM-Tabellen können ergänzt oder durch ein dediziertes `system_audit_events`-Schema erweitert werden. Synthetische Seed-Events müssen aus Production entfernt werden.

---

### 6.4 Agent Registry

`server/systemEvents.ts` führt zusätzlich:

```text
uploads/agents_registry.json
```

mit Agentstatus, active task, query count, Modelllabel und Custom-Agent-Registrierung.

### RND2-F-004 — P1

**Agent Operational Registry ist instanzlokal.**

Ein Agent kann in mehreren Prozessen gleichzeitig unterschiedliche Zustände zeigen. Query Counts sind nicht global und verschwinden beim Containerwechsel.

---

### 6.5 Documentary Hygiene

`server/documentHygiene.ts` verwendet:

```text
uploads/document_hygiene.json
docs/.history/*
```

Der produktive Webprozess startet einen persistenten Chokidar-Watcher für `/app/docs` und kann unter anderem:

- Markdown-/JSON-/Text-Inhalte verändern;
- Branding anwenden;
- abhängige Dokumente propagieren;
- Review-Tickets anwenden;
- Review-Reverts durchführen;
- Backups unter `docs/.history` erzeugen.

### RND2-F-005 — P0

**Autonomous Documentary kann den deployed Git-Stand außerhalb von Branch/PR-Governance verändern.**

Das widerspricht dem neuen Single-Writer-/PR-First-Modell:

```text
GitHub protected main
      -> immutable build artifact
      -> Render container
      X runtime mutation must not become a second repository truth
```

Risiken:

- Running Container kann von `main` abweichen;
- keine PR-/CODEOWNER-Prüfung;
- Änderung wird nicht zurück nach Git synchronisiert;
- Änderung verschwindet beim Deploy;
- parallele Container können verschiedene Dokumentstände haben;
- Review History ist nicht revisionssicher.

**Ziel:** Production Documentary erzeugt Vorschläge als Git-Branch/PR oder in einem durable Review Store. Der HTTP-Webprozess darf keinen dauerhaften Git-controlled `docs/`-Watcher besitzen.

---

### 6.6 Version Manager

`src/platform/VersionManager/versionManager.ts` verwendet:

```text
uploads/version_manager.json
```

und kann ebenfalls Dokumente unter `docs/` schreiben. Der Default-State referenziert weiterhin `0.5.4`, während die aktuelle Application Runtime `0.6.0` ist.

### RND2-F-006 — P1

**Version State ist lokal, mutable und nicht deployment-authoritative.**

Die Produktionsversion muss aus immutable Deployment Identity / Git / Release Metadata abgeleitet werden.

---

## 7. Background-Job-Audit

### 7.1 Market Data Pre-cache

Jeder Webprozess startet beim Boot einen eigenen `fetchLiveMarketData()`-Lauf.

**Risiko:** Jeder Container erzeugt eigene Provider-Requests.

### 7.2 60-Sekunden Market Refresh

Der Webserver registriert einen periodischen Refresh. Prozesslokal sind unter anderem:

- Market Cache;
- aktive Promise für Request-Coalescing;
- CoinMarketCap Cooldown;
- CoinGecko Cooldown.

Request-Coalescing schützt nur innerhalb eines Node-Prozesses.

### RND2-F-007 — P0/P1

**Market Refresh besitzt keine verteilte Lease. Duplicate Execution wurde live beobachtet.**

Das ist nicht nur ein zukünftiges Autoscaling-Risiko, sondern ein aktuelles Deploy-Risiko.

---

### 7.3 Score Snapshots

`recordDailySnapshots()` persistiert in Supabase.

Die Migration definiert:

```text
UNIQUE(symbol, snapshot_date)
```

und der Code nutzt Upsert mit Duplicate-Schutz.

### RND2-F-008 — CONTROL PRESENT

**Score-Snapshot-Persistenz ist auf Datenbankzeilenebene idempotent.**

Das verhindert doppelte Tageszeilen, nicht jedoch doppelte Provider- und Scoring-Berechnungen vor dem Upsert.

---

### 7.4 Alert Evaluation / E-Mail

Aktueller Ablauf:

```text
SELECT confirmed active alert
  -> threshold/cooldown check
  -> send email
  -> UPDATE last_notified_at
```

Es gibt keinen atomaren Delivery Claim vor dem Mailversand.

### RND2-F-009 — P1

**Alert E-Mail-Side-Effect ist nicht multi-instance-idempotent.**

Zwei Prozesse können dasselbe Abo lesen und beide senden, bevor einer `last_notified_at` aktualisiert.

Empfohlenes Ziel:

```text
alert evaluator
  -> atomic outbox/delivery claim
  -> UNIQUE(alert_id, evaluation_window/event_id)
  -> mail worker
  -> SENT / FAILED / retry state
```

---

## 8. Distributed Coordination

### 8.1 Enterprise Event Mesh

Der aktuelle Event Bus ist explizit:

```text
in-memory
one bus per process
no shared state across Render workers
```

### RND2-F-010 — P1 / BY DESIGN

**Event Mesh ist derzeit ein In-Process Dispatcher, kein Distributed Message Bus.**

Bei Worker-Separation darf er nicht stillschweigend als Cross-Service Queue interpretiert werden.

Zukünftige Optionen erfordern eine explizite Architekturentscheidung, beispielsweise:

- Postgres transactional outbox;
- Supabase Queue/pgmq, falls freigegeben;
- Redis-basierte Queue;
- NATS/Kafka/Service Bus in einer späteren Zielplattform.

---

### 8.2 Security Rate Limiter

Der Security Rate Limiter verwendet eine Node `Map` und dokumentiert selbst seine Single-Instance-Grenze.

### RND2-F-011 — P1 SECURITY

**Mit mehreren Replikas vervielfacht sich das effektive Rate-Limit-Budget.**

Vor Scale-out müssen mindestens IAM-/Owner-/Billing-/Mail-kritische Limits zentralisiert oder am Gateway/Edge erzwungen werden.

---

### 8.3 Generic Job Coordination

Im aktuellen produktiven Supabase-Schema wurde keine generische Worker-Lease-, Leader-Election-, Job-Claim- oder Alert-Outbox-Tabelle festgestellt.

### RND2-F-012 — P1

**Es fehlt ein generischer durable Coordination Contract für Background Work.**

Minimaler Zielvertrag könnte enthalten:

```text
worker_leases
  lease_key PK
  holder_id
  acquired_at
  expires_at
  heartbeat_at
  fencing_token
```

Anforderungen:

- atomare Acquisition;
- Lease Expiry;
- eindeutiger Lease Key;
- Holder enthält Deploy-/Service-/Instance-Identität;
- Fencing Token für stale-worker protection, wo Side Effects dies verlangen;
- Correlation-/Job-ID für Retries und Audit.

Für irreversible oder hochwertige externe Side Effects ist ein Outbox-/Idempotency-Ledger robuster als ausschließlich ein Zeit-Lease.

---

## 9. Zero-Downtime Deployment als eigener Concurrency Domain

Normative Korrektur aus dem Audit:

> `numInstances = 1` ist keine ausreichende Singleton-Garantie für Background Work.

Lifecycle:

```text
old instance
  | background timer active
  |
  +--------------------------+
                             |
                       new instance boot
                             |
                             + startup job
                             + timer registration
                             |
                       traffic switch
                             |
old instance still active ---+
  | possible additional timer cycle
  v
SIGTERM
```

Jeder nicht-idempotente Job benötigt daher mindestens einen der folgenden Mechanismen:

1. externen Lease-/Leader-Vertrag;
2. dedizierten Worker mit eindeutiger Ownership;
3. queue-/outbox-basierten idempotenten Consumer;
4. Kombination aus Lease und Idempotency Ledger.

---

## 10. Statelessness Matrix

| Komponente | Current State | Durable? | Multi-instance safe? | Ziel |
|---|---|---:|---:|---|
| HTTP/API/SPA | Container | N/A | grundsätzlich ja | Web Service |
| Market cache | Memory | No | No | cache only |
| Market scheduler | Web timer | No | **No** | Worker + lease |
| Provider cooldowns | Memory | No | No | worker-owned/shared contract |
| Score snapshots | Supabase | Yes | **Yes row-level** | Worker -> Supabase |
| Alert subscriptions | Supabase | Yes | Storage yes | Worker/outbox |
| Alert send | Send then update | Partly | **No** | atomic claim/outbox |
| Subscriptions | Supabase + JSON | Mixed | No | Supabase only |
| PDF credits | JSON | **No** | **No** | durable ledger |
| User quota | Supabase | Yes | DB-backed | retain/verify atomicity |
| Security events | Supabase where used | Yes | DB-backed | durable audit |
| System events | JSON | No | No | durable append-only |
| Event Mesh | Memory | No | No | in-process only or external transport |
| Rate limiter | Memory | No | No | distributed/edge critical limits |
| Agent registry | JSON | No | No | durable or explicitly ephemeral telemetry |
| Documentary state | JSON + docs mutation | No | No | Git PR / durable review |
| Version manager | JSON | No | No | deployment/release metadata |

---

## 11. Zielarchitektur

```text
                          GitHub
                            |
                     protected main
                            |
                       CI/Governance
                            |
                            v
                    Render Web Service
                    HTTP/API/SPA only
                     no schedulers
                  no authoritative FS
                            |
             +--------------+--------------+
             |                             |
             v                             v
          Supabase                  Worker/Scheduler
 durable business state              background only
 subscriptions/credits               market refresh
 audit/idempotency                   snapshots
 leases/outbox                       alert evaluation
             ^                             |
             +-----------------------------+
                    durable coordination
```

### Web Service darf im Zielzustand

- Requests authentifizieren/autorisieren;
- Input validieren;
- synchrone APIs orchestrieren;
- begrenzte nicht-authoritative Memory-Caches führen;
- Business State ausschließlich über durable Stores ändern;
- asynchrone Arbeit als durable Job-/Outbox-Intent publizieren.

### Web Service darf im Zielzustand nicht

- authoritative Business JSON lokal persistieren;
- Git-kontrollierte Dokumente autonom ändern;
- periodische Market Scheduler besitzen;
- nicht-idempotente Alert-/Mail-Scheduler ausführen;
- Release-Versionen in lokalem JSON authoritative verwalten;
- globale Security-Entscheidungen nur aus lokalem Memory ableiten.

### Worker/Scheduler übernimmt

- Market Refresh;
- Alert Evaluation;
- Mail Delivery bei Outbox-Modell;
- Score Snapshot Recording;
- Retry/Backoff;
- Provider Cooldowns;
- Job Lease/Heartbeat;
- Execution Telemetry.

---

## 12. Neue Governance-Beobachtung während des Audits

Während PR #80 offen war, wurde `main` durch parallele Arbeit weiterbewegt. Die reparierte Production-Preflight-Governance erkannte dies korrekt und blockierte den veralteten Audit-Branch, bis dieser auf aktuellen `main` gebracht wurde.

Das ist ein positiver End-to-End-Beweis für PR #79.

Gleichzeitig wurde direkt auf `main` ein neues Dokument angelegt:

```text
docs/adr/ADR-0036-server-composition-and-modularization.md
```

Der bestehende Multi-Agent-Governance-Vertrag verwendet jedoch bereits:

```text
docs/adr/ADR-0036-pr-first-multi-agent-single-writer-governance.md
```

und `AGENTS.md` verweist normativ auf diese bestehende ADR-0036.

### RND2-F-013 — P1 GOVERNANCE

**ADR-Nummernkollision durch parallele/direkte Arbeit auf `main`.**

Dies ist ein konkretes Beispiel dafür, warum ADR-Registrierung selbst unter Single-Writer-/PR-Governance fallen muss.

Empfohlene Folgemaßnahme außerhalb dieses Audit-PRs:

- ADR-Registry als maschinenprüfbare Source of Truth;
- CI blockiert doppelte numerische ADR-IDs unabhängig vom Dateinamen;
- neue ADR-ID wird erst nach aktuellem `main` reserviert;
- direkte `main`-Writes für `docs/adr/**` durch Branch Protection/CODEOWNER verhindern.

Dieser Audit-PR verändert oder renummeriert den fremden ADR-Commit nicht.

---

## 13. Priorisierte Remediation

### Phase 2A — P0 Durable Business State

1. Supabase PDF-Credit Account + Ledger einführen.
2. Stripe Credit Purchase per Stripe Event/Session idempotent machen.
3. Credit Consumption atomar machen.
4. `pdf_credits.json` aus Production Authority entfernen.
5. lokalen Subscription Write-first-/Fallback-Pfad entfernen.
6. fail-closed Entitlement-Verhalten definieren.

### Phase 2B — P0 Audit/Document Integrity

1. synthetische `system_events.json` Seed-Events entfernen;
2. System-/Audit-Evidence durable persistieren;
3. Production Documentary Filesystem-Mutation deaktivieren;
4. Documentary-Vorschläge in Git PR oder durable Review Queue überführen;
5. lokale Version-Manager-Autorität entfernen.

### Phase 2C — Worker Extraction

1. Market Refresh aus `server.ts` extrahieren;
2. Job Lease / Leader Contract einführen;
3. Score Snapshot in Worker-Pipeline verschieben;
4. Alert Delivery Outbox / Atomic Claim einführen;
5. Alert Evaluation und Versand in Worker verschieben;
6. Worker Shutdown-/Retry-Semantik definieren.

### Phase 2D — Distributed Security / Messaging

1. kritische Rate Limits zentralisieren oder am Gateway erzwingen;
2. Event Mesh Scope explizit als in-process belassen oder External Transport ADR erstellen;
3. Worker-/Job-Telemetrie durable und instance-aware machen;
4. Duplicate-/Stale-Lease-Metriken ergänzen.

### Phase 2E — Scale-out Qualification

Erst danach:

1. Zwei-Instanz-Staging-Test;
2. Deploy während aktiver Worker-Jobs;
3. Beweis: keine doppelten External Side Effects;
4. Beweis: keine Credit-/Subscription-Divergenz;
5. Beweis: Rate Limits unabhängig von Replica Count;
6. Worker Failover nach Lease Expiry testen;
7. erst dann Render Autoscaling neu bewerten.

---

## 14. Immediate Operational Guardrails

Bis Phase 2 abgeschlossen ist:

```text
Render Web numInstances MUST remain 1.
Autoscaling MUST remain disabled.
Treat every deploy as a temporary multi-process event.
Do not rely on local PDF credits as durable customer entitlement.
Do not rely on local subscriptions.json as privileged entitlement truth.
Do not rely on system_events.json as compliance/audit evidence.
Do not treat runtime Documentary changes as repository truth.
Do not use the in-memory Event Mesh as a distributed queue.
Do not assume process-local rate limits remain invariant under scaling.
```

---

## 15. Findings Register

| ID | Priorität | Finding | Status |
|---|---|---|---|
| RND2-F-001 | P0 | Subscription entitlement hat lokale stale/ephemeral Fallback-Autorität. | OPEN |
| RND2-F-002 | P0 | Bezahlte PDF-Credits sind local-only und non-atomic. | OPEN |
| RND2-F-003 | P0 | System-/Audit-Events sind ephemeral und enthalten Synthetic Seed Events. | OPEN |
| RND2-F-004 | P1 | Agent Registry ist instanzlokal. | OPEN |
| RND2-F-005 | P0 | Documentary kann Production-Files außerhalb Git/PR verändern. | OPEN |
| RND2-F-006 | P1 | Version Manager State ist lokal/mutable/version-drifted. | OPEN |
| RND2-F-007 | P0/P1 | Market Refresh ohne Distributed Lease; Duplicate Execution live belegt. | CONFIRMED LIVE |
| RND2-F-008 | PASS/P1 | Score Snapshot DB-Write besitzt Unique-/Idempotency-Control. | CONTROL PRESENT |
| RND2-F-009 | P1 | Alert-Send ist nicht duplicate-safe. | OPEN |
| RND2-F-010 | P1 | Event Mesh ist in-process und kein Distributed Bus. | OPEN / BY DESIGN |
| RND2-F-011 | P1 Security | Rate Limits sind prozesslokal. | OPEN / BY DESIGN |
| RND2-F-012 | P1 | Kein generischer Worker-Lease-/Outbox-Contract im Produktivschema. | OPEN |
| RND2-F-013 | P1 Governance | Doppelte ADR-0036-ID durch parallele/direkte Main-Arbeit. | CONFIRMED |

---

## 16. Definition of Done — ADR-0037 Phase 2

- [ ] Keine authoritative Subscription-/Entitlement-Daten auf Render Local FS.
- [ ] PDF Credit Balance + Ledger durable und transaction-safe.
- [ ] Stripe Credit Purchase idempotent über unveränderliche Provider-ID.
- [ ] Credit Consumption atomar.
- [ ] System-/Audit-Evidence durable.
- [ ] Synthetic Audit Seeds entfernt.
- [ ] Production Documentary mutiert keine Git-kontrollierten Deployment-Dateien.
- [ ] Version Authority kommt aus immutable Deployment Identity.
- [ ] Market Refresh wird nicht von jedem Webprozess ausgeführt.
- [ ] Alert Delivery ist duplicate-safe.
- [ ] Score Snapshot Idempotency bleibt nach Worker Extraction bestehen.
- [ ] Worker Lease/Fencing oder äquivalente Duplicate-Control implementiert.
- [ ] Kritische Rate Limits sind replica-invariant.
- [ ] Event Mesh Transport Scope ist explizit dokumentiert.
- [ ] Zero-Downtime Deploy Test beweist keine doppelten externen Side Effects.
- [ ] Zwei-Instanz-Qualification bestanden, bevor Scale-out aktiviert wird.
- [ ] ADR-ID-Eindeutigkeit wird maschinell geprüft.

---

## 17. Audit Conclusion

ADR-0037 Phase 2 ist **nicht production-complete**.

Der stärkste neue Beweis ist, dass Duplicate Background Execution bereits bei normalen Render Zero-Downtime Deployments auftritt. Stateless-/Worker-Remediation ist daher keine Vorbereitung auf hypothetisches zukünftiges Autoscaling, sondern Voraussetzung für deterministisches Verhalten in der heutigen Produktionsarchitektur.

Empfohlene nächste Engineering-Reihenfolge:

```text
1. Durable PDF Credit Ledger + Subscription fail-closed cleanup
2. Durable Audit/System Event Path + Synthetic Seed Removal
3. Production Documentary filesystem mutation abschalten
4. Worker Lease / Outbox primitives
5. Market Refresh + Alert Execution aus Web extrahieren
6. Distributed critical rate-limit strategy
7. ADR registry uniqueness gate
8. Two-instance qualification
```

Bis dahin bleibt die sichere Betriebsregel: eine konfigurierte Webinstanz, kein Autoscaling, Deployments als temporäre Multi-Prozess-Phase behandeln.
