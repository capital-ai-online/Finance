# CAPITAL-AI-SEC — Canonical Roadmap

**Project:** `CAPITAL-AI-SEC`  
**Folder:** `docs/projects/security/`  
**Role:** cross-cutting Security requirements, findings, bounded remediation and independent verification  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-15 — project-chat deltas plus PR #922/#923/#924/#929/#931 current-main state correlated; no unmaterialized chat return promoted to VERIFIED  
**Baseline:** `main@da8cdfd715bdffda0dc8e2bb463898455a920399`  
**Trust root:** `/AGENTS.md@current-main`

## Reconciliation rule

This file is the single active project execution projection. Dated 2026-09-13 archive content and non-terminal S1-R2 / SEC-SOTA items are represented here. Detail documents under `docs/roadmaps/` and `docs/evidence/security/` remain evidence only and are not a second execution source.

Chat content is routing/input evidence, not repository or provider truth. A chat-reported completion or provider readback may update this Roadmap only as `CHAT_RETURN`, `NOT_PROVEN` or an equivalent bounded state until the required current-main / exact-provider evidence is reproducibly materialized. `EVIDENCE_READY != VERIFIED` remains invariant.

## PR #900 / #901 work packages

### SEC-CARRY-01 — Existing non-terminal Security backlog
Carry forward every non-terminal SEC-SOTA, auth lifecycle, verification, finding/risk, supply-chain and provider-evidence item.

### SEC-PR900-01 — Security document consistency
Synchronize Security projections against current authority and implementation evidence. Preserve historical evidence dates; do not rewrite old results as new verification.

Current bounded consistency slice:

- `F-01`: Security component manifest version/description is synchronized with active `ESS-0006 v1.2.0` / component README by Human-merged PR #922. Productive Security behavior was not changed by that consistency correction.
- `F-02`: `.github/CODEOWNERS` was corrected by Human-merged PR #922 so it no longer claims Code Owner review enforcement while the correlated live Ruleset reported `require_code_owner_review=false`. A future Ruleset change remains a separate Owner-controlled external mutation.

### SEC-PR900-02 — SEC-SOTA-04 focused verification
Continue the existing materialized verification slice. Produce reproducible dispositions/routing for V3/V4/V6/V8/V16. V5, V10 and V12 were re-correlated through the PR #922 slice:

- **V5 File Handling:** the current `ImageAnalyzer` client can select/preview a file and construct `FormData`, but `/api/analyze-image` is server-side fail-closed with HTTP 410 and explicitly does not accept/store uploads while no approved replacement provider exists. Current disposition: `CURRENT_FILE_PROCESSING_DISABLED / NOT_VERIFIED`; other file surfaces still require inventory before any broader V5 conclusion.
- **V10 OAuth/OIDC:** productive Google sign-in is concretely present through `supabase.auth.signInWithOAuth({ provider: 'google' })`. Current disposition: `APPLICABLE_PROVIDER_MANAGED / NOT_VERIFIED`; redirect/provider/PKCE/state/nonce/client/token-endpoint controls still require exact provider configuration evidence and negative verification.
- **V12 Secure Communication:** `ASVS5-V12-TRANSPORT-EVIDENCE` remains routed to `CAPITAL-AI-OPS / PVC-08` for exact production TLS/proxy/edge readback followed by independent Security verification.
- V17 N/A remains baseline-scoped only.

**Exit:** every reviewed requirement has evidence-backed status or concrete owner return; no full ASVS conformance is inferred.

### SEC-PR900-03 — SEC-AUTH-LIFECYCLE
Re-correlate ESS-0020/ADR-0064/registry, native MFA, Legacy-TOTP, purpose-bound step-up and recovery against then-current implementation/provider evidence. Historical provider counts are not current state. Chat references to native MFA activation do not supersede the applicable ESS/ADR lifecycle or independently prove complete provider configuration.

### SEC-PR900-04 — Independent owner-return verification
Verify returned evidence for CORS composition, CSP/COOP, method gates, application MFA paths, AuthN/AuthZ audit coverage, route/object/field authorization, ULS entitlement lineage, supervisor behavior, recovery/RPO/RTO, strict CSP and demo billing isolation.

For `SEC-VERIFY-ULS-001`, current-main Security evidence remains `PARTIAL / NOT VERIFIED`: the materialized 2026-09-07 verification proved the deployed contract/RLS boundary but observed only `1` active-paid identity-state `MATCH` and `2` `MISSING_METADATA`. A later project-chat return reported a possible `3/3` stable-ID lineage after subsequent work. That later return is **not current repository Security evidence** and MUST NOT promote the item to `VERIFIED` until the exact current provider state is reproduced and fresh independent Security evidence is materialized.

