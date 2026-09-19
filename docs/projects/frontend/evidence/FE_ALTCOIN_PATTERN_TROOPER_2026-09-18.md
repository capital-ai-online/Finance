# Frontend Evidence — Crypto Universe Altcoin Pattern Trooper

**Evidence-ID:** `FE-ALTCOIN-PATTERN-TROOPER-2026-09-18`  
**Date:** 2026-09-18  
**Project / Owner:** `CAPITAL-AI-FE` (cross-cutting presentation)  
**Source domain:** `CAPITAL-AI-FINTECH / PVC-12..PVC-16`  
**Baseline:** `main@cb2063ce7ac738ac0a6dcfece84d9e1089f4f82b`  
**Related FINTECH slice:** PR #1064 — Altcoin Pattern Research Scoring

## Goal

Create a graphical Crypto-Universe alternative to the existing StarTroops-style presentation for the
Owner-requested Altcoin Pattern Scoring surface without moving financial model logic into Frontend.

The component is named **Crypto Pattern Trooper** and uses the canonical Crypto Universe semantic
color `Krypto Purple` rather than the Forex-owned `StarTroops Magenta`.

## Delivered components

### `CryptoPatternTrooper.tsx`

Read-only visual cockpit with:

- Pattern Research Score ring;
- explicit `RESEARCH` authority and `READY / NOT_COMPUTABLE` state;
- 4h / 1d lanes;
- pattern-geometry visualization;
- reference-family cards for Inverse H&S, H&S and Double Bottom;
- Confirmation Matrix for Volume, RSI, Support/Resistance and MACD evidence;
- evidence count;
- explicit `canonical impact = NONE`;
- permanent `scoreEligible=false / executionEligible=false` copy.

No browser-side pattern score, financial threshold, eligibility, ranking or execution decision is
calculated.

### `cryptoPatternTrooperViewModel.ts`

Pure presentation adapter for already-authorized FINTECH research projections. The adapter:

- preserves the FINTECH-provided reference score instead of recomputing it;
- fails closed if score/execution authority is not explicitly false;
- fails closed if `canonicalScoreImpact` is not `NONE`;
- rejects malformed `READY` projections;
- rejects numeric scores in `NOT_COMPUTABLE`;
- keeps evidence/missing-confirmation state visible;
- defaults to `NOT_COMPUTABLE` when no FINTECH projection is bound.

### Universe integration

`UniversePortal` renders the new cockpit as a visible Crypto Research Surface. Because the
frontend branch is deliberately independent of the unmerged FINTECH PR, current-main-compatible
runtime wiring is not invented. Until an attested backend projection is exposed, the component
renders `NOT_COMPUTABLE` and never substitutes demo market values.

## Owner-reference mapping

The uploaded research reference describes:

- multi-factor pattern confirmation;
- 4h/Daily as primary robust timeframes;
- pattern overlays;
- a pattern score badge;
- a signal/pattern panel containing the main confirmation factors.

Frontend translates these ideas into a governed presentation surface while leaving the actual
reference formula and reliability validation in FINTECH.

## Visual semantics

| Semantic | Presentation |
|---|---|
| Asset family | `Krypto Purple` / `asset-crypto` |
| Research authority | existing `AuthorityBadge(RESEARCH)` |
| Missing data | existing `StatusBadge(DATA_UNAVAILABLE / SCORE_NOT_COMPUTABLE)` |
| Ready research context | existing `StatusBadge(READY)` |
| Score label | `Pattern Research Score` |
| Canonical score | never inferred or visually substituted |
| Direction / status | text + badge; never color alone |

The component uses semantic headings, status text and ARIA labels in addition to color. Decorative
pattern geometry is hidden from assistive technology; the meaningful state remains textual.

## Cross-project boundary

The frontend does **not** import the unmerged FINTECH scorer implementation and does not duplicate
its formula. The handover boundary is a narrow read-only projection shape:

```text
FINTECH Pattern Research Assessment
  -> API/view-contract handover (future owner-correct wiring)
  -> CryptoPatternResearchProjectionInput
  -> buildCryptoPatternTrooperViewModel()
  -> CryptoPatternTrooper
```

This allows the FE slice to remain independently mergeable while PR #1064 carries the financial
research logic.

## Validation

Unit tests cover:

1. no FINTECH assessment -> `NOT_COMPUTABLE`, score remains null;
2. an authorized score is projected unchanged;
3. scoring/execution-authority escalation is rejected;
4. malformed `READY` state is rejected;
5. a numeric fallback score in `NOT_COMPUTABLE` is rejected.

Hosted build, lint, frontend architecture checks and full CI are intentionally deferred until Pull
Request creation under repository cost-control policy.

## Follow-up after FINTECH merge

A separate dependency-correct wiring slice may expose an attested server projection of the FINTECH
assessment to this UI. That slice must not accept caller-provided scores and must preserve provenance,
freshness, `scoreEligible=false` and `executionEligible=false` end to end.
