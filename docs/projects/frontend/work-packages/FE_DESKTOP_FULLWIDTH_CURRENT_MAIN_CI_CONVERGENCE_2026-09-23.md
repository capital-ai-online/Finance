# FE Desktop Full-Width Current-Main CI Convergence — 2026-09-23

**Canonical identity:** `FE-DESKTOP-FULLWIDTH-CURRENT-MAIN-CI-CONVERGENCE-20260923`  
**Project:** `CAPITAL-AI-FE`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Baseline:** `main@84137c8d24507523c59cf22d6b888a24329a56e5`  
**Source merge:** PR `#1322`  
**Handoff issue:** `#1328`  
**State:** `ACTIVE / DETERMINISTIC TEST-EXPECTATION REPAIR`

## Finding

The full CURRENT_MAIN suite fails only in `tests/unit/frontendDesktopResponsiveAdapter.test.ts`. The test locates the first global
`.capital-ai-frontend-port > div > main` selector, while its assertion is explicitly about the
selector inside the later `@media (min-width: 1024px)` desktop adapter.

This is a deterministic `REPOSITORY_WORK_GRAPH_EXPECTATION_DRIFT`, not evidence that the merged
desktop runtime/CSS is defective.

## Bounded remediation

- search the selector starting at the exact desktop media-query position;
- keep the existing assertion that the desktop selector exists after that boundary;
- preserve the assertions that no 640px/768px adapter was introduced;
- do not change CSS, React runtime, source-lock state or presentation behavior.

## Dependencies and overlap

Open PRs #1323, #1324 and #1325 do not modify this test path. The repair therefore has no direct
changed-file overlap with current open writers.

## Exit evidence

1. focused regression passes;
2. full repository suite passes on the exact PR head;
3. Governance and Security gates pass;
4. fresh pre-merge correlation has `behind_by=0`;
5. after Human/CODEOWNER merge, CURRENT_MAIN and Production exact-SHA correlation pass before
   SH-02.11 continuation resumes.