Human-merged PR #924 adds a deterministic Supabase migration-ledger reconciliation (`70/70`, `unknown=0`) under `CAPITAL-AI-OPS / PVC-02`. It is useful supporting evidence for migration-history identity, but does not by itself prove live subscription lineage, lifecycle E2E or close `SEC-VERIFY-ULS-001`.

Human-merged PR #929 materializes the FINTECH/PVC-15 `FIN-SEC-03` owner return for Backtest, Monte Carlo and `full_ai_analysis`: server-authoritative paid-analysis entitlement gates are implemented, `full_ai_analysis` is bound to a productive executor with fail-closed provider/authority unavailability, and FINTECH marks the return `IMPLEMENTED / EVIDENCE_READY / SECURITY_VERIFICATION_REQUESTED`. This is owner implementation evidence only; independent CAPITAL-AI-SEC verification remains open and no parent Security finding is promoted to `VERIFIED` or `CLOSED`.

### SEC-PR900-05 — CodeQL/PostHog/security-provider boundaries
Verify roles, least privilege, data minimization, provider permissions and separation from authority.

- **Controlled CodeQL Autofix:** Human-merged PR #923 is `DONE_MAIN` and contains the bounded GitHub-native runner/workflow/test slice for suitable open HIGH/CRITICAL CodeQL alerts, with fail-closed quarantine for Governance/IAM/Billing/Entitlement/Secrets/Provider/DB/Infra/`.github` scope and without automatic PR creation, merge, auto-merge or alert dismissal. Human-merged PR #931 adds explicit decision/reason outputs plus bounded non-sensitive `decision.json` artifact evidence and focused unit coverage so alert selection, quarantine and no-candidate outcomes can be reproduced from hosted-run evidence. These merges prove repository implementation/observability only; they do not independently verify effective provider permissions, a successful safe-candidate run, or finding closure.
- **GH-READ-01 — GitHub security settings readback:** project-chat returns report later Code Scanning verification plus additional `security_events` / `read:audit_log` access, while SSO remained not configured, Audit Streaming was not conclusively evidenced, and an Environment endpoint produced an unresolved HTTP 404/root-cause gap. Current disposition: `CHAT_RETURN / PROVIDER_STATE_NOT_PROVEN`. Re-read the exact current GitHub organization/repository security state through authorized read-only surfaces and record what is actually observable. No PAT/SSO/audit-streaming/environment/provider permission mutation is authorized by this Roadmap item.
- **PostHog / telemetry:** continue vendor-neutral least-privilege, data-minimization and authority-separation verification; repository implementation or documentary closure does not substitute for effective provider-role/readback evidence where provider state is material.

### SEC-PR900-06 — Prompt/MCP trust findings
Verify F01/F06 prompt/history provenance returns and F04 external MCP effective grants/session/read-only boundaries with live/effective evidence where applicable.

## Project-chat reconciliation ledger — 2026-09-15

This compact ledger records the disposition of materially relevant Security project-chat themes against current main. It is a reconciliation aid inside the canonical Roadmap, not a second task registry or authority layer.

