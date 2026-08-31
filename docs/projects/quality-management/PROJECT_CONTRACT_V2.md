# CAPITAL-AI-QM V2 — Project Contract

**Prompt ID:** `CAPITAL-AI-QM-V2`  
**Version:** `2.1`  
**Project:** `CAPITAL-AI-QM`  
**Display name:** CAPITAL-AI Quality Management  
**Role:** `CROSS_CUTTING_QUALITY_ASSURANCE`  
**Lifecycle:** `PROPOSED — effective only with ADR-0103 acceptance / Human Merge`

## 1. Ownership model

CAPITAL-AI-QM owns **no productive value-chain stage**.

- Primary value-chain ownership: `[]`
- Observes: `VC-01` through `VC-18`
- Executes as primary owner: `[]`
- Remediation execution in QM: `false`

QM remains an independent Quality/Assurance function. It measures, evaluates, raises findings, verifies remediation evidence and tracks continuous improvement without acquiring productive Data, Scoring, Ranking, Release or Runtime authority.

## 2. Primary Owner reference

| VC stage | Primary Owner |
|---|---|
| VC-01 | `CAPITAL-AI-CLIENT` |
| VC-02 | `CAPITAL-AI-OPS` |
| VC-03 | `CAPITAL-AI-DOC` |
| VC-04 | `CAPITAL-AI-OPS` |
| VC-05 | `CAPITAL-AI-GOV` |
| VC-06 | `CAPITAL-AI-OPS` |
| VC-07 | `CAPITAL-AI-OPS` |
| VC-08 | `CAPITAL-AI-OPS` |
| VC-09 | `CAPITAL-AI-DATA` |
| VC-10 | `CAPITAL-AI-DATA` |
| VC-11 | `CAPITAL-AI-DATA` |
| VC-12 | `CAPITAL-AI-FINTECH` |
| VC-13 | `CAPITAL-AI-FINTECH` |
| VC-14 | `CAPITAL-AI-FINTECH` |
| VC-15 | `CAPITAL-AI-FINTECH` |
| VC-16 | `CAPITAL-AI-FINTECH` |
| VC-17 | `CAPITAL-AI-FINTECH` |
| VC-18 | `CAPITAL-AI-OPS` |

This table is the QM routing reference. It does not redefine the technical authority of any domain.

## 3. Local QM scope

QM owns the assurance functions:

- Quality Criteria;
- Quality Measurement;
- Quality Gates;
- Quality Findings;
- Quality Evidence;
- Technical Debt;
- Regression Assessment;
- Continuous Improvement Tracking;
- Quality Center orchestration within ESS-0005.

QM may identify, specify and prioritize a technical remediation step, but implementation remains with the Primary Owner of the affected VC stage.

## 4. Prohibited authority

QM MUST NOT assume:

- Market Data mutation;
- UAI execution;
- Data Quality runtime ownership;
- Scoring mutation;
- Ranking mutation;
- Release approval;
- Production mutation;
- provider routing;
- foreign domain implementation ownership.

## 5. Architecture migration rules

1. Retain QM as sidecar/read-only assurance architecture.
2. Map every confirmed finding to a Primary Owner.
3. Do not introduce a direct Quality dependency into productive hot paths.
4. Use evidence adapters instead of duplicating domain logic.
5. Separate Quality assessment from implementation ownership.
6. Preserve missing, stale, skipped, unbound or incomplete evidence as `NOT_AVAILABLE`.
7. Reuse existing validators, CI, EventMesh, telemetry and Quality Center contracts.
8. Do not create a parallel Data, Runtime, Scoring, Ranking, Routing, Release or Value-Chain architecture.

## 6. Workstreams

| ID | Workstream |
|---|---|
| `QM-01` | Quality Criteria |
| `QM-02` | Quality Gates |
| `QM-03` | Quality Measurement |
| `QM-04` | Findings |
| `QM-05` | Regression |
| `QM-06` | Technical Debt |
| `QM-07` | Evidence |
| `QM-08` | Continuous Improvement |

## 7. Finding contract

Every QM finding MUST contain:

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
DISCOVERED
-> TRIAGED
-> CONFIRMED
-> REFERRED
-> REMEDIATING
-> EVIDENCE_READY
-> VERIFIED
-> CLOSED
```

`REMEDIATING` describes the Primary Owner's implementation state. It does not transfer implementation authority to QM.

## 8. Cross-project handoff

Required marker:

```text
[QUALITY_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]
```

Every referral MUST include:

- canonical QM finding/workstream reference;
- affected VC stage;
- target project / Primary Owner;
- required remediation;
- verification gate;
- roadmap reference;
- evidence reference;
- explicit chat notice.

The target project performs remediation in its own project-scoped branch/PR. QM verifies the resulting evidence after implementation.

## 9. Validation invariants

- QM remains independent.
- QM has no productive hot-path authority.
- Every confirmed finding has a target project.
- All 18 stages are measurable where evidence exists.
- Missing evidence remains `NOT_AVAILABLE`.
- QM has no Data ownership.
- Quality Center remains read-only/non-authorizing.

## 10. Pull Request contract

QM project PRs use one project scope per PR.

- Creation title: `[CAPITAL-AI-QM] - PR`
- Required final title after GitHub assigns the number: `[CAPITAL-AI-QM] - PR <PR_NUMBER>`
- Remediation implementation belongs in the target project's PR, not the QM PR.
- Explicit Owner approval is required for the exact PR candidate snapshot before PR creation.
- Human/CODEOWNER merge only.
- Direct edits to `main` are prohibited.

The repository-wide `AGENTS.md` and current PR template remain higher-order execution controls. This project contract does not bypass their exact-snapshot approval requirements.

## 11. Definition of Done

- QM roadmap references all relevant projects.
- No foreign technical execution remains assigned to QM.
- Findings have explicit remediation owners.
- All eight workstreams use the common finding/evidence model.
- The 18-stage projection remains sidecar/read-only.
- Quality Center remains non-authorizing.
