# PR Approval Envelope v3.4.0 — Current-Main Recorrelation Evidence

**Status:** BRANCH EVIDENCE — NON-AUTHORIZING  
**Date:** 2026-09-10  
**Current Project:** `CAPITAL-AI-GOV`  
**Current Project Folder:** `docs/projects/governance/`  
**Primary PVC:** `PVC-05 — Platform Director`  
**Primary Owner:** `CAPITAL-AI-GOV / Platform Director`  
**Branch:** `agent/governance-pr-approval-envelope-20260910`  
**Branch origin:** `main@6d2b78b7914f9771c5fa8a88c6e6bcd40019114a`  
**Current-main baseline before this evidence refresh:** `e9839f5e3eccc0ae01d6a10e53d3787435e1379d`  
**Pre-evidence-refresh branch head:** `dec9750d200607db5f1068123f73850bff72a807`  
**Current-main synchronization commits:** `c3d34418e537d59db18f2f98f16071140f417aa0`, `7829a22877e458e47a8dbd0c8d9f576d8384ca7b`  
**Trust root:** `/AGENTS.md@current-main`

## Purpose

Record the renewed bounded current-main correlation for `GOV-CHAT-074` after `main` advanced through terminal PR #871. This evidence is non-authorizing. It does not activate candidate v3.4 semantics, authorize Pull Request creation, authorize merge, or alter protected external-mutation authority.

## Approval invalidation and effective authority

The prior v3.3 PR-create approval was bound to `main@5664332aac99befa819abbbc2cf23c30a8982147` and branch head `08a0716a79cee6ee42388604889fa9719e947625`. Immediately before the PR-create mutation, `main` had advanced to `e9839f5e3eccc0ae01d6a10e53d3787435e1379d` through Human-merged PR #871. Under current `/AGENTS.md`, that main-SHA change invalidated the prior approval and required `RESYNC -> RECORRELATE -> REVALIDATE -> REAPPROVE`. No Pull Request was created under the stale approval.

Current `main@e9839f5e3eccc0ae01d6a10e53d3787435e1379d` still carries `AUTH-GOV-HUMAN-OWNER-PR-APPROVAL` v3.3.0 and the exact-snapshot PR-create rule. Therefore creation of the GOV-CHAT-074 Pull Request requires a fresh current v3.3 snapshot with exact current `main SHA`, exact branch-head SHA, bounded changed-file/scope report, correlation result, truthful validation evidence and intended exact PR title. Any intervening main/head/scope/title/conflict-state change invalidates that approval and requires another fresh correlation/snapshot.

The branch-local `HUMAN_OWNER_PR_APPROVAL_POLICY` v3.4.0 cannot authorize its own Pull Request. Candidate semantics become current only after Human/CODEOWNER merge.

## Selective rematerialization

The historical branch `agent/governance-pr-approval-consolidation-20260910` and preserved payload at `bcbc73672d8f1bf3d2d7120ba0cad6aaaf0b212e` were used as evidence only. The fresh branch selectively rematerializes only still-valid Approval-Envelope semantics against current authority:

- one stable `AUTH-GOV-HUMAN-OWNER-PR-APPROVAL` authority, candidate v3.4.0;
- one evolved `CTRL-SDLC-PR-CREATE-001`, not a parallel approval plane;
- deterministic effective-change identity as evidence, not semantic safety proof;
- exactly `APPROVAL_STILL_VALID`, `REAPPROVAL_REQUIRED` and `BLOCKED` evaluation states;
- immediate current-main/open-writer/semantic/namespace/authority/security recorrelation;
- one candidate PR-create Owner-Freigabe surface after activation;
- Human/CODEOWNER-only merge remains separate;
- `CTRL-SEC-BOUNDED-REMEDIATION-001` remains intact, including minimal-change, no ownership transfer, no protected external mutation and separated verification;
- productive M10 remains `RETIRED / OFF` and is not reconstructed as an implementation gap or reactivation backlog;
- NIST Governance bindings remain withdrawn/non-authorizing;
- the retired generic Owner-response rule is not reintroduced.

## Current-main and writer correlation

After branch creation, current main advanced through terminal PR #869, PR #870 and PR #871. Their main-only changed paths were:

- `docs/architecture/DOCUMENTARY_D8_MIGRATION_PLANNING.md`;
- `docs/architecture/DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP.md`;
- `docs/projects/documentary/ROADMAP.md`;
- `scripts/automation/dependencySecurity.ts`;
- `tests/unit/dependencySecurity.test.ts`;
- `docs/projects/security/ROADMAP.md`.

These paths are disjoint from the bounded GOV-CHAT-074 change set. PR #869/#870 changes were synchronized through merge commit `c3d34418e537d59db18f2f98f16071140f417aa0`; PR #871 was synchronized through merge commit `7829a22877e458e47a8dbd0c8d9f576d8384ca7b`. Neither synchronization imported historical Approval/NIST/M10/Owner-response semantics.

