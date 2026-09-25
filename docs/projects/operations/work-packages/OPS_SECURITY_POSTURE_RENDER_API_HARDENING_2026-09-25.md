# OPS Security Posture + Render API Hardening — 2026-09-25

## Status

`IMPLEMENTED_ON_BRANCH / PROVIDER_READBACK_PENDING / HUMAN_MERGE_REQUIRED`

Project: `CAPITAL-AI-OPS`
Primary PVC: `PVC-02`
Supporting PVC: `PVC-07 / PVC-08 / PVC-18`
Branch: `operations/security-posture-deploy-api-hardening-20260925`
Base: `main@1e8904dfec75a2ebb03bae8654133137708f1e3b`

## Trigger

The Owner requested one bounded manual workflow that reuses the existing Enterprise read credential and correlates repository, GitHub Enterprise/Organization/Repository settings, Render, Supabase and production security posture without creating a second authority plane.

A user-supplied GitHub secret-risk export dated 2026-09-25 reports three aggregate secret classes in one repository:
- Generic Private Key — 1 observation; push-protected=false; non-provider pattern=true.
- HTTP bearer authentication header — 1 observation; push-protected=false; non-provider pattern=true.
- Stripe Test API Secret Key — 1 observation; push-protected=true; non-provider pattern=false.

The export contains no alert location or secret value. These observations therefore remain `LOCATION_NOT_PROVEN` until provider evidence identifies the exact alert location. No repository secret is declared compromised by this work package.

## Observed current state

- Canonical production repository: `capital-ai-online/Finance`.
- Render Finance is bound to `main`, native auto-deploy is off, and the runtime reports one production instance.
- Render Finance currently has automatic PR previews enabled in provider state. This is a provider-side hardening gap because service previews can create additional temporary instances. No provider mutation is performed by this branch.
- The canonical `.github/workflows/ci.yml` still referenced the deleted `RENDER_DEPLOY_HOOK_URL`.
- The existing Render management authority already uses `CAPITAL_AI_RENDER_API_KEY`.
- Supabase AIFINANCIAL is active/healthy. Current provider security advice reports leaked-password protection disabled.
- Current public Sitelemetry baseline reports missing Permissions-Policy and Cross-Origin-Opener-Policy plus low-severity edge server disclosure.

## Implementation

### 1. Manual private posture workflow

`.github/workflows/private-security-posture-read.yml`:
- `workflow_dispatch` only;
- exact `main` + Owner actor gate;
- top-level `contents: read` only;
- no OIDC/write permission and no artifact upload;
- reuses the existing GitHub Enterprise read PAT, GitHub App private key, Render API key, Supabase management token and DB read URL where configured;
- deletes temporary credentials/evidence on every outcome;
- preserves provider gaps as `NOT_OBSERVABLE`.

The workflow reuses the existing `runPrivateGitHubSettingsInventoryRead.mjs` authority and adds a bounded incident-evidence reader for:
- Enterprise audit events relevant to apps/tokens/secrets/repositories/actions;
- Organization GitHub App installation metadata;
- Organization and Finance Actions secret metadata for a fixed allowlist of expected secret names;
- never secret values.

### 2. Supabase read-only posture

The workflow reads:
- migration ledger and database posture under `default_transaction_read_only=on`;
- public table RLS coverage;
- SECURITY DEFINER count;
- Auth configuration through the existing Supabase management credential using a GET-only safe-key projection.

No Supabase setting, row, migration or Auth configuration is mutated by this workflow.

### 3. Deployment authority convergence

The existing `deploy-production` job remains the sole GitHub-to-Render deployment lane.

The deleted deploy hook dependency is removed. The job now:
1. validates the signed/attested main build,
2. re-resolves live `main`,
3. fails if `main != VERIFIED_COMMIT_SHA`,
4. calls the existing Render API credential for the exact 40-character verified commit,
5. performs the existing post-deploy runtime identity verification.

Render native auto-deploy remains off. No second deployment controller is introduced.

### 4. Browser hardening

The active production response path adds:
- `Permissions-Policy` with unused high-risk browser capabilities disabled;
- `Cross-Origin-Opener-Policy: same-origin-allow-popups` to retain OAuth/payment popup compatibility;
- `Cross-Origin-Resource-Policy: same-site`.

Existing CSP, HSTS, nosniff, X-Frame-Options and Referrer-Policy remain unchanged.

The public `server: cloudflare` disclosure is an edge-provider signal and is not falsely claimed as application-code-remediated.

## Provider/Human boundaries

The following remain external/provider actions and are not mutated by this branch:

1. Disable automatic PR previews on the production Render Finance service.
2. Determine exact locations and validity of the three GitHub risk-assessment observations.
3. Confirm whether the Enterprise read PAT can observe Enterprise audit log, GitHub App installation inventory and secret metadata. Missing scopes remain `NOT_OBSERVABLE`.
4. Any GitHub Enterprise/Organization policy change.
5. Supabase leaked-password protection if the active plan does not expose the feature.
6. Human/CODEOWNER merge.

## Exit evidence

- Branch contains fresh CURRENT_MAIN.
- No changed-file overlap with open PR #1460.
- Required focused tests cover the manual workflow contract, bounded GitHub evidence projection, exact-commit Render API trigger and browser headers.
- Full required CI/Governance/Security checks remain to be run on the exact PR head.
- After Human/CODEOWNER merge, the manual posture workflow can be started from `main`.
- Provider findings become `VERIFIED` only after workflow/readback evidence; missing evidence remains `NOT_OBSERVABLE`.
