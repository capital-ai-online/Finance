# CAPITAL-AI — Claude Repository Instructions

## Normative architecture

Claude Code MUST read and obey the repository's existing ESS/ADR architecture before changing protected systems.

For Google Marketing / CookieHub / Analytics / AdSense work, the normative documents are:

- `.ai/skills/ESS-0014-Google-Marketing-MCP-Governance.md`
- `.ai/skills/ESS-0014-Contracts.md`
- `docs/adr/ADR-0035-protected-google-marketing-integration-strict-csp.md`
- `docs/architecture/CAPITAL_AI_GOOGLE_MARKETING_MCP_ARCHITECTURE.md`

Claude is an implementation/MCP host and is **not** an authorization authority.

## Protected-change rule

Claude MUST NOT silently remove, weaken, revert, replace with an older implementation, or bypass any protected Google-Marketing/Consent/Security invariant.

This includes at minimum:

- CookieHub loader and `/cookiehub-init.js`;
- Google Analytics consent bridge;
- AdSense integration;
- CSP per-response nonce / strict-dynamic policy;
- CookieHub CSP endpoints;
- Google Consent Mode mapping;
- OWNER-only IAM / TOTP step-up controls;
- service-account capability/approval controls;
- deployment guard and traceability evidence.

## Required interaction before rollback

If a requested task would revert or materially weaken one of those controls, Claude MUST STOP before applying the destructive change and ask for explicit confirmation.

The question MUST disclose:

1. privacy/consent impact;
2. analytics/measurement impact;
3. ads/monetization impact;
4. CSP/XSS/security impact;
5. compliance/audit/traceability impact;
6. runtime/SEO/AMP impact;
7. exact affected resources and planned diff/fingerprint.

Generic instructions such as `fix it`, `clean up`, `restore the old version`, `revert recent changes`, or `simplify CSP` are not sufficient approval.

## Authorized principals

A protected rollback may be authorized only by:

1. a verified CAPITAL-AI human principal with IAM role `owner` and fresh TOTP step-up; or
2. a verified service account with an active OWNER-delegated exact capability, and for rollback additionally a one-time job-specific OWNER approval artifact.

Claude MUST NOT:

- treat `admin`, `supervisor`, `user`, subscription tiers, repository write access, or model identity as equivalent to CAPITAL-AI OWNER;
- give a service account the human IAM role `owner`;
- let a service account grant, extend, revoke, or alter its own permissions;
- manufacture, infer, reuse, or self-approve a one-time OWNER approval artifact.

## Service-account delegation

Only a verified human OWNER with fresh TOTP step-up may create, change, extend, or revoke service-account capabilities.

Rollback capability does not by itself authorize a rollback; a matching one-time OWNER approval is also required.

## Google MCP separation

Official Google Analytics MCP and Google Ads MCP are treated as read/evidence planes according to their documented capabilities. Do not invent write capabilities.

Provider mutations must go through explicit CAPITAL-AI API adapters behind Policy -> IAM/Grant -> Approval -> Dry-run -> Fingerprint -> Apply -> Verify -> Audit.

## Production service configuration

Do not directly mutate production Supabase, Google provider configuration, Render, Stripe, or other production control planes from a development-only step. Produce the required production handoff/implementation evidence when the established lifecycle requires it.

## Build guard

Do not bypass `scripts/security/verifyGoogleMarketingInvariants.ts` to make a build pass.

If it fails, classify the intended change. A legitimate protected change must follow ESS-0014 and ADR-0035; an accidental regression must restore the invariant.

## CI cost / test-minutes budget policy

CI/CD scheduling and Actions-minutes cost tuning is **not** one of the protected invariants listed under "Protected-change rule" and is **not** subject to the OWNER + fresh-TOTP rollback gate, *provided the change only touches genuinely advisory/non-blocking jobs*. The repository owner may adjust that kind of cost/scheduling policy (trigger conditions, matrix size, concurrency, which non-blocking jobs run on which event) directly via a normal commit to workflow files and this document, without the disclosure-and-approval flow required for protected rollbacks.

Budget: **3000 GitHub Actions minutes / month** is the accepted baseline spend for CI on this repository.

**Never in scope for this carve-out, regardless of date or minutes spent** — these are required/blocking checks and stay unconditional no matter the budget:

- `ci.yml` → `build-and-test` (runs `npm test`, `npm run build`, the production CSP test, `verifyProductionConfigInvariants.ts`, `predeploy:check`, Docker hardening — see "Build guard" above) and the push-to-main-only jobs `deploy-production`, `verify-deployment-identity`, `supply-chain-attestation` (deployment guard / traceability evidence);
- `pr-governance.yml` → `workflow-security` (`verifyChangedWorkflowSecurity.mjs`, prevents malicious workflow-file changes) and `pr-template-contract` (production-preflight/drift check);
- `google-marketing-protected-change.yml` in its entirety.

**Actually in scope** — implemented as of 2026-08-16: `pr-governance.yml` → `repository-conventions-advisory` (explicitly non-blocking, `continue-on-error: true`, never gated a merge to begin with) is skipped by a `check-cost-gate` job until 2026-09-01, and after that date only while the trailing current-month Actions run time (summed via the GitHub Actions API) is at or above the 3000-minute budget. Because the gated job was never a required check, this budget mechanism reduces spend but does **not** and cannot make merging possible "without the pipeline" — the checks above still run and still gate every merge, on every date, at any spend level.

A gate that skips any of the never-in-scope checks above — however it's timed or conditioned (by date, by a minutes counter, or otherwise) — remains a protected change under the rule above and still requires the disclosure-and-approval flow, not a normal commit.
