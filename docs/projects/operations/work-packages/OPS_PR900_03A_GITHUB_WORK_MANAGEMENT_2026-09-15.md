# OPS-PR900-03A — GitHub Work-Management Inventory & Package Materialization

**Project:** `CAPITAL-AI-OPS`  
**Project folder:** `docs/projects/operations/`  
**Primary PVC:** `PVC-02 — Controlled Implementation`  
**Primary Owner:** `CAPITAL-AI-OPS`  
**Parent:** `OPS-PR900-03 — GitHub Enterprise capability matrix`  
**Status:** `MERGED / CAPABILITY_GAP_VERIFIED`  
**Inventory baseline:** `main@ed584e36138427bb637af523df6e8ead994f6bda`  
**Merged PR:** `#950`  
**Merge SHA:** `1ef0b91ca6b3f61f23f8f1e449ae0deadf6b1ff3`  
**Post-merge verification baseline:** `main@2c4aca31e097a72ed979037eb6ecb66fec1d8619`  
**Original branch:** `agent/operations-github-work-management-20260915`  
**Trust root:** `/AGENTS.md@current-main`

## Purpose and authority boundary

GitHub Work Management is coordination/navigation only. It does not become a second authority for Roadmap, Project/PVC ownership, platform version, Governance, Security, Release, Deployment, PR creation or merge decisions.

Current-main correlation uses `/AGENTS.md`, `docs/projects/README.md`, `docs/projects/PROJECT_VALUE_CHAIN.md`, the OPS Roadmap/Work-Package register and accepted `ESS-0019`. The provider/model/connector remains an execution surface, never a trust root or authority source.

## Provider capability vs connected execution surface

The post-merge verification deliberately separates three evidence classes:

1. **GitHub-native repository feature state** — provider metadata reports `has_issues=true`, `has_projects=true` and `has_wiki=true`; repository metadata also exposes the canonical Milestones URL and Issue update supports association to a known milestone number.
2. **Connected ChatGPT GitHub connector capability** — only operations actually exposed by the connected connector are treated as executable/readable through this chat surface.
3. **Object-level proof** — feature-enabled metadata is not promoted to proof that Organization Projects, Project Fields, Milestone objects, Issue Types, Organization Issue Fields or Wiki pages can be fully enumerated, mutated and read back through the connected connector.

`NOT_AVAILABLE_ON_CURRENT_CONNECTOR` therefore means only that the current execution surface does not expose the required capability. It never means the GitHub-native object or feature does not exist.

## Current connected GitHub capability inventory

| Category | GitHub-native/provider evidence | Connected connector classification | Reproducible evidence |
|---|---|---|---|
| Issues | repository feature enabled | `AVAILABLE` | Finance metadata reports `has_issues=true`; Issue search/read and create/update actions are exposed. No Issue mutation was executed during the post-merge verification. |
| Labels | native Issue/PR metadata surface exists | `PARTIAL_SURFACE — ISSUE_LABEL_ASSIGNMENT_AVAILABLE / ENUMERATION_NOT_AVAILABLE_ON_CURRENT_CONNECTOR` | Issue/PR label assignment actions are exposed; no complete label-object inventory/create surface is exposed by the connector. |
| Milestones | repository exposes milestone relationship/URL semantics; Issue mutation accepts a known milestone number | `PARTIAL_SURFACE — ISSUE_MILESTONE_ASSIGNMENT_AVAILABLE / OBJECT_ENUMERATION_MUTATION_READBACK_NOT_AVAILABLE_ON_CURRENT_CONNECTOR` | A known milestone number can be associated to an Issue, but complete milestone object list/create/edit/readback is not exposed through the connected connector. |
| Issue Types | GitHub-native object existence is not denied | `NOT_AVAILABLE_ON_CURRENT_CONNECTOR` | Issue create/update schemas expose no native Issue Type field and no Issue-Type inventory/mutation/readback action is present. |
| Organization Issue Fields | GitHub-native object existence is not denied | `NOT_AVAILABLE_ON_CURRENT_CONNECTOR` | No organization Issue-field inventory/mutation/readback action is exposed. |
| Organization Projects / Project Fields | repository reports `has_projects=true` | `REPOSITORY_FEATURE_ENABLED / OBJECT_SURFACE_NOT_AVAILABLE_ON_CURRENT_CONNECTOR` | Feature-enabled metadata is visible, but Organization Projects/Project Fields cannot be completely inventoried, mutated and read back through the current connector. |
| Wiki Pages / Navigation | repository reports `has_wiki=true` | `REPOSITORY_FEATURE_ENABLED / PAGE_SURFACE_NOT_AVAILABLE_ON_CURRENT_CONNECTOR` | Feature-enabled metadata is visible, but Wiki pages/navigation cannot be inventoried, mutated and read back through the current connector. |

