# OPS-PR900-03C — GitHub Enterprise API Authority & Capability Matrix

**Project:** `CAPITAL-AI-OPS`  
**Project folder:** `docs/projects/operations/`  
**Primary PVC:** `PVC-02 — Controlled Implementation`  
**Primary Owner:** `CAPITAL-AI-OPS`  
**Parent:** `OPS-PR900-03 — GitHub Enterprise capability matrix`  
**Related:** `OPS-PR900-03A`, `OPS-PR900-03B`, `OPS-PR900-04`, `SEC-PR900-05`, `SEC-PR900-06`  
**Status:** `MATERIALIZED_BRANCH / REVALIDATED / PROVIDER_MUTATION_NOT_AUTHORIZED`  
**Correlation baseline:** `main@5ae2b371da45a5c07304fd704a7026eded976f1b`  
**Branch:** `agent/operations-github-api-authority-recorrelation-20260916`  
**Trust root:** `/AGENTS.md@current-main` v2.11.0

## Purpose and sequencing

This package is the serialized successor to the merged `OPS-PR900-03A/03B` synchronization. PR #955 reached the required terminal Human-merged state before this successor branch was created. The current `main` has since advanced through unrelated merges to `5ae2b371da45a5c07304fd704a7026eded976f1b`; the merged 03A/03B state is present on that baseline.

The earlier branch `agent/operations-github-api-authority-matrix-20260916` is a superseded materialization/search hint only. It is not the current execution branch, has no open Pull Request and is intentionally not used as the successor base because `/AGENTS.md` requires a fresh branch from the resulting then-current `main`.

This package does not create a second Governance, Security, credential, MCP, provider or Roadmap authority. No GitHub App installation, OAuth mutation, connector permission change, secret rotation, PAT creation, IAM elevation, provider setting mutation, deployment or production mutation is authorized or executed here.

## 03A / 03B correlation

Current canonical state on the correlation baseline:

- `OPS-PR900-03A`: `MERGED / CAPABILITY_GAP_VERIFIED`;
- `OPS-PR900-03B`: `BLOCKED / NOT_STARTED — CONNECTOR / EXECUTION-SURFACE GAP`;
- 03B still requires Organization Projects V2 + Project Fields, Milestone object management and Wiki navigation with both mutation and reproducible readback through an already authorized execution path;
- provider-native API existence is not equivalent to capability being exposed by the connected ChatGPT GitHub execution surface.

03C therefore **does not unblock 03B**. It defines the authority/token/API boundary for a future durable GitHub management path while keeping the currently connected execution-surface gap explicit.

## Authority and capability model

Current applicable contracts:

- `/AGENTS.md` v2.11.0 — sole repository trust root; serial Roadmap PR lane; connector mutation requires separate Human/Owner request;
- `ESS-0019` v1.2.0 — provider-neutral capability plane; `AI product != trust root`; deny-by-default; read and mutation authority are separate;
- `ADR-0050` — capability-IAM foundation; controlled write authority must be individually enumerated and approval-gated rather than inferred from read access;
- `OPS-PR900-03` — canonical GitHub Enterprise capability-matrix parent;
- `OPS-PR900-04` — canonical MCP/OAuth/gateway convergence workstream.

Target machine path remains:

`ChatGPT / Codex -> authenticated CAPITAL-AI MCP gateway -> GitHub App -> short-lived GitHub installation token -> Enterprise / Organization / Repository APIs`.

The model/client must not receive a persistent universal GitHub administrator credential as its normal machine identity. A classic PAT is a compatibility or break-glass exception only where an explicitly required provider endpoint does not support the GitHub App token class and a separate authorization permits that path.

## Classification vocabulary

- `API_MANAGED` — official GitHub API exposes the relevant operation with documented permissions.
- `API_READ_ONLY` — documented/readable evidence surface for the bounded Reader use case.
- `GITHUB_APP_ONLY` — endpoint family requires/targets GitHub App identity.
- `PAT_COMPATIBILITY_REQUIRED` — current provider documentation says the required endpoint does not support GitHub App installation/user tokens.
- `CURRENT_CONNECTOR_READ_AVAILABLE` — the connected ChatGPT GitHub surface reproduced the read operation in this pass.
- `CURRENT_CONNECTOR_NOT_EXPOSED` — GitHub exposes the API, but this connected connector rejects or does not expose the endpoint family.
- `PROTECTED_MUTATION` — provider mutation exists but requires separate current authorization before use.
- `DOC_CONTRADICTION_LIVE_VERIFY` — official documentation contains contradictory token-support statements; fail closed until live provider permission/readback resolves it.
- `NOT_PROVEN` — effective provider object state or effective credential grants have not been read back.

