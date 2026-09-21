# CAPITAL-AI-SEC — Canonical Roadmap

**Baseline:** `main@8a64644ad6257f2c295959f6d79a80cc29a51b28`

**Project:** `CAPITAL-AI-SEC`  
**Folder:** `docs/projects/security/`  
**Role:** cross-cutting Security requirements, findings, bounded remediation and independent verification  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP / NON-AUTHORIZING`  
**Reconciliation:** `2026-09-21 — SEC-WEB-HARDENING-01 promoted to active SEC execution roadmap`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`

## Reconciliation rule

`historical/non-terminal != active`

This Roadmap is the current non-authorizing Security project projection. Historical chats, branches, findings, old queues, archived Roadmap rows and non-terminal labels are evidence only. They do not preserve or reactivate work. The active website/deployment Security sequence below derives from the Human/Owner-directed SEC-WEB-HARDENING-01 package and remains subordinate to /AGENTS.md@CURRENT_MAIN.

A Security work item is executable only when it is currently active under `/AGENTS.md@CURRENT_MAIN` with a canonical current identity or freshly defined/re-authorized by the Human/Owner in the current interaction. Security verification remains independent from implementation claims. `EVIDENCE_READY != VERIFIED` remains invariant.

## Current bounded Security state

### SEC-PR900-01 — Security projection consistency
Synchronize Security projections against current authority and implementation evidence. Preserve historical evidence dates and never rewrite an old result as a new verification.

Human-merged PR #922 synchronized the Security component projection and corrected `.github/CODEOWNERS` wording so repository text does not claim enforcement that provider readback did not prove.

### SEC-PR900-02 — Focused ASVS/security verification
Requirement-level verification remains evidence-bound. Missing provider/runtime evidence is reported as `NOT_VERIFIED`, `NOT_RUN`, `NOT_FULLY_PROVEN` or another truthful bounded state; it never becomes a project-wide PASS.

Known evidence boundaries include:

- file-processing path currently disabled/fail-closed where no approved replacement provider exists;
- productive Google OAuth is provider-managed and still requires exact provider-configuration evidence for complete verification;
- production transport/TLS/proxy/edge readback remains OPS-owned evidence followed by independent Security verification.

### SEC-PR900-03 — Authentication lifecycle
Any MFA, recovery, step-up, provider-configuration or authentication-lifecycle work requires then-current ESS/ADR/provider evidence. Historical provider counts and chat reports do not activate a mutation or prove provider configuration.

### SEC-PR900-04 — Independent owner-return verification
Security may verify current owner-return evidence for CORS/CSP/COOP, method gates, AuthN/AuthZ, route/object/field authorization, entitlement lineage, supervisor behavior, recovery/RPO/RTO, strict CSP and demo-billing isolation.

A foreign-owner `IMPLEMENTED` or `EVIDENCE_READY` state never self-promotes to Security `VERIFIED`. Later chat claims that differ from materialized current evidence remain unproven until reproduced independently.

### SEC-PR900-05 — CodeQL/PostHog/security-provider boundaries
Repository implementation evidence for selective CodeQL/Copilot controls exists from prior Human merges. Effective provider permissions, GitHub security settings not exposed by current readback, PostHog provider state and other external configuration remain separate evidence classes.

Provider availability or repository configuration never proves effective grant state. No PAT/SSO/audit-streaming/environment/provider permission mutation is authorized by a Roadmap row.

### SEC-PR900-06 — Prompt/MCP trust findings
Prompt/history provenance and external MCP grant/session/read-only boundaries require effective current evidence. Retrieved content and chat history remain untrusted inputs and cannot become instruction or task authority.

## Current evidence dispositions

- PR #923 / #931 Controlled CodeQL Autofix: repository implementation/observability evidence exists; provider-permission and successful safe-candidate execution remain separately evidenced.
- PR #956 S1-R2-11: `DONE_MAIN / VERIFIED_REPOSITORY_SCOPE` for the bounded repository contract verified there. The former DATA ownership label is historical; PVC-10 now resolves to `CAPITAL-AI-FINTECH`.
- PR #967 is merged; PR #969 is `CLOSED / NOT MERGED`; no #969 payload is assumed or revived.
- GitHub provider readback remains partial where the connected surface cannot expose effective state.
- `SEC-VERIFY-ULS-001` remains evidence-bound; a prior chat-reported improved lineage does not promote status without reproducible current provider evidence.
- FINTECH entitlement implementations are owner-return evidence only until independently verified by Security where verification remains applicable.

## Historical inventory boundary

Former `SEC-SOTA-*`, `S1-R2-*`, chat reconciliation tables, aggregate Security backlog rows and their old `ACTIVE`, `OPEN`, `PARTIAL`, `BLOCKED`, `CONDITIONAL` or other non-terminal labels remain available through Git history and evidence documents. They are **not an active backlog** and MUST NOT be reconstructed into one merely because they were not terminal.

When a current Security finding genuinely exists, it must be established from then-current repository/provider evidence and receive a current canonical identity or fresh Human/Owner direction before execution.

## DATA ownership supersession alignment

