# CAPITAL-AI-SEC — Project Roadmap

**Project:** `CAPITAL-AI-SEC`  
**Project folder:** `docs/projects/security/`  
**Primary Productive PVC ownership:** `[]`  
**Role:** cross-cutting Security requirements, findings, testing and independent verification  
**Status:** ACTIVE EXECUTION PROJECTION — NON-AUTHORIZING  
**Date:** `2026-09-06`  
**Correlation baseline:** `main@eaa5fe228ff0d61d8116932665406c75b0bbf8e7`  
**Detailed roadmap:** `docs/roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md`  
**Trust root:** `/AGENTS.md`

## Purpose

This file is the thin owner-side execution projection required by the canonical `docs/projects/` model. Current work and priority are resolved here and then detailed in the canonical Security roadmap. It does not create a second finding register, Security authority, IAM plane, release path or productive PVC owner.

Current project routing is resolved only from:

- `/AGENTS.md`;
- `docs/projects/README.md`;
- `docs/projects/PROJECT_VALUE_CHAIN.md`.

Post-PVC policy overlays withdrawn by current `/AGENTS.md`, including the former Cross-Project Handoff Contract, are historical/non-authorizing and are not current routing inputs.

## Current-main consolidation — 2026-09-06

Repository-backed Security work visible from the available project-chat history and current `main` was re-correlated rather than inferred from chat status alone.

| Work item | Main / branch evidence | Current Security disposition |
|---|---|---|
| Security project/PVC consolidation | PR #749 merged; canonical Security project and detailed roadmap now on main | `DONE_MAIN` |
| Adversarial Web/Mobile Security Assessment capability | `.ai/skills/CAPITAL-AI-Security-Assessment.md`, schema/validator and PR #706 | `IMPLEMENTED_MAIN` |
| Security Assessment validator CI binding | `package.json#test:raw` executes `scripts/security/validateSecurityAssessment.test.mjs`; PR #711 merged | `DONE_MAIN` |
| Security Assessment trust-root alignment | branch `agent/security-assess-align-20260905` updates skill v1.0.1 and adds an authority-regression test; current `ESS-0006` v1.1.0 confirms the bounded SEC verification/remediation-owner split | `IMPLEMENTED_BRANCH / VALIDATION + PR PENDING` |
| Owner Device Authorization Stage-C verification | initial FAIL evidence exists, followed by independent PASS re-verification evidence on main | `COMPLETE / HISTORICAL`; do not reopen or reconstruct retired M10/withdrawn cutover overlays without new current authority |
| GOV-CHAT-042 User Lifecycle Security integration | PR #725 evidence/test contract present on main | `IMPLEMENTED_MAIN / RESIDUAL_VERIFICATION_OPEN` |
| OPS Security return correlation | merged PR #747 records R2-04 implementation, R2-03 priority gap, R2-06 parent evidence and remaining OPS evidence gates | `CORRELATED_MAIN`; no Security closure implied |
| S1 hardening findings | current owner roadmaps, code and evidence re-correlated below | mixed; no blanket closure |

## Priority queue

Security-owned work is separated from foreign productive remediation.

1. **`SEC-ASSESS-ALIGN` — Security Assessment current-main alignment.** `IMPLEMENTED_BRANCH / VALIDATION + PR PENDING`: Skill v1.0.1 removes the withdrawn routing dependency, uses only current project/PVC mapping, and marks OWASP methodologies advisory/non-authorizing. A focused regression test prevents reintroduction of the withdrawn handoff contract or NIST SP 800-115 baseline. Exit gate: exact-head applicable checks + Human/Owner PR creation approval + Human/CODEOWNER merge.
2. **`SEC-VERIFY-ULS-001` — User Lifecycle subscription-identity re-verification.** OPS has read-only provider evidence that the stable `metadata.user_id -> auth.users.id -> public.subscriptions.user_id` contract is deployed; Security must independently verify the returned evidence without closing unrelated provider/E2E gaps.
3. **`SEC-VERIFY-R2-04` — Fatal-process remediation verification.** PR #720 is merged and implemented; Security closure still requires applicable negative/runtime/post-deploy evidence.
4. **`SEC-AUTH-LIFECYCLE` — MFA/AAL lifecycle correlation.** ESS-0020 remains proposed; current Governance evidence explicitly declined unilateral foreign-domain disposition. No Security or Governance agent may self-promote or retire it; any lifecycle change follows current authority/Human gates.
5. Track foreign-owner S1 remediation/evidence returns without absorbing implementation: `S1-R2-03`, `05`, `06`, `07`, `09`, `10`, `11` and User Lifecycle provider residuals.

## Current finding projection

