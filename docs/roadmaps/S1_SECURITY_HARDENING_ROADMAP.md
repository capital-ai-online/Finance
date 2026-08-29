# CAPITAL-AI S1 Security Hardening Roadmap

Status: ACTIVE / ACTION REQUIRED
Status date: 2026-08-29
Repository baseline reviewed: `main@e53b738289f16cbf1951d12b7362dac568763735`
Production deployment identity reviewed: `4c25dec3ff4a9b2507bae8cfd265f055c6afa52f`
Production/Main content state: tree-equivalent after PR #606; commit identities intentionally differ
Current reassessment source: CAPITAL-AI Full-Stack Security & Governance Reassessment, 2026-08-29 13:10 CEST
Historical security baseline: `docs/security/SECURITY_REMEDIATION_BASELINE_2026-08-12.md`

## Objective

S1 remains the canonical bounded security-hardening gate inside the DEVELOPMENT Chain. This revision integrates the 2026-08-29 full-stack reassessment without creating a parallel security program and without discarding the historical F-01..F-18 traceability.

The active objective is to move the current status from `AMBER / ACTION REQUIRED` to `HARDENED / VERIFIED` by closing the confirmed High findings, resolving the conditional billing-authority finding, operationalizing recovery evidence and making the security/governance evidence self-invalidating when production or `main` changes.

No finding is closed from roadmap intent alone. `VERIFIED PASS` requires code/configuration or platform evidence plus the specified negative tests and exact identity binding.

## 2026-08-29 reassessment correction after PR #606

The audit was produced against `main@39ff18725d4bfd39254a9978968dbe3c9058f7c3` while production was on `4c25dec3ff4a9b2507bae8cfd265f055c6afa52f`.

PR #606 subsequently restored the repository tree and merged as `main@e53b738289f16cbf1951d12b7362dac568763735`.

Therefore:

- the former P2-01 claim of a 24-commit **content/runtime drift** is no longer an open runtime finding;
- production and `main` still have different immutable commit identities, so security evidence MUST continue to bind `productionCommit`, `mainCommit` and `candidateHead` separately;
- same-tree/different-commit states MUST NOT be misreported as equivalent deployment identities;
- the report itself is `STALE` for commit-baseline purposes but remains the authoritative source for the still-open security findings below;
- GitHub still reports the default branch as `protected: false`; P1-01 therefore remains confirmed after PR #606;
- workflow ID `345251495` has been observed failing before job creation for both scheduled and pull-request events, including PR #606. Until its control purpose is classified, the former P2-04 is promoted to `P1 OPERATIONAL`.

## Reassessment register (R2)

| ID | Source finding | Priority | Current status | Required disposition |
|---|---|---:|---|---|
| S1-R2-00 | P1-C01 simulated client tier transition | P1 Conditional | IMMEDIATE TRACE | Prove reachability and authority before normal billing work |
| S1-R2-01 | P2-04 workflow `345251495` startup failure | P1 Operational | OPEN / CLASSIFY | Identify required control; repair if required, remove if obsolete |
| S1-R2-02 | P1-01 `main` not protected | P1 | OPEN / CONFIRMED | Native GitHub enforcement with post-mutation readback evidence |
| S1-R2-03 | P1-02 Node control-plane 24.18.0 | P1 | OPEN | Reuse PR #602 supersession path to Node 24.20.0 |
| S1-R2-04 | P1-03 `uncaughtException` resumes process | P1 | OPEN | Fail-fast, bounded cleanup, non-zero exit, supervisor recovery test |
| S1-R2-05 | P1-04 client-controlled Stripe redirect URLs | P1 | OPEN | Server-owned canonical redirect boundary |
| S1-R2-06 | P1-C01 entitlement authority, if reachable | P1 | CONDITIONAL | Remove client authority; Stripe-verified server projection only |
| S1-R2-07 | P1-05 RPO/RTO and restore capability | P1 | OPEN / UNVERIFIED | Off-site backup + isolated measured restore drill |
| S1-R2-08 | P2-03 leaked-password protection | P2 | OPEN / PLAN-GATED | Native Supabase control if available; otherwise formal compensating controls |
| S1-R2-09 | P2-02 strict CSP promotion | P2 | OPEN | Telemetry-backed report-only → strict promotion |
| S1-R2-10 | P2-05 demo billing/coupon logic | P2 | OPEN | Remove or isolate from production runtime contract |
| S1-R2-11 | P2-01/P2-06 evidence identity and staleness | P2 | OPEN | Content-addressed Production/Main/Candidate evidence + automatic stale state |
| S1-R2-12 | P2-01 production/main content drift | P2 | VERIFIED BY PR #606 | Keep identity correlation; no additional runtime rollback work |

