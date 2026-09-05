# CAPITAL-AI Compliance Roadmap

**Project ID:** `CAPITAL-AI-COMP`  
**Role:** `CROSS_CUTTING_COMPLIANCE`  
**Document ID:** `DOC-COMP-ROADMAP-2026-08-31`  
**Document role:** roadmap / non-authorizing projection  
**Version:** 1.4.0  
**Date:** 2026-09-05  
**Current-main reconciliation baseline:** `main@9a30f5cd87c68febdebc99d13447432ed712ab71`  
**Status:** ACTIVE — COMP-04 REASSESSMENT BASELINE STARTED / NON-AUTHORIZING  
**Primary Project Value Chain ownership:** none (`[]`)

## Vision

CAPITAL-AI behandelt regulatorische, vertragliche und intern verbindliche Compliance-Anforderungen nachvollziehbar, evidenzbasiert und entlang der bestehenden Eigentümerstruktur — ohne unbelegte Compliance-/Zertifizierungsbehauptungen und ohne parallele Governance-, Security-, Quality- oder Runtime-Architektur.

## Mission

`CAPITAL-AI-COMP` identifiziert anwendbare Anforderungen, ordnet sie bestehenden Controls, ADR/ESS und Primary Ownern zu, bewertet aktuelle Evidence auf `main`, dokumentiert Findings und Evidence-Gaps und übergibt rechtliche Entscheidungen an Human/Legal Review sowie technische Remediation an den jeweiligen Primary Owner. Compliance implementiert keine fremde technische Remediation und ersetzt keine Legal Review.

## Roadmap target

Ein `main`-verifizierter, revisionsfähiger Compliance-Status über die kanonischen Projekt-Roadmaps. `UNKNOWN`, `NOT_ASSESSED`, `EVIDENCE_MISSING` und `LEGAL_REVIEW` bleiben explizit; ein Roadmap-, PR- oder Dateieintrag allein ist niemals ein Compliance-PASS.

Human-readable routing:

```text
Requirement / Finding
→ affected PVC / Primary Owner
→ target project Roadmap
→ applicable ADR / ESS
→ owner implementation / tests / evidence
→ independent Compliance reassessment
```

Current project ownership resolves only through `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`. Withdrawn post-PVC routing overlays remain historical/non-authorizing.

## Current-main reconciliation — 2026-09-05

### Scope and method

This reconciliation supersedes the prior roadmap snapshot for current execution status.

1. `/AGENTS.md` v2.7.1 and `main@9a30f5cd87c68febdebc99d13447432ed712ab71` are the execution baseline.
2. Human-merged PR #753 is confirmed on current `main`; COMP-03 is therefore `DONE_ON_MAIN`.
3. `COMPLIANCE_REQUIREMENTS_INVENTORY.md` v1.2.0 remains the 37-active-input COMP-02 universe; retired `REQ-COMP-026/027` remain excluded.
4. `REQUIREMENT_CONTROL_EVIDENCE_MATRIX.md` v1.3.0 is the merged COMP-03 mapping input; mapping is not assessment evidence by itself.
5. Relevant current owner roadmaps were re-read for Governance, Operations, Data, FinTech, Security and Documentary.
6. Open Pull Requests against `main`: **0** at the COMP-04 start correlation snapshot.
7. No current active COMP parallel writer was identified; the only matching prior COMP claim evidence is archived/deactivated history.
8. PR #753 exact-head hosted CI, Governance and Container Security checks completed successfully.
9. Current-main CI for `main@9a30f5cd87c68febdebc99d13447432ed712ab71` completed successfully, including exact-main build/test/provenance and verified Render deployment identity.
10. External legal applicability and accepted-risk decisions remain Human/Legal/Owner-controlled and cannot be inferred from engineering evidence.

### Repository-visible completion delta

| Work item | Current-main result | Compliance interpretation |
|---|---|---|
| `COMP-01` Applicability | executed in prior bounded work; factual/legal gates explicitly retained | `EXECUTED / CONTINUOUS`; unresolved Legal Review and evidence gates remain open |
| `COMP-02` Requirements | 37 active inputs + 2 retired historical NIST IDs | `DONE_ON_MAIN / CONTINUOUS` |
| `COMP-03` Control Mapping | Human-merged PR #753; 37/37 active inputs mapped; no new AUTH/CTRL/ADR/ESS | `DONE_ON_MAIN` |
| `COMP-04` Assessment | new bounded branch from current main | `ACTIVE — REASSESSMENT BASELINE STARTED` |