`CURRENT_CONNECTOR_NOT_EXPOSED` never means the GitHub-native API or object does not exist.

## Reader / Controller separation

### Reader

Reader permissions are the minimum union required by selected read rows. Candidate families include:

- Enterprise: `Enterprise administration: read`, `Custom properties: read`, `Enterprise custom properties for organizations: read`, `Enterprise organization installations: read`, `Enterprise organization installation repositories: read`;
- Organization: `Administration: read`, `Custom properties: read`;
- Repository: `Metadata: read`, `Administration: read`, `Actions: read`, `Code scanning alerts: read`, `Secret scanning alerts: read`, `Dependabot alerts: read`.

Secret-scanning reads must hide literal secret values where the endpoint supports it. Private keys, access tokens, authorization headers and credential-bearing response bodies are forbidden output.

### Controller

Controller capabilities are separate deny-by-default mutation capabilities and are **not provisioned by this package**. A Controller operation is eligible only after current Owner/PVC resolution, operation-specific permission mapping, required Human/Owner authorization, precondition capture, least-privilege credential use, post-mutation readback and attributable audit evidence.

No generic `github.admin.*` wildcard capability is authorized.

## GitHub API / current connector matrix

| Scope | Surface | Provider/API state | Current connector state | Boundary |
|---|---|---|---|---|
| Enterprise | GitHub App organization-installation inventory | GitHub API supports App user/installation tokens with `Enterprise organization installations: read` | `CURRENT_CONNECTOR_NOT_EXPOSED` | `GITHUB_APP_ONLY / API_MANAGED` |
| Enterprise | Install/manage App on enterprise-owned organization | GitHub API supports App tokens with write permission | `CURRENT_CONNECTOR_NOT_EXPOSED` | `PROTECTED_MUTATION` |
| Enterprise | Enterprise custom properties | GitHub API supports App tokens with `Custom properties: read/write` | `CURRENT_CONNECTOR_NOT_EXPOSED` | read API-managed; write protected |
| Enterprise | Enterprise repository rulesets | official API exists; current docs require `Enterprise administration: write` even for GET | generic connector endpoint is not exposed for `/enterprises/.../rulesets` | `API_MANAGED / PROTECTED_MUTATION`; Reader must not gain write merely for inventory |
| Enterprise | Enterprise audit log | provider page states both classic-PAT-only and a GitHub-App fine-grained permission section | `CURRENT_CONNECTOR_NOT_EXPOSED` | `DOC_CONTRADICTION_LIVE_VERIFY`; no credential broadening |
| Enterprise | Enterprise code-security configurations | current provider docs explicitly reject GitHub App user/installation and fine-grained PAT tokens; classic OAuth/PAT scopes apply | `CURRENT_CONNECTOR_NOT_EXPOSED` | `PAT_COMPATIBILITY_REQUIRED`; separate identity only |
| Organization | Organization settings / Actions policy | provider API supports App tokens with `Administration: read/write` as applicable | Org Actions endpoint rejected by current connector allowlist | `CURRENT_CONNECTOR_NOT_EXPOSED`; write protected |
| Organization | Organization custom-property schema | provider API exposes read/admin permission families | `CURRENT_CONNECTOR_NOT_EXPOSED` | read API-managed; mutation protected |
| Organization | Code/Secret/Dependabot alert inventory | official APIs support App tokens with repository security read permissions | dedicated org alert endpoints not exposed by current connector | `API_READ_ONLY / CURRENT_CONNECTOR_NOT_EXPOSED` |
| Repository | Repository metadata/files/commits/branches/PRs/Actions evidence | provider APIs available | `CURRENT_CONNECTOR_READ_AVAILABLE` | existing bounded repository execution surface |
| Repository | Repository rulesets | official API supports App tokens; mutation requires `Administration: write` | `CURRENT_CONNECTOR_READ_AVAILABLE` — live readback returned active `main-production-protection` ruleset | read verified; mutation protected |
| Repository | Repository Actions policy | official API supports App tokens with `Administration: read/write` | no dedicated policy action exposed; generic endpoint not used as mutation path | read/provider capability separate from Controller write |
| Repository | Repository custom-property values | provider API supports App tokens; read=`Metadata: read`, write=`Custom properties: write` | no dedicated connector action exposed | `API_MANAGED`; write protected |
| Repository | Code Scanning alerts | official API supports App tokens with `Code scanning alerts: read`; write for alert mutation | dedicated connector alert API not exposed | `API_READ_ONLY / CURRENT_CONNECTOR_NOT_EXPOSED` |
| Repository | Secret Scanning alerts | official API supports App tokens with `Secret scanning alerts: read`; mutation is separate | dedicated connector alert API not exposed | `API_READ_ONLY`; literal secrets forbidden |
| Repository | Dependabot alerts | official API supports App tokens with `Dependabot alerts: read` | dedicated connector alert API not exposed | `API_READ_ONLY / CURRENT_CONNECTOR_NOT_EXPOSED` |

