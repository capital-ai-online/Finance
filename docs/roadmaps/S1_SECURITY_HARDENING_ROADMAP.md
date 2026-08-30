# CAPITAL-AI S1 Security Hardening Roadmap

Status: ACTIVE / PARTIAL / ACTION REQUIRED
Status date: 2026-08-30
Repository baseline reviewed: `main@2bc3020b3ea8fba122d9f9ca3a7051e079244b4f`
Production deployment identity reviewed: `f714eae6a551ac8f3f92f4070f693c88ec35f6fc`
Production/Main identity state: commit identities differ after documentation/governance-only PR #617; no runtime/dependency/workflow delta was introduced by #617
Current reassessment source: CAPITAL-AI Full-Stack Security & Governance Reassessment, 2026-08-29 13:10 CEST, synchronized to repository/provider evidence on 2026-08-30
Historical security baseline: `docs/security/SECURITY_REMEDIATION_BASELINE_2026-08-12.md`
Current Operations handoff: `docs/runbooks/OPERATIONS_HANDOFF_2026-08-29.md`

## Objective and authority

S1 remains the **single canonical bounded security-hardening gate** inside the DEVELOPMENT Chain. This file is updated in place. No second Security roadmap, parallel hardening program or competing S1 status authority may be introduced.

The active objective remains to move CAPITAL-AI from `PARTIAL / ACTION REQUIRED` to `HARDENED / VERIFIED` by closing the confirmed High findings, resolving the conditional billing-authority finding, completing native default-branch enforcement, operationalizing recovery evidence and ensuring security evidence becomes stale when Production, `main` or a candidate head changes.

No finding is closed from roadmap intent alone. `VERIFIED PASS` requires code/configuration or provider evidence, the specified positive/negative tests and exact identity binding.

## 2026-08-30 current-state synchronization

The original 2026-08-29 reassessment was produced against older repository/deployment identities. Subsequent PRs changed the repository/governance state materially:

- PR #606 removed the former production/main runtime-content drift while preserving separate immutable commit identities.
- `S1-R2-01` is now classified as historical/obsolete phantom-control evidence; no active workflow YAML was changed to manufacture a pass.
- PR #611 introduced the S1-R2-02 ruleset reconciliation path; PR #615 hardened the canonical expected policy/builder/floor and made commit signing explicitly optional while retaining linear history as a mandatory target control.
- PR #617 merged as `main@2bc3020b3ea8fba122d9f9ca3a7051e079244b4f` and added the post-merge S1-R2-02 dispatch checklist plus synchronized current-state governance evidence.
- Render currently reports live Production at `f714eae6a551ac8f3f92f4070f693c88ec35f6fc`. The delta to `main@2bc3020...` is the documentation/governance-only #617 merge; Production and `main` therefore remain different deployment identities even though #617 introduced no runtime/dependency/workflow change.
- The live GitHub ruleset remains only partially reconciled. Provider readback documented after #615 still lacks required status checks, required linear history, deletion protection, CODEOWNER review and required review-thread resolution. `required_signatures` is intentionally absent by Owner decision and is not an S1 completion requirement.

The 2026-08-29 assessment remains the source of the still-open findings, but its old commit-level assertions are historical and MUST NOT be presented as current state.

## Reassessment register (R2)

