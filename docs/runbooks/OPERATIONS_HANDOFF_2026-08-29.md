# CAPITAL-AI Operations Handoff — 2026-08-29

Status: PARTIAL / ACTION REQUIRED  
Last synchronized: 2026-08-30  
Repository baseline: `main@5e4da8caba1aa7bae70abe5bf021a857ccef2f84`  
Last verified production deployment: `b8c4757aaa62a2a63745e2f86a777630968f4f5d`  
Active governance branch: `security/r2-02-live-ruleset-authority-20260830`  
Canonical Security authority: `docs/roadmaps/S1_SECURITY_HARDENING_ROADMAP.md`

## Purpose and authority boundary

This runbook consolidates operational/provider/deployment evidence for S1. It does not replace the canonical S1 roadmap and does not create a second Security authority.

## 1. Repository and production identity

### GitHub

PR #619 is merged. Current repository `main` is:

```text
5e4da8caba1aa7bae70abe5bf021a857ccef2f84
```

The last separately verified Render Production identity remains:

```text
b8c4757aaa62a2a63745e2f86a777630968f4f5d
```

Until a newer Render deployment is read back, merge identity must not be presented as deployment evidence.

### Supabase

Last verified project facts remain:

- project: `AIFINANCIAL`;
- ref: `ryzywoktpmyhwzxmstyu`;
- region: `eu-west-1`;
- status: `ACTIVE_HEALTHY`;
- PostgreSQL engine 17.

These facts do not prove backup retention or Auth configuration changes.

## 2. Owner decision — S1-R2-08

Status: **OWNER-ACCEPTED / TIER EXCEPTION**.

Native leaked-password protection is unavailable on the active Supabase Free/Base tier. No custom leak-password database/service is introduced solely to emulate the paid capability. Existing compensating controls remain relevant and the decision must be revisited if tier capability changes.

## 3. GitHub Default-Branch Enforcement — S1-R2-02

Status: **OWNER-ACCEPTED / VERIFIED LIVE STATE**.

### Verified sequence

1. PR #619 merged to trusted `main@5ec3a4179f1a7e01295abf038f6767a581abdf68`.
2. `ruleset-sync` Run #8 (`33329575562`) ran successfully in `mode=plan` on that exact `main`.
3. Provider readback confirmed the active `main-production-protection` ruleset.
4. Owner then explicitly withdrew the repository-owned canonical desired rules and instructed that the current live rules remain in force.

### Accepted live provider state

The active GitHub ruleset currently has:

- enforcement `active`;
- empty bypass actors and no current-user bypass;
- non-fast-forward protection;
- pull-request rule with zero required approvals in the current single-owner topology;
- no required CODEOWNER review;
- no required review-thread resolution;
- extra approval for unattributed changes enabled;
- merge methods `merge`, `squash`, `rebase`;
- advisory `code_quality` warnings;
- strict/up-to-date required status checks for:
  - `build-and-test` (`integration_id=15368`);
  - `PR Governance (Kosten / Workflow / Vorlage)` (`integration_id=15368`);
  - `Hardened image / HIGH+CRITICAL CVE gate` (`integration_id=15368`);
  - `GitGuardian Security Checks` (`integration_id=46505`).

Deletion protection, required linear history, CODEOWNER review and review-thread resolution are not active rules. Repository merge commits remain allowed and web commit signoff is not required. These properties are now part of the Owner-accepted current provider state rather than pending desired-state drift.

### Repository control-plane change

The repository must no longer mutate GitHub toward a separate canonical Sollzustand:

- `.github/policies/main-production-protection.expected.json` is retired/deleted;
- `ruleset-sync` is read-only provider readback;
- `package_a` and `full` are removed;
- `scripts/security/rulesetAdminEnvironment.mjs` is removed;
- no ruleset/repository write request is implemented by the remaining readback script.

Historical ruleset audit/evidence files remain historical records only. They do not authorize re-creating the retired desired-state reconciliation.

