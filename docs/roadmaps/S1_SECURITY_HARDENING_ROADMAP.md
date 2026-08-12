# CAPITAL-AI S1 Security Hardening Roadmap

Status: READY FOR OWNER REVIEW
Status date: 2026-08-12
Repository baseline reviewed: `main@4767b86d0a183fef97ec812e77da3e5dcbd9d813`
Security baseline: `docs/security/SECURITY_REMEDIATION_BASELINE_2026-08-12.md`

## Objective

Close the Security Audit 2026-08-12 findings without duplicating work already owned by M5, M5A, M6, M7 and M9. S1 is a bounded security gate inside the existing DEVELOPMENT Chain, not a parallel development program.

## Verbindlicher PR-Template-Contract

Jeder Pull Request gegen `main`, einschließlich aller S1-Remediation-PRs, MUSS die vollständige kanonische Vorlage `.github/pull_request_template.md` verwenden.

- kein verkürzter oder frei formulierter PR-Body anstelle der Vorlage;
- alle nummerierten Abschnitte bleiben erhalten;
- nicht zutreffende Felder werden mit `N/A` begründet;
- maschinenlesbare Marker und Human-/Owner-Attestations bleiben wortgleich;
- nach jedem neuen Head wird die Approval-Evidence für den neuen Head erneut erzeugt;
- eine separate Governance-Hardening-Aufgabe ergänzt maschinelle Template-Contract-Validierung aus einer vertrauenswürdigen Baseline;
- kein laufender PR darf durch die von ihm selbst geänderte CI-Authority allein autorisiert werden.

## Integration into the DEVELOPMENT Chain

Current canonical chain remains authoritative. For security closure, the intended gate sequence is:

```text
M5 / M5A obligations
→ S1 SECURITY HARDENING
→ S1 HIGH-SEVERITY GATE
→ M6 Supply Chain Provenance
→ M7 Deployment Identity
→ M8 Agent Cutover
→ M9 Assurance
→ M10 Owner Passkey Authorization
```

S1 documentation may be prepared while M5/M5A verification is active. S1 code work must follow the repository's sequential work-item rule unless a Human/Owner explicitly classifies a specific finding as an emergency security hotfix.

Every implementation work item uses:

```text
current main
→ fresh scoped branch
→ bounded implementation
→ positive + negative tests
→ PR using canonical template
→ Human file review / CI
→ Human merge
→ remote branch deletion
→ evidence + roadmap sync
```

No agent may merge its own remediation PR.

## S1.0 — Baseline, ownership and traceability

**Type:** documentation-only

Deliverables:

- reconcile F-01..F-18 against current code;
- distinguish `OPEN`, `PARTIAL`, `VERIFIED PASS`, `ACCEPTED`;
- bind each finding to one owning phase;
- preserve current DEVELOPMENT Chain authorities;
- create `docs/evidence/s1/` only when implementation evidence exists.

Exit:

- all 18 findings have an owner and closure criterion;
- no finding is marked closed from roadmap intent alone.

## S1.1 — Documentation API authorization and filesystem boundary

**Priority:** P0
**Findings:** F-01, F-11, F-12

Required implementation:

1. inventory all callers of `GET /api/docs-file` and `POST /api/docs-file`;
2. remove endpoints that are not required at runtime;
3. otherwise enforce verified application identity and explicit role/capability at the route/service boundary;
4. writes require privileged authorization and, where the action is Owner-sensitive, the canonical step-up/AAL2 policy;
5. replace residual deny-list path assumptions with one canonical docs-root containment helper using resolved paths and `path.relative()` semantics;
6. reject absolute, traversal, encoded traversal, null-byte and out-of-root targets;
7. define symlink behavior explicitly and test it where filesystem semantics permit;
8. add request/body/file-size limits to the write path;
9. emit redacted audit evidence for accepted and denied privileged operations.

Negative tests:

- anonymous GET;
- anonymous POST;
- authenticated but unauthorized role;
- missing required AAL2/step-up;
- `../`, `..\\`, absolute, encoded traversal and out-of-root targets;
- oversize body/file;
- attempted `.github` or other non-docs write.

Exit:

- F-01 and F-11 `VERIFIED PASS`;
- F-12 `VERIFIED PASS` or documented platform-specific residual risk;
- runtime artifact guard is no longer treated as the primary authorization control.

## S1.2 — Production runtime controls fail closed

**Priority:** P0
**Finding:** F-02

Required implementation:

- production-capable execution MUST reject `CAPITAL_AI_RUNTIME_ARTIFACT_MODE=off`;
- missing/invalid security-mode configuration MUST not become a healthy production state;
- boot/preflight/readiness exposes an explicit guard state;
- production start or readiness fails before serving traffic when the invariant is violated;
- Docker/Render handoff documentation names the invariant but does not mutate Render directly from development.

Negative tests:

- production + `off`;
- production + invalid mode;
- missing required runtime security state;
- altered runtime artifact where the guard is expected to protect immutability.

Exit:

- F-02 `VERIFIED PASS` with boot/readiness evidence.

## S1.3 — Trusted proxy, client identity and rate limiting

**Priority:** P0
**Findings:** F-04, F-15

Required implementation:

- identify the exact Render-to-application proxy topology before enabling trust;
- configure an explicit trusted-proxy boundary appropriate to that topology;
- use framework-resolved canonical client IP only after trust policy evaluation;
- never treat raw `X-Forwarded-For` as authenticated identity;
- separate network evidence (`client_ip`, proxy chain/source) from user/session identity;
- bind rate-limit keys to trusted request context;
- determine whether the current in-memory limiter remains valid for the deployed topology;
- before horizontal scaling, replace topology-unsafe local state with a shared/durable limiter or equivalent bounded control.

Negative tests:

- spoofed XFF;
- multiple forwarded values;
- direct connection semantics where applicable;
- rate-limit bypass attempt by rotating spoofed headers;
- audit event must distinguish verified identity from untrusted network metadata.

Exit:

- F-04 `VERIFIED PASS` before M6;
- F-15 may close in S1.3 or remain an explicit M7 blocker if production is provably single-instance and the scale transition is gated.

## S1.4 — Server-secret namespace isolation

**Priority:** P0
**Finding:** F-05

Required implementation:

- inventory all server secret resolvers and environment aliases;
- prohibit fallback from server-only secrets to browser-exposed `VITE_*` names;
- create an explicit allowlist for client-visible configuration;
- add deny rules for known secret-class identifiers (`service role`, private Stripe key, TOTP/encryption keys, metrics/admin tokens and equivalents);
- build-time test verifies client artifacts do not contain server-secret identifiers/values;
- startup validation fails closed for incorrectly namespaced production secrets.

Negative tests:

- only `VITE_*` variant of a required server secret is present;
- secret-like `VITE_*` variable is provided;
- built frontend is scanned for injected server-secret marker values.

Exit:

- F-05 `VERIFIED PASS` before M6.

## S1.5 — CI trust-chain and GitHub output integrity

**Priority:** P0/P1
**Findings:** F-03, F-09

M3 controls are retained, not replaced. This slice validates their residual trust boundary.

Required implementation:

- preserve Owner gate, exact PR head-SHA freshness and trusted-main policy retrieval;
- add an independent invariant validator for changes under `.github/workflows/**`, `.github/actions/**` and CI policy code;
- validator checks that required jobs/dependencies cannot be removed or weakened by the PR being evaluated;
- fail on privilege widening, unsafe event-model changes such as unapproved `pull_request_target`, unsafe credential persistence, or replacement of trusted-main policy with PR-controlled policy;
- use safe GitHub output serialization; untrusted multiline values cannot create additional output keys or workflow commands;
- keep actions pinned and least-privilege; complete provenance/version consolidation in M6 rather than duplicating it here;
- add machine validation that PR bodies retain the canonical `.github/pull_request_template.md` contract, implemented from a trusted baseline rather than PR-controlled policy.

Negative tests:

- PR deletes/bypasses `ci-gate` dependency;
- PR weakens Owner/head-SHA gate;
- PR attempts output injection with newline/delimiter payload;
- PR widens workflow token permissions;
- PR changes event model to a more privileged trigger without explicit allowed invariant;
- PR removes/renames mandatory template sections or Human-/Owner attestations.

Exit:

- F-03 and F-09 `VERIFIED PASS`;
- M3 remains the CI authority, S1 only closes the identified residual weakness;
- canonical PR-template usage is machine-validated from trusted policy.

