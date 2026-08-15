# ADR Unified Location Inventory — 2026-08-16

**Document ID:** GOV-XREF-UNIFIED-LOC-2026-08-16  
**Owner decision:** Unified architecture ADRs at fixed location `docs/adr/` only (Option B / hybrid)

## Invariant

- Formal ADRs live **only** under `docs/adr/`.
- Files under `docs/architecture/` must **not** use `ADR-XXXX` as primary identity in filename or title for new work.
- Phase / work-package notes use `PHASE-…` or descriptive names and point to a parent ADR in `docs/adr/`.

## This change set

| Action | Detail |
|--------|--------|
| Promote | Server Runtime Architecture Consolidation → **ADR-0083** |
| Demote | architecture `ADR-0014 Phase 3.x` → `PHASE-3.x-…` notes |
| Redirect | Former architecture ADR-0014 paths → short SUPERSEDED stubs |
| Fix | ADR-0075 parent → ADR-0083 + PHASE-3.4.6 path |
| README | Single-location rule added |

## Remaining debt (not in this PR)

| Item | Note |
|------|------|
| `docs/architecture/adr/ADR-0013-server-composition-root-…` | Parallel number with canonical ADR-0013 (ESS). Follow-up: promote to unique ADR or rename to phase/architecture note. |
| Work-claim / evidence paths that still say “ADR-0014 Phase …” | Historical; optional one-line superseded notes later; no silent mass rewrite. |
| `adr_history.json` lag | Separate maintenance PR. |

## Next free ADR number after this PR

**ADR-0084** (0082 = SeoEngine, 0083 = Server Runtime).
