# GOV-PR-LABEL-01 — Pre-Create Pull Request Project Label Classification

**Project:** `CAPITAL-AI-GOV`  
**Primary PVC:** `PVC-05`  
**Authority:** `/AGENTS.md@CURRENT_MAIN`  
**Baseline:** `main@896722e55ab1304bd798da6fc8c6f2d9b178a12e`  
**Status:** `POST_CREATE_PIPELINE_SUPERSEDED / PRE_CREATE_IMPLEMENTED_BRANCH`

## Owner supersession

Human Owner direction on 2026-09-21 supersedes the former post-create Full-Set Label Classification design. PR classification is no longer a dedicated `pull_request` pipeline/check. The project classification must already be resolved before the external Pull Request create mutation, and the resulting colored project label is supplied during PR creation.

The former read-only post-create workflow is retained only as an inert `workflow_dispatch` tombstone with `if: false`, no automatic event and no normal runner allocation. This satisfies the existing workflow-deletion security gate without preserving post-create classification behavior. This is a behavioral replacement, not a second label architecture.

## Canonical classification source

The classifier resolves exactly one current project row from `docs/projects/README.md@CURRENT_MAIN`:

`Project ID → canonical project folder → display name → symbol → color`

The canonical GitHub label is:

`project:<PROJECT_ID>`

Its color is the same hexadecimal project color from the canonical routing row. Color is presentation metadata only; the textual Project ID remains the semantic identifier.

Examples:

| Project | Label | Canonical color |
|---|---|---|
| `CAPITAL-AI-GOV` | `project:CAPITAL-AI-GOV` | `#A1A1AA` |
| `CAPITAL-AI-FE` | `project:CAPITAL-AI-FE` | `#DC7CA8` |
| `CAPITAL-AI-OPS` | `project:CAPITAL-AI-OPS` | `#845CDC` |

## Execution contract

1. Final PR create correlation resolves Project/Owner/PVC against fresh `CURRENT_MAIN`.
2. `renderPullRequestBody.mjs` exposes the already resolved `project_id`.
3. `prLabelClassification.mjs` resolves project presentation from the trusted current-main mapping and emits label name/color/description.
4. The PR-create path ensures the repository label exists with that canonical color before PR creation.
5. `gh pr create --label <resolved-label>` creates the PR with the already selected label.
6. Missing/duplicate project mapping or malformed color fails closed before PR creation.
7. No post-create label classifier workflow or required label-classification status check is used.

## Validation boundary

The classifier may have normal regression tests as source-code validation. Those tests are not the operational classification mechanism and do not classify a live PR. Runtime classification occurs only in the pre-create PR path.

Labels never authorize merge, never replace Human/CODEOWNER review and never weaken Security, Compliance, Ownership or Auto-Merge Safety gates.

## Superseded implementation

Retired by this slice:

- automatic execution of `.github/workflows/pr-label-classification.yml` (file retained only as an inert no-runner tombstone)
- post-create consumption of `github.event.pull_request.labels`
- `--fail-on-drift` as a dedicated PR status check
- runner allocation solely to classify labels after PR creation

The stable work-package identity `GOV-PR-LABEL-01` is retained and evolved rather than duplicated.

## Exit Gate

- classification occurs before the PR-create mutation;
- exactly one canonical project label is resolved;
- label color is sourced from `docs/projects/README.md`, not a second color registry;
- the repository label is ensured before PR creation;
- the PR create command carries the resolved label;
- the former dedicated PR label-classification workflow has no automatic trigger and its only job is statically disabled;
- ordinary regression tests cover fail-closed mapping behavior;
- final merge remains Human/CODEOWNER gated because this slice changes Governance/control-plane behavior.