| Finding / residual | Primary productive owner | Main-correlated state | Security next gate |
|---|---|---|---|
| `S1-R2-03` Node control-plane convergence | `CAPITAL-AI-OPS / PVC-06` | `OPEN / HIGHEST EXECUTABLE OPS P1`; `.nvmrc` remains `24.18.0` while required convergence target is `24.20.0` | verify exact identity after OPS implementation |
| `S1-R2-04` fatal process handling | `CAPITAL-AI-OPS / PVC-04`, runtime evidence `PVC-08` | `IMPLEMENTED_ON_MAIN` via PR #720; independent Security/post-deploy verification pending | negative + post-deploy/supervisor evidence |
| `S1-R2-05` Stripe redirect boundary | `CAPITAL-AI-OPS / PVC-02` | `OPEN` | open-redirect DENY evidence after OPS remediation |
| `S1-R2-06` entitlement authority | OPS parent inventory; FINTECH/DATA children by actual capability owner | parent inventory `EVIDENCE_READY`; child remediation + Security verification remain | per-capability server-side DENY verification |
| `S1-R2-07` recovery / RPO / RTO | `CAPITAL-AI-OPS / PVC-08` | `OPEN / UNVERIFIED` | measured restore/integrity/RPO/RTO evidence |
| `S1-R2-09` strict CSP promotion | `CAPITAL-AI-OPS / PVC-08` | `WAITING_FOR_EVIDENCE` | compatibility/violation evidence before strict-state claim |
| `S1-R2-10` demo billing isolation | `CAPITAL-AI-OPS / PVC-08` | `WAITING_FOR_EVIDENCE` | production reachability proof bound to deployed identity |
| `S1-R2-11` evidence identity/freshness | `CAPITAL-AI-DATA / PVC-10` | `OPEN`; DATA roadmap says Security evidence work open | current/stale/wrong-identity behavior evidence |
| User Lifecycle subscription identity | `CAPITAL-AI-OPS / PVC-08` evidence provider | `OPS_PROVIDER_EVIDENCE_READY / SECURITY_REVERIFICATION_REQUIRED` | independent read-only Security verification |
| User Lifecycle provider E2E | `CAPITAL-AI-OPS / PVC-08` plus applicable provider/runtime owners | `NOT_AVAILABLE` for Supabase Local/Mailpit, cross-user provider E2E, Stripe Sandbox/Test Clock and payment/redelivery scenarios | remain non-PASS until reproducible evidence exists |
| leaked-password protection | `CAPITAL-AI-OPS / PVC-08` provider configuration | `OPEN DEFENSE-IN-DEPTH`; current advisor warning remains | separate protected config decision/mutation, then Security evidence |
| MFA/AAL authority lifecycle | no productive Security PVC ownership; current lifecycle requires applicable authority/Human decision | `OPEN / CLARIFY`; ESS-0020 remains `PROPOSED` | current authority correlation; no unilateral promotion/retirement |

No row above grants CAPITAL-AI-SEC productive implementation ownership.

## Current correlation state

Current task baseline is `main@eaa5fe228ff0d61d8116932665406c75b0bbf8e7`. `/AGENTS.md` remains v2.7.1 and `ESS-0006` remains v1.1.0. The current-main delta since the prior `7c607de0dfa12e37b1a4070a2cb65e4d484cc6eb` Security snapshot is Governance/Compliance/SEO/Frontend-adjacent and does not modify the four SEC target files. The branch merge-base is exact current main and the scoped diff remains four Security-owned files.

PR #765 was closed unmerged after a PR-creation race invalidated its approved snapshot; it is historical and not a merge candidate. The only open PR at this revalidation snapshot is PR #763 (`CAPITAL-AI-FE`), whose changed files are `src/components/Dashboard.tsx` and `tests/unit/dashboardConsumerCutover.test.ts`; it has no changed-file, semantic, namespace, authority or Primary-Owner overlap with `SEC-ASSESS-ALIGN`.

The scoped branch `agent/security-assess-align-20260905` contains only the Security Assessment skill, its focused validator regression test, and the two Security roadmap projections. No foreign project file or productive runtime/provider surface is changed.

## Security execution invariants

- Missing, stale or `NOT_AVAILABLE` required evidence is never PASS.
- `EVIDENCE_READY` is not `VERIFIED`.
- Security may define, test, reject and independently verify but does not silently implement foreign productive code.
- `ACCEPTED_RISK` requires applicable Human/Owner authority.
- Security project navigation never creates Authority.
- `src/platform/Security` is the reusable Security implementation boundary only for inherently Security-owned controls.
- Technical `VC-*` identifiers and organizational `PVC-*` routing remain separate namespaces.
- M10 productive runtime is retired/off under current `/AGENTS.md`; historical Owner Device evidence does not reactivate it.
- Merge, Release, Production and protected external mutation remain under current repository/Human gates.

## Secondary-surface status

The dated Security Work Packages and Traceability Matrix from `2026-08-31` remain useful detailed evidence/history but contain pre-current-main routing/status text. Where they conflict with this current-main projection, they must not override current `/AGENTS.md`, current project mapping or the detailed Security roadmap. Their full normalization is a separate Security documentation-maintenance task, not foreign productive remediation.

## Validation / completion gate

For `SEC-ASSESS-ALIGN`:

1. current `/AGENTS.md` v2.7.1 and current `main@eaa5fe228ff0d61d8116932665406c75b0bbf8e7` were read and re-correlated;
2. project/PVC/Primary Owner mapping remains `CAPITAL-AI-SEC`, `docs/projects/security/`, productive PVC `[]`;
3. current `ESS-0006` v1.1.0 was re-read and is semantically compatible with this work;
4. PR #765 is closed unmerged; current open PR #763 has no relevant overlap;
5. the assessment skill no longer depends on the withdrawn Cross-Project Handoff Contract or NIST SP 800-115 as a repository baseline;
6. OWASP methodology reuse is explicitly advisory/non-authorizing;
7. focused regression coverage guards the authority/routing boundary;
8. no foreign productive file or external platform is mutated;
9. local test execution remains `NOT RUN` because the isolated runner could not resolve `github.com`; this is not represented as PASS;
10. final exact main/head re-read is required immediately before PR creation after a fresh valid approval snippet;
11. merge remains Human/CODEOWNER-only.
