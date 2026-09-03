# FIN-12-EQ-P1B — Equity Point-in-Time Filing Evidence

**Project:** `CAPITAL-AI-FINTECH`  
**Parent task:** `FIN-12` / `PVC-12 Feature Engineering`  
**Upstream contracts consumed:** `CAPITAL-AI-DATA / PVC-09..PVC-11`  
**Canonical financial chain:** `SC-MD-SPT-0001`  
**Architecture authority:** ADR-0087  
**Execution branch:** `feat/equity-orchestrator-p1b-pit-filing-2026-09-03`  
**Reconciliation baseline:** `main@0c595dc4f07fc279eabec272ca6046967f3b83e8`  
**Status:** `IMPLEMENTED_PENDING_PR_CI`

## 1. Ziel

P1-B ergänzt für Aktien eine versionierte, Point-in-Time-fähige Filing-Evidence- und Feature-Foundation, ohne eine zweite Provider-, Provenance-, DQ-, Scoring-, Ranking- oder Governance-Authority zu schaffen.

Der produktive Aktienpfad bleibt unverändert. `traditional-scoring@2.1.0` bleibt der produktive Stock Champion. Der Equity-Vertrag bleibt Research/Challenger, `scoreEligible=false`, `executionEligible=false`, `researchCompositeScore=null` und besitzt ausschließlich Zero-Weight-Lineage.

## 2. Einordnung in die Enterprise-Wertschöpfungskette

```text
PVC-09 / VC-06  DATA-owned Evidence Acquisition
  -> SEC EDGAR CompanyFacts Adapter (read-only, keyless)
PVC-10 / VC-07  DATA-owned Provenance Contract
  -> asset / CIK / accession / filedAt / period / unit / taxonomy lineage
PVC-11 / VC-07  DATA-owned DQ Contract
  -> admissibility / freshness / context / duration / PIT gates
PVC-12 / VC-09  FINTECH Feature Engineering
  -> filing-derived metrics
  -> comparable-period metrics
  -> Equity feature contract 0.2.0
  -> zero-weight replay fingerprints
STOP before PVC-13 / VC-10 ScoringModelRegistry
```

P1-B erzeugt keinen `CanonicalScoreResult`, kein Ranking, keine Eligibility, keine Order-/Risk-/Execution-Authority und keine öffentliche Route.

## 3. Homogene Authority-Grenzen

P1-B verwendet ausschließlich vorhandene Authorities:

- Universal Asset Identity für `stock`-Identität;
- `MarketEvidenceQualityRecord` / `market-evidence-dq/1.0.0` für DQ;
- `FinancialFieldProvenance` für bestehende Vendor-/History-Evidence;
- bestehende Provider-Health-Telemetrie;
- bestehende Stock-Fundamentals und Traditional-History-Pfade für P1-A-Evidence;
- bestehenden Scoring-Fingerprint für nicht-ausführbare Feature-Lineage;
- bestehende `ScoringModelRegistry` bleibt unverändert und produktive Authority.

SEC EDGAR ist eine zusätzliche read-only Evidence-Quelle innerhalb des vorhandenen Evidence/DQ-Vertrags, kein zweiter Market-Data-Router.

## 4. SEC Point-in-Time Acquisition

`server/secEdgarCompanyFacts.ts` nutzt ausschließlich offizielle SEC-Endpunkte:

- Ticker/CIK-Mapping;
- `data.sec.gov/api/xbrl/companyfacts`;
- keyless Zugriff;
- deklarierter Responsible User-Agent;
- serialisierte Requests mit konservativem Mindestabstand;
- Timeout und bounded Cache;
- Provider-Health-Projektion.

Harte PIT-Regel:

```text
filedAt <= evaluatedAt
```

`periodEnd` ist Reporting-Kontext und niemals Wissenszeitpunkt.

Zugelassene P1-B-Forms sind bewusst auf `10-Q`, `10-Q/A`, `10-K`, `10-K/A` begrenzt. IFRS/20-F/40-F/6-K bleiben außerhalb des Scopes, bis Taxonomie- und Comparability-Regeln separat validiert sind.

## 5. Filing-DQ und Periodenregeln

Facts werden fail-closed geprüft nach:

- Stock-Identity und Ticker/CIK-Zuordnung;
- Taxonomie/Tag-Allowlist;
- Unit-Allowlist;
- Form-Allowlist;
- Instant/Periodic/YTD-Kontext;
- Reporting-Duration;
- `filedAt <= evaluatedAt`;
- Freshness;
- Evidence-Asset-ID.

Die Selektion priorisiert die neueste Reporting-Periode und erst innerhalb derselben Periode das neueste Filing/Amendment. Ein späteres Amendment einer alten Periode darf daher keine bereits bekannte neuere Periode verdrängen.

