# CAPITAL-AI-SEC — OWASP ASVS 5.0 Verification Matrix

**Work item:** `SEC-SOTA-04`  
**Project:** `CAPITAL-AI-SEC`  
**Status:** `IMPLEMENTED_ON_BRANCH / MATRIX_INVENTORIED / VERIFICATION_OPEN`  
**Inspection baseline:** `main@a7ed0e9139ce9e2899afd863baf2e50f8eed75fb`  
**Branch:** `agent/security-asvs-verification-matrix-20260911`  
**Primary Productive PVC ownership:** `[]`  
**Primary Owner:** `CAPITAL-AI-SEC` for Security assessment and verification  
**Component contract:** `ESS-0006 v1.2.0`  
**External reference:** OWASP Application Security Verification Standard `5.0.0` — `ADVISORY_NON_AUTHORIZING`  
**Canonical vocabulary:** `OWASPASVS` / `ASVSVerificationMatrix` from `src/platform/Vocabulary/Registry/securityVerificationConcepts.ts`

## 1. Purpose and authority boundary

This document implements the first repository-correlated `ASVSVerificationMatrix` for `SEC-SOTA-04`. It maps the current CAPITAL-AI application/API surface to the stable OWASP ASVS 5.0.0 verification objectives and to current implementation, tests, evidence and productive ownership.

OWASP ASVS is an external verification standard and does not authorize repository behavior. `/AGENTS.md`, the canonical Project Value Chain, accepted ADR/ESS contracts and current repository controls remain authoritative. This matrix creates no second Security control plane, compliance registry, IAM authority, runtime or productive PVC owner.

The matrix is intentionally conservative. **Mapping is not verification.** A chapter or requirement is never marked `VERIFIED` solely because relevant code, a scanner, a policy or this table exists.

## 2. Status semantics

| Status | Meaning |
|---|---|
| `VERIFIED` | Exact current implementation plus reproducible positive/negative verification and all materially required hosted/runtime/provider evidence satisfy the mapped requirement. |
| `PARTIAL_EVIDENCE` | Relevant implementation/tests/evidence exist, but the complete applicable ASVS objective set has not been independently verified. |
| `EVIDENCE_GAP` | The objective is applicable or materially relevant, but required evidence is missing, stale, wrong-identity or externally dependent. |
| `APPLICABILITY_OPEN` | Current repository evidence is insufficient to decide whether the objective is applicable to the productive application surface. |
| `NOT_APPLICABLE_CURRENT_REPO` | No corresponding current application surface was found at this exact repository baseline; this must be re-evaluated when architecture changes. |
| `NOT_VERIFIED` | No positive verification claim is made. |

`EVIDENCE_READY != VERIFIED`. Scanner output, documentation, framework mapping, dependency versions and implementation inspection are supporting evidence only.

## 3. Current architecture anchors

The current repository exposes reusable evidence anchors rather than a new ASVS-specific implementation layer:

- `src/platform/Security/authMiddleware.ts` — strict bearer extraction, provider-backed identity verification, role-based authorization, fail-closed IAM schema handling, rate limiting, AAL2 verification, single-use purpose-bound step-up checks and IAM audit logging.
- `src/platform/Security/nativeMfa.ts` plus `tests/unit/authMiddlewareAal2.test.ts` and `tests/integration/nativeMfaAal2.test.ts` — provider-native MFA/AAL verification with explicit separation between UI state and server authorization.
- `server.application.ts` and `server/securityResponse.ts` — centralized CORS/origin controls and response-security headers including nonce-based CSP and `X-Content-Type-Options: nosniff`.
- `src/platform/Security/rateLimiter.ts` and trusted edge/client-IP handling — reusable anti-abuse boundary.
- `src/platform/Security/secretCrypto.ts` as consumed by IAM token fingerprinting — cryptographic helper evidence, without claiming complete ASVS cryptography coverage.
- current dependency/security floors, provenance and deployment evidence from the completed `SEC-SOTA-03` workstream.
- existing Security finding lifecycle and evidence under `docs/evidence/security/`, including provider-backed MFA/AAL evidence and fatal-process repository verification.

## 4. ASVS 5.0 chapter verification matrix