| ID | Source finding | Priority | Current status | Required disposition |
|---|---|---:|---|---|
| S1-R2-00 | P1-C01 simulated client tier transition | P1 Conditional | OPEN / TRACE PENDING | Prove complete reachability and authority before normal billing work |
| S1-R2-01 | P2-04 workflow `345251495` startup failure | P1 Operational | RESOLVED / OBSOLETE HISTORICAL | Retain traceability; do not create a replacement phantom control |
| S1-R2-02 | P1-01 default-branch enforcement | P1 | PARTIAL / OWNER DISPATCH PENDING | Owner-gated `mode=plan` → separate ACCEPT → `mode=full` → provider readback |
| S1-R2-03 | P1-02 Node control-plane 24.18.0 | P1 | OPEN / PARTIAL CONVERGENCE | Supersede repository/control-plane pins to 24.20.0 |
| S1-R2-04 | P1-03 `uncaughtException` resumes process | P1 | OPEN / CONFIRMED | Fail-fast, bounded cleanup, non-zero exit, supervisor recovery evidence |
| S1-R2-05 | P1-04 client-controlled Stripe redirect URLs | P1 | OPEN / CONFIRMED | Server-owned canonical redirect boundary |
| S1-R2-06 | P1-C01 entitlement authority, if reachable | P1 | CONDITIONAL | Activate only if R2-00 proves authority impact |
| S1-R2-07 | P1-05 RPO/RTO and restore capability | P1 | OPEN / UNVERIFIED | Recurring encrypted off-site backup + isolated measured restore drill |
| S1-R2-08 | P2-03 leaked-password protection | P2 | OPEN / PLAN-GATED | Native Supabase control if available; otherwise bounded compensating-control acceptance |
| S1-R2-09 | P2-02 strict CSP promotion | P2 | PARTIAL / REPORT-ONLY | Complete production observation/evidence then promote strict mode |
| S1-R2-10 | P2-05 demo billing/coupon logic | P2 | OPEN | Remove or isolate reachable demo/simulation behavior from production contract |
| S1-R2-11 | P2-01/P2-06 evidence identity and staleness | P2 | PARTIAL | Identity binding exists; complete automatic stale-state semantics |
| S1-R2-12 | P2-01 production/main content drift | P2 | VERIFIED / HISTORICAL | Keep identity correlation; no additional runtime rollback work for #606 state |

## Mandatory execution order

Security work remains split by trust boundary. Do not combine unrelated implementation controls into one remediation PR.

```text
R2-00 entitlement authority trace
+ R2-01 RESOLVED historical classification
        ↓
R2-02 GitHub main enforcement live reconciliation
        ↓
R2-03 Node control-plane supersession
        ↓
R2-04 fatal process recovery
        ↓
R2-05 Stripe redirect boundary
→ R2-06 entitlement remediation only if R2-00 activates it
        ↓
R2-07 disaster recovery evidence
        ↓
R2-08 leaked-password control / compensation
→ R2-09 CSP strict promotion
→ R2-10 demo billing isolation
        ↓
R2-11 evidence/staleness completion
        ↓
S1-R2 HARDENED / VERIFIED gate
```

R2-00 remains a read-only/classification gate and may run in parallel with preparation work that does not mutate its billing authority boundary. R2-01 requires no further implementation unless new evidence proves a current control is missing.

## S1-R2-00 — Entitlement authority trace

**Source:** P1-C01  
**Priority:** Conditional P1 — immediate read-only trace  
**Mutation:** No for the trace phase  
**Current state:** OPEN / TRACE PENDING

Trace the complete call graph from subscription UI through checkout/tier callbacks, server session creation, webhook processing, subscription persistence and every protected API entitlement decision.

Required proof:

1. identify every production-reachable caller of simulated payment/tier behavior;
2. determine whether browser/UI tier state changes presentation only or can influence persisted/server authorization state;
3. inventory every protected API capability decision and its authoritative data source;
4. prove a browser-controlled tier value cannot make a protected server operation succeed;
5. prove Stripe-verifiable server state is the source of persisted subscription truth;
6. emit explicit classification `NOT AUTHORITY` or `CONFIRMED AUTHORITY GAP`.

If `CONFIRMED AUTHORITY GAP`, activate R2-06 immediately. If `NOT AUTHORITY`, R2-10 remains production-hygiene cleanup rather than an authorization hotfix.

## S1-R2-01 — Workflow startup-failure control classification

**Source:** P2-04  
**Priority:** P1 Operational during classification  
**Observed historical control:** workflow ID `345251495`, `path: BuildFailed`, `startup_failure`, zero jobs  
**Current state:** RESOLVED / OBSOLETE HISTORICAL

Current DevelopmentChain evidence classifies this as obsolete/historical phantom-control evidence. No active workflow YAML was changed and no no-op success workflow was introduced.

Closure contract:

- retain the historical identifier and classification for auditability;
- do not restore or recreate the workflow unless new current evidence identifies a real missing control owner/event model;
- any future replacement must have a canonical YAML owner, expected event contract and independent validation.