## Mandatory execution order

The security work is intentionally split by trust boundary. Do not combine unrelated items into a single remediation PR.

```text
R2-00 Conditional entitlement trace
+ R2-01 broken workflow classification
        ↓
R2-02 GitHub main enforcement
        ↓
R2-03 Node control-plane supersession
        ↓
R2-04 fatal process recovery
        ↓
R2-05 Stripe redirect boundary
→ R2-06 entitlement remediation when trace confirms reachability/impact
        ↓
R2-07 disaster recovery evidence
        ↓
R2-08 leaked-password control
→ R2-09 CSP strict promotion
→ R2-10 demo billing isolation
        ↓
R2-11 evidence/staleness automation
        ↓
S1-R2 HARDENED / VERIFIED gate
```

`R2-00` and `R2-01` are read-only/classification gates and MAY proceed before platform mutations because they determine whether an unknown path represents a higher-severity authority or missing security control.

## S1-R2-00 — Entitlement authority trace

**Source:** P1-C01
**Priority:** Conditional P1 — immediate read-only trace
**Mutation:** No for the trace phase

### Objective

Trace the complete call graph from the subscription UI through `handleStripeCheckout()`, `onUpdateTier(planId)`, session creation, webhook processing, subscription persistence and all server-side entitlement checks.

### Required proof

1. identify every production-reachable caller of the simulated payment/tier path;
2. determine whether `onUpdateTier()` changes presentation state only or can influence persisted/server authorization state;
3. inventory every API that grants feature/tier capability and identify its authoritative data source;
4. prove that a browser-controlled tier value cannot make a protected server operation succeed;
5. prove that Stripe webhook/session verification is the source of persisted subscription truth;
6. add no mutation during the trace unless a confirmed bypass requires an emergency owner-approved hotfix.

### Decision gate

- **No authority impact:** close the Conditional High finding with evidence, then remove simulation under R2-10 as production hygiene.
- **Reachable authority impact:** immediately promote to confirmed P1, create the dedicated R2-06 remediation branch and block other billing feature work until closed.

### Exit evidence

- route/call graph;
- list of server entitlement decision points;
- positive and negative authorization evidence;
- explicit classification `NOT AUTHORITY` or `CONFIRMED AUTHORITY GAP`.

## S1-R2-01 — Workflow startup-failure control recovery

**Source:** P2-04, promoted after reassessment
**Priority:** P1 Operational until classified
**Observed control:** workflow ID `345251495`, `path: BuildFailed`, `startup_failure`, zero jobs

### Objective

Determine which repository/governance/security control the workflow represents and restore its intended behavior without blind reruns.

### Required implementation

1. map workflow ID to canonical YAML/control owner and event model;
2. correlate schedule and pull-request startup failures against current `main`;
3. determine whether the failure is YAML/schema/event/configuration/platform-plan related;
4. if the workflow is required, fix the smallest root cause in a dedicated workflow/governance branch;
5. if obsolete, remove it and update the owning roadmap/ADR/ESS so no phantom control remains documented;
6. never replace a required platform/security control with a no-op success job.

### Negative tests

- invalid trigger/configuration still fails validation;
- required security jobs cannot disappear silently;
- repaired workflow creates the intended jobs on its supported event;
- a PR changing the workflow cannot use its own weakened policy as the sole authority.

### Exit

`VERIFIED PASS` requires an identified owner, valid workflow source, expected job creation and exact-head evidence. Obsolete removal requires equivalent traceability proving no control loss.

