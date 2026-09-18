# Repository Structure and Archive Consolidation — WP-00 / WP-01 Migration Map

**Work package:** `CAPITAL-AI-DOC-REPO-STRUCTURE-ARCHIVE-01`  
**Project:** `CAPITAL-AI-DOC`  
**PVC:** `PVC-03`  
**Baseline:** `main@c2b9672e93a87d0388878b8e16cb8fca0af9ba67`  
**Tree:** `a1062c8a1eb3f590183f83e7c2b8b9ae00c68054`  
**Execution mode:** branch-only, fail-closed  
**Physical moves in this slice:** **NO**

## Exit-gate state

- WP-00 repository tree inventory: **PASS** — 2,888 blobs scanned from a non-truncated recursive Git tree.
- Documentation inventory: **PASS** — 1,142 Markdown/MDX/YAML/JSON/TXT artifacts under `docs/` and `.ai/`.
- Duplicate candidate scan: **PASS** — zero byte-identical documentation blob groups detected.
- Owner/PVC resolution for planned migration candidates: **PASS** — zero unresolved DATA migration items.
- DATA supersession: **PASS** — current routing is `CAPITAL-AI-FINTECH / PVC-09..17`; `CAPITAL-AI-DATA` is historical/non-executable.
- Physical file moves: **NOT RUN BY DESIGN**.
- Hard delete: **NOT RUN / PROHIBITED**.

The full tree-derived inventory is stored in `DOCUMENT_INVENTORY.json`. Non-project documentation that is not part of the current relocation graph is intentionally marked `PRESERVE_CURRENT_SUBJECT_MATTER_ROUTING`; this does not transfer subject-matter ownership to Documentary.

## Before structure

The repository currently contains the canonical `docs/projects/*` project surfaces plus a historical compatibility folder at `docs/projects/data/`. That DATA folder contains 20 text artifacts. Current-main governance already supersedes DATA as a productive owner, but the physical compatibility folder still exists.

## Canonical DATA → FINTECH migration map

