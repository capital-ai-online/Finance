# CAPITAL-AI S1 Security Hardening Roadmap

Status: ACTIVE / PARTIAL / ACTION REQUIRED  
Status date: 2026-08-30  
Repository baseline reviewed: `main@5e4da8caba1aa7bae70abe5bf021a857ccef2f84`  
Last verified production deployment identity: `b8c4757aaa62a2a63745e2f86a777630968f4f5d`  
Active governance branch: `security/r2-02-live-ruleset-authority-20260830`  
Historical security baseline: `docs/security/SECURITY_REMEDIATION_BASELINE_2026-08-12.md`  
Current Operations handoff: `docs/runbooks/OPERATIONS_HANDOFF_2026-08-29.md`

## Objective and authority

S1 remains the single canonical bounded security-hardening gate inside the DEVELOPMENT Chain. This file is updated in place; no second Security roadmap or competing S1 status authority is introduced.

`HARDENED / VERIFIED` requires evidence appropriate to each control. Owner-accepted residual-risk decisions are recorded explicitly and are not rewritten as stronger technical enforcement than actually exists.

## Owner decisions recorded 2026-08-30

1. **S1-R2-08 leaked-password protection:** native Supabase leaked-password protection is unavailable on the active Free/Base tier. No custom substitute is introduced solely to emulate that paid capability.
2. **S1-R2-09:** ADR-0040 remains authoritative. Production stays `report-only` until the protected strict-promotion evidence exists.
3. **S1-R2-09 through S1-R2-11:** the bounded tail work was merged through PR #619; post-deploy evidence remains separate from merge evidence.
4. **S1-R2-02 live GitHub ruleset supersession:** the Owner withdraws the repository-owned canonical desired ruleset. The currently active GitHub provider rules are accepted to remain in force. `.github/policies/main-production-protection.expected.json` is retired, `ruleset-sync` becomes read-only provider readback, and no `package_a`/`full` reconciliation remains authorized or implemented. Historical documents describing the former desired state remain historical evidence only and are non-normative.

## Reassessment register (R2)

| ID | Source finding | Priority | Current status | Required disposition |
|---|---|---:|---|---|
| S1-R2-00 | P1-C01 simulated client tier transition | P1 Conditional | OPEN / TRACE PENDING | Prove complete reachability and authority |
| S1-R2-01 | P2-04 workflow `345251495` startup failure | P1 Operational | RESOLVED / OBSOLETE HISTORICAL | Retain traceability |
| S1-R2-02 | P1-01 default-branch enforcement | P1 | OWNER-ACCEPTED / VERIFIED LIVE STATE | Retain current provider rules; readback only |
| S1-R2-03 | P1-02 Node control-plane 24.18.0 | P1 | OPEN / PARTIAL CONVERGENCE | Converge repository/control-plane to Node 24.20.0 |
| S1-R2-04 | P1-03 `uncaughtException` resumes process | P1 | OPEN / CONFIRMED | Fail-fast + bounded cleanup + non-zero exit + supervisor evidence |
| S1-R2-05 | P1-04 client-controlled Stripe redirect URLs | P1 | OPEN / CONFIRMED | Server-owned canonical redirect boundary |
| S1-R2-06 | P1-C01 entitlement authority, if reachable | P1 | CONDITIONAL | Activate only if R2-00 proves authority impact |
| S1-R2-07 | P1-05 RPO/RTO and restore capability | P1 | OPEN / UNVERIFIED | Encrypted off-site backup + isolated measured restore drill |
| S1-R2-08 | P2-03 leaked-password protection | P2 | OWNER-ACCEPTED / TIER EXCEPTION | Retain compensating controls |
| S1-R2-09 | P2-02 strict CSP promotion | P2 | PARTIAL / REPORT-ONLY | Collect ADR-0040 promotion evidence |
| S1-R2-10 | P2-05 demo billing/coupon logic | P2 | MERGED / POST-DEPLOY VERIFY PENDING | Verify Production cannot reach DEV simulation |
| S1-R2-11 | P2-01/P2-06 evidence identity and staleness | P2 | MERGED / VERIFY PENDING | Verify trusted stale-state automation after merge/deploy |
| S1-R2-12 | P2-01 production/main content drift | P2 | VERIFIED / HISTORICAL | Keep identity correlation |

