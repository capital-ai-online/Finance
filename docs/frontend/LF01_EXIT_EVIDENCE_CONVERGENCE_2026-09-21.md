# LF-01 Exit Evidence Convergence — 2026-09-21

**Project:** `CAPITAL-AI-FE`  
**Gate:** `LF-01_EXIT_EVIDENCE_CONVERGENCE`  
**Branch decision:** `PASS_AFTER_HUMAN_MERGE`  
**Current-main state before PR #1206 merges:** `PENDING_HUMAN_MERGE`  
**Baseline observed:** `main@523275263f1c8a3e6f8047fae16653a76f6d8372`  
**Adopted upstream snapshot:** `SvenKulessa/FRONTEND@8f6b629c985ca2e46c822ff911f53741d0141e07`

## Owner decision

PR #1206 adopts the complete current graphical architecture from `SvenKulessa/FRONTEND` and fixes the canonical root landing page to that exact pinned source version.

The runtime landing binding is presentation-only. Existing Finance auth/session, provider/data, scoring, news, pricing/entitlement, billing, Security, Compliance, Governance and deployment authority is not replaced by the design repository.

## Snapshot and runtime completeness

PR #1206 contains:

- pinned upstream `src/App.tsx` as the runtime `ReferenceApp.tsx`;
- all 13 current upstream files under `src/components/`, byte-identical by Git blob SHA;
- `src/data/mockData.ts` and `src/types.ts`, byte-identical to the pinned presentation source;
- all four current upstream image assets, including the new wide banner;
- the exact upstream `src/index.css` retained as source evidence plus a scoped Finance style adapter;
- `source-lock.json` with source/target blob identities;
- a unit test that recomputes Git blob SHAs and fails on graphical drift;
- the canonical Finance `LandingPage` rendering the pinned `ReferenceApp`.

This is a physical runtime binding and a physical evidence snapshot, not only a scheduled-sync promise.

## LF-01 semantics

After Human/CODEOWNER merge of PR #1206, `LF-01_EXIT_EVIDENCE_CONVERGENCE = PASS` means:

- the selected FRONTEND commit is the fixed graphical source for the public root;
- every current upstream graphical component is present in the Finance runtime presentation subtree;
- the root landing renders that pinned composition directly;
- future upstream changes remain review-only until another Finance PR intentionally advances the pin;
- productive Finance authorities remain separate and owner-correct.

Independent Security, Compliance and Quality findings are not implicitly converted to PASS. Applicable SEC/COMP/QM gates remain fail-closed.
