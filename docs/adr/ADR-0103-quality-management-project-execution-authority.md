# ADR-0103 — Independent Cross-Cutting Quality Assurance

**Authority ID:** `AUTH-ADR-QM-PROJECT-SINGLE-EXECUTION-2026-08-31`  
**Version:** `1.0.0`  
**Date:** `2026-08-31`  
**Lifecycle:** `proposed`  
**Owner:** CAPITAL-AI Owner  
**Effective:** only after Human Merge / acceptance  
**Governance boundary:** ADR-0096  
**Project contract:** `CAPITAL-AI-QM-V2` v2.1

> The stable Authority ID is retained from the original branch reservation. In this ADR, `execution` means execution of independent Quality/Assurance activities only; it never means foreign-domain technical remediation.

## Context

Quality criteria, measurements, regression evidence and findings span all 18 value-chain stages. Without one cross-cutting assurance model, the repository risks duplicated tests, parallel Quality status, inconsistent evidence and Quality logic entering productive hot paths.

ESS-0005 already defines the canonical read-only Quality Center. The runtime already contains the 18-stage `FintechValueChainQualityProjection`. A second value chain, Validator Registry, EventBus, CI topology, Auth controller, Router, Data Quality runtime, Scoring path, Ranking path or Release controller would be duplicate architecture.

The original QM consolidation draft used takeover language that could be read as transferring technical execution into QM. `CAPITAL-AI-QM-V2` corrects that boundary: QM owns assurance; Primary Owners own remediation.

## Decision

After acceptance, `CAPITAL-AI-QM` is the repository's independent cross-cutting Quality/Assurance function.

QM:

- observes `VC-01` through `VC-18`;
- owns Quality criteria correlation, measurement, Quality gates, findings, evidence, technical-debt assurance, regression assessment and continuous-improvement tracking;
- may execute existing authorized validators/tests and read-only evidence adapters;
- may identify, specify and prioritize required remediation;
- verifies remediation after the responsible Primary Owner implements it.

QM owns **no productive VC stage**:

```text
primary_value_chain_ownership: []
executes_as_primary_owner: []
remediation_execution_local: false
```

## Primary Owner routing

| VC | Primary Owner | VC | Primary Owner |
|---|---|---|---|
| VC-01 | `CAPITAL-AI-CLIENT` | VC-10 | `CAPITAL-AI-FINTECH` |
| VC-02 | `CAPITAL-AI-OPS` | VC-11 | `CAPITAL-AI-FINTECH` |
| VC-03 | `CAPITAL-AI-DOC` | VC-12 | `CAPITAL-AI-FINTECH` |
| VC-04 | `CAPITAL-AI-OPS` | VC-13 | `CAPITAL-AI-FINTECH` |
| VC-05 | `CAPITAL-AI-GOV` | VC-14 | `CAPITAL-AI-FINTECH` |
| VC-06 | `CAPITAL-AI-OPS` | VC-15 | `CAPITAL-AI-FINTECH` |
| VC-07 | `CAPITAL-AI-OPS` | VC-16 | `CAPITAL-AI-FINTECH` |
| VC-08 | `CAPITAL-AI-OPS` | VC-17 | `CAPITAL-AI-FINTECH` |
| VC-09 | `CAPITAL-AI-FINTECH` | VC-18 | `CAPITAL-AI-OPS` |

This routing table governs QM referral. It does not redefine the internal technical authority of the target projects.

## Eight QM workstreams

1. `QM-01` Quality Criteria
2. `QM-02` Quality Gates
3. `QM-03` Quality Measurement
4. `QM-04` Findings
5. `QM-05` Regression
6. `QM-06` Technical Debt
7. `QM-07` Evidence
8. `QM-08` Continuous Improvement

The canonical operational roadmap is `docs/projects/quality-management/ROADMAP.md`.

## Finding and referral contract

Every confirmed finding contains:

