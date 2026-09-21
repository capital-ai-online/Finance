# OPS OSS Code Review Supersession — 2026-09-21

**Canonical identity:** `OPS-OSS-REVIEW-SUPERSESSION-2026-09-21`  
**Project:** `CAPITAL-AI-OPS`  
**Canonical folder:** `docs/projects/operations/`  
**PVC relationship:** `PVC-02 / Controlled Implementation`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Observed baseline:** `main@d6be9db867d058d057c39df6e93e49fe3c875145`  
**Status:** `OWNER_DIRECTED_SUPERSESSION / PR_PENDING`  
**Authority:** evidence/status only; this document does not create repository execution authority.

## Owner direction

The Human Owner directed removal of the automatic OSS review check from the pipeline because it consumes excessive GitHub Actions runner minutes.

The former automatic `.github/workflows/oss-code-review.yml` execution path is therefore superseded. The workflow file remains only as an inert tombstone so repository Security deletion controls do not need to be weakened or bypassed.

## Superseded execution

The former workflow automatically started two Ubuntu runner jobs on matching pull requests:

1. `DeepSeek AI Review`;
2. `Semgrep CE + reviewdog`.

The superseded workflow now has:

- only `workflow_dispatch`;
- no automatic PR/push/schedule/workflow-run trigger;
- `permissions: {}`;
- one statically false job (`if: false`);
- no external action, model, Semgrep or reviewdog execution.

A manual dispatch can therefore create only a skipped workflow run; the tombstone does not allocate a hosted runner.

The workflow contract test is retained but inverted: it now prevents silent reactivation of automatic triggers or the retired semantic-review implementations.

## Preserved controls

This change does **not** disable or weaken the separate current controls below:

- `.github/workflows/oss-quality-assurance.yml` (Gitleaks, OSV Scanner, real Vitest V8 coverage, Knip/jscpd and unified quality evidence);
- selective CodeQL;
- GitGuardian;
- container HIGH/CRITICAL CVE gate / Trivy path;
- Zizmor;
- PR Governance;
- ordinary `build-and-test`;
- Human/CODEOWNER merge authority.

No substitute semantic-review PASS is claimed. A superseded/not-running OSS review is not represented as PASS.

## Required-check correlation

Repository ruleset readback on the observed baseline shows the current required status contexts as:

- `GitGuardian Security Checks`;
- `Hardened image / HIGH+CRITICAL CVE gate`;
- `PR Governance (Kosten / Workflow / Vorlage)`;
- `build-and-test`.

Neither `DeepSeek AI Review` nor `Semgrep CE + reviewdog` is a required status context on this baseline. Superseding their automatic workflow therefore does not intentionally create an orphaned required check.

## Security and workflow-lint correlation

The first exact-head Governance run correctly rejected physical deletion of the previously automatic workflow because `scripts/security/verifyChangedWorkflowSecurity.mjs` permits deletion only for reviewed unused dispatch-only workflows.

That finding is resolved without weakening Security policy: the final change retains the path as an inert, non-automatic, zero-runner tombstone. The Security deletion registry and validator remain unchanged.

A subsequent Zizmor run rejected the expression-wrapped constant condition as unnecessarily obfuscated. The final tombstone uses the static form `if: false`, preserving the zero-runner contract without the lint finding.

## Owner-correct handover

`docs/projects/quality-management/work-packages/QM_OSS_CODE_QUALITY_01.md` contains a current-text statement that Semgrep + reviewdog remain owned by the OSS code-review path. That file belongs to `CAPITAL-AI-QM` and is not mutated by this OPS change.

**Handover:** `CAPITAL-AI-OPS → CAPITAL-AI-QM`  
**Finding:** after this supersession merges, that specific current-text statement is stale projection drift.  
**Dependency:** Human/CODEOWNER merge of this OPS supersession.  
**Exit condition for QM:** reconcile the non-duplication text to the then-current pipeline without reactivating the retired OSS review workflow or inferring a replacement PASS.

This handover transfers no Quality ownership to OPS.

## Exit evidence

The OPS supersession is complete only when:

1. the exact PR head exposes no automatic trigger in `.github/workflows/oss-code-review.yml`;
2. the tombstone job is statically false and no retired DeepSeek/Semgrep/reviewdog implementation remains;
3. the workflow-specific contract test guards that retired state;
4. the separate OSS Quality Assurance and required Security/Governance/build controls remain present;
5. the QM stale-projection handover is recorded without foreign-owner mutation;
6. exact-head validation and repository readback are truthful;
7. Human/CODEOWNER merge occurs under the active repository contract.

Historical evidence is preserved and does not reactivate superseded execution.