Immediately before this evidence refresh:

- current main: `e9839f5e3eccc0ae01d6a10e53d3787435e1379d`;
- branch head: `dec9750d200607db5f1068123f73850bff72a807`;
- branch synchronization state: **0 behind**;
- merge base: exact current main;
- open Pull Requests: **none** at the renewed correlation point;
- changed-file/open-writer/semantic/namespace/authority correlation: **PASS**;
- project/PVC/Primary Owner resolution: **PASS** — `CAPITAL-AI-GOV`, `docs/projects/governance/`, `PVC-05`, `CAPITAL-AI-GOV / Platform Director`.

The final branch head produced by this evidence refresh is intentionally not self-recorded here. It is read back externally after the commit and is the only branch-head SHA eligible for the immediately following renewed v3.3 approval snapshot.

## Changed scope

The bounded GOV-CHAT-074 branch changes Governance authority/projection and non-production validation/tooling surfaces only: `/AGENTS.md`; Approval and Development-Chain policies; Governance registries/control-plane projections; ADR-0096 current-state wording; Governance project Roadmap/Register/README and this evidence; PR check classification; Approval-Envelope helper/tests; Governance manifest metadata; and focused Governance regression tests.

No Product Runtime, dependency manifest/lockfile, deployment workflow, provider configuration, external platform, billing, IAM, secret, DNS or production data mutation is part of this work item. The synchronized Security-Roadmap file is identical to current main and therefore is not part of the PR diff.

## PR class

Current-main `docs/governance/PR_CHECK_CLASSIFICATION.md` classifies pure tests and `scripts/pr/**` / Governance validation tooling as `C-N — non-production validation/tooling`, `production_impact=false`, absent a productive path. The only `src/**` change in this branch is `src/platform/Governance/manifest.json`; current-main repository search identifies that path as an input of `scripts/governance/validateGovernanceControlPlane.mjs` and no productive runtime consumer was identified. The bounded slice is therefore classified **C-N / production_impact=false**, subject to the exact PR-head hosted classification/checks after PR creation.

## Validation evidence

Executed against the branch-local Approval-Envelope helper/test payload before later documentation/projection-only commits:

- `node --check scripts/pr/approvalEnvelope.mjs` — **PASS**;
- `node --check scripts/pr/approvalEnvelope.test.mjs` — **PASS**;
- `node --test scripts/pr/approvalEnvelope.test.mjs` — **PASS, 15/15 tests, 0 failures**.

The focused negative matrix covers unrelated main drift, synchronization-only head drift, material payload changes, explicit material-equivalence proof, semantic/authority/open-writer/security blocking, failed validation, conflict-resolution payload changes, malformed SHA evidence and prohibited agent merge attempts.

Revalidation after the PR #871 resync established that the commits between the prior validated head `08a0716a79cee6ee42388604889fa9719e947625` and the pre-evidence-refresh head `dec9750d200607db5f1068123f73850bff72a807` change only `docs/projects/security/ROADMAP.md`, `docs/projects/governance/ROADMAP.md` and `docs/projects/governance/TASK_REGISTER.md`. Neither `scripts/pr/approvalEnvelope.mjs` nor `scripts/pr/approvalEnvelope.test.mjs` changed, so the executed helper checks were not invalidated by the synchronization. No unexecuted check is represented as PASS.

Additional current-state evidence:

- current-main `/AGENTS.md` v2.9.0 fully re-read after PR #871 — **PASS**;
- current Project/PVC/Primary Owner mapping re-read — **PASS**;
- current-main Human Owner PR Approval Policy v3.3.0 remains controlling — **PASS**;
- current-main PR template `CAPITAL_AI_PR_TEMPLATE_VERSION: 1.5.0` remains the canonical PR-body contract — **PASS**;
- current-main PR Check Classification remains the governing classifier — **PASS**;
- renewed main/branch correlation after PR #871 resync — **PASS / 0 behind** before this evidence refresh;
- full Vitest suite — **NOT RUN** in a complete branch checkout;
- full Governance CLI/validator — **NOT RUN** in a complete branch checkout;
- hosted GitHub checks — **NOT RUN pre-PR**;
- Production Build/CSP/Predeploy/Docker — **NOT REQUIRED / NOT RUN** for the current C-N classification;
- deployment/provider/external mutation — **NOT REQUIRED / NOT RUN**.

`NOT RUN` is not represented as `PASS`.

## Exit-gate state

The branch is ready for the mandatory final readback. PR-create readiness is established only if that readback still shows `main@e9839f5e3eccc0ae01d6a10e53d3787435e1379d`, no conflicting open writer, branch `0 behind`, this evidence refresh as branch head, unchanged bounded scope/title intent, and correlation PASS. The current v3.3 Human/Owner approval snapshot may then be emitted for those exact SHAs.
