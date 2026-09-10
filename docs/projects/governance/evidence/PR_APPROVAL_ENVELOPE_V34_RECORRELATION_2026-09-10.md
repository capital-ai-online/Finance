# PR Approval Envelope v3.4.0 — Current-Main Recorrelation Evidence

**Status:** BRANCH EVIDENCE — NON-AUTHORIZING  
**Date:** 2026-09-10  
**Current Project:** `CAPITAL-AI-GOV`  
**Current Project Folder:** `docs/projects/governance/`  
**Primary PVC:** `PVC-05 — Platform Director`  
**Primary Owner:** `CAPITAL-AI-GOV / Platform Director`  
**Branch:** `agent/governance-pr-approval-envelope-20260910`  
**Branch origin:** `main@6d2b78b7914f9771c5fa8a88c6e6bcd40019114a`  
**Current-main baseline before this evidence commit:** `5664332aac99befa819abbbc2cf23c30a8982147`  
**Pre-evidence branch head:** `fb8c1efb2920e46c0dd5677ae3262d987c4e815c`  
**Current-main synchronization commit:** `c3d34418e537d59db18f2f98f16071140f417aa0`  
**Trust root:** `/AGENTS.md@current-main`

## Purpose

Record the final bounded current-main correlation for `GOV-CHAT-074` before the current Human/Owner PR-create gate. This evidence is non-authorizing. It does not activate candidate v3.4 semantics, authorize Pull Request creation, authorize merge, or alter protected external-mutation authority.

## Effective authority for this candidate PR

Current `main@5664332aac99befa819abbbc2cf23c30a8982147` still carries `AUTH-GOV-HUMAN-OWNER-PR-APPROVAL` v3.3.0 and the exact-snapshot PR-create rule in `/AGENTS.md`. Therefore creation of the GOV-CHAT-074 Pull Request requires the current v3.3 snapshot with exact current `main SHA`, exact branch-head SHA, bounded changed-file/scope report, correlation result, truthful validation evidence and intended exact PR title. Any intervening main/head/scope/title/conflict-state change invalidates that approval and requires a fresh correlation/snapshot.

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

Current main advanced after branch creation through terminal PR #869 and PR #870. The resulting current-main-only changed paths were:

- `docs/architecture/DOCUMENTARY_D8_MIGRATION_PLANNING.md`;
- `docs/architecture/DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP.md`;
- `docs/projects/documentary/ROADMAP.md`;
- `scripts/automation/dependencySecurity.ts`;
- `tests/unit/dependencySecurity.test.ts`.

These paths are disjoint from the bounded GOV-CHAT-074 change set. They were synchronized into the branch through merge commit `c3d34418e537d59db18f2f98f16071140f417aa0` without importing historical Approval/NIST/M10/Owner-response semantics.

Immediately before this evidence commit:

- current main: `5664332aac99befa819abbbc2cf23c30a8982147`;
- branch head: `fb8c1efb2920e46c0dd5677ae3262d987c4e815c`;
- compare state: **14 ahead / 0 behind**;
- merge base: exact current main;
- open Pull Requests: **none**;
- changed-file/open-writer/semantic/namespace/authority correlation: **PASS**;
- project/PVC/Primary Owner resolution: **PASS** — `CAPITAL-AI-GOV`, `docs/projects/governance/`, `PVC-05`, `CAPITAL-AI-GOV / Platform Director`.

The final branch head produced by this evidence commit is intentionally not self-recorded here. It is read back externally after the commit and is the only branch-head SHA eligible for the immediately following v3.3 approval snapshot.

## Changed scope

The bounded GOV-CHAT-074 branch changes Governance authority/projection and non-production validation/tooling surfaces only: `/AGENTS.md`; Approval and Development-Chain policies; Governance registries/control-plane projections; ADR-0096 current-state wording; Governance project Roadmap/Register/README and this evidence; PR check classification; Approval-Envelope helper/tests; Governance manifest metadata; and focused Governance regression tests.

No Product Runtime, dependency manifest/lockfile, deployment workflow, provider configuration, external platform, billing, IAM, secret, DNS or production data mutation is part of this work item.

## PR class

Current-main `docs/governance/PR_CHECK_CLASSIFICATION.md` classifies pure tests and `scripts/pr/**` / Governance validation tooling as `C-N — non-production validation/tooling`, `production_impact=false`, absent a productive path. The only `src/**` change in this branch is `src/platform/Governance/manifest.json`; current-main repository search identifies that path as an input of `scripts/governance/validateGovernanceControlPlane.mjs` and no productive runtime consumer was identified. The bounded slice is therefore classified **C-N / production_impact=false**, subject to the exact PR-head hosted classification/checks after PR creation.

## Validation evidence

Executed against the branch-local Approval-Envelope helper/test payload before later documentation/projection-only commits; no later commit changed either helper file:

- `node --check scripts/pr/approvalEnvelope.mjs` — **PASS**;
- `node --check scripts/pr/approvalEnvelope.test.mjs` — **PASS**;
- `node --test scripts/pr/approvalEnvelope.test.mjs` — **PASS, 15/15 tests, 0 failures**.

The focused negative matrix covers unrelated main drift, synchronization-only head drift, material payload changes, explicit material-equivalence proof, semantic/authority/open-writer/security blocking, failed validation, conflict-resolution payload changes, malformed SHA evidence and prohibited agent merge attempts.

Additional current-state evidence:

- current-main `/AGENTS.md` v2.9.0 fully re-read — **PASS**;
- current Project/PVC/Primary Owner mapping re-read — **PASS**;
- current-main Human Owner PR Approval Policy v3.3.0 re-read — **PASS**;
- current-main PR template `CAPITAL_AI_PR_TEMPLATE_VERSION: 1.5.0` re-read — **PASS**;
- current-main PR Check Classification re-read — **PASS**;
- main/open-PR/branch compare recorrelation before this evidence commit — **PASS**;
- full Vitest suite — **NOT RUN** in a complete branch checkout;
- full Governance CLI/validator — **NOT RUN** in a complete branch checkout;
- hosted GitHub checks — **NOT RUN pre-PR**;
- Production Build/CSP/Predeploy/Docker — **NOT REQUIRED / NOT RUN** for the current C-N classification;
- deployment/provider/external mutation — **NOT REQUIRED / NOT RUN**.

`NOT RUN` is not represented as `PASS`.

## Exit-gate state

The branch is ready for the mandatory final readback. PR-create readiness is established only if that readback still shows the same current main, no conflicting open writer, branch `0 behind`, the final evidence commit as branch head, unchanged bounded scope/title intent, and correlation PASS. The current v3.3 Human/Owner approval snapshot may then be emitted for those exact SHAs.