No GitHub ruleset mutation remains pending for R2-02. A future change requires a new explicit Owner decision and the normal reviewed PR/provider-verification path.

## 4. Liveness, readiness and fatal recovery — S1-R2-04

Status: **OPEN / CONFIRMED**.

Current endpoint semantics remain:

| Endpoint | Purpose | Semantics |
|---|---|---|
| `/healthz` | Render liveness | running process |
| `/healthz/readiness` | non-sensitive readiness projection | may report degradation |
| `/readyz` | strict dependency/business readiness | `200` ready, `503` not-ready |

Fatal recovery still requires fail-fast, bounded cleanup, non-zero exit and Render supervisor evidence.

## 5. Stripe Operations Boundary

### R2-05 — Redirect boundary

Status: **OPEN / CONFIRMED**.

Client-controlled absolute Checkout redirect URLs remain a separate finding. The server must own redirect origins and constrain destination selection.

### R2-10 — Development sandbox isolation

Status: **MERGED / POST-DEPLOY VERIFY PENDING**.

PR #619 gates simulated Stripe success behind `import.meta.env.DEV === true`. Production fails closed on missing/placeholder publishable configuration. Post-deploy evidence must verify the Production bundle/runtime cannot reach the development simulation path.

R2-00/R2-06 remain separate authority questions.

## 6. CSP Operations — S1-R2-09

Status: **PARTIAL / REPORT-ONLY**.

ADR-0040 and GMG-005 remain authoritative:

- Production defaults to `report-only`;
- availability-safe baseline is enforced;
- nonce + `strict-dynamic` target is evaluated through Report-Only;
- `unsafe-eval` remains absent from the production target;
- `CSP_MODE=strict` requires separate protected promotion evidence;
- `baseline` remains the availability-recovery path.

No automatic Strict promotion is authorized by PR #619 or the R2-02 decision.

## 7. Backup / RPO / RTO — S1-R2-07

Status: **OPEN / UNVERIFIED**.

Still required:

- business-approved RPO/RTO;
- recurring encrypted off-site backup evidence;
- measured backup age/RPO;
- isolated restore drill;
- measured end-to-end RTO and integrity verification.

## 8. Evidence identity / staleness — S1-R2-11

Status: **MERGED / VERIFY PENDING**.

The merged implementation retains trusted-main PR baseline generation and exposes explicit states:

| State | Meaning |
|---|---|
| `CURRENT` | body already binds current Production/Main/Head identity |
| `STALE` | current identity differs from body baseline |
| `CURRENT_AFTER_REFRESH` | trusted refresh corrected a stale baseline |
| `STALE_RETRY_REQUIRED` | identity changed during preflight/write; unsafe write denied |

This mechanism remains independent of the retired GitHub ruleset desired-state policy.

## 9. Render secret boundary

Canonical server-only authority remains:

- `finance-secrets.env`;
- `scripts/security/secretFileManifest.ts`;
- `server/env.ts`;
- `server/validateRuntimeSecrets.ts`;
- `scripts/automation/verifyDeploymentReadiness.ts`.

No secret values are included in repository evidence.

## 10. Rollback and future changes

- **Code:** Human-reviewed PR/revert path; no direct agent write to `main`.
- **GitHub ruleset:** current live provider state remains authoritative. No automatic Soll-reconciliation exists. Any future policy change requires new Owner instruction plus provider readback.
- **CSP:** default remains `report-only`; `baseline` is the existing availability recovery mode.
- **Billing sandbox:** Production must remain fail-closed; remediation/revert uses the normal PR path.
- **Evidence refresh:** identity races remain fail-closed via `STALE_RETRY_REQUIRED`.

## 11. Overall handoff

R2-02 is now an explicit Owner-accepted live-provider-state decision, not a pending `mode=full` task. R2-08 remains a tier exception. R2-09 remains `PARTIAL / REPORT-ONLY`; R2-10 and R2-11 are merged but still need their applicable runtime/operational verification. R2-00 and R2-03 through R2-07 remain open/conditional and continue to block the global `HARDENED / VERIFIED` status.
