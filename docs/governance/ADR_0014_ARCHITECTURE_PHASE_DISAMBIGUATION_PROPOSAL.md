# Proposal: Disambiguate architecture `ADR-0014` phase documents

**Document ID:** GOV-PROP-ADR0014-ARCH-2026-08-16  
**Status:** Proposal — requires Human/Owner decision  
**Related:** ADR-0081, GOV-XREF-2026-08-16, ADR-0075

## Problem

Two distinct concepts share the label **ADR-0014**:

| Location | Meaning |
|----------|---------|
| `docs/adr/ADR-0014-documentation-governance-validator.md` | **Canonical** Documentation Governance Validator (ESS-0012) |
| `docs/architecture/**` files titled `ADR-0014 Phase 3.x…` | Server runtime / market-data decomposition workstream |

After PR #345, `docs/adr/` no longer has duplicate *files* for 0014, but the **architecture tree still claims the ADR-0014 identity** for a different decision family. Agents and humans can still resolve the wrong parent.

## Options

### Option A — Phase documents only (recommended default)

- Rename architecture titles from `ADR-0014 Phase …` to `Phase 3.4.x — …`
- Keep a single parent pointer, e.g. `Parent: docs/architecture/adr/ADR-0014-server-runtime-architecture-consolidation.md` **or** retitle that parent to drop the ADR number and call it `SERVER_RUNTIME_ARCHITECTURE_CONSOLIDATION.md`
- No new ADR numbers
- Historical work-claims keep path history; add a one-line “superseded title” note where needed

**Pros:** Minimal surface, no further ADR-number consumption.  
**Cons:** Parent decision is not in the canonical `docs/adr/` registry.

### Option B — Promote server-runtime parent into `docs/adr/`

- Assign **ADR-0082** (or next free) to Server Runtime Architecture Consolidation
- Point all Phase 3.4.x notes at ADR-0082
- Leave Documentation Governance as ADR-0014
- Optionally move or symlink the architecture parent file under `docs/adr/`

**Pros:** Single number space for real decisions.  
**Cons:** More edits; work-claim and evidence path updates need Owner scope approval.

### Option C — Status quo + warnings only

- Keep architecture filenames/titles
- Rely on ADR-0075 numbering notes and this inventory

**Pros:** Zero churn.  
**Cons:** Ambiguity remains for every future agent pass.

## Recommendation

**Option A** for phase notes immediately; consider **Option B** only if the server-runtime consolidation is still an active decision that should be re-audited as a first-class ADR.

## Out of scope until Owner decides

- Mass rename of work-claim files under `docs/architecture/workclaims/`
- Changes to runtime code or CI
- Activation of ESS-0012 score thresholds

## Decision request

Owner selects **A / B / C** (or hybrid). After selection, Grok opens a Class D PR implementing only the chosen option.
