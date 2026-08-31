# P3 — Financial Value Chain Namespace Assessment

**Source project:** `CAPITAL-AI-GOV`  
**Current technical authority:** `SC-MD-SPT-0001`  
**Current namespace:** unqualified technical `VC-01..VC-18`  
**Recommended target namespace:** `FVC-01..FVC-18`, only after coordinated approval  
**Status:** `WAITING_FOR_EVIDENCE / CROSS_PROJECT DECISION REQUIRED`

## Recommendation

Keep the stable document/authority identity **`SC-MD-SPT-0001` unchanged**. If affected owners approve a coordinated migration, rename only the financial technical stage identifiers from `VC-*` to `FVC-*`.

This separates:

- `PVC-*` — Project Value Chain / project ownership and routing;
- `FVC-*` — Financial Value Chain / technical Screening, Scoring and Market-Data stages.

No productive scoring architecture or replacement authority is created by the namespace proposal.

## Proposed mapping

`VC-01..VC-18` map one-to-one to `FVC-01..FVC-18` while retaining the current stage names and stable `SC-MD-SPT-0001` identity.

## Coordinated impact surface

A future migration must correlate at least:

- `docs/roadmaps/SCREENING_SCORING_MARKET_DATA_SPT_ROADMAP.md`;
- `src/platform/Quality/ValueChain/**` and Quality tests;
- `src/platform/Vocabulary/ValueChain/**` and Vocabulary tests;
- current Documentary projections and traceability;
- current scoring/ranking contracts and evidence consumers;
- DATA/FINTECH project mappings;
- OPS EventMesh/Traceability/Supervisor references.

This must not be performed as piecemeal search/replace.

## Historical evidence rule

Historical evidence containing former `VC-*` stage IDs is **not rewritten**. Current normative/current-state projections receive `FVC-*` only in a coordinated migration; historical records retain their original identifiers and dated context.

## Compatibility strategy

1. record the coordinated namespace decision and owner scope;
2. add a bounded compatibility resolver/type alias only where required by runtime/stored evidence;
3. update SPT, Quality, Vocabulary and current Documentary projections in one synchronized set or explicit dependency chain;
4. update targeted tests/current-state documentation;
5. prove no productive scoring, ranking, evidence or EventMesh behavior changed beyond identifiers;
6. retain legacy parsing for historical evidence only where necessary;
7. remove compatibility aliases only after current consumers are proven migrated.

## Cross-project handoffs

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-DATA | VC-09]
- **project_stage:** `PVC-09..PVC-11`
- **task:** assess DATA-owned mapping and technical consumer impact.
- **status:** `REFERRED_NOT_EXECUTED`

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FINTECH | VC-12]
- **project_stage:** `PVC-12..PVC-17`
- **task:** lead productive SPT/Scoring/Ranking namespace migration planning and contract validation.
- **status:** `REFERRED_NOT_EXECUTED`

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-DOC | VC-03]
- **project_stage:** `PVC-03`
- **task:** migrate current Documentary references while preserving historical evidence.
- **status:** `REFERRED_NOT_EXECUTED`

### Cross-cutting Quality dependency
- **target_project:** `CAPITAL-AI-QM`
- **project_stage:** none — cross-cutting
- **task:** coordinate Quality projection/test migration.
- **status:** `DEPENDENCY`

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-18]
- **project_stage:** `PVC-18`
- **task:** correlate EventMesh/Traceability/Supervisor technical references and compatibility evidence.
- **status:** `REFERRED_NOT_EXECUTED`

## Decision gate

P3 may proceed only with one correlated multi-owner plan, synchronized current-main/open-writer state, explicit historical-evidence treatment and targeted Quality/Vocabulary/Documentary/Scoring/Ranking/Traceability validation. Until then, `SC-MD-SPT-0001` and its current technical `VC-*` stage identifiers remain unchanged.
