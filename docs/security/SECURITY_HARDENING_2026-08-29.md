# CAPITAL-AI Security Hardening — 2026-08-29

## Status

**IMPLEMENTED / CORRELATED / OWNER-GATED FOLLOW-UP**

Final synchronized baseline for this work package: `main@10c6c6385f32f0af93c53f2e63ce0e80a75b21fb`.

This document records the code- and document-based execution of the 2026-08-29 security review.
Repository changes, provider-side mutations and already mitigated findings are kept separate.

## 1. Main synchronization and correlation

The first work branch was created from `8e6d2b0...`. Before PR creation the mandatory second
Main check detected that PR #589 had meanwhile merged. That branch was therefore not used for a
PR. This replacement branch was created fresh from `10c6c638...`, which already includes the
Auth/Landingpage/hCaptcha/CSP changes from #589.

Open PR #590 changes GitHub ruleset administration and does not overlap the files in this package.
No ruleset mutation is part of this work.

## 2. P1 — Node production runtime

### Finding

Production was still pinned to Node `24.18.0`. The current Node 24 LTS patch baseline on
2026-08-29 is `24.20.0`.

### Implemented

- Builder, `prod-deps` and runner use `node:24.20.0-alpine`.
- All three stages use the same immutable multi-platform OCI index digest:
  `sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf`.
- The hCaptcha/passkey build arguments landed by PR #589 are preserved unchanged.
- Existing non-root, read-only artifact, OpenSSL update, SBOM, health-check and runtime-tool
  pruning controls are preserved.
- `scripts/security/verifyDockerHardening.mjs` now requires the Node 24.20 immutable baseline and
  explicitly rejects the obsolete 24.18 production base.

### Verification gate

After PR creation the existing CI/security pipeline must prove Docker hardening, exact-head build,
runtime SBOM and container vulnerability policy. Render Auto-Deploy is currently disabled, so the
branch itself does not mutate Production.

## 3. P1 — Supabase privileged credential contract

### Evidence

The active project exposes a modern publishable key while the legacy anon key is still enabled.
The repository already prefers `SUPABASE_SECRET_KEY` over the legacy `SUPABASE_SERVICE_ROLE_KEY`.

### Implemented

`server/validateRuntimeSecrets.ts` now requires `SUPABASE_SECRET_KEY` as a production boot
invariant. Production without the modern secret fails closed. The legacy service-role fallback
remains only as a temporary non-production compatibility path.

No key value is logged and this branch performs no provider-side credential revocation.

### Owner-gated follow-up

After an exact-head production preflight confirms the modern secret in the Render secret file:

1. deploy through the normal gated path;
2. verify Auth/IAM, billing and privileged Supabase operations;
3. inventory remaining legacy consumers;
4. only then revoke/disable the legacy privileged key provider-side;
5. retire the legacy anon key only after browser/Auth consumers are confirmed on the publishable
   key contract.

## 4. P1 — Backup / PITR / RPO / RTO

Read-only provider verification on 2026-08-29 established:

- organization `AIFINANCIAL` is on the **Free** plan;
- project `ryzywoktpmyhwzxmstyu` is `ACTIVE_HEALTHY`, region `eu-west-1`, Postgres 17;
- current Supabase documentation provides automatic daily platform backups for Pro/Team/Enterprise
  and recommends self-managed exports for Free projects;
- PITR is not a Free-plan recovery baseline.

`docs/runbooks/DEPLOYMENT_ROLLBACK_UND_BACKUP.md` now records those facts, removes the old unknown
plan placeholders, requires off-site dump evidence, defines a restore-drill checklist, and keeps
RPO/RTO explicitly **UNVERIFIED** until they are measured. It also replaces the historic direct
push-to-main revert example with a branch + PR recovery flow.

## 5. P2 — CSP

PR #589 is now part of the synchronized baseline and its hCaptcha CSP origins are preserved.
Production still defaults to `report-only` for the strict nonce policy.

No strict-mode promotion is performed in this package because the repository/provider evidence
available here does not contain a measured zero-violation observation window. Promoting without
that evidence would contradict ADR-0040 and could recreate the blank-page failure the rollout mode
was designed to prevent.

Required next evidence step: collect/inspect production CSP violation telemetry against this exact
post-#589 baseline, then promote `CSP_MODE=strict` only after required Stripe/Supabase/Consent/
hCaptcha origins are demonstrated compatible.

## 6. P2 — AAL2 / RLS

**No blanket database policy added.** Read-only database inspection shows:

- privileged action/security tables are service-role-only or deny `anon/authenticated`;
- `profiles` only permits an authenticated user to select its own row;
- `subscriptions` only permits an authenticated user to select its own subscription;
- RLS is enabled on the inspected public tables.

A database-wide `aal2` predicate would therefore duplicate/compete with the server-only trust
boundary for the privileged tables. AAL2 remains required at application step-up boundaries and
should only enter RLS where an authenticated browser client is intentionally allowed to mutate
AAL2-sensitive data.

## 7. P2 — Vite

**Already mitigated by the synchronized lockfile/runtime architecture.** The lockfile resolves Vite
`6.4.3`, the patched release for the June 2026 `server.fs.deny` Windows alternate-path advisory
that affected versions through `6.4.2`. Production also removes Vite from the final runtime image
and verifies its absence in container CI. No dependency churn is introduced solely to rewrite the
manifest lower bound while the authoritative lock is already patched.

## 8. Additional current Supabase advisor finding

Supabase Security Advisor currently reports `auth_leaked_password_protection` as **WARN** because
Leaked Password Protection is disabled.

This is intentionally not mutated from a repository-only security branch. It changes live Auth
behavior and should be enabled as a separate owner-gated provider action, followed by password
sign-in/reset regression tests.

## 9. Verification and merge gates

Before any Draft/PR:

- [ ] re-read current `main` SHA;
- [ ] compare branch with that exact Main head;
- [ ] re-check open PR file correlations;
- [ ] synchronize again if Main advanced;
- [ ] confirm no unintended Auth/CSP/ruleset changes entered the diff.

After PR creation:

- [ ] canonical PR-template validation;
- [ ] Build & Test;
- [ ] Docker hardening policy;
- [ ] hardened-image/SBOM/CVE gate;
- [ ] runtime-secret policy validation;
- [ ] exact-head validation before merge/deploy.

Production/provider mutations remain owner-gated and are not performed by this branch.