| Current path | Classification | Resolved owner | PVC | Planned target |
|---|---|---|---|---|
| `docs/projects/data/DATA_CONTRACTS.md` | `ACTIVE_SUPPORTING` | `CAPITAL-AI-FINTECH` | `PVC-09`, `PVC-10`, `PVC-11` | `docs/projects/fintech/references/DATA_CONTRACTS.md` |
| `docs/projects/data/runbooks/DATA_FINTECH_HANDOFF.md` | `ACTIVE_SUPPORTING` | `CAPITAL-AI-FINTECH` | `PVC-09`, `PVC-10`, `PVC-11`, `PVC-12` | `docs/projects/fintech/references/runbooks/DATA_FINTECH_HANDOFF.md` |
| `docs/projects/data/runbooks/DATA_PROVIDER_INGRESS_AND_DQ.md` | `ACTIVE_SUPPORTING` | `CAPITAL-AI-FINTECH` | `PVC-09`, `PVC-10`, `PVC-11` | `docs/projects/fintech/references/runbooks/DATA_PROVIDER_INGRESS_AND_DQ.md` |
| `docs/projects/data/evidence/CANONICAL_DATA_CONNECTIONS_2026-09-03.md` | `HISTORICAL_EVIDENCE` | `CAPITAL-AI-FINTECH` | `PVC-09`, `PVC-10`, `PVC-11` | `docs/archive/projects/fintech/pvc-10/evidence/CANONICAL_DATA_CONNECTIONS_2026-09-03.md` |
| `docs/projects/data/evidence/CURRENT_MAIN_SECURITY_HANDOFF_RECONCILIATION_2026-09-02.md` | `HISTORICAL_EVIDENCE` | `CAPITAL-AI-FINTECH` | `PVC-10` | `docs/archive/projects/fintech/pvc-10/evidence/CURRENT_MAIN_SECURITY_HANDOFF_RECONCILIATION_2026-09-02.md` |
| `docs/projects/data/evidence/DATA_09_PROVIDER_TIMESTAMP_VALIDATION_2026-09-16.md` | `HISTORICAL_EVIDENCE` | `CAPITAL-AI-FINTECH` | `PVC-09` | `docs/archive/projects/fintech/pvc-09/evidence/DATA_09_PROVIDER_TIMESTAMP_VALIDATION_2026-09-16.md` |
| `docs/projects/data/evidence/DATA_10_14_GAP_CLOSE_2026-09-07.md` | `HISTORICAL_EVIDENCE` | `CAPITAL-AI-FINTECH` | `PVC-09`, `PVC-10`, `PVC-11` | `docs/archive/projects/fintech/pvc-10/evidence/DATA_10_14_GAP_CLOSE_2026-09-07.md` |
| `docs/projects/data/evidence/DATA_11_QUALITY_GATE_2026-09-07.md` | `HISTORICAL_EVIDENCE` | `CAPITAL-AI-FINTECH` | `PVC-11` | `docs/archive/projects/fintech/pvc-11/evidence/DATA_11_QUALITY_GATE_2026-09-07.md` |
| `docs/projects/data/evidence/DATA_12_PROVENANCE_LINEAGE_2026-09-07.md` | `HISTORICAL_EVIDENCE` | `CAPITAL-AI-FINTECH` | `PVC-10`, `PVC-11` | `docs/archive/projects/fintech/pvc-10/evidence/DATA_12_PROVENANCE_LINEAGE_2026-09-07.md` |
| `docs/projects/data/evidence/DATA_13_FRESHNESS_2026-09-07.md` | `HISTORICAL_EVIDENCE` | `CAPITAL-AI-FINTECH` | `PVC-11` | `docs/archive/projects/fintech/pvc-11/evidence/DATA_13_FRESHNESS_2026-09-07.md` |
| `docs/projects/data/evidence/DATA_14_PROVIDER_INPUT_2026-09-07.md` | `HISTORICAL_EVIDENCE` | `CAPITAL-AI-FINTECH` | `PVC-09` | `docs/archive/projects/fintech/pvc-09/evidence/DATA_14_PROVIDER_INPUT_2026-09-07.md` |
| `docs/projects/data/evidence/DATA_FIN12_SIGNED_HISTORY_VALUE_SEMANTICS_2026-09-16.md` | `HISTORICAL_EVIDENCE` | `CAPITAL-AI-FINTECH` | `PVC-09`, `PVC-10`, `PVC-11`, `PVC-12` | `docs/archive/projects/fintech/pvc-11/evidence/DATA_FIN12_SIGNED_HISTORY_VALUE_SEMANTICS_2026-09-16.md` |
| `docs/projects/data/evidence/S1_R2_11_EVIDENCE_IDENTITY_FRESHNESS_2026-09-07.md` | `HISTORICAL_EVIDENCE` | `CAPITAL-AI-FINTECH` | `PVC-10` | `docs/archive/projects/fintech/pvc-10/evidence/S1_R2_11_EVIDENCE_IDENTITY_FRESHNESS_2026-09-07.md` |
| `docs/projects/data/DATA_BASELINE.md` | `SUPERSEDED` | `CAPITAL-AI-FINTECH` | `PVC-09`, `PVC-10`, `PVC-11` | `docs/archive/shared/capital-ai-data/DATA_BASELINE.md` |
| `docs/projects/data/HANDOFFS.md` | `SUPERSEDED` | `CAPITAL-AI-FINTECH` | `PVC-09`, `PVC-10`, `PVC-11` | `docs/archive/shared/capital-ai-data/HANDOFFS.md` |
| `docs/projects/data/README.md` | `SUPERSEDED` | `CAPITAL-AI-FINTECH` | `PVC-09`, `PVC-10`, `PVC-11` | `docs/archive/shared/capital-ai-data/README.md` |
| `docs/projects/data/ROADMAP.md` | `SUPERSEDED` | `CAPITAL-AI-FINTECH` | `PVC-09`, `PVC-10`, `PVC-11` | `docs/archive/shared/capital-ai-data/ROADMAP.md` |
| `docs/projects/data/TAKEOVER_INDEX.md` | `SUPERSEDED` | `CAPITAL-AI-FINTECH` | `PVC-09`, `PVC-10`, `PVC-11` | `docs/archive/shared/capital-ai-data/TAKEOVER_INDEX.md` |
| `docs/projects/data/evidence/README.md` | `SUPERSEDED` | `CAPITAL-AI-FINTECH` | `PVC-09`, `PVC-10`, `PVC-11` | `docs/archive/shared/capital-ai-data/evidence/README.md` |
| `docs/projects/data/handoffs/CAPITAL_AI_SEC_CROSS_PROJECT_HANDOFF.md` | `HISTORICAL_EVIDENCE` | `CAPITAL-AI-FINTECH` | `PVC-09`, `PVC-10`, `PVC-11` | `docs/archive/shared/capital-ai-data/handoffs/CAPITAL_AI_SEC_CROSS_PROJECT_HANDOFF.md` |

## Classification totals for `docs/projects/data/`

- `ACTIVE_SUPPORTING`: 3
- `HISTORICAL_EVIDENCE`: 11
- `SUPERSEDED`: 6
- unresolved: 0

## Reference convergence findings

Current repository search still finds stale historical/current references to `CAPITAL-AI-DATA` and `docs/projects/data/`. Historical evidence may retain those references verbatim. Current operational, compliance, traceability, roadmap/index and test projections must be reviewed in WP-05 and either redirected to FINTECH or explicitly classified as historical compatibility.

Known current-reference hotspots include:
- `docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md`
- `docs/compliance/CAPITAL-AI-COMP/mappings/COMPLIANCE_HANDOFF_REGISTER.md`
- `docs/traceability/CAPITAL_AI_SECURITY_TRACEABILITY_MATRIX_2026-08-31.md`
- `tests/unit/prApprovalEnvelopeGovernance.test.ts`
- historical `.ai/work-claims/CAPITAL-AI-DATA-*.json` records

These are **reference-repair candidates**, not authority sources. They are not modified in this first slice.

## Planned dependency order after this slice

1. WP-02 normalize project structure and retire the DATA compatibility folder as an active project surface.
2. WP-03 move the three active-supporting DATA artifacts to FINTECH and repair their stale owner/PVC narrative.
3. WP-04 archive superseded/historical DATA material with provenance metadata.
4. WP-05 repair current references while preserving immutable historical references.
5. WP-06 add/extend documentation-hygiene detection for stale DATA ownership/path drift.

## Safety / scope evidence

No runtime source, CI workflow, provider configuration, secret, database, Render, Supabase, Stripe, production route or landing-page behavior is changed in this slice. No file has been moved or deleted. This commit materializes inventory and migration evidence only.