The matrix proves provider/API capability and current connector exposure only. It does **not** prove that any CAPITAL-AI credential presently has Enterprise/Organization/Repository administrator grants. Effective provider grants remain `NOT_PROVEN` until read back through a separately authorized gateway identity.

## Live connector evidence — 2026-09-16

- Finance repository rulesets were successfully enumerated through the connected GitHub read surface; active repository ruleset `main-production-protection` was returned.
- `GET /enterprises/capital-ai-online/rulesets` was rejected by the connector endpoint allowlist before an Enterprise API permission result could be established.
- `GET /orgs/capital-ai-online/actions/permissions` was rejected by the connector endpoint allowlist before an Organization API permission result could be established.
- The connector capability catalog exposes repository-centric file/branch/PR/Actions operations but no dedicated Enterprise administration family.

Those failures are execution-surface evidence, not provider-object absence and not proof of insufficient GitHub provider permissions.

## Gateway capability boundary

A future gateway should expose explicit allowlisted capabilities rather than a generic raw-admin proxy, for example:

- `github.enterprise.inventory.read`
- `github.enterprise.custom_properties.read`
- `github.enterprise.app_installations.read`
- `github.organization.settings.read`
- `github.organization.actions.read`
- `github.repository.settings.read`
- `github.repository.rulesets.read`
- `github.security.code_scanning.read`
- `github.security.secret_scanning.read`
- `github.security.dependabot.read`

Mutation counterparts remain separately authorized Controller capabilities.

## Official provider documentation revalidated 2026-09-16

Primary GitHub documentation used for current verification:

- Enterprise organization GitHub App installations: <https://docs.github.com/en/enterprise-cloud@latest/rest/enterprise-admin/organization-installations>
- Enterprise custom properties: <https://docs.github.com/en/enterprise-cloud@latest/rest/enterprise-admin/custom-properties>
- Enterprise rulesets: <https://docs.github.com/en/enterprise-cloud@latest/rest/enterprise-admin/rules>
- Enterprise audit log: <https://docs.github.com/en/enterprise-cloud@latest/rest/enterprise-admin/audit-log>
- Code-security configurations: <https://docs.github.com/en/rest/code-security/configurations>
- Actions permissions: <https://docs.github.com/en/rest/actions/permissions>
- Repository custom properties: <https://docs.github.com/en/rest/repos/custom-properties>
- Code Scanning: <https://docs.github.com/en/rest/code-scanning/code-scanning>
- Secret Scanning: <https://docs.github.com/en/rest/secret-scanning/secret-scanning>
- Dependabot Alerts: <https://docs.github.com/en/rest/dependabot/alerts>

## Open gates

1. Effective Enterprise/Organization/Repository permission grants for the future gateway identity are `NOT_PROVEN`.
2. Enterprise audit-log token support remains `DOC_CONTRADICTION_LIVE_VERIFY` because current official documentation is internally inconsistent.
3. PAT-only compatibility surfaces, including Enterprise code-security configuration, require a separate explicit design/authorization before any credential exists.
4. Provider mutation, GitHub App installation, OAuth/connector permission changes and secret/IAM mutation remain outside this package.
5. `OPS-PR900-03B` remains `BLOCKED / NOT_STARTED`; 03C documentation does not satisfy its Projects V2/Fields + Milestone + Wiki Write/Readback gate.

## Exit gate

Repository-side 03C materialization is complete when this matrix, the canonical OPS Roadmap and the work-package index agree on the same current-main baseline and authority boundary; final Draft-PR creation still requires a fresh current-main/open-PR/writer correlation and truthful Class-D validation. No provider or credential mutation is part of the exit.