## S1-R2-02 — GitHub default-branch enforcement

**Source:** P1-01
**Priority:** P1
**Mutation:** Owner-gated GitHub platform mutation

### Preferred solution order

1. native GitHub repository ruleset or branch-protection capability;
2. existing repository governance checks as required checks under that platform protection;
3. plan change if private-repository enforcement is not available on the current GitHub plan;
4. risk acceptance only as an explicit Owner decision.

A workflow-only substitute is NOT equivalent to platform-enforced branch protection because a writable unprotected default branch can bypass the workflow path itself.

### Target controls

- require pull request before merge;
- require the canonical successful status checks actually emitted by the repository, including the build/test, governance, GitGuardian and hardened-image/CVE gates where those checks are stable and applicable;
- prevent force pushes;
- prevent branch deletion;
- retain Human/CODEOWNER merge authority;
- avoid broad bypass actors; any required bypass must be named and documented;
- ensure the protection does not deadlock because a required check name is obsolete or event-incompatible.

### Pre-mutation gate

- read current branch/ruleset state;
- enumerate exact current check names and their GitHub App/source;
- reconcile plan capability;
- prepare rollback steps;
- obtain explicit Owner approval for the platform mutation.

### Post-mutation evidence

- read back active protection/ruleset configuration;
- prove direct/force update is denied through a non-destructive validation path where possible;
- prove a valid PR remains mergeable only after required checks;
- record settings without secrets/tokens.

### Exit

GitHub reports an active protection mechanism for the default branch and the required checks/Human gate are demonstrably enforced.

## S1-R2-03 — Node control-plane supersession to 24.20.0

**Source:** P1-02
**Priority:** P1
**Reuse:** PR #602 supersession infrastructure

Node 24.20.0 is the current 24.x LTS baseline reviewed for this reassessment. The production Docker baseline is already on 24.20.0; the open scope is repository/CI/control-plane drift.

### Required implementation

1. synchronize from exact current `main` and re-check open PR correlations;
2. use the existing supersession workflow/automation rather than introducing a parallel version updater;
3. update `.nvmrc`, `package.json` engine policy and all active workflow/control-plane references owned by the supersession contract;
4. keep the supported major-line constraint bounded to Node 24;
5. verify lockfile/install/build/test behavior on the remediation branch;
6. update version/runtime evidence if the existing contract requires it.

### Negative tests

- no active workflow retains an unintended 24.18.0 control-plane pin;
- no automatic upgrade crosses the approved Node major line;
- production Docker digest/runtime invariant remains unchanged unless explicitly in scope.

### Exit

Repository and active control-plane Node policy consistently resolve to 24.20.0 and exact-head CI passes after PR creation.

## S1-R2-04 — Fatal process handling and supervised recovery

**Source:** P1-03
**Priority:** P1

### Architecture rule

An unhandled exception means process state is no longer trusted. The application may perform bounded, secret-safe shutdown cleanup but MUST NOT continue normal request processing.

### Required implementation

1. centralize fatal-error reporting with secret-safe structured logging;
2. stop accepting new work and mark readiness unhealthy immediately;
3. perform only bounded cleanup that is safe in a compromised process state;
4. stop/flush workers or outbox components only where the cleanup contract is proven bounded;
5. terminate with non-zero exit status;
6. rely on the external Render supervisor/runtime to restart the process;
7. verify `/healthz` and `/readyz` semantics around recovery without masking fatal state.

### Negative tests

- child-process test injects an uncaught exception and asserts non-zero exit;
- process does not continue serving after fatal error;
- fatal log does not expose credentials/tokens;
- shutdown cannot hang indefinitely on worker cleanup;
- deployed recovery evidence proves the supervisor returns a healthy replacement instance.

### Exit

`VERIFIED PASS` requires local child-process evidence plus post-deployment recovery evidence bound to the deployed commit.

## S1-R2-05 — Stripe Checkout redirect boundary

**Source:** P1-04
**Priority:** P1

### Architecture rule

The server owns checkout redirect origins. The client may at most select an explicitly allowed relative application destination; it may never supply an arbitrary absolute redirect authority.

