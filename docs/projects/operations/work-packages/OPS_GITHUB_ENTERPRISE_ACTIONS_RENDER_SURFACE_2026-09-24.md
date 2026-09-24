# OPS-GITHUB-ENTERPRISE-ACTIONS-RENDER-SURFACE — Limit-independent Enterprise Actions readback

**Project:** `CAPITAL-AI-OPS`  
**Primary PVC:** `PVC-02 — Controlled Implementation`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Fresh baseline:** `main@b1d78a51cd7e833a0cc7b1d3ae288593e70eb6cd`  
**Branch:** `agent/operations-github-enterprise-actions-render-surface-20260924`  
**Status:** `IMPLEMENTED_ON_MAIN / RUNTIME_DEPLOYMENT_PENDING`  
**Merge authority:** `IMPLEMENTATION_MERGED / POST_MERGE_RECONCILIATION_PENDING`

## Purpose

Expose the already merged bounded GitHub Enterprise Actions settings reader through the existing Finance Render runtime. The provider read must continue to work without consuming ChatGPT Work or Codex execution capacity; ChatGPT/Codex remain optional clients of sanitized output, not execution hosts.

## Reuse decision

This slice reuses:

- `scripts/operations/githubEnterpriseSettingsReadClient.mjs` as the sole Enterprise Actions provider transport;
- `scripts/operations/githubSettingsInventoryProjection.mjs` for redacted settings projection;
- `checkAdminAccess(..., OWNER_ONLY_ROLES)` as the existing IAM boundary;
- the existing `Finance` Render web service as the execution host.

It does not add another MCP server, raw GitHub proxy, settings registry, credential plane or provider mutation path.

## Runtime surface

`GET /api/admin/github-enterprise/actions-policy`

The response projects:

- Enterprise Actions enablement and allowed-actions mode;
- full-length SHA-pinning state;
- GitHub-owned and verified-action allowance;
- explicit selected-action patterns;
- default `GITHUB_TOKEN` permission;
- whether Actions may approve pull-request reviews;
- bounded, sanitized 401/403/404 diagnostics when provider evidence is unavailable.

The response is owner-only and `Cache-Control: no-store`; provider reads are internally cached for five minutes to avoid unnecessary GitHub API traffic.

## Credential boundary

Required Render configuration:

- `CAPITAL_AI_GITHUB_ENTERPRISE_SLUG=capital-ai-online`;
- `CAPITAL_AI_GITHUB_ENTERPRISE_READ_PAT` as a server-only secret.

No credential value may be committed, logged or returned.

## Exit evidence

1. exact branch contains fresh CURRENT_MAIN;
2. no duplicate GitHub Enterprise transport exists;
3. focused tests prove GET-only reuse, redaction and cache behavior;
4. admin-route bypass audit recognizes the new owner-only mount;
5. Render manifest contains only secret metadata, not the secret value;
6. hosted exact-head checks pass before Human/CODEOWNER merge.


## Post-merge evidence — PR #1400

- Human/CODEOWNER merge: `53f1cb04bf20efb2d7a0bd4524dc5fea2be8aa07` at `2026-09-24T13:20:45Z`.
- Final exact PR head: `46bdd46826a9a3a6136d960429b243d1e159a4bb`.
- Exact-head checks: PR/OSS quality PASS, PR Governance PASS, CI/build-and-test PASS, Project Execution Directive PASS, Container Security PASS.
- The implementation is therefore repository-integrated on CURRENT_MAIN.
- Render `Finance` remains on live commit `fb62cf1f9313d6f3d34db60cc0561d60cd0a7c74`; `autoDeploy=off`.
- The new owner-only route is consequently not yet proven live in Production.
- `CAPITAL_AI_GITHUB_ENTERPRISE_READ_PAT` is declared server-side in `render.yaml`, but the Render connector does not expose secret values or a read API for secret presence. Provider credential provisioning therefore remains `NOT_OBSERVABLE` until a live route readback succeeds.
- No exact-SHA deployment was triggered by this reconciliation. Runtime promotion remains governed by the existing deploy cadence and protected production controls.
