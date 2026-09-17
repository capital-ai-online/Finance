# M10 — Passkey-only Owner PR Authorization Threat Model

Status: PROPOSED — IMPLEMENTATION BLOCKED BY M9
Date: 2026-08-12
Authority: ADR-0066, ESS-0022

## System Under Review

M10 authorizes one exact `AUTHORIZE_PR_CI` transaction through a CAPITAL-AI WebAuthn/passkey assertion. It does not authorize PR merge or general Owner impersonation.

## Protected Assets

- Human/Owner authorization decision;
- exact Finance PR state (base/head/file set/diff);
- registered Owner public credentials;
- WebAuthn challenge/approval state;
- M5 immutable approval audit evidence;
- CI request consumption state;
- Human-only merge boundary;
- recovery/revocation state.

## Trust Boundaries

1. Browser / authenticator ↔ CAPITAL-AI WebAuthn verifier;
2. CAPITAL-AI verifier ↔ trusted GitHub PR-state resolver;
3. verifier ↔ durable audit persistence;
4. approval record ↔ CI request mechanism;
5. AI agents/tools ↔ approval service;
6. recovery/break-glass operator ↔ credential registry;
7. GitHub PR mutations ↔ previously issued challenge/approval context.

## Adversaries / Failure Sources

- malicious external attacker;
- compromised browser/session;
- compromised or over-privileged AI agent;
- prompt/tool injection through repository or external content;
- stale/replayed approval material;
- malicious or accidental PR mutation after review;
- wrong RP/origin configuration;
- compromised/revoked credential;
- audit/verifier outage;
- CI event duplication/race;
- operator error during recovery.

## Threats and Required Mitigations

| Threat | Attack / Failure | Required Mitigation | Expected Failure Mode |
|---|---|---|---|
| RP confusion | assertion accepted for wrong relying party | exact RP ID verification | DENY |
| Origin confusion | assertion from wrong origin | exact HTTPS origin verification | DENY |
| Challenge replay | reuse prior valid assertion/challenge | random server challenge, short TTL, single-use state | DENY |
| Approval replay | reuse consumed approval to trigger CI again | atomic approval consumption / dedupe key | DENY/DEDUPE |
| Missing User Presence | assertion lacks UP | require authenticator UP flag | DENY |
| Missing User Verification | PIN/biometric/local verification not performed | `userVerification=required`, verify UV flag | DENY |
| Wrong credential | non-Owner credential signs | credential registry bound to Owner | DENY |
| Revoked credential | previously valid key used after revocation | revocation lookup before acceptance | DENY |
| PR head TOCTOU | new commit after challenge/review | bind exact head SHA; re-resolve before verify/consume | INVALIDATE/DENY |
| Base drift | PR retarget/base advances materially | bind exact base branch/SHA and re-resolve | INVALIDATE/DENY |
| File-set substitution | agent omits/changes files | canonical changed-file set recomputed from trusted GitHub state and hashed | DENY |
| Diff substitution | content changes while filenames remain | bind canonical diff/review digest | DENY |
| Agent self-approval | agent calls approval API as Owner | WebAuthn Owner assertion + principal boundary; agent cannot possess authenticator | DENY |
| Forged legacy evidence | emoji/checkbox/comment fabricated | legacy signals not authoritative after cutover | NO AUTHORIZATION |
| GitHub sign-in confusion | GitHub account uses passkey but no PR-specific assertion | CAPITAL-AI transaction requires own challenge/context | NO AUTHORIZATION |
| Stolen web session | attacker has application session | WebAuthn UV + exact challenge/context required | DENY without authenticator |
| Audit outage | verifier succeeds but evidence cannot persist | audit persistence before CI request | DENY |
| CI race | multiple consumers request CI | atomic consumption/idempotency key | one request only |
| Recovery bypass | weaker fallback grants PR authority | separate strong, audited recovery; no emoji/TOTP-only fallback | DENY |
| Credential enrollment abuse | agent enrolls credential for Owner | Owner-controlled enrollment with strong verification/audit | DENY |
| XSS/UI deception | attacker changes visible PR context | trusted server re-resolves canonical PR state; CSP/XSS controls; approval UI shows bound identifiers | DENY on context mismatch |
| Secret leakage | logs contain sensitive auth material | store public credential identifiers + verification metadata only; redact raw sensitive payloads | evidence safe |
| Clock abuse | stale challenge accepted | bounded server clock checks, issued/expiry validation | DENY |
| Verifier downgrade | UV/RP/origin checks disabled | protected configuration + negative tests + change governance | DENY / change blocked |
| Merge escalation | CI approval interpreted as merge approval | separate Human merge capability boundary | MERGE DENY for agent |

## Canonical Authorization Context

The service computes, rather than trusts from an agent:

```text
ownerId
repository
prNumber
baseBranch
baseSha
headSha
canonicalChangedFileSetHash
canonicalDiffReviewDigest
action = AUTHORIZE_PR_CI
challengeId
issuedAt
expiresAt
```

This context is hashed/serialized deterministically for audit and verification.

## TOCTOU Defense

The PR state MUST be resolved at least:

1. before challenge issuance;
2. at assertion verification;
3. immediately before approval consumption / CI request.

Any material mismatch invalidates the approval. The system must not "update" an old approval to a new head.

## WebAuthn Verification Boundary

Server verifies:

- challenge;
- RP ID hash / expected RP;
- HTTPS origin;
- credential ownership/registration;
- signature;
- `UP=true`;
- `UV=true`;
- credential status;
- freshness/replay;
- exact authorization context.

Authenticator private keys and biometric data remain outside CAPITAL-AI.

## Audit Boundary

Approval evidence is persisted before CI request and includes only non-secret references/verification metadata required to reconstruct the decision.

Audit failure is security failure, not observability-only degradation.

## Recovery Threats

Recovery must defend against:

- compromised account session;
- social-engineering downgrade;
- lost authenticator leading to bypass;
- agent-triggered credential deletion/enrollment;
- revocation not invalidating outstanding approvals.

Required controls:

- Human/Owner-only recovery authority;
- strong identity verification;
- reason and timestamp;
- credential lifecycle audit;
- invalidate affected challenges/approvals;
- post-recovery review.

## Required Security Tests

At minimum:

- wrong RP/origin;
- UP false;
- UV false;
- wrong/revoked credential;
- expired/stale challenge;
- replay;
- changed base/head;
- changed file-set/diff;
- audit outage;
- duplicate CI consumption;
- forged legacy signal;
- agent self-approval;
- recovery without strong Owner verification.

## Residual Risk

WebAuthn reduces credential phishing/replay risk but does not prove the Owner cognitively understood the diff. Human File Review remains a separate process control. M10 therefore binds the cryptographic approval to the exact reviewed PR state rather than replacing review with authentication.

## Exit Condition

Threat-model controls are considered implemented only after M10 code, negative tests, shadow-mode decision comparison, recovery drill and final passkey-only cutover Evidence reach `VERIFIED PASS`.