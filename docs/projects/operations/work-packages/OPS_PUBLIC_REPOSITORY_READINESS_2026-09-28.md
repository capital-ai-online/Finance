# OPS Public Repository Readiness — 2026-09-28

**Project:** `CAPITAL-AI-OPS`  
**Primary PVC:** `PVC-02`; supporting `PVC-08`, `PVC-18`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Owner direction:** 2026-09-28 — harden `capital-ai-online/Finance` for a later public-visibility cutover and GitHub Sponsors funding surface  
**Baseline:** `main@2652185f8c06820f872c44b94372b2295ccb5146`  
**Branch:** `agent/operations-public-repository-readiness-20260928`  
**State:** `IMPLEMENTATION_ON_BRANCH / PUBLIC_VISIBILITY_MUTATION_HELD`  
**Merge authority:** `HUMAN_MERGE_REQUIRED`

## Scope

This package prepares the repository and existing GitHub Enterprise control surfaces for a later `private -> public` change without performing that visibility mutation. The proprietary `LICENSE` and `package.json#license=UNLICENSED` remain unchanged; public visibility is not treated as an open-source license grant.

The existing Enterprise branch ruleset `capital-ai-finance-main-governance` is bounded to organization `capital-ai-online`, repository `Finance`, and the default branch. It is hardened to no bypass actors, deletion/non-fast-forward denial, pull-request-only changes, one approving review, Code Owner review, stale-review dismissal, resolved review threads, merge-commit-only, and license compliance scanning. `require_last_push_approval` stays false so the single Human Owner is not deadlocked.

The existing repository `main-production-protection` remains the required-status-check authority. This package does not duplicate its four checks at Enterprise scope.

The canonical Draft-PR writer mints the existing repository GitHub App installation token only for `gh pr create`. This separates PR author identity from `@SvenKulessa`, allowing the sole Human Owner to supply the required Human/CODEOWNER approval. Callers pass only `CAPITAL_AI_GITHUB_APP_PRIVATE_KEY`; `secrets: inherit` is prohibited.

`.github/FUNDING.yml` points to `SvenKulessa`. It configures repository funding metadata but does not prove GitHub Sponsors enrollment and does not alter licensing.

## Public-cutover hold gates

Before changing visibility, the Human Owner must review historical Git/secret-scanning evidence, historical GitHub Actions logs, the intended proprietary/source-public licensing model, and fresh live provider readback of rulesets plus public-repository security features. Missing or stale evidence is never PASS.

GitHub App private-key material remains only in the existing secret store. Repository and Enterprise installation tokens are short-lived, masked and not persisted. The Enterprise writer exposes only fixed GET/PUT/GET behavior for the named ruleset and performs no visibility mutation.

## Exit evidence

Repository exit: fresh-main branch, no writer overlap, focused validation PASS, App-authored future PR creation, FUNDING/security/current-tree preflight on main, visibility still private.

Provider exit after Human merge: `GitHub Public Repository Readiness Hardening` reports `UPDATED_AND_VERIFIED` or `NOOP_ALREADY_HARDENED`, with one approval, Code Owner review on, last-push approval off, review-thread resolution on and no bypass actor. The later private-to-public change remains a separate Human Owner action.
