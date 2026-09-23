# OPS-AUTH-RENDER-MGMT-TOKEN-RECOVERY-01 — Post-Merge Render Auth-Control Recovery

**Owner:** CAPITAL-AI-OPS  
**PVC:** PVC-02 / PVC-08  
**Baseline:** `main@fdc6c2f1ad831bbd7fe7f9078231b855a744adc7`  
**State:** IMPLEMENTED_ON_BRANCH / HUMAN_MERGE_REQUIRED

## Observed production drift

The original registration/profile release introduced a Supabase Management API reconciler as a mandatory Node preload in the production container. PR #1334 widened the accepted environment-variable aliases, but the actual production service still has no usable Management API token under any accepted runtime alias.

The original Render failure evidence observed on `72a22038c88d3cc170cbecac6d04547d7226853d` remains deterministic:

- manual deploy `dep-daq4tgvlk1mc73bpsorg` failed with `SUPABASE_MANAGEMENT_ACCESS_TOKEN_MISSING`;
- deploy-hook retry `dep-daq4u7flot8c73fc13e0` failed the same way;
- build and Quality execution completed successfully before startup;
- PID 1 failed inside `scripts/operations/supabaseAuthRegistrationControl.mjs` before the application server could become healthy;
- the previous live production deployment remains `7c1d9293ee4c61e32791e447463fcaf263644c6d`.

The failure is therefore a runtime/control-plane boundary defect, not a database build failure.

## Bounded remediation

Supabase Management API reconciliation is removed from the public application runtime preload:

- `Dockerfile` no longer sets `CAPITAL_AI_SUPABASE_AUTH_CONFIG_CONTROL=true`;
- `NODE_OPTIONS` retains only the established R-002 runtime artifact guard;
- the Management API controller and email templates are no longer copied solely for runtime preload;
- `scripts/operations/supabaseAuthRegistrationControl.mjs` remains the canonical explicit operations command and continues to fail closed when directly invoked without a valid token;
- no credential value is moved, copied, logged or committed;
- no new provider, deployment controller or Supabase architecture is introduced.

This keeps privileged Management API credentials in an explicit control-plane context rather than making them a permanent availability dependency of the public web process.

## Exit gate

1. Exact-head Governance, build/test and Security checks PASS.
2. Human/CODEOWNER merge.
3. The canonical main deployment path deploys the exact merged SHA to Render.
4. Render becomes `live` and `/healthz` reports the then-current main identity.
5. Supabase Auth configuration is reconciled through the explicit Management API control path with a scoped credential, without exposing the credential to application logs.
6. Apply/read back the pending versioned Supabase migration, run security/performance advisors, then execute the registration user test.
