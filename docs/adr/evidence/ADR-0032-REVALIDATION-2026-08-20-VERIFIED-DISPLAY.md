# ADR-0032 Revalidation — Verified Display, Buffett Consumer & Provider Cadence

**Document ID:** `DOC-EVIDENCE-ADR0032-VERIFIED-DISPLAY-2026-08-20`  
**Version:** `1.0.0`  
**Lifecycle:** `draft`  
**Date:** `2026-08-20`  
**Parent decision:** ADR-0032 — Asset Catalog and Market Evidence Separation  
**Execution authority:** `SC-MD-SPT-0001`  
**Correlated authorities:** ADR-0034 · ADR-0041 / ESS-0016 · ADR-0083 / ADR-0075 · ADR-0087 · ESS-0005 Quality Center  
**Work item:** Owner Chat-Priorität 2026-08-20 — verifizierte Asset-Werte, Buffett stock-only, Dokumentkonsolidierung und 90-Sekunden-Background-Refresh  
**Pull Request:** Draft PR #458  

---

## 1. Zweck

Diese Revalidation dokumentiert eine erneute Umsetzung und Consumer-Härtung der bereits akzeptierten ADR-0032-Invariante. Sie führt **keine neue Market-Data-, Scoring- oder Governance-Authority** ein.

ADR-0032 bleibt maßgeblich:

- Asset-Katalog und verifizierte Finanzbeobachtungen sind getrennt;
- Catalog-/Bootstrapwerte werden nicht allein durch ihre Existenz zu Market Evidence;
- verifizierte Werte benötigen Provider-/Evidence-Provenance, Freshness und zulässige fachliche Semantik;
- fehlende Evidence bleibt explizit unavailable/partial statt durch synthetische Werte ersetzt zu werden.

Die festgestellte Abweichung ist daher **Implementation-/Consumer-Drift gegen eine weiterhin gültige Entscheidung**, analog zur früheren ADR-0032-Revalidation R-001.

---

## 2. Korrelationsbefund

### 2.1 ADR-0032 — Parent-Authority

Der Kern des neuen Verified-Display-Pfads ist bereits durch ADR-0032 entschieden: `GET /api/registry/assets` ist Discovery-/Catalog-Quelle und darf Bootstrapwerte nicht als verifizierte Finanzwerte ausgeben.

Die neue per-symbol Darstellung ist eine konkrete Consumer-Projektion dieser Invariante:

```text
metadata-only Asset Catalog
  ↓ selected symbol
approved evidence adapters
  ↓
field-level value + provider + evidence + timestamps + status
  ↓
read-only presentation / research consumer
```

### 2.2 ADR-0041 / ESS-0016 — Provider Data Plane

Providerzugriff, Resilience und Provenance bleiben im bestehenden providerneutralen Market-Data-Gateway-/Adapter-Modell. Die Revalidation führt keine neue Provider-Orchestrierung ein.

Zuordnung:

- Cache / Coalescing / Rate Budgets / Circuit Breaker → ADR-0041 / ESS-0016;
- Feld-/Provider-Provenance → ADR-0041 / ESS-0016;
- No-Demo-/Fail-Closed-Verhalten → ADR-0032 + ADR-0041 / ESS-0016;
- provider-spezifische Entitlements/Lizenzen bleiben außerhalb dieses Evidence-Dokuments unverändert.

### 2.3 ADR-0083 / ADR-0075 — Runtime Boundary

Der bestehende Market-Data Runtime Facade besitzt Cache-/Coalescing-/Background-Refresh-Verantwortung. Die 90-Sekunden-Cadence ist deshalb eine **Runtime-Implementierungspräzisierung innerhalb dieser bestehenden Grenze**, keine neue Architektur-Authority.

Vertragliche Trennung:

- vorhandener Compatibility-Cache: 60 Sekunden;
- tatsächliches Background-Provider-I/O: mindestens 90 Sekunden;
- frühe Background-Aufrufe: defer/coalesce;
- ein Foreground-Refresh verschiebt den nächsten zulässigen Background-Provider-Refresh;
- Registry-Fallbackzeilen lösen keine globale Evidence-/Scoring-Anreicherung aus.

