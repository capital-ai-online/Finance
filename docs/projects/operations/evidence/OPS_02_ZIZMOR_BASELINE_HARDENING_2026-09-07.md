# OPS-02 zizmor workflow baseline hardening — 2026-09-07

Status: IMPLEMENTED_PR / HOSTED_REMEDIATION_EVIDENCE_READY
Primary Owner: CAPITAL-AI-OPS
Primary PVC: PVC-02 — Controlled Implementation
Affected PVC: PVC-06 — Version Management for the node-toolchain target surface only
Branch: agent/operations-zizmor-baseline-hardening-20260907
Original base main SHA: fe27d901a7a505b1e0b87f8970e3f4a33991d968
Current correlated main SHA before this evidence-only sync: 8ab11ae749639a67c28b3d685f4943df19b9e72c
Roadmap: docs/projects/operations/ROADMAP.md, OPS-02 (ACTIVE)
Authority: AGENTS.md 2.8.1; Development Chain Execution Policy 2.5.1; ESS-0019 1.2.0; ADR-0053 remains authoritative for the Node 24.18.0 toolchain baseline.
This bounded remediation is implementation evidence, not new policy or Security verification authority.

## Cause and scope

PR #836 introduced the repo-local zizmor workflow over all GitHub Actions workflows and is now Human-merged as merge SHA `92086e0d5f17a7490f7c1a64ac282dcfd3fcbfc1`. Its exact pre-merge PR head `a1ce233d73933444f608f16f52188176ad228f35` produced the failing hosted scanner run used as the immutable source finding baseline.

Run 34152719927, job 101838149670, exact PR head `a1ce233d73933444f608f16f52188176ad228f35` failed with exit 14. The actual workflow execution used zizmor 1.29.0; the PR #836 narrative's 1.30.0 statement is therefore stale historical metadata. These diagnostics concern workflow security; they do not prove that a production deployment SHA or baseline-body hash is wrong.

The complete hosted scanner log and the local reproduction establish 21 findings. The hosted log emits 13 notices, one warning and seven errors; GitHub's check UI reports 19 annotations, so the scanner log is the finding-count source of truth for this evidence.

| Finding | Before | After without ignores | Resolution |
| --- | ---: | ---: | --- |
| template-injection | 14 | 0 | Transport report outputs/dispatch input through env; quoted shell expansion |
| excessive-permissions | 4 | 0 | Empty workflow permissions; explicit read/write permissions per job |
| obfuscation | 1 | 0 | Static quoted false expression; historical job stays disabled |
| dangerous-triggers | 2 | 2 | Retain completion triggers with strengthened boundaries and two documented local exceptions |

No severity threshold, global ignore, continue-on-error or scanner bypass is introduced.

### Hosted error ownership and bounded remediation

| Hosted error finding | Target Project / Primary Owner | PVC | Smallest bounded remediation |
| --- | --- | --- | --- |
| `.github/workflows/node-toolchain-write-boundary-supersession.yml:221` — template injection | `CAPITAL-AI-OPS` | `PVC-06 — Version Management` | Move report values through explicit environment variables; do not alter the Node-version decision or execute the blocked 24.20.0 supersession. |
| `.github/workflows/pr-production-baseline-post-merge-refresh.yml:15` — `actions: write` at workflow scope | `CAPITAL-AI-OPS` | `PVC-02 — Controlled Implementation` | Empty workflow-level permissions and grant the required write scopes only to the writer job. |
| `.github/workflows/pr-production-baseline-post-merge-refresh.yml:17` — `pull-requests: write` at workflow scope | `CAPITAL-AI-OPS` | `PVC-02 — Controlled Implementation` | Same least-privilege writer-job slice as above. |
| `.github/workflows/pr-production-baseline-post-merge-refresh.yml:9` — `workflow_run` dangerous trigger | `CAPITAL-AI-OPS` | `PVC-02 — Controlled Implementation` | Retain the required completion architecture only with exact repository/head-repository/path/event guards, trusted-main execution, isolated output and a visible scoped zizmor exception. |
| `.github/workflows/pr-production-baseline-refresh.yml:24` — `actions: write` at workflow scope | `CAPITAL-AI-OPS` | `PVC-02 — Controlled Implementation` | Empty workflow-level permissions and grant the required write scopes only to the writer jobs. |
| `.github/workflows/pr-production-baseline-refresh.yml:26` — `pull-requests: write` at workflow scope | `CAPITAL-AI-OPS` | `PVC-02 — Controlled Implementation` | Same least-privilege writer-job slice as above. |
| `.github/workflows/pr-production-baseline-refresh.yml:18` — `workflow_run` dangerous trigger | `CAPITAL-AI-OPS` | `PVC-02 — Controlled Implementation` | Same trusted-source and isolated-output completion-trigger hardening, backed by the shared regression test. |

`CAPITAL-AI-GOV / PVC-05` remains the Governance/Development-Chain authority owner and `CAPITAL-AI-SEC` remains the independent finding/verification role. This remediation changes workflow implementation boundaries only; it does not create or supersede Governance policy, Security verification authority or ADR-0053.

## Privileged completion-trigger review