### Required implementation

1. remove direct trust in request-body `successUrl` and `cancelUrl`;
2. construct production Checkout URLs from one canonical server-side application origin;
3. permit localhost only under an explicit non-production environment contract;
4. if the client needs destination choice, accept a constrained route identifier or relative path and validate it against an allowlist;
5. reject absolute URLs, scheme-relative URLs, encoded bypasses and unrecognized routes;
6. preserve webhook/server verification as payment/entitlement authority; redirect arrival is not proof of payment.

### Negative tests

- `https://evil.example/...`;
- `//evil.example/...`;
- encoded/obfuscated external authority;
- production request attempting localhost;
- unknown route token;
- forged success-page navigation cannot grant entitlement.

### Exit

Every Stripe Checkout Session created by CAPITAL-AI has a server-owned allowed redirect destination and the negative suite proves open-redirect payloads are rejected.

## S1-R2-06 — Stripe-verified entitlement projection

**Source:** P1-C01 if R2-00 confirms impact
**Priority:** P1 when activated

### Required implementation

- remove any client-side simulated tier update from authorization semantics;
- expose `pending` UI state rather than optimistic entitlement grant;
- persist subscription/tier only from Stripe-verifiable server evidence;
- make protected APIs resolve entitlement from authoritative server state, not browser/local storage;
- ensure webhook replay/idempotency controls remain authoritative;
- reconcile subscription state after successful Checkout without trusting the redirect alone.

### Exit

A manipulated browser cannot upgrade server capabilities; only Stripe-verified server state can change entitlement.

## S1-R2-07 — Disaster recovery, RPO and RTO evidence

**Source:** P1-05
**Priority:** P1
**Mutation/cost:** Owner-gated where external storage, paid Supabase capabilities or temporary infrastructure incur cost

### Solution order

1. use native Supabase/PostgreSQL export capabilities already available;
2. for the current Free project, maintain encrypted off-site logical backups because platform daily backups/PITR must not be assumed;
3. add further backup tooling only if native dump/restore cannot satisfy the approved recovery objective.

### Required implementation

1. define business-approved target RPO/RTO; do not invent targets from infrastructure defaults;
2. automate or operationalize regular logical dumps using a least-privilege path;
3. encrypt before/at off-site storage with separated key custody;
4. define retention and deletion policy consistent with DSGVO/data minimization;
5. restore into an isolated non-production environment;
6. validate schema, row counts/checksums where appropriate and critical business invariants;
7. measure actual backup age/RPO and end-to-end restore RTO;
8. document failure conditions, owner sign-off and next drill date.

### Negative tests

- corrupted/incomplete backup is detected;
- restore never targets production by default;
- backup artifacts do not leak credentials;
- inaccessible encryption key fails closed;
- integrity validation catches missing critical data.

### Exit

At least one successful isolated restore drill has measured RPO/RTO and integrity evidence. A runbook alone is insufficient.

## S1-R2-08 — Leaked-password protection

**Source:** P2-03
**Priority:** P2

Supabase leaked-password protection is a native control and is currently documented as a Pro-plan-and-above feature. Because email/password login is active again, this finding remains relevant.

### Preferred path

- if the project plan supports the native feature, enable it through an explicit Owner-gated Auth configuration change and read it back;
- if the project remains on a plan without the feature, formally document the plan limitation and retain/verify compensating controls: hCaptcha, rate limits, minimum password policy, credential-stuffing detection and MFA/AAL2.

Do not add a second custom leaked-password database/service unless native availability and compensating controls are demonstrably insufficient and a separate privacy/security assessment approves it.

### Exit

Native protection is verified active, or a time-bounded documented compensating-control acceptance exists with Owner approval.

## S1-R2-09 — CSP strict-mode promotion

**Source:** P2-02 and historical S1.6 / F-06..F-08
**Priority:** P2

### Required implementation

1. retain the existing authoritative CSP path; do not introduce a second generator;
2. collect a defined production report-only observation window;
3. classify violations and remove obsolete authorities;
4. verify Stripe, Supabase, Cookie/Consent, hCaptcha and other explicitly approved third parties;
5. promote `CSP_MODE=strict` only when legitimate blockers are closed;
6. define rollback to report-only if availability is affected.

