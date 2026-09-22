# GOV-POLICY-CONTRACT-CONVERGENCE-20260922 — Development-Chain Policy & Contract Convergence

**Project:** `CAPITAL-AI-GOV`  
**Owner/PVC:** `CAPITAL-AI-GOV / PVC-05`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Correlation baseline:** `main@a328f9cfdb1dba2845aa0e5c2c78e5a286a0e64d`  
**Self-Healing architecture:** `CAPITAL-AI-ASH-01`  
**Executable Self-Healing contract:** `src/platform/Supervisor/selfHealingContract.ts` / `self-healing-contract/1.0.0`  
**Status:** `IMPLEMENTATION_ON_BRANCH / VALIDATION_PENDING`

## Objective

Converge the active repository policy/contract/handoff/security/current-state surfaces so they cannot create contradictory DevelopmentChain execution semantics. No mega-policy or second authority layer is introduced. Execution semantics remain exclusively in `AGENTS.md`; ADR/ESS/contracts/Security/Compliance/domain documents remain subject-matter constraints; Handoffs/Issues/EventMesh/evidence remain non-authorizing state transfer.

The existing Self-Healing control loop remains singular:

`Observe -> Detect -> Diagnose -> Plan -> Remediate -> Verify -> Converge | Quarantine/Escalate`

Repository policy/current-state drift uses the existing `REPOSITORY_CURRENT_STATE_PROJECTION_DRIFT -> RECONCILE_REPOSITORY_PROJECTION` lane. `SECURITY_OR_POLICY_BLOCKED` remains fail-closed observation/escalation where mutation would cross an owner or protected boundary.

## Correlation model

| Surface class | Canonical role | May instruct development? | Convergence rule |
|---|---|---:|---|
| `/AGENTS.md@CURRENT_MAIN` | sole repository trust root / execution model | yes | wins on procedural conflict |
| Project README + PVC | owner/project routing projection | no | exact current-main owner/PVC resolution |
| Accepted ADR/ESS/AUTH/CTRL/domain contracts | subject-matter constraints | no | constrain only declared scope |
| Security/Compliance/QM | independent subject-matter / assurance constraints | no | cannot be weakened by Self-Healing |
| Self-Healing architecture + contract | finding/action/eligibility/convergence model | no new authority | consumes already-authorized boundaries only |
| Roadmaps/status indexes | non-authorizing state projection | no | stale state = drift, fail closed until refreshed |
| Handoffs/Issues/EventMesh/evidence | status/evidence transfer | no | owner-correct, correlation-ID bound |
| Historical/archive material | provenance | no | preserve; never reactivate |

## Findings and disposition

| Finding | Observed state | Disposition |
|---|---|---|
| Enterprise state index still projects `PVC-09..11` to `CAPITAL-AI-DATA` | contradicts AGENTS/README/PVC | GOV-owned correction on this branch |
| Integrated Development/Systemadmin roadmap cites removed standalone DevelopmentChain policy and old M10 `SUSPENDED/OFF` state | active projection drift | GOV-owned correction; M10 -> `RETIRED/OFF` |
| Portfolio/master index calls non-authorizing status index an execution/current-state authority | semantic authority drift | GOV-owned wording correction |
| ChatGPT sandbox + document registry describe removed standalone policy as authority | active specification/registry drift | GOV-owned correction |
| Grok provider-specific policy/prompt files still use ACTIVE/PROPOSED normative wording | competing provider instruction surface risk | mark historical/non-authorizing; retain content as provenance only |
| AI Agent M0-M10 roadmap still says IMPLEMENTATION PHASE and references removed files | obsolete active roadmap risk | mark historical/non-authorizing with current authority note |
| M10 compatibility runbook redirect lists removed policies as “Current authority” | compatibility-surface drift | GOV-owned redirect correction; archived original unchanged |
| Current Governance library annotation points to retired standalone policies | current-annotation drift | update annotation only; preserve snapshot body as history |
| `.github/SECURITY.md` + Security threat model stale execution authority reference | SEC-owned | Issue #1230 |
| OPS/Systemadmin dependency/runbook/test stale DevelopmentChain authority reference | OPS-owned | Issue #1231 |
| Social OAuth runbook stale deployment-authority reference | SOCIAL-owned | Issue #1232 |
| `docs/adr/**` current redirect contains stale current-authority text | overlaps active GOV historical-framework-purge claim | no mutation here; fail-closed overlap recorded |

## Regression guard

Governance structural validation is extended only for current GOV/global projection surfaces corrected by this work package. It must fail when:

1. a corrected active current projection again cites a removed standalone DevelopmentChain/PR policy as current execution authority;
2. the Enterprise state index again maps current `PVC-09..11` ownership to `CAPITAL-AI-DATA`;
3. provider-specific Grok surfaces lose their explicit historical/non-authorizing status;
4. the legacy AI-agent roadmap loses its historical/non-authorizing guard.

Foreign-owner surfaces are not placed behind a GOV writer. They converge through Issues #1230/#1231/#1232 and their own owner-correct validation.

## Acceptance criteria

- one procedural execution authority: `AGENTS.md@CURRENT_MAIN`;
- no second DevelopmentChain, PR, Handoff, Grok/provider or Self-Healing control plane;
- current owner/PVC state = `CAPITAL-AI-FINTECH / PVC-09..17`;
- existing Security/Compliance/domain gates preserved;
- historical evidence is not rewritten into false current state;
- exact changed-file validation is truthful; unexecuted hosted checks remain `NOT_EXECUTED/PENDING`;
- final PR is re-correlated against then-current main before merge readiness.
