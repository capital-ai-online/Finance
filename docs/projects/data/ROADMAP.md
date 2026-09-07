# CAPITAL-AI-DATA — Project Roadmap

**Project ID:** `CAPITAL-AI-DATA`  
**Status:** `ACTIVE — CANONICAL DATA ROADMAP`  
**Project Value Chain ownership:** `PVC-09`, `PVC-10`, `PVC-11`  
**Repository trust root:** `/AGENTS.md`

## How to use this roadmap

```text
PVC-09..11 / DATA Primary Owner
→ this Roadmap
→ applicable ADR
→ applicable ESS
→ implementation / tests / evidence
```

Current Git terminology is `main SHA`, `branch head SHA`, `PR head SHA` and `merge SHA`. Historical branch/evidence identities remain valid, but Candidate-Head lifecycle terminology is not used for current work.

## DATA-09 — UAI / Data Ingestion

**State:** `READY / ACTIVE BACKLOG`

Work:

- maintain one canonical ingress contract per capability;
- reuse `UniversalAssetAdapter`, `MarketDataGateway`, history gateway and provider registry/router boundaries;
- validate all external provider payloads before evidence promotion;
- remove duplicate direct-provider paths only after consumer correlation proves no semantic loss.

Exit:

- UAI identity is distinct from evidence;
- provider output cannot bypass validation;
- no provider becomes scoring authority.

### GOV-07 — Newsfeed Entitlement Return

**State:** `PARTIAL — PRODUCT ACCESS GAP CLOSED ON MAIN / AUTHORITY-UNAVAILABLE DISTINCTION OPEN`  
**Scope:** bounded `PVC-09` evidence/remediation return; no second entitlement, IAM, provider or scoring authority.

Current-main correlation:

- merged PR #730 already placed `realtimeAiNewsfeedEntitlement` on the canonical parent mount `app.use('/api/news', realtimeAiNewsfeedEntitlement, newsRouter)`, so `/api/news`, `/api/news/sources`, `/api/news/assets` and future productive `/api/news/*` subpaths pass the entitlement boundary before News provider/evidence handlers execute;
- identity is resolved server-side through `resolveVerifiedIdentity()` and the tier is looked up by verified `userId` through the shared subscription authority; request/body/query tier projections are not authorization input;
- `subscription-entitlements/1.0.0` denies Free/Starter and allows Pro/Enterprise for `realtime_ai_newsfeed`; focused tests cover 401 unauthenticated, 403 Free/Starter, Pro/Enterprise ALLOW and forged client-tier rejection;
- the canonical route-composition contract rejects an unguarded `/api/news` mount and rejects direct `/api/news*` declarations in `server.application.ts`; no current alternate productive News route bypass was identified;
- the entitlement middleware remains outside `newsRoutes.ts`, so DATA provider/evidence/freshness/DQ behavior and the no-scoring boundary remain separate from product entitlement authority;
- the original public-route runtime gap is therefore closed on current main and MUST NOT be reimplemented as a second DATA authorization path.

Residual / dependency:

- `realtimeAiNewsfeedEntitlement` maps a throwing entitlement dependency to `503 entitlement-authority-unavailable`, but the current shared production `getSubscription()` contract intentionally fails closed to `Free` when the privileged subscription store is unavailable or its lookup fails; `resolveVerifiedIdentity()` likewise returns no verified identity when its authority cannot resolve the bearer;
- consequently, exact productive differentiation of authority-unavailable from ordinary unauthenticated/Free state is not fully evidenced by the default dependency path even though access remains fail-closed;
- DATA MUST NOT duplicate or override the shared Subscription/IAM authority merely to manufacture a News-specific 503 distinction. Any exact unavailable-state signal must come from the canonical entitlement/IAM authority and then be consumed at this boundary;
- `CAPITAL-AI-SEC` retains independent verification of the server-side DENY/ALLOW boundary and any later authority-unavailable semantics; DATA does not self-verify Security closure.

Exit:

- `realtime_ai_newsfeed`: `PARTIAL` until the canonical authority can distinguish unavailable state on the productive path or a higher authority explicitly reclassifies the required status semantics;
- DATA runtime code delta for the already-closed route bypass: `NO`;
- alternate-route bypass remains absent and provider I/O remains downstream of the parent entitlement gate;
- independent Security verification remains required before any Security finding is marked verified/closed.

## DATA-10 — Evidence Management

**State:** `IMPLEMENTED — DATA EVIDENCE READY / SECURITY VERIFICATION OPEN`

Work:

- generalize evidence identity beyond provider/domain-specific registries;
- bind evidence to asset, provider, capability/field, observation/retrieval time and correlation identity;
- preserve explicit `CURRENT`, `STALE`, `MISSING`, `UNKNOWN` and refresh/retry semantics;
- support independent Security verification for stale/wrong-identity evidence findings.

