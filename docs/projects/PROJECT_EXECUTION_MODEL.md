# CAPITAL-AI Project Execution Model and DevelopmentChain Integration

**Role:** project lifecycle projection — non-authorizing  
**DevelopmentChain Authority:** `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION`  
**Current-state Authority:** `AUTH-GOV-DEVELOPMENT-CHAIN-STATUS`  
**Temporary cross-project execution:** `AUTH-GOV-JIT-GLOBAL-ROADMAP-EXECUTION`

## Principle

The DevelopmentChain is the repository-wide **delivery lifecycle**. It is not an additional project and does not create a second value chain. `CAPITAL-AI-OPS` is the target organizational execution owner of the recurring DevelopmentChain lifecycle, while each PVC stage retains its Primary Project Owner and Governance retains independent controls.

A Human-Owner-activated `GOV_GLOBAL_ROADMAP_SESSION` may keep orchestration for a pre-defined multi-project roadmap inside one Governance-governed chat. This does not change any Primary Project Owner. The session temporarily delegates execution context across explicitly authorized projects while every productive work item continues to use its target-project branch, scope, evidence and PR boundary.

## Target lifecycle

```text
DC-00 PRECHECK
  -> DC-01 PLAN / SCOPE
  -> DC-02 CLAIM / BRANCH
  -> DC-03 CONTROLLED IMPLEMENTATION
  -> DC-04 DOCUMENTARY / EVIDENCE
  -> DC-05 SUPERVISOR VALIDATION
  -> DC-06 PLATFORM / GOVERNANCE DECISION
  -> DC-07 VERSION
  -> DC-08 RELEASE
  -> DC-09 PRODUCTION
  -> DC-10 EVENTMESH / TRACEABILITY
  -> DC-11 CLOSE / POST-CHANGE EVIDENCE
```

`DC-*` labels are lifecycle labels only. They do not create `AUTH-*`, `CTRL-*`, ADR, ESS or PVC identities.

## Ownership mapping

| Lifecycle | Project responsibility | PVC relationship |
|---|---|---|
| DC-00 Precheck | GOV controls + OPS execution coordination + affected Primary Owner | all affected PVC stages |
| DC-01 Plan / Scope | affected Primary Project Owner | affected PVC stage(s) |
| DC-02 Claim / Branch | `CAPITAL-AI-OPS` execution lifecycle | `PVC-02` operational boundary |
| DC-03 Controlled Implementation | affected Primary Owner under OPS-controlled implementation | `PVC-02` plus target domain stage |
| DC-04 Documentary / Evidence | `CAPITAL-AI-DOC` | `PVC-03` |
| DC-05 Supervisor Validation | `CAPITAL-AI-OPS` | `PVC-04` |
| DC-06 Platform / Governance Decision | `CAPITAL-AI-GOV` for Platform Director; approval authority remains separate | `PVC-05` |
| DC-07 Version | `CAPITAL-AI-OPS` | `PVC-06` |
| DC-08 Release | `CAPITAL-AI-OPS` | `PVC-07` |
| DC-09 Production | `CAPITAL-AI-OPS` | `PVC-08` |
| DC-10 EventMesh / Traceability | `CAPITAL-AI-OPS` | `PVC-18` |
| DC-11 Close / Evidence | OPS coordination + DOC/evidence producers + affected owner | no new PVC stage |

## Temporary global roadmap execution

`CTRL-GOV-JIT-GLOBAL-ROADMAP-001` is an execution-routing exception, not a new project or PVC stage.

An active session may execute the roadmap sequence in one chat as follows:

```text
Human Owner approves exact session manifest
  -> GLOBAL ROADMAP SESSION ACTIVE
  -> resolve next target project from approved roadmap
  -> fresh current-main / AGENTS / target-owner / writer correlation
  -> [GLOBAL_ROADMAP_CONTEXT_SWITCH -> TARGET_PROJECT | PVC-NN]
  -> target-project branch + work claim + implementation + validation
  -> exact Base/Head Human PR-creation approval
  -> PR + hosted checks + Human merge
  -> recompute roadmap/current-main state
  -> next approved target context
  -> session completion / expiry / revocation
```

The chat may traverse multiple Primary Owners, but a productive branch/PR may not. Each target work item remains owned and reviewed according to its canonical project/domain authority.

The session does not bypass `DC-00..DC-11`; it only avoids requiring a separate target-project chat when the exact target is already inside the active Human-approved roadmap session.

Protected production/provider mutations remain separately authorized and are not included merely because a roadmap contains a Production Operations step.

## Existing authority remains unchanged

The following remain canonical in their existing scopes:

- `/AGENTS.md`;
- `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`;
- `docs/governance/TEMPORARY_GLOBAL_ROADMAP_EXECUTION_POLICY.md` for the optional JIT session;
- `docs/architecture/ROADMAP.md` (`AUTH-GOV-DEVELOPMENT-CHAIN-STATUS`);
- Primary Project Owner identities in `PROJECT_VALUE_CHAIN.md`;
- Human/Owner exact-snapshot PR creation and Human merge controls;
- independent hosted CI;
- separate production-mutation/deployment controls;
- independent Security/Compliance/Quality decision boundaries.

## M0-M10 disposition

Historical M0-M10 DevelopmentChain material remains discoverable as implementation/maturity evidence. The durable project navigation uses the DC lifecycle above; historical M-stage records remain references to prior implementation phases.

Current M10 Passkey PR-CI enforcement remains `SUSPENDED / OFF`; project restructuring or global-roadmap session activation cannot reactivate it.

## P2 target project

Actual recurring DevelopmentChain project implementation belongs to `CAPITAL-AI-OPS -> docs/projects/operations/`.

Expected OPS project surface:

```text
docs/projects/operations/
  README.md
  ROADMAP.md
  DEVELOPMENT_CHAIN.md
  PVC_OWNERSHIP.md
  WORK_PACKAGES.md
  CROSS_PROJECT_DEPENDENCIES.md
  runbooks/
  evidence/
```

GOV does not become the permanent OPS owner. Outside an active exact-scope global-roadmap session, GOV uses the normal handoff recorded under `docs/projects/governance/P2_DEVELOPMENT_CHAIN_HANDOFF.md`. Inside such a session, the same chat may execute the exact approved OPS work item under OPS project context and branch/claim boundaries.

## No bypass rule

A project or global-roadmap session may not shortcut the DevelopmentChain by directly moving from implementation to release/production, treating evidence as approval, using session activation as PR/merge approval, or using EventMesh/Traceability as authorization. Missing required stage evidence or protected authorization remains fail-closed.
