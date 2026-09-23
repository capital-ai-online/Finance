# OPS-ISSUE-1326 — Archived Pricing Server Checkout Guard

**Canonical identity:** `OPS-ISSUE-1326-PRICING-ARCHIVE-CHECKOUT-GUARD-20260923`  
**Project:** `CAPITAL-AI-OPS`  
**Primary PVC:** `PVC-08`  
**Source issue:** `#1326`  
**Baseline:** `main@f65753961359d74cdf19de996bace459a98725b9`  
**Status:** `IMPLEMENTED_ON_BRANCH / HUMAN_MERGE_REQUIRED`

## Objective

Enforce the Owner-directed archived pricing lifecycle at the server boundary. No new Stripe Checkout Session may be created while the former catalogue is archived.

## Scope

- place a deterministic archive guard at the beginning of `POST /api/stripe/create-checkout-session`;
- return HTTP `409` with code `PRICING_ARCHIVED_PENDING_REPLACEMENT`;
- cover subscription, founder and legacy PDF-credit checkout through the single canonical checkout route;
- preserve the former catalogue code as historical/provenance-compatible implementation instead of deleting it;
- add regression evidence proving the guard runs before identity resolution, Stripe client access and Checkout Session creation.

## Preserved boundaries

- no Stripe Dashboard/API/provider mutation;
- existing Stripe customer portal remains available for existing customers;
- subscription/readback and PDF-credit ledger routes remain unchanged;
- webhook processing and historical billing evidence remain unchanged;
- no future pricing model is defined;
- no second billing architecture or checkout endpoint is created.

## Acceptance criteria

1. New checkout creation fails closed before any Stripe side effect.
2. Response exposes lifecycle code `PRICING_ARCHIVED_PENDING_REPLACEMENT`.
3. Portal, subscription readback, PDF-credit read/consume and webhook paths remain present.
4. Existing Security identity/price allowlist logic remains in source as historical/re-activation-safe provenance but is unreachable while the archive guard is active.
5. Exact-head CI, Governance, GitGuardian and applicable container/security gates pass.
6. Human/CODEOWNER merge remains the final merge authority.

## Exit evidence

The exact PR head must demonstrate the new guard and unchanged existing-customer lifecycle boundaries. Merge does not mutate Stripe provider objects; it changes only repository/runtime behavior.