| ASVS 5.0 chapter | Repository-relevant objective | Current implementation / evidence anchors | Security state | Primary productive owner / PVC | Next verification gate |
|---|---|---|---|---|---|
| **V1 — Encoding and Sanitization** | Canonical decoding, context-aware output encoding, injection prevention, sanitization and SSRF-safe handling where untrusted data crosses interpreters/services. Representative stable requirements include `V1.1.1`, `V1.1.2`, `V1.2.4`, `V1.3.6`. | Existing validation/security helpers, server-side API boundaries and Security hardening patterns provide partial evidence; no complete application-wide sink/source inventory is bound to the current main baseline. | `PARTIAL_EVIDENCE / NOT_VERIFIED` | Affected productive owner per sink; Security owns verification only. | Enumerate repository-relevant interpreter/service sinks and bind each applicable V1 requirement to implementation plus negative injection/SSRF tests. |
| **V2 — Validation and Business Logic** | Trusted server-side validation, documented constraints, sequence/state integrity and anti-automation/business-limit enforcement. | `authMiddleware.ts` strictly validates bearer/step-up token shape and bounds; multiple domain services expose separate validation contracts, but no complete business-logic validation inventory has been independently correlated here. | `PARTIAL_EVIDENCE / NOT_VERIFIED` | Domain owner of each flow; PVC depends on affected capability. | Map externally writable API inputs and high-value state transitions to current validators, limits, transaction/locking behavior and negative tests. |
| **V3 — Web Frontend Security** | Browser-origin controls, CSP, cookie/client-side protections, safe redirects and supported client technologies. | `server.application.ts` applies an explicit CORS allowlist and central security headers; CSP is emitted through `server/securityResponse.ts` with nonce-based restrictions, `object-src 'none'`, `base-uri 'none'` and form-action controls; `nosniff` is set. | `PARTIAL_EVIDENCE / NOT_VERIFIED` | `CAPITAL-AI-FE` for productive frontend behavior; `CAPITAL-AI-OPS / PVC-08` for productive edge/TLS evidence where applicable. | Bind applicable V3 requirements to browser response tests, cookie/session behavior, redirect controls and deployed-header evidence. |
| **V4 — API and Web Service** | Correct content types, trusted intermediary headers, allowed HTTP methods, robust HTTP message handling and API security boundaries. Representative requirements include `V4.1.1` and `V4.1.3`. | Express application middleware centralizes security response handling and hardened client-IP/edge-trust interpretation; authorization gates reuse `checkAdminAccess()` on privileged APIs. Complete route/method/content-type/message-boundary coverage is not yet proven. | `PARTIAL_EVIDENCE / NOT_VERIFIED` | Productive API owner by route; shared runtime/edge behavior `CAPITAL-AI-OPS / PVC-08`. | Inventory externally reachable routes/methods and bind applicable V4 controls to integration tests plus exact deployed proxy/header behavior. |
| **V5 — File Handling** | Safe upload/download/storage paths, filename handling, limits, malicious-file controls and path traversal/zip-slip prevention. Representative requirement `V5.3.2` requires trusted/generated paths or strict filename validation. | `multer` dependency floor is hardened on main (`^2.3.0`), but dependency safety does not prove upload policy. Current repository correlation did not establish complete upload size/MIME/path/storage/antivirus behavior. | `APPLICABILITY_OPEN / EVIDENCE_GAP` | Owner of each actual upload/file capability; runtime controls commonly `CAPITAL-AI-OPS / PVC-02` or affected domain owner after concrete surface resolution. | Discover every productive file ingest/download surface; map limits, MIME/content validation, path generation, storage execution policy and malware scanning. Do not mark PASS from Multer version alone. |
| **V6 — Authentication** | Provider-backed authentication, anti-brute-force controls, consistent authentication strength and MFA. Stable `V6.3.3` requires MFA or an allowed combination of authentication mechanisms for application access, subject to its level/rationale semantics. | Supabase token identity is verified server-side with `auth.getUser(token)`; malformed/oversized bearer tokens fail closed; privileged flows use provider `getAuthenticatorAssuranceLevel(token)` and accept only `aal2`; unit/integration tests cover AAL1/AAL2 boundaries; provider session evidence exists in M5A closure evidence. Password/provider policy details are not fully repository-verifiable. | `PARTIAL_EVIDENCE_STRONG / NOT_VERIFIED` | Auth provider/runtime implementation boundary spans Security verification and productive IAM/application owners; provider configuration evidence remains externally sourced. | Map all applicable V6 requirements, including password/provider configuration, alternate auth paths, recovery and notification semantics; bind provider readback where repository state cannot prove them. |
| **V7 — Session Management** | Secure session lifecycle, renewal, invalidation, concurrency/timeout semantics and protection against session misuse. | Current architecture delegates session/refresh/sign-out semantics to Supabase Auth; repository IAM resolves identity from live provider tokens rather than client identity claims. Existing provider/AAL evidence covers a subset only. | `PARTIAL_EVIDENCE / NOT_VERIFIED` | Productive identity/session boundary plus provider configuration; Security verifies. | Correlate session creation/refresh/logout/revocation/timeout behavior with provider configuration and negative stale/revoked/cross-session tests. |
| **V8 — Authorization** | Server-side access control, object/function authorization, least privilege and denial of unauthorized privileged actions. | `checkAdminAccess()` resolves verified provider identity then `profiles.iam_role`, fails closed on missing provider/schema/credentials, rate-limits privileged zones and logs grants/denials; `requireVerifiedAal2()` and `requireStepUp()` gate stronger actions. Multiple privileged routes reuse this boundary. Full route/object/RLS coverage is not yet proven. | `PARTIAL_EVIDENCE_STRONG / NOT_VERIFIED` | Productive domain owner per protected capability; shared authorization component under current Security/IAM contracts. | Build route/object authorization inventory, correlate RLS/server checks and add negative cross-role/cross-user tests for all applicable privileged/data paths. |
| **V9 — Self-contained Tokens** | Safe token parsing, validation, claim trust, algorithm/key lifecycle and replay/expiry handling for JWT or similar self-contained tokens. | Bearer parsing is strict and token identity is resolved through Supabase `auth.getUser(token)` instead of trusting caller claims; step-up tokens are hashed, purpose-bound, expiring and single-use. Provider JWT signing/key lifecycle is not proven by repository inspection. | `PARTIAL_EVIDENCE / EVIDENCE_GAP` | Provider/runtime identity owner; Security verification. | Bind provider JWT validation/key-rotation/claim/expiry configuration and negative malformed/expired/replayed-token evidence to current deployment identity. |
| **V10 — OAuth and OIDC** | Secure authorization-code/redirect/state/nonce/PKCE/client/token-endpoint behavior where OAuth/OIDC is used. | No explicit application-owned OAuth/OIDC authorization flow was established by the current repository search. Supabase/provider internals must not be inferred as repository implementation. | `APPLICABILITY_OPEN / NOT_VERIFIED` | Owner of any concrete OAuth/OIDC integration once resolved. | Determine whether productive login/provider integrations expose OAuth/OIDC flows in application scope; if yes, map exact flows and provider configuration. If absent, document bounded N/A evidence rather than assuming it. |
| **V11 — Cryptography** | Approved cryptographic primitives, secure randomness, key lifecycle, secret protection and avoidance of custom/insecure crypto. | IAM uses `hashOpaqueToken()` from `src/platform/Security/secretCrypto.ts`; MFA cryptographic assurance is provider-backed. ESS-0006 recognizes existing secret cryptography as a reusable Security surface. Complete algorithm/key/rotation inventory is not mapped in this slice. | `PARTIAL_EVIDENCE / NOT_VERIFIED` | Productive secret/provider owner by use; Security component for reusable crypto helpers. | Inventory cryptographic uses, algorithms, key sources/rotation/retention and provider guarantees; bind tests/evidence without exposing reusable secrets. |
| **V12 — Secure Communication** | TLS and transport protection between users, application, proxies and dependent services, including certificate/protocol assurance. | Repository security headers and edge-trust code are supporting evidence only. End-to-end live TLS/proxy/provider configuration is external runtime state and is not proven by source inspection. | `EVIDENCE_GAP / OWNER_ROUTED` | `CAPITAL-AI-OPS / PVC-08` for productive runtime/edge transport. | `ASVS5-V12-TRANSPORT-EVIDENCE`: return exact deployed TLS/proxy/edge configuration evidence bound to current production identity; Security independently verifies applicable V12 objectives. |
| **V13 — Configuration** | Secure defaults, unnecessary feature reduction, production-safe configuration, dependency/runtime hardening and secret/config separation. | Fail-closed IAM configuration, centralized security headers, dependency security floors, current provenance/deployment controls and server-only secret/deployment contracts provide evidence. Full ASVS configuration inventory remains open. | `PARTIAL_EVIDENCE / NOT_VERIFIED` | `CAPITAL-AI-OPS` for productive configuration stages (`PVC-02/06/07/08`) plus affected component owner. | Map production configuration requirements to current repo/provider state, identify debug/default/unused surfaces and bind exact deployment readback where needed. |
| **V14 — Data Protection** | Data minimization, sensitive-data handling, cache/log exposure prevention, storage/retention and privacy/security boundaries. | IAM audit records hash opaque token references rather than persisting bearer tokens; verified identity separates user IDs from non-authoritative client claims. Broader data classification, storage-at-rest, cache and retention controls are not comprehensively mapped here. | `PARTIAL_EVIDENCE / NOT_VERIFIED` | Data/productive owner according to the affected store (`CAPITAL-AI-DATA / PVC-09..11` or domain owner); Security verifies. | Map sensitive data classes/stores/logs/caches/exports to retention, encryption, minimization and access controls; require provider evidence for storage guarantees not represented in repo. |
| **V15 — Secure Coding and Architecture** | Explicit trust boundaries, secure architecture, dependency/reuse discipline and prevention of dangerous architectural shortcuts. | `/AGENTS.md`, project/PVC routing, accepted ADR/ESS contracts, `src/platform/Security`, bounded Security remediation controls, dependency/provenance verification and current vocabulary establish strong architecture/process evidence. They do not prove every V15 requirement. | `PARTIAL_EVIDENCE / NOT_VERIFIED` | Architecture/product owner by affected capability; Governance/SEC retain their existing non-product boundaries. | Map applicable V15 requirements to current ADR/ESS/code/test evidence and identify only concrete implementation gaps; no new parallel security architecture. |
| **V16 — Security Logging and Error Handling** | Security-relevant event logging, safe error handling, audit attribution and failure behavior without sensitive-data leakage. | IAM grants/denials are logged with hashed token fingerprints, user/zone/reason/IP metadata; IAM failures are fail-closed. `SEC-VERIFY-R2-04` independently verified repository fatal-process behavior but retains post-deploy supervisor/restart evidence open. | `PARTIAL_EVIDENCE / NOT_VERIFIED` | Shared logging/runtime primarily `CAPITAL-AI-OPS / PVC-08`; domain owner for domain events; Security verification. | Map applicable security events/errors to logs, redaction, retention/alerting and runtime failure evidence; close only with exact deployed/runtime evidence where required. |
| **V17 — WebRTC** | Signaling/media/security requirements for WebRTC functionality. | No current repository WebRTC surface (`RTCPeerConnection`/`getUserMedia`) was found during this baseline correlation. | `NOT_APPLICABLE_CURRENT_REPO` | N/A at this baseline. | Re-evaluate immediately if a WebRTC/media peer-connection surface is introduced; current N/A is not permanent architecture authority. |

