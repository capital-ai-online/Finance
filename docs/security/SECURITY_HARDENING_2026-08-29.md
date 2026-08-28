# CAPITAL-AI Security Hardening — 2026-08-29

## Status

**IMPLEMENTED / CORRELATED / OWNER-GATED FOLLOW-UP**

Current synchronized production/main baseline for this work package:
`fd4c33905f45332f6ae11de6b80a6a3c20576c77`.

This document records the code- and document-based execution of the 2026-08-29 security review.
Repository changes, provider-side mutations and already mitigated findings are kept separate.

## 1. Main synchronization and correlation

The security branch was repeatedly correlated as `main` advanced. The current verified baseline is
`main@fd4c33905f45332f6ae11de6b80a6a3c20576c77`, which is also the verified production commit.
The intervening merged PR #593 changes only the Crypto feature-facade/workspace/test scope and has
no file overlap with this Runtime-/Secret-/Recovery package.

The PR branch must remain zero commits behind this baseline before merge. Any later `main` advance
requires a fresh correlation and exact-head validation.

## 2. P1 — Node production runtime

Production was still pinned to Node `24.18.0`. The current Node 24 LTS patch baseline on
2026-08-29 is `24.20.0`.

Implemented:

- builder, `prod-deps` and runner use `node:24.20.0-alpine`;
- all stages use immutable OCI index digest
  `sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf`;
- existing hCaptcha/passkey build inputs stay unchanged;
- existing non-root, read-only artifacts, OpenSSL update, SBOM, health-check and runtime-tool
  pruning stay intact;
- `scripts/security/verifyDockerHardening.mjs` requires 24.20 and rejects the obsolete 24.18
  production base and floating 24.20 tag.

Exact-head CI/security must prove container build, Docker-hardening, SBOM and vulnerability policy.
Render provider mutations are not performed by this branch.

## 3. P1 — Supabase and server-only credential contract

The repository prefers `SUPABASE_SECRET_KEY` over the legacy `SUPABASE_SERVICE_ROLE_KEY`.
Production requires the modern key at boot and the legacy key is retained only as temporary
non-production compatibility.

A correlation review identified an additional resolver weakness: `server/env.ts` previously
allowed generic `VITE_*` fallback in both directions. That meant a client-facing alias such as
`VITE_SUPABASE_SECRET_KEY` could satisfy a server-side lookup when the canonical server variable
was absent.

The resolver is now fail-closed for every key declared in `SECRET_FILE_KEYS`:

- canonical Secret File value has first precedence;
- the exact same-named server environment variable may be used as fallback;
- `VITE_<server-secret>` is never accepted as a substitute;
- requesting `VITE_<server-secret>` never falls back to the unprefixed privileged value;
- no secret value is logged or projected.

This contract covers the production-critical runtime checks for:

- `SUPABASE_SECRET_KEY`;
- `STRIPE_SECRET_KEY`;
- `STRIPE_WEBHOOK_SECRET`;
- `TOTP_ENCRYPTION_KEY`.

`tests/unit/runtimeSecretsSecurity.test.ts` contains negative cases proving that VITE-only aliases
for each of these values force the production boot gate to deny/exit. It also directly verifies
that the environment resolver cannot cross the VITE/server-only namespace boundary in either
direction.

Owner-gated follow-up after an exact-head preflight confirms the modern Supabase secret in Render:

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

`docs/runbooks/DEPLOYMENT_ROLLBACK_UND_BACKUP.md` removes the old unknown-plan placeholders,
requires off-site dump evidence, defines a restore drill, keeps RPO/RTO **UNVERIFIED** until
measured, and uses a branch + PR recovery flow instead of direct pushes to `main`.

## 5. P2 — CSP

The hCaptcha origins and passkey-related frontend changes in the synchronized baseline are
preserved. Production still defaults to `report-only` for the strict nonce policy.

No `strict` promotion is performed because no measured zero-violation production observation
window is available in the current evidence. Promoting without evidence would contradict the
existing ADR-0040 rollout boundary and could reintroduce availability regressions.

Next evidence gate: inspect/collect production CSP violation telemetry; then promote
`CSP_MODE=strict` only after Stripe/Supabase/Consent/hCaptcha paths are demonstrated compatible.

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

The new server-only resolver rule is separate from the Vite package vulnerability: it prevents
configuration namespace aliasing for privileged credentials even if a mistakenly named `VITE_*`
environment variable exists.

## 8. Additional Supabase advisor finding

Supabase Security Advisor reports `auth_leaked_password_protection` as **WARN** because Leaked
Password Protection is disabled. This remains a separate owner-gated provider action; repository
code must not claim that live Auth behavior was changed by this PR.

## 9. Verification and merge gates

Current correlation requirements:

- [x] current production and `main` identified as
  `fd4c33905f45332f6ae11de6b80a6a3c20576c77`;
- [x] PR #593 changed-file scope correlated with no overlap;
- [x] server-only Secret resolver hardened;
- [x] VITE-alias negative tests added;
- [x] operations handoff updated to current production/main baseline;
- [ ] exact-head canonical PR-template/governance validation PASS;
- [ ] exact-head Build & Test PASS;
- [ ] exact-head Docker hardening policy PASS;
- [ ] exact-head hardened-image/SBOM/CVE gate PASS;
- [ ] exact-head GitGuardian secret scan PASS;
- [ ] final zero-behind/current-main ancestry check PASS immediately before merge.

Production/provider mutations remain owner-gated and are not performed by this branch.
