# Crypto Orchestrator Finalization — 2026-08-29

**Document ID:** `EVID-CRYPTO-ORCHESTRATOR-FINALIZATION-2026-08-29`  
**Version:** `1.0.0`  
**Lifecycle:** active  
**Owner:** CAPITAL-AI  
**Branch:** `feat/crypto-orchestrator-finalization-20260829`  
**Base:** `main@fd4c33905f45332f6ae11de6b80a6a3c20576c77`  
**Traceability:** CV-3, CV-4, CV-5, CV-6, CV-7, CV-8, CV-9; SC-3/P1; PR #586; PR #593.

## 1. Ziel

Dieses Paket arbeitet die zehn offenen Finalisierungspunkte des Crypto-Orchestrators ab und trennt dabei strikt zwischen:

- **Repository-/Contract-Completion**, die auf diesem Branch belastbar umgesetzt werden kann;
- **Runtime-/Provider-Evidence**, die nur mit realer attestierter Provider-Evidence als abgeschlossen gelten darf;
- **Model Promotion**, die weiterhin separat Owner-gated bleibt;
- **Visualisierung**, die ausschließlich bestehende Authorities projiziert.

Fehlende Evidence wird niemals als PASS, 0 oder neutraler Wert ersetzt.

## 2. State-of-the-Art-Abgleich

- NIST AI RMF/AIRC und der 2026 veröffentlichte Draft des TEVV-Athlon Frameworks stützen eine evidenzbasierte Test-/Evaluation-/Verification-/Validation-Grenze vor Promotion.
- OWASP API Security Top 10 2023 bleibt für Provider-/API-Flächen relevant, insbesondere Authorization, Resource Consumption, SSRF, Inventory und Unsafe Consumption.
- WCAG/WAI-ARIA bleiben für Statusdarstellung, Keyboard-Bedienung und nicht ausschließlich farbcodierte Semantik maßgeblich.
- Bestehende Repository-Authorities und vorhandene Recharts/D3-Komponenten werden vor neuer Dependency bevorzugt.

## 3. Finalisierungspunkte 1–10

| # | Arbeitspunkt | Ergebnis auf diesem Branch | Rest-Evidence / Blocker | Status |
|---|---|---|---|---|
| 1 | Exact-head/Main-Abschluss | Branch direkt von `main@fd4c3390...`; PR #593 ist Bestandteil der Basis | finaler Pflicht-Main-Sync unmittelbar vor neuem PR | IMPLEMENTED / FINAL GATE PENDING |
| 2 | CV-3 Completion | typisierte Hard-Gate-Evidence mit `PASS/BLOCKED/NOT_COMPUTABLE`; bestehende Gewichte/Correlation Groups bleiben read-only | echte Runtime-Gate-Evidence muss aus backendseitigem Research-Input kommen | CONTRACT COMPLETE / RUNTIME EVIDENCE PENDING |
| 3 | CV-7 Vertiefung | Meme-/DeFi-Linsen bleiben feature-owned; Visual-Suite erweitert Research-Flächen ohne zweite Authority | spezialisierte Holder-/Slippage-/Oracle-/Exploit-Diagramme benötigen attestierte Werte | PARTIAL / DATA-DEPENDENT |
| 4 | Hard-Gate-Evidence | `CryptoResearchGateEvidence.ts` mappt Meme- und DeFi-Gates deterministisch; ohne Input fail-closed | GoPlus Route/Calldata, Credential/Entitlement, Exploit/Oracle/Audit/Clustering Evidence weiter extern zu belegen | CONTRACT COMPLETE / PROVIDER EVIDENCE PENDING |
| 5 | Provider-Coverage | bestehende ProviderMatrix-/SC-3-P1-Gap-Inventory bleibt Authority; keine neue Vendor-Registry | Binance/Kraken identity mapping, GoPlus mappings, DEX Screener, DeFiLlama, Dune query contracts müssen weiter reale Coverage belegen | NOT FALSE-CLOSED; COVERAGE WORK REMAINS |
| 6 | Evidence-/Research-Oberfläche | CV-4/5/6/8 Visual-Suite integriert; alle nicht gelieferten Runtime-Werte explizit `NOT_COMPUTABLE` | echte RankingBoard-/Timeframe-/Derivatives-View-Contracts können später Daten liefern | PRESENTATION FOUNDATION IMPLEMENTED |
| 7 | Modellvalidierung | Promotion Boundary unverändert: Challenger bleiben `scoreEligible=false`, `executionEligible=false`; Fingerprints bleiben im Scoring Assessment vorhanden | OOS/walk-forward, manipulation/exploit/liquidity stress und reviewed correlation evidence vor Promotion erforderlich | GOVERNANCE BOUNDARY COMPLETE / TEVV PENDING |
| 8 | Derivatives/Market Structure | CV-8 read-only Fläche ergänzt; nur Contract-Features/Provider werden gezeigt, keine Signale erfunden | Funding/OI/Spread/Liquidity nur bei verifizierter Runtime-Evidence befüllen | PRESENTATION FOUNDATION IMPLEMENTED |
| 9 | CV-9 A11y/Performance | neue Tabellenstruktur/Textzustände, Status nicht nur farbbasiert, keine neue Chart-Library/Bundle-Kosten | reproduzierbare axe/Lighthouse/mobile 360–430px Messung bleibt Hosted-/Runtime-Gate | STATIC CONTROLS IMPLEMENTED / LIVE MEASUREMENT PENDING |
| 10 | Governance-Hygiene | dieses Dokument ist aktuelle Finalisierungs-Evidence und korrigiert Statusinterpretation: CV-3/CV-7 sind nicht mehr lediglich PLANNED | ältere Roadmap darf historisch bleiben, soll aber künftig auf diese Evidence verweisen bzw. superseded markiert werden | CURRENT EVIDENCE ESTABLISHED |

