# OPS-GITHUB-SETTINGS-EFFECTIVE-EXPORT-01 — Enterprise → Organization → Repository Settings Inventory

**Project:** CAPITAL-AI-OPS  
**Primary PVC:** PVC-02; supporting PVC-08/PVC-18  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Owner direction:** 2026-09-24 — complete the GitHub settings inventory, add effective-policy resolution, and produce versioned redacted JSON/Markdown exports  
**Fresh baseline:** `main@57ccdfeeedd6fb16212d9c55699fe77745900dc3`  
**Branch:** `operations/github-enterprise-403-diagnostics-20260924`  
**Status:** IMPLEMENTATION_ON_BRANCH / ENTERPRISE_403_DIAGNOSTICS  
**Merge authority:** HUMAN_MERGE_REQUIRED

## Purpose

Extend the existing bounded GitHub settings reader without creating a second settings authority or a mutation plane. The output is read-only evidence that correlates Enterprise, Organization and `capital-ai-online/Finance` settings and highlights improvement opportunities without changing provider state.

## Scope

1. Enterprise Actions policy through the existing read-only Enterprise PAT boundary:
   - Actions enablement policy;
   - selected actions/reusable workflows;
   - default `GITHUB_TOKEN` workflow permissions.
2. Organization additions:
   - selected actions/reusable workflows.
3. Repository additions:
   - selected actions/reusable workflows;
   - deployment environment/protection-rule inventory;
   - attached code-security configuration.
4. Effective policy projection:
   - Enterprise → Organization → Repository precedence;
   - full-length SHA pinning ceiling;
   - conservative default workflow-token permission;
   - PR-review approval ceiling;
   - selected-action observability/completeness.
5. Versioned export:
   - JSON schema `2.0.0`;
   - redacted Markdown summary;
   - runner-temporary files only;
   - Markdown projected into the Actions job summary.
6. Historical coordination cleanup:
   - release the merged #1173/#1175 claims;
   - terminalize the stale predecessor package.

## Security / privacy boundary

- Provider operations are GET-only.
- No generic raw REST proxy is introduced.
- The Enterprise read secret is never logged or persisted.
- Environment reviewer identities are redacted.
- Code-security configuration identity/description/reviewer identities are redacted.
- Selected-action patterns are exported because they are policy configuration, not credentials.
- Secrets, secret values, environment secret values, tokens and private keys are never exported.
- No Enterprise/Organization/Repository setting is mutated.
- No ruleset, IAM, billing, DNS, deployment or production setting is changed.

## Cost boundary

No scheduler is added and no new artifact upload is enabled by this slice. JSON/Markdown files remain runner-temporary and are removed at workflow completion. Downloadable artifact storage remains deferred until the existing zero-cost/shared-pool evidence gate explicitly admits additional evidence artifacts.

## Improvement analysis contract

The effective-policy layer may emit evidence-backed recommendations, but recommendations are non-authorizing. In particular:

- missing SHA-pinning enforcement is a supply-chain hardening finding;
- a write-default `GITHUB_TOKEN` is a least-privilege finding;
- Actions approval of pull-request reviews is a governance-risk finding;
- blanket verified-Marketplace allowance is a supply-chain review finding when selected-action mode is active;
- missing selected-action readback is an observability gap, not permission to broaden access;
- disabled code-scanning/default setup is review-only because licensing/provider controls may apply.

## Exit evidence

- exact branch head contains CURRENT_MAIN as ancestor;
- no changed-file overlap with open PR #1392;
- stale #1173/#1175 claims are `status=released`, `exclusive=false`;
- Enterprise selected-actions and workflow permission endpoints are bounded to the read-only Enterprise PAT;
- Organization/Repository selected-actions are read through the existing Organization installation;
- environment reviewer identities and code-security identities are redacted;
- effective policy never broadens a parent scope;
- targeted unit tests pass on exact head;
- workflow security/governance checks pass on exact head;
- final merge remains Human/CODEOWNER controlled.

## Acceptance criteria

- missing Enterprise PAT yields `NOT_OBSERVABLE`, not a permission-expansion request;
- unsupported capabilities fail before provider access;
- export schema is versioned and contains no secret/token value;
- effective policy is `PARTIAL_COVERAGE` whenever a required parent/child policy read is unavailable;
- improvement findings distinguish hardening opportunities from protected provider mutations;
- no second GitHub settings registry or provider mutation authority is created.


## Post-merge validation evidence — 2026-09-24

Run `#35988980160` on `main@e3951f8a1b82f9f6fa272c33ecc57a1de4fd2736` reproduced an independent-stage control-flow defect:

- `Read-only Enterprise License Usage Attribution` returned HTTP `403`;
- the job exited before `Read-only GitHub Settings and Retention Inventory` executed;
- therefore the newly configured Enterprise token could not be evaluated against the three Enterprise Actions settings endpoints;
- no secret or token value was logged.

The follow-up slice isolates each read-only evidence stage with its original step outcome and adds one final completion gate. Independent reads continue even after a peer-stage failure, while the overall workflow still fails if any required evidence stage did not succeed. Cleanup remains unconditional.

### Additional acceptance criteria

- an Enterprise license-read `403` must not suppress the Enterprise Actions settings inventory;
- independent evidence failures remain observable as their original step outcomes;
- the final job conclusion remains failing whenever a required read stage fails;
- runner-temporary private-key and evidence cleanup still executes under `if: always()`.


## Enterprise 403 diagnostics follow-up — 2026-09-24

Post-merge run `#35992205549` on `main@57ccdfeeedd6fb16212d9c55699fe77745900dc3` proved the failure-isolation change works as intended:

- the settings inventory executed even though the independent Enterprise consumed-license read remained blocked;
- all three Enterprise Actions policy reads returned HTTP `403`;
- Organization and Repository settings remained observable;
- Human Owner evidence confirms the configured Enterprise read token is a classic PAT with `admin:enterprise`, SAML SSO is disabled, and the PAT is stored as an Organization Actions secret.

The remaining gap is diagnostic observability, not permission to broaden provider access.

### Bounded diagnostics scope

The existing Enterprise settings client may expose only:

- observed OAuth scope names from `X-OAuth-Scopes`;
- accepted OAuth scope names from `X-Accepted-OAuth-Scopes`;
- whether `X-GitHub-SSO` is present, never its value or authorization URL;
- bounded rate-limit counters/reset/resource metadata;
- a sanitized provider message with URLs and token-like values redacted;
- a conservative classification such as `SSO_AUTHORIZATION_REQUIRED`, `RATE_LIMITED`, `FORBIDDEN`, or `NOT_FOUND_OR_HIDDEN`.

Raw response headers, Authorization values, PATs, GitHub App credentials, SSO authorization URLs and unknown provider metadata remain outside the evidence boundary.

### Additional exit evidence

- targeted unit tests prove SSO URL and token-like values cannot escape the client diagnostics;
- the projection layer independently re-redacts provider reason text and allowlists diagnostic fields;
- no Enterprise/Organization/Repository setting is mutated;
- the next manual `Private GitHub Billing Read` can distinguish the remaining 403 class without exposing credentials.
