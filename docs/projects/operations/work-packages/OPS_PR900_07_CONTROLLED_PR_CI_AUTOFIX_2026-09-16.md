# OPS-PR900-07 — Controlled PR CI Autofix

**Project:** `CAPITAL-AI-OPS`  
**Project folder:** `docs/projects/operations/`  
**Primary PVC:** `PVC-02 — Controlled Implementation`  
**Primary Owner:** `CAPITAL-AI-OPS`  
**State:** `MATERIALIZED_BRANCH / PROVIDER-COST-GATED / FINAL_REQUIRED-CHECK-AUTHORITATIVE`  
**Trust root:** `/AGENTS.md@current-main`  
**Baseline:** `main@aaf246511cc75c525a56ec13728504ee5516b6c3`

## Objective

Turn a failed Pull Request `build-and-test` result into a bounded `detect -> classify -> patch -> revalidate -> write` control loop without restoring the retired M10 runtime, without reactivating the previous unrestricted Self-Heal workflow and without creating a second CI or merge authority.

The new flow is implemented by `.github/workflows/controlled-pr-ci-autofix.yml` plus trusted-base planners/guards under `scripts/pr/`. The existing `.github/workflows/self-heal-ci.yml` remains manual, read-only and suspended.

## Authority and ownership

- `CAPITAL-AI-OPS / PVC-02` owns the controlled implementation surface.
- `/AGENTS.md` remains the repository trust root.
- ADR-0073 keeps `build-and-test` as the single repository-hosted technical Required Check.
- Human/CODEOWNER remains the only merge authority.
- CAPITAL-AI-SEC remains the independent Security verification owner where a Security return is required.
- This package grants no provider, billing, IAM, deployment, production, secret or controller authority.

## Trigger contract

The controller reacts only to a completed `CI` workflow run when all of the following are true:

1. source workflow path is `.github/workflows/ci.yml`;
2. source event is `pull_request`;
3. source conclusion is `failure`;
4. exactly one open PR resolves to the source `head_sha`;
5. PR base is `main`;
6. head repository is exactly `capital-ai-online/Finance` — forks/foreign repositories are denied;
7. `build-and-test` is the failed job;
8. the PR is below the two-attempt autofix ceiling.

Missing, ambiguous or stale identity evidence is a hard stop.

## Failure classes

### Deterministic engine — active without AI/provider spend

The first deterministic repair contract recognizes the repository-owned README projection failure:

```text
[readme-sync] README projection drift detected. Run: npm run readme:sync
```

For that exact signature the workflow may run the trusted repository projection, but the resulting patch must modify **only `README.md`** and must pass the generic patch guard before revalidation.

This is deliberately narrow. Additional deterministic fixers may be added only when their input signature, mutation surface and revalidation command are reproducible and bounded.

### Copilot engine — explicit cost/policy gate

TypeScript, test and Production-Build failures can be classified as candidates for GitHub Copilot CLI repair, but provider execution occurs only when repository variable:

```text
CAPITAL_AI_CI_AUTOFIX_COPILOT_ENABLED=true
```

is already set through an independently authorized repository/provider path.

The workflow does **not** create, enable or purchase a Copilot subscription/license and does not change repository variables. Missing/false configuration means `HELD_BY_COST_POLICY`, not failure and not PASS.

The CLI is pinned to `@github/copilot@1.0.83` for this slice. The agentic job owns only `actions:read`, `contents:read`, `pull-requests:read` and `copilot-requests:write`. It has no repository content-write permission. Tool access is restricted to file view/search/edit; shell, URL and memory tools are denied. The prompt treats repository content and CI logs as untrusted data.

## Protected scope — fail closed

Automatic patching is denied when the original PR touches protected/authority-sensitive surfaces, including:

- `/AGENTS.md`;
- `.github/**` and `.ai/**`;
- Governance, ADR or project-roadmap surfaces;
- `scripts/pr/**`, `scripts/security/**`, `scripts/governance/**`;
- dependencies/lockfiles/Node runtime;
- server, Docker, Render or Supabase/migration surfaces;
- Auth, Security, Billing, Entitlement, IAM, Secret or Credential paths.

Infrastructure/audit/Docker/deployment/supply-chain failures and unknown failure classes are not auto-fixed.

## Patch contract

A candidate patch must satisfy all of these conditions before it can advance:

- at most five modified files;
- modifications only — no create/delete/rename;
- no untracked files;
- no binary diff;
- at most 300 changed lines;
- `git diff --check` PASS;
- no recognized private-key/token-like material in the diff;
- deterministic README engine: only `README.md` may change;
- Copilot engine: every modified file must already be in the original PR changed-file set and must be a bounded source/test path;
- protected paths are denied even if an agent attempts to write them.

The same trusted-base verifier runs before artifact creation, after patch application in the read-only validation job and again in the privileged apply job.

## Privilege separation

```text
failed CI workflow_run
        |
        v
read-only plan
(actions/read + contents/read + pull-requests/read)
        |
        +---- deterministic patch job (contents/read)
        |
        +---- optional Copilot patch job
              (contents/read + copilot-requests/write; no repository write)
        |
        v
short-lived patch artifact + SHA-256
        |
        v
read-only validation
(apply patch -> guard -> selected lint/test/build -> exact git tree)
        |
        v
write-only apply/push
(contents/write; no npm/test/build/PR-code execution)
```

The privileged writer re-reads the open PR, exact head SHA/ref/repository, PR base SHA and current `main` immediately before mutation. Any drift stops the write. It then verifies the artifact hash, applies the patch, re-runs the trusted guard, compares the resulting `git write-tree` with the read-only validated tree, commits and pushes with an exact-head `--force-with-lease`.

## Loop and cost control

- maximum two commits matching `fix(ci-autofix): attempt ...` per PR;
- no identical-head retry loop;
- existing CI exact-snapshot/cost classification remains unchanged;
- deterministic fixers run before any AI-provider engine;
- Copilot requests are disabled unless the explicit repository variable is already `true`;
- no extra CodeQL, Docker or Production chain is started by the autofix controller itself;
- the validation job reruns only the failure-relevant class selected by the planner.

## Final CI boundary

The autofix controller never reports, synthesizes or impersonates `build-and-test`.

A patch may be pushed only after its exact resulting Git tree passed the bounded revalidation. The new PR head still requires authoritative hosted CI before merge readiness. A PR update performed with the workflow `GITHUB_TOKEN` can result in an approval-required Pull Request workflow run under GitHub's recursion protections. Fully unattended retriggering would require an independently authorized GitHub App/PAT controller identity; this package does not provision or assume one.

Until such a controller identity is explicitly authorized and proven, the repository remains safe rather than bypassing ADR-0073/M10 boundaries.

## Security model

Primary threats addressed:

- **fork/untrusted PR obtains privileged token** -> same-repository-only identity gate;
- **prompt injection from code/test/log** -> untrusted-data prompt + restricted tools + post-agent deterministic patch guard;
- **AI pushes directly** -> agentic job has no contents-write and no shell/Git tool;
- **privileged job executes malicious PR code** -> apply job performs only trusted guard/Git operations;
- **stale head/base overwrite** -> exact SHA/ref/repository/current-main re-read + force-with-lease;
- **failure fan-out / endless repair loop** -> max two attempts and one concurrency group per source head;
- **test weakening or scope escape** -> only existing originally changed source/test files, size ceiling and full failure-class revalidation;
- **secret material copied into patch** -> bounded log redaction plus secret-like diff denial;
- **synthetic CI green state** -> prohibited; final hosted `build-and-test` remains authoritative.

## Validation contract

Repository implementation is not considered proven merely because these files exist. Required evidence for this package is:

1. Node syntax/tests for both trusted planners/guards;
2. changed-workflow security validation;
3. YAML parse/readback;
4. hosted PR `build-and-test` and Governance/Security checks on the exact PR head;
5. at least one subsequent controlled failure exercise demonstrating either:
   - deterministic patch -> revalidation -> exact-tree write, or
   - an evidence-backed fail-closed/held outcome;
6. no automatic merge and no Direct-Main mutation.

`NOT RUN` is never represented as PASS.

## Rollback

Rollback is a fresh OPS branch/PR from then-current `main` that suspends `controlled-pr-ci-autofix.yml` to `workflow_dispatch`/diagnostic-only or removes its automatic trigger through the normal workflow-security-reviewed path. It must not restore the historical unrestricted Self-Heal implementation.

## Exit Gate

`OPS-PR900-07` reaches repository implementation exit only when safe/reproducible failures can enter the bounded control loop, protected/unknown cases fail closed, patch identity is exact-head/exact-tree bound, no privileged job executes untrusted PR code, loop/cost ceilings are enforced, and the final Required Check plus Human/CODEOWNER merge boundary remain unchanged.