R2-01 is satisfied for the current R2 gate by the documented retirement/classification evidence.

## S1-R2-02 — GitHub default-branch enforcement

**Source:** P1-01  
**Priority:** P1  
**Mutation:** Owner-gated GitHub platform mutation  
**Current state:** PARTIAL / OWNER DISPATCH PENDING

### Current evidence

- GitHub Pro capability is active and `main-production-protection` is readable.
- PR #611 introduced the canonical ruleset reconciliation implementation.
- PR #615 merged policy/builder/floor remediation and defines `required_linear_history=true`, squash/rebase-only merge methods, deletion protection, CODEOWNER review, review-thread resolution and four issuer-bound required checks.
- Post-#615 provider readback documented on 2026-08-30 still shows only `non_fast_forward`, `pull_request` without CODEOWNER/thread-resolution enforcement, and advisory `code_quality`.
- Live `required_status_checks`, `required_linear_history` and `deletion` are still absent.
- `bypass_actors=[]` and `current_user_can_bypass=never` are retained in the documented readback.
- `required_signatures` is intentionally disabled by explicit Owner decision. Signing is optional provenance and is not a merge-readiness or S1 completion prerequisite.
- Canonical dispatch evidence: `docs/evidence/security/S1_R2_02_POST_MERGE_DISPATCH_CHECKLIST_2026-08-30.md`.

### Required next path

1. trusted `main` only;
2. Owner runs `ruleset-sync` with `mode=plan`;
3. review complete diff against canonical expected policy/floor;
4. `mode=full` remains blocked until a separate explicit Owner ACCEPT;
5. after accepted `mode=full`, capture provider readback;
6. prove required checks/Human gate are enforced and direct/force/deletion bypasses remain denied as designed.

### Exit

`VERIFIED PASS` requires provider readback showing the intended active protection controls and evidence that a valid PR is mergeable only after applicable required checks and Human/CODEOWNER authority. A workflow-only substitute is not equivalent.

## S1-R2-03 — Node control-plane supersession to 24.20.0

**Source:** P1-02  
**Priority:** P1  
**Reuse:** existing Node supersession infrastructure  
**Current state:** OPEN / PARTIAL CONVERGENCE

Current code-based state on the reviewed baseline:

- `Dockerfile` is already pinned to Node `24.20.0` with an immutable image digest;
- `.nvmrc` remains `24.18.0`;
- `package.json#engines.node` remains `>=24.18.0 <25`;
- active CI/action runtime usage has advanced, but the repository/control-plane contract has not yet converged to one 24.20.0 baseline.

Required implementation:

1. use the existing supersession workflow/automation rather than a parallel updater;
2. update `.nvmrc`, engine policy and all active control-plane references owned by that contract;
3. keep the supported major line bounded to Node 24;
4. verify lockfile/install/build/test behavior on the remediation branch;
5. prove no unintended 24.18.0 pin remains and Docker runtime identity is unchanged unless explicitly in scope.

### Exit

Repository and active control-plane Node policy consistently resolve to 24.20.0 and exact-head CI passes.

## S1-R2-04 — Fatal process handling and supervised recovery

**Source:** P1-03  
**Priority:** P1  
**Current state:** OPEN / CONFIRMED

Current code still registers `uncaughtException`, logs the error and explicitly continues without `process.exit()`. This remains inconsistent with the S1 architecture rule that process state is untrusted after an uncaught exception.

Required implementation:

1. centralize secret-safe fatal-error reporting;
2. stop accepting new work and make readiness unhealthy immediately;
3. perform only bounded proven-safe cleanup;
4. terminate non-zero;
5. rely on Render supervision for replacement;
6. verify `/healthz` and `/readyz` behavior around failure/recovery;
7. add child-process negative evidence proving the failed process does not continue serving.

### Exit

Local child-process evidence plus post-deployment supervisor recovery evidence bound to the deployed commit.

## S1-R2-05 — Stripe Checkout redirect boundary

**Source:** P1-04  
**Priority:** P1  
**Current state:** OPEN / CONFIRMED

