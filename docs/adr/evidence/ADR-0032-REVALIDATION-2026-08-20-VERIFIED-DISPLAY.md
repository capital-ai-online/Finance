# ADR-0032 Revalidation — Verified Display, Buffett Consumer & Provider Cadence

**Document ID:** `DOC-EVIDENCE-ADR0032-VERIFIED-DISPLAY-2026-08-20`  
**Version:** `1.0.0`  
**Lifecycle:** `draft`  
**Date:** `2026-08-20`  
**Parent decision:** ADR-0032 — Asset Catalog and Market Evidence Separation  
**Execution authority:** `SC-MD-SPT-0001`  
**Correlated authorities:** ADR-0034 · ADR-0041 / ESS-0016 · ADR-0083 / ADR-0075 · ADR-0087  
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

ADR-0034 ist die bestehende Authority für Buffett-Zugriff und Quota. Die Korrelation zeigt eine noch offene Consumer-Abweichung im Draft PR #458:

- `BuffetValueCheck.tsx` filtert den Catalog bereits auf `stock`;
- anschließend lädt der Consumer aktuell direkt `/verified-display`;
- die bereits vorhandene serverseitige Autorisierung `POST /api/entitlements/warren-buffett/authorize` wird noch nicht vorgeschaltet;
- `server/entitlements.ts` validiert derzeit Catalog-Presence, aber nicht vor Quota-Verbrauch explizit `asset.type === 'stock'`.

**Revalidation-Gate:** Vor Merge muss die Buffett-Kette entitlement-first und serverseitig stock-only fail-closed sein.

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

### Noch offen vor Merge-Readiness

1. Buffett-Consumer ruft serverseitige ADR-0034-Autorisierung **vor** `/verified-display` auf.
2. Buffett-Entitlement lehnt Nicht-Aktien vor Quota-Verbrauch ab.
3. Alle Dokumentprojektionen referenzieren ADR-0032 / SC-MD-SPT-0001 und die jeweils spezifischen Parent-Authorities statt ADR-0097.
4. ADR-0097 wird aus aktivem ADR-/Authority-Namespace entfernt.
5. TypeScript-, Unit-, Contract-, Governance- und Build-Evidence wird auf dem finalen PR-Head erhoben.

---

## 5. ADR-0097-Disposition

Der Draft-PR führte zunächst `ADR-0097 — Verified Asset Display & Progressive Hydration Boundary` mit einer neuen Authority ID ein. Die vollständige Korrelationsprüfung zeigt jedoch:

| ADR-0097-Inhalt | Bereits vorhandene Authority |
|---|---|
| Catalog ≠ Evidence | ADR-0032 |
| Provider Provenance / Resilience | ADR-0041 / ESS-0016 |
| Runtime Cache / Background Refresh | ADR-0083 / ADR-0075 |
| Multi-Asset Scoring | ADR-0087 / SC-MD-SPT-0001 |
| Buffett Access / Quota | ADR-0034 |
| Buffett stock-only | Domain-/Consumer-Regel unter ADR-0032 + ADR-0034 |
| Dokument-/Work-Claim-Lifecycle | bestehende Governance Policies |

Daher wird ADR-0097 **nicht als zweite aktive Authority fortgeführt**. Die fachlich neuen Implementierungsdetails bleiben über dieses Revalidation-Dokument, `SC-MD-SPT-0001`, Code, Tests und PR-Evidence vollständig traceable.

Das ist keine semantische Supersession von ADR-0032: die ältere Entscheidung bleibt fachlich gültig; die Implementierung wird erneut gegen sie ausgerichtet.

---

## 6. Security, Compliance und Datenintegrität

- Provider-Secrets bleiben serverseitig.
- Keine Client-Direktaufrufe keyed Upstream-Provider.
- Kein Bootstrap-/Synthetic-Wert wird zu verified finance evidence hochgestuft.
- Fehlende Evidence bleibt fail-closed/partial/unavailable.
- Display-Contract bleibt `executionPriceEligible=false`.
- Buffett-Quota-/Entitlement-Gate bleibt serverseitige Authority.
- Keine AuthN-/AuthZ- oder IAM-Abschwächung.
- Keine Render-, Supabase- oder Stripe-Mutation durch diese Revalidation.
- Operational Telemetry und revisionsrelevante Audit-Evidence bleiben getrennte Verantwortungsbereiche.

---

## 7. Validierungs-Gates

Vor Abschluss dieser Revalidation müssen mindestens erfüllt sein:

1. finaler Main-Sync und Korrelation zu parallel gemergten Änderungen;
2. keine aktive zweite ADR-/Authority-ID für den Verified-Display-Scope;
3. Buffett entitlement-first + stock-only server validation;
4. Unit-/Contract-Test für Verified Display und Buffett Stock-only;
5. Test der Entitlement-Reihenfolge und Nicht-Aktien-DENY-Regel;
6. Test der 90-Sekunden-Cadence inklusive Foreground-Refresh-Verschiebung;
7. Dokumentations-/Registry-Hygiene;
8. TypeScript/Lint;
9. Production Build;
10. erforderliche PR-Governance-/Security-Checks.

Bis diese Gates erfüllt sind, bleibt dieses Evidence-Dokument `draft` und ADR-0032 wird nicht als erneut vollständig verifiziert behauptet.

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
- PR: #458

**Revalidation state:** DRAFT — Architekturkorrelation konsolidiert; technische P0-Gates und finale PR-Evidence noch offen.
