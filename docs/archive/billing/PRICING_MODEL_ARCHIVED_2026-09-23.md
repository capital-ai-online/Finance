# Historical Pricing Model — archived 2026-09-23

**Lifecycle:** HISTORICAL / ARCHIVED / NON-AUTHORIZING  
**Archived from repository baseline:** `main@928431741d23ad5c4ea712f6898ca392cf9852da`  
**Archived by:** Human Owner direction on 2026-09-23  
**Replacement model:** not yet defined

## Purpose

This document preserves the previously presented CAPITAL-AI pricing catalogue as historical evidence. It is not an offer, current price authority, entitlement grant, or authorization to mutate Stripe/provider state.

The active Frontend no longer uses subscription tier as a visibility gate and no longer offers a plan-selection or upgrade checkout entrypoint. Existing server-side subscription, quota, credit, IAM and provider controls remain separate until their canonical owners explicitly migrate or retire them.

## Historical catalogue snapshot

| Tier | Monthly EUR | Yearly EUR |
|---|---:|---:|
| Free | 0.00 | 0.00 |
| Starter | 7.00 | 75.60 |
| Pro | 29.00 | 248.00 |
| Enterprise | 109.00 | 1280.00 |

The values above are preserved from the former `src/features/billing/billingContract.ts` presentation contract at the archived baseline. They MUST NOT be presented as a currently purchasable offer after this archive point.

## Historical entitlement projection

| Capability | Free | Starter | Pro | Enterprise |
|---|---|---|---|---|
| Devices | 1 | 2 | 2 | 5 |
| Verified screening | 3 / 5 days | 5 / day | 20 / day | unlimited |
| Backtest | no | no | yes | yes |
| Monte Carlo | none | none | 1 / day | unlimited |
| Full AI analysis | preview only | 1 / day | unlimited | unlimited |
| Realtime AI newsfeed | no | no | yes | yes |
| Buffett Value Check | 1 / 3 days | 1 / 3 days | unlimited | unlimited |
| PDF / compliance export | no | no | no | yes |

This entitlement matrix is retained only to explain historical backend/security behavior. It remains subject to canonical server-side contracts until those owners perform an owner-correct migration.

## Archive boundary

Archived/deactivated in the Frontend:

- plan/pricing cards and active price comparison;
- upgrade / premium call-to-action;
- subscription-tier-based component visibility;
- plan-selection checkout presentation;
- PDF-credit purchase entrypoint;
- browser tier mutation from historical checkout return query parameters.

Not deleted or silently redefined:

- existing customer subscription readback;
- customer portal / cancellation lifecycle;
- Stripe provider objects, webhook history and billing evidence;
- server-side identity, quotas, credits and protected-capability enforcement;
- legal rights for already-existing contracts;
- accepted ADR/ESS/security/compliance constraints.

## Owner-correct follow-ups

- CAPITAL-AI-OPS: server-side prevention of new Checkout Session creation for the archived catalogue — issue #1326.
- CAPITAL-AI-COMP: reconcile AGB/FAQ/legal pricing language while preserving existing-contract rights — issue #1327.

A future pricing model requires a new explicit lifecycle decision and fresh CURRENT_MAIN correlation. This archive must not be repurposed as the new model.
