# FE-1608-APPEARANCE — historical supersession evidence

**Project:** `CAPITAL-AI-FE`  
**Historical work package:** `GOV-CHAT-079 — 16.08 Mockup Visual Target`  
**Status:** `SUPERSEDED / HISTORICAL_EVIDENCE_ONLY`  
**Superseded by:** PR #1206 / `SvenKulessa/FRONTEND@8f6b629c985ca2e46c822ff911f53741d0141e07`

## Supersession

The 16.08 mockup/layout contract is no longer an active visual target and must not block or reshape current FRONTEND components back toward that historical layout.

The leading graphical composition is now the pinned `SvenKulessa/FRONTEND` component architecture.

This supersession does **not** retire the current Finance branding authority. Colors, typography, semantic roles and product/wordmark naming continue to resolve from `docs/frontend/design-tokens.json` and the current Finance branding surfaces.

Only logo geometry is adopted from `SvenKulessa/FRONTEND`.

## Active replacement evidence

- `src/features/public/ui/frontend-port/source-lock.json`
- `tests/unit/frontendReferenceDesignLock.test.ts`
- `tests/unit/frontendUpstreamAppearanceContract.test.ts`
- `docs/frontend/brandmark.json`
- `src/shared/branding/CapitalAiEmblem.tsx`
- `docs/frontend/FRONTEND_UPSTREAM_SOURCE_CONTRACT.md`
- `docs/frontend/LF01_EXIT_EVIDENCE_CONVERGENCE_2026-09-21.md`

The retired test `tests/unit/frontend1608AppearanceContract.test.ts` is intentionally removed because it encoded superseded 16.08-specific appearance assumptions, including a requirement that the old JPG emblem filename appear in executable TypeScript.

Historical evidence remains preserved here for provenance; it is not an execution or merge authority.
