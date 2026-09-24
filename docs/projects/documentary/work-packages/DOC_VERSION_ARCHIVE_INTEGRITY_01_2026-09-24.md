# DOC-VERSION-ARCHIVE-INTEGRITY-01

**Project:** CAPITAL-AI-DOC  
**Owner/PVC:** CAPITAL-AI-DOC / PVC-03  
**Baseline:** main@23be3c2d257020647884f46267e0c864ff003a68  
**State:** IMPLEMENTED_ON_BRANCH / HUMAN_MERGE_REQUIRED

## Objective

Keep Documentary component-version projections exact without a second version authority and make the complete repository archive tamper-evident without creating an archive mutation controller.

## Implementation

- `src/platform/Documentary/manifest.json#version` remains the sole Documentary component-version authority and advances to `1.22.0` for the Archive Integrity capability.
- Maintenance closure and the current-main workflow validate version projections from that manifest instead of historical literals.
- `docs/archive/ARCHIVE_INTEGRITY_INDEX.json` binds every pre-existing tracked file below `docs/archive/**` to exact path, size and Git blob SHA; only the index itself is excluded to avoid self-hash recursion.
- Existing archive manifests add lifecycle and provenance semantics. `BYTE_PRESERVED` entries are checked against the historical `sourceCommit` and current archive blob.
- Any unexplained archive addition, removal, content mutation, manifest lifecycle reactivation or historical-source mismatch fails closed.
- The verifier is read-only and grants no delete/restore/merge/release/runtime authority.
- The existing `documentary-change-impact.yml` remains the single background workflow and performs version + archive integrity before AUTO_SYNC.

## Dependency-held legacy retirement

`server/documentHygiene.ts` and `server/documentSanitizer.ts` remain physically present only because current FE/OPS runtime consumers still import/mount them. Their removal is a separate owner-correct terminal cleanup after those consumers are merged away. This work package does not reactivate or extend them.

## Exit evidence

- No hard-coded historical Documentary component version remains in the maintenance closure validator.
- README and current architecture version projection equal `manifest.json#version`.
- Complete archive index verifies all covered current archive files.
- Historical byte-preserved source evidence is verified on the current-main workflow with full Git history.
- No second workflow/controller or automatic archive deletion exists.
