# OPS-GITHUB-COST-CENTER-MANAGEMENT-01 — Intelligent Cost Management Overview

**Project:** CAPITAL-AI-OPS  
**Primary PVC:** PVC-08 — Production Operations  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Baseline:** `main@4f2c746a20a8683d784a1cbe54c763a64ddd1da3`  
**Owner direction:** 2026-09-21 — intelligente Kostenmanagement-Übersicht im GitHub Cost Center beginnen  
**Mutation boundary:** READ-ONLY in this slice

## Goal

Create a deterministic management projection over the existing GitHub Enterprise billing reader and bounded Cost Center surface.

The overview must answer:

1. Is the canonical `Enterprise` cost center active and unique?
2. What is the Enterprise gross/discount/net spend?
3. What spend is attributed to the Cost Center?
4. What remains `Enterprise Only` / outside the Cost Center?
5. Which gross usage was fully discounted or included?
6. Which positive net costs exist outside the expected GHEC baseline?
7. Are Security, Actions, AI, storage, Codespaces or unknown costs present?
8. Is a Cost Center budget configured, alerting, and/or hard-stop capable?
9. What is the next bounded Owner action?

## Owner cost policy

- Expected baseline: GitHub Enterprise Cloud (GHEC) license.
- Included/discounted Actions usage with `netAmount=0`: observable, not an alert cost.
- Additional monthly cost target: **5 EUR**.
- Provider amounts are not converted to EUR until the provider response exposes reliable currency evidence.
- No budget is created or modified in this slice.

## Cost Center interpretation

GitHub Cost Centers allocate usage/spend to resources such as organizations, repositories, users and enterprise teams. Usage not assigned to a Cost Center is treated as Enterprise-level usage. The overview therefore exposes `enterpriseOnlyNet = enterpriseNet - costCenterNet` as an allocation-control indicator, not as an additional bill.

## Decision states

- `SETUP_REQUIRED`
- `BUDGET_CONFIGURATION_REQUIRED`
- `COST_REVIEW_REQUIRED`
- `ADDITIONAL_SPEND_OBSERVED`
- `CONTROLLED`

## Fail-closed rules

- Multiple active canonical Cost Centers -> manual reconciliation.
- Deleted canonical Cost Center without active replacement -> manual reconciliation.
- Positive unknown SKU -> P0 classification review.
- Positive Security cost -> P0 origin trace.
- Active Cost Center with Enterprise spend but zero Cost Center spend -> resource assignment review.
- No Cost Center budget -> Owner-visible configuration gap.
- No provider mutation is inferred from recommendations.

## Next protected slices

Only after separate Owner authorization:

1. verify or create the canonical `Enterprise` Cost Center using the existing bounded writer;
2. assign the intended Organization / repositories / user resources;
3. introduce a separate bounded Budget Writer;
4. materialize the Owner's 5 EUR additional-spend policy in provider-native budgets where product semantics permit it;
5. retain SMTP Cost Watch as independent anomaly notification.