### 2.4 ADR-0087 — Scoring bleibt separat

`verified-asset-display/1.0.0` erzeugt **keinen** `CanonicalScoreResult`, keine Model-Auswahl, kein Ranking und keine zweite Scoring-Pipeline.

Die kanonische Multi-Asset-Scoring-Kette bleibt:

`UAI → Model Registry → ScoringDispatcher → Domain Executor → CanonicalScoreResult → DQ/Confidence → Ranking/Eligibility`.

Display-/Research-Werte sind nicht automatisch Scoring-Evidence und niemals allein durch UI-Verwendung execution-price-eligible.

### 2.5 ADR-0034 — Buffett Entitlement

ADR-0034 ist die bestehende Authority für Buffett-Zugriff und Quota. Der zuvor festgestellte Consumer-Gap ist im Draft PR #458 geschlossen:

- `BuffetValueCheck.tsx` filtert den Catalog ausschließlich auf `stock`;
- für das ausgewählte Symbol ruft der Consumer **zuerst** `POST /api/entitlements/warren-buffett/authorize` auf;
- `/verified-display` wird nur bei HTTP-Erfolg und `allowed === true` aufgerufen;
- `server/entitlements.ts` lehnt `asset.type !== 'stock'` mit `asset-not-eligible` ab;
- diese Domain-Prüfung erfolgt **vor** `enforceBuffettValueCheckQuota()`, damit ungültige Assetklassen weder Quota verbrauchen noch Provider-Hydration auslösen.

Damit ist die Buffett-Subchain entitlement-first und serverseitig stock-only fail-closed.

### 2.6 Finaler Main-Sync / Quality Center

Während der Umsetzung wurde PR #457 in `main` gemergt. `main` rückte dadurch auf `a8d384154ff2eb1bfe74108eb4a4119cbab2a040` vor. Der Feature-Branch wurde anschließend verlustfrei mit diesem Stand synchronisiert.

PR #457 führte eine read-only `FintechValueChainQualityProjection` ein, deren Authority bereits `SC-MD-SPT-0001` ist. Die Projektion bildete zunächst die ältere 14-stufige Scoring-zentrierte Kette ab. Um nach dem Main-Sync keinen neuen semantischen Drift zu erzeugen, wurde sie auf die konsolidierte SPT-v1.1-Struktur erweitert:

- Request Intake;
- Identity / Access;
- Entitlement / Usage;
- Asset Discovery / UAI;
- Orchestration / Runtime Guard;
- Evidence Acquisition;
- Data Validation / Provenance / DQ;
- Verified Display / Research Lane;
- kanonische Scoring-/Ranking-Stufen;
- EventMesh / Traceability / Supervisor;
- Delivery Surfaces.

Die Quality-Projektion bleibt ausdrücklich **read-only und non-authorizing**; sie verändert keine IAM-, Entitlement-, Provider-, Scoring-, Ranking-, Release- oder Deployment-Entscheidung.

---

## 3. Homogene Einordnung in SC-MD-SPT-0001

Die konsolidierte Kette lautet:

```text
Request Intake
  ↓
Identity / Access
  ↓
Entitlement / Usage
  ↓
Asset Catalog / UAI
  ↓
Orchestration / Runtime Guard
  ↓
Market-Data / Evidence Acquisition
  ↓
Data Validation / Provenance / DQ
  ↓
  ├─ Display / Research Lane
  │    verified-asset-display/1.0.0
  │    → domain analysis / Buffett stock-only
  │    → explainability / presentation
  │
  └─ Canonical Scoring Lane
       feature contract
       → model registry
       → dispatcher
       → executor
       → CanonicalScoreResult
       → confidence / ranking / eligibility
  ↓
Output Delivery
  ↓
EventMesh / Traceability / Supervisor references
  ↓
Quality / Security / Compliance / Documentary evidence
  ↓
Release / Deployment Runtime Evidence
```

Quote-/Alert-/Backtest-Consumer teilen die Stufen bis zur Evidence-Validierung und verwenden danach ausschließlich ihre jeweils freigegebenen Quote-/History-Verträge.

---

