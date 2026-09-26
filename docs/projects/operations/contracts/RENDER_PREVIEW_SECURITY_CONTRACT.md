# Render Preview Security Contract

**Contract ID:** `OPS-RENDER-PREVIEW-SECURITY-01`  
**Owner:** `CAPITAL-AI-OPS`  
**Primary PVC:** `PVC-08 Production Operations`  
**Supporting PVC:** `PVC-02 Platform Engineering`, `PVC-18 Release Governance`  
**Status:** proposed implementation evidence on work branch; becomes current only after Human/CODEOWNER merge.

## Purpose

Keep the canonical Render production service isolated from automatic pull-request preview creation unless a separate, explicitly authorized preview trust boundary exists.

## Canonical production identity

The only production web service covered by this contract is:

- Service ID: `srv-d91o1o9o3t8c73edi55g`
- Name: `Finance`
- Type: `web_service`
- Branch: `main`
- Native auto deploy: `off`

A different ID, name, type, branch or suspension state is identity drift and blocks mutation.

## Required production preview posture

The converged Finance service MUST satisfy:

- `pullRequestPreviewsEnabled = no`
- `previews.generation = off`
- `autoDeployTrigger = off`
- `branch = main`
- `suspended = not_suspended`

The mutation path is bounded to the existing `.github/workflows/render-management.yml` workflow and the existing `CAPITAL_AI_RENDER_API_KEY` credential.

The exact confirmation phrase for this protected mutation is:

`DISABLE_FINANCE_PR_PREVIEWS`

## Preview authority rule

No preview authority exists by default.

If preview capability is introduced later, it requires a separate Human/Owner decision and a bounded contract that proves all of the following before activation:

1. preview runtime identity is distinct from Finance production;
2. preview resources correlate to an exact repository, pull request and head SHA;
3. production secrets, Enterprise administration credentials, Render management credentials and live payment credentials are not inherited;
4. preview database/data access is isolated from production unless an explicit read-only exception is approved;
5. production custom domains are not inherited;
6. preview resources have terminal lifecycle cleanup tied to pull-request closure or an explicit expiry;
7. provider readback can distinguish preview from production before any mutation.

Absent that contract, automatic and manual PR preview generation for Finance remains `DENY/OFF`.

## Secret boundary

Preview resources MUST NOT inherit or expose privileged production credentials, including but not limited to:

- GitHub Enterprise administration/read credentials beyond a separately scoped preview need;
- `CAPITAL_AI_RENDER_API_KEY`;
- Supabase service-role/secret management credentials;
- Stripe live secret credentials;
- production SMTP/OAuth credentials;
- TOTP encryption material;
- production Edge-Trust shared secrets.

Secret names may appear in security metadata evidence where required; secret values MUST NOT be projected.

## Suspended validation-service cleanup

Historical validation services are deletable only when all of the following match the allowlist:

- exact Render service ID;
- exact expected name;
- exact expected type;
- `suspended = suspended`.

`Finance` MUST never enter the cleanup plan.

A service omitted from a Render LIST response is NOT sufficient evidence of deletion. The cleanup adapter MUST perform an exact-ID read for list-missing allowlisted services and classify the result as:

- `PRESENT` — continue identity validation and bounded deletion;
- `ABSENT` — provider returned 404/410 and the service is treated as absent for this credential;
- `NOT_OBSERVABLE` — permission/read boundary blocks cleanup and the workflow fails closed.

When independent provider evidence disagrees with the workflow credential's view, the result remains an evidence conflict until the provider states converge.

## Current residual cleanup identity

The independently observed residual suspended static site is:

- ID: `srv-daemcseq1p3s739vd40g`
- Name: `capital-ai-fe-bb2e-build-4a296b58`
- Type: `static_site`

The dedicated bounded deletion action is:

- Action: `delete-exact-stale-static-site`
- Confirmation: `DELETE_EXACT_STALE_STATIC_SITE_SRV_DAEMCSEQ1P3S739VD40G`

It may delete only this exact identity and must prove absence immediately afterwards.

## Evidence states

- `PASS`: exact identity and required provider after-state are observed.
- `ALREADY_CONVERGED`: target state existed before mutation; no mutation claimed.
- `ALREADY_ABSENT`: exact provider read reports the resource absent; no mutation claimed.
- `NOT_OBSERVABLE`: current credential cannot establish provider truth.
- `BLOCKED_IDENTITY_DRIFT`: observed resource identity differs from the contract.
- `FAIL`: mutation or after-readback did not converge.

Missing evidence MUST NOT be converted to `PASS`.

## Exit evidence

The preview-hardening finding closes only after all of the following are true:

1. Human/CODEOWNER merged implementation is on `CURRENT_MAIN`;
2. Render Management executes the bounded preview-disable action;
3. independent Render readback reports:
   - `Finance.pullRequestPreviewsEnabled=no`;
   - `Finance.previews.generation=off`;
4. Finance remains active with native auto-deploy off;
5. no unexpected preview service is present;
6. the residual allowlisted suspended validation service is absent or explicitly classified `NOT_OBSERVABLE` with a precise unblock condition.