## COMP-04 reassessment baseline — `main@9a30f5cd87c68febdebc99d13447432ed712ab71`

### Assessment contract

COMP-04 uses only the approved assessment vocabulary:

`COMPLIANT` · `PARTIALLY_COMPLIANT` · `NON_COMPLIANT` · `NOT_APPLICABLE` · `NOT_ASSESSED` · `EVIDENCE_MISSING`.

The queue states below are **reassessment-readiness states**, not Compliance conclusions. `READY_NOW` does not mean `COMPLIANT`. Every positive assessment still requires sufficient current scoped evidence.

### Reassessment universe

- Active COMP-02 inputs: **37**.
- Retired historical IDs excluded: **2** (`REQ-COMP-026`, `REQ-COMP-027`).
- `READY_NOW`: **23** — sufficient current evidence exists to perform a bounded assessment now, though the result may still be partial or negative.
- `EVIDENCE_OR_OWNER_HELD`: **7** — required current evidence or independent owner/verifier return is missing; no positive status may be inferred.
- `LEGAL_OR_SCOPE_HELD`: **7** — competent legal/scope determination is required before a substantive compliance conclusion.

#### READY_NOW — 23

`REQ-COMP-001`, `002`, `003`, `004`, `005`, `006`, `007`, `008`, `009`, `010`, `011`, `012`, `013`, `014`, `015`, `016`, `024`, `025`, `028`, `029`, `030`, `035`, `036`.

Key limitations retained:

- `REQ-COMP-011`: current document lifecycle can be assessed, but unresolved Compliance document-registry treatment remains an explicit Documentary/Governance boundary gap.
- `REQ-COMP-012`: ADR-0007 and ESS-0006 remain Governance-owned lifecycle/semantic gaps; their existence prevents silent closure but does not block assessing the historical-authority control itself.
- `REQ-COMP-013..016`: privacy controls/evidence may support bounded assessment only; they do not establish blanket GDPR legal sufficiency.
- `REQ-COMP-024/025/028`: assessment is bounded to benchmark/advisory treatment; no certification or binding-authority inference.
- `REQ-COMP-008/036`: current exact-main CI/provenance/deployment evidence is available for the present release state; release-specific evidence does not become permanent future proof.

#### EVIDENCE_OR_OWNER_HELD — 7

| Requirement | Preserved state / reason | Primary return source |
|---|---|---|
| `REQ-COMP-017` | `EVIDENCE_MISSING` plus Legal Review where transfer/role interpretation is required; DPA/subprocessor/transfer/TIA/contractual-region evidence incomplete | Human/Legal + actual provider/domain owner |
| `REQ-COMP-019` | complete AI output-surface inventory and legal sufficiency evidence incomplete | affected output owner + Human/Legal where required |
| `REQ-COMP-021` | `EVIDENCE_MISSING`; attributable Human AI-literacy completion/acknowledgement evidence absent | Human/Owner organizational evidence |
| `REQ-COMP-031` | `EVIDENCE_MISSING / UNKNOWN`; complete binding-contract universe and effective versions not established | Human/Legal + contract owners |
| `REQ-COMP-032` | `EVIDENCE_MISSING`; measured backup/restore/RPO/RTO evidence remains `OPEN / UNVERIFIED` | `CAPITAL-AI-OPS / PVC-08` + independent Security verification |
| `REQ-COMP-033` | end-to-end traceability coverage/freshness evidence incomplete; ESS-0006 clarification remains separate | `CAPITAL-AI-OPS / PVC-18` and `CAPITAL-AI-DATA / PVC-10` as affected |
| `REQ-COMP-034` | end-to-end DATA→FINTECH provenance/DQ/evidence coverage remains incomplete; no neutral/stale fallback may be inferred | `CAPITAL-AI-DATA / PVC-09..11` + `CAPITAL-AI-FINTECH / PVC-12..17` |

These rows remain in the COMP-04 universe. Missing owner evidence is not rewritten as `NON_COMPLIANT` unless a control failure is actually demonstrated, and is never rewritten as `COMPLIANT` because implementation or a roadmap entry exists.

#### LEGAL_OR_SCOPE_HELD — 7