The existing completion-driven architecture needs to refresh PR bodies after read-only Governance completes, after trusted branch synchronization and after verified main deployment. Replacing `workflow_run` with a PR-controlled reusable call would require a separate redesign of caller privileges and timing. Reuse of the existing trusted writer is the bounded path here.

Each accepted source is constrained by repository, head repository, exact workflow path and event; main sources additionally require successful push/main completion. Fork source runs are excluded. Existing live open/same-repository/main PR checks, immutable head/main correlation, production identity checks, exact Governance-run selection and bounded rerun recovery remain in place.

Executed scripts and imports originate in the separate trusted-main policy checkout. PR checkout is Git/JSON data only: no PR script, dependency install, cache restore or downloaded artifact is executed. Checkout credentials remain unpersisted. Baseline JSON now lives under `runner.temp` rather than the PR checkout, preventing PR-controlled artifact-directory symlinks from redirecting generated baseline writes. Write scopes remain only on the three writer jobs; discovery jobs remain read-only.

The two inline `dangerous-triggers` exceptions are deliberately visible and regression-covered. With `--no-ignores`, both trigger findings remain; the default hosted zizmor PASS is not proof that every possible `workflow_run` risk has been eliminated.

## Validation

### Exact PR #836 head `a1ce233d73933444f608f16f52188176ad228f35`

- `build-and-test`: PASS.
- `PR Governance (Kosten / Workflow / Vorlage)`: PASS.
- `Hardened image / HIGH+CRITICAL CVE gate`: PASS at the scope gate; image/SBOM/Trivy execution was skipped because this scanner-only PR had no container scope.
- `GitGuardian Security Checks`: PASS; no secrets detected.
- `zizmor`: FAIL, exit 14; the 21 diagnostics above are the hosted finding baseline.
- `Deployment verifiziert / Render-Produktion`: NOT RUN / skipped for the PR scope.
- `Supabase Preview`: NOT RUN / skipped because the branch had no associated Supabase preview branch.
- Production build, CSP/predeploy, Docker image and provenance/deployment steps inside the PR CI path: NOT RUN / classifier-skipped for the bounded C-N scanner scope.

### Remediation branch / PR #839

- zizmor 1.29.0 offline, regular persona, workflows collection: 21 pre-hardening findings, exit 14; hardened workflow set, exit 0 under the normal persona.
- Unfiltered hardened scan with `--no-ignores`: exactly two `dangerous-triggers` findings remain, exit 14.
- Combined local overlay with the unchanged #836 scanner: `--strict-collection`, exit 0 under the configured/default scan behavior.
- `node --test scripts/pr/productionBaselineRefreshWorkflow.test.mjs scripts/pr/productionBaselineBody.test.mjs`: 11/11 PASS. Includes actual Bash execution with hostile command-substitution/quote payloads, no injected file created, plus baseline body/idempotency and source/output boundary regression checks.
- YAML parsing of the pre-hardening workflow collection: PASS.
- Local runtime: Node 24.19.0; canonical repository Node 24.18.0 was not changed.
- Hosted PR #839 head `4cf212a78dde7156167c09265beebf56027ead7f` before this evidence-only sync: Governance PASS, zizmor PASS, Container Security PASS and `build-and-test` PASS. The deployment-verification PR job remained skipped as expected for a pre-merge PR.
- Live execution of the retained completion-trigger paths after Human merge remains separate post-change evidence and is not claimed here.

## Correlation and completion

Current `main@8ab11ae749639a67c28b3d685f4943df19b9e72c` contains the Human-merged scanner PR #836 and the Security roadmap synchronization PR #837. Open PRs at this correlation are #839 (this remediation) and #838 (Documentary registry/hygiene). PR #838 has no changed-file or semantic overlap with the workflow remediation.

PR #839 is the sole active writer for the five hardened workflow files, including all three Error-bearing target workflows named above. Creating a second remediation branch against those files would violate concurrent-writer control; the conflict-free remediation scope is therefore the existing PR #839 branch only.

The earlier sequence "merge hardening first, then synchronize #836" is superseded by actual repository state: #836 was Human-merged first and is now current-main scanner input. The correct remaining sequence is to keep #839 synchronized with current main, preserve exact-head hosted evidence, then leave merge to the Human/CODEOWNER decision. After merge, the now-main zizmor scanner provides the independent hosted revalidation surface for subsequent workflow changes.

No new Roadmap row is created: `OPS-02` already owns the bounded Controlled-Implementation hardening work. The node-toolchain Error is recorded as affecting `PVC-06`, but this remediation does not change the `OPS-06 / S1-R2-03` Node-version authority state because ADR-0053 still selects Node 24.18.0 and the patch does not execute a 24.20.0 supersession.

No production, deployment or external provider mutation was performed by this evidence sync. Human/CODEOWNER merge and independent Security assurance remain separate.

## Sources and reuse

- [zizmor audit rules](https://docs.zizmor.sh/audits/): specialized MIT-licensed static analyzer already selected by PR #836; reuse its pinned execution version, no custom scanner.
- [GitHub workflow_run semantics](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_run): completion-driven privileged context and untrusted-source risk.
- [Failed scanner run](https://github.com/SvenKulessa/Finance/actions/runs/34152719927): immutable hosted source-finding evidence for PR #836 head `a1ce233d73933444f608f16f52188176ad228f35`.
