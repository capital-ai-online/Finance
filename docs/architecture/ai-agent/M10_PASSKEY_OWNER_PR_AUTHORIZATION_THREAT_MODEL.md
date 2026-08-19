# M10 — Passkey-only Owner PR Authorization Threat Model

Status: CONTROLLED CUTOVER IMPLEMENTATION — Phase 6 `VERIFIED PASS`; post-merge authoritative CI and recovery exit evidence pending
Date: 2026-08-12
Updated: 2026-08-19
Authority: ADR-0066, ESS-0022, M10 Runbook

## System Under Review

M10 authorizes one exact `AUTHORIZE_PR_CI` transaction through a CAPITAL-AI WebAuthn/passkey assertion. It does not authorize PR merge or general Owner impersonation.

Controlled Cutover extends the original model through GitHub Actions: an approved exact PR head is atomically consumed once, dispatched to its same-repository branch, and may enter expensive CI only after the workflow proves both a signed GitHub Actions OIDC workload identity and the matching unredeemed M10 one-time consumption capability.

## Protected Assets

- Human/Owner authorization decision;
- exact Finance PR state (base/head/file set/diff);
- registered Owner public credentials;
- WebAuthn challenge/approval state;
- M5 immutable approval audit evidence;
- CI request consumption state;
- single-use workflow-gate capability;
- GitHub Actions workload identity and exact run/ref/head binding;
- Human-only merge boundary;
- recovery/revocation state.

## Trust Boundaries

1. Browser / authenticator ↔ CAPITAL-AI WebAuthn verifier;
2. CAPITAL-AI verifier ↔ trusted GitHub PR-state resolver;
3. verifier ↔ durable audit persistence;
4. approval record ↔ atomic CI consumption / GitHub Actions dispatcher;
5. GitHub Actions runner ↔ GitHub OIDC issuer (`token.actions.githubusercontent.com`);
6. GitHub Actions runner ↔ CAPITAL-AI single-use workflow gate;
7. workflow gate ↔ trusted GitHub PR-state resolver and durable M10 consumption store;
8. AI agents/tools ↔ approval service;
9. recovery/break-glass operator ↔ credential registry;
10. GitHub PR mutations ↔ previously issued challenge/approval/dispatch context.

## Adversaries / Failure Sources

- malicious external attacker;
- compromised browser/session;
- compromised or over-privileged AI agent;
- prompt/tool injection through repository or external content;
- stale/replayed approval material;
- leaked/copied workflow-dispatch input;
- forged/manual GitHub Actions dispatch;
- forged or replayed workload-identity token;
- malicious or accidental PR mutation after review/dispatch;
- wrong RP/origin configuration;
- compromised/revoked credential;
- audit/verifier/GitHub/JWKS outage;
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
| PR head TOCTOU | new commit after challenge/review/dispatch | bind exact head SHA; re-resolve before verify, claim and workflow-gate redemption | INVALIDATE/DENY |
| Base drift | PR retarget/base advances materially | bind exact base branch/SHA and re-resolve | INVALIDATE/DENY |
| File-set substitution | agent omits/changes files | canonical changed-file set recomputed from trusted GitHub state and hashed | DENY |
| Diff substitution | content changes while filenames remain | bind canonical diff/review digest and compare again at workflow gate | DENY |
| Fork/cross-repo dispatch | approved SHA is dispatched through an untrusted head repository | require current same-repository PR branch immediately before claim and gate | DENY |
| Ambiguous Git ref | traversal-/ref-confusion such as `../main` reaches dispatch | explicit fail-closed M10 branch-ref subset in resolver and dispatcher | DENY |
| Dispatch-input disclosure | one-time `workflow_dispatch` input is observed/copied | input is insufficient alone; require GitHub-signed OIDC workload identity + single-use DB consumption | DENY without both |
| Manual Actions dispatch | user/automation directly starts workflow without WebAuthn consumption | workflow gate requires matching PENDING M10 consumption and exact immutable approval | DENY before checkout/npm/build |
| Forged runner identity | caller fabricates repository/ref/head/run metadata | verify RS256 OIDC signature against GitHub JWKS; fixed issuer/audience and exact repository/ref/sha/run/workflow claims | DENY |
| OIDC replay | valid workload token reused from another run/context | short expiry + exact run/ref/head/workflow claims + single-use consumption atomicity | DENY/DEDUPE |
| OIDC/JWKS outage | verifier cannot obtain/validate GitHub signing key | fail closed before durable consumption redemption | DENY |
| Agent self-approval | agent calls approval API as Owner | WebAuthn Owner assertion + principal boundary; agent cannot possess authenticator | DENY |
| Forged legacy evidence | emoji/checkbox/comment fabricated | legacy signals not authoritative after cutover | NO AUTHORIZATION |
| GitHub sign-in confusion | GitHub account uses passkey but no PR-specific assertion | CAPITAL-AI transaction requires own challenge/context | NO AUTHORIZATION |
| Stolen web session | attacker has application session | WebAuthn UV + exact challenge/context required | DENY without authenticator |
| Audit outage | verifier/gate succeeds but required pre-action evidence cannot persist | audit persistence before CI request / before workflow consumption finalization | DENY |
| CI race | multiple consumers request CI | unique exact-head claim + atomic single-use workflow redemption | one expensive request only |
| Dispatch ambiguity | GitHub accepted request but transport result is unknown | terminal `FAILED_UNCERTAIN`; no blind retry | STOP / HUMAN RECONCILIATION |
| Recovery bypass | weaker fallback grants PR authority | separate strong, audited recovery; no emoji/TOTP-only fallback | DENY |
| Credential enrollment abuse | agent enrolls credential for Owner | Owner-controlled enrollment with strong verification/audit | DENY |
| XSS/UI deception | attacker changes visible PR context | trusted server re-resolves canonical PR state; CSP/XSS controls; approval UI shows bound identifiers | DENY on context mismatch |
| Secret leakage | logs contain sensitive auth material | public credential identifiers only; mask one-time capability/OIDC token; audit hashes live capability/JTI | evidence safe |
| Clock abuse | stale challenge/OIDC token accepted | bounded server clock checks, issued/expiry validation | DENY |
| Verifier downgrade | UV/RP/origin/OIDC checks disabled | protected configuration + negative tests + change governance | DENY / change blocked |
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

