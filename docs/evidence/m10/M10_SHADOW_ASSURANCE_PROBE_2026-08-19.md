# M10 Shadow Assurance Probe — 2026-08-19

Status: **NON-AUTHORITATIVE PROBE TARGET — DO NOT MERGE FOR FUNCTIONAL CHANGE**  
Authority: ADR-0066, ESS-0022, `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`

## Purpose

This documentation-only pull request exists solely as an unambiguous open-PR target for the mandatory M10 Phase-6 production Shadow WebAuthn ceremony.

A successful assertion against this PR MUST produce only `APPROVED_SHADOW` evidence. It MUST NOT create consumable `m10_approval_evidence`, MUST NOT create an `m10_ci_consumptions` claim, and MUST NOT dispatch GitHub Actions through Phase 5.

The probe is deliberately separated from unrelated SC-2 and DSGVO work so a Shadow assertion cannot be misread as Owner approval of another work package.

## Production preconditions already verified

- Phase 4, Phase 5 and Phase 6 are Human-merged on `main`.
- Production Render deployment is live on the Phase-6 merge commit.
- Phase-6 Supabase migration is applied in production.
- One active Owner passkey credential exists.
- `m10_shadow_evaluations` is RLS-protected, append-only and browser-inaccessible.
- No unconsumed authoritative M10 approval existed at probe creation time.

## Required evidence for this probe

1. Owner opens the production Supervisor M10 tab.
2. UI reports GitHub Resolver `konfiguriert` and at least one active Owner credential.
3. Owner enters this probe PR number and completes the physical passkey ceremony.
4. Production records exactly one matching `APPROVED_SHADOW` row.
5. Matching M5 audit evidence exists.
6. No matching `m10_approval_evidence` or `m10_ci_consumptions` row is created by the Shadow ceremony.
7. No GitHub Actions dispatch is attributable to the Shadow ceremony.

This file carries no authorization for merge, CI consumption, or any unrelated repository change.
