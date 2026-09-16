# OPS-PR900-04A — GitHub App / MCP Reader Setup

**Project:** `CAPITAL-AI-OPS`  
**Project folder:** `docs/projects/operations/`  
**Primary PVC:** `PVC-02 — Controlled Implementation`  
**Primary Owner:** `CAPITAL-AI-OPS`  
**Parent:** `OPS-PR900-04 — Multi-LLM gateway / OAuth2 / MCP convergence`  
**Predecessor:** `OPS-PR900-03C — GitHub Enterprise API Authority & Capability Matrix`  
**Security handoff:** `SEC-PR900-05`, `SEC-PR900-06`  
**Status:** `MATERIALIZED_BRANCH / READER_CONTRACT_READY / PROVIDER_MUTATION_HELD`  
**Correlation baseline:** `main@3e755873078b5f6fd3e2213960d0d83eea7c4a83`  
**Branch:** `agent/operations-github-reader-setup-20260916`  
**Trust root:** `/AGENTS.md@current-main` v2.11.0

## Purpose

This serialized successor to Human-merged PR #962 turns the 03C capability matrix into a bounded Reader setup contract for durable GitHub Enterprise / Organization / Repository / Security readback through the existing CAPITAL-AI MCP convergence workstream.

Target path:

`ChatGPT / Codex -> authenticated CAPITAL-AI MCP gateway -> GitHub App -> short-lived installation token -> GitHub APIs`.

The Reader is inventory/evidence authority only. It is not a Controller, does not acquire provider-write authority, does not change Human/CODEOWNER merge authority and does not create a second Governance, Security, credential or MCP control plane.

This repository slice performs **no** GitHub App installation, GitHub App permission change, OAuth/connector mutation, PAT creation, secret creation/rotation, IAM elevation, Enterprise/Organization/Repository setting mutation, deployment or production mutation. Those external actions remain separately protected under `/AGENTS.md`.

## Current-main correlation

- PR #962 is terminal `MERGED` and its 03C capability matrix is present on current main.
- Current project routing resolves this work to `CAPITAL-AI-OPS / PVC-02`.
- `OPS-PR900-04` remains the canonical MCP/OAuth/gateway convergence workstream.
- `/AGENTS.md` v2.11.0 requires fresh-current-main branches for serialized successors and separate explicit Owner authorization for connector/app installation or permission changes.
- Current open PR #969 is Security-owned and file-/authority-disjoint from this OPS documentation slice.
- `.codex/config.toml` already provides the Codex project-scoped MCP execution-host surface for existing GA4/Search Console servers; this slice does not create a second Codex credential plane or point Codex at an unprovisioned GitHub server.
- `ESS-0019` remains the provider-neutral deny-by-default capability contract: read evidence does not imply mutation capability and long-lived provider secrets stay outside model context when a tool/gateway can hold them.
- `ADR-0050` preserves individually enumerated capabilities and prohibits inferring write authority from a read path.

## Reuse / preimplementation result

Reuse order was applied before custom implementation:

1. **Current ChatGPT GitHub connector:** retained for repository/PR/Actions/ruleset reads it already exposes; it does not expose the required Enterprise administration and dedicated Code/Secret Scanning alert families.
2. **Existing Codex MCP host surface:** reuse `.codex/config.toml` / current OPS-PR900-04 mechanics; no second host authority.
3. **Existing GitHub APIs:** use official REST capabilities directly behind the future allowlisted gateway rather than inventing a second GitHub settings store.
4. **Specialized security capability:** useful for scan analysis but not a substitute for full Enterprise/Organization settings/readback authority; no plugin/app installation is performed by this slice.
5. **Custom implementation:** limited to the future thin gateway adapter needed to expose only explicitly allowlisted GitHub read capabilities that existing connected surfaces do not provide.

## Reader identity and credential boundary

### GitHub identity

Normal target identity: **GitHub App installation token**.

GitHub documents installation access tokens as short-lived; current documentation states they expire one hour after creation. The gateway must mint them at runtime using the GitHub App private key/JWT path. The model and repository must not persist installation tokens.

Token minting should request only the repositories and permissions needed for the current operation when GitHub supports narrowing the installation token below the App installation's maximum grants.

### Codex / MCP identity

Codex authenticates to the CAPITAL-AI MCP gateway, not directly to GitHub. Current OpenAI Vault documentation supports MCP OAuth credentials and static bearer credentials and states that stored secret values are not returned by credential reads.

Repository invariant:

- Codex/ChatGPT may receive the gateway credential through the supported OpenAI/Codex secret or Vault mechanism;
- GitHub App private-key material remains behind the gateway;
- GitHub App JWTs and installation tokens remain transient behind the gateway;
- no GitHub credential value is committed, logged, inserted into PR bodies or persisted as Roadmap evidence.