- `finding_id`;
- `affected_vc_stage`;
- `target_project`;
- `severity`;
- `evidence`;
- `required_remediation`;
- `verification_gate`;
- `status`.

Lifecycle:

```text
DISCOVERED -> TRIAGED -> CONFIRMED -> REFERRED -> REMEDIATING
-> EVIDENCE_READY -> VERIFIED -> CLOSED
```

A finding requiring implementation uses:

```text
[QUALITY_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]
```

A roadmap reference and explicit chat notice are required. The target project performs remediation in its own project-scoped branch/PR. QM performs the declared verification gate after evidence is ready.

The earlier draft `QUALITY-MANAGEMENT TAKEOVER / HANDED_OFF_TO_QM` model is superseded before this ADR becomes effective and MUST NOT be used to transfer foreign technical execution to QM.

## Prohibited authority

QM MUST NOT assume or mutate:

- Market Data;
- UAI execution;
- Data Quality runtime ownership;
- Scoring;
- Ranking;
- provider routing;
- IAM/Security/Compliance/Governance policy;
- Release approval;
- Production mutation;
- Frontend Product architecture;
- foreign-domain technical implementation.

No productive hot path may gain a direct Quality dependency. Domain evidence is consumed through existing contracts/adapters.

## Existing authorities retained

This ADR does **not supersede**:

- ADR-0096 Governance Control Plane;
- ADR-0016 ESS component-specification history;
- ADR-0073 CI consolidation/build/test authority;
- ADR-0047 authoritative GitHub pre-merge gate;
- ESS-0001-CONTRACTS Chapter 12;
- ESS-0005 Quality Center;
- ESS-0012 Documentation Governance;
- Security/IAM/Compliance/Release/Frontend/FinTech domain authorities;
- `AGENTS.md` repository-wide PR/merge execution controls.

ESS-0005 is clarified in place. No competing ESS or Quality runtime is created.

## Evidence semantics

`PASS` requires complete, real and correctly identity-bound positive evidence. `FAIL` is real negative evidence. Missing, skipped, incomplete, stale or wrong-snapshot evidence is `NOT_AVAILABLE`.

File/test/workflow existence is never execution evidence.

## Pull Request boundary

For a QM project PR:

- one project scope per PR;
- initial title `[CAPITAL-AI-QM] - PR`;
- after GitHub assigns the number, final title `[CAPITAL-AI-QM] - PR <PR_NUMBER>`;
- explicit Owner approval is required for the exact correlated candidate before creation;
- Human/CODEOWNER merge only;
- no direct edit to `main`;
- technical remediation findings are implemented in the target project's PR, not in the QM PR.

This ADR does not weaken the stricter exact-snapshot PR-creation procedure in `AGENTS.md`.

## Consequences

### Positive

- independent assurance across all 18 stages;
- explicit remediation ownership;
- no Quality code in productive hot paths;
- one Finding/Evidence lifecycle;
- reusable existing tests/validators;
- missing evidence remains visible rather than synthesized;
- no duplicated Data/Scoring/Release architecture.

### Trade-offs

- cross-project remediation requires explicit referral and a second verification step;
- QM cannot close findings solely because a target PR merged;
- roadmap and chat traceability are required for handoffs.

## Supersession impact

This proposed ADR introduces QM assurance coordination and does not supersede an existing active ADR authority. Historical/domain documents remain traceable. Any future authority supersession requires the ADR-0096 impact package and explicit supersedes edge.

## Definition of Done

1. QM project contract v2.1 is present.
2. QM owns zero productive VC stages.
3. All 18 stages have Primary Owner routing.
4. The eight V2 workstreams are canonical.
5. Every confirmed finding has an explicit target project.
6. Foreign technical remediation is absent from QM.
7. ESS-0005 remains read-only/non-authorizing.
8. Missing evidence remains `NOT_AVAILABLE`.
9. No parallel Runtime/Data/Scoring/Ranking/Release/Value-Chain architecture is introduced.
10. Remediation occurs in the target project and closure requires independent QM verification.