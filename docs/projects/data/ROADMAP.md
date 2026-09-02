# CAPITAL-AI-DATA — Canonical Data Roadmap

**Project ID:** `CAPITAL-AI-DATA`  
**Status:** `PROPOSED — CURRENT-MAIN-SYNCHRONIZED CONSOLIDATION CANDIDATE`  
**Current-main baseline:** `7fa5cfddcdb775078e1518bef4908af2e8706415`  
**Project Value Chain ownership:** `PVC-09`, `PVC-10`, `PVC-11`  
**Repository trust root:** `/AGENTS.md`  
**Project-routing mapping:** `docs/projects/README.md` + `docs/projects/PROJECT_VALUE_CHAIN.md`  
**Current financial-chain authority:** `SC-MD-SPT-0001`  
**Provider data-plane authority:** `ADR-0041` + `ESS-0016`

Operational DATA state is maintained here only for DATA-owned concerns. Scoring, Ranking, QM assessment, Documentary, OPS and Security verification remain owner-scoped and are not absorbed into DATA.

## Namespace model

- `PVC-*` = organizational project ownership/routing.
- technical `VC-*` under `SC-MD-SPT-0001` = current financial runtime stages.
- DATA owns `PVC-09..11`; it does not renumber or supersede technical `VC-*`.
- `PVC-11 -> PVC-12` is the canonical project boundary from DATA to FINTECH.

## State model

Project work: `PROPOSED | READY | IN_PROGRESS | BLOCKED | DONE | NOT_AVAILABLE`

DATA exit statuses: `PASS | PARTIAL | FAIL | NOT_COMPUTABLE | STALE | MISSING | UNKNOWN`

External owner-scoped work is not promoted to `DONE/VERIFIED/CLOSED` by DATA.

---

## DATA-0 — Authority & Repository Baseline

**State:** `DONE — candidate correlation`

### Evidence

- current `/AGENTS.md` read from `main`;
- current main bound to `7fa5cfddcdb775078e1518bef4908af2e8706415`;
- no open PR at synchronization correlation;
- `PROJECT_VALUE_CHAIN.md` confirms DATA as Primary Owner for `PVC-09..11`;
- `docs/projects/README.md` is the remaining folder-to-PVC mapping;
- Security PR #631 is merged and its DATA finding is correlated;
- Operations PR #632 is merged and supplies the canonical OPS project surface without changed-file overlap with `docs/projects/data/**`;
- FINTECH PR #635 is merged and supplies `docs/projects/fintech/**`, confirming the downstream `PVC-11 -> PVC-12` project dependency;
- QM PR #636 is merged and supplies `docs/projects/quality-management/**`, preserving QM as independent read-only assessment;
- Social PR #637 is merged and adds only `docs/social-media/CAPITAL-AI-SOCIAL/**`; no DATA changed-file or productive PVC ownership overlap is introduced;
- the old non-conforming branch `docs/data-project-consolidation-20260831` is superseded for protected work by `agent/data-security-handoff-sync-20260831`.

### Exit

- one explicit project-routing namespace exists;
- DATA ownership is non-conflicting;
- technical financial VC numbering remains unchanged;
- current-source baseline is documented;
- current existing target-project folders are correlated.

---

## DATA-09 — UAI & Data Ingestion / PVC-09

**State:** `READY`

### Canonical candidates

- `src/platform/Scoring/UniversalAssetAdapter.ts` — current UAI construction boundary;
- `src/platform/MarketData/MarketDataGateway.ts` — canonical snapshot provider ingress;
- `src/platform/MarketData/MarketDataHistoryGateway.ts` — history ingress;
- `src/platform/MarketData/ProviderRegistry.ts` / `ProviderRouter.ts` / `ProviderMatrix.ts`;
- `server/marketData/*` runtime composition;
- domain provider adapters retained where they satisfy canonical contracts.

### Work

- map ownership without unnecessary source relocation;
- converge provider/source acquisition on one ingress contract per capability;
- preserve domain-specific adapters behind that boundary;
- remove/supersede direct provider paths only after consumer correlation proves no semantic loss;
- preserve Security requirements for external-input validation, credentials and source-policy boundaries.

### Exit

- UAI identity is distinct from evidence;
- provider output cannot bypass validation;
- duplicate ingress paths are removed or explicitly compatibility-only.

---

## DATA-10 — Evidence Management / PVC-10

**State:** `READY — SECURITY HANDOFF ACCEPTED, REMEDIATION/EVIDENCE NOT YET EXECUTED`

### Core work

- generalize evidence identity beyond crypto-specific registries;
- bind evidence to `assetId`, provider, capability, field, observation time and retrieval time;
- preserve evidence IDs/refs and correlation IDs end-to-end;
- distinguish evidence absence from neutral/zero evidence;
- correlate quote, research, on-chain, fundamentals and history evidence contracts.

### Security item — S1-R2-11

- `project_namespace: PVC`
- `project_stage: PVC-10`
- `target_project: CAPITAL-AI-DATA`
- `target_project_folder: docs/projects/data/`
- `primary_owner: CAPITAL-AI-DATA`
- `source_security_finding: S1-R2-11`
- `task: evidence identity and stale-state automation`
- `reason: stale or wrong-identity evidence must not authorize current state`
- `dependency: CAPITAL-AI-SEC verification; OPS-owned PR/trace tooling remains foreign`
- `required_evidence: immutable baseline/head identities plus trusted refresh/retry observations`
- `verification_gate: CAPITAL-AI-SEC independent verification`
- `status: REFERRED_NOT_EXECUTED`
- `source_status: WAITING_FOR_EVIDENCE`

