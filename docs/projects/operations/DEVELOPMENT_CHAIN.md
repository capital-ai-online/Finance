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

- PR creation: exact current-main/candidate Human/Owner approval.
- Hosted CI: independent evidence, not approval.
- Merge: Human/CODEOWNER only.
- Version transition: controlled Release Version Gate only.
- Release: does not imply Production deployment.
- Production mutation: separate current authorization.
- Security verification: CAPITAL-AI-SEC when a Security finding is involved.

## Historical M0-M10

Existing M0-M10 artifacts remain discoverable implementation/maturity evidence. They are not re-created as permanent OPS project stages. M10 `AUTHORIZE_PR_CI` remains `SUSPENDED / OFF` unless separately reauthorized under current Governance.