## 4. Implementierungs-Evidence im Draft PR #458

### Bereits umgesetzt

1. `verified-asset-display/1.0.0` als read-only per-symbol Contract.
2. `GET /api/registry/assets/:symbol/verified-display` ohne Full-Catalog-Hydration.
3. `GET /api/registry/assets` bleibt metadata-only für verifizierte Finance-Felder.
4. Stock Fundamentals behalten Alpha Vantage als primäre Quelle; vorhandenes FMP dient bounded Secondary/Enrichment.
5. Buffett-Suche enthält ausschließlich Aktien.
6. Synthetische Buffett-Fallbacks für EPS/Score/PASS wurden entfernt.
7. Fehlende Fundamentals bleiben explizit fehlend.
8. Compatibility Refresh enrichiert/persistiert nur provider-beobachtete Live-Zeilen.
9. Periodischer CoinGecko-Pfad wird im Background auf das konfigurierte Core-Universum begrenzt.
10. Runtime Facade erzwingt mindestens 90 Sekunden zwischen tatsächlichen Background-Provider-Refreshes.
11. Die fachlichen Korrelationen sind in `SC-MD-SPT-0001` v1.1.0 als eine homogene Wertschöpfungskette konsolidiert.
12. Datenqualitäts-, Backend-, API-, Frontend- und Phase-3.4.6-Projektionen referenzieren ADR-0032 / SC-MD-SPT-0001 sowie die jeweils zuständige Parent-Authority.
13. Die im Draft zunächst angelegte ADR-0097-Datei wurde entfernt; ADR- und Authority-Registry entsprechen für diesen Scope wieder `main` und enthalten keine zweite Verified-Display-Authority.
14. Diese Revalidation ist als `draft` im Document Registry registriert; die SPT-Registry-Version wurde auf 1.1.0 synchronisiert.
15. Buffett autorisiert das ausgewählte Aktiensymbol serverseitig vor der Verified-Display-Hydration.
16. Der Buffett-Entitlement-Endpunkt lehnt Nicht-Aktien vor Quota-Verbrauch ab.
17. Unit-/Contract-Regressionen prüfen Authorization-before-Hydration und Stock-Gate-before-Quota strukturell.
18. Der Branch ist mit `main@a8d384154ff2eb1bfe74108eb4a4119cbab2a040` synchronisiert; die aus PR #457 stammende Quality-Projektion wurde semantisch auf SPT v1.1 ausgerichtet.

### Noch offen vor Merge-Readiness

1. TypeScript-/Lint-Evidence auf dem finalen PR-Head.
2. Unit-/Contract-/Architecture-Test-Evidence auf dem finalen PR-Head.
3. Production-Build-Evidence auf dem finalen PR-Head.
4. Governance-/Security-Gates auf dem finalen PR-Head.

---

## 5. Historische Disposition des verworfenen ADR-0097-Entwurfs

Der Draft-PR führte zunächst `ADR-0097 — Verified Asset Display & Progressive Hydration Boundary` mit einer neuen Authority ID ein. Die vollständige Korrelationsprüfung zeigte jedoch:

| Entwurfsinhalt | Bereits vorhandene Authority |
|---|---|
| Catalog ≠ Evidence | ADR-0032 |
| Provider Provenance / Resilience | ADR-0041 / ESS-0016 |
| Runtime Cache / Background Refresh | ADR-0083 / ADR-0075 |
| Multi-Asset Scoring | ADR-0087 / SC-MD-SPT-0001 |
| Buffett Access / Quota | ADR-0034 |
| Buffett stock-only | Domain-/Consumer-Regel unter ADR-0032 + ADR-0034 |
| Dokument-/Work-Claim-Lifecycle | bestehende Governance Policies |

Der Entwurf wird deshalb **nicht als zweite aktive Authority fortgeführt und ist im Branch entfernt**. Die fachlich neuen Implementierungsdetails bleiben über dieses Revalidation-Dokument, `SC-MD-SPT-0001`, Code, Tests und PR-Evidence vollständig traceable.

Das ist keine semantische Supersession von ADR-0032: die ältere Entscheidung bleibt fachlich gültig; die Implementierung wird erneut gegen sie ausgerichtet. Ein neues `DOC-ADR-0097` ist folglich nicht erforderlich.