No category is `EMPTY_VERIFIED`: unavailable object classes cannot be completely enumerated from this execution surface, so absence is not claimed.

## Taxonomy preference

1. native GitHub Issue Types;
2. structured Organization Issue Fields;
3. Labels only for remaining facets;
4. Milestone only as a non-versioned delivery cohort;
5. Project Status only as workflow state.

If later required, the intended milestone is `GitHub Work Management Pilot`. It must not represent a platform, Release or Deployment version. Platform version remains governed outside Work Management.

## Wiki contract

Intended navigation only:

`Home -> CAPITAL-AI Projects -> CAPITAL-AI-OPS -> OPS-PR900-03A/03B`

Wiki pages may contain navigation/backlinks only and must not duplicate normative Roadmap/ADR/ESS/Governance/Security/Release content.

## OPS-PR900-03A post-merge result

**State:** `MERGED / CAPABILITY_GAP_VERIFIED`

PR #950 was Human/CODEOWNER merged into main with merge SHA `1ef0b91ca6b3f61f23f8f1e449ae0deadf6b1ff3`. The current post-merge verification was then repeated against `main@2c4aca31e097a72ed979037eb6ecb66fec1d8619` under `/AGENTS.md` v2.11.0.

03A is complete because the requested work-management categories now have an explicit provider-versus-connector classification and the remaining gap is bounded to the currently available execution surface. 03A completion does **not** imply that missing connector capabilities are provider/product gaps, and it does not authorize connector, OAuth, permission or GitHub-provider configuration changes.

## OPS-PR900-03B

**Flow:** `Taxonomy -> Issue Intake -> Organization Project -> Milestone -> PR -> Done -> Wiki Navigation`  
**State:** `BLOCKED / NOT_STARTED`  
**Blocker:** `CONNECTOR / EXECUTION-SURFACE GAP`

03B may execute only when the already authorized execution path exposes all required object/mutation/readback surfaces. The minimum unblock set is:

- Organization Projects V2 and Project Fields: inventory + mutation + readback;
- Milestone objects: inventory + create/edit/association + readback;
- Wiki navigation/pages: inventory + write + readback;
- the resulting Project Status transition to `Done` must be reproducibly observed rather than inferred.

Because the current connected connector does not expose that complete set, no partial Issue/Project/Milestone/Wiki pilot is created and no partial flow counts as success.

## Historical writer correlation for original 03A branch

At original branch creation against `main@ed584e36138427bb637af523df6e8ead994f6bda`:

- open Pull Requests: `0`;
- no changed-file overlap with the four original OPS target documentation surfaces was observed;
- no semantic/namespace/authority conflict was identified for the bounded coordination-only package.

During later synchronization, two same-file OPS Roadmap writers were observed:

- `agent/operations-ops18-main-projection-20260915` — OPS-18 evidence projection;
- `agent/operations-social-p1-tts-runtime-20260915` — separate Social/TTS package/runtime/test scope.

They were semantically separate from the `OPS-PR900-03A/03B` namespace and their unmerged content was never imported into the 03A branch.

## Post-merge current-writer correlation

Against `main@2c4aca31e097a72ed979037eb6ecb66fec1d8619`:

- open Pull Requests: `0` at the post-merge verification pass;
- `agent/operations-ops18-main-projection-20260915` remains a stale/diverged same-file Roadmap writer limited to OPS-18 projection changes;
- `agent/operations-social-p1-tts-runtime-20260915` remains a stale/diverged same-file Roadmap writer for the separate Social/TTS namespace plus its own runtime/test surfaces;
- `agent/operations-consent-migration-ledger-20260916` is file-disjoint from the 03A/03B Roadmap/Work-Package/detail targets;
- none of these writers changes the 03A/03B GitHub Work-Management namespace or authorizes provider/connector mutation.

Same-file Roadmap writers remain a final correlation trigger before any later Human merge decision, but they do not convert the current 03A/03B post-merge documentation slice into a semantic conflict.

## Validation

- Project/PVC/Owner: `CAPITAL-AI-OPS / PVC-02 — Controlled Implementation`;
- Trust root: `/AGENTS.md` v2.11.0 at post-merge verification baseline;
- accepted capability contract: `ESS-0019` v1.2.0, including provider-not-trust-root and read/mutation separation;
- 03A: `MERGED / CAPABILITY_GAP_VERIFIED`;
- 03B: `BLOCKED / NOT_STARTED` due connector/execution-surface gap;
- provider feature flags are not misreported as object-level connector capability;
- no Issue, Project, Milestone, Wiki, OAuth, permission, connector or provider mutation was executed by the capability verification;
- runtime/build validation remains `NOT_RUN` for this documentation-only post-merge status synchronization; `NOT_RUN` is not `PASS`.
