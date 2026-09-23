# COMP-ISSUE-1327 — Archived Pricing Legal Convergence

**Canonical identity:** `COMP-ISSUE-1327-PRICING-ARCHIVE-LEGAL-CONVERGENCE-20260923`  
**Project:** `CAPITAL-AI-COMP`  
**Relationship:** `CROSS_CUTTING / NO_PRODUCTIVE_PVC`  
**Source issue:** `#1327`  
**Baseline:** `main@5acdac23acce3999394ea05949fc9cd2479ffc63`  
**Status:** `FE_1325_TERMINAL / SYNCED_TO_CURRENT_MAIN / VALIDATION_PENDING / HUMAN_MERGE_REQUIRED`

## Objective

Remove the stale representation of the historical Starter/Pro/Enterprise catalogue as a currently orderable public offer while preserving existing-contract and statutory consumer-rights language.

## Scope

- replace the active price table in the public AGB with an archived-catalogue lifecycle notice;
- converge the public billing FAQ to the same lifecycle;
- publish a new terms document generation `2026-09-23`;
- retain existing-customer Stripe portal, cancellation, withdrawal and consumer-rights wording;
- do not define a replacement pricing model.

## Dependency

FE PR #1325 is Human-merged on `main@5acdac23acce3999394ea05949fc9cd2479ffc63`. This Compliance slice is freshly synchronized on top of that generation and changes only the terms-version fields in `src/features/billing/billingContract.ts`; the merged `PRODUCT_ACCESS_POLICY` and archived Frontend lifecycle remain preserved.

## Acceptance criteria

1. No current AGB table advertises Starter/Pro/Enterprise prices as newly orderable.
2. FAQ truthfully states that the previous catalogue is archived.
3. Existing-contract prices/conditions and statutory cancellation/withdrawal/consumer rights remain explicit.
4. Historical catalogue provenance remains preserved by the FE archive; this slice does not delete it.
5. `TERMS_VERSION` / effective date identify the new published document generation.
6. Exact-head checks pass after #1325 overlap resolution.
7. Human/CODEOWNER merge remains required.

## Exit evidence

After #1325 terminalization and fresh current-main synchronization, the exact COMP PR head must pass Governance, CI and applicable Security gates. No legal sufficiency beyond the stated factual lifecycle is inferred from engineering checks.
