# ADR-0067 — S1 Security Hardening Interlock

Status: PROPOSED
Date: 2026-08-12
Repository baseline reviewed: `main@4767b86d0a183fef97ec812e77da3e5dcbd9d813`
Related: `docs/security/SECURITY_REMEDIATION_BASELINE_2026-08-12.md`, `docs/roadmaps/S1_SECURITY_HARDENING_ROADMAP.md`, `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md`

## Context

The 2026-08-12 security audit identifies application, runtime, CI, proxy, secret-handling and browser-policy weaknesses. The current DEVELOPMENT Chain already owns several related controls in M5, M5A, M6, M7 and M9, but the five High findings cannot safely wait for later assurance phases without an explicit blocking interlock.

Repository reconciliation confirms at least two important facts:

1. the documentation read/write routes still lack an explicit route-level authorization boundary;
2. the runtime artifact guard can be configured `off` in production-capable execution and can report that disabled state as accepted.

The current docs-file path implementation is stronger than the audit's original path-sanitizer description because it resolves and bounds the target to the docs root. Therefore remediation must be evidence-driven rather than copying the historical finding text unchanged.

## Decision

Introduce **S1 Security Hardening** as a bounded security interlock before M6 implementation.

S1 does not replace existing DEVELOPMENT Chain phases. It owns only the remediation that is not already canonically owned elsewhere, and it blocks progression while High-severity findings remain unresolved.

### Trust-boundary decisions

#### 1. Application authorization is primary

Authentication/authorization MUST be enforced at the route/service boundary for privileged documentation operations. Runtime artifact immutability remains defense-in-depth and MUST NOT be used as the sole authorization mechanism.

#### 2. Production security controls fail closed

A production-capable runtime MUST NOT accept an explicit `off`, missing, or invalid state for a security control that protects production runtime immutability. Startup/preflight/readiness MUST expose and enforce the invariant before serving production traffic.

#### 3. Proxy metadata is not identity by default

Raw forwarding headers are untrusted input. Client network identity may only be derived after the deployment proxy topology and trust boundary are explicitly configured. User/session identity remains separate from network evidence.

#### 4. Client and server environment namespaces are disjoint

Server secrets MUST NOT resolve from browser-exposed `VITE_*` aliases. Client-visible configuration uses an explicit allowlist; secret-class server variables fail closed if only a public alias is present.

#### 5. CI cannot authorize its own weakening

Changes to workflows, composite actions and CI policy MUST be checked against trusted invariants that the evaluated pull request cannot replace. Existing M3 Owner/head-SHA controls remain authoritative and must be preserved.

#### 6. One HTTP security policy authority

CSP and dynamic CORS behavior MUST converge on one authoritative implementation each. CORS must vary caches by origin where origin-specific responses are emitted; CSP promotion must be integration-tested before strict enforcement.

## Phase ownership

S1 owns:

- F-01/F-11/F-12: documentation API authorization/filesystem boundary;
- F-02: fail-closed production runtime artifact control;
- F-04/F-15: proxy/client-IP/rate-limit trust boundary;
- F-05: secret namespace isolation;
- F-03/F-09: residual CI self-protection/output integrity;
- F-06/F-07/F-08: CSP/CORS convergence.

Existing phases retain:

- M5 → F-16 audit correlation;
- M5A → F-14 native MFA/AAL2 and replay semantics;
- M6 → F-10 plus remaining F-17 supply-chain/runtime pinning;
- M7 → deployment identity and topology transition constraints;
- M9 → F-13 and independent adversarial re-verification;
- F-18 → accepted only with deny-by-default RLS evidence.

## Gate decision

M6 implementation MUST NOT start until all High findings are `VERIFIED PASS`:

```text
F-01 && F-02 && F-03 && F-04 && F-05
```

A roadmap assignment is not evidence of closure. `VERIFIED PASS` requires exact-code positive/negative tests and traceable evidence.

## Implementation model

S1 is implemented in small, trust-boundary-specific pull requests. Each starts from then-current `main`; no remediation branch is reused for the next slice. Human/Owner review and merge remain required. After successful merge the remote work branch and temporary clone/worktree, if any, are deleted according to the DEVELOPMENT Chain branch lifecycle policy.

External Render, Supabase, Stripe, DNS or other production mutation is NOT authorized by this ADR. Repository code and handoff documentation may be prepared, but external mutation requires the separately applicable Owner approval and execution-host policy.

## Consequences

### Positive

- High-severity application/runtime risks become explicit blockers instead of deferred assurance tasks.
- Existing M5/M5A/M6/M7/M9 work is reused rather than duplicated.
- Security remediation becomes traceable finding → control → test → evidence → closure.
- Route authorization, runtime immutability and CI governance are separated into correct defense layers.

### Cost / trade-off

- M6 may be delayed until High findings close.
- Some findings require deployment-topology evidence before an implementation choice is safe, particularly trusted proxy and distributed rate limiting.
- CSP tightening may need staged validation to avoid breaking legitimate payment/consent/analytics integrations.

## Rejected alternatives

### Defer every finding to M9 assurance

Rejected because M9 should verify a hardened system, not become the first implementation phase for known High vulnerabilities.

### Treat runtime artifact guard as sufficient protection for docs-file routes

Rejected because environment/configuration state can fail and because authorization belongs at the application boundary.

### Create a second independent security development chain

Rejected because it would duplicate authorities, create sequencing conflicts and weaken evidence traceability.

### Close findings based only on roadmap intent

Rejected because planned controls are not implemented controls.

## Verification

ADR acceptance is proven when:

- the S1 baseline and roadmap are merged after Human review;
- each High finding receives an isolated remediation PR and negative tests;
- all five High findings reach `VERIFIED PASS` before M6 implementation;
- later-phase findings retain explicit owners and blocking criteria;
- DEVELOPMENT Chain roadmap/traceability is synchronized to the merged S1 evidence.