No `.codex/config.toml` GitHub entry is added until an authorized, real gateway URL/auth method exists. A speculative/non-routable MCP endpoint must not be committed as working configuration.

## Least-privilege Reader permission profile

The final provider grant is the minimum union of capabilities actually enabled. The following is the candidate Reader ceiling; it is **not proof that these grants currently exist**.

### Enterprise permissions

| Permission family | Target access | Reader purpose | State |
|---|---|---|---|
| `Enterprise organization installations` | `read` | inventory enterprise-owned organization installations | `CANDIDATE_READER_GRANT` |
| `Enterprise organization installation repositories` | `read` | read repository scope of an installation | `CANDIDATE_READER_GRANT` |
| `Custom properties` | `read` | Enterprise custom-property schema/readback where supported | `CANDIDATE_READER_GRANT` |
| `Enterprise custom properties for organizations` | `read` | Enterprise-level organization property readback | `CANDIDATE_READER_GRANT` |
| `Enterprise administration` | `read` | only endpoint families that actually require/read this permission | `CONDITIONAL_READER_GRANT` |

`Enterprise administration: write` is **not** a Reader grant. Endpoint families that require write permission even for a GET are excluded from the Reader rather than broadening the Reader solely for inventory.

### Organization permissions

| Permission family | Target access | Reader purpose |
|---|---|---|
| `Administration` | `read` | organization settings/Actions/code-security configuration readback where documented |
| `Custom properties` | `read` | organization custom-property schema/value inventory |

### Repository permissions

| Permission family | Target access | Reader purpose |
|---|---|---|
| `Metadata` | `read` | repository identity and custom-property value reads where applicable |
| `Administration` | `read` | repository settings, environments/default code-security configuration readback where documented |
| `Actions` | `read` | workflow/run/environment read evidence where applicable |
| `Code scanning alerts` | `read` | Code Scanning alert/analysis inventory |
| `Secret scanning alerts` | `read` | Secret Scanning alert/location inventory without literal secret disclosure |
| `Dependabot alerts` | `read` | Dependabot alert inventory |

No repository write permission is part of the Reader profile.

## Allowlisted MCP capability surface

The future gateway exposes named capabilities, not a generic raw GitHub proxy:

- `github.enterprise.installations.read`
- `github.enterprise.installation_repositories.read`
- `github.enterprise.custom_properties.read`
- `github.enterprise.audit.read` — disabled until the token-support contradiction is resolved by live evidence
- `github.organization.settings.read`
- `github.organization.actions.read`
- `github.organization.custom_properties.read`
- `github.organization.code_security.read`
- `github.repository.settings.read`
- `github.repository.rulesets.read`
- `github.repository.actions.read`
- `github.repository.custom_properties.read`
- `github.security.code_scanning.read`
- `github.security.secret_scanning.read`
- `github.security.dependabot.read`

A future Controller uses separate capability names and a separate protected authorization path. Reader possession never activates a mutation counterpart.

## Security output contract

### Code Scanning

Allowed output is limited to alert/analysis identity, state, rule/severity, tool, repository/ref/commit, safe location, timestamps and resolution metadata. Alert mutation/autofix creation is outside this Reader.

Current GitHub documentation supports GitHub App installation tokens for repository Code Scanning reads with `Code scanning alerts: read`.

### Secret Scanning

Allowed output is limited to alert identity/state, secret type, safe location, repository/ref identity, resolution/push-protection metadata and timestamps.

Forbidden output:

- literal secret value;
- private key material;
- access/installation token payload;
- authorization header;
- credential-bearing raw provider response.

Current GitHub Secret Scanning REST endpoints expose `hide_secret`; Reader calls must set `hide_secret=true` wherever supported because the documented default is `false`. Downstream redaction is defense-in-depth, not the primary control.

## Provider-gap readback matrix

| Gap | Current provider evidence | Current connected execution evidence | 04A classification |
|---|---|---|---|
| Enterprise audit log token support | Current GitHub page states the endpoint only supports classic PAT while the same page also contains a GitHub App user/installation-token fine-grained permission section requiring `Enterprise administration: read` | direct connector call to `/enterprises/capital-ai-online/audit-log` is rejected by connector allowlist before provider authentication | `DOC_CONTRADICTION_LIVE_VERIFY / TARGET_APP_REQUIRED` |
| Enterprise code-security configurations | GitHub currently states Enterprise endpoints do not work with GitHub App user/installation or fine-grained PAT tokens; classic OAuth/PAT uses `read:enterprise` / `admin:enterprise` | direct connector call is rejected before provider authentication | `PAT_COMPATIBILITY_REQUIRED / SEPARATE_IDENTITY_NOT_CREATED` |
| Code Scanning alerts | GitHub App installation token supported with `Code scanning alerts: read` | dedicated alert endpoint is not exposed by current connector | `TARGET_READER_APP_REQUIRED` |
| Secret Scanning alerts | GitHub App installation token supported with `Secret scanning alerts: read`; `hide_secret=true` supported | dedicated alert endpoint is not exposed by current connector | `TARGET_READER_APP_REQUIRED` |
| Effective GitHub App grants | installation metadata can expose granted permissions; installation token can enumerate accessible repositories | no target CAPITAL-AI Reader App/installation identity is available through the current connected tool surface | `NOT_PROVEN / PROVIDER_SETUP_REQUIRED` |

