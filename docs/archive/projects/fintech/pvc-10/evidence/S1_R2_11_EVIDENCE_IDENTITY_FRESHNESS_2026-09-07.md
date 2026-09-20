# CAPITAL-AI-DATA — S1-R2-11 Evidence Identity / Freshness Return

**Date:** `2026-09-07`  
**Project:** `CAPITAL-AI-DATA`  
**Project stage:** `PVC-10`  
**Source finding:** `S1-R2-11 — Evidence identity and stale-state automation`  
**DATA status:** `EVIDENCE_READY`  
**Security status:** not set by DATA — independent `CAPITAL-AI-SEC` verification remains required  
**main SHA at resync:** `51bf529f003dfa47462c16ecbe10ae3b095547a4`  
**Work branch:** `agent/data-s1-r2-11-main-sync-20260907`

`[SECURITY_HANDOFF_RETURN -> CAPITAL-AI-SEC]`

## Implementation status

DATA owns a canonical, asset-class-neutral observation evaluator:

- `src/platform/MarketData/evidenceIdentityFreshness.ts`
- contract `evidence-identity-freshness/1.0.0`
- states `CURRENT`, `STALE`, `CURRENT_AFTER_REFRESH`, `STALE_RETRY_REQUIRED`

The evaluator consumes the existing `market-evidence-dq/1.0.0` envelope. It does not create a second evidence authority, scoring path, or PR/trace tooling surface. OPS remains owner of `scripts/pr/updatePrProductionBaseline.mjs`.

## Changed files

- `src/platform/MarketData/evidenceIdentityFreshness.ts`
- `tests/unit/evidenceIdentityFreshness.test.ts`
- `docs/projects/data/ROADMAP.md`
- `docs/projects/data/HANDOFFS.md`
- `docs/projects/data/DATA_BASELINE.md`
- `docs/projects/data/evidence/S1_R2_11_EVIDENCE_IDENTITY_FRESHNESS_2026-09-07.md`

## Targeted tests

`tests/unit/evidenceIdentityFreshness.test.ts` covers:

- identity-bound fresh `VERIFIED` evidence → `CURRENT`;
- wrong asset identity → `STALE`, `authorizesCurrent=false`;
- freshness-label rewrite without trusted refresh remains `STALE`;
- trusted refresh bound to the required identity → `CURRENT_AFTER_REFRESH`;
- missing / untrusted / incomplete refresh → `STALE_RETRY_REQUIRED`;
- trusted refresh with wrong identity remains `STALE`.

## Residual risk / unresolved dependencies

- Crypto-specific `CryptoEvidenceIdentityRegistry` remains a domain identity map and is not retired in this package;
- snapshot/evidence DQ vocabularies are not yet one DATA status contract (`DATA-11`);
- independent Security verification is still required before any Security finding is marked `VERIFIED` or `CLOSED`;
- hosted CI evidence is bound to the eventual PR head, not to this documentary file.

## Verification requested

`CAPITAL-AI-SEC` is requested to independently verify that stale/wrong-identity evidence cannot authorize current state on the implemented observer and that DATA did not self-close the finding.