## Mandatory execution order

```text
R2-00 entitlement authority trace
+ R2-01 RESOLVED historical classification
        ↓
R2-02 OWNER-ACCEPTED live GitHub provider state
        ↓
R2-03 Node control-plane supersession
        ↓
R2-04 fatal process recovery
        ↓
R2-05 Stripe redirect boundary
→ R2-06 entitlement remediation only if R2-00 activates it
        ↓
R2-07 disaster recovery evidence
        ↓
R2-08 OWNER-ACCEPTED tier exception
        ↓
R2-09 report-only promotion gate + R2-10/R2-11 post-merge verification
        ↓
S1-R2 HARDENED / VERIFIED gate
```

## S1-R2-00 — Entitlement authority trace

**Current state:** OPEN / TRACE PENDING

Required proof remains:

- identify production-reachable simulated tier/payment callers;
- prove whether browser tier state can influence persisted/server authorization;
- inventory protected API entitlement decision points;
- prove browser-controlled tier values cannot grant protected server capability;
- prove Stripe-verifiable server state is subscription truth;
- classify `NOT AUTHORITY` or `CONFIRMED AUTHORITY GAP`.

If authority impact is proven, R2-06 activates immediately.

## S1-R2-01 — Workflow startup-failure classification

**Current state:** RESOLVED / OBSOLETE HISTORICAL

Workflow ID `345251495` remains obsolete historical evidence. Reopening requires new evidence of a current missing control.

## S1-R2-02 — GitHub default-branch enforcement

**Current state:** OWNER-ACCEPTED / VERIFIED LIVE STATE  
**Provider mutation pending:** No

### Verified provider evidence

PR #619 merged to `main@5ec3a4179f1a7e01295abf038f6767a581abdf68`. The subsequent `ruleset-sync` Run #8 (`33329575562`) completed successfully in `mode=plan` on that exact trusted `main`.

Provider readback of `main-production-protection` showed the active ruleset retained as follows:

- enforcement: `active`;
- target: branch / default branch scope;
- `bypass_actors=[]` and `current_user_can_bypass=never`;
- `non_fast_forward` enabled;
- pull-request rule present;
- required approving reviews: `0` for the current single-owner topology;
- CODEOWNER review: not required;
- review-thread resolution: not required;
- extra approval for unattributed changes: required;
- allowed merge methods: `merge`, `squash`, `rebase`;
- advisory `code_quality` at warning severity;
- strict/up-to-date required status checks enabled for:
  - `build-and-test` — integration `15368`;
  - `PR Governance (Kosten / Workflow / Vorlage)` — integration `15368`;
  - `Hardened image / HIGH+CRITICAL CVE gate` — integration `15368`;
  - `GitGuardian Security Checks` — integration `46505`.

The live ruleset does not currently require deletion protection, linear history, CODEOWNER review or review-thread resolution. The repository also currently allows merge commits and does not require web commit signoff. These are **not pending Soll-Abweichungen anymore**; they are part of the Owner-accepted current provider state.

### Supersession decision

The former repository-owned desired-state contract is retired:

- `.github/policies/main-production-protection.expected.json` is deleted;
- `scripts/security/rulesetSync.mjs` performs GET/readback only;
- `package_a` and `full` apply modes are removed;
- `scripts/security/rulesetAdminEnvironment.mjs` is removed because no ruleset/environment apply path remains;
- `.github/workflows/ruleset-sync.yml` is a read-only provider-readback workflow;
- historical ruleset safety audits remain evidence of prior decisions but no longer define current policy.

R2-02 reopens only on a new Owner decision or when the accepted live provider state is no longer the intended operational state.

## S1-R2-03 — Node control-plane supersession

**Current state:** OPEN / PARTIAL CONVERGENCE

Docker runtime is already Node `24.20.0`; `.nvmrc`, package engine policy and remaining control-plane references are not yet fully converged. Exit requires consistent approved Node 24.20.0 policy and exact-head CI PASS.

## S1-R2-04 — Fatal process handling

**Current state:** OPEN / CONFIRMED

Unhandled exceptions must make readiness unhealthy, stop new work, perform only bounded safe cleanup, exit non-zero and rely on Render supervision. Closure requires negative child-process evidence and post-deploy supervisor recovery evidence.

## S1-R2-05 — Stripe Checkout redirect boundary

