# LF-01 Exit Evidence Convergence — 2026-09-21

**Project:** `CAPITAL-AI-FE`  
**Gate:** `LF-01_EXIT_EVIDENCE_CONVERGENCE`  
**Branch decision:** `PASS_AFTER_HUMAN_MERGE`  
**Current-main state before PR #1206 merges:** `PENDING_HUMAN_MERGE`  
**Baseline observed:** `main@523275263f1c8a3e6f8047fae16653a76f6d8372`  
**Adopted upstream snapshot:** `SvenKulessa/FRONTEND@8f6b629c985ca2e46c822ff911f53741d0141e07`

## Owner decision

PR #1206 adopts the complete current graphical architecture from `SvenKulessa/FRONTEND` and fixes the canonical root landing page to that exact pinned source version.

The 16.08 visual-layout template is superseded as an active appearance target. It remains historical evidence only.

Branding is intentionally split:

- Finance keeps canonical colors, typography, semantic color roles and product/wordmark naming;
- only logo geometry is sourced from `SvenKulessa/FRONTEND`;
- the logo geometry is rendered through Finance design tokens.

## Snapshot and runtime completeness

PR #1206 contains:

- pinned upstream `src/App.tsx` as runtime `ReferenceApp.tsx`;
- all 13 current upstream component identities;
- exact-source locking for every non-branding runtime presentation artifact;
- one explicit `BrandLogo.tsx` branding adapter using `CapitalAiEmblem`;
- `src/data/mockData.ts` and `src/types.ts` as presentation-only inputs;
- all four current upstream image assets;
- the exact upstream stylesheet retained as source evidence plus a scoped Finance style adapter;
- `source-lock.json` with exact-source and branding-adapter modes;
- tests that verify exact Git blob identity and the branding boundary;
- the canonical Finance `LandingPage` rendering the pinned `ReferenceApp`.

## LF-01 semantics

After Human/CODEOWNER merge of PR #1206, `LF-01_EXIT_EVIDENCE_CONVERGENCE = PASS` means:

- the selected FRONTEND commit is the fixed graphical source for the public root;
- all current upstream graphical components are present;
- Finance branding authority remains intact;
- only the logo geometry is imported into the canonical Finance brand projection;
- future upstream changes remain review-only until another Finance PR advances the pin;
- productive Finance authorities remain separate and owner-correct.

Independent Security, Compliance and Quality findings are not implicitly converted to PASS.
