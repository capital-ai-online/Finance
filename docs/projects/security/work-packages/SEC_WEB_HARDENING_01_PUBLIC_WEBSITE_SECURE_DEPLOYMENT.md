# SEC-WEB-HARDENING-01 — Public Website & Secure Deployment Convergence

**Project:** CAPITAL-AI-SEC  
**Canonical project folder:** docs/projects/security/  
**Work Package ID:** SEC-WEB-HARDENING-01  
**Status:** MATERIALIZED_MAIN / PROMOTED_TO_SEC_ROADMAP / IMPLEMENTATION_OPEN  
**Priority:** P0/P1 security program  
**Materialization baseline:** main@e86955225887bb7f34036c175ad1da89b8aec14d  
**Roadmap promotion baseline:** main@ad47710808b179afb7b969f1c12825b4064be866  
**Trust root:** /AGENTS.md@CURRENT_MAIN  
**Security direction:** SECURITY_FOUNDATION_FIRST  
**Security owner:** CAPITAL-AI-SEC for threat/risk/control definition, findings, testing requirements and independent verification  
**Implementation owners:** owner-correct by affected surface; primarily CAPITAL-AI-OPS for release/production/runtime, CAPITAL-AI-FE for browser/landing implementation, CAPITAL-AI-GOV for repository protection, CAPITAL-AI-CLIENT where client/session semantics are affected, CAPITAL-AI-COMP for supply-chain/compliance requirements  
**Independent assurance:** CAPITAL-AI-QM  
**Human boundary:** final Pull Request merge remains subject to /AGENTS.md@CURRENT_MAIN and the active merge-safety contract
**Roadmap projection:** docs/projects/security/ROADMAP.md + docs/roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md

## 1. Objective

Protect the completely rebuilt public CAPITAL-AI website from web, identity, abuse, supply-chain and deployment attacks from the first production-capable iteration onward.

The target state is not a claim of "zero vulnerabilities". The enforceable objective is:

- no known unresolved CRITICAL/HIGH vulnerability in the production artifact;
- smallest practical public/browser/API attack surface;
- fail-closed authorization, input, artifact and deployment boundaries;
- one exact source-to-production identity chain;
- reproducible Security evidence bound to the exact candidate/runtime identity;
- bounded self-healing for reproducible drift;
- no second Security, Governance, Release, Deployment, IAM or evidence control plane.

The lifecycle is:

Finding → Work Package → Remediation → Verification → Convergence

Security implementation evidence never self-promotes to VERIFIED. EVIDENCE_READY != VERIFIED.

## 2. Current-main observed baseline

At materialization time:

- CURRENT_MAIN = e86955225887bb7f34036c175ad1da89b8aec14d (re-correlated after Human merge of PR #1162).
- /AGENTS.md Control Plane = 4.6.0.
- main is protected by repository rulesets and required GitGuardian, hardened-container, PR-governance and build/test checks.
- a catch-all CODEOWNERS mapping exists, while required approval count / code-owner enforcement remain separate Governance configuration decisions.
- production Render service Finance uses Docker, branch main, Frankfurt, one instance, Auto Deploy off, /healthz health check and preview generation off.
- production deployment is controlled through GitHub CI and a Render deploy hook with exact-current-main correlation before mutation.
- CSP nonce handling, HSTS, nosniff, Referrer-Policy, X-Frame-Options, explicit CORS handling, rate limiting, honeytoken telemetry and deployment identity already exist.
- strict CSP remains an evidence-gated target; production defaults to report-only evaluation for the strict policy.
- no productive Permissions-Policy, Cross-Origin-Opener-Policy or Cross-Origin-Resource-Policy implementation was found in the inspected current-main paths.
- the runtime image is non-root, removes build tooling/backend sourcemaps, has immutable application paths, produces SBOM/CVE evidence and uses a health check.
- exact current-main run 35528561793 proves Hardened image / HIGH+CRITICAL CVE gate = PASS while Signed private GHCR image / exact digest = FAIL; publisher evidence expected sha256:489e0efc10112e261de5a1e19a3be20d71666da01447129e1fecc64607518980 but GHCR reported sha256:b5156d4af544414139d78dc287e1cb5f40a146efd18cc13b2acd5f112bcad5e1.
- the immediately preceding observed container-publisher run demonstrated a local-build-digest versus GHCR-pushed-digest mismatch; this is a current verification target until a later exact-current-main run proves convergence.
- exact current-main Render deploy dep-dao287ek1f9s73ad8iig is live on e86955225887bb7f34036c175ad1da89b8aec14d and Post-Merge Production Correlation / main CI are PASS; therefore the current production path can succeed independently of the failing GHCR signed-publisher path, confirming SEC-WEB-F15 as an architecture-convergence gap rather than a production-outage claim.

## 3. Threat model

### 3.1 Assets

- public domain and brand identity;
- browser trust and visitor privacy;
- authentication/session state;
- payment and subscription transitions;
- public analysis and AI/market-data provider budgets;
- source repository and protected branch state;
- CI/CD credentials and deployment authority;
- OCI artifact, SBOM, provenance and signatures;
- production service identity and availability;
- Security/Quality evidence.

### 3.2 Primary threat actors

- anonymous internet attacker;
- bot/spam/credential-stuffing operator;
- attacker abusing public AI/provider-cost surfaces;
- malicious or compromised dependency/action;
- compromised third-party browser script/provider;
- attacker with leaked client-visible secret or token;
- compromised developer/automation credential;
- stale or wrong-identity artifact/evidence reused as current proof.

### 3.3 Required threat classes

- XSS and DOM injection;
- CSRF where cookie/session mutation applies;
- open redirect / OAuth callback manipulation;
- broken access control and entitlement bypass;
- credential stuffing and password-compromise abuse;
- CORS/method/header overexposure;
- request smuggling/oversized/malformed input at application boundaries;
- bot/DoS/cost amplification;
- secret leakage into client bundle, logs, artifacts or container;
- dependency and GitHub Actions supply-chain compromise;
- OCI build/push/signature/provenance identity mismatch;
- deployment of an artifact different from the verified artifact;
- production/main drift;
- rollback to an unverified or vulnerable artifact;
- DNS/subdomain takeover and transport misconfiguration;
- evidence staleness or fabricated PASS state.

## 4. Trust boundaries

1. Internet → public browser surface.
2. Browser → public application routes/API.
3. Browser → authentication/OAuth provider.
4. Browser → analytics/consent/third-party scripts.
5. Application → Supabase/Stripe/AI/market-data providers.
6. Repository → GitHub Actions runner.
7. Dependency/action source → build environment.
8. Build → OCI artifact.
9. OCI artifact → GHCR.
10. GHCR/signature/provenance → deployment authority.
11. GitHub deploy workflow → Render.
12. Render runtime → public edge/domain.
13. Owner implementation evidence → independent Security verification.
14. Security verification → independent QM assurance where required.

## 5. Work graph

### SEC-WEB-00 — Current attack-surface and control baseline

**Owner:** CAPITAL-AI-SEC  
**Priority:** P0  
**State:** READY

Materialize an exact-current-main inventory of public routes, API methods, browser policies, CORS, auth requirements, rate limits, request limits, third-party origins, public client environment variables, container identity and deployment chain.

**Exit gate:** every P0/P1 website/deployment finding in this package has current observed evidence, exact affected owner and a verification gate.

### SEC-WEB-10 — Single signed production artifact chain

**Implementation owner:** CAPITAL-AI-OPS / PVC-07 Release Management + PVC-08 Production Operations  
**Security role:** SEC-06 / SEC-08 / SEC-10  
**Priority:** P0  
**State:** CONFIRMED_CURRENT_MAIN / READY

Converge source, build, OCI registry digest, SBOM, SLSA provenance, Cosign signature and deployed Render artifact into one exact identity chain.

**Exit gate:** registry digest == signed digest == attested digest == deployed digest, with source SHA and runtime deployment identity bound to the same release.

### SEC-WEB-20 — Public browser isolation and strict CSP

**Implementation owner:** CAPITAL-AI-FE for landing/browser implementation; CAPITAL-AI-OPS for response/runtime delivery and production promotion  
**Security role:** SEC-03 / SEC-08 / SEC-10  
**Priority:** P1  
**State:** READY

Introduce missing browser-isolation policies, reduce landing-page CSP to the minimum required origins/capabilities and collect real report-only evidence before strict enforcement.

**Exit gate:** public landing policy is route-minimal, required headers are observed in production, no required flow breaks, and strict CSP status is truthfully evidenced.

### SEC-WEB-30 — Public API, input, authentication and abuse boundary

**Implementation owner:** owner-correct per route; primarily CAPITAL-AI-OPS / PVC-02, CAPITAL-AI-CLIENT / PVC-01 and CAPITAL-AI-FE presentation boundaries  
**Security role:** SEC-02 / SEC-03 / SEC-04 / SEC-08  
**Priority:** P1  
**State:** READY

Inventory and harden public mutation/read routes, OAuth/session transitions, validation, HTTP methods, CORS, rate limits, bot controls and AI/provider cost limits.

**Exit gate:** every public capability has explicit authentication/authorization/method/input/rate/budget behavior and negative tests for bypass/abuse.

### SEC-WEB-40 — Production readiness, rollback and resilience

**Implementation owner:** CAPITAL-AI-OPS / PVC-07 + PVC-08  
**Security role:** SEC-05 / SEC-06 / SEC-08 / SEC-10  
**Priority:** P1  
**State:** READY

Separate liveness/readiness/deployment identity, bind rollback to verified artifacts, preserve exact-main post-merge correlation and make drift detection/remediation evidence-bound.

**Exit gate:** release and rollback both prove exact safe artifact identity and production converges to the intended main/release identity without bypassing Security gates.

### SEC-WEB-50 — Continuous independent website assurance

**Owner:** CAPITAL-AI-SEC for verification; CAPITAL-AI-QM for independent assurance  
**Priority:** P1  
**State:** DEPENDS_ON_IMPLEMENTATION_RETURN

Add hosted/browser/runtime security verification, non-invasive DAST, transport/DNS checks, Security telemetry and evidence freshness checks.

**Exit gate:** no unresolved CRITICAL/HIGH website/runtime finding, all required evidence is current and exact-identity bound, and independent verification is complete.

## 6. Finding catalog

| ID | Priority | Finding / required control | Primary implementation owner | Verification gate |
|---|---|---|---|---|
| SEC-WEB-F01 | P0 | GHCR/local OCI digest convergence — confirmed on current main run 35528561793 | OPS / PVC-07 | registry digest readback equals selected canonical artifact identity |
| SEC-WEB-F02 | P1 | strict CSP is not yet enforced | FE + OPS / PVC-08 promotion | CSP report evidence + protected-flow browser tests + production strict readback |
| SEC-WEB-F03 | P1 | Permissions-Policy / COOP / CORP absent | FE + OPS | runtime header tests on exact production SHA |
| SEC-WEB-F04 | P1 | public landing lacks route-minimal CSP profile | FE + OPS | origin inventory + negative resource-load tests |
| SEC-WEB-F05 | P1 | CORS/method/header policy is broader than per-route need | OPS / PVC-02 | route-method-origin/header negative tests |
| SEC-WEB-F06 | P1 | public landing analysis runtime should stay isolated/lazy | FE | built-browser dependency/critical-path tests |
| SEC-WEB-F07 | P1 | canonical public attack-surface inventory required | SEC requirements; OPS/FE return | generated inventory correlated to router/build/runtime |
| SEC-WEB-F08 | P1 | server-side input/body/content validation contract | OPS / affected route owner | malformed/oversized/unexpected-field/injection negative tests |
| SEC-WEB-F09 | P1 | unsafe DOM/code execution gate | FE + SEC verification | forbidden-pattern scan + justified exception contract |
| SEC-WEB-F10 | P0/P1 | OAuth/session negative-security coverage | CLIENT/FE/OPS by surface | state/PKCE/redirect/replay/session/logout negative tests |
| SEC-WEB-F11 | P1 | production Security-header contract | OPS / PVC-08 | external runtime header readback |
| SEC-WEB-F12 | P2 | review legacy X-XSS-Protection header | FE/OPS | compatibility/security review; no weakening of CSP |
| SEC-WEB-F13 | P1 | PR dependency-diff security review | OPS/COMP | changed dependency vulnerability/license/lifecycle evidence |
| SEC-WEB-F14 | P1 | GitHub Actions supply-chain hardening | OPS / PVC-02/07 | pinned-action/permission/untrusted-code checks + zizmor |
| SEC-WEB-F15 | P0 | build once, deploy exact verified artifact — current Render path succeeds independently of failed signed GHCR publisher | OPS / PVC-07/08 | deployed digest is the already scanned/signed digest |
| SEC-WEB-F16 | P0 | canonicalize digest semantics | OPS / PVC-07 | no local-vs-registry semantic mismatch; registry digest is authoritative deployment identity |
| SEC-WEB-F17 | P1 | deployment evidence envelope | OPS / PVC-08 | deploy ID + source SHA + digest + manifest/SBOM/signature hashes |
| SEC-WEB-F18 | P1 | liveness/readiness/deployment identity must remain distinct | OPS / PVC-04/08 | /healthz + /readyz + exact identity evidence |
| SEC-WEB-F19 | P1 | rollback only to verified safe artifact | OPS / PVC-07/08 | rollback target has source/digest/signature/SBOM/schema compatibility evidence |
| SEC-WEB-F20 | P1/P2 | in-memory rate limiting is single-instance assumption | OPS / PVC-08 | scale-out prohibited until shared/edge rate-limit control is evidenced |
| SEC-WEB-F21 | P1 | bot/abuse protection for costly/public mutations | OPS + affected owners | IP/session/account/capability rate/budget denial tests |
| SEC-WEB-F22 | P1 | public AI/provider cost-abuse control | OPS + FINTECH provider owner as applicable | budget/concurrency/timeout/circuit-breaker evidence |
| SEC-WEB-F23 | P0/P1 | client/build/container secret exposure gate | SEC requirements + OPS implementation | dist/container/log secret scan + public-env allowlist |
| SEC-WEB-F24 | P1 | safe public error contract | OPS | no stack/provider/secret/internal-path disclosure under negative tests |
| SEC-WEB-F25 | P1 | Security telemetry taxonomy/redaction | OPS / PVC-18 projection + SEC requirements | event coverage + secret/PII redaction tests |
| SEC-WEB-F26 | P1 | CSP violation reporting required for strict promotion | OPS + FE | sampled/deduplicated reports bound to release SHA |
| SEC-WEB-F27 | P1 | DAST/runtime web verification | SEC verification + OPS target | non-invasive hosted scan against exact preview/production identity |
| SEC-WEB-F28 | P1 | DNS/TLS/subdomain hardening | OPS / PVC-08; DNS protected capability | TLS/DNSSEC/CAA/dangling-subdomain evidence |
| SEC-WEB-F29 | P2 | GitHub review/CODEOWNER enforcement decision | GOV / PVC-05 | provider ruleset readback after any owner-approved mutation |
| SEC-WEB-F30 | P1 | consolidated website-security test suite | SEC test contract + owner implementations | static/unit/integration/container/runtime test evidence |

## 7. P0 execution order

P0 work is dependency-ordered:

1. SEC-WEB-00 current exact baseline.
2. Read back the exact current-main Container Security publisher result.
3. SEC-WEB-F01 / F16 digest semantic convergence.
4. SEC-WEB-F15 one-artifact production path.
5. SEC-WEB-F23 secret exposure gate.
6. SEC-WEB-F10 current OAuth/session negative-security baseline.
7. Re-correlate production identity and open PRs.
8. Only then advance P1 browser/API/runtime expansion.

No P0 remediation may lower or bypass the existing Hardened image / HIGH+CRITICAL CVE gate, GitGuardian, build-and-test, PR Governance or Human merge boundary.

## 8. Secure deployment target

The target deployment chain is:

Source SHA
→ dependency/secret/security validation
→ one OCI image build
→ HIGH/CRITICAL CVE gate
→ final-image SBOM
→ provenance
→ registry push
→ registry digest readback
→ Cosign signature
→ SBOM/provenance attestation
→ pull-by-digest verification
→ Human merge
→ deploy exact verified digest
→ /healthz liveness
→ /readyz readiness
→ deployment SHA + digest readback
→ post-merge production correlation
→ independent Security verification

A failure at any identity/security gate is fail-closed. There is no fallback to an unverified source rebuild or mutable latest tag.

## 9. Public landing security target

The public landing shell should converge toward:

- prerendered/static-first content where practical;
- no server secret or privileged database capability in browser code;
- minimal first-party JavaScript;
- self-hosted assets where practical;
- third-party script loading only after explicit need/consent;
- route-minimal CSP;
- object-src none;
- base-uri none;
- frame-ancestors none for the public root unless a real embedding requirement exists;
- Permissions-Policy denying unused browser capabilities;
- COOP/CORP after compatibility verification;
- no public backend sourcemaps;
- no eval/new Function/document.write/unsafe DOM sink without an explicit reviewed exception;
- no fabricated data on unavailable public analysis surfaces.

## 10. API and authentication target

Every public route/capability must declare and verify:

- allowed method;
- authentication requirement;
- authorization/entitlement requirement;
- accepted Content-Type;
- schema and length limits;
- rate limit;
- cost/provider budget where applicable;
- CORS origin/header policy;
- safe error behavior;
- telemetry classification;
- retry/circuit-breaker behavior where external providers are involved.

OAuth/session verification includes negative cases for manipulated state, wrong redirect origin, replay/expired callback, stale tab/session races, logout, missing/expired entitlement and token leakage.

## 11. Evidence contract

Every child package records:

- observed Before state;
- intended delta;
- exact current-main/base/head identities;
- changed-file scope;
- owning project/PVC where applicable;
- Security requirement/finding IDs;
- tests executed and exact result;
- hosted CI/run identity;
- runtime/provider readback where claimed;
- observed After state;
- unresolved gates;
- Security verification result;
- QM assurance result where required.

NOT_RUN, SKIPPED, MISSING, STALE, IN_FLIGHT, BLOCKED and FAIL are never rendered as PASS.

## 12. Self-healing integration

These findings participate in the existing bounded self-healing lifecycle without creating a second registry:

DETECTED
→ CLASSIFIED
→ OWNER_ROUTED
→ REMEDIATING
→ IMPLEMENTED
→ EVIDENCE_READY
→ VERIFYING
→ VERIFIED
→ CONVERGED

Automatic remediation is permitted only when root cause is reproducible, fix is bounded/reversible, ownership is preserved, no protected external capability boundary is exceeded and Security/Compliance controls are not weakened.

## 13. Required owner handoffs

### OPS handoff

Covers SEC-WEB-F01, F05, F08, F11, F13-F28 as applicable to CI/release/runtime/production.

Return evidence must identify exact source SHA, workflow run, artifact digest, deployment ID and runtime state.

### FE handoff

Covers F02-F04, F06, F09, browser side of F10, F12 and landing-specific portions of F30.

FE does not acquire IAM, Release, provider, FINTECH or Production authority.

### CLIENT handoff

Covers client/session provenance and client-side authentication boundary portions of F10 where PVC-01 semantics are affected.

### GOV handoff

Covers F29 only. Ruleset/provider mutation is separate from this documentation package and requires owner-correct Governance implementation/readback.

### COMP handoff

Covers requirement/evidence interpretation for dependency/license/provenance controls where Compliance/Supply-Chain obligations apply. COMP does not become deployment authority.

### QM handoff

Performs independent assurance after owner implementation and SEC verification evidence exist. QM does not self-remediate findings to create its own PASS.

## 14. Explicit non-goals

This package does not:

- change production, Render, DNS, IAM, secrets, billing or database state;
- change GitHub rulesets;
- enable auto-merge;
- self-merge a PR;
- replace /AGENTS.md;
- create a second Security/Governance/Release/Deployment control plane;
- treat external guidance as repository authority;
- claim ASVS certification;
- claim production safety from documentation alone;
- reopen terminal historical findings without new regression evidence.

## 15. Package exit gate

SEC-WEB-HARDENING-01 is complete only when:

1. all P0/P1 findings have an owner-correct terminal disposition;
2. no known unresolved CRITICAL/HIGH vulnerability remains in the deployed artifact;
3. production source SHA and deployed artifact digest are exact and current;
4. registry digest, signature, SBOM and provenance are cryptographically/structurally bound to the deployed artifact;
5. public landing/browser headers and CSP are independently runtime-verified;
6. public API/auth/abuse boundaries have negative-test evidence;
7. liveness, readiness and deployment identity are independently evidenced;
8. rollback is verified against a known safe artifact;
9. runtime/DAST/transport evidence is current and exact-identity bound;
10. CAPITAL-AI-SEC has independently verified applicable Security gates;
11. CAPITAL-AI-QM assurance is complete where the package requires it;
12. final Human Owner merge boundaries were preserved for every repository change.

