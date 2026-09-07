# OPS-02 zizmor workflow baseline hardening — 2026-09-07

Status: IMPLEMENTED_BRANCH / LOCAL_EVIDENCE_READY / HUMAN_PR_GATE_OPEN
Primary Owner: CAPITAL-AI-OPS
Primary PVC: PVC-02 — Controlled Implementation
Branch: agent/operations-zizmor-baseline-hardening-20260907
Base main SHA: fe27d901a7a505b1e0b87f8970e3f4a33991d968
Roadmap: docs/projects/operations/ROADMAP.md, OPS-02 (ACTIVE)
Authority: AGENTS.md 2.8.1; Development Chain Execution Policy 2.5.1; ESS-0019 1.2.0.
This bounded remediation is implementation evidence, not new policy or Security verification authority.

## Cause and scope

PR #836 introduces zizmor over all workflows, whereas scripts/security/verifyChangedWorkflowSecurity.mjs checks changed workflows for a smaller set of patterns (pins, explicit permissions, forbidden write-all/persisted credentials and concurrency). Existing workflows therefore passed the earlier baseline while containing zizmor findings.

Run 34152719927, job 101838149670, PR head a1ce233d73933444f608f16f52188176ad228f35 failed with exit 14. The actual zizmor.yml pins 1.29.0; the PR narrative's 1.30.0 claim is stale. Reproduction uses 1.29.0. These diagnostics concern workflow security; they do not prove that a production deployment SHA or baseline-body hash is wrong.

The complete local main scan reproduces 21 findings, including informational findings beyond the supplied annotation excerpt:

| Finding | Before | After without ignores | Resolution |
| --- | ---: | ---: | --- |
| template-injection | 14 | 0 | Transport report outputs/dispatch input through env; quoted shell expansion |
| excessive-permissions | 4 | 0 | Empty workflow permissions; explicit read/write permissions per job |
| obfuscation | 1 | 0 | Static quoted false expression; historical job stays disabled |
| dangerous-triggers | 2 | 2 | Retain completion triggers with strengthened boundaries and two documented local exceptions |

No severity threshold, global ignore, continue-on-error or scanner bypass is introduced.

## Privileged completion-trigger review

The existing completion-driven architecture needs to refresh PR bodies after read-only Governance completes, after trusted branch synchronization and after verified main deployment. Replacing workflow_run with a PR-controlled reusable call would require a separate redesign of caller privileges and timing. Reuse of the existing trusted writer is the bounded path here.

Each accepted source is constrained by repository, head repository, exact workflow path and event; main sources additionally require successful push/main completion. Fork source runs are excluded. Existing live open/same-repository/main PR checks, immutable head/main correlation, production identity checks, exact Governance-run selection and bounded rerun recovery remain in place.

Executed scripts and imports originate in the separate trusted-main policy checkout. PR checkout is Git/JSON data only: no PR script, dependency install, cache restore or downloaded artifact is executed. Checkout credentials remain unpersisted. Baseline JSON now lives under runner.temp rather than the PR checkout, preventing PR-controlled artifact-directory symlinks from redirecting generated baseline writes. Write scopes remain only on the three writer jobs; discovery jobs remain read-only.

The two inline dangerous-triggers exceptions are deliberately visible and regression-covered. With --no-ignores, both trigger warnings remain; local PASS is not proof of eliminating every possible workflow_run risk.

## Validation

- zizmor 1.29.0 offline, regular persona, workflows collection: 21 main workflows before, exit 14; hardened 21 workflows, exit 0, empty findings.
- Unfiltered hardened scan with --no-ignores: exactly two dangerous-triggers findings, exit 14.
- Combined local overlay with unchanged zizmor.yml from PR #836: 22 workflows, --strict-collection, exit 0, empty findings. The scanner file is not part of this branch's changed files.
- node --test scripts/pr/productionBaselineRefreshWorkflow.test.mjs scripts/pr/productionBaselineBody.test.mjs: 11/11 PASS. Includes actual Bash execution with hostile command-substitution/quote payloads, no injected file created, plus baseline body/idempotency and source/output boundary regression checks.
- YAML parsing of the 21 main workflow files: PASS.
- Local runtime: Node 24.19.0; canonical repository Node 24.18.0 was not changed.
- Full repository build, full Vitest suite, hosted CI and live completion-trigger execution: NOT RUN for this branch. Independent hosted checks remain required.

## Correlation and completion

Open PRs #836 (scanner only), #837 (Security roadmap projection) and #838 (Documentary registry/hygiene) have no changed-file overlap with this remediation. #836 is an explicit complementary dependency: its historical failed run cannot become green through a rerun until its checked-out workflows contain the fixes. Merge this independently reviewed hardening first, then synchronize #836 against current main and verify its new head.

No production, deployment, merge or PR-body mutation was performed. Human/Owner PR creation approval for the final main/head pair remains required. Human/CODEOWNER merge and independent Security assurance remain separate.

## Sources and reuse

- [zizmor audit rules](https://docs.zizmor.sh/audits/): specialized MIT-licensed static analyzer already selected by PR #836; reuse its pinned version, no custom scanner.
- [GitHub workflow_run semantics](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_run): completion-driven privileged context and untrusted-source risk.
- [Failed scanner run](https://github.com/SvenKulessa/Finance/actions/runs/34152719927): original failure evidence.