Current server code still accepts `successUrl` and `cancelUrl` from `req.body`, derives `finalSuccessUrl` from the client-supplied value and passes the client-supplied cancellation URL into Stripe Checkout Session creation.

Required implementation:

1. remove direct trust in request-body absolute redirect URLs;
2. construct production Checkout URLs from one canonical server-owned application origin;
3. allow only explicitly validated relative destinations/route tokens where client destination choice is required;
4. permit localhost only under explicit non-production construction;
5. reject absolute, scheme-relative, encoded/obfuscated external and unknown destinations;
6. retain webhook/server verification as payment/entitlement authority.

### Exit

Every Checkout Session has a server-owned allowed redirect destination and the negative suite proves open-redirect payloads are rejected.

## S1-R2-06 — Stripe-verified entitlement projection

**Source:** P1-C01 only if R2-00 confirms authority impact  
**Priority:** P1 when activated  
**Current state:** CONDITIONAL

If activated:

- remove client-side simulated tier update from authorization semantics;
- expose pending UI state instead of optimistic entitlement grant;
- persist subscription/tier only from Stripe-verifiable server evidence;
- make protected APIs resolve entitlement from authoritative server state;
- preserve webhook replay/idempotency authority;
- do not trust successful redirect navigation as payment proof.

### Exit

A manipulated browser cannot upgrade protected server capabilities; only Stripe-verifiable server state can change entitlement.

## S1-R2-07 — Disaster recovery, RPO and RTO evidence

**Source:** P1-05  
**Priority:** P1  
**Mutation/cost:** Owner-gated where external storage, paid Supabase capability or temporary infrastructure incurs cost  
**Current state:** OPEN / UNVERIFIED

Current Operations evidence still has no measured recurring recovery proof:

- Supabase project remains `ACTIVE_HEALTHY`, region `eu-west-1`, PostgreSQL 17.6.1.127 / engine 17;
- a runbook exists, but a runbook alone is not recovery evidence;
- recurring encrypted off-site logical backup with retention is not evidenced as operating;
- RPO remains `UNVERIFIED`;
- isolated restore drill and measured RTO remain `UNVERIFIED`.

Required implementation:

1. obtain business-approved RPO/RTO targets rather than inventing infrastructure defaults;
2. operationalize regular least-privilege logical dumps;
3. encrypt before/at off-site storage with separated key custody;
4. define retention/deletion consistent with DSGVO/data minimization;
5. restore only into an isolated non-production target by default;
6. validate schema/data/integrity invariants;
7. measure actual backup age/RPO and end-to-end restore RTO;
8. document failure conditions, owner sign-off and next drill date.

### Exit

At least one successful isolated restore drill has measured RPO/RTO and integrity evidence.

## S1-R2-08 — Leaked-password protection

**Source:** P2-03  
**Priority:** P2  
**Current state:** OPEN / PLAN-GATED

Preferred path:

- use native Supabase leaked-password protection when the active project plan supports it, through an explicit Owner-gated Auth configuration change and provider readback;
- otherwise document the plan limitation and retain/verify compensating controls including hCaptcha, rate limits, password policy, credential-stuffing detection and MFA/AAL2;
- do not create a second custom leaked-password database/service without a separate privacy/security assessment.

### Exit

Native protection is verified active, or a time-bounded Owner-approved compensating-control acceptance exists.

## S1-R2-09 — CSP strict-mode promotion

**Source:** P2-02 and historical S1.6 / F-06..F-08  
**Priority:** P2  
**Current state:** PARTIAL / REPORT-ONLY

Current server implementation already provides one authoritative CSP response boundary with per-response nonce and explicit `baseline`, `report-only` and `strict` modes. The production default is `report-only`; strict policy is enforced only when `CSP_MODE=strict` is explicitly selected.

Remaining work:

1. keep the existing authoritative generator/boundary; do not add a second CSP system;
2. collect a defined production report-only observation window;
3. classify violations and remove obsolete authorities;
4. verify Stripe, Supabase, Cookie/Consent, hCaptcha and other approved integrations;
5. promote `CSP_MODE=strict` only after legitimate blockers are closed;
6. retain rollback to report-only for availability recovery.

### Exit

Strict CSP is enforced in Production with telemetry/evidence showing expected integrations remain functional.

