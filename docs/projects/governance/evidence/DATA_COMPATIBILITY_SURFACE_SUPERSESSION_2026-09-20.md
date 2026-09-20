# DATA Compatibility Surface Supersession — 2026-09-20

**Correlation ID:** `CAPITAL-AI-GOV-DATA-COMPATIBILITY-SURFACE-SUPERSESSION-01`  
**Source project:** `CAPITAL-AI-GOV / PVC-05`  
**Current productive owner:** `CAPITAL-AI-FINTECH / PVC-09..17`  
**Documentary successor:** `CAPITAL-AI-DOC / PVC-03`  
**Baseline:** `main@081490f1eed9b19bde7bc427cb4a0dee6d2373da`

## Observed before state

- `ADR_0104_PROJECT_OPTIONS` already excludes `CAPITAL-AI-DATA` and maps FINTECH to `PVC-09..17`.
- `docs/projects/PROJECT_VALUE_CHAIN.md` already maps `PVC-09..17` to FINTECH.
- `AGENTS.md` still requires `docs/projects/data/` to remain as a historical compatibility surface.
- `docs/projects/README.md` still materializes DATA as a current routing row despite zero productive PVC ownership.
- Documentary work package `CAPITAL-AI-DOC-REPO-STRUCTURE-ARCHIVE-01` has already migrated the three active supporting DATA documents to FINTECH and is blocked from full compatibility-surface retirement by the trust-root retention text.

## GOV delta

After Human/CODEOWNER merge of this slice:

1. `CAPITAL-AI-DATA` remains superseded and is no longer a canonical project-folder route.
2. `docs/projects/data/` becomes migration drift rather than a retained current project surface.
3. Historical DATA material may be archived under `docs/archive/` with provenance preserved.
4. Documentary WP-04/WP-05 may remove the compatibility folder only after re-correlation against the merged main.
5. No runtime/provider/scoring/data-plane authority moves; FINTECH remains the sole productive owner for `PVC-09..17`.

## Owner-correct follow-ons

### CAPITAL-AI-DOC
**Remaining scope:** archive the historical DATA artifacts per the existing migration map, create/refresh archive manifest provenance, remove `docs/projects/data/`, and repair current documentation references without rewriting immutable historical evidence.

**Continuation condition:** this GOV slice is Human/CODEOWNER merged and Documentary re-correlates against that resulting CURRENT_MAIN.

### CAPITAL-AI-SEC
**Observed drift:** `scripts/security/validateSecurityAssessment.mjs` still maps `PVC-09..11` to `CAPITAL-AI-DATA`.

**Remaining scope:** SEC-owned bounded correction to FINTECH for `PVC-09..11`, with its own tests/evidence.

**Continuation condition:** fresh SEC correlation; no GOV write into SEC-owned implementation.

## Exit gate

- Trust root no longer requires DATA compatibility-folder retention.
- Canonical project routing contains no DATA row.
- FINTECH remains `PVC-09..17` owner.
- Human/CODEOWNER merge remains the activation boundary.
