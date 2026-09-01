# CAPITAL-AI-OPS DevelopmentChain Integration

**Project:** `CAPITAL-AI-OPS`  
**Role:** execution integration / non-authorizing  
**Authority:** `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION` remains Governance-owned

## Durable lifecycle

```text
DC-00 PRECHECK
→ DC-01 PLAN / SCOPE
→ DC-02 CLAIM / BRANCH
→ DC-03 CONTROLLED IMPLEMENTATION
→ DC-04 DOCUMENTARY / EVIDENCE
→ DC-05 SUPERVISOR VALIDATION
→ DC-06 PLATFORM / GOVERNANCE DECISION
→ DC-07 VERSION
→ DC-08 RELEASE
→ DC-09 PRODUCTION
→ DC-10 EVENTMESH / TRACEABILITY
→ DC-11 CLOSE / POST-CHANGE EVIDENCE
```

`DC-*` labels describe lifecycle stages only. They create no `AUTH-*`, `CTRL-*`, ADR, ESS or PVC identity.

## OPS ownership

| Lifecycle | OPS role | PVC |
|---|---|---|
| DC-00 | execute/correlate current-main, PR, writer and risk precheck under GOV controls | affected stages |
| DC-02 | claim/branch coordination | `PVC-02` |
| DC-03 | controlled execution framework; productive domain change remains affected Primary Owner work | `PVC-02` + affected stage |
| DC-05 | Supervisor validation | `PVC-04` |
| DC-07 | version operations | `PVC-06` |
| DC-08 | Release execution | `PVC-07` |
| DC-09 | Production Operations | `PVC-08` |
| DC-10 | EventMesh/Traceability operations | `PVC-18` |
| DC-11 | close/evidence coordination with DOC and affected owner | no new stage |

## External handoffs

- DC-04 → `CAPITAL-AI-DOC / PVC-03` for Documentary/evidence ownership.
- DC-06 → `CAPITAL-AI-GOV / PVC-05` for Platform Director/Governance decision.
- Domain implementation remains with its actual Primary Owner; OPS does not turn PVC-02 into blanket ownership of all source code.

## Protected gates

- PR creation: exact current-main/candidate Human/Owner approval or a valid current supersession such as a project-bound ADR-0104 session.
- Hosted CI: independent evidence, not approval.
- Merge: Human/CODEOWNER only.
- Version transition: controlled Release Version Gate only.
- Release: does not imply Production deployment.
- Production mutation: separate current authorization or valid current supersession.
- Security verification: CAPITAL-AI-SEC when a Security finding is involved.

## Historical M0-M10

Existing M0-M10 artifacts remain discoverable implementation/maturity evidence. They are not re-created as permanent OPS project stages.

M10 Passkey authentication and `AUTHORIZE_PR_CI` are **RETIRED / ARCHIVED / OFF** as the OPS operational state from 2026-09-01. The productive M10 server routes, WebAuthn authorization UI, GitHub Actions M10 dispatch/gate and database runtime access are retired; historical database rows and historical repository evidence remain retained for auditability.

This OPS projection does not supersede or rewrite Governance-owned ADR/ESS/policy authority or Security-owned threat-model lifecycle. Those foreign authority/assurance decisions remain separate cross-project work. M10 must not be reactivated through OPS runtime/configuration. Any future phishing-resistant Human/Owner authorization mechanism requires a new current design and the applicable Governance/Owner decision; it is not an implicit M10 reactivation.

Operational retirement evidence: `docs/projects/operations/evidence/M10_PASSKEY_RETIREMENT_2026-09-01.md`.
