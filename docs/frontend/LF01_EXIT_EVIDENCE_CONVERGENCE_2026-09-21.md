# LF-01 Exit Evidence Convergence — 2026-09-21

**Project:** `CAPITAL-AI-FE`  
**Gate:** `LF-01_EXIT_EVIDENCE_CONVERGENCE`  
**Branch decision:** `PASS_AFTER_HUMAN_MERGE`  
**Current-main state before PR #1206 merges:** `PENDING_HUMAN_MERGE`  
**Baseline observed:** `main@523275263f1c8a3e6f8047fae16653a76f6d8372`  
**Adopted upstream snapshot:** `SvenKulessa/FRONTEND@8f6b629c985ca2e46c822ff911f53741d0141e07`

## Owner decision

The Human Owner directs that merge of PR #1206 adopts the **current complete presentation architecture** from `SvenKulessa/FRONTEND`: graphical components, modals, UI slices, application composition, entry point, styles, presentation type shapes and required visual fixtures.

Existing Finance repository components are connected to that graphical architecture **after** this adoption through separate owner-correct adapter work. Productive Finance logic is not replaced by demo logic from the design repository.

## Snapshot completeness

PR #1206 contains the pinned current upstream presentation tree:

- `src/App.tsx` and `src/main.tsx`;
- `src/index.css` and `src/types.ts`;
- all 13 current files under `src/components/`;
- `src/data/mockData.ts` as `VISUAL_FIXTURE_ONLY`;
- a source manifest tying the snapshot to upstream SHA `8f6b629c...`.

This is a physical merge artifact, not only a scheduled-sync promise.

## LF-01 semantics

On observed CURRENT_MAIN, root already renders the static LandingPage, login returns to `/`, productive news/workbench/pricing surfaces are absent from root composition and LandingPage has no direct fetch requirement.

After Human/CODEOWNER merge of PR #1206, `LF-01_EXIT_EVIDENCE_CONVERGENCE = PASS` means:

- the static Landing-First baseline remains established;
- the authoritative graphical target is the pinned FRONTEND presentation architecture;
- later work may begin adapter-based binding of Finance-owned components to that target in dependency order.

This PASS does not turn independent Security, Compliance or Quality findings into PASS. Applicable SEC/COMP/QM gates remain independently fail-closed.