## S1.6 — Browser HTTP policy hardening

**Priority:** P1
**Findings:** F-06, F-07, F-08

Required implementation:

1. inventory every active CSP/CORS implementation;
2. converge to one authoritative CSP generator/middleware;
3. remove obsolete/duplicated CSP paths;
4. eliminate `unsafe-eval` unless a documented, tested dependency makes it temporarily unavoidable;
5. minimize `connect-src`, `form-action`, frame and script authorities to actual production needs;
6. dynamic CORS responses emit `Vary: Origin` correctly;
7. untrusted origins fail closed;
8. verify Stripe/cookie/analytics/frontend integrations against the policy before strict promotion.

Promotion path:

```text
inventory
→ report evidence where necessary
→ integration tests
→ enforced policy
→ M9 adversarial assurance
```

Exit:

- F-06, F-07 and F-08 `VERIFIED PASS` before final M9 closure.

## Existing phase ownership — do not duplicate

### M5 Audit / Telemetry

Owns F-16. Replace weak/reversible token correlation with a non-secret, non-reversible stable correlation strategy and prove redaction/audit completeness.

### M5A Native MFA / AAL2

Owns F-14. Closure requires current replay-negative evidence and authoritative AAL2 semantics; a completed implementation without replay evidence is not sufficient.

### M6 Supply Chain Provenance

Owns F-10 and the remaining F-17 work: source identity, runtime/action pinning, SBOM, provenance, attestations and immutable artifact identity.

### M7 Deployment Identity

Owns deployment/runtime identity and any topology transition that makes F-15 require a distributed limiter. It also consumes, but does not replace, S1.2 fail-closed runtime-control evidence.

### M9 Assurance

Owns independent/adversarial re-verification and F-13 constant-time metrics/admin token comparison. M9 must rerun relevant S1 bypass, injection, replay and exfiltration tests.

### F-18

Retain `ACCEPTED / INTENTIONAL` only when evidence proves deny-by-default RLS is the intended contract and no service path relies on unintended access. Do not add a permissive RLS policy solely to close an informational finding.

## PR slicing

Use small reviewable PRs; do not combine unrelated trust boundaries. Every PR uses the canonical template completely.

| PR | Scope | Findings | Class |
|---|---|---|---|
| S1-DOC | baseline + roadmap only | F-01..F-18 | documentation |
| S1-01 | docs API authorization/filesystem | F-01/F-11/F-12 | security code |
| S1-02 | runtime fail-closed | F-02 | security code |
| S1-03 | proxy/IP/rate limit | F-04/F-15 | security code |
| S1-04 | secret namespace | F-05 | security code |
| S1-05 | CI trust/output/template integrity | F-03/F-09 + PR template contract | CI/security |
| S1-06 | CSP/CORS | F-06/F-07/F-08 | HTTP security |
| existing | M5/M5A/M6/M9 work | F-10/F-13/F-14/F-16/F-17/F-18 | canonical phases |

After each merged PR, delete its remote work branch and start the next item from then-current `main`.

## S1 High-Severity Gate

M6 implementation is blocked until:

```text
F-01 VERIFIED PASS
AND F-02 VERIFIED PASS
AND F-03 VERIFIED PASS
AND F-04 VERIFIED PASS
AND F-05 VERIFIED PASS
```

Additionally:

- F-11 must close together with S1.1;
- any unresolved Medium/Low finding must have an explicit later-phase owner and blocking criterion;
- no `VERIFY + REMEDIATE` finding may be silently converted to `PASS` without code/test evidence.

## Definition of Done

S1 is complete only when:

- all five High findings are `VERIFIED PASS`;
- F-11 and F-12 are closed or an explicit bounded residual risk is Owner-accepted;
- F-06..F-09 have implementation/test evidence or are explicitly gated before M9;
- canonical later phases retain F-10/F-13/F-14/F-16/F-17/F-18 ownership;
- no secrets are present in evidence;
- all remediation PRs use the complete canonical PR template;
- all remediation PRs received Human review and Human merge;
- work branches are deleted after successful merge;
- DEVELOPMENT Chain roadmap and traceability are synchronized to the exact final SHAs.