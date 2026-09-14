# S1-R2-06 — Independent Entitlement Verification — 2026-09-14

**Project:** `CAPITAL-AI-SEC`  
**Role:** independent Security verification / bounded remediation evidence  
**Repository:** `capital-ai-online/Finance`  
**Correlation baseline:** `main@627f46b8164a13f8d635d92dc1a9c6a87fae741b`  
**Working branch:** `agent/security-entitlement-verification-20260914`  
**Finding:** `S1-R2-06 — entitlement authority`  
**Authority:** `/AGENTS.md`, `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION`, `CTRL-SEC-BOUNDED-REMEDIATION-001`, `ADR-0034`, `ESS-0006`

## 1. Verification question

Can browser-controlled or presentation-only state independently grant a protected paid capability, or does each protected execution path resolve authorization from a verified principal plus authoritative server/provider entitlement, quota or ledger state?

Security verification treats implementation and verification as separate steps. `EVIDENCE_READY != VERIFIED`, and repository evidence does not by itself prove post-deployment Production behavior.

## 2. Current-main correlation

Current `main` was re-read immediately before the bounded remediation. The only open Pull Request was PR #918, `[CAPITAL-AI-SEC] [GitHub UI] Route-Guard-Bypass für Stripe und Screening härten`, exact head `bdec6d806f0c8539f670eb0030122e0d889f38b8`.

Parallel Frontend branches `agent/frontend-universe-branding-kit-20260914` and `agent/frontend-universe-presentation-20260914` were correlated against the same main and do not modify `src/components/BuffetValueCheck.tsx` or `tests/unit/buffetValueCheck.test.ts`. No concurrent FinTech branch was found for this bounded slice.

## 3. PR #918 independent branch verification

The route-guard remediation in PR #918 was reviewed separately from its implementation:

- productive route composition installs `verifiedScreeningPathGate` before protected scoring routers;
- the Stripe return-url guard remains mounted before `stripeRouter`;
- the PR regression suite exercises Express route variants including case and trailing-slash aliases with positive and negative expectations;
- exact-head hosted runs for PR CI, Governance and Container Security concluded successfully;
- the duplicate Governance run cancelled by workflow concurrency is not interpreted as a technical failure;
- no post-merge/post-deployment Production verification exists because PR #918 is still open.

**Disposition:** `VERIFIED_BRANCH / PRODUCTION_VERIFY_OPEN / NOT_CLOSED`.

Current main still contains case-sensitive `VERIFIED_SCREENING_PATH_PATTERNS`; therefore the alias-bypass remediation is not yet main-state evidence until Human/CODEOWNER merge.

## 4. Seven-capability S1-R2-06 inventory

| Capability | Current disposition | Security observation |
|---|---|---|
| `verified_screening` | `MAIN_REMEDIATION_OPEN / PR918_VERIFIED_BRANCH` | Server quota authority exists, but current-main path matching still permits the confirmed alias class; PR #918 closes that branch-level gap. |
| `backtest` | `CONFIRMED_GAP / FIN-SEC-03_OPEN` | ADR-0034 classifies Backtest as Pro/Enterprise, while the productive compatibility history path and client execution are not bound to a server-authoritative paid-capability grant. |
| `monte_carlo` | `CONFIRMED_GAP / FIN-SEC-03_OPEN` | Monte Carlo remains executable client-side; the automatic path invokes local simulation without a server entitlement decision. |
| `full_ai_analysis` | `CONFIRMED_BINDING_GAP / FIN-SEC-03_OPEN` | The plan contract defines the capability but no productive executor binding was identified that consumes the authoritative entitlement contract. |
| `realtime_ai_newsfeed` | `REPOSITORY_ACCESS_BOUNDARY_VERIFIED / PRODUCTION_VERIFY_OPEN` | Parent `/api/news` mount resolves verified identity and server subscription state; Free/Starter deny, Pro/Enterprise allow, forged browser tier is ignored, authority lookup failure denies with 503. |
| `buffett_value_check` | `SERVER_AUTHORITY_PRESENT / CONSUMER_BEARER_GAP_REMEDIATED_BRANCH` | Server authorization already requires verified identity and server quota state. Current-main consumer used naked `fetch()` and therefore omitted the bearer. This branch changes only that transport to the existing rotation-aware `authFetch()` contract. |
| `pdf_compliance_export` | `REPOSITORY_ACCESS_BOUNDARY_VERIFIED / PRODUCTION_VERIFY_OPEN` | Credit readback and consumption use `authFetch`; missing/unverified server ledger state remains fail-closed. |

## 5. Bounded Buffett remediation

The server-side Buffett entitlement contract is not changed. The remediation only binds the existing browser consumer to the existing authenticated transport:

```text
BuffetValueCheck
→ authFetch('/api/entitlements/warren-buffett/authorize')
→ live Supabase SDK bearer / bounded refresh retry
→ resolveVerifiedIdentity(req)
→ getSubscription(identity.userId)
→ enforceBuffettValueCheckQuota(req, symbol)
→ ALLOW/DENY
→ only after ALLOW: verified-display hydration
```

This preserves ADR-0034 business semantics, stock-only eligibility, Free/Starter quota behavior and Pro/Enterprise full-access behavior. It does not create a new entitlement authority, modify plan limits, change billing, mutate Supabase/Stripe, or alter the downstream Verified Asset Display contract.

The focused regression contract now requires:

- `BuffetValueCheck.tsx` imports the existing `authFetch` helper;
- the protected authorize endpoint is called through `authFetch`;
- a naked `fetch('/api/entitlements/warren-buffett/authorize'...)` call is absent;
- authorization still occurs before verified-display hydration.

## 6. Ownership boundary

The Buffett consumer is a Frontend surface, while the protected financial-domain entitlement semantics remain FINTECH/PVC-15 under `FIN-SEC-03`. `CAPITAL-AI-SEC` performs only the cleanly separable bearer-transport hardening permitted by `CTRL-SEC-BOUNDED-REMEDIATION-001`.

No Backtest, Monte Carlo or `full_ai_analysis` architecture/business remediation is implemented in this Security branch. Those remain with `CAPITAL-AI-FINTECH / PVC-15`.

## 7. Validation truth

Executed/read back for this evidence:

- current-main SHA and complete `/AGENTS.md` correlation;
- canonical project/PVC mapping and Security project/Roadmap correlation;
- ADR-0034 and current entitlement implementation inspection;
- current open-PR and relevant parallel-branch correlation;
- PR #918 exact-head hosted run readback from the existing PR;
- source-level readback of Buffett server authority, `authFetch`, consumer path and focused test contract;
- branch diff correlation after materialization is required before PR-creation approval.

Not run / not claimed for this new branch:

- local Vitest execution;
- local TypeScript build;
- local production build;
- hosted CI for this branch before PR creation;
- Production runtime verification;
- Stripe/Supabase provider mutation or live entitlement mutation.

`NOT RUN` is not represented as PASS.

## 8. Security disposition

S1-R2-06 remains **`ACTIVE / REMEDIATION REQUIRED`**.

The inventory is independently re-correlated. Repository access boundaries for Newsfeed and PDF are supported by current code/tests; the Buffett consumer bearer gap is bounded and remediated on this branch; verified-screening alias remediation is independently verified on open PR #918 but not yet on main; Backtest, Monte Carlo and `full_ai_analysis` remain open FINTECH/PVC-15 remediation.

No blanket `VERIFIED` or `CLOSED` claim is made for S1-R2-06.