### Exit

Strict CSP is enforced in production with telemetry/evidence showing expected integrations remain functional.

## S1-R2-10 — Demo/sandbox billing isolation

**Source:** P2-05 and R2-00 follow-up
**Priority:** P2 unless R2-00 proves authority impact

### Required implementation

- remove demo coupons and simulated payment behavior from the production billing contract;
- prefer a separate test fixture/adapter over production code branches;
- if a non-production branch is retained, gate it by explicit environment construction so production cannot activate it accidentally;
- keep Stripe-side coupon validation authoritative.

### Exit

Production server/UI bundles contain no reachable demo entitlement/payment behavior and tests retain an isolated supported fixture path.

## S1-R2-11 — Content-addressed security evidence and stale-state automation

**Source:** P2-01/P2-06
**Priority:** P2
**Reuse:** existing `scripts/pr/productionPreflight.mjs`, production-baseline identity and governance contracts

### Objective

Extend existing evidence identity rather than creating a parallel security baseline system.

### Required implementation

1. every generated security assessment/evidence snapshot records at least:
   - `auditGeneratedAt`;
   - `productionCommit`;
   - `mainCommit`;
   - `candidateHead` when applicable;
   - optionally content/tree identity when it improves rollback/revert interpretation;
2. a production rollback or `main` advance automatically makes prior assessment state `STALE` unless explicitly scoped as historical evidence;
3. evidence must distinguish `same tree` from `same deployment commit`;
4. `SECURITY_HARDENING_2026-08-29.md` and equivalent summaries must not continue presenting old SHAs as current;
5. reuse canonical production-baseline helpers and IDs where possible.

### Exit

Staleness is machine-detectable and current security status cannot silently reference superseded Production/Main identities.

## R2 implementation PR slicing

| Sequence | Work package / PR | Scope | Typical class | External mutation |
|---:|---|---|---|---|
| 0 | S1-R2-DOC | This roadmap/reassessment only | D | No |
| 1 | S1-R2-00 | Entitlement reachability/authority evidence | D/C only if test harness required | No |
| 2 | S1-R2-01 | Broken workflow classification/repair | D or R depending result | No platform mutation unless required |
| 3 | S1-R2-02 | Main protection evidence + Owner mutation | M | **Yes — GitHub** |
| 4 | S1-R2-03 | Node 24.20.0 control-plane supersession | R | No, except approved dispatch path |
| 5 | S1-R2-04 | Fatal process shutdown/recovery | R | Deployment evidence after PR |
| 6 | S1-R2-05 | Stripe redirect boundary | C/R | No Stripe mutation required |
| 7 | S1-R2-06 | Entitlement authority, only if activated | C/R | Normally no provider mutation |
| 8 | S1-R2-07 | Backup/restore drill | M | **Yes / cost-sensitive** |
| 9 | S1-R2-08 | Leaked-password setting/compensation | M or D | **Potential Supabase mutation** |
| 10 | S1-R2-09 | CSP strict promotion | R/M | Render config/deploy promotion may be Owner-gated |
| 11 | S1-R2-10 | Demo billing isolation | C/R | No |
| 12 | S1-R2-11 | Evidence stale-state automation | C/R | No |

Each work package starts from then-current `main`, uses a fresh scoped branch and gets its own final main-correlation immediately before PR creation.

## R2 validation contract

### Before every implementation PR

- fetch current `main`;
- re-check open PR scopes and correlations;
- identify the exact affected trust boundary;
- reuse existing repository/native platform capability before adding dependencies;
- run static/local/low-cost tests appropriate to the scope;
- inspect diff and changed files;
- do not trigger expensive GitHub CI before PR creation.

### Immediately before PR creation

- fetch `main` again;
- correlate newly merged changes across files, architecture, dependencies, APIs, configuration, data models, AuthN/AuthZ, security, compliance and governance;
- synchronize the branch;
- resolve semantic as well as Git conflicts;
- repeat necessary local/low-cost checks.

