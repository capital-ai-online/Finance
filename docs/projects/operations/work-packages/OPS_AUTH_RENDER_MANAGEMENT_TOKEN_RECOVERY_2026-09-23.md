# OPS-AUTH-RENDER-MGMT-TOKEN-RECOVERY-01 — Post-Merge Render Auth-Control Recovery

**Owner:** CAPITAL-AI-OPS  
**PVC:** PVC-02 / PVC-08  
**Baseline:** `main@98c8889ac5f34c8123470b9b5ac57648ccd38877`

## Observed production drift

PR #1331 is Human/CODEOWNER-merged. The canonical main CI triggered Render deploy `dep-daq378mk1f9s738adt70` within the five-minute post-merge SLA, but the new container exited during startup with `SUPABASE_MANAGEMENT_ACCESS_TOKEN_MISSING`. Build output itself completed successfully. The previous production deployment remained active; the new Supabase schema migration was not applied.

## Bounded remediation

The runtime Auth configuration controller keeps `SUPABASE_MANAGEMENT_ACCESS_TOKEN` as the canonical credential name and resolves two already-established server-only aliases when the canonical key is absent:

- `CAPITAL_AI_SUPABASE_MGMT_ACCESS_TOKEN`;
- `SUPABASE_ACCESS_TOKEN`.

No credential value is printed or stored in repository evidence. Resolution remains fail-closed when no valid token exists. No new provider, secret, credential store, Auth architecture or deployment path is introduced.

## Exit gate

1. Exact-head required checks PASS.
2. Human/CODEOWNER merge.
3. GitHub main CI deploys the exact merged SHA to Render.
4. Render is `live` and health/deployment identity matches then-current `main`.
5. Only after Render convergence: apply the merged Supabase migration through the versioned provider migration path, run advisors/readback, then execute the registration user test.