References that historically named `CAPITAL-AI-DATA / PVC-09..11` are ownership history only. Current routing for PVC-09, PVC-10 and PVC-11 resolves to `CAPITAL-AI-FINTECH` under the effective DATA ownership supersession. This does not transfer independent Security verification authority to FINTECH.

## Dependencies
Current owner-correct evidence from OPS, FINTECH, CLIENT, FE, DOC, COMP and other relevant owners; applicable Security ESS/ADR/contracts; independent provider/runtime readback where material.

## Project exit gate
No historical/non-terminal Security state self-activates; independent verification remains separate from owner implementation; provider state is never inferred from repository presence; no duplicate task queue or instruction plane exists; active roadmap work remains traceable to a current package/finding identity and /AGENTS.md@CURRENT_MAIN.

## Active SEC roadmap — SEC-WEB-HARDENING-01

**Owner direction:** 2026-09-20; reaffirmed as SEC Roadmap on 2026-09-21  
**Original materialization:** Human-merged PR #1165  
**Roadmap baseline:** `main@8a64644ad6257f2c295959f6d79a80cc29a51b28`  
**State:** `ACTIVE / ROADMAP_PROMOTED / IMPLEMENTATION_OPEN`  
**Canonical detail:** `docs/projects/security/work-packages/SEC_WEB_HARDENING_01_PUBLIC_WEBSITE_SECURE_DEPLOYMENT.md`  
**Detailed cross-cutting roadmap:** `docs/roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md`

This is the active Security execution roadmap for the rebuilt public website and its production delivery path. It is a non-authorizing orchestration projection: the detailed package owns the finding definitions and exit criteria; implementation stays with the canonical productive owner; Security owns threat/control definition, finding lifecycle, Security tests and independent verification.

### Roadmap sequence

| Phase | Priority | Scope | Primary implementation return | Roadmap state | Exit gate |
|---|---|---|---|---|---|
| `SEC-WEB-00` | P0 | exact current attack-surface/control baseline | SEC + owner readbacks | `READY` | every P0/P1 finding has current evidence, owner and verification gate |
| `SEC-WEB-10` | P0 | one signed production artifact chain | OPS / PVC-07 + PVC-08 | `READY` | registry digest = signed/attested/deployed digest, bound to source SHA |
| `SEC-WEB-20` | P1 | browser isolation + route-minimal strict CSP | FE + OPS | `READY_AFTER_P0` | production headers/CSP verified without breaking protected flows |
| `SEC-WEB-30` | P1 | public API/auth/input/abuse boundary | OPS + CLIENT/FE + affected owner | `READY_AFTER_P0` | route-specific AuthN/AuthZ/method/input/rate/budget negative evidence |
| `SEC-WEB-40` | P1 | readiness, rollback, runtime/deployment resilience | OPS / PVC-04/07/08 | `READY_AFTER_P0` | exact safe artifact for deploy and rollback; liveness/readiness/identity proven |
| `SEC-WEB-50` | P1 | continuous independent assurance | SEC + QM, OPS target | `DEPENDS_ON_IMPLEMENTATION_RETURN` | current runtime/DAST/transport evidence; no unresolved CRITICAL/HIGH finding |

### Immediate P0 chain

`SEC-WEB-00 → F01/F16 digest convergence → F15 exact verified artifact deployment → F23 secret-exposure gate → F10 OAuth/session negative-security baseline → production/open-PR re-correlation`

The P0 chain is dependency-ordered. No remediation may weaken GitGuardian, HIGH/CRITICAL container CVE gates, build/test, PR Governance, Security/Compliance controls or the applicable Human/auto-merge safety boundary.

### Finding groups

- **Artifact / Supply Chain:** F01, F13-F17, F23.
- **Browser / Landing:** F02-F04, F06, F09, F11-F12, F26.
- **API / Abuse / Telemetry:** F05, F07-F08, F21-F25.
- **Identity:** F10.
- **Runtime / Resilience / Edge:** F18-F20, F27-F28.
- **Governance / Verification:** F29-F30.

The exact finding text, owners, threat model, trust boundaries, evidence requirements and closure rules remain canonical in the detailed work package. This roadmap does not duplicate those semantics.

### Owner-return lanes

- **CAPITAL-AI-OPS:** release/runtime/deployment/API remediation and exact provider/runtime evidence.
- **CAPITAL-AI-FE:** landing/browser/CSP implementation only.
- **CAPITAL-AI-CLIENT:** client/session boundary where PVC-01 semantics are affected.
- **CAPITAL-AI-GOV:** F29 provider/ruleset review-enforcement decision only.
- **CAPITAL-AI-COMP:** supply-chain/compliance evidence requirements.
- **CAPITAL-AI-QM:** independent assurance after implementation + SEC verification evidence.

### SEC roadmap exit

`SEC-WEB-HARDENING-01` reaches `CONVERGED` only when all P0/P1 findings have owner-correct terminal dispositions, no known unresolved CRITICAL/HIGH production finding remains, the deployed artifact is exactly bound to source SHA + registry digest + signature + SBOM + provenance, browser/API/Auth controls are independently verified, rollback/readiness/runtime evidence is current, and QM assurance is complete where required.