### After PR creation

- run the minimum targeted required CI first where policy permits;
- bundle related fixes before rerunning costly jobs;
- complete mandatory full checks before Human merge;
- bind evidence to exact PR head and base.

## R2 HARDENED / VERIFIED gate

S1-R2 may report `HARDENED / VERIFIED` only when all of the following are true:

```text
R2-00 authority trace resolved
AND R2-01 workflow control classified and healthy/retired with evidence
AND R2-02 main protection enforced
AND R2-03 Node control-plane superseded
AND R2-04 fatal process recovery verified
AND R2-05 Stripe redirect boundary closed
AND R2-06 closed or NOT-AUTHORITY evidence accepted
AND R2-07 measured restore drill complete
```

P2 findings R2-08..R2-11 must be either `VERIFIED PASS` or have an explicit, bounded, Owner-approved residual-risk/time-box before the overall security status may be represented as fully hardened.

## Authoritative external references for R2

Use current primary documentation during implementation, not this roadmap as a substitute for platform semantics:

- GitHub Docs — protected branches, rulesets, required status checks and force-push/deletion controls;
- Node.js Process documentation — `uncaughtException` is a last-resort cleanup hook; normal operation must not resume after an uncaught exception;
- Node.js official v24.x release index — Node 24.20.0 baseline reviewed 2026-08-29;
- Stripe Checkout Session API — server-created `success_url`/`cancel_url`; fulfillment/entitlement must not trust success-page navigation;
- Supabase Password Security — native leaked-password protection and plan availability;
- Supabase Database Backups — Free-tier recommendation for regular off-site exports and paid-plan backup/PITR capabilities.

## Verbindlicher PR-Template-Contract

Jeder Pull Request gegen `main`, einschließlich aller S1-Remediation-PRs, MUSS die vollständige kanonische Vorlage `.github/pull_request_template.md` verwenden.

- kein verkürzter oder frei formulierter PR-Body anstelle der Vorlage;
- alle nummerierten Abschnitte bleiben erhalten;
- nicht zutreffende Felder werden mit `N/A` begründet;
- maschinenlesbare Marker und Human-/Owner-Attestations bleiben wortgleich;
- nach jedem neuen Head wird die Approval-Evidence für den neuen Head erneut erzeugt;
- kein laufender PR darf durch die von ihm selbst geänderte CI-Authority allein autorisiert werden.

## Integration into the DEVELOPMENT Chain

The canonical DEVELOPMENT Chain remains authoritative. S1-R2 is a new reassessment tranche inside S1, not a replacement development chain.

Every implementation work item uses:

```text
current main
→ fresh scoped branch
→ bounded implementation
→ positive + negative tests
→ final main resynchronization/correlation
→ PR using canonical template
→ Human file review / CI
→ Human merge
→ remote branch deletion
→ evidence + roadmap sync
```

No agent may merge its own remediation PR.

---

# Historical S1 baseline — Security Audit 2026-08-12

The following F-01..F-18 ownership remains retained for traceability. R2 changes current priority/order only where the 2026-08-29 reassessment introduced or reclassified a finding.

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

## Historical PR slicing

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

## Historical S1 High-Severity Gate

M6 implementation was defined as blocked until:

```text
F-01 VERIFIED PASS
AND F-02 VERIFIED PASS
AND F-03 VERIFIED PASS
AND F-04 VERIFIED PASS
AND F-05 VERIFIED PASS
```

This historical gate remains traceable. Current execution priority is additionally governed by the active R2 gate above.

## Definition of Done

S1 is complete only when:

- the R2 HARDENED / VERIFIED gate is satisfied;
- historical F-01..F-18 remain closed, accepted with bounded risk, or explicitly owned by their canonical later phase;
- no secrets are present in evidence;
- all remediation PRs use the complete canonical PR template;
- all remediation PRs received Human review and Human merge;
- every implementation branch was based on then-current `main` and underwent the mandatory final main synchronization/correlation before PR creation;
- work branches are deleted after successful merge;
- DEVELOPMENT Chain roadmap and traceability are synchronized to the exact final SHAs.
