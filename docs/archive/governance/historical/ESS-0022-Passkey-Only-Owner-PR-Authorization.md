# ESS-0022 — Passkey-only Human/Owner PR Authorization

**Status:** `HISTORICAL — RETIRED — NON-AUTHORIZING`  
**Original status:** `PROPOSED — IMPLEMENTATION BLOCKED BY M9`  
**Version:** `1.0.0`  
**Original date:** 2026-08-12  
**Retired:** 2026-09-01  
**Historical scope:** CAPITAL-AI DEVELOPMENT Chain M10  
**Owner:** Platform Director / Human Owner  
**Related ADR:** `ADR-0066`  
**Retirement evidence:** `docs/projects/operations/evidence/M10_PASSKEY_RETIREMENT_2026-09-01.md`

## Current disposition

This specification is retained only as historical traceability for the former M10 passkey/WebAuthn `AUTHORIZE_PR_CI` architecture. The productive M10 runtime is `RETIRED / ARCHIVED / OFF`. Normal Pull Request technical CI does not require or expect this capability, and repository discovery must not classify its absence as an implementation gap.

This archived ESS grants no current capability, mutation authority, CI authorization, merge eligibility or implementation mandate. A future passkey/WebAuthn PR-authorization mechanism requires a new separately scoped Human/Owner architecture, security and governance decision against then-current repository state.

## Historical specification summary

The former specification described a repository-state-bound WebAuthn transaction with the intended sequence:

`PR OPEN / UPDATE → Human review → trusted current PR state → WebAuthn challenge → verified Owner assertion → immutable approval evidence → one CI request → Human merge`

Historical requirements included binding the Owner identity, repository, PR number, base branch and SHA, current head SHA, changed-file-set hash, diff/review digest, privileged action, challenge ID, issue/expiry time and replay state. The verifier was intended to enforce server-generated challenge randomness, expected HTTPS origin and RP ID, registered Owner credential binding, signature verification, User Presence, User Verification, challenge freshness, revocation state, replay protection and exact PR-state matching.

Historical audit requirements excluded private keys, biometric material, reusable authenticator secrets, passwords, TOTP secrets and recovery codes. The design required single-use approval consumption, rejection after repository/PR/base/head/diff drift, negative and replay testing, recovery controls and preservation of Human-only merge authority.

## Retirement boundary

The historical M10 implementation and evidence remain available for audit. They cannot independently reactivate this ESS. Current repository authority is resolved through `/AGENTS.md`, the Project Value Chain, the affected project Roadmap, applicable current ADR/ESS and current code/tests/evidence.
