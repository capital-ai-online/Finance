# Evidence — SC-1 ClassificationService Table Expansion

**SPT:** SC-MD-SPT-0001  
**Date:** 2026-08-15 / 2026-08-16  
**Branch:** `docs/sc-md-sc1-table-expansion-2026-08-15`

## Change

`ClassificationService.classifyAsset` converted from a short if/else chain (~20 symbols) to a **table-driven** map covering core symbols across:

- Layer 1 / Smart Contract Platform
- Layer 2
- DeFi / Derivatives / Liquid Staking / Restaking
- Oracle
- Stablecoin
- Exchange Token
- AI / Data
- Storage / Compute
- Gaming
- Real World Assets
- Privacy
- Payments
- Bridging / Interoperability
- Meme (legacy set retained)

Unlisted symbols remain **Unknown / tier 3 / confidence 0.6** (fail-closed).

## Non-goals

- No change to `calculateRankScore` / `isTop10Eligible`
- No `scoreImpactEnabled` flip (SC-3 / SC-7 still gated)
- No synthetic price or score invention

## Verification

- Unit: `tests/unit/classificationServiceTable.test.ts`
- Adapter/orchestrator path unchanged (still `ensureCanonical` → merge)

## Authority

SC-MD-SPT-0001 SC-1 · DOCUMENTATION_HYGIENE_POLICY