| Chat / work theme | Current disposition | Roadmap treatment |
|---|---|---|
| PR #922 — Security consistency + ASVS V5/V10/V12 | `DONE_MAIN / VERIFICATION_REMAINS_OPEN` | F-01/F-02 synchronized; ASVS requirement-level evidence stays open where provider/runtime evidence is missing |
| PR #923 — Controlled CodeQL Autofix | `DONE_MAIN` | implementation recorded under `SEC-PR900-05`; independent provider/permission verification remains separate |
| PR #924 — Supabase migration ledger | `FOREIGN_OWNER DONE_MAIN / SUPPORTING_EVIDENCE` | OPS/PVC-02 evidence may support ULS/migration correlation; no Security closure inferred |
| PR #929 — FIN-SEC-03 Paid Analysis Entitlement | `FOREIGN_OWNER DONE_MAIN / IMPLEMENTED / EVIDENCE_READY / SECURITY_VERIFICATION_REQUESTED` | FINTECH/PVC-15 implementation is on main; independent Security ALLOW/DENY, bypass and fail-closed executor verification remains open |
| PR #931 — Controlled CodeQL Autofix Decision Evidence | `DONE_MAIN / OBSERVABILITY_IMPLEMENTED` | decision/reason outputs and bounded non-sensitive run artifact support reproducible subsequent verification; no successful safe-candidate run or provider-permission verification is inferred |
| GH-READ-01 / GitHub Enterprise security settings | `CHAT_RETURN / NOT_PROVEN_CURRENT_PROVIDER` | bounded read-only verification under `SEC-PR900-05`; mutations remain separately authorized |
| SEC-VERIFY-ULS-001 later 3/3 lineage chat return | `CHAT_RETURN / CONFLICTS_WITH_CURRENT_MAIN_EVIDENCE` | reproduce exact provider state and materialize fresh independent Security evidence before any status promotion |
| SEC-SOTA-04 / ASVS 5 verification | `ACTIVE / VERIFICATION_OPEN` | V3/V4/V6/V8/V16 plus provider/runtime-dependent V5/V10/V12 evidence continue |
| SEC-AUTH-LIFECYCLE / ESS-0020 / ADR-0064 / MFA | `OPEN / CLARIFY` | no unilateral lifecycle/provider mutation; current authority and provider evidence required |
| CORS/CSP/COOP/method/AuthN/AuthZ/supervisor/recovery/demo-billing owner returns | `ACTIVE / OWNER_RETURN_VERIFICATION` | continue under `SEC-PR900-04`; no owner self-attestation becomes Security VERIFIED automatically |
| S1-R2-03..S1-R2-11 Security hardening | `MIXED — see absorbed-work table` | preserve owner routing and exact open verification gates; do not duplicate foreign-owner implementation |
| S1-R2-06 / FIN-SEC-03 entitlement children | `ACTIVE / OWNER_RETURN_IMPLEMENTED / SEC_VERIFICATION_OPEN` | screening/Buffett remediations and PR #929 paid-analysis implementation are on main; independent SEC verification remains open |
| SEC-SOTA02 F01-F06 prompt/MCP trust | `ACTIVE / OWNER_ROUTED` | continue under `SEC-PR900-06` and absorbed-work table; live grants/provenance require effective evidence |
| CodeQL/PostHog provider boundary discussion | `PARTIAL` | CodeQL automation plus decision-evidence observability are on main; least-privilege/effective-provider and successful-run verification remain open |
| Historical documentary/source-chat preservation work | `NON_AUTHORIZING / NO EXECUTION DELTA` | do not create Security work merely to preserve or close a source chat |
| Foreign project chats (OPS/QM/FE/SEO/SOCIAL/DOC/GOV) | `DEPENDENCY_ONLY unless Security return exists` | do not copy foreign-owner work into SEC; reference only Security verification/evidence dependencies |

## Absorbed open Security work (from 2026-09-13 archive + S1)

