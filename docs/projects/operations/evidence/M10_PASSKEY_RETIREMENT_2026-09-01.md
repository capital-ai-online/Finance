# M10 Passkey Retirement — OPS Evidence

**Project:** `CAPITAL-AI-OPS`  
**Project folder:** `docs/projects/operations/`  
**Affected OPS stages:** `PVC-02`, `PVC-04`, `PVC-08`  
**Date:** `2026-09-01`  
**Execution authorization:** `ADR-0104-S2`, project-bound to this OPS project  
**Authority boundary:** non-authorizing OPS execution evidence; Governance authority lifecycle and Security verification remain separate

## Objective

Permanently retire the productive DevelopmentChain M10 Passkey authentication/authorization implementation without deleting historical evidence or inventing a replacement authorization authority.

## Repository retirement target

The OPS candidate removes or terminates the productive M10 execution surface:

- `server/m10/*` implementation modules;
- `/api/m10/credential-enrollment` application route registration;
- active Owner enrollment/PR-authorization and shadow UI actions;
- M10-specific unit tests that test the retired implementation;
- M10 GitHub Actions `workflow_dispatch`, passkey/OIDC consumption gate, bootstrap/bypass logic and M10 endpoint dispatch;
- M10 runtime secret identities from the canonical Render secret-file manifest.

A read-only tombstone UI may remain only as an explicitly historical status projection and exposes no WebAuthn ceremony, enrollment, revocation or authorization endpoint.

Historical `docs/evidence/m10/**`, Governance-owned ADR/ESS/policy material and Security-owned threat-model material are not rewritten by this OPS work item.

## Production Supabase mutation

Connected production project: `AIFINANCIAL` (`ryzywoktpmyhwzxmstyu`, `eu-west-1`).

Applied migration: `20260901144312_retire_m10_passkey_authorization`.

Observed post-mutation state:

- active M10 Owner credentials: `0`;
- table privileges for `anon`, `authenticated` and `service_role` across the six M10 tables: `0`;
- historical rows retained;
- registration/authorization challenge history retained;
- the existing immutable authorization-challenge lifecycle guard was not weakened or bypassed.

The migration is represented in the repository as `supabase/migrations/20260901144312_retire_m10_passkey_authorization.sql`.

## Render correlation

The connected Render service `Finance` is bound to `SvenKulessa/Finance`, branch `main`, with native Auto Deploy off. Historical evidence states that M10 GitHub resolver/dispatch credentials were provisioned through the server-only `finance-secrets.env` secret file.

The available Render execution surface does not expose a safe secret-file entry deletion operation. No empty credential substitution and no destructive full environment replacement was performed. After this repository retirement is deployed, productive code contains no M10 token consumer and the canonical secret manifest no longer requests either M10 credential.

Provider-side physical secret-file cleanup therefore remains a provider-capability limitation, not an active application authorization path.

## Validation state

- current-main/project ownership correlation: PASS for OPS productive implementation;
- open-writer changed-file overlap at the last correlation: none with PR #683;
- production Supabase retirement mutation: VERIFIED by read-back (`0` active credentials, `0` runtime grants);
- local TypeScript/unit/build execution: NOT AVAILABLE on this connector-only execution surface;
- hosted exact-head CI: required after PR creation;
- independent Security verification: NOT CLAIMED / requires CAPITAL-AI-SEC if requested by current Security process;
- Governance authority supersession/archival: NOT EXECUTED by OPS and must be handled by CAPITAL-AI-GOV.

## Rollback / recovery boundary

Repository rollback requires a fresh Human-reviewed branch/PR from then-current `main`. Production credential/access restoration is intentionally not an automatic rollback: any future WebAuthn/PR authorization design requires new current Governance/Owner authority and a separately reviewed production mutation. Historical M10 evidence remains available for forensic/audit purposes but is non-authorizing.
