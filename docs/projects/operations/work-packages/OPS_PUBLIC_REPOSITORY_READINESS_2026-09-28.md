# OPS Public Repository Readiness — 2026-09-28

**Project:** `CAPITAL-AI-OPS`  
**Primary PVC:** `PVC-02`; supporting `PVC-08`, `PVC-18`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Owner direction:** 2026-09-28 — harden `capital-ai-online/Finance` for a later public-visibility cutover and GitHub Sponsors funding surface  
**Baseline:** `main@c1a10880a96b7406970ab6aaf7ea2637a2f77d71`  
**Merged implementation:** PR `#1514` → `c1a10880a96b7406970ab6aaf7ea2637a2f77d71`  
**Provider-auth remediation branch:** `agent/operations-public-readiness-provider-auth-fallback-20260928`  
**State:** `MERGED / PROVIDER_AUTH_REMEDIATION_ACTIVE / PUBLIC_VISIBILITY_MUTATION_HELD`  
**Merge authority:** `HUMAN_MERGE_REQUIRED`

## Scope

This package prepares the repository and existing GitHub Enterprise control surfaces for a later `private -> public` change without performing that visibility mutation. The proprietary `LICENSE` and `package.json#license=UNLICENSED` remain unchanged; public visibility is not treated as an open-source license grant.

The existing Enterprise branch ruleset `capital-ai-finance-main-governance` is bounded to organization `capital-ai-online`, repository `Finance`, and the default branch. Its desired state is no bypass actors, deletion/non-fast-forward denial, pull-request-only changes, one approving review, Code Owner review, stale-review dismissal, resolved review threads, merge-commit-only, and license compliance scanning. Both `require_last_push_approval` and the additional approval for unattributed agent/Copilot PRs stay false so the single Human Owner is not deadlocked.

The existing repository `main-production-protection` remains the required-status-check authority. This package does not duplicate its four checks at Enterprise scope.

The canonical Draft-PR writer mints the existing repository GitHub App installation token only for `gh pr create`. This separates PR author identity from `@SvenKulessa`, allowing the sole Human Owner to supply the required Human/CODEOWNER approval. Callers pass only `CAPITAL_AI_GITHUB_APP_PRIVATE_KEY`; `secrets: inherit` is prohibited.

`.github/FUNDING.yml` points to `SvenKulessa`. It configures repository funding metadata but does not prove GitHub Sponsors enrollment and does not alter licensing.

## Post-merge provider evidence

PR #1514 merged successfully, but post-merge workflow run `#36431654977` failed closed after:

1. exact CURRENT_MAIN checkout — PASS;
2. repository Public-Readiness preflight — PASS;
3. Enterprise GitHub App installation-token mint — PASS;
4. `GET /enterprises/capital-ai-online/rulesets` — **HTTP 403**.

The remediation keeps the Enterprise App token as the preferred identity. Only an App-token **GET 403** may activate the already-existing classic Enterprise PAT fallback. Before that PAT can authorize the bounded ruleset PUT, a successful provider response must expose `admin:enterprise` in `X-OAuth-Scopes`. No other status, endpoint, method, target or user-supplied provider value can activate the fallback. The provider mutation remains fixed to the named ruleset and exact GET → optional PUT → GET readback.

## Public-cutover hold gates

Before changing visibility, the Human Owner must review historical Git/secret-scanning evidence, historical GitHub Actions logs, the intended proprietary/source-public licensing model, and fresh live provider readback of rulesets plus public-repository security features. Missing or stale evidence is never PASS.

GitHub App private-key material and the existing Enterprise PAT remain only in the existing secret store. Installation tokens are short-lived, masked and not persisted. Neither credential value is logged or projected.

## Exit evidence

Repository implementation exit: fresh-main successor branch, no writer overlap, focused validation PASS, App-authored future PR creation, FUNDING/security/current-tree preflight on main, visibility still private.

Provider exit after the remediation merge: `GitHub Public Repository Readiness Hardening` reports `UPDATED_AND_VERIFIED` or `NOOP_ALREADY_HARDENED`, with one approval, Code Owner review on, last-push approval off, extra unattributed-PR approval off, review-thread resolution on and no bypass actor.

The later private-to-public change remains a separate Human Owner action.