## 5. Focused evidence already strong enough for requirement-level follow-up

The following areas have sufficiently concrete current evidence to justify requirement-level verification work next, but this branch does **not** upgrade them to `VERIFIED` without executing that independent verification:

1. **Authentication / MFA (`V6`)** — provider-backed user resolution and AAL2 enforcement, plus unit/integration and prior provider evidence.
2. **Authorization (`V8`)** — fail-closed role verification, AAL2/step-up gating, rate limits and audited privileged-route reuse.
3. **Browser/API response security (`V3`/`V4`)** — centralized CORS/CSP/header handling and trusted edge/client-IP controls.
4. **Security logging/error handling (`V16`)** — IAM audit evidence plus existing fatal-process repository verification.

These are prioritized because verification can reuse existing implementation and evidence without creating new runtime controls.

## 6. Concrete gaps and routing

### `ASVS5-V12-TRANSPORT-EVIDENCE`

- **State:** `EVIDENCE_GAP / OWNER_ROUTED`
- **Primary productive owner:** `CAPITAL-AI-OPS / PVC-08 — Production Operations`
- **Reason:** source code cannot independently prove the effective production TLS/proxy/edge configuration and protocol/certificate posture.
- **Required return:** exact production-identity-bound readback for the relevant transport controls, followed by independent CAPITAL-AI-SEC verification.
- **Boundary:** no provider mutation is authorized by this matrix.