---

## 6. Security, Compliance und Datenintegrität

- Provider-Secrets bleiben serverseitig.
- Keine Client-Direktaufrufe keyed Upstream-Provider.
- Kein Bootstrap-/Synthetic-Wert wird zu verified finance evidence hochgestuft.
- Fehlende Evidence bleibt fail-closed/partial/unavailable.
- Display-Contract bleibt `executionPriceEligible=false`.
- Buffett-Quota-/Entitlement-Gate ist serverseitige Authority und wird vor Provider-Hydration ausgeführt.
- Nicht-Aktien werden vor Quota-Verbrauch abgewiesen.
- Keine AuthN-/AuthZ- oder IAM-Abschwächung.
- Keine Render-, Supabase- oder Stripe-Mutation durch diese Revalidation.
- Operational Telemetry und revisionsrelevante Audit-Evidence bleiben getrennte Verantwortungsbereiche.
- Quality Center bleibt read-only/non-authorizing und referenziert die fachliche SPT-Authority nur zur Strukturprüfung.

---

## 7. Validierungs-Gates

Vor Abschluss dieser Revalidation müssen mindestens erfüllt sein:

1. finaler Main-Sync und Korrelation zu parallel gemergten Änderungen — **erfüllt für `main@a8d384154ff2eb1bfe74108eb4a4119cbab2a040`; PR #457 korreliert**;
2. keine aktive zweite ADR-/Authority-ID für den Verified-Display-Scope — **erfüllt**;
3. Buffett entitlement-first + stock-only server validation — **implementiert, finale Test-Evidence ausstehend**;
4. Unit-/Contract-Test für Verified Display und Buffett Stock-only — **Tests vorhanden, finaler Lauf ausstehend**;
5. Test der Entitlement-Reihenfolge und Nicht-Aktien-DENY-Regel — **Tests vorhanden, finaler Lauf ausstehend**;
6. Test der 90-Sekunden-Cadence inklusive Foreground-Refresh-Verschiebung — **Tests vorhanden, finaler Lauf ausstehend**;
7. Quality-Projection-Korrelation mit SPT v1.1 — **implementiert, finaler Architecture-Test ausstehend**;
8. Dokumentations-/Registry-Hygiene — **finaler Governance-Lauf ausstehend**;
9. TypeScript/Lint — **ausstehend**;
10. Production Build — **ausstehend**;
11. erforderliche PR-Governance-/Security-Checks — **ausstehend**.

Bis die verbleibenden technischen Gates erfüllt sind, bleibt dieses Evidence-Dokument `draft` und ADR-0032 wird nicht als erneut vollständig verifiziert behauptet.

---

## 8. Traceability

- Parent ADR: `docs/adr/resolved/ADR-0032-asset-catalog-market-evidence-separation.md`
- frühere Revalidation: `docs/adr/evidence/ADR-0032-REVALIDATION-2026-08-08-R001.md`
- SPT: `docs/roadmaps/SCREENING_SCORING_MARKET_DATA_SPT_ROADMAP.md`
- Provider: `docs/adr/ADR-0041-enterprise-market-data-provider-and-mcp-architecture.md`
- Provider ESS: `.ai/skills/ESS-0016-Enterprise-Market-Data-Provider-MCP-Governance.md`
- Runtime: `docs/adr/ADR-0083-server-runtime-architecture-consolidation.md`, `docs/adr/ADR-0075-phase-3-4-7-runtime-facade.md`
- Buffett Entitlement: `docs/adr/ADR-0034-central-subscription-entitlements-and-buffett-access.md`
- Scoring: `docs/adr/ADR-0087-single-scoring-architecture-uai-model-registry.md`
- Quality projection: `src/platform/Quality/ValueChain/FintechValueChainQualityProjection.ts`
- PR: #458

**Revalidation state:** DRAFT — Architektur-/Dokumentkorrelation, Buffett-Entitlement-P0-Gates und Main-/Quality-Korrelation sind umgesetzt; finale technische Validierungs-Evidence steht noch aus.
