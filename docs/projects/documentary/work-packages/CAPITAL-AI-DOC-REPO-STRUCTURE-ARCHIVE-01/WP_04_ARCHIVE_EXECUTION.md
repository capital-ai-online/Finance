# WP-04 Archive Execution — DATA Compatibility Surface Retirement

**Work package:** `CAPITAL-AI-DOC-REPO-STRUCTURE-ARCHIVE-01 / WP-04`  
**Project:** `CAPITAL-AI-DOC / PVC-03`  
**Source baseline:** `main@4a2f43842f380c6da6d088bbea57729bae383be7`  
**Governance prerequisite:** Human-merged PR #1096 / `main@42e3347681a6bfff50682da31bfa527ea7da36e0`  
**Execution branch:** `agent/documentary-data-archive-retirement-20260920`

## Result

- 17 remaining historical/superseded artifacts from `docs/projects/data/` were copied byte-preserved to their planned archive targets.
- `docs/archive/shared/capital-ai-data/ARCHIVE_MANIFEST.json` binds every source path to source commit, source blob SHA, archive path and identical archive blob SHA.
- The three active supporting DATA documents were already migrated in WP-03 and remain under `docs/projects/fintech/references/`; they were not duplicated here.
- The physical `docs/projects/data/` compatibility surface was removed from the branch.
- The `CAPITAL-AI-DATA` canonical routing row was removed atomically from `docs/projects/README.md`.
- Documentary's current ownership boundary now reflects `CAPITAL-AI-FINTECH / PVC-09..17`.

## Integrity boundary

Historical archive content is preserved byte-for-byte. Historical DATA ownership wording inside archived evidence is intentionally not rewritten. Current productive ownership remains `CAPITAL-AI-FINTECH / PVC-09..17`.

No runtime source, provider configuration, secret, database, Render, Supabase, Stripe, production route or scoring/data-plane contract is changed by WP-04.

## WP-05 owner-correct current-reference handoffs

Current non-Documentary projections still containing active DATA routing/path semantics require owner-local convergence after this slice:

- `CAPITAL-AI-FINTECH`: `docs/projects/fintech/CROSS_PROJECT_DEPENDENCIES.md`, `VALIDATION_REPORT.md` and any current FINTECH evidence that still models DATA as an independent upstream project.
- `CAPITAL-AI-OPS`: `docs/projects/operations/CROSS_PROJECT_DEPENDENCIES.md`.
- `CAPITAL-AI-COMP`: `docs/compliance/CAPITAL-AI-COMP/mappings/COMPLIANCE_HANDOFF_REGISTER.md`.
- `CAPITAL-AI-SEC`: current Security/Traceability projections that still route remediation to `docs/projects/data/`.
- repository aggregation owners: `docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md`.

Historical evidence, archived documents and released `.ai/work-claims/*` retain prior path/owner text for provenance and are not rewritten.

## Exit gate

WP-04 is ready when final correlation proves:

1. no file remains under `docs/projects/data/`;
2. all 17 manifest entries resolve to archive files with the recorded blob SHA;
3. no DATA row remains in the canonical project routing table;
4. `PROJECT_VALUE_CHAIN.md` still maps `PVC-09..17` exclusively to FINTECH;
5. hosted checks are reported truthfully and Human/CODEOWNER merge remains external.
