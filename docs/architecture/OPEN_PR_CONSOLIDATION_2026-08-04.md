# CAPITAL-AI — Open Pull Request Consolidation Evidence

**Date:** 2026-08-04  
**Repository:** `SvenKulessa/Finance`  
**Integration branch:** `integration/consolidated-open-prs-2026-08-04`  
**Base after direct CSP merge:** `main@6bcab71c16fe5691688f2d58b4daa30aa51eb716`  
**Release version:** `0.6.0`  

## 1. Purpose

This document records the conflict-safe consolidation of the previously open Pull Requests into one reviewable integration branch. The consolidation preserves source history, prevents duplicate-file overwrite, resolves document-number collisions and separates GitHub code integration from Supabase production mutation.

## 2. Directly merged prerequisite

PR #88 (`fix: remediate ADR-0035 CSP runtime and safe rollout`) was directly merged into `main` on explicit owner instruction with expected-head protection.

- source head: `73e64892547da8ab39c3ca2eb7e4b02e73e712cd`;
- resulting `main` merge commit: `6bcab71c16fe5691688f2d58b4daa30aa51eb716`;
- the consolidation branch was created from this exact commit.

## 3. Source PR classification

| PR | Classification | Integration decision |
|---|---|---|
| #78 | Source | Render runtime remediation merged into the integration branch. |
| #80 | Source | Stateless Render web-tier audit merged as documentation/evidence. |
| #81 | Exact duplicate | Closed without merge because it had the same head SHA and same ten changed files as #85. |
| #83 | Source | Server modularization scaffold merged as an isolated source set. |
| #84 | Source with shared-file conflict | Version Manager convention validator merged; shared governance workflow later reconciled with #86. |
| #85 | Canonical successor to #81 | Binance landing analysis and ESS-0015 API inventory merged. |
| #86 | Source with shared-file conflict | Six conflict-free files carried over; `pr-governance.yml` semantically reconciled with #84; original PR closed as superseded. |
| #87 | Source with identifier collision | Content preserved under ESS-0016 and ADR-0041; original colliding ESS-0015/ADR-0038 assignments not merged. |
| #88 | Direct prerequisite | Merged directly to `main` before consolidation. |

## 4. Identical-file and overlap controls

### 4.1 PR #81 versus PR #85

Both PRs pointed to the exact source head:

```text
2325de7fd855d4a32b949e8b3490e2c34eaf2542
```

Both changed the same ten files. Only PR #85 was integrated. PR #81 was closed as an exact duplicate, preventing double application and preserving the canonical history in one source PR.

### 4.2 PR #84 versus PR #86

Both changed:

```text
.github/workflows/pr-governance.yml
```

The final workflow preserves both intended responsibilities:

- dependency installation and production vulnerability audit;
- TypeScript, tests, production build and deployment-readiness as blocking technical gates;
- Version Manager repository-convention validation as advisory;
- changed-workflow security against trusted `main`;
- immutable Action SHAs and `persist-credentials: false`;
- production drift and optional work claims as advisory process evidence rather than build authorization;
- explicit human authorization for PR creation and protected merges.

No complete version of one PR's workflow was allowed to overwrite the other.

### 4.3 PR #85 versus PR #87 identifier collision

PR #85 already assigned:

```text
ESS-0015 = API Interface Inventory & QA Governance
ADR-0038 = Binance Landing AI Quick Analysis
```

PR #87 attempted to use the same identifiers for a different market-data architecture. Its content was therefore migrated without semantic loss to:

```text
ESS-0016 = Enterprise Market Data Provider & MCP Governance
ADR-0041 = Enterprise Market Data Provider & MCP Architecture
```

The ESS registry now advances the next free number to `ESS-0017`.

## 5. Version integrity

The integration branch retains one release identity:

```text
package.json      name=capital-ai version=0.6.0
package-lock.json name=capital-ai version=0.6.0
```

PR #84 adds repository validation scripts but does not change the release version. No dependency declaration was changed without a corresponding lock-file state.

## 6. Supabase boundary

The connected production project is `AIFINANCIAL` (`ryzywoktpmyhwzxmstyu`, `eu-west-1`). Its migration history was inspected read-only through the latest recorded migration:

```text
20260802172425 harden_stripe_function_search_paths
```

The consolidated GitHub changed-file set contains no Supabase migration, schema or Edge Function file. Therefore this consolidation performs:

- no production DDL;
- no production DML;
- no branch merge in Supabase;
- no Edge Function deployment;
- no authentication-policy mutation;
- no secret or publishable-key mutation.

Supabase findings contained in the API QA documentation remain evidence and follow-up work, not implicitly applied production changes.

## 7. Code-loss prevention rules applied

1. Source PRs were retargeted to a dedicated integration branch rather than merged independently into `main`.
2. Every retargeted merge used the source PR's immutable expected head SHA.
3. Exact duplicates were closed rather than applied twice.
4. Shared files were semantically reconciled instead of accepting last-writer-wins behavior.
5. ESS/ADR collisions were renumbered and registered before the final PR.
6. `package.json` and `package-lock.json` remain aligned at version `0.6.0`.
7. Supabase production state remained read-only.
8. The final integration branch is ahead of, and not behind, its `main` base.

## 8. Final validation gate

The final consolidation Pull Request must remain a Draft until the integration head has been evaluated by:

- repository CI;
- TypeScript/type checking;
- the complete unit-test suite;
- production build;
- deployment-readiness checks;
- protected Google Marketing/CSP checks where triggered;
- changed-workflow security;
- repository-convention advisory output;
- human/CODEOWNER review for protected architecture and workflow changes.

A green build is technical evidence only and does not itself authorize merge or deployment.
