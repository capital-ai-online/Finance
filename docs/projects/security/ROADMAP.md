# CAPITAL-AI-SEC — Project Roadmap

**Project:** `CAPITAL-AI-SEC`  
**Project folder:** `docs/projects/security/`  
**Primary Productive PVC ownership:** `[]`  
**Role:** cross-cutting Security requirements, findings, testing and independent verification  
**Status:** ACTIVE EXECUTION PROJECTION — NON-AUTHORIZING  
**Date:** `2026-09-05`  
**Correlation baseline:** `main@255a89c532f3589e6d157d4f629a47251bd52670`  
**Detailed roadmap:** `docs/roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md`  
**Trust root:** `/AGENTS.md`

## Purpose

This file is the thin owner-side execution projection required by the canonical `docs/projects/` model. Current work and priority are resolved here and then detailed in the canonical Security roadmap. It does not create a second finding register, Security authority, IAM plane, release path or productive PVC owner.

Current project routing is resolved only from:

- `/AGENTS.md`;
- `docs/projects/README.md`;
- `docs/projects/PROJECT_VALUE_CHAIN.md`.

Post-PVC policy overlays withdrawn by current `/AGENTS.md`, including the former Cross-Project Handoff Contract, are historical/non-authorizing and are not current routing inputs.

## Current-main consolidation — 2026-09-05

Repository-backed Security work visible from the available project-chat history and current `main` was re-correlated rather than inferred from chat status alone.

| Work item | Main evidence | Current Security disposition |
|---|---|---|
| Security project/PVC consolidation | canonical Security project surface present; related SEC claims are released | `DONE_MAIN` |
| Adversarial Web/Mobile Security Assessment capability | `.ai/skills/CAPITAL-AI-Security-Assessment.md`, schema/validator and PR #706 | `IMPLEMENTED_MAIN` |
| Security Assessment validator CI binding | `package.json#test:raw` executes `scripts/security/validateSecurityAssessment.test.mjs`; PR #711 merged | `DONE_MAIN` |
| Security Assessment trust-root alignment | skill still references withdrawn Cross-Project Handoff metadata and NIST SP 800-115 although current `/AGENTS.md` withdrew NIST from the repository Governance baseline | `OPEN — SECURITY_OWNED_DOC/CONTRACT_ALIGNMENT` |
| Owner Device Authorization Stage-C verification | initial FAIL evidence exists, followed by independent PASS re-verification evidence on main | `COMPLETE / HISTORICAL`; do not reopen or reconstruct retired M10/withdrawn cutover overlays without new current authority |
| GOV-CHAT-042 User Lifecycle Security integration | PR #725 evidence/test contract present on main | `IMPLEMENTED_MAIN / RESIDUAL_VERIFICATION_OPEN` |
| OPS Security return correlation | merged PR #747 now records R2-04 implementation, R2-03 priority gap, R2-06 parent evidence and remaining OPS evidence gates | `CORRELATED_MAIN`; no Security closure implied |
| S1 hardening findings | current owner roadmaps, code and evidence re-correlated below | mixed; no blanket closure |

## Priority queue

Security-owned work is separated from foreign productive remediation.

1. **`SEC-ASSESS-ALIGN` — Security Assessment current-main alignment.** Remove withdrawn routing-contract dependency and stop presenting NIST SP 800-115 as a current repository Governance baseline. Preserve OWASP methods only as advisory assessment methodology unless separately authorized by current repository authority.
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

PR #747 is now merged into `main@255a89c532f3589e6d157d4f629a47251bd52670`. Its OPS-only changes do not overlap either Security roadmap file and now provide current-main corroboration for the OPS-owned S1 dispositions listed above. At the final resync check there are zero open pull requests against `main`.

The Security branch was rebased logically onto this exact main by rebuilding its tree from the new main and retaining only the two Security roadmap changes. No OPS work-claim or OPS roadmap file is changed by this branch.

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

The dated Security Work Packages and Traceability Matrix from `2026-08-31` remain useful detailed evidence/history but contain pre-current-main routing/status text. Where they conflict with this `2026-09-05` current-main projection, they must not override current `/AGENTS.md`, current project mapping or the detailed Security roadmap. Their full normalization is a separate Security documentation-maintenance task, not foreign productive remediation.

## Validation / completion gate

For this roadmap consolidation:

1. current `/AGENTS.md` and current `main` were read and re-correlated;
2. project/PVC/Primary Owner mapping was resolved from current main;
3. current code, Security evidence, target-owner roadmaps and relevant merged PRs were correlated;
4. open PR/writer overlap was rechecked after PR #747 merged; zero open PRs remain at that check;
5. no foreign productive file is changed;
6. no non-executed test or missing provider evidence is represented as PASS;
7. final `main`/open-PR correlation is required again immediately before any PR creation;
8. PR creation requires separate exact main/head Human/Owner approval;
9. merge remains Human/CODEOWNER-only.