| Requirement | COMP-04 state while gate is unresolved | Gate |
|---|---|---|
| `REQ-COMP-018` | `NOT_ASSESSED` for final legal-role conclusion | AI provider/deployer/other role per material system — Human/Legal |
| `REQ-COMP-020` | `NOT_ASSESSED` | AI-risk/use-case classification before asserting a specific human-oversight obligation |
| `REQ-COMP-022` | `NOT_ASSESSED` | DORA entity/activity applicability — Human/Legal |
| `REQ-COMP-023` | `NOT_ASSESSED` | actual B2C/service/market and consumer-contract obligation scope — Human/Legal |
| `REQ-COMP-037` | `NOT_ASSESSED` | DDG/TDDDG provider/digital-service/consent obligation set — Human/Legal |
| `REQ-COMP-038` | `NOT_ASSESSED` | regulated financial-service/supervisory/licensing scope — Human/Legal |
| `REQ-COMP-039` | `NOT_ASSESSED` until trigger/classification | AI Act high-risk classification on actual intended-purpose/user/role trigger — Human/Legal |

`LEGAL_REVIEW` remains the explicit external decision gate even though it is not itself an assessment-vocabulary value. Engineering facts such as `financialDecisionAuthority=false` remain factual boundaries, not legal classification outcomes.

## Current owner/evidence constraints preserved

| Area | Current main evidence | COMP-04 treatment |
|---|---|---|
| Governance / ADR-0007 | ADR document declares accepted; current ADR registry still lacks migrated stable identity | keep `COMP-GAP-002` open; do not use ADR-0007 as current mapping authority |
| Governance / ESS-0006 | registered component spec contains stale assumptions | keep `COMP-GAP-003` open after ADR-0007 decision; no second Requirement Registry |
| Operations recovery | `OPS-08-SEC-07` / S1-R2-07 remains `OPEN / UNVERIFIED` | `REQ-COMP-032` remains evidence-held |
| Data evidence/freshness | DATA-10 remains `SECURITY EVIDENCE WORK OPEN` | no self-verification; preserve missing/stale/wrong-identity states |
| FinTech entitlement | `FIN-SEC-02` and `FIN-SEC-03` remain `REFERRED_NOT_EXECUTED / P1 HIGH` | no Compliance closure; await owner implementation/evidence + Security verification |
| Security verification | Security explicitly distinguishes `EVIDENCE_READY` from `VERIFIED` | owner evidence alone cannot become Security/Compliance closure |
| Documentary registry | Document Registry remains DOC/GOV-owned | COMP does not mutate shared registry; owner boundary must be resolved before any registry work |

## Current Compliance finding delta

| Finding / action | Current assessment | Owner / routing | COMP-04 gate |
|---|---|---|---|
| `COMP-GAP-001` — QM project template absent | `SUPERSEDED / SURFACE GAP RESOLVED` | `CAPITAL-AI-QM` remains cross-cutting | no reopening; no inference about unrelated QM activation |
| `COMP-GAP-002` — ADR-0007 lifecycle / semantic ambiguity | `PARTIALLY_COMPLIANT / OPEN` | `CAPITAL-AI-GOV / PVC-05` | Governance decision `clarify / migrate / supersede / archive`, then COMP reassessment |
| `COMP-GAP-003` — ESS-0006 stale assumptions | `PARTIALLY_COMPLIANT / OPEN` | `CAPITAL-AI-GOV / PVC-05` | after ADR-0007 decision, current ESS evidence returned by owner |
| `COMP-GAP-004` — vendor / transfer evidence incomplete | `EVIDENCE_MISSING / LEGAL_REVIEW` | Human/Legal + actual provider/domain owner | complete factual/contractual provider evidence and competent legal interpretation where needed |
| `COMP-GAP-005` — human AI-literacy evidence absent | `EVIDENCE_MISSING` | Human/Owner | attributable organizational completion evidence; Legal Review where obligation interpretation requires it |
| `COMP-GAP-006` — DORA entity scope unresolved | `NOT_ASSESSED / LEGAL_REVIEW` | Human/Legal | competent entity/activity applicability determination |
| `COMP-GAP-007` — measured backup/restore evidence | `EVIDENCE_MISSING / OPEN` | `CAPITAL-AI-OPS / PVC-08` | approved RPO/RTO + recurring off-site backup + isolated measured restore evidence + independent Security verification |
| `COMP-GAP-008` — Compliance document-registry treatment | `PARTIALLY_COMPLIANT / OPEN` | Documentary/Governance boundary | determine requirement/owner before any registry mutation |
| DATA `realtime_ai_newsfeed` entitlement child | `IMPLEMENTED_ON_MAIN / VERIFICATION_PENDING` | `CAPITAL-AI-DATA / PVC-09`; Security verifies independently | exact return evidence + Security verification |
| FINTECH verified-screening child | `OPEN` | `CAPITAL-AI-FINTECH / PVC-16` | owner implementation/evidence + Security verification |
| FINTECH financial-analysis child | `OPEN` | `CAPITAL-AI-FINTECH / PVC-15` | owner implementation/evidence + Security verification |
| AI/scoring legal role | `NOT_ASSESSED / LEGAL_REVIEW WHEN TRIGGERED` | Human/Legal + affected productive owner | actual use-case/user/decision context classification |

