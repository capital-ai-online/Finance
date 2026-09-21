# FRONTEND upstream presentation-source contract

**Project:** `CAPITAL-AI-FE`  
**Source repository:** `SvenKulessa/FRONTEND`  
**Source ref:** `main`  
**Pinned adoption snapshot in PR #1206:** `8f6b629c985ca2e46c822ff911f53741d0141e07`  
**Finance execution authority:** `/AGENTS.md@CURRENT_MAIN`

## Architecture adoption

Merge of PR #1206 adopts the current `SvenKulessa/FRONTEND` presentation architecture as the leading graphical architecture for CAPITAL-AI **and binds the canonical root landing page directly to that pinned version**.

Two correlated forms are retained in the PR:

1. an inert, reviewable upstream snapshot under `docs/frontend/upstream-source/SvenKulessa-FRONTEND/`;
2. a runtime presentation copy under `src/features/public/ui/frontend-port/`, where `ReferenceApp.tsx`, all 13 graphical components, presentation types, fixture data and four image assets are byte-identical to the pinned source Git blobs.

`src/features/public/ui/frontend-port/source-lock.json` records the exact upstream blob identities. `tests/unit/frontendReferenceDesignLock.test.ts` recomputes Git blob SHAs from the runtime files so graphical drift cannot silently pass.

The canonical `src/features/public/ui/LandingPage.tsx` renders `ReferenceApp` and carries the pinned repository/commit identity as explicit presentation metadata.

## Boundary

The upstream repository owns visual intent, graphical components, UI slices and presentation composition. Finance retains productive auth/session, provider/data, news, scoring, entitlement, billing, Security, Compliance, Governance and deployment authority.

`src/data/mockData.ts` from the upstream source is adopted only to reproduce the selected visual design. Its prices, scores, labels and other sample values are not canonical Finance evidence and do not replace FINTECH data/scoring authority.

The one-time runtime binding in PR #1206 is **not automatic runtime promotion**. The hourly workflow continues to mirror future upstream presentation changes only into the reviewable inert snapshot and opens/updates a PR. A future upstream commit therefore cannot mutate the productive landing page without another reviewed Finance PR.

## Binding state in #1206

1. pinned upstream presentation snapshot — included;
2. byte-identical runtime graphical copy — included;
3. canonical root `/` → pinned `ReferenceApp` — included;
4. Finance routing/auth/session authority — unchanged;
5. productive Finance data/scoring/news/pricing/entitlement adapters — separate owner-correct follow-up work;
6. exact-head TypeScript, Frontend architecture, tests/build and applicable SEC/COMP/QM evidence — required before merge.

Human/CODEOWNER merge remains the final merge gate.