| ID | Owner | State | Next gate |
|---|---|---|---|
| SEC-SOTA-01 | SEC | `DONE_MAIN` | ledger only |
| SEC-SOTA-02 inventory | mixed owners | historical routed findings; re-correlate before remediation | see F01–F06 |
| SEC-SOTA-03 aggregate | SEC | `VERIFIED_MAIN / CLOSED` | ledger only |
| SEC-SOTA-04 ASVS 5.0 matrix | SEC + owners | `MATRIX_INVENTORIED / VERIFICATION_OPEN`; V5 current file-processing path disabled; V10 applicable/provider-managed; V12 owner-routed | requirement-level verification; V12 transport → OPS |
| SEC-VERIFY-R2-04 / S1-R2-04 fatal-process | OPS PVC-04/08 | `REPOSITORY_CONTRACT_VERIFIED / POST_DEPLOY_EVIDENCE_OPEN` | deployed supervisor/restart/readiness |
| SEC-VERIFY-ULS-001 | OPS PVC-08 | `PARTIAL / NOT VERIFIED`; later 3/3 chat return remains `NOT_PROVEN` until fresh exact-provider Security evidence | reproduce current provider lineage + independent SEC re-verification |
| SEC-AUTH-LIFECYCLE | GOV/Human + OPS evidence | `OPEN / CLARIFY`; ESS-0020 `PROPOSED` | no unilateral lifecycle mutation |
| SEC-COMP-CRA-01 | COMP first | COMP applicability | SEC supplies technical evidence only after COMP scope |
| S1-R2-03 Node control-plane 24.20.0 | OPS PVC-06 | `OPEN / PARTIAL` | converge engines/policy; exact-head CI |
| S1-R2-05 Stripe redirect boundary | OPS PVC-02 | `MERGED_MAIN / PRODUCTION_NEGATIVE_VERIFY_OPEN` via PR #918 | exact deployed negative open-redirect verification |
| S1-R2-06 entitlement authority | OPS parent; FINTECH/DATA children | `ACTIVE / OWNER_RETURNS_IMPLEMENTED / SEC_VERIFICATION_OPEN` | independently verify screening/Buffett return evidence plus PR #929 Backtest/Monte-Carlo/full_ai_analysis paid-analysis gates, bypass resistance and fail-closed executor behavior |
| S1-R2-07 recovery / RPO / RTO | OPS PVC-08 | `OPEN / UNVERIFIED` | measured restore drill |
| S1-R2-08 leaked-password | OPS PVC-08 | `OWNER-ACCEPTED / TIER EXCEPTION` | reassess if provider tier changes |
| S1-R2-09 strict CSP promotion | OPS PVC-08 | `PARTIAL / REPORT-ONLY` | ADR-0040 promotion evidence |
| S1-R2-10 demo billing isolation | OPS PVC-08 | `MERGED / POST-DEPLOY VERIFY PENDING` | production cannot reach DEV simulation |
| S1-R2-11 evidence identity/freshness | DATA PVC-10 | `MERGED / VERIFY PENDING` | deterministic current/stale/wrong-identity |
| SEC-SOTA02-F01 prompt-injection trust | FINTECH PVC-15 + CLIENT | `CONFIRMED / OWNER_ROUTED` | malicious retrieved-instruction + history-role-spoof DENY |
| SEC-SOTA02-F02 Draft-PR dispatch gate | DOC PVC-03 | `CONFIRMED / OWNER_ROUTED` | stop at approval-ready handoff |
| SEC-SOTA02-F03 mutation audit | DOC PVC-03 | `CONFIRMED / OWNER_ROUTED` | durable authorization/outcome evidence |
| SEC-SOTA02-F04 external MCP host | OPS PVC-02 | `EVIDENCE_GAP / OWNER_ROUTED` | effective host grant/session/read-only readback |
| SEC-SOTA02-F05 stale provider docs | GOV PVC-05 | `CONFIRMED / OWNER_ROUTED` | current Trust Root wording |
| SEC-SOTA02-F06 chat history provenance | CLIENT PVC-01 + FINTECH | `EVIDENCE_GAP / OWNER_ROUTED` | attested session/history + negative tests |

### S1-R2-06 verification delta — 2026-09-15

Independent Security re-correlation is recorded in `docs/evidence/security/S1_R2_06_ENTITLEMENT_INDEPENDENT_VERIFICATION_2026-09-14.md`; new owner returns are not Security verification by themselves.

- `verified_screening`: server authority exists; the case/trailing-slash alias remediation from PR #918 is Human-merged on main. Exact Production negative verification remains separate from repository merge evidence.
- `realtime_ai_newsfeed`: current repository boundary resolves verified principal plus server subscription state and fails closed; Production verification remains separate.
- `pdf_compliance_export`: authenticated server ledger path remains the repository reference boundary; Production verification remains separate.
- `buffett_value_check`: server authority exists; the bearer-aware `authFetch()` consumer transport from PR #920 is Human-merged on main without changing entitlement semantics.
- `backtest`, `monte_carlo`, `full_ai_analysis`: the FIN-SEC-03 owner implementation from Human-merged PR #929 is on main. FINTECH reports `IMPLEMENTED / EVIDENCE_READY / SECURITY_VERIFICATION_REQUESTED`; Security must independently verify paid ALLOW/DENY, forged/missing-bearer and direct/automatic alternate-path DENY behavior, plus fail-closed executor-unavailable behavior, before any Security status promotion.

S1-R2-06 is **not** `VERIFIED` or `CLOSED` as a whole.

`EVIDENCE_READY != VERIFIED`. Implementation and verification remain separate steps. PR #905 (license identity), PR #918 (route-guard hardening), PR #919 (PR-governance/Render identity), PR #920 (Buffett bearer transport), PR #922 (Security consistency/ASVS dispositions), PR #923 (controlled CodeQL autofix), PR #924 (OPS Supabase migration ledger), PR #929 (FINTECH paid-analysis entitlement), and PR #931 (controlled CodeQL autofix decision evidence) are Human-merged on current main. Their merge state does not promote unrelated provider/runtime gates to PASS.

## Dependencies
Productive owners CLIENT/OPS/DATA/FINTECH; GOV normative decisions; COMP legal judgments; QM exact-snapshot evidence.

## Project exit gate
One active SEC roadmap; no unresolved critical readiness finding is silently closed; every assessed requirement is reproducible or explicitly routed; chat-only returns are not promoted to verification without current evidence; dated 2026-09-13 SEC archive is deleted.