## S1-R2-10 — Demo/sandbox billing isolation

**Source:** P2-05 and R2-00 follow-up  
**Priority:** P2 unless R2-00 proves authority impact  
**Current state:** OPEN

Required implementation:

- remove demo coupons/simulated payment or tier behavior from the production billing contract;
- prefer separate test fixtures/adapters over production code branches;
- if non-production branches remain, construct them so Production cannot activate them accidentally;
- keep Stripe-side coupon validation authoritative.

### Exit

Production server/UI bundles contain no reachable demo entitlement/payment behavior and tests retain an isolated supported fixture path.

## S1-R2-11 — Content-addressed security evidence and stale-state automation

**Source:** P2-01/P2-06  
**Priority:** P2  
**Reuse:** `scripts/pr/productionPreflight.mjs` and canonical production-baseline identity contracts  
**Current state:** PARTIAL

Progress now present:

- PR preflight/evidence can bind Production, `main` and candidate head separately;
- content-addressed Baseline IDs are used by the current PR-governance path;
- same deployment commit and same repository content are treated as distinct concepts.

Remaining work:

1. security assessment/evidence snapshots must record at least `auditGeneratedAt`, `productionCommit`, `mainCommit` and `candidateHead` when applicable;
2. Production rollback or `main` advance must automatically make prior current-state assessment evidence `STALE` unless explicitly historical;
3. current summaries must not continue presenting superseded SHAs as current;
4. machine validation must prove stale-state behavior rather than relying on manual discipline.

### Exit

Staleness is machine-detectable and current security status cannot silently reference superseded Production/Main identities.

## R2 implementation slicing

| Sequence | Work package | Current disposition | Typical class | External mutation |
|---:|---|---|---|---|
| 0 | S1-R2-DOC | This in-place roadmap/handoff sync | D | No |
| 1 | S1-R2-00 | OPEN / trace | D/C only if harness required | No |
| 2 | S1-R2-01 | RESOLVED / historical | D evidence only if new facts emerge | No |
| 3 | S1-R2-02 | PARTIAL / owner dispatch | M | **Yes — GitHub, Owner-gated** |
| 4 | S1-R2-03 | OPEN | R | No except approved dispatch path |
| 5 | S1-R2-04 | OPEN | R | Deployment evidence after PR |
| 6 | S1-R2-05 | OPEN | C/R | No Stripe provider mutation required |
| 7 | S1-R2-06 | CONDITIONAL | C/R | Normally no provider mutation |
| 8 | S1-R2-07 | OPEN / UNVERIFIED | M | **Yes / cost-sensitive where applicable** |
| 9 | S1-R2-08 | OPEN / PLAN-GATED | M or D | **Potential Supabase mutation** |
| 10 | S1-R2-09 | PARTIAL / report-only | R/M | Render config/deploy promotion may be Owner-gated |
| 11 | S1-R2-10 | OPEN | C/R | No |
| 12 | S1-R2-11 | PARTIAL | C/R | No |

Each implementation work package starts from then-current `main`, uses a fresh scoped branch and gets a final main/open-PR correlation immediately before PR creation.

## R2 validation contract

### Before every implementation PR

- fetch current `main`;
- re-check open PR scopes and correlations;
- identify the affected trust boundary;
- reuse existing repository/native platform capability before adding dependencies;
- run static/local/low-cost tests appropriate to scope;
- inspect diff and changed files;
- do not trigger expensive GitHub CI before PR creation unless the active policy explicitly requires it.

### Immediately before PR creation

- fetch `main` again;
- correlate newly merged changes across files, architecture, dependencies, APIs, configuration, data models, AuthN/AuthZ, security, compliance and governance;
- synchronize the branch and resolve semantic as well as Git conflicts;
- repeat necessary low-cost checks;
- bind Human/Owner PR-creation approval to exact reported main/head identities under the active governance policy.

### After PR creation

- run the minimum targeted required CI first where policy permits;
- bundle related fixes before rerunning costly jobs;
- complete mandatory checks before Human merge;
- bind evidence to exact PR head/base;
- no agent may merge its own remediation PR.

## R2 HARDENED / VERIFIED gate

