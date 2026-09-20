# CAPITAL-AI-DATA — Takeover Index

This is the single mapping table between current-state/runtime/roadmap sources and DATA execution. It does not supersede ADR/ESS/SPT authority. Project routing uses `PVC-*`; technical financial `VC-*` remains a separate namespace.

| Source | Source item / context | Classification | DATA portion | DATA-ID | Source state |
|---|---|---|---|---|---|
| `docs/projects/PROJECT_VALUE_CHAIN.md` | Canonical project-routing ownership | PROJECT_ROUTING_REFERENCE | `PVC-09..11` DATA ownership and `PVC-11 -> PVC-12` handoff | DATA-0 / DATA-09..11 | AUTHORITY_REFERENCE |
| `docs/projects/README.md` | Canonical folder-to-PVC mapping | PROJECT_ROUTING_REFERENCE | Project folder, Primary Owner and PVC unit | DATA-0 / DATA-16 | AUTHORITY_REFERENCE |
| `docs/projects/fintech/ROADMAP.md` | Current FINTECH project surface merged through PR #635 | DOWNSTREAM_PROJECT_REFERENCE | Canonical target for `PVC-11 -> PVC-12`; Feature Engineering/Scoring/Ranking remain downstream | DATA-0 / DATA-11 / DATA-16 | CORRELATED_DOWNSTREAM |
| `docs/projects/quality-management/ROADMAP.md` | Current QM project surface merged through PR #636 | CROSS_PROJECT_QM_REFERENCE | Independent read-only DATA assessment; no productive DATA ownership or hot-path dependency | DATA-0 / DATA-15 / DATA-16 | CORRELATED_ASSESSMENT |
| `docs/projects/operations/ROADMAP.md` | Current OPS project surface merged through PR #632 | CROSS_PROJECT_OPS_REFERENCE | PR/trace/DevelopmentChain tooling and EventMesh/Traceability remain OPS-owned | DATA-0 / DATA-16 | CORRELATED_DEPENDENCY |
| `docs/roadmaps/SCREENING_SCORING_MARKET_DATA_SPT_ROADMAP.md` | Current technical financial chain, UAI/Evidence/DQ + scoring boundary | MIXED | UAI/Evidence/DQ technical boundary only; project ownership comes from PVC; scoring/ranking stays FINTECH | DATA-09..16 | TECHNICAL_AUTHORITY_REFERENCE |
| `docs/roadmaps/work-packages/SC-2_MODEL_REGISTRY_UAI.md` | UAI + evidence acquisition + scoring registry | MIXED | UAI identity, evidence-acquisition and evidence-gate portions only | DATA-09 / DATA-10 / DATA-12 / DATA-15 | REFERENCED_BY_DATA |
| `docs/roadmaps/work-packages/SC-3_UNIFIED_DQ_CONFIDENCE.md` | Snapshot/composite DQ plus Confidence/Ranking mapping | MIXED | Pure DQ contract/composite only; Confidence/Ranking is FINTECH handoff | DATA-11 / DATA-15 | REFERENCED_BY_DATA |
| `docs/roadmaps/work-packages/SC-4_GATEWAY_HARDENING_PROVIDER_MATRIX.md` | Gateway, provider matrix, rate-limit/circuit-breaker | DATA_RUNTIME | Canonical provider-ingress control plane | DATA-09 / DATA-14 | REFERENCED_BY_DATA |
| `docs/roadmaps/work-packages/SC-5_LIVE_COVERAGE_EXPANSION.md` | Provider adapters and incomplete crypto quorum consolidation | DATA_RUNTIME | Provider adapters, ingress convergence, no execution-price/scoring flip | DATA-09 / DATA-14 / DATA-15 | REFERENCED_BY_DATA |
| `docs/architecture/DATENQUALITAETSSCHICHT.md` | Active data-quality architecture and ADR-0032/SPT alignment | MIXED | Provenance/gap/freshness current-state input; historical fallback/simulated passages are compatibility history only | DATA-10 / DATA-11 / DATA-12 / DATA-13 | REFERENCED_BY_DATA |
| `docs/architecture/PHASE-3.4.6-MARKET-DATA-COMPATIBILITY-FACADE.md` | Legacy market-data compatibility boundary | MIXED | Inventory/retirement context only; must not become a second evidence authority | DATA-09 / DATA-15 | REFERENCED_BY_DATA |
| `docs/adr/resolved/ADR-0032-asset-catalog-market-evidence-separation.md` | Asset identity vs market evidence separation | AUTHORITY_REFERENCE | UAI/evidence boundary only | DATA-09 / DATA-10 | AUTHORITY_REFERENCE |
| `docs/adr/ADR-0041-enterprise-market-data-provider-and-mcp-architecture.md` | Provider data plane | AUTHORITY_REFERENCE | Provider-neutral acquisition, provenance, freshness, resilience | DATA-09 / DATA-12 / DATA-13 / DATA-14 | AUTHORITY_REFERENCE |
| `.ai/skills/ESS-0016-Enterprise-Market-Data-Provider-MCP-Governance.md` | Provider governance contract | AUTHORITY_REFERENCE | Provider/data-plane constraints only | DATA-09 / DATA-14 | AUTHORITY_REFERENCE |
| `docs/roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md` | Cross-cutting Security requirements/verification | CROSS_PROJECT_SECURITY_REFERENCE | Security constraints for PVC-09..11; no DATA ownership transfer | DATA-09 / DATA-10 / DATA-11 / DATA-15 | REFERENCED_BY_DATA |
| `docs/roadmaps/work-packages/CAPITAL_AI_SECURITY_WORK_PACKAGES_2026-08-31.md` | SEC work packages and handoff rules | CROSS_PROJECT_SECURITY_REFERENCE | Negative-test/verification requirements | DATA-10 / DATA-15 / DATA-16 | REFERENCED_BY_DATA |
| `docs/traceability/CAPITAL_AI_SECURITY_TRACEABILITY_MATRIX_2026-08-31.md` | `S1-R2-11` evidence identity/stale-state routing | SECURITY_FINDING | Target-owned Evidence Management semantics/evidence at `PVC-10`; Security verification stays external | DATA-10 / DATA-13 / DATA-15 / DATA-16 | ACCEPTED_AS_DEPENDENCY — `WAITING_FOR_EVIDENCE` |
| `src/platform/Scoring/contracts.ts` | Physical UAI contract plus downstream scoring contracts | MIXED | `uai/1.0.0` and `UniversalAssetIdentity` semantics only; scoring registry/result semantics stay FINTECH | DATA-09 / DATA-15 | SPLIT_BY_SEMANTIC_OWNERSHIP |
| `src/platform/Scoring/UniversalAssetAdapter.ts` | Current single UAI construction boundary | DATA_RUNTIME | Identity-only semantics; physical path may remain until relocation is justified | DATA-09 | BASELINE_REFERENCE |
| `src/platform/MarketData/MarketDataGateway.ts` | Snapshot ingress + DQ acceptance | DATA_RUNTIME | Canonical snapshot ingress candidate | DATA-09 / DATA-11 / DATA-13 / DATA-14 | BASELINE_REFERENCE |
| `src/platform/MarketData/MarketDataHistoryGateway.ts` | Historical data ingress | DATA_RUNTIME | Capability-specific ingress under same DATA boundary | DATA-09 / DATA-14 | BASELINE_REFERENCE |
| `src/platform/MarketData/contracts.ts` | Provider/snapshot/history contracts | DATA_RUNTIME | Canonical input schema basis | DATA-09 / DATA-14 / DATA-15 | BASELINE_REFERENCE |
| `src/platform/MarketData/evidenceQualityContracts.ts` | Asset-class-neutral evidence DQ envelope | DATA_RUNTIME | Provenance/freshness/admissibility basis | DATA-10 / DATA-11 / DATA-12 / DATA-13 | BASELINE_REFERENCE |
| `src/platform/MarketData/CryptoEvidenceIdentityRegistry.ts` | Crypto-specific evidence identity | DATA_RUNTIME | Migration input toward general evidence identity | DATA-10 / DATA-12 | BASELINE_REFERENCE |
| `src/platform/MarketData/CompositeDataQuality.ts` | Composite DQ + unified confidence + ranking helper | MIXED | DQ only; `computeUnifiedConfidence` and ranking conversion are foreign to DATA | DATA-11 | SPLIT_REQUIRED |
| `server/marketData/marketDataCompatibilityFacade.ts` | Legacy `/api/market-data` compatibility refresh | MIXED | Compatibility-only ingress inventory; fallback rows are metadata, not evidence | DATA-09 / DATA-10 / DATA-15 | COMPATIBILITY_REFERENCE |
| `src/services/cryptoQuoteEvidence.ts` | Crypto quote facade through gateway, CoinGecko-pinned | DATA_RUNTIME | Compatibility consumer; converge onto shared ingress/runtime composition | DATA-09 / DATA-10 | BASELINE_REFERENCE |
| `src/services/traditionalQuoteEvidence.ts` | Traditional quote facade through gateway | DATA_RUNTIME | Compatibility consumer; preserve evidence contract while converging runtime composition | DATA-09 / DATA-10 | BASELINE_REFERENCE |
| `src/platform/Quality/ValueChain/FintechValueChainQualityProjection.ts` | Read-only technical 18-stage structural projection | NOT_DATA | DATA may be assessed by QM; DATA must not import/call this in productive hot path | DATA-15 | QM_REFERENCE |

## Correlation result

The codebase already has a strong canonical nucleus (`UniversalAssetAdapter`, UAI contract semantics, `MarketDataGateway`, provider contracts/matrix, `DataQualityService`, `evidenceQualityContracts`) but still contains split capability paths, compatibility ingestion and mixed ownership artifacts.

Current main supplies the explicit PVC routing model plus canonical FINTECH, OPS and QM project surfaces. DATA can therefore own `PVC-09..11`, route downstream/foreign work to existing owners, and preserve technical financial `VC-*` unchanged.

## Security dependency rule

`S1-R2-11` is accepted into DATA as target-owned work/evidence at `PVC-10`. This does not allow DATA to mark the Security finding `VERIFIED/CLOSED`, and it does not authorize DATA to modify OPS-owned PR/trace tooling.

## Source takeover marker

A source DATA-only item may be marked:

> CAPITAL-AI-DATA TAKEOVER  
> Execution State: `HANDED_OFF_TO_DATA`  
> Canonical Work Item: `docs/projects/data/ROADMAP.md#<DATA-ID>`  
> Operational DATA status is maintained only in CAPITAL-AI-DATA; this source retains context/dependency information.

Normative ADR/ESS/SPT and cross-cutting Security source documents remain references, not transferred authorities.
