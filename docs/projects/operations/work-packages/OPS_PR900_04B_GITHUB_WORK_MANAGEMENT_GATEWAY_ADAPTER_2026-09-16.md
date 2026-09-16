# OPS-PR900-04B — GitHub Work-Management Gateway Adapter

**Project:** `CAPITAL-AI-OPS`  
**Project folder:** `docs/projects/operations/`  
**Primary PVC:** `PVC-02 — Controlled Implementation`  
**Primary Owner:** `CAPITAL-AI-OPS`  
**Parent:** `OPS-PR900-04 — Multi-LLM gateway / OAuth2 / MCP convergence`  
**Unblocks:** execution-surface prerequisite for `OPS-PR900-03B`  
**Status:** `IMPLEMENTED_BRANCH / LOCAL_HARNESS_PASS / PROVIDER_HOST_HELD`  
**Correlation baseline:** `main@b95f9b74a01b6d0e1228a8d5291b0fb54ea80489`  
**Branch:** `agent/operations-github-workmgmt-gateway-20260916`  
**Trust root:** `/AGENTS.md@current-main` v2.11.0

## Purpose

Materialize the smallest repository-side complement needed for the GitHub Work-Management execution path without creating a second GitHub/MCP control plane.

The target composition is:

`ChatGPT / Codex -> existing MCP execution host -> official GitHub MCP Server + bounded CAPITAL-AI adapter -> GitHub App installation token -> GitHub provider`.

The official GitHub MCP Server remains the preferred provider adapter for Projects, Issue Types, Issue Fields and normal Issue lifecycle operations. This package adds only the object/readback surfaces still required by `OPS-PR900-03B` and not relied upon as complete official-MCP surfaces in this package:

- Milestone object inventory/readback;
- canonical pilot Milestone create/update/readback;
- navigation-only Wiki page read/write/readback.

No deployment, GitHub App private-key creation, installation-token minting, provider permission mutation or Production mutation is part of this repository slice.

## Current-main and writer correlation

At branch creation:

- current `main`: `b95f9b74a01b6d0e1228a8d5291b0fb54ea80489`;
- open Pull Requests: `0`;
- Current Project / Primary Owner: `CAPITAL-AI-OPS`;
- Primary PVC: `PVC-02 — Controlled Implementation`;
- `/AGENTS.md`: v2.11.0;
- `agent/operations-github-status-sync-20260916` exists but is `14` commits behind current main and `4` commits ahead from merge-base `c89add85ca43a31bff61a27b33eef49f891ffba4`;
- that historical/status branch modifies `ROADMAP.md`, `WORK_PACKAGES.md`, 03C and 04A only. This 04B slice deliberately does not modify those same-file surfaces, so no changed-file overlap is introduced.

The status-sync branch is search/correlation input only and is not used as the implementation base.

## Authority and security contracts

Applicable current authorities:

- `/AGENTS.md` v2.11.0 — fresh branch, deny-by-default external mutation, Human/CODEOWNER merge boundary;
- `ESS-0019` v1.2.0 — provider-neutral capability plane, `AI product != trust root`, secrets outside model context;
- `ADR-0050` — individually enumerated capabilities; no general provider/database mutation surface;
- `ADR-0051` — write operations require an explicit bounded policy/approval chain rather than generic write authority;
- `ADR-0058` — exact, non-inheriting capabilities and attributable principals; provider identity never grants authority;
- `OPS-PR900-03A/03C/04A` — GitHub Work Management remains coordination-only; Reader/Controller and provider/connector capability evidence stay distinct.

This adapter therefore exposes named capabilities only and has no arbitrary REST, GraphQL, Git command or Wiki-content pass-through.

## Reuse decision

Reuse order from `/AGENTS.md` was applied:

1. existing ChatGPT GitHub connector remains useful for repository/PR/Actions/ruleset surfaces it already exposes;
2. existing Codex MCP execution-host mechanics remain the execution-host direction;
3. the official `github/github-mcp-server` is reused for Projects and Issue taxonomy/lifecycle rather than reimplemented;
4. GitHub native REST/Git semantics are used only behind the bounded complement adapter;
5. custom code is limited to the missing Milestone-object and Wiki-navigation contract.

Official GitHub MCP Server documentation revalidated on 2026-09-16 states that local `stdio` supports GitHub App authentication with `GITHUB_APP_ID`, `GITHUB_APP_INSTALLATION_ID` and a preferred mounted `GITHUB_APP_PRIVATE_KEY_PATH`; it signs a short-lived JWT and refreshes installation tokens before expiry. The same current tool inventory exposes `projects_get`, `projects_list`, `projects_write`, `list_issue_types`, `list_issue_fields` and `issue_write`.