Current-main / branch correlation:

- merged via PR #811; later DATA slices #812/#817/#822 are also on current main;
- DATA does not mark the Security finding `VERIFIED/CLOSED` and does not modify OPS-owned PR/trace tooling.

Exit:

- one canonical evidence identity/envelope for the S1-R2-11 observation contract: `PASS` for DATA implementation/evidence;
- remaining DATA-10 generalization of crypto-specific provider identity maps stays backlog.

## DATA-11 — Data Quality

**State:** `IMPLEMENTED — GATE SLICE READY / SOURCE VOCABULARIES RETAINED`

Work:

- keep snapshot/evidence DQ under one explicit gate model while retaining capability-specific checks;
- preserve `PASS`, `PARTIAL`, `FAIL`, `NOT_COMPUTABLE`, `STALE`, `MISSING`, `UNKNOWN` semantics;
- keep scoring/ranking outside DATA.

Current-main / branch correlation:

- merged via PR #812;
- remaining DATA-11 physical split of composite confidence/ranking helpers stays backlog.

## DATA-12 — Provenance

**State:** `IMPLEMENTED — LINEAGE SLICE READY / CORRECTION VERSION OPEN`

Work:

- Provider/source path, evidence reference, timestamps, asset identity and correlation lineage must survive the DATA chain and downstream handoff.

Current-main / branch correlation:

- merged via PR #817;
- correction-version lineage remains an architecture gap.

## DATA-13 — Freshness

**State:** `IMPLEMENTED — CAPABILITY MAX-AGE READY / PROVIDER OVERRIDES OPEN`

Work:

- Freshness is evaluated from source/observation time against an explicit capability-specific maximum age. `STALE` never silently becomes fresh or scoring-admissible.

Current-main / branch correlation:

- merged via PR #822 onto `main@d423da75e5f43b423d39abd3c4dffbfa0da8a2a5`;
- freshness contract `data-freshness/1.0.0` lives in `src/platform/MarketData/dataFreshness.ts`;
- provider-specific max-age overrides stay backlog.

## DATA-14 — Provider Input Validation

**State:** `IMPLEMENTED — CANONICAL ENVELOPE GATE READY / VENDOR DIALECTS OPEN`

Work:

- Validate schema, required fields, numeric finiteness/ranges, timestamps, provider identity, asset/symbol binding and capability invariants. Malformed/ambiguous input becomes an explicit non-admissible state.

Current-main / branch correlation:

- input gate `provider-input-validation/1.0.0` lives in `src/platform/MarketData/providerInputValidation.ts`;
- snapshot and history envelopes fail closed on missing provider/asset/correlation/evidence, non-positive or non-finite numerics, and invalid timestamps;
- no synthetic zero/default payload is invented;
- focused unit evidence: `tests/unit/providerInputValidation.test.ts`;
- slice evidence: `docs/projects/data/evidence/DATA_14_PROVIDER_INPUT_2026-09-07.md`;
- raw vendor HTTP dialects remain backlog.

Exit:

- malformed/ambiguous provider input is explicitly `NON_ADMISSIBLE`;
- identity, timestamps and numeric ranges are checked before evidence promotion;
- per-provider raw-body adapters stay backlog.

## DATA-15 — Data Contract Testing

**State:** `READY`

Minimum test families:

- UAI normalization / unsupported assets;
- provider invalid/missing/exception cases;
- provenance/evidence-reference requirements;
- freshness clock determinism;
- DQ status transitions;
- no zero/synthetic fallback;
- no score/ranking mutation from DATA;
- downstream FINTECH rejects non-admissible inputs;
- stale/wrong identity remains fail-closed until trusted refresh.

Tests and evidence bind to the actual branch/PR-head identity, not to a separate Candidate lifecycle.

## DATA-16 — Evidence

**State:** `READY / CONTINUOUS`

Retain versioned contract compatibility, provider/DQ outcomes, provenance completeness and Security-return evidence. A file's existence is never proof of PASS.

## Downstream boundary — PVC-11 → PVC-12

DATA exports only validated upstream observations/evidence. `CAPITAL-AI-FINTECH / PVC-12` owns Feature Engineering and downstream scoring/ranking semantics.

## Security relationship

Historical Security routing files are compatibility/audit records only. Current Security-related DATA work is represented directly in this Roadmap and independently verified by `CAPITAL-AI-SEC`.

## Definition of Done

- `PVC-09..11` ownership is explicit;
- technical financial `VC-*` authority remains separate;
- provider output remains untrusted until validated;
- provenance is complete;
- DQ is fail-closed;
- no scoring/ranking logic is owned by DATA;
- applicable ADR/ESS are reused rather than duplicated;
- required tests/evidence pass on the final PR head;
- Human/CODEOWNER performs merge.
