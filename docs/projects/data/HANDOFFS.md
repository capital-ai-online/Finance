# CAPITAL-AI-DATA — Cross-Project Handoffs

Project routing follows `docs/projects/CROSS_PROJECT_HANDOFF_CONTRACT.md`. `PVC-*` is the explicit project namespace; legacy `VC-*` markers are retained only for repository compatibility.

Foreign work is not marked `DONE`, `VERIFIED` or `CLOSED` by DATA.

## Incoming Security handoff — S1-R2-11 / PVC-10

`[SECURITY_HANDOFF -> CAPITAL-AI-DATA | VC-10]`  
`[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-DATA | VC-10]`

- `project_namespace: PVC`
- `project_stage: PVC-10`
- `target_project: CAPITAL-AI-DATA`
- `target_project_folder: docs/projects/data/`
- `primary_owner: CAPITAL-AI-DATA`
- `task: own evidence identity/freshness semantics and return evidence for CURRENT, STALE, CURRENT_AFTER_REFRESH and STALE_RETRY_REQUIRED against immutable current identities`
- `reason: stale or wrong-identity evidence must not authorize current state`
- `dependency: CAPITAL-AI-SEC requirements/verification; CAPITAL-AI-OPS owns future PR/trace/DevelopmentChain tooling-code remediation`
- `required_evidence: current immutable baseline/head identities and trusted refresh/retry observations`
- `verification_gate: CAPITAL-AI-SEC independent verification`
- `status: REFERRED_NOT_EXECUTED`
- `source_external_status: WAITING_FOR_EVIDENCE`
- `roadmap_reference: docs/projects/data/ROADMAP.md#data-10--evidence-management--pvc-10`

DATA may implement/evidence the DATA-owned semantics. It may not set the Security finding `VERIFIED/CLOSED`.

Full resolved handoff: `handoffs/CAPITAL_AI_SEC_CROSS_PROJECT_HANDOFF.md`.

## FINTECH — downstream Feature Engineering / PVC-12

`[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FINTECH | VC-12]`

- `project_namespace: PVC`
- `project_stage: PVC-12`
- `target_project: CAPITAL-AI-FINTECH`
- `target_project_folder: docs/projects/fintech/`
- `primary_owner: CAPITAL-AI-FINTECH`
- `task: consume ValidatedDataInput and own feature engineering/confidence/scoring/ranking semantics`
- `reason: DATA must remain upstream of feature/scoring authority`
- `dependency: DATA PVC-11 PASS/PARTIAL field-level output; docs/projects/fintech/ROADMAP.md; ADR-0087`
- `required_evidence: contract compatibility and non-computable/missing/stale preservation`
- `verification_gate: target-project tests and normal FINTECH governance`
- `status: REFERRED_NOT_EXECUTED`

## QM — independent assessment over affected PVC-11

`[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-QM | VC-11]`

- `project_namespace: PVC`
- `project_stage: PVC-11`
- `target_project: CAPITAL-AI-QM`
- `target_project_folder: docs/projects/quality-management/`
- `primary_owner: CAPITAL-AI-DATA`
- `task: independently assess DATA contract tests/evidence, provenance completeness and hot-path isolation`
- `reason: QM is cross-cutting assessment, not productive DATA authority`
- `dependency: ESS-0005; docs/projects/quality-management/ROADMAP.md`
- `required_evidence: exact-candidate DATA test/evidence set`
- `verification_gate: QM read-only assessment`
- `status: REFERRED`

This is an assessment dependency and does not transfer `PVC-11` primary ownership from DATA.

## Documentary — projection / PVC-03

`[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-DOC | VC-03]`

- `project_namespace: PVC`
- `project_stage: PVC-03`
- `target_project: CAPITAL-AI-DOC`
- `target_project_folder: REQUIRES_CORRELATION`
- `primary_owner: CAPITAL-AI-DOC`
- `task: project DATA evidence/status/provenance into documentary surfaces`
- `reason: documentary projection is a separate primary-owner concern`
- `dependency: validated DATA evidence; canonical CAPITAL-AI-DOC project folder is not yet present/resolved on current main`
- `required_evidence: read-only projection traceability`
- `verification_gate: DOC project governance after canonical target-folder resolution`
- `status: BLOCKED_BY`
- `routing_state: REQUIRES_CORRELATION`

DATA does not guess or create the missing CAPITAL-AI-DOC project folder and does not execute this foreign work.

## OPS — EventMesh / Traceability / PVC-18

`[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-18]`

- `project_namespace: PVC`
- `project_stage: PVC-18`
- `target_project: CAPITAL-AI-OPS`
- `target_project_folder: docs/projects/operations/`
- `primary_owner: CAPITAL-AI-OPS`
- `task: transport/retain DATA provider-DQ events and operational traceability`
- `reason: EventMesh/Traceability execution is OPS-owned`
- `dependency: DATA-produced event/evidence contract; docs/projects/operations/ROADMAP.md`
- `required_evidence: event/trace identity preservation`
- `verification_gate: OPS project governance`
- `status: REFERRED_NOT_EXECUTED`

## Security cross-cutting coverage of DATA

CAPITAL-AI-SEC owns Security requirements, findings, negative-test expectations and independent verification across `PVC-09..11`. DATA remains Primary Owner of productive DATA implementation and evidence semantics.

When a DATA implementation/evidence package is ready, return:

`[SECURITY_HANDOFF_RETURN -> CAPITAL-AI-SEC]`

with all fields required by the Security handoff contract. If work is discovered outside DATA ownership, create a separate handoff and leave the foreign implementation `REFERRED_NOT_EXECUTED`.
