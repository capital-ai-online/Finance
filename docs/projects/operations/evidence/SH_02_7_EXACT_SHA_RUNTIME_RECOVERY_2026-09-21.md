# SH-02.7 — Exact-SHA Runtime Recovery Capability Correlation

**Work package:** `OPS-08-B-SH-02 / SH-02.7`  
**Project / Owner:** `CAPITAL-AI-OPS`  
**Primary PVC:** `PVC-08 — Production Operations`  
**Supporting PVC:** `PVC-07 — Release Management`, `PVC-18 — EventMesh / Traceability`  
**Implementation baseline:** `main@53c38dbeaf85262ed1784ce3458d61b54f6da3bb`  
**State:** `CAPABILITY_IMPLEMENTED / ACTIVATION_HELD / HOSTED_VALIDATION_PENDING`

## Reconciled capability

The repository already has one protected production promotion chain:

`CI push/main -> exact build/provenance artifact -> deploy-production -> Render deploy hook ref=main -> deployment identity verifier`.

SH-02.7 reuses that chain. It does **not** call Render directly, does not read `RENDER_DEPLOY_HOOK_URL`, does not enable Render auto-deploy and does not introduce a second deployment workflow.

The recovery capability is the GitHub Actions job re-run endpoint applied only to the exact terminal `Deployment verifiziert / Render-Produktion` job of the exact `ci.yml` push run for the current `main` SHA.

## Fail-closed eligibility

A mutation is eligible only when all of these are true:

- trigger comes from the same repository and trusted `CI` or `Post-Merge Production Correlation` workflow path;
- source SHA is the still-current `main` SHA;
- Production `/healthz` is reachable but its deployment identity is not the exact expected SHA/main/repository/Render tuple;
- the exact `ci.yml` main/push run exists;
- the exact SHA-named supply-chain provenance artifact exists, is non-empty and unexpired;
- the canonical deploy job is terminal and rerunnable;
- the original CI run has not already consumed the one allowed recovery attempt;
- the 300000 ms cooldown has elapsed;
- the explicit activation variable `CAPITAL_AI_ENABLE_EXACT_SHA_RECOVERY` is `true`;
- the kill switch `CAPITAL_AI_DISABLE_EXACT_SHA_RECOVERY` is not `true`;
- `CURRENT_MAIN` and Production identity are re-read immediately before mutation.

A bare liveness failure is **not** reclassified into deployment identity drift and does not authorize this action.

## Verification

A successful second CI run attempt is read back independently through:

- `/healthz` status;
- `x-capital-ai-commit`;
- `x-capital-ai-branch`;
- `x-capital-ai-repo`;
- `x-capital-ai-provider`;
- strict `/readyz` readiness;
- the exact SHA-named provenance artifact.

Any mismatch fails the verification and leaves the recovery circuit exhausted after one attempt. No rollback or restore is activated.

## Validation state

Repository-hosted checks have not yet evaluated the final PR head. Until they do, implementation validation remains `PENDING`; this document does not manufacture a PASS.

## Activation boundary

This PR deliberately keeps `REDEPLOY_EXACT_SHA` `HELD` in the canonical Self-Healing contract and defaults the workflow to no mutation. The implementation can be activated only by a separately correlated follow-up after the current competing Supervisor test writer is terminal. This avoids creating an overlapping writer merely to change a shared projection expectation.
