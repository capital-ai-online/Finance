# FE-PRICING-ARCHIVE-OPEN-VISIBILITY-20260923

**Project:** CAPITAL-AI-FE  
**Project relationship:** cross-cutting presentation layer; no productive PVC ownership  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Execution base:** `main@928431741d23ad5c4ea712f6898ca392cf9852da`  
**Status:** IMPLEMENTATION / HUMAN-CODEOWNER-MERGE REQUIRED

## Owner direction

Deactivate and archive the current pricing model. A later pricing model will be designed separately. All product components must be visible independently of subscription tier.

## Scope

1. Archive the former pricing catalogue as historical, non-authorizing evidence.
2. Replace the active subscription/pricing surface with an archive notice.
3. Remove plan upgrade/premium calls-to-action and tier-based presentation gates.
4. Keep feature components visible across subscription tiers.
5. Remove Frontend checkout entrypoints, including legacy PDF-credit purchase UI.
6. Ensure historical checkout return query parameters cannot mutate browser tier state.
7. Preserve authenticated existing-account subscription readback and existing-customer management/cancellation paths.
8. Preserve server-side security, provider, quota and credit boundaries without treating UI visibility as authorization.

## Authority / ownership boundary

CAPITAL-AI-FE owns the presentation changes above. It does not own productive Stripe/provider mutation, backend billing lifecycle policy, legal/compliance text authority, entitlement business policy or Production deployment.

Owner-correct handovers:

- **OPS / #1326:** disable creation of new server-side Checkout Sessions while preserving existing customer lifecycle.
- **COMP / #1327:** reconcile legal/AGB/FAQ pricing presentation and existing-contract language.

## Dependencies

- `/AGENTS.md@CURRENT_MAIN`
- `docs/projects/README.md@CURRENT_MAIN`
- `docs/projects/PROJECT_VALUE_CHAIN.md@CURRENT_MAIN`
- `docs/projects/frontend/README.md@CURRENT_MAIN`
- ADR-0034 subject-matter entitlement constraints
- ADR-0045 Stripe event ownership constraints

## Exit evidence

- active pricing screen contains no plan cards, prices or checkout action;
- dashboard/header contains no subscription upgrade CTA;
- Free/guest tier no longer hides components through the removed Dashboard paywall;
- Newsfeed and Heatmap presentation no longer depend on subscription tier;
- Compliance exporter presentation opens for every tier while server authorization remains intact;
- PDF-credit UI cannot create a checkout session;
- old URL checkout return metadata cannot grant a browser tier;
- regression test `pricingArchiveVisibilityPolicy.test.ts` guards the new lifecycle;
- existing account subscription readback remains server-authoritative;
- no server/Stripe/provider mutation is performed by this FE package.

## Acceptance criteria

The Frontend no longer uses the archived subscription model to decide whether a product component is visible. No new pricing/upgrade checkout is reachable from the active Frontend. Existing security and cost controls are not weakened. The former model remains traceable in `docs/archive/billing/`. Human/CODEOWNER merge remains mandatory.