## 6. Providerneutrale Derived Metrics

Nur aus admissibler, periodenkompatibler Filing-Evidence werden deterministisch abgeleitet:

- Current Ratio;
- Long-Term Debt / Equity;
- Interest Coverage;
- Free Cash Flow YTD;
- Shareholder Distributions YTD;
- Distribution Coverage YTD;
- Reinvestment Intensity YTD (Context only).

Fehlende Inputs werden nie als Null interpretiert. Periodeninkompatible Inputs erzeugen keine Ratio.

## 7. Comparable PIT Metrics

Current/Prior-Filing-Evidence kann nur verglichen werden, wenn:

- beide Beobachtungen dieselbe Asset-Identity besitzen;
- Context und Unit kompatibel sind;
- Periodenenden ungefähr ein Geschäftsjahr auseinanderliegen (`330..400` Tage);
- Duration-Abweichung höchstens `21` Tage beträgt;
- beide Facts jeweils vor ihrem eigenen PIT-`asOf` verfügbar waren.

P1-B leitet daraus Research-Evidence für folgende Features ab:

- Revenue Growth YoY;
- Diluted EPS Growth YoY;
- Free Cash Flow Growth YoY;
- Share Count Change YoY.

## 8. Korrelations- und Source-De-Duplication

Top-Level-Grenze bleiben exakt sechs ökonomische Familien:

1. Quality
2. Valuation
3. Growth
4. Momentum
5. Financial Strength
6. Capital Allocation

Regeln:

- Price-Path-Signale bleiben gemeinsam in einer Momentum-`equity-price-path`-Gruppe;
- SEC Filing Evidence darf einen ökonomisch gleichen Vendor-Proxy supersedieren, aber nie additiv daneben gewichtet werden;
- Growth-Signale aus Revenue/EPS/FCF teilen eine definierte Growth-Korrelationsgrenze;
- Dividend Yield allein erzeugt keine Capital-Allocation-Coverage;
- Capital Allocation benötigt mindestens Share-Count-Change plus Distribution Coverage für eine spätere Promotion-Betrachtung;
- Reinvestment Intensity bleibt in P1-B Context und erhält keine Score-Authority;
- empirische Korrelationsmatrix, Peer-/Sector-Normalisierung und Outlier-Policy bleiben Promotion-Gates der Folgephasen.

## 9. Modell-/Scoring-Grenze

Versionen:

```text
equity-multifactor@0.2.0
equity-multifactor-features/0.2.0
equity-research-non-executable-weights/0.2.0
```

Invarianten:

```text
canonical = false
scoreEligible = false
executionEligible = false
researchCompositeScore = null
promotionReady = false
all effective weights = 0
```

Der Equity-Vertrag wird in P1-B nicht in die produktive `ScoringModelRegistry` aufgenommen. Der Registry-Boundary-Test erzwingt weiterhin den traditionellen Stock-Champion.

## 10. Security / Compliance / Data Integrity

- kein API-Key für SEC;
- `SEC_EDGAR_USER_AGENT` ist nicht geheim und dient ausschließlich Fair-Access-Identifikation;
- keine neue IAM/AuthN/AuthZ-Grenze;
- keine Datenbank-/Queue-/Persistence-Mutation;
- keine öffentliche HTTP-Route;
- keine Supabase-/Render-/Stripe-Mutation;
- externe SEC-Daten gelten als untrusted input und müssen durch Identity-/Schema-/Perioden-/DQ-Gates;
- kein Look-ahead durch Period-End-Datum;
- kein Vendor+SEC-Double-Counting.

## 11. Validation Gate

Vor Merge müssen auf dem exakten PR-Head mindestens erfolgreich sein:

- TypeScript / relevante statische Checks;
- fokussierte Equity-/SEC-Unit-Tests;
- Registry-Boundary-Test;
- Governance/Security-Checks der Repository-CI;
- finaler Main-Korrelationscheck.

Da der lokale isolierte Runner keinen GitHub-DNS-Zugriff besitzt, wird kein lokaler Vitest-/TypeScript-PASS behauptet. Hosted CI wird gemäß Kostenpolicy erst nach PR-Erstellung als Exact-Head-Evidence verwendet.

## 12. Offene Folge-Gates

- P1-C: Peer-/Sector-Normalisierung, robust scaling, winsorization/outlier policy;
- P2: survivorship-/look-ahead-safe OOS/walk-forward validation und empirische Family-/Subfeature-Korrelation;
- separate Governance-Entscheidung vor Registry-Admission oder Stock-Champion-Cutover.