No finding is closed merely because PR #753 merged or current-main CI/deployment passed.

## Open-PR correlation

At the COMP-04 start snapshot there are **0 open Pull Requests against `main`**. Open PRs are always correlation input only and never current-main implementation evidence.

## Compliance-owned workstreams

| WP | Workstream | State | Current priority |
|---|---|---|---|
| `COMP-01` | Applicability | `EXECUTED / CONTINUOUS` | preserve Legal Review/provider/role gates; reassess only on changed facts |
| `COMP-02` | Requirements | `DONE_ON_MAIN / CONTINUOUS` | maintain 37 active source-backed inputs; retired NIST IDs remain historical |
| `COMP-03` | Control Mapping | `DONE_ON_MAIN` | Human-merged PR #753; consume mapping without creating new authority |
| `COMP-04` | Assessment / Verification | `ACTIVE — BASELINE STARTED` | assess `READY_NOW` set and keep evidence/legal-held sets explicit |
| `COMP-05` | Findings | `ACTIVE` | normalize only evidence-supported deltas; no silent closure |
| `COMP-06` | Evidence | `ACTIVE` | refresh provenance/freshness as required by COMP-04, without fabricating missing returns |
| `COMP-07` | Remediation assignment | `ACTIVE` | foreign remediation remains with actual Primary Owner; unresolved owner remains `REQUIRES_CORRELATION` |
| `COMP-08` | Continuous Compliance | `ACTIVE` | trigger on material provider/data/model/market/user/purpose/deployment/content/authority changes |

## Evidence model

Preferred evidence order:

1. runtime/provider evidence bound to identity/time/scope;
2. code/configuration/database policy state;
3. independent hosted CI on the exact PR/main identity;
4. registry/control evidence;
5. approved documentation;
6. roadmap claims.

Historical evidence remains history and is not automatic current proof. `EVIDENCE_READY` is not `VERIFIED`.

## Regulatory / standards treatment

- GDPR / DSGVO: applicability follows actual personal-data scope; no blanket legal sufficiency claim.
- EU AI Act: role/use-case dependent; high-risk scope is not inferred.
- DORA: legal/entity-scope review remains required where applicability is uncertain.
- ISO/IEC 42001:2023 is the current repository Governance design benchmark; alignment remains non-certifying.
- NIST publications/frameworks/profiles/mappings remain withdrawn from the current repository Governance baseline.
- ISO/IEC 27001, OWASP, CIS and comparable sources remain bounded benchmark/advisory inputs only where current Authority permits their use.

No certification or complete legal-compliance claim is created by engineering alignment alone.

## Continuous Compliance

Material changes to features, AI models, data sources, providers, markets/countries, user types, processing purposes, deployment models, public claims/content, external integrations, authority/control state or evidence freshness trigger COMP-08 and, where affected, a new COMP-04 reassessment.

## COMP-04 current exit gate

This COMP-04 baseline slice is complete when:

- the 37-active-input reassessment universe is bound to the current `main` baseline;
- the `READY_NOW`, `EVIDENCE_OR_OWNER_HELD` and `LEGAL_OR_SCOPE_HELD` sets are explicit and total exactly 37;
- `EVIDENCE_MISSING`, `NOT_ASSESSED`, `LEGAL_REVIEW` and foreign-owner return gates remain explicit;
- no owner implementation, Security verification, Legal Review or registry mutation is claimed by Compliance;
- current exact-main CI/deployment evidence is recorded without turning release evidence into blanket compliance proof;
- documentation/governance validation is truthfully reported before PR readiness;
- PR creation is separately Human/Owner-approved for the final exact `main SHA` + `branch head SHA`;
- merge remains Human/CODEOWNER-only.
