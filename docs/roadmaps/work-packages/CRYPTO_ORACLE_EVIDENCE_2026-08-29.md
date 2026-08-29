# Crypto Oracle Evidence Work Package

**Document ID:** `WP-CRYPTO-ORACLE-EVIDENCE-2026-08-29`  
**Version:** `1.0.0`  
**Lifecycle:** active  
**Owner:** CAPITAL-AI  
**Base:** `main@46d29911f0e15b98460c1b965a039987793ce0e5`  
**Roadmap:** `FT-CORE-CRYPTO-01` / P1-A Hard-Gate Evidence Completion  
**Evidence:** `docs/evidence/sc-md/SC3_P1A3_CRYPTO_ORACLE_EVIDENCE_2026-08-29.md`

## Ziel

Den DeFi-Hard-Gate `oracleRiskWithinPolicy` von einem nackten Boolean-Ziel zu einer provider-agnostischen, fail-closed Research-Evidence-Projektion weiterentwickeln, ohne eine neue Scoring-, Risk-, Portfolio- oder Execution-Authority zu schaffen.

## Scope

- [x] exakte PRIMARY-Feed-Identität: Protocol / Chain / Oracle / Feed / Base / Quote;
- [x] separat identifizierbare FALLBACK-Feeds innerhalb derselben Risk-Identity;
- [x] Observation-Freshness;
- [x] Feed-Update-Freshness;
- [x] Availability-Semantik;
- [x] Deviation-Evidence;
- [x] Confidence-/Uncertainty-Evidence;
- [x] versionierte Source-Authority-Independence;
- [x] policy-gesteuerte Fallback-Anforderung;
- [x] read-only Projektion auf `oracleRiskWithinPolicy`;
- [x] negative/fail-closed Regressionstests;
- [x] Evidence-Dokumentation.

## Nicht im Scope

- konkrete Chainlink-/Pyth-/Protokoll-Credentials;
- neue npm-/Oracle-SDK-Dependency;
- produktive RPC-/Contract-Writes;
- universelle Heartbeat-/Deviation-Schwellen;
- produktive Risk-/Scoring-Promotion;
- LIVE_EXECUTION.

## Authority Boundary

```text
provider/runtime evidence
  -> crypto-oracle-evidence/0.1.0
  -> crypto-oracle-hard-gate-projection/0.1.0
  -> hardGates.oracleRiskWithinPolicy
  -> existing Research Scoring boundary
```

`ScoringModelRegistry -> ScoringDispatcher` bleibt die einzige produktive Score-Authority. Oracle Evidence bleibt `RESEARCH_EVIDENCE_ONLY`, `scoreEligible=false`, `executionEligible=false`.

## Real-world gaps after contract foundation

- [ ] protocol/chain/feed identity matrix;
- [ ] reviewed concrete Oracle adapter(s);
- [ ] feed-specific freshness/heartbeat policy;
- [ ] governed deviation-reference semantics;
- [ ] provider-specific confidence normalization;
- [ ] L2 sequencer-state evidence where applicable;
- [ ] outage/stale/fallback validation corpus;
- [ ] source/publisher independence evidence;
- [ ] coverage evidence across the intended DeFi universe.

## Nächster Arbeitspunkt

Nach Abschluss der Oracle runtime/provider evidence:

```text
External Audit / Formal Verification Evidence
-> Holder / Entity Clustering
-> P2 model validation
```

FT-7 bleibt blockiert.
