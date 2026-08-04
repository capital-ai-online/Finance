# ESS-0015 — API Interface Inventory & QA Governance

**Status:** PUBLISHED  
**Version:** 1.0.0  
**Owner:** Platform Director  
**Scope:** Alle internen und externen API-/Webhook-/SDK-/MCP-/SMTP-/Data-API-Schnittstellen von CAPITAL-AI  
**Decision Gate:** Neue oder geänderte FinTech-API-Anbindungen dürfen erst nach vollständigem Inventory- und QA-Evidence-Review architektonisch freigegeben werden.

## 1. Zweck

Diese Enterprise Specification führt eine verbindliche, evidenzbasierte Inventarisierung sämtlicher Schnittstellen ein. Ziel ist nicht nur Dokumentation, sondern eine reproduzierbare QA-Prüfung von Sicherheit, Datenqualität, Verfügbarkeit, Kosten, Rate Limits, Authentifizierung, Datenschutz, Observability, Failover und fachlicher Eignung. Das Ergebnis bildet die Entscheidungsgrundlage für eine nachgelagerte ADR zur zukünftigen FinTech-Provider- und Routing-Architektur.

## 2. Inventar-Pflichtfelder

Jede Schnittstelle MUSS mindestens enthalten:

- `interface_id` — stabile ID, z. B. `API-MARKET-BINANCE-001`
- `provider` und Produkt/Service
- `category` — market-data, ai, payments, database, auth, email, marketing, observability, internal-api, webhook, mcp
- `direction` — inbound, outbound, bidirectional
- `transport` — REST, WebSocket, SDK, SMTP, PostgREST, Edge Function, webhook, MCP
- `runtime_owner` — Render backend, browser, Supabase, external platform
- `code_entrypoints` — konkrete Dateien/Module/Routen
- `public_endpoints` und interne Route-Mappings
- `authentication` — API key, OAuth, JWT, signature, publishable key, service-role, none
- `secret_location` — nur Variablennamen/Secret Store, niemals Secret-Werte
- `data_classes` — market, PII, billing, auth, audit, AI prompt/output usw.
- `asset_classes` bzw. fachlicher Use Case
- `source_of_truth` und Provenance-Status
- `rate_limit` / Quota / bekannte Provider-Limits
- `timeout`, retry, circuit-breaker und fallback
- `cache` / freshness / staleness policy
- `observability` — Logs, Metrics, Correlation ID, Alerts
- `security_controls` — allowlist, schema validation, RLS, signature verification usw.
- `compliance` — DSGVO, MiFID-II-Relevanz, Datenresidenz, Aufbewahrung
- `cost_model` — kostenlos, subscription, per-request, token-basiert
- `sla_slo` — bekannte Verfügbarkeit und internes Ziel
- `qa_status` — NOT_TESTED / FAIL / CONDITIONAL / PASS
- `decision_status` — KEEP / REPLACE / CONSOLIDATE / DEPRECATE / EVALUATE
- `evidence_refs` — Tests, Logs, ADRs, Supabase-Migrationen, CI-Runs

Fehlt ein Pflichtfeld, ist die Schnittstelle nicht decision-ready.

## 3. Aktuell nachgewiesene Provider-/Schnittstellenfamilien

Der initiale Inventory-Seed muss mindestens folgende im Repository bzw. in der produktiven Supabase-Instanz nachgewiesene Familien erfassen:

### 3.1 FinTech-/Marktdaten

- Binance Spot Public Market Data — Landing-Kurzanalyse, serverseitig
- CoinGecko — Crypto Snapshot/History/Consensus
- Financial Modeling Prep (FMP) — Index-/Traditional-Quote-Evidence
- Alpha Vantage — Stock Fundamentals / Provider Registry
- weitere im `marketDataProviderRegistry` registrierte oder dokumentierte Provider
- Alpaca — als Kandidat erst dann `ACTIVE`, wenn Code-/Runtime-Evidence vorliegt; reine Render-Secret-Existenz genügt nicht

### 3.2 AI Provider

- Anthropic Claude API
- OpenAI API
- Google Gemini API
- Multi-Provider Routing `Anthropic -> OpenAI -> Gemini`

