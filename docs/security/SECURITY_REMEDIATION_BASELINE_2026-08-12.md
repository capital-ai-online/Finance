# CAPITAL-AI Security Remediation Baseline — 2026-08-12

Status: DOCUMENTED / REMEDIATION REQUIRED
Repository: `SvenKulessa/Finance`
Verified repository baseline: `main@4767b86d0a183fef97ec812e77da3e5dcbd9d813`
Audit basis: Security Audit 2026-08-12, findings F-01..F-18
Authority: `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md`, existing ADR/ESS/governance controls and this baseline.

## Purpose

This document reconciles the 2026-08-12 security findings with the current repository and the active DEVELOPMENT Chain. It prevents duplicate remediation work, distinguishes confirmed current defects from already-improved controls, and binds every finding to an implementation phase and verification gate.

No finding is considered closed merely because a roadmap phase mentions the topic. Closure requires current-code verification plus positive/negative test evidence on the exact remediation commit.

## Repository observations verified during reconciliation

### Confirmed open

- **F-01 — unauthenticated `POST /api/docs-file`:** `server/routes/documentationRoutes.ts` exposes the write handler without its own authentication/authorization gate. The runtime artifact guard is not an authorization boundary.
- **F-02 — production runtime artifact guard can fail open:** `server/runtime/runtimeArtifactGuard.mjs` accepts `CAPITAL_AI_RUNTIME_ARTIFACT_MODE=off`; the health logic can treat the disabled state as accepted. Production must instead fail closed.
- **F-11 — unauthenticated `GET /api/docs-file`:** the read handler is likewise not protected by an explicit identity/role decision.

### Partially remediated / residual validation required

- **F-12 — fragile path sanitizer:** the current documentation route is stronger than the original audit description: it resolves the docs root with `path.resolve()`, rejects obvious traversal forms and checks the resolved target stays below the docs root. Therefore F-12 is not carried forward unchanged. S1 still replaces the remaining deny-list-oriented assumptions with a canonical root-containment helper based on `path.relative()` and adds symlink/encoded-path negative tests where applicable.
- **F-03 — CI self-modification risk:** M3 already introduced Owner/head-SHA gating, SHA-pinned/frozen controls and policy loading from trusted `main`. Residual risk remains until workflow-control invariants are independently validated for `.github/workflows/**` changes.
- **F-14 — TOTP replay:** M5A is the authoritative remediation track. It may only become `VERIFIED PASS` after current-code and negative replay evidence; roadmap status alone does not close the audit finding.
- **F-17 — old Actions/Node runtime:** M3 already improved pinning. Runtime/action-version unification and supply-chain evidence remain M6 responsibilities.

### Existing phases that already own remediation

- **F-10** unsigned/unverified supply-chain identity → M6 Supply Chain Provenance.
- **F-14** TOTP replay / privileged MFA semantics → M5A Native MFA/AAL2.
- **F-16** audit `token_id` correlation quality → M5 Audit/Telemetry.
- **F-17** action/runtime provenance and version consistency → M6.
- **F-18** deny-by-default RLS without an allow policy → retain as `ACCEPTED / INTENTIONAL` only where the table is intentionally unreachable; verify this invariant in database evidence rather than creating a permissive policy merely to silence the finding.

## Finding reconciliation matrix

| Finding | Severity | Current classification | Remediation owner | Required closure evidence |
|---|---:|---|---|---|
| F-01 | High | OPEN — confirmed | S1.1 | anonymous write denied; authorized bounded write passes; audit evidence |
| F-02 | High | OPEN — confirmed | S1.2 | production boot/readiness fails if guard is disabled/misconfigured |
| F-03 | High | PARTIAL / residual | S1.5 | malicious workflow-change fixture cannot weaken required gate |
| F-04 | High | VERIFY + REMEDIATE | S1.3 | spoofed forwarding headers cannot alter canonical client identity/rate-limit key |
| F-05 | High | VERIFY + REMEDIATE | S1.4 | server secret resolver rejects client `VITE_*` aliases and build contains no server secrets |
| F-06 | Medium | VERIFY + REMEDIATE | S1.6 | enforced CSP passes application integration tests without `unsafe-eval` unless explicitly justified |
| F-07 | Medium | VERIFY + REMEDIATE | S1.6 | exactly one authoritative CSP path; legacy duplicate removed |
| F-08 | Medium | VERIFY + REMEDIATE | S1.6 | dynamic CORS emits correct `Vary: Origin` and rejects untrusted origins |
| F-09 | Medium | VERIFY + REMEDIATE | S1.5 | newline/output-injection fixture cannot alter GitHub outputs |
| F-10 | Medium | PLANNED | M6 | source/commit/artifact provenance is verifiable and bound to release |
| F-11 | Medium | OPEN — confirmed | S1.1 | anonymous read denied or explicit public allowlist proven |
| F-12 | Low | PARTIAL — current code stronger than audit baseline | S1.1 | canonical containment + traversal/encoding/symlink tests |
| F-13 | Low | VERIFY + REMEDIATE | M9 | token comparison uses constant-time semantics with negative tests |
| F-14 | Low | M5A owns remediation | M5A | AAL2/TOTP replay negative test and current factor-state evidence |
| F-15 | Low | VERIFY + REMEDIATE before horizontal scale | S1.3 / M7 | shared or topology-safe rate limiter; multi-instance test where required |
| F-16 | Low | M5 owns remediation | M5 | non-reversible stable correlation identifier + redaction tests |
| F-17 | Low | PARTIAL / M6 | M6 | runtime/action versions unified, pinned and evidenced |
| F-18 | Info | ACCEPTED only if intentional deny-by-default is proven | M9 evidence | RLS evidence shows no unintended access path |

`VERIFY + REMEDIATE` means the audit finding remains a blocking hypothesis until the current implementation is inspected in the implementation PR. It must not be silently marked closed from historical documentation.

## Security invariants introduced by S1

1. Application authorization is enforced at the route/service boundary; runtime artifact controls are defense-in-depth only.
2. Production security controls fail closed. A missing or `off` security mode is a deployment/readiness failure, not a healthy state.
3. Proxy-derived metadata is evidence only after a configured trusted-proxy boundary; raw forwarded headers never establish identity.
4. Browser-visible `VITE_*` variables and server-secret namespaces are disjoint.
5. A pull request cannot weaken the mechanism that decides whether the same pull request may pass.
6. CORS/CSP policies have one authoritative implementation and explicit negative tests.
7. Findings close only with requirement → implementation → test → evidence traceability.

## Required evidence structure

Each S1 implementation PR MUST record:

- audit finding IDs;
- exact base/head SHA;
- changed trust boundary;
- positive tests;
- negative/adversarial tests;
- CI result;
- deployment/runtime test when applicable;
- rollback condition;
- residual risk;
- final state: `OPEN`, `PARTIAL`, `VERIFIED PASS`, or `ACCEPTED`.

Evidence belongs under `docs/evidence/s1/` and must not contain live secrets, tokens, TOTP seeds, raw authorization headers or unredacted personal data.

## Gate

**M6 must not start while any High finding F-01..F-05 is still `OPEN` or `PARTIAL`.**

Medium/Low findings may remain assigned to later canonical phases only when the owning phase, blocking dependency, exact verification requirement and residual risk are explicit. F-18 is never a reason to weaken deny-by-default RLS.