Required returned evidence must demonstrate `CURRENT`, `STALE`, `CURRENT_AFTER_REFRESH` and `STALE_RETRY_REQUIRED` against immutable current identities without candidate self-authorization. Any PR/trace/DevelopmentChain tooling-code remediation belongs to CAPITAL-AI-OPS, not DATA.

### Exit

- one canonical evidence identity/envelope exists;
- no provider-specific evidence identity becomes scoring authority;
- missing/stale/wrong-identity evidence is explicit and fail-closed;
- S1-R2-11 target evidence can be returned to Security without DATA self-verification.

---

## DATA-11 — Data Quality / PVC-11

**State:** `READY`

### Work

- consolidate snapshot DQ and evidence DQ into one explicit gate model without destroying capability-specific detail;
- preserve current fail-closed behavior from `DataQualityService` and `evidenceQualityContracts`;
- separate pure DQ from Confidence/Ranking helpers currently colocated in `CompositeDataQuality.ts`;
- make `PASS/PARTIAL/FAIL/NOT_COMPUTABLE/STALE/MISSING/UNKNOWN` transitions explicit and tested.

### Exit

- no `FAIL` reaches valid downstream input;
- stale/missing/unknown semantics cannot be upgraded silently;
- no scoring or ranking logic remains owned by DATA.

---

## DATA-12 — Provenance

**State:** `READY`

Provenance must survive provider adapter -> gateway -> evidence envelope -> freshness/DQ -> downstream DATA boundary. Provider, feed/source path, evidence reference, timestamps, asset identity and correlation lineage must not be dropped by compatibility facades.

### Exit

Complete provenance is required for every `PASS` record; absence is non-PASS.

---

## DATA-13 — Freshness

**State:** `READY`

Freshness is evaluated from source/observation timestamps against an explicit maximum age at the DATA boundary. `STALE` may be observable/research-usable only when the consumer contract explicitly allows it; it must not silently become fresh or numeric scoring input.

S1-R2-11 additionally requires immutable-identity-aware refresh/retry evidence. A label change without a trusted fresh observation does not establish current state.

### Exit

One explicit freshness evaluation semantics exists per capability.

---

## DATA-14 — Provider Input Validation

**State:** `READY`

All external provider responses are untrusted. Validate schema, required fields, numeric finiteness/ranges, timestamps, provider identity, symbol/asset binding and capability-specific invariants before evidence promotion.

### Exit

Malformed/ambiguous provider payloads become `FAIL`, `MISSING`, `UNKNOWN` or capability-specific non-admissible states; never synthetic values.

---

## DATA-15 — Data Contract Testing

**State:** `READY`

### Minimum contract tests

- UAI identity normalization and unsupported asset classes;
- provider schema invalid/missing/exception cases;
- provenance/evidence-ref requirements;
- stale boundary and clock determinism;
- DQ status transition table;
- no zero/synthetic fallback;
- no direct Quality Center dependency in productive DATA hot paths;
- no score/ranking mutation from DATA modules;
- downstream FINTECH boundary rejects non-admissible inputs;
- wrong candidate/baseline identity cannot be treated as `CURRENT`;
- stale evidence remains stale until a trusted refresh is observed;
- refresh can produce `CURRENT_AFTER_REFRESH` only with current immutable identity;
- unavailable/untrusted refresh produces `STALE_RETRY_REQUIRED`;
- candidate-produced evidence alone cannot self-authorize a Security verification result.

### Exit

Negative-path tests are first-class evidence, not optional coverage.

---

## DATA-16 — Data Evidence

**State:** `READY`

Maintain append-only evidence for contract versions, provider matrix state, exact candidate SHA, DQ test outcomes, provenance completeness, compatibility-path retirement and Security return packages.

A file's existence is not proof of PASS. Security-return evidence must preserve the exact candidate/runtime identities and must not claim `SECURITY VERIFIED` or `CLOSED`.

---

## Canonical downstream exit — PVC-11 -> PVC-12

DATA exports only validated upstream observations/evidence. Feature engineering and all numeric scoring semantics remain downstream.

- `project_namespace: PVC`
- `project_stage: PVC-12`
- `target_project: CAPITAL-AI-FINTECH`
- `target_project_folder: docs/projects/fintech/`
- `primary_owner: CAPITAL-AI-FINTECH`
- `task: consume ValidatedDataInput and own downstream Feature Engineering/Scoring/Ranking semantics`
- `reason: DATA remains the validated upstream data boundary only`
- `dependency: docs/projects/fintech/ROADMAP.md and DATA PVC-11 output`
- `required_evidence: versioned contract compatibility and preservation of explicit non-numeric states`
- `verification_gate: FINTECH target-project tests/governance`
- `status: REFERRED_NOT_EXECUTED`

## Security return boundary

When S1-R2-11 implementation/evidence becomes ready, DATA returns the package defined in `handoffs/CAPITAL_AI_SEC_CROSS_PROJECT_HANDOFF.md`. DATA may report `IMPLEMENTED` or `EVIDENCE_READY`; only CAPITAL-AI-SEC independently decides `VERIFIED/CLOSED`.

## Definition of Done

- CAPITAL-AI-DATA structure exists;
- ingestion/evidence/DQ roadmaps are correlated in `TAKEOVER_INDEX.md`;
- `PVC-09..11` ownership is explicit;
- technical `VC-*` authority remains separate;
- QM remains an independent read-only assessor;
- FINTECH receives only the validated DATA contract;
- Security findings routed to DATA are implemented/evidenced locally but independently verified by Security;
- duplicate ingestion/DQ architectures are removed or superseded with compatibility boundaries;
- provider output remains untrusted until validated;
- provenance is complete;
- DQ is fail-closed;
- no scoring logic is owned by DATA.
