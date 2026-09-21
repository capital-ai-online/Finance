# SvenKulessa/FRONTEND — pinned presentation architecture

Pinned source: `SvenKulessa/FRONTEND@8f6b629c985ca2e46c822ff911f53741d0141e07`.

PR #1206 contains the complete current presentation source needed to reproduce the upstream graphical architecture: application composition, entry point, styles, presentation types, all current graphical components/modals and the visual fixture used by those components.

All text source is intentionally stored as `.source` outside Finance runtime `src/`. The mirror is architectural/design evidence, not executable production code.

`src/data/mockData.ts` is `VISUAL_FIXTURE_ONLY`. Existing Finance-owned components and canonical backend/domain contracts are connected to this visual architecture only in subsequent adapter work.