S1-R2 may report `HARDENED / VERIFIED` only when:

```text
R2-00 authority trace resolved
AND R2-01 historical workflow classification remains accepted
AND R2-02 live main protection enforced and read back
AND R2-03 Node control-plane superseded
AND R2-04 fatal process recovery verified
AND R2-05 Stripe redirect boundary closed
AND R2-06 closed or NOT-AUTHORITY evidence accepted
AND R2-07 measured restore drill complete
```

P2 findings R2-08..R2-11 must each be either `VERIFIED PASS` or covered by an explicit, bounded, Owner-approved residual-risk/time-box before overall security status may be represented as fully hardened.

## Authoritative implementation references

During implementation use current primary provider/runtime documentation rather than this roadmap as a substitute for platform semantics:

- GitHub protected branches/rulesets/required status checks;
- Node.js process/fatal exception guidance and the approved Node 24.x baseline;
- Stripe Checkout Session redirect and webhook/fulfillment semantics;
- Supabase Auth password-security capabilities and database backup/restore capabilities;
- Render deployment/runtime evidence for supervised recovery and exact deployment identity.

## Historical S1 baseline — retained traceability, not a second active roadmap

The historical 2026-08-12 F-01..F-18 baseline remains authoritative for traceability through `docs/security/SECURITY_REMEDIATION_BASELINE_2026-08-12.md` and repository history. The active execution priority is the R2 register above.

| Historical finding(s) | Canonical ownership retained |
|---|---|
| F-01, F-11, F-12 | S1.1 Documentation API authorization/filesystem boundary |
| F-02 | S1.2 Production runtime controls fail closed |
| F-04, F-15 | S1.3 Trusted proxy/client identity/rate limiting; F-15 also blocks unsafe scale transitions |
| F-05 | S1.4 Server-secret namespace isolation |
| F-03, F-09 | S1.5 CI trust-chain/GitHub output/template integrity |
| F-06, F-07, F-08 | S1.6 Browser HTTP policy hardening |
| F-16 | M5 Audit / Telemetry |
| F-14 | M5A Native MFA / AAL2 |
| F-10, F-17 | M6 Supply Chain Provenance |
| F-13 | M9 independent/adversarial assurance |
| F-18 | Retain `ACCEPTED / INTENTIONAL` only while deny-by-default RLS intent remains evidenced |

Historical closure status must not be weakened by R2 work. R2 changes current priority/order only where the 2026-08-29 reassessment introduced or reclassified findings.

## Verbindlicher PR-Template-Contract

Every PR against `main`, including S1 remediation PRs, MUST use the complete canonical `.github/pull_request_template.md` contract.

- no shortened/free-form body replaces the template;
- all numbered sections remain;
- N/A fields are justified;
- machine-readable baseline fields and Human/Owner attestations remain governed by the canonical tooling;
- after every new head, exact-head evidence must be refreshed as required;
- a PR may not authorize itself solely through CI authority that it modifies.

## Integration into the DEVELOPMENT Chain

The canonical DEVELOPMENT Chain remains authoritative. S1-R2 is a security reassessment tranche inside S1, not a replacement DevelopmentChain.

```text
current main
→ fresh scoped branch
→ bounded implementation
→ positive + negative tests
→ final main/open-PR resynchronization and correlation
→ PR using canonical template and exact-head approval contract
→ independent CI / Human file review
→ Human/CODEOWNER merge decision
→ Human merge
→ separate Owner-gated provider/deployment mutation where applicable
→ evidence + roadmap/handoff sync
```

## Definition of Done

S1 is complete only when:

- the R2 `HARDENED / VERIFIED` gate is satisfied;
- historical F-01..F-18 remain closed, accepted with bounded risk or explicitly owned by their canonical phase;
- no secrets are present in evidence;
- all remediation PRs use the canonical PR contract and receive Human review/Human merge;
- each implementation branch is based on then-current `main` and receives final synchronization/correlation before PR creation;
- provider mutations remain separately Owner-authorized and post-change read back;
- work branches are deleted after successful merge;
- DEVELOPMENT Chain, S1 roadmap and Operations handoff are synchronized to the exact final identities.