# QM-PR900-01 — Deterministic PR-Class Matrix Assurance

**Project:** `CAPITAL-AI-QM`  
**Owner/PVC:** `CAPITAL-AI-QM / cross-cutting; no productive PVC`  
**Assurance baseline:** `main@4c4a88e7f83150191c81134439e7bc9a1145ad4a`  
**Date:** 2026-09-22  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Roadmap item:** `QM-PR900-01`  
**Result:** `ASSURANCE_COMPLETE_WITH_OWNER_HANDOFF`  
**Foreign-owner handoff:** GitHub Issue #1274 → `CAPITAL-AI-OPS`

## 1. Scope and independence

This evidence revalidates the already materialized PR scope classifier, validation planner, exact-head preflight contract and selective provider controls. It does not create a second classifier, CI topology, Required-Check authority or merge authority.

QM changes no OPS/GOV/SEC implementation in this slice. Any implementation gap is routed to the canonical owner and remains independently verifiable by QM.

## 2. Current-main evidence set

| Surface | Current-main identity | Assurance use |
|---|---|---|
| `scripts/pr/classifyPrScope.mjs` | blob `2dcd098ebf4a15e9165445e0fc25b79191fe4985` | PR class D/C/R and production-impact projection |
| `scripts/pr/planPrValidation.mjs` | blob `d1821b7826f9cd5f995300150b33da696bed7b78` | `none/focused/full` validation planning, provider-neutral selection, preflight evidence |
| `scripts/pr/planPrValidation.test.mjs` | blob `6d7bd00170076a61e08333352897e895d76553c8` | deterministic matrix regression coverage |
| `scripts/pr/preflightEvidence.test.mjs` | blob `f77e886ae0c23a376f183f65fc3024517d9a7bee` | `NOT_RUN` truthfulness and exact-identity fingerprint behavior |
| `scripts/pr/trustedPolicyBundle.test.mjs` | blob `54b433f72242ec0706ddc1da6f126b08b4c51835` | trusted-base classifier/planner loading |
| `scripts/pr/selectiveProviderWorkflows.test.mjs` | blob `13c336ade4a80b299887bfbf4859b9a7289f5b9c` | bounded CodeQL/review provider fan-out |
| `.github/workflows/oss-quality-assurance.yml` | blob `c0e364316c8d039fcd9ff8dc2a97a98eddd686bf` | `PR_FAST` Gitleaks/OSV lane |
| `.github/workflows/oss-quality-deep-assurance.yml` | blob `bb8edbb8a6786cf433d831623d635ae2b77861b8` | scheduled `DEEP_BASELINE` coverage/Knip/jscpd lane |

The planner is loaded from the trusted PR base in the normal CI path. Main pushes are force-full. Exact-snapshot reuse remains an explicit CI concern and is not represented as a fourth planner profile.

## 3. Deterministic assurance matrix

| Change scope | PR class | Validation profile | Test capsule | CodeQL / review capsule | Evidence verdict |
|---|---:|---:|---|---|---|
| Documentation / `.ai` only, no runtime consumer | D | NONE | no software tests | CodeQL none; automated review none | proportionate; no software PASS is synthesized |
| Documentary artifact consumed by runtime/test/workflow code | C | FULL | full Vitest + bounded Node validators | full CodeQL + full review | fail-closed escalation |
| Vitest test-only | C | FOCUSED | changed Vitest | CodeQL none; review none | smallest sufficient test scope |
| `scripts/pr/*.test.mjs` / focused validation tests | C | FOCUSED | focused Node PR tests | CodeQL none | smallest sufficient non-Vitest scope |
| Normal bounded `src/**` application change | C | FOCUSED | changed Vitest | targeted language CodeQL + targeted review | risk-proportionate |
| Security/Auth/Billing/Entitlement-sensitive source | C | FULL | full tests | full CodeQL + full review | fail-closed high-risk escalation |
| Server/runtime/deploy surface | R | FULL | full validation contract | full/high-risk controls; runtime/security lanes remain separate | fail-closed runtime escalation |
| Dependency manifest / lockfile | R | FULL | full tests + dependency/audit scope | CodeQL may be none; review full | dependency risk is not mistaken for source-code CodeQL coverage |
| CI/provider-control workflow | C/R depending runtime/deploy role | FULL | full tests | Actions CodeQL + full review + workflow security | prevents self-demotion |
| Ordinary non-deploy workflow | C | FOCUSED | no Vitest when unrelated | targeted Actions CodeQL + full review + workflow security | bounded while retaining workflow review |
| Unknown non-documentary path | C unless separately runtime-classified | FULL | full tests | all-language full CodeQL + full review | unknown scope fails closed |
| Push to `main` / explicit force-full | R | FULL | full suite | full provider-neutral plan | no selective shortcut on main |

## 4. Exact-head and evidence-truthfulness checks

The preflight contract binds `base_sha`, `head_sha` and `tree_sha`, carries the PR class and validation profile, lists selected tests and records the expected exact-head contexts:

- `GitGuardian Security Checks`
- `Hardened image / HIGH+CRITICAL CVE gate`
- `PR Governance (Kosten / Workflow / Vorlage)`
- `build-and-test`

Preflight result states are bounded to `PASS | FAIL | NOT_RUN`. Missing execution defaults to `NOT_RUN`; invalid synthetic states such as `ASSUMED_PASS` are rejected. This satisfies the core requirement that not-run evidence cannot become PASS.

The current tests also prove that runtime-consumed documentation and unknown paths escalate rather than silently taking the docs-only fast path.

## 5. Provider-selection finding

### QM-F-PR900-01-A — PR_FAST execution evidence unavailable

PR #1244 merged the new OSS Quality split as merge commit `71087c960f8c1e99d4b0d48252bece14b120bd28`. CURRENT_MAIN contains both the PR-fast and deep workflows.

However, exact-head readback for PR #1273 at `b5d0ea081aa1a3230ee1bdb9ffd9c3a9ff009963` shows pull-request workflow runs for CI, Governance, Container Security, Zizmor, Project Execution Directive validation and PR automation, but no `OSS Quality Assurance` run. PR #1273 changes `server/**`, which is inside the current `oss-quality-assurance.yml` path filter.

Therefore the intended PR_FAST execution for this relevant exact snapshot is `NOT_AVAILABLE`. Absence is not promoted to PASS.

### QM-F-PR900-01-B — Preflight topology projection is stale/ambiguous

The current preflight quality selection marks:

- Gitleaks for any changed file;
- OSV only for dependency-manifest changes;
- Knip/jscpd for source/test impact;
- Zizmor for workflow-security scope.

The current OSS workflow topology after PR #1244 instead defines:

- `PR_FAST`: Gitleaks + OSV for every PR that actually enters the workflow;
- `DEEP_BASELINE`: Vitest coverage + Knip + jscpd once daily/manual.

The preflight remains truthful about execution state because selected tools default to `NOT_RUN`; it does not fabricate PASS. But “planned/relevant” semantics no longer map cleanly to the materialized PR_FAST/DEEP_BASELINE execution topology.

## 6. Owner-correct handoff

Both findings are routed to `CAPITAL-AI-OPS` as Issue #1274 because the required remediation concerns GitHub Actions execution/registration and the OPS-owned preflight/CI planning surface.

Required return evidence:

1. one current relevant PR exact-head where `OSS Quality Assurance / PR_FAST` is observably triggered and terminal;
2. a measured PR_FAST duration for that exact head;
3. preflight fields aligned with the actual PR_FAST/DEEP_BASELINE topology, with `NOT_APPLICABLE`, `NOT_RUN`, `FAIL` and `PASS` remaining distinct;
4. unchanged Required Checks, Security controls and Human/CODEOWNER merge semantics.

## 7. QM-PR900-01 exit assessment

`QM-PR900-01` reaches a terminal assurance outcome:

- deterministic D/C/R + NONE/FOCUSED/FULL mapping is evidenced from CURRENT_MAIN;
- docs-only and focused optimization do not remove the four expected exact-head merge-safety contexts;
- high-risk, runtime-consumed, dependency, CI-control and unknown scopes escalate fail-closed;
- optional provider controls remain non-authorizing;
- missing execution remains `NOT_RUN` or `NOT_AVAILABLE`, never synthetic PASS;
- the observed OSS provider-execution/projection mismatch is explicitly owner-routed rather than hidden or repaired inside QM.

The finding does not authorize QM to mutate OPS CI. It also does not convert optional OSS evidence into a new Required Check. `QM-PR900-02` may become the next QM assurance item after this terminal outcome, while Issue #1274 remains an owner-correct external dependency for PR_FAST execution evidence.