Primary references:

- <https://github.com/github/github-mcp-server/blob/main/docs/github-app-auth.md>
- <https://github.com/github/github-mcp-server>
- <https://docs.github.com/en/rest/issues/milestones>
- <https://docs.github.com/en/communities/documenting-your-project-with-wikis/adding-or-editing-wiki-pages>

## Repository implementation

### `scripts/operations/githubWorkManagementGatewayAdapter.mjs`

The adapter is transport-injected and therefore never accepts or returns a GitHub token or GitHub App private key.

Canonical target is hard-bound to:

`capital-ai-online/Finance`.

Allowlisted capabilities are exactly:

- `github.work_management.milestones.list`;
- `github.work_management.milestones.get`;
- `github.work_management.milestones.create_pilot`;
- `github.work_management.milestones.update_pilot`;
- `github.work_management.wiki.read_navigation`;
- `github.work_management.wiki.write_navigation`.

Unknown capabilities fail closed.

### Milestone boundary

The only writable Milestone contract is:

- title: `GitHub Work Management Pilot`;
- description: `Non-versioned delivery cohort for OPS-PR900-03B. No platform, release or deployment version authority.`;
- state transition: `open | closed` only.

Create and update operations immediately perform provider readback through the injected REST transport and reject mismatched title/description/state. Provider responses are projected to metadata-only fields; arbitrary response fields such as credentials are not returned by the adapter.

Milestone-to-Issue association remains delegated to the official GitHub MCP `issue_write` surface after the real Milestone number is provider-verified.

### Wiki boundary

The adapter writes only generated navigation content for the exact allowlist:

- `Home`;
- `CAPITAL-AI-Projects`;
- `CAPITAL-AI-OPS`;
- `OPS-PR900-03B`;
- `_Sidebar`.

Callers cannot pass arbitrary Wiki Markdown. The generated pages contain navigation/backlinks and pointers to canonical repository authority only. Every write is followed by exact readback and SHA-256 digest projection.

The future host-specific Wiki transport is responsible for authenticating Git access to `capital-ai-online/Finance.wiki.git` while keeping installation-token material outside model/repository/log context.

## Validation

Repository changes in this slice:

- `scripts/operations/githubWorkManagementGatewayAdapter.mjs`;
- `tests/unit/githubWorkManagementGatewayAdapter.test.ts`;
- this work-package specification;
- `docs/projects/operations/work-packages/README.md` registration.

Available pre-PR sandbox validation:

- `node --check` against the exact adapter content: `PASS`;
- transport-injected Node test harness covering repository allowlist, unknown-capability denial, Milestone create/update readback, secret-field non-projection, canonical Wiki write/readback, arbitrary Wiki denial and official-MCP delegation: `7/7 PASS`.

Limitations:

- available sandbox Node was `v22.16.0`, not the repository target `>=24.18.0 <25`; this is syntax/logic evidence only;
- repository-native `npx vitest run tests/unit/githubWorkManagementGatewayAdapter.test.ts`, full TypeScript lint and full build are `NOT RUN` pre-PR in this connector-only session;
- real provider Read -> Write -> Readback is `NOT RUN` because the non-production Gateway/Vault host and private-key provisioning remain the next separately bounded step.

`NOT RUN` is not reported as `PASS`.

## Exit gate

### Repository-side 04B exit

`PASS` when the branch contains one bounded adapter path that:

- reuses official GitHub MCP for Projects/Issue Types/Fields/Issue lifecycle;
- adds no generic GitHub proxy;
- provides exact Milestone object create/update/readback semantics for the non-versioned pilot;
- provides generated navigation-only Wiki read/write/readback semantics;
- rejects non-Finance targets, arbitrary capabilities, arbitrary Milestone state and arbitrary Wiki pages/content;
- stores or logs no GitHub credential;
- has focused tests and truthful validation status.

### Provider-host exit

Held outside this repository slice until the already Owner-authorized credential path is executed on a non-production host:

1. provision the official GitHub MCP Server plus the bounded adapter behind one execution-host boundary;
2. generate exactly one App private key and store it only in the approved Vault/secret host;
3. mint short-lived Finance-only installation tokens;
4. perform metadata-only effective-grant readback;
5. prove Projects/Fields, Issue Types/Fields, Milestone and Wiki `Read -> Write -> Readback`;
6. only then allow `OPS-PR900-03B` to start.

Human/CODEOWNER merge, Release, Deployment, Production and unrelated IAM authority remain unchanged.