### 3.3 Billing / Payment

- Stripe API
- Stripe Webhooks in Render
- produktive Supabase Edge Functions `stripe-setup`, `stripe-webhook`, `stripe-worker`

### 3.4 Database / Auth / Platform APIs

- Supabase Auth
- Supabase PostgREST/Data API
- Supabase Edge Functions
- Supabase server-side service-role access

### 3.5 Messaging / sonstige externe Schnittstellen

- IONOS SMTP / Mailer
- Google OAuth
- Google Marketing-/Analytics-Integration gemäß ESS-0014
- Webscan Radar Badge nur als externe UI-Ressource, nicht als FinTech-Datenquelle

## 4. QA-Matrix je Schnittstelle

Für jede Interface-ID MUSS QA mindestens folgende Testklassen durchführen und Evidence speichern:

1. **Contract QA** — Request-/Response-Schema, Pflichtfelder, Typen, Versionierung.
2. **Authentication QA** — positive/negative Auth-Fälle, Secret Exposure, Token Scope, Signature-Verifikation.
3. **Authorization QA** — BOLA/IDOR, Rollen, RLS, Service-Role-Grenzen.
4. **Data Quality QA** — Nulls, Ausreißer, Units, Currency, Timestamp, Duplicate, Staleness, Provenance.
5. **No-Demo-Data QA** — bei Provider-Ausfall keine erfundenen Finanzdaten.
6. **Resilience QA** — Timeout, 429, 4xx, 5xx, malformed payload, DNS/network failure.
7. **Rate-Limit QA** — internes Throttling, Retry-After, Backoff, Provider-Quota.
8. **Performance QA** — p50/p95/p99, cold/warm cache, Payload-Größe.
9. **Observability QA** — Correlation ID, strukturierte Logs, Metrics, Alertbarkeit.
10. **Security QA** — SSRF, injection, CORS, CSP-Relevanz, secret scanning, replay bei Webhooks.
11. **Privacy/Compliance QA** — PII-Minimierung, Datenfluss, Retention, DPA/Region soweit relevant.
12. **Cost QA** — Kosten pro Use Case, Worst-Case-Spend, Budget-/Quota-Schutz.
13. **Failover QA** — Priorität, semantische Gleichwertigkeit des Fallbacks, Degradation-Label.
14. **Business Correctness QA** — Eignung für Asset-Klasse, Lizenz-/Nutzungsrestriktionen, Screening-Auswirkungen.

## 5. Mindest-Evidence für PASS

`qa_status=PASS` ist nur zulässig, wenn:

- automatisierte Contract-/Unit-Tests existieren,
- mindestens ein negativer Auth-/Failure-Test existiert,
- reale Provider-Evidence oder ein deterministischer Mock ausschließlich für Transporttests verwendet wird,
- No-Demo-Data-Verhalten nachgewiesen ist,
- Timeout und Rate-Limit-Verhalten geprüft sind,
- keine High/Critical Security Finding offen ist,
- Source/Provenance in der API-Antwort oder internen Evidence nachvollziehbar bleibt,
- CI den Test auf dem zu entscheidenden Commit erfolgreich ausgeführt hat.

Mocks dürfen niemals als Evidence für reale Marktqualität oder Provider-Verfügbarkeit gelten.

## 6. Supabase-spezifische QA

Für jede Supabase-exponierte Ressource gilt zusätzlich:

- RLS-Status und Policies inventarisieren.
- `anon`, `authenticated`, `service_role` und Edge-Function-Zugriffe getrennt dokumentieren.
- Edge Functions mit `verify_jwt=false` benötigen eine explizite Begründung und einen alternativen Authentizitätsnachweis im Funktionscode (z. B. Stripe-Signatur). Ohne Evidence: `qa_status=FAIL`.
- Security- und Performance-Advisors werden als QA-Evidence ausgeführt.
- Änderungen an DB/Policies/Functions benötigen Migration-/Deployment-Evidence.

Produktiver Snapshot 2026-08-03: `stripe-setup`, `stripe-webhook`, `stripe-worker` sind aktiv und melden `verify_jwt=false`; diese drei Funktionen sind daher priorisierte QA-Objekte, nicht automatisch Findings.

## 7. API Inventory Artefakte

Verbindliche Ablage:

- `docs/architecture/api/API_INTERFACE_INVENTORY.md` — menschenlesbare Übersicht
- `docs/architecture/api/API_INTERFACE_INVENTORY.json` — maschinenlesbare Registry
- `docs/architecture/api/API_QA_REPORT.md` — QA-Ergebnisse und Findings
- `docs/architecture/api/API_PROVIDER_DECISION_MATRIX.md` — Entscheidungsmatrix
- `tests/api/` — Contract-/Integration-/Failure-/Security-Tests

Die JSON-Registry ist die kanonische Maschinenquelle. Markdown wird daraus oder synchron dazu gepflegt.

## 8. Decision Matrix für FinTech Provider

Jeder FinTech-/Market-Data-Provider wird nach einem gewichteten Modell bewertet:

- Datenqualität/Abdeckung: 25 %
- Verfügbarkeit/Resilience: 15 %
- Provenance/Freshness: 15 %
- Security/Compliance: 15 %
- Kosten/Quota: 10 %
- Integrationskomplexität: 10 %
- Vendor Lock-in/Portabilität: 5 %
- Observability/Support: 5 %

Score allein entscheidet nicht. Ein Critical Security Finding, unklare Datenlizenz oder fehlende Provenance ist ein Hard Gate.

## 9. Architecture Decision Gate

Nach Abschluss des Inventars und QA-Reports MUSS eine neue ADR die zukünftige Anbindung aller FinTech-Schnittstellen entscheiden. Sie muss mindestens zwischen folgenden Mustern abwägen:

- direkte Provider-Adapter je Domain
- zentraler Market Data Gateway
- bestehendes `marketDataProviderRegistry` als verbindliche Provider Control Plane
- MCP nur als Tool-/Agent-Integrationsschicht versus Runtime-Market-Data-Plane
- Primary/Secondary/Consensus Provider je Asset-Klasse
- Cache-/Evidence-Layer und Event-Mesh-Anbindung
- einheitliche Rate-Limit-, Cost- und Circuit-Breaker-Policies

Bis zur ADR-Entscheidung dürfen neue FinTech-Provider nur als `EVALUATE` aufgenommen werden; keine parallele Schattenarchitektur.

## 10. QA-Abnahmekriterien für die nachgelagerte ADR

Die neue Provider-ADR darf erst `ACCEPTED` werden, wenn:

- 100 % der produktiv verwendeten externen APIs inventarisiert sind,
- 100 % der FinTech-/Market-Data-APIs einen QA-Status besitzen,
- alle Critical/High Findings geschlossen oder formal akzeptiert sind,
- Provider-Duplikate und Funktionsüberschneidungen markiert sind,
- reale Asset-Abdeckung pro Provider dokumentiert ist,
- Failover- und Kostenpfade gemessen wurden,
- Supabase-/Stripe-Schnittstellen als abhängige Plattform-APIs mitbewertet wurden,
- CI-Evidence auf dem finalen Decision Commit vorliegt.

## 11. Verantwortlichkeiten

- **Platform Director:** finale Architekturentscheidung und Ausnahmefreigaben.
- **Quality Center / QA:** Testmatrix, Evidence, Regression Gates.
- **Security & Compliance:** Auth, RLS, Secret, Privacy, Webhook- und Supply-Chain-Prüfung.
- **Documentary:** Inventory/Reports/Traceability synchron halten.
- **Supervisor:** verhindert Aktivierung nicht freigegebener Provider-Pfade, sobald technisch implementiert.
- **Claude Production Integration:** Produktionskonfiguration und Provider-Secrets gemäß Handoff, keine Secrets im Repository.

## 12. Definition of Done

ESS-0015 ist operational erfüllt, wenn Inventory JSON + Markdown vollständig, QA automatisiert, Findings triagiert und die nachgelagerte FinTech API Architecture ADR mit gemessener Evidence entschieden ist.