The workflow gate additionally binds:

```text
consumptionId (single-use; never raw in audit)
approvalId
GitHub OIDC audience = https://capital-ai.online/m10-workflow-gate
OIDC repository
OIDC ref
OIDC sha
OIDC run_id
OIDC workflow / workflow_ref
current trusted PR state re-resolved at gate time
```

## TOCTOU Defense

The PR state MUST be resolved at least:

1. before challenge issuance;
2. at assertion verification;
3. immediately before approval consumption / CI request;
4. again when the dispatched GitHub Actions run redeems the single-use workflow capability, before expensive work.

Any material mismatch invalidates the approval/consumption path. The system must not "update" an old approval to a new head.

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

## GitHub Actions OIDC Boundary

Before workflow-gate redemption, CAPITAL-AI verifies:

- JOSE header requires `RS256` / JWT and a known GitHub signing-key `kid`;
- signature against the fixed GitHub Actions JWKS endpoint;
- issuer `https://token.actions.githubusercontent.com`;
- fixed audience `https://capital-ai.online/m10-workflow-gate`;
- short `iat`/`nbf`/`exp` freshness window;
- exact `repository=SvenKulessa/Finance`;
- `event_name=workflow_dispatch` and `ref_type=branch`;
- exact dispatched `ref`, exact approved `sha`, exact workflow `run_id`;
- exact workflow name/path/ref.

OIDC `id-token: write` is granted only to `build-and-test`; it permits requesting an OIDC token but does not itself grant repository-resource write access. The OIDC token never replaces the M10 consumption capability; both are required.

## Audit Boundary

Approval evidence is persisted before CI request and includes only non-secret references/verification metadata required to reconstruct the decision.

The active consumption capability and OIDC JWT are never persisted raw in M5 audit. Audit records SHA-256 correlation identifiers and signed workload metadata. Audit failure before the atomic workflow redemption is a security failure, not observability-only degradation.

## Recovery Threats

Recovery must defend against:

- compromised account session;
- social-engineering downgrade;
- lost authenticator leading to bypass;
- agent-triggered credential deletion/enrollment;
- revocation not invalidating outstanding approvals;
- stranded `PENDING`/`FAILED_UNCERTAIN` consumption after GitHub/network failure.

Required controls:

- Human/Owner-only recovery authority;
- strong identity verification;
- reason and timestamp;
- credential/consumption lifecycle audit;
- invalidate affected challenges/approvals where appropriate;
- no blind redispatch after ambiguous external outcome;
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
- fork/cross-repository head;
- malformed/ambiguous branch ref;
- missing/wrong-audience/expired/forged GitHub Actions OIDC JWT;
- wrong OIDC repository/ref/SHA/run/workflow claims;
- copied workflow input without valid workload identity;
- audit outage;
- duplicate CI consumption/workflow redemption;
- forged legacy signal;
- agent self-approval;
- recovery without strong Owner verification.

## Residual Risk

WebAuthn reduces credential phishing/replay risk but does not prove the Owner cognitively understood the diff. Human File Review remains a separate process control. M10 therefore binds the cryptographic approval to the exact reviewed PR state rather than replacing review with authentication.

GitHub remains a trusted infrastructure provider for PR state, Actions execution and OIDC signing. A platform-level compromise is outside CAPITAL-AI's local trust boundary; exact state binding, short-lived workload identity, least-privilege tokens and durable audit reduce but cannot eliminate that residual dependency.

## Exit Condition

Threat-model controls are considered implemented only after M10 code, negative tests, Phase-6 Shadow/recovery evidence, Human-merged Controlled Cutover and post-cutover live evidence for exactly one authorized current-head expensive CI plus unapproved/replay/drift/recovery denial reach `VERIFIED PASS`.
