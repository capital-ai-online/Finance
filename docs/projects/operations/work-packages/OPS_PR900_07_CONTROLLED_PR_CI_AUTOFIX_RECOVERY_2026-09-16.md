# OPS-PR900-07 — Controlled PR CI Autofix Recovery

**Project:** `CAPITAL-AI-OPS`  
**Project folder:** `docs/projects/operations/`  
**Primary PVC:** `PVC-02 — Controlled Implementation`  
**Primary Owner:** `CAPITAL-AI-OPS`  
**Current parent package:** `OPS-02-CI-01 — Build/Test Cost & Scope Reduction`  
**Execution authority:** explicit Owner-directed bounded recovery scope  
**State:** `MATERIALIZED_BRANCH / README_DETERMINISTIC + CODEX_TYPESCRIPT_HANDOFF / LIVE_E2E_PENDING`  
**Trust root:** `/AGENTS.md@current-main`  
**Recovery baseline:** `main@afa259fc786479386a6ea0e165c3d8dc3363aae8`  
**Branch:** `agent/operations-pr-ci-autofix-codex-20260916`

## Owner-directed scope

This package is the fresh-current-main continuation of the Human-requested PR-CI autofix recovery. The historical branch `agent/operations-pr-ci-autofix-20260916` remains search input only and is not used as an integration base or validation authority.

`OPS-PR900-07` is a bounded execution child of the current `OPS-02-CI-01 — Build/Test Cost & Scope Reduction` package. It does not replace or reorder the canonical OPS Roadmap priority outside this explicit Owner-directed scope.

The bounded objective now contains two independent repair lanes:

```text
build-and-test FAIL
  -> read-only exact-snapshot detect/classify
  -> deterministic README repair
     OR
  -> bounded Codex Cloud PR-task handoff for eligible TypeScript failures
  -> ordinary PR-head validation / Human-CODEOWNER merge boundary
```

The historical unrestricted `self-heal-ci.yml` remains suspended/read-only. This package does not restore M10, does not add auto-merge and does not create a second Required Check.

## Recovery findings and reuse decision

The closed/unmerged historical design demonstrated that installing an agent runtime ad hoc inside a privileged post-CI workflow is not acceptable. Its Copilot CLI path installed `@github/copilot` outside the repository lockfile and failed workflow-security validation.

The current implementation therefore uses neither Copilot CLI nor Codex CLI and performs no `npm install` for an agentic fixer. It reuses the already-connected Codex GitHub integration that is independently observable through `chatgpt-codex-connector[bot]` reviews on active Finance pull requests.

Current OpenAI Codex GitHub documentation defines a PR-comment task surface using `@codex`, including `@codex fix the CI failures`, and states that Codex can push a fix back to the PR branch when the connected integration has permission. The repository controller uses only that existing provider surface; it does not install `openai/codex-action`, create an OpenAI API key, store an `OPENAI_API_KEY`, change Codex/GitHub permissions or create a new paid provider subscription.

Reference: <https://developers.openai.com/codex/integrations/github>

The separate `openai/codex-action@v1` integration is intentionally **not** used because its documented CI path requires an OpenAI API key stored as a GitHub secret. API-key/secret/provider setup remains outside this repository slice and would require its own current Owner/cost/secret authorization.

## Lane A — deterministic README repair

The repository-owned README version projection remains the deterministic automatic repair.

Exact failure signature:

```text
[readme-sync] README projection drift detected. Run: npm run readme:sync
```

The fixer reuses the trusted PR-base implementation `scripts/automation/syncReadmeVersions.ts`; dependencies are installed only with the committed lockfile using `npm ci --ignore-scripts`, and the repair command uses the already installed `tsx` binary via `npx --no-install`.

The candidate patch remains limited to exactly one modified file, `README.md`, and is revalidated in a read-only runner before an exact-tree writer may advance the same PR branch.

## Lane B — bounded Codex Cloud TypeScript handoff

The first agentic failure class is deliberately limited to the CI step `TypeScript prüfen`.

For an eligible TypeScript failure, the controller does **not** execute an LLM in a privileged Actions runner and does **not** give the `workflow_run` job repository-content write permission. Instead it:

1. resolves the exact source CI, PR, base SHA, head SHA, head ref and same-repository identity read-only;
2. requires the original PR changed-file scope to contain no protected path;
3. revalidates the still-open PR head and current `main` immediately before dispatch;
4. creates one bounded PR comment containing the exact source identity and `@codex fix the CI failures`;
5. instructs Codex to change only the existing PR branch, keep the patch minimal, run `npm run lint` plus the smallest directly affected tests, add no dependencies/secrets/provider permissions and never merge;
6. records a machine-readable attempt marker in the comment so retries remain bounded.

The handoff job has only `contents: read`, `pull-requests: read` and `issues: write`. It has no PR checkout, no dependency execution and no `contents: write` permission.

Codex itself is an implementation agent, not repository authority. Any commit it pushes remains ordinary PR-branch content and must pass the repository's normal CI/Governance/security checks plus Human/CODEOWNER merge authority.

## Eligibility and fail-closed gates

A failed CI snapshot can advance only when all of these are true:

1. source workflow is `.github/workflows/ci.yml` and event is `pull_request`;
2. source conclusion is `failure` and job `build-and-test` actually failed;
3. exactly one open PR maps to the source head SHA;
4. PR base is `main`;
5. head repository is exactly `capital-ai-online/Finance`;
6. head branch is agent-managed and not `main`;
7. fewer than two combined deterministic/Codex autofix attempts exist;
8. original PR scope contains no protected surface;
9. the failure class is either the exact README drift or `TypeScript prüfen`.

