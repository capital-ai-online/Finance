# M10 Shadow Assurance Probe 2 — 2026-08-19

Status: OPEN-PR TARGET FOR PHASE-6 PRODUCTION SHADOW ASSERTION
Authority: ADR-0066, ESS-0022, `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`

## Purpose

PR #422 was merged before the required production Shadow WebAuthn ceremony. The M10 trusted PR-state resolver intentionally authorizes only open pull requests, therefore #422 cannot be reused as the Phase-6 Shadow target.

This evidence-only change creates a fresh, semantically neutral open PR from the current `main` solely for the real Owner WebAuthn Shadow assertion.

## Invariants

- This PR is not a functional feature approval.
- Shadow verification must resolve the exact current PR base/head/file-set/diff from GitHub.
- Expected result is `APPROVED_SHADOW` only.
- `authoritativeForCi` remains `false`.
- `dispatchEnabled` remains `false`.
- No row may be added to authoritative Phase-5 approval/consumption evidence as a consequence of this Shadow assertion.
- No GitHub Actions dispatch may be initiated by the Shadow path.
- Human-only merge remains separate.

## Production prerequisites

- Phase 6 is merged and deployed.
- `m10_phase6_shadow_evidence` is applied in production.
- One active Owner passkey credential exists.
- `M10_GITHUB_TOKEN` is supplied server-side via Render `finance-secrets.env` with repository-scoped Pull Requests read permission only.

## Expected assurance flow

`Owner session -> live open PR -> M10 challenge -> physical passkey assertion -> Phase-4 verifier -> immutable m10_shadow_evaluations -> M5 audit`

After the ceremony, production evidence must prove `APPROVED_SHADOW` and zero Shadow-triggered authoritative CI consumption/dispatch before Controlled Cutover work may begin.