Connector rejection is **not** provider permission denial. These states remain fail-closed until the target GitHub App exists and the gateway performs real provider calls.

## Effective-grant readback contract

After separately authorized provider setup, the first Reader session must capture metadata-only evidence for:

1. exact GitHub App identity (`app_id`/slug or other non-secret stable identity);
2. installation identity and target account;
3. installation `permissions` map;
4. repository selection mode;
5. Finance repository presence in the installation-accessible repository list;
6. one successful read per enabled capability family;
7. one negative test proving a write-capable endpoint is denied/not exposed through Reader;
8. generated installation-token expiry metadata without token value;
9. gateway audit correlation identifier.

GitHub documents `GET /app/installations/{installation_id}` as an App-JWT operation and installation records expose permission metadata; `GET /installation/repositories` can verify the repositories reachable by an installation token. Token values themselves are never evidence.

## PAT compatibility boundary

The current Enterprise code-security configuration API is the concrete known compatibility exception: official GitHub documentation states that its Enterprise endpoints do not work with GitHub App user access tokens, installation tokens or fine-grained PATs.

Therefore:

- 04A does not add `read:enterprise` or `admin:enterprise` credentials;
- no universal classic PAT is created;
- any future classic-PAT compatibility identity must be a separate bounded principal, limited to the exact unsupported endpoint family and protected by separate Owner authorization, storage, rotation/revocation and audit controls;
- `admin:enterprise` is never granted merely because `read:enterprise` cannot satisfy a different mutation use case.

## Protected provider setup gate

Repository materialization is authorized by the current task; **external provider mutation is not inferred from it**.

Before any GitHub App creation/installation, permission grant, enterprise installation, repository selection change, OAuth/MCP connection change or Vault credential creation, `/AGENTS.md` requires a separate explicit Human/Owner request identifying the exact external integration and intended mutation.

The provider action must therefore remain `HELD_EXTERNAL_OWNER_AUTHORIZATION` until that explicit request exists. This is not a repository implementation failure.

## Official documentation baseline — 2026-09-16

Primary sources revalidated for this slice:

- GitHub App permissions: <https://docs.github.com/en/enterprise-cloud@latest/rest/authentication/permissions-required-for-github-apps?apiVersion=2026-03-10>
- GitHub App installation endpoints: <https://docs.github.com/en/rest/apps/apps?apiVersion=2026-03-10>
- GitHub App installation repository/readback endpoints: <https://docs.github.com/en/rest/apps/installations?apiVersion=2026-03-10>
- Enterprise organization installations: <https://docs.github.com/en/enterprise-cloud@latest/rest/enterprise-admin/organization-installations?apiVersion=2026-03-10>
- Enterprise audit log: <https://docs.github.com/en/enterprise-cloud@latest/rest/enterprise-admin/audit-log?apiVersion=2026-03-10>
- Code-security configurations: <https://docs.github.com/en/rest/code-security/configurations?apiVersion=2026-03-10>
- Code Scanning: <https://docs.github.com/en/rest/code-scanning/code-scanning?apiVersion=2026-03-10>
- Secret Scanning: <https://docs.github.com/en/rest/secret-scanning/secret-scanning?apiVersion=2026-03-10>
- OpenAI Vault MCP credentials: <https://developers.openai.com/api/reference/typescript/resources/beta/subresources/agents/subresources/vaults>

## Exit gate

### Repository-side 04A exit

- least-privilege Reader ceiling is explicit and contains no Controller/write grant;
- allowlisted MCP capability names are explicit;
- Codex-to-gateway and gateway-to-GitHub credential boundaries are explicit;
- Code/Secret/Dependabot readback requirements are explicit;
- Secret Scanning literal-secret suppression is mandatory;
- Enterprise audit-log contradiction and PAT-only compatibility surfaces are fail-closed and not papered over;
- effective target GitHub App grants are truthfully `NOT_PROVEN` until provider setup;
- no provider/credential mutation occurred.

### Downstream provider exit

After a separately authorized GitHub App/MCP provider setup, effective grants and repository scope must be read back from GitHub and each enabled Reader capability must return real provider evidence. Independent `CAPITAL-AI-SEC` verification remains separate. No Controller mutation is enabled by Reader success.