Protected original PR scope includes `/AGENTS.md`, `.github/**`, `.ai/**`, Governance/ADR/project-roadmap surfaces, `scripts/pr/**`, Security/Governance scripts, dependencies/lockfiles, Node runtime, Docker/Render, server/runtime, Supabase/migrations, Auth, Security, Billing, Entitlement, IAM, Secret and Credential surfaces.

Unknown, infrastructure, dependency-audit, Docker, deployment, supply-chain, test and production-build failures remain fail-closed. Test/build agentic expansion requires a separate evidence-backed follow-up rather than inheriting TypeScript eligibility.

### Loop guard

The maximum remains two attempts across both lanes. The controller counts:

- deterministic commits whose message begins with `fix(ci-autofix): attempt `; and
- Codex handoff comments containing `CAPITAL_AI_CI_AUTOFIX_CODEX_ATTEMPT`.

A source CI run may receive only one Codex task comment. Exact source-run identity is embedded in the marker and duplicate dispatch is suppressed.

## Privilege separation

```text
failed CI workflow_run
        |
        v
read-only plan
(actions/read + contents/read + issues/read + pull-requests/read)
        |
        +-------------------------------+
        |                               |
        v                               v
deterministic README lane         Codex TypeScript lane
(contents/read)                    (no checkout; no PR code execution)
        |                          contents/read + PR/read + issues/write
        v                               |
read-only validation                   v
        |                          bounded @codex PR task
        v                               |
exact-tree writer                      v
(contents/write; no checkout)     external Codex GitHub integration
                                   may push only to same PR branch
```

The deterministic privileged writer does not check out the PR. It re-reads PR/main/ref identity, verifies patch SHA-256 plus validated Git tree/blob, creates a child commit and updates the branch with `force: false`.

The Codex handoff job never obtains `contents: write`; its only mutation is the bounded task comment. This preserves separation between trusted post-CI orchestration and agent-produced branch content.

## Required-check and CI-retrigger boundary

The controller never creates a check run or commit status named `build-and-test` and never represents `NOT RUN` as PASS.

For deterministic writes performed with `GITHUB_TOKEN`, GitHub recursion protection means an unattended new PR CI run is still not proven. That lane therefore continues to require explicit live evidence before claiming end-to-end self-healing.

For the Codex lane, the intended continuation is different: Codex uses the existing external GitHub integration and, when that integration is permitted to push a fix to the PR branch, the resulting external branch update is expected to produce the ordinary PR `synchronize` lifecycle. This expectation is **not yet repository evidence**. Behavioral status remains `LIVE_E2E_PENDING` until a real eligible post-merge TypeScript failure proves:

```text
CI failure -> controlled task comment -> Codex task -> bounded same-PR commit -> PR synchronize -> authoritative CI
```

No synthetic status is created if any stage is absent.

## PR #982 correlation

PR #982 supplied the motivating real TypeScript failure and confirmed that the existing `workflow_run` controller triggers correctly. Its original changed-file set contains `docs/projects/**`, so it is intentionally **not** eligible for the new automatic Codex lane under the protected-original-scope rule.

The PR #982 TypeScript defect is repaired independently on its existing branch and therefore is not claimed as Codex-autofix behavioral evidence. Codex's P1 milestone-prevalidation and P2 pagination review findings were also incorporated into that PR branch as normal bounded corrections.

This separation prevents retrospective relabeling of a manually corrected failure as an automated proof.

## External provider / cost boundary

This repository slice performs no Codex/GitHub App installation, no permission grant, no OAuth mutation, no GitHub secret creation, no OpenAI API-key creation and no paid GitHub Advanced Security activation.

It reuses the already-active Codex GitHub integration only through the documented PR-comment task surface. Any future permission, billing, subscription, API-key, secret or provider-setting change remains separately Owner-controlled and is not implied by merge of this repository code.

## Validation contract

Repository implementation exit requires exact-head hosted evidence for the implementation PR:

1. `build-and-test` PASS for the applicable changed scope;
2. Governance/workflow-security PASS;
3. workflow security/zizmor-equivalent policy PASS, specifically with no ad-hoc agent package installation;
4. applicable selective provider/security checks PASS or truthfully classified by current policy;
5. planner tests prove TypeScript -> `codex-cloud`, protected-scope denial and two-attempt loop guard;
6. workflow tests prove no Codex CLI/API key, no Codex handoff `contents: write`, no PR checkout in the handoff job and no merge/check fabrication;
7. no merge by an agent.

Post-merge behavioral evidence then requires:

- one real eligible README failure to demonstrate the deterministic lane or a reproducible fail-closed result; and
- one real safe-scope TypeScript failure to demonstrate or falsify the full Codex task/commit/retrigger chain.

If the Codex GitHub integration does not react to an Actions-authored `@codex` task comment, the result is `PROVIDER_TRIGGER_NOT_SUPPORTED / HELD`, not PASS. A different provider identity or API-key action must not be introduced as a workaround without separate Owner/cost/secret authorization.

## Rollback

Rollback uses a fresh OPS branch from then-current `main` and removes the Codex handoff lane or suspends `controlled-pr-ci-autofix.yml` to deterministic/manual diagnostic operation through the normal workflow-security-reviewed PR path. It must not restore the historical unrestricted Self-Heal implementation.

## Exit gate

`OPS-PR900-07` repository implementation exit is reached when the deterministic lane plus bounded Codex TypeScript handoff pass exact-head hosted workflow/security checks with no ad-hoc agent installation and no authority regression.

Behavioral exit remains open until post-merge live evidence proves the expected provider trigger and ordinary PR-CI continuation. Human/CODEOWNER merge remains mandatory throughout.
