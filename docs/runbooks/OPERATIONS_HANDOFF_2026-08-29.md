# CAPITAL-AI Operations Handoff — 2026-08-29

Status: PARTIAL / ACTION REQUIRED  
Last synchronized: 2026-08-30  
Repository baseline: `main@e311c30d18951785a68154d994a403799819c194`  
Last machine-bound production deployment: `e311c30d18951785a68154d994a403799819c194`  
Active security branch: `security/s1-r2-00-entitlement-authority-20260830`  
Canonical Security authority: `docs/roadmaps/S1_SECURITY_HARDENING_ROADMAP.md`

## Purpose and authority boundary

This runbook consolidates operational/provider/deployment evidence for S1. It does not replace the canonical S1 roadmap and does not create a second Security authority.

## 1. Repository and production identity

### GitHub / Production

The current R2-00 source baseline is:

```text
main = e311c30d18951785a68154d994a403799819c194
```

The current machine-managed Production/Main baseline used by the repository workflow also binds Production to `e311c30d18951785a68154d994a403799819c194`. R2-00 performs no Render mutation; production identity is used only as correlation evidence.

### Supabase

Read-only provider inspection for R2-00 was performed against:

- project: `AIFINANCIAL`;
- ref: `ryzywoktpmyhwzxmstyu`;
- region: `eu-west-1`;
- status previously verified `ACTIVE_HEALTHY`;
- PostgreSQL engine 17.

No schema, RLS, Auth or data mutation was performed for R2-00.

## 2. Entitlement Authority — S1-R2-00

Status: **CANDIDATE / NOT AUTHORITY — PR VERIFY PENDING**.  
Evidence: `docs/evidence/security/S1_R2_00_ENTITLEMENT_AUTHORITY_TRACE_2026-08-30.md`.

### Production reachability result

The traced production authority chain is:

```text
Supabase verified identity
        ↓
server getSubscription(user_id)
        ↓
public.subscriptions
        ↑
Stripe provider synchronization
        ↓
stripe.subscriptions
        ↓
sync_stripe_subscription_to_public()
```

Browser/session `subscriptionTier` is a presentation projection, not a protected server authority.

Verified findings:

- Stripe simulated success in `Checkout.tsx` is gated by `import.meta.env.DEV === true`; missing/placeholder Stripe configuration in Production fails closed.
- Session bootstrap reads the tier through authenticated `/api/stripe/user-subscription`; server identity comes from the bearer token, not the query `userId`.
- Buffett and screening quota enforcement resolve `resolveVerifiedIdentity(req)` and derive tier from `getSubscription(identity.userId)`.
- PDF-credit Enterprise decisions use the same verified-identity/server-subscription path.
- Checkout selects Stripe Price IDs from server configuration after an allowlisted plan request and never accepts a Price ID or authoritative user ID from the request body.
- Express webhook subscription-tier writes have been retired; it handles application side effects only.
- `public.subscriptions` has RLS enabled. `authenticated` has only an own-row SELECT policy; no normal browser INSERT/UPDATE/DELETE policy exists.
- `stripe.subscriptions` is not exposed to `anon`/`authenticated` roles.
- the live Stripe→public synchronization trigger is active and uses a `SECURITY DEFINER` function that resolves the provider customer/user, refuses an unknown-price guessed paid tier, demotes inactive subscriptions to `Free`, and upserts by `user_id`.
- the historical privileged `saveSubscription()` helper remains defined in `server/db.ts`, but no production source call site invokes it. The R2-00 regression contract fails if such a call site is introduced.

### Operational classification

R2-00 is therefore classified as **`NOT AUTHORITY` candidate**. Final roadmap closure requires exact-head CI/Governance PASS and Human merge of the evidence/regression contract.

S1-R2-06 is **not activated** by this result. It must reopen if browser/request tier data becomes able to write subscription state or directly grant protected server capability.

No Stripe or Supabase provider mutation is required for this classification.

## 3. Owner decision — S1-R2-08

Status: **OWNER-ACCEPTED / TIER EXCEPTION**.

Native leaked-password protection is unavailable on the active Supabase Free/Base tier. No custom leak-password database/service is introduced solely to emulate the paid capability. Existing compensating controls remain relevant and the decision must be revisited if tier capability changes.

## 4. GitHub Default-Branch Enforcement — S1-R2-02

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

Deletion protection, required linear history, CODEOWNER review and review-thread resolution are not active rules. Repository merge commits remain allowed and web commit signoff is not required. These properties are part of the Owner-accepted current provider state rather than pending desired-state drift.