## 4. Hard-Gate Contract Completion

Neu: `src/platform/Scoring/CryptoResearchGateEvidence.ts`.

Meme:

- BUY simulation;
- SELL simulation;
- liquidity-lock policy;
- transfer-tax policy;
- contract integrity;
- manipulation evidence;
- mindestens zwei unabhängige market confirmations.

DeFi:

- smart-contract evidence;
- oracle policy;
- admin mint capability;
- unrestricted pause;
- single-wallet upgrade authority;
- unresolved exploit.

Der Projektor bewertet nur bereits vorhandenen typed Research-Input. Ohne diesen Input werden sämtliche Gates `NOT_COMPUTABLE`.

## 5. Visuelle Erweiterung nach Contract-Completion

Neu: `CryptoResearchVisualizationSuite` im kanonischen `CryptoScoringWorkspace`.

- **CV-4 Evidence & Provenance Matrix:** Provider-/Feature-Vertrag sichtbar, Runtime-State bis zur Evidence `NOT_COMPUTABLE`.
- **CV-5 Multi-Timeframe Lens:** 1D/30 Bars sichtbar als Canonical Basis; Intraday/1W ausschließlich Research Context.
- **CV-6 Ranking Heatmap/Breadth:** absichtlich keine Browser-Rankingberechnung; leer/fail-closed bis ein RankingBoard-View-Contract geliefert wird.
- **CV-8 Derivatives/Market Structure:** vorhandene Market-/Liquidity-Feature-Verträge sichtbar; keine automatisch erzeugten Trade-Signale.

## 6. Open-Source-/Plugin-Entscheidung

Keine neue Dependency. Recharts/D3 bleiben bestehender Stack. TradingView Lightweight Charts bleibt ein separater CV-2-Kandidat und wird erst nach Bundle-, Lizenz-/Attribution-, Accessibility- und Integrationsprüfung eingeführt. GitHub Connector wurde für Branch-/Repository-Arbeit verwendet. Supabase, Render und Stripe sind nicht betroffen.

## 7. Security / Data Integrity

- keine neue externe Schreiboperation;
- keine Secrets oder Credentials;
- keine AuthN/AuthZ-Änderung;
- keine neue Score-/Ranking-/Pattern-/Execution-Authority;
- `ScoringModelRegistry -> ScoringDispatcher` bleibt produktive Score-Authority;
- Research Challenger bleiben non-authorizing;
- Provider-/Evidence-Abwesenheit bleibt sichtbar und fail-closed.

## 8. Promotion Boundary

`crypto-meme-integrity@0.3.0` und `crypto-defi-fundamental@0.3.0` werden durch dieses Paket **nicht** promoted. Vor Promotion bleiben zwingend:

1. vollständige REQUIRED/HARD_GATE Provider-Coverage;
2. Provenance, Data Quality und Freshness;
3. effective-feature/effective-weight fingerprints;
4. Out-of-sample / walk-forward TEVV;
5. Stress-/Manipulation-/Exploit-/Liquidity-Shock-Evidence;
6. Correlation-/Double-counting Review;
7. Owner Approval über den bestehenden Registry-/Dispatcher-Governancepfad.

`LIVE_EXECUTION` bleibt blockiert.