### File handling / OAuth-OIDC applicability

V5 and V10 remain `APPLICABILITY_OPEN` until concrete productive surfaces are inventoried. Absence of a code-search hit is not converted into `NOT_APPLICABLE` except for the narrowly searched current WebRTC surface in V17.

## 7. Verification and closure rule

`SEC-SOTA-04` is **not closed by creation of this matrix**. The matrix establishes an evidence-based current-state inventory and the next verification gates.

Closure requires:

1. every repository-relevant ASVS 5.0.0 objective to have an explicit applicability disposition;
2. applicable objectives to bind to current implementation, tests and evidence or to a concrete routed gap;
3. strong-evidence areas to undergo independent positive/negative verification rather than inference from implementation;
4. external/runtime/provider-dependent controls to use exact identity-bound evidence where required;
5. no `APPLICABILITY_OPEN`, unexplained `EVIDENCE_GAP`, stale evidence or framework-only PASS claim to be silently converted to `VERIFIED`;
6. productive remediation findings to preserve the actual Primary Owner/PVC unless a pure bounded Security remediation qualifies under `CTRL-SEC-BOUNDED-REMEDIATION-001`.

## 8. Current disposition

**`SEC-SOTA-04 = MATRIX_INVENTORIED / VERIFICATION_OPEN`.**

This is a deliberate intermediate state. It improves coverage visibility and owner routing without claiming full OWASP ASVS 5.0.0 conformance, certification or application-wide verification.

The next highest-value Security action after this inventory is focused requirement-level verification of the strongest existing V6/V8/V3/V4/V16 evidence, while the single concrete runtime dependency `ASVS5-V12-TRANSPORT-EVIDENCE` is returned by `CAPITAL-AI-OPS / PVC-08`.
