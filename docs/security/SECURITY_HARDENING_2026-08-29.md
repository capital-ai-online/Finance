# CAPITAL-AI Security Hardening — 2026-08-29

## Status

**IMPLEMENTED / CORRELATED / OWNER-GATED FOLLOW-UP**

Final synchronized baseline for this work package: `main@9b2c0205b611e1d9c76e8c25dcc0d45ec1ce6bfa`.

This document records the code- and document-based execution of the 2026-08-29 security review.
Repository changes, provider-side mutations and already mitigated findings are kept separate.

## 1. Main synchronization and correlation

The first work branch was created from `8e6d2b0...`. Before PR creation the mandatory Main checks
detected two subsequent merges:

- PR #589: Auth/Landingpage/hCaptcha/CSP integration;
- PR #590: ruleset-admin Package A hardening.

The security work was therefore rebuilt on the updated main and finally synchronized with
`9b2c020...`. The #589 hCaptcha/passkey Docker inputs are preserved. #590 touches only ruleset
administration files and has no file overlap with this package.

A fresh Main correlation remains mandatory immediately before any Draft/PR creation.

## 2. P1 — Node production runtime

Production was still pinned to Node `24.18.0`. The current Node 24 LTS patch baseline on
2026-08-29 is `24.20.0`.

Implemented:

- builder, `prod-deps` and runner use `node:24.20.0-alpine`;
- all stages use immutable OCI index digest
  `sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf`;
- #589 hCaptcha/passkey build inputs stay unchanged;
- existing non-root, read-only artifacts, OpenSSL update, SBOM, health-check and runtime-tool
  pruning stay intact;
- `scripts/security/verifyDockerHardening.mjs` requires 24.20 and rejects the obsolete 24.18
  production base and floating 24.20 tag.

After PR creation the existing CI/security pipeline must prove exact-head container build,
Docker-hardening, SBOM and vulnerability policy. Render Auto-Deploy is disabled, so this branch
does not mutate Production.

## 3. P1 — Supabase privileged credential contract

The active project exposes a modern publishable key while the legacy anon key remains enabled.
The repository already prefers `SUPABASE_SECRET_KEY` over `SUPABASE_SERVICE_ROLE_KEY`.

Implemented in `server/validateRuntimeSecrets.ts`:

- Production requires `SUPABASE_SECRET_KEY` at boot;
- missing modern privileged key fails closed;
- legacy service-role remains temporary non-production compatibility only;
- no key values are logged;
- no provider credential is revoked by this branch.

Owner-gated follow-up after an exact-head preflight confirms the modern secret in Render:

1. deploy through the normal gated path;
2. verify Auth/IAM, billing and privileged Supabase operations;
3. inventory remaining legacy consumers;
4. only then revoke the legacy privileged key provider-side;
5. retire legacy anon only after all browser/Auth consumers are confirmed on publishable keys.

## 4. P1 — Backup / PITR / RPO / RTO

Read-only verification on 2026-08-29 established:

- organization `AIFINANCIAL`: **Free** plan;
- project `ryzywoktpmyhwzxmstyu`: `ACTIVE_HEALTHY`, `eu-west-1`, Postgres 17;
- current Supabase docs provide automatic daily backups for Pro/Team/Enterprise and recommend
  self-managed exports for Free projects;
- PITR is not a Free-plan recovery baseline.

`docs/runbooks/DEPLOYMENT_ROLLBACK_UND_BACKUP.md` now removes the old unknown-plan placeholders,
requires off-site dump evidence, defines a restore drill, keeps RPO/RTO **UNVERIFIED** until
measured, and replaces the historical direct-push-to-main revert example with a branch + PR flow.

## 5. P2 — CSP

PR #589 is part of the synchronized baseline and its hCaptcha origins are preserved. Production
still defaults to `report-only` for the strict nonce policy.

No `strict` promotion is performed because no measured zero-violation production observation
window is available in the current evidence. Promoting without evidence would contradict the
existing ADR-0040 rollout boundary and could reintroduce availability regressions.

Next evidence gate: inspect/collect production CSP violation telemetry on the post-#589 baseline;
then promote `CSP_MODE=strict` only after Stripe/Supabase/Consent/hCaptcha paths are demonstrated
compatible.

## 6. P2 — AAL2 / RLS

No blanket database policy is added. Read-only inspection shows privileged action/security tables
are service-role-only or deny `anon/authenticated`, while `profiles` and `subscriptions` expose
only own-row reads to authenticated clients. RLS is enabled on the inspected public tables.

A database-wide `aal2` predicate would therefore duplicate the server-only trust boundary for
privileged tables. AAL2 remains an application step-up requirement and belongs in RLS only where
an authenticated browser client is intentionally allowed to mutate genuinely AAL2-sensitive data.

## 7. P2 — Vite

Already mitigated: the lockfile resolves Vite `6.4.3`, the patched release for the June 2026
`server.fs.deny` Windows alternate-path issue affecting versions through `6.4.2`. Production also
removes Vite from the runtime image and checks its absence in container CI. No dependency churn is
introduced merely to rewrite the manifest lower bound while the lockfile is already patched.

## 8. Additional Supabase advisor finding

Supabase Security Advisor reports `auth_leaked_password_protection` as **WARN** because Leaked
Password Protection is disabled. This is not silently mutated from a repository-only branch: it
changes live Auth behavior and should be enabled as a separate owner-gated provider action with
password sign-in/reset regression tests.

## 9. Verification and merge gates

Before Draft/PR:

- [ ] re-read current `main` SHA;
- [ ] compare branch with that exact head;
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