**Current state:** OPEN / CONFIRMED

Client-controlled absolute `successUrl` / `cancelUrl` remain outside the accepted architecture. The server must own redirect origins and constrain any destination selection. Open-redirect negative tests remain required.

## S1-R2-06 — Stripe-verified entitlement projection

**Current state:** CONDITIONAL

Only activates if R2-00 proves an authority gap. Browser or redirect state must never become subscription authority; protected entitlement must remain server-/Stripe-verifiable.

## S1-R2-07 — Disaster recovery / RPO / RTO

**Current state:** OPEN / UNVERIFIED

Closure requires business-approved RPO/RTO, recurring encrypted off-site backup, isolated restore, integrity validation and measured actual RPO/RTO. A runbook alone is not recovery evidence.

## S1-R2-08 — Leaked-password protection

**Current state:** OWNER-ACCEPTED / TIER EXCEPTION

The active Supabase Free/Base tier does not provide the desired native leaked-password control. No custom substitute is introduced. Applicable hCaptcha, rate-limit, password-policy and MFA/AAL2 compensating controls remain relevant. Reassess if the active tier or native feature availability changes.

## S1-R2-09 — CSP strict-mode promotion

**Current state:** PARTIAL / REPORT-ONLY

ADR-0040 and GMG-005 remain authoritative:

- `server/securityResponse.ts` is the CSP response authority;
- Production defaults to `report-only`;
- the availability-safe baseline is enforced while the nonce + `strict-dynamic` target is evaluated through Report-Only;
- `unsafe-eval` remains absent from the production target;
- explicit `CSP_MODE=strict` is available only after the protected promotion evidence exists;
- `baseline` remains the availability-recovery mode.

R2-09 remains open until the ADR-0040 observation and compatibility evidence permits a separately reviewed strict promotion.

## S1-R2-10 — Demo/sandbox billing isolation

**Current state:** MERGED / POST-DEPLOY VERIFY PENDING

PR #619 DEV-gates the Stripe simulation path via `import.meta.env.DEV === true`; Production fails closed on missing/placeholder Stripe configuration. This does not close R2-00/R2-06 or R2-05. Post-deploy evidence must confirm the Production bundle/runtime cannot reach the simulated-success path.

## S1-R2-11 — Content-addressed evidence and stale-state automation

**Current state:** MERGED / VERIFY PENDING

The merged implementation exposes machine states `CURRENT`, `STALE`, `CURRENT_AFTER_REFRESH` and `STALE_RETRY_REQUIRED` while retaining trusted-main policy for PR-body baseline refresh. Verification requires observing the trusted refresh/reconciliation behavior on current identities without candidate self-authorization.

## S1-R2-12 — Production/main content drift

**Current state:** VERIFIED / HISTORICAL

Historical drift remains closed. Production, `main` and candidate identities must still be represented independently.

## R2 HARDENED / VERIFIED gate

S1-R2 may report `HARDENED / VERIFIED` only when:

```text
R2-00 authority trace resolved
AND R2-01 historical classification remains accepted
AND R2-02 Owner-accepted live GitHub provider state remains current/readable
AND R2-03 Node control-plane superseded
AND R2-04 fatal process recovery verified
AND R2-05 Stripe redirect boundary closed
AND R2-06 closed or NOT-AUTHORITY evidence accepted
AND R2-07 measured restore drill complete
AND R2-08 Owner tier exception remains valid or native control becomes available
AND R2-09 strict Production CSP verified after a separately approved promotion
AND R2-10 production sandbox isolation verified
AND R2-11 stale-state automation verified
```

## Historical S1 traceability

Historical F-01..F-18 traceability remains in `docs/security/SECURITY_REMEDIATION_BASELINE_2026-08-12.md` and repository history. Historical GitHub ruleset desired-state documents and audits do not override the Owner decision recorded above.

## Verbindlicher PR-Template-Contract

Every PR against `main` must use the complete canonical `.github/pull_request_template.md` contract. Machine-managed Production/Main/Head identity remains authoritative. Human merge remains separate from CI success; agent self-merge remains prohibited.

## Definition of Done

S1 is complete only when the R2 gate above is satisfied, evidence is bound to current identities, no secrets appear in evidence, remediation uses reviewed PRs, and external mutations are separately authorized and read back where applicable.
