# OPS-RENDER-MANAGEMENT-HARDENING-01

**Project:** CAPITAL-AI-OPS
**Owner/PVC:** CAPITAL-AI-OPS / PVC-02; supporting PVC-08/PVC-18
**Baseline:** main@24c78d49cc35aafbd5b3e8dc07b7e5a13ebb9553
**Branch:** agent/operations-render-management-hardening-20260924-v2
**State:** IMPLEMENTATION_ON_BRANCH / SETTINGS_INVENTORY_VALIDATING / PROVIDER_MUTATION_NOT_EXECUTED
**Merge:** HUMAN_MERGE_REQUIRED

## Scope

This package adds one bounded Render management surface that reuses the existing
Render API secret and workspace variable. It does not create another deployment,
billing, credential, or container-security authority.

The adapter is limited to:
- read-only Render inventory;
- read-only projection of Workspace plan limits, service/compute/build settings, health path, region, auto-deploy, previews, edge-cache profile, notification override, custom domains, workflow/task/task-run inventory and bounded bandwidth metrics;
- exact-identity cleanup planning for historical suspended validation services;
- registry-credential usage readback before any removal eligibility;
- truthful reporting when pipeline-minute or spend-limit controls are not exposed
  by the public Render API.

Provider mutations are not executed from this branch. The workflow is main-only,
Owner-dispatched, and requests only repository contents read permission.

## Security decisions

The productive Finance service is excluded from historical-service cleanup.
Any identity drift blocks cleanup. Registry credential removal remains blocked
while Render reports a live service consumer.

The private GHCR path remains active because current main contains successful
exact-image scanning, private digest publication, Cosign keyless signing,
provenance, SBOM attestation, and verification. This package does not retire
those controls.

GitHub id-token permission remains unchanged in workflows that actually consume
OIDC for authenticated mail delivery or keyless signing. The new Render
management workflow itself does not request OIDC permission.

## Pipeline-minute boundary

Hobby includes 500 pipeline minutes. The repository's public Render API reader
cannot observe exact current pipeline-minute usage and no supported public API
mutation for the workspace pipeline spend limit is available in the current
provider surface. The requested 480-minute early-warning capability is therefore
reported as NOT_SUPPORTED_BY_PUBLIC_API rather than inferred.

## Edge caching handover

The live Finance service currently reports Render edge-cache profile `no-cache`.
Render can edge-cache paid web-service static assets and honors response-level
`Cache-Control`; current main already marks sensitive account/auth/admin responses
with `no-store`, while selected public read projections carry explicit cache
policies.

This OPS package therefore records `common-static-files` as a read-only
recommendation only. It does not enable it on the provider. `all-files` remains
blocked because dynamic routes include identity, account, admin, market-data and
other stateful responses; every dynamic response would need complete explicit cache
semantics before that provider setting could be considered.

Current market-price requests remain FINTECH-owned. Their freshness and entitlement
semantics are not changed by this OPS package.

## Live inventory evidence (2026-09-24)

- Workspace plan confirmed as Hobby by the configured plan projection and Billing UI.
- Hobby limits: 25 services, 2 custom domains, 5 GB outbound bandwidth and 500 Starter pipeline minutes.
- Current live inventory: 23 services total; 1 active Finance web service and 22 suspended historical validation static sites.
- Finance: Starter compute/build, Frankfurt, Docker, `/healthz`, auto-deploy off, PR previews off, Render subdomain disabled and edge-cache profile `no-cache`.
- Finance month-to-date bandwidth metric through the Render metrics surface is approximately 1.47 GB; the Billing UI independently showed 1.46 GB workspace usage.
- Custom-domain API, workflow/task/task-run API and service-notification override are now part of the bounded read-only inventory. Inputs/outputs, environment variables and provider tokens are never projected.
- Workspace overlapping-deploy policy is not exposed by the public API used here; Dashboard evidence shows `Wait` and the adapter reports that gap rather than fabricating an API read.
- Exact pipeline-minute usage remains Billing-UI-only in the current provider surface; the latest Dashboard evidence showed 369/500 minutes and the adapter continues to report API usage as not observable.

## Exit evidence

- branch contains fresh CURRENT_MAIN;
- tests cover exact service identity, Finance exclusion, credential in-use
  blocking, truthful provider-capability reporting and GET-only settings inventory;
- inventory tests prove provider tokens and registry usernames are not projected;
- workflow is main-only and Owner-dispatched with least privilege;
- no protected provider mutation is executed before Human/CODEOWNER merge;
- changed-file and semantic overlap are rechecked immediately before PR creation.
