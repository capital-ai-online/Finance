# GOV Production Release Authority Supersession — 2026-09-26

**Work item:** `GOV-PRODUCTION-RELEASE-AUTHORITY-SUPERSESSION-01`  
**Project:** `CAPITAL-AI-GOV`  
**Owner/PVC:** `CAPITAL-AI-GOV / PVC-05`  
**Branch:** `agent/governance-production-release-authority-supersession-20260926`  
**Baseline:** `82f50a97db513cab02e0a342c19230badb0b3ade`  
**Priority:** P1 — Production identity / release-governance integrity  
**Productive dependency:** `CAPITAL-AI-OPS / PVC-06..08`

## Goal

Supersede package metadata as the released Production-version authority and retire the fixed ten-merge PATCH cadence without creating a second Release/Deployment control plane.

## In scope

- update the repository trust-root cadence/version semantics;
- define ADR-0107;
- define the future single accepted Release authority and Production identity tuple;
- preserve the current five-merge Render promotion cadence;
- create an owner-correct OPS migration handoff;
- record separate Quality and Security development-chain reviews.
- converge the Governance Control Catalog and regression tests on the superseded Production-version semantics.

## Out of scope

- no productive Release runtime code mutation;
- no Render/provider mutation;
- no tag creation/deletion;
- no package.json/package-lock version mutation;
- no direct-main mutation;
- no merge or auto-merge authority;
- no foreign-owner implementation in OPS, QM or SEC project surfaces.

## Dependencies

1. `/AGENTS.md@CURRENT_MAIN`;
2. canonical project/PVC mappings;
3. existing ADR-0030 / ADR-0105 Release controls;
4. current Release implementation which still reads package.json;
5. protected tag and main rulesets;
6. Human/CODEOWNER merge of this Governance supersession before OPS materialization.

## OPS handoff

**Target:** `CAPITAL-AI-OPS / PVC-06, PVC-07, PVC-08`

After this supersession is Human-merged, create one bounded OPS migration that replaces package-derived Production-version consumers with the accepted Release Manifest/tag chain and exact runtime identity tuple.

Minimum migration surface observed on the baseline:

- `src/platform/Release/Services/platformVersionControlPlane.ts`;
- `src/platform/Release/Services/deterministicVersionMaterialization.ts`;
- `scripts/governance/deterministicVersioningDecision.mjs`;
- `scripts/governance/controlPlaneStructuralValidatorCore.mjs`;
- `src/platform/Release/Services/artifactVersionInventory.ts`;
- Release Gate, runtime manifest/readback, merge-cadence and PR/dashboard projection consumers/tests.

**Unblock condition:** exact Governance PR is Human/CODEOWNER-merged and a fresh CURRENT_MAIN confirms the supersession without conflicting writer/authority drift.

## Exit evidence

- branch contains the exact fresh baseline;
- trust root contains one prospective supersession and preserves Human merge;
- ADR-0107 resolves version/deploy/release identities without a parallel authority;
- QM report identifies migration/test risks independently from implementation claims;
- SEC report identifies trust/supply-chain/rollback risks independently from implementation claims;
- no package/provider/runtime mutation occurs in this GOV slice;
- Control Catalog plus cadence/governance regressions pass without preserving the retired ten-merge Production-version authority;
- PR creation occurs only when the mandatory project label can be supplied at create time.
