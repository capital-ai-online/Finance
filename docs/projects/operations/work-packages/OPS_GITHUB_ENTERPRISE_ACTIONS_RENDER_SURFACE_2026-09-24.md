# OPS-GITHUB-ENTERPRISE-ACTIONS-RENDER-SURFACE — Limit-independent Enterprise Actions readback

**Project:** `CAPITAL-AI-OPS`  
**Primary PVC:** `PVC-02 — Controlled Implementation`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Fresh baseline:** `main@58ac24731bf597e9356788d0293d6c733337b364`  
**Branch:** `agent/operations-github-enterprise-actions-render-surface-20260924`  
**Status:** `IMPLEMENTATION_ON_BRANCH`  
**Merge authority:** `HUMAN_MERGE_REQUIRED`

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
