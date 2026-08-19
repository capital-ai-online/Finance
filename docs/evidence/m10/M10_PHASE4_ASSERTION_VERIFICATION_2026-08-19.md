# M10 Phase 4 — Assertion Verification Evidence

Status: IMPLEMENTED ON FRESH MAIN-SYNC BRANCH — PR VALIDATION PENDING / NOT PRODUCTION-WIRED  
Date: 2026-08-19  
Branch: `agent/m10-phase4-assertion-verification-main-sync`  
Baseline: `main@f8a1630ad7a39da9dd94fd4e12ed86d793c69385`  
Authority: ADR-0066, ESS-0022, `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`, M10 Threat Model

## Baseline and correlation review

The M10 Phase-4 implementation was re-evaluated after PR #415 was merged into `main`.

Verified current state:

- Phase 1 trusted PR-state resolver remains unchanged and recomputes repository, PR, base/head, changed-file-set hash and diff-review digest from GitHub state.
- Phase 2 challenge issuance remains unchanged and binds a cryptographically random short-lived challenge to the exact `AUTHORIZE_PR_CI` context.
- Phase 3 credential enrollment remains compatible with `@simplewebauthn/server` 13.x, requires User Verification and stores only public credential material.
- PR #415 changed Governance/AI-evidence files but introduced no file overlap with the three Phase-4 files.
- The previous Phase-4 branch was 20 commits behind the post-#415 `main`; its three-file delta was therefore reapplied onto this fresh branch from `main` instead of being blindly merged.
- Open PR #414 and PR #416 have no changed-file overlap with this Phase-4 scope.
- Phase 2 PR-authorization challenges still have no durable production store; the in-memory reference store remains non-production.
- No durable Phase-4 approval-evidence store exists yet.
- Phase 5 atomic CI consumption, Phase 6 shadow mode and Controlled Cutover remain separate work packages.

## Implemented scope

Added `server/m10/assertionVerification.ts` as logic-only Phase-4 implementation.

The verifier:

1. accepts only the canonical CAPITAL-AI Owner actor;
2. loads an UNUSED, unexpired M10 authorization challenge;
3. re-resolves the live GitHub PR state before verification;
4. compares owner, repository, PR number, base branch/SHA, head SHA, changed-file-set hash, diff-review digest and action exactly;
5. revokes and denies on PR-state drift;
6. resolves only an active enrolled Owner credential matching the WebAuthn response credential ID;
7. atomically consumes the challenge before signature verification to prevent assertion retry;
8. verifies the WebAuthn assertion through `@simplewebauthn/server` with configured RP ID/origin and `requireUserVerification: true`;
9. requires compare-and-set persistence of the authenticator signature counter;
10. creates approval evidence bound to `computeCanonicalAuthorizationDigest()`;
11. fails closed if approval evidence cannot be persisted;
12. emits no CI dispatch and no Phase-5 authority.

## Store contracts

Phase 4 defines explicit interfaces for:

- active credential lookup plus atomic counter update;
- immutable approval-evidence persistence.

These interfaces are deliberately not silently mapped to in-memory production stores. Production live wiring requires separately reviewed durable implementations.

## Tests added

`tests/unit/m10AssertionVerification.test.ts` covers:

- exact-state positive approval path;
- RP ID and User Verification requirements passed to the WebAuthn verifier;
- signature-counter advancement;
- authorization-digest evidence;
- head/diff drift → DENY plus challenge revoke;
- unknown/revoked credential → DENY before cryptographic verification;
- bad signature → challenge consumed and replay denied;
- failed atomic counter persistence → DENY;
- failed approval-evidence persistence → DENY.

## Current blockers / next work

Phase 4 must not be marked `VERIFIED PASS` until all relevant gates complete.

Remaining requirements:

1. Class-R PR CI and Governance PASS for this exact fresh-branch head;
2. durable Supabase-backed Phase-2 authorization-challenge store;
3. durable append-only Phase-4 approval-evidence store;
4. HTTP/browser assertion ceremony wiring after a real Owner credential has been enrolled;
5. production negative tests for wrong credential, wrong origin/RP, UV false, signature failure, expired/replayed challenge and PR drift;
6. Human merge and post-merge baseline verification.

Phase 5 atomic CI consumption and Phase 6 shadow mode remain separate work packages and are not authorized by this implementation.
