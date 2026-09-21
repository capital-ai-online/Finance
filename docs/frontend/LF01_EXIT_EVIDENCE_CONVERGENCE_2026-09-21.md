# LF-01 Exit Evidence Convergence — 2026-09-21

**Project:** `CAPITAL-AI-FE`  
**Gate:** `LF-01_EXIT_EVIDENCE_CONVERGENCE`  
**Branch decision:** `PASS_AFTER_HUMAN_MERGE`  
**Current-main state before this PR merges:** `PENDING_HUMAN_MERGE`  
**Baseline observed:** `main@523275263f1c8a3e6f8047fae16653a76f6d8372`  
**Upstream presentation source observed:** `SvenKulessa/FRONTEND@8f6b629c985ca2e46c822ff911f53741d0141e07`

## Owner decision

The Human Owner directs that future main Frontend graphics, UI slices and presentation architecture are sourced from `SvenKulessa/FRONTEND`, while productive Finance runtime/business/domain logic remains in its canonical owner boundaries.

The Human Owner also releases `LF-01_EXIT_EVIDENCE_CONVERGENCE` as PASS for continuation **after this exact decision is merged to CURRENT_MAIN**.

## Current-main evidence

On the observed current main:

- root composes the static `LandingPage`;
- authenticated login return targets `/`;
- root routing does not compose `LandingRealtimeAiNewsfeed`, `PublicAnalysisWorkbench` or `LandingPricingPanel`;
- `LandingPage.tsx` contains no direct `fetch(...)` call;
- static presentation slots exist for profile/subscription, news, scorer and pricing;
- PR #1195 is merged and established the LF-01 static visual baseline;
- OPS PR #1200 is merged and aligned auth/lifecycle routing to the root landing;
- SEO #1204 and SOCIAL #1203 are merged as dependency-aware downstream projections.

## Convergence delta in this PR

This PR closes the remaining Frontend-source ambiguity by establishing one controlled path:

`SvenKulessa/FRONTEND -> hourly allowlisted inert snapshot -> Finance adapter PR -> productive Finance frontend`.

The hourly sync cannot promote upstream source into `src/`, cannot execute upstream code and cannot copy domain/runtime source classes. This keeps LF-01 visual authority separated from later productive phases.

## PASS semantics

After Human/CODEOWNER merge, `LF-01_EXIT_EVIDENCE_CONVERGENCE = PASS` releases dependency-correct continuation to later Landing-First work.

This PASS does **not** relabel independent Security, Compliance or Quality findings as PASS. Those projects keep their own evidence/approval boundaries, and an affected later-phase PR remains fail-closed when its applicable SEC/COMP/QM evidence is missing or failed.

An unmerged branch cannot authorize itself. Until merge, CURRENT_MAIN remains the canonical source and this document is proposed evidence only.