### Repository control-plane change

The repository no longer mutates GitHub toward a separate canonical Sollzustand:

- `.github/policies/main-production-protection.expected.json` is retired/deleted;
- `ruleset-sync` is read-only provider readback;
- `package_a` and `full` are removed;
- `scripts/security/rulesetAdminEnvironment.mjs` is removed;
- no ruleset/repository write request is implemented by the remaining readback script.

Historical ruleset audit/evidence files remain historical records only. Any future provider-policy change requires a new explicit Owner decision and normal reviewed verification.

## 5. Liveness, readiness and fatal recovery — S1-R2-04

Status: **OPEN / CONFIRMED**.

Current endpoint semantics remain:

| Endpoint | Purpose | Semantics |
|---|---|---|
| `/healthz` | Render liveness | running process |
| `/healthz/readiness` | non-sensitive readiness projection | may report degradation |
| `/readyz` | strict dependency/business readiness | `200` ready, `503` not-ready |

Fatal recovery still requires fail-fast, bounded cleanup, non-zero exit and Render supervisor evidence.

## 6. Stripe Operations Boundary

### R2-05 — Redirect boundary

Status: **OPEN / CONFIRMED**.

Client-controlled absolute Checkout redirect URLs remain a separate finding. The server must own redirect origins and constrain destination selection.

### R2-10 — Development sandbox isolation

Status: **MERGED / POST-DEPLOY VERIFY PENDING**.

PR #619 gates simulated Stripe success behind `import.meta.env.DEV === true`. Production fails closed on missing/placeholder publishable configuration. R2-00 statically proves that this simulation is not entitlement authority; R2-10 still requires its separate Production runtime/bundle verification.

## 7. CSP Operations — S1-R2-09

Status: **PARTIAL / REPORT-ONLY**.

ADR-0040 and GMG-005 remain authoritative:

- Production defaults to `report-only`;
- availability-safe baseline is enforced;
- nonce + `strict-dynamic` target is evaluated through Report-Only;
- `unsafe-eval` remains absent from the production target;
- `CSP_MODE=strict` requires separate protected promotion evidence;
- `baseline` remains the availability-recovery path.

No automatic Strict promotion is authorized.

## 8. Backup / RPO / RTO — S1-R2-07

Status: **OPEN / UNVERIFIED**.

Still required:

- business-approved RPO/RTO;
- recurring encrypted off-site backup evidence;
- measured backup age/RPO;
- isolated restore drill;
- measured end-to-end RTO and integrity verification.

## 9. Evidence identity / staleness — S1-R2-11

Status: **MERGED / VERIFY PENDING**.

The merged implementation retains trusted-main PR baseline generation and exposes explicit states:

| State | Meaning |
|---|---|
| `CURRENT` | body already binds current Production/Main/Head identity |
| `STALE` | current identity differs from body baseline |
| `CURRENT_AFTER_REFRESH` | trusted refresh corrected a stale baseline |
| `STALE_RETRY_REQUIRED` | identity changed during preflight/write; unsafe write denied |

## 10. Render secret boundary

Canonical server-only authority remains:

- `finance-secrets.env`;
- `scripts/security/secretFileManifest.ts`;
- `server/env.ts`;
- `server/validateRuntimeSecrets.ts`;
- `scripts/automation/verifyDeploymentReadiness.ts`.

No secret values are included in repository evidence.

## 11. Rollback and future changes

- **Code/Evidence:** Human-reviewed PR/revert path; no direct agent write to `main`.
- **R2-00:** any new browser-reachable subscription writer, browser write RLS policy, protected client-tier decision or non-Stripe-verifiable production mutation path reopens the finding and activates R2-06 review.
- **GitHub ruleset:** current live provider state remains authoritative; no automatic Soll-reconciliation exists.
- **CSP:** default remains `report-only`; `baseline` is the existing availability recovery mode.
- **Billing sandbox:** Production must remain fail-closed.
- **Evidence refresh:** identity races remain fail-closed via `STALE_RETRY_REQUIRED`.

## 12. Overall handoff

R2-00 is now a **`NOT AUTHORITY` candidate** backed by source reachability, live read-only Supabase RLS/trigger evidence and a regression contract; Human merge is still required before final closure. R2-06 is not activated. R2-02 is an Owner-accepted live-provider-state decision. R2-08 remains a tier exception. R2-09 remains `PARTIAL / REPORT-ONLY`; R2-10 and R2-11 still need their applicable runtime/operational verification. After R2-00 validation/merge, **R2-03 is the next active implementation control** in the canonical sequence.
