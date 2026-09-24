# OPS-PROVIDER-COST-WATCH-01 — Render & Stripe Cost-Watch Extension

**Project:** CAPITAL-AI-OPS  
**Primary PVC:** PVC-02 — Controlled Implementation / PVC-08 — Production Operations  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Baseline:** `main@53f1cb04bf20efb2d7a0bd4524dc5fea2be8aa07`  
**Owner direction:** 2026-09-24 — bestehenden GitHub Cost Watch um Render-Kosten und offene Stripe-Abonnements erweitern  
**Mutation boundary:** repository-only; provider reads are read-only; provider credential provisioning remains Human Owner controlled

## Goal

Extend the canonical `.github/workflows/github-cost-watch.yml` without creating a second cost-management plane.

The report must:

1. preserve the existing GitHub Enterprise/Organization/User billing and Actions-minute controls;
2. read the current Render workspace service inventory read-only and project known active compute plans against an explicit public list-price baseline;
3. expose Render Starter build-pipeline allowance semantics without fabricating current usage or remaining minutes;
4. expose the September 2026 Render Workflows `flex` pricing contract separately from build-pipeline minutes;
5. list active Stripe live subscriptions as recurring customer charges and monthly equivalents without customer PII;
6. never add Stripe customer subscription amounts to operating-cost totals;
7. never log or persist provider credentials.

## Current provider evidence

- Render workspace observed through the connected provider: `AICapital`.
- Productive `Finance` service: active web service, legacy `starter` compute plan / `0.5c-512mb`, one instance.
- Render public list price for that compute plan: USD 7/month for a full-month baseline; actual provider billing can be prorated and may include other usage.
- Starter build pipeline allowance belongs to the workspace plan, not the service compute plan: Hobby 500, Pro 1000, Scale 5000 included minutes/month.
- Current build-pipeline usage/remaining minutes are not exposed by the Render public API surface used by this workflow and therefore remain `NOT_OBSERVABLE` until a supported billing-usage source exists.
- Render Workflows now default to `flex`: active CPU USD 0.20/CPU-hour, RAM USD 0.05/GB-hour, maximum USD 0.40/hour at full 1 CPU/4 GB use, plus task-state retention USD 0.25/GB-month.
- Stripe live readback observed three active subscriptions. Their normalized monthly equivalent is an informational customer recurring-charge metric, not an infrastructure cost.

## Credential boundary

The GitHub Actions workflow may consume only:

- `CAPITAL_AI_RENDER_API_KEY` — Render API key stored as a GitHub Actions secret;
- `CAPITAL_AI_RENDER_WORKSPACE_ID` — non-secret GitHub Actions variable;
- `CAPITAL_AI_RENDER_WORKSPACE_PLAN` — optional non-secret `hobby|pro|scale` variable used only to select the included pipeline-minute quota;
- `CAPITAL_AI_STRIPE_BILLING_READ_KEY` — dedicated restricted Stripe live key with read-only access sufficient for subscription inventory.

The existing production `STRIPE_SECRET_KEY` is not imported into GitHub Actions by this package.

## Acceptance criteria

- Provider readers use GET-only requests and return redacted, bounded projections.
- Missing provider credentials produce `NOT_CONFIGURED` rather than leaking values or fabricating PASS.
- Render pipeline current usage remains null when the provider API cannot prove it.
- Render Workflows pricing is shown separately from build pipeline allowance.
- Stripe projection excludes customer names, emails, addresses and payment method data.
- Existing GitHub cost alert and Actions-minute blocker behavior remains unchanged.
- Unit tests cover Render normalization, Stripe monthly-equivalent normalization, workflow credential wiring, and mail projection.
- Human/CODEOWNER merge remains required.
