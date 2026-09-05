# ADR-0066 — Passkey-only Human/Owner PR Authorization

- **Authority ID:** `AUTH-ADR-PASSKEY-OWNER-PR-AUTHORIZATION-0066`
- **Lifecycle:** `HISTORICAL — NON-AUTHORIZING`
- **Original Status:** `PROPOSED`
- **Original Date:** 2026-08-12
- **Retired:** 2026-09-01
- **Decision owner:** SvenKulessa
- **Historical Scope:** DevelopmentChain M10 / Pull-Request authorization before expensive CI
- **Current disposition:** Productive M10 `AUTHORIZE_PR_CI` is `RETIRED / ARCHIVED / OFF`; this ADR cannot reactivate it.
- **Current authority:** `/AGENTS.md`, `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`, `docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md`
- **Retirement evidence:** `docs/projects/operations/evidence/M10_PASSKEY_RETIREMENT_2026-09-01.md`

## Historical disposition

This file preserves the former ADR-0066 proposal for audit and traceability only. The productive M10 passkey/WebAuthn PR-CI authorization runtime was retired on 2026-09-01. Normal PR technical CI no longer requires or expects an M10 implementation. Historical M10 `VERIFIED PASS` evidence does not create current implementation authority or a reactivation backlog.

Any future passkey- or WebAuthn-based PR authorization architecture requires a new, separately scoped Human/Owner architecture, security and governance decision against then-current repository state. Neither this ADR nor archived ESS-0022 may authorize that future work.

## Historical decision record

The original proposal described a staged migration from transitional Owner approval signals to a repository-state-bound WebAuthn ceremony. The intended target sequence was:

`PR OPEN/UPDATE → OWNER FILE REVIEW → CURRENT PR STATE → PASSKEY CHALLENGE → VERIFIED OWNER ASSERTION → ONE CI REQUEST → HUMAN MERGE`

The proposal required the authorization transaction to bind the Owner, repository, PR number, base branch/SHA, current head SHA, changed-file-set hash, diff/review digest, action, challenge ID, issued-at/expiry and replay state. It required server-generated cryptographic challenge material, exact RP ID/origin verification, registered Owner credential binding, assertion signature verification, User Presence and User Verification, revocation checks and exact PR-state matching.

The proposed audit model excluded private keys, authenticator secrets, biometric material and reusable credentials. It required replay protection, single-use approval consumption, state invalidation after commits/base/diff changes, and Human-only merge authority.

The original rollout model was:

1. design and implementation;
2. unit/integration/security testing;
3. Owner credential enrollment and recovery proof;
4. shadow verification while the then-current gate remained authoritative;
5. decision comparison;
6. controlled passkey-only cutover;
7. legacy authorization cleanup;
8. final evidence and roadmap synchronization.

The original threat model covered wrong credentials, RP/origin mismatch, missing UP/UV, stale or replayed challenges/assertions, wrong repository/PR/base/head, changed file/diff state, unavailable verifier/audit persistence, revoked credentials, duplicate CI requests and agent self-approval.

## Why this is historical now

Current repository authority changed after the original proposal and later M10 implementation history:

- the former M10 productive runtime and `AUTHORIZE_PR_CI` path are retired/off;
- normal PR CI proceeds without M10;
- current-state discovery must not classify absence of M10 implementation as a gap;
- Human/Owner PR-creation approval remains bound to current `main SHA` and `branch head SHA` unless a current scoped delegation applies;
- Human merge remains separate and Human-only;
- a future passkey architecture requires a new explicit decision.

Therefore ADR-0066 is retained only as historical architecture context and evidence provenance.