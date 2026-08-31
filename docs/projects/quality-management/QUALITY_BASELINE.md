# CAPITAL-AI-QM — Quality Baseline

**Observed at:** 2026-08-31  
**Observed main:** `0f5d4f23841ef3824dec8447f700de0cd9614f16`  
**Open PR correlation at baseline:** no open PRs observed  
**QM branch:** `docs/qm-project-consolidation-20260831`

## Authority findings

| Artifact | Finding | QM action |
|---|---|---|
| `ADR-0096` | Accepted Governance Control Plane; explicitly recognizes the current 18-stage value-chain projection and obsolete earlier 14-stage projection | Retain; subordinate QM to it |
| `ESS-0005` | Correct read-only Quality Center architecture; previous documentation described the obsolete 14-stage projection | Amend the same ESS to 1.2.0 and align it to the existing 18-stage runtime; do not create a competing ESS |
| `ADR-0016` | Historical architecture decision introducing ESS component specifications / Quality Center scope | Retain as history; no supersession required |
| `ADR-0073` | Canonical CI consolidation/build/test authority | Retain; QM consumes evidence only |
| `ADR-0047` | Authoritative GitHub pre-merge CI gate | Retain; QM does not redefine required checks |
| `ESS-0012` | Documentation Governance authority | Retain; QM only checks QM documentation consistency |
| `docs/frontend/FRONTEND_ARCH.md` | Canonical frontend source-tree/dependency/presentation authority | Retain; QM measures conformance/performance only |
| `docs/frontend/FRONTEND_ROADMAP.md` | Canonical Frontend migration/UX roadmap; includes quality-oriented targets among product/migration work | Map only evidence/performance/accessibility subwork to QM; leave implementation sequencing at Frontend |
| `FintechValueChainQualityProjection.ts` | Runtime already projects 18 stages read-only | Make documentation match runtime; no new projection architecture |
| `securityPerformancePriorityRemediation.test.ts` | Existing lazy-loading / bundle-boundary regression evidence including prohibition of `vendor-react` parallel boundary | Reuse as QM-4 baseline |

## Architecture plausibility result

No second Validator Registry, EventBus, Auth controller, Router/Public Shell, CI topology, release authority, scoring/ranking authority, frontend architecture or value-chain architecture is required for CAPITAL-AI-QM.

The consolidation is therefore a **single-execution and evidence-coordination change**, not a new application architecture.

The existing architecture already separates the required responsibilities:

- Governance/lifecycle/supersession -> ADR-0096 and Governance registries;
- Quality contracts/threshold authority -> ESS-0001-CONTRACTS Chapter 12;
- Quality execution/aggregation -> ESS-0005 and `src/platform/Quality`;
- CI topology/required checks -> ADR-0073 / ADR-0047;
- Frontend presentation structure -> `FRONTEND_ARCH`;
- Security/IAM/Compliance -> their existing domain authorities;
- Financial runtime/scoring/ranking -> existing SC-MD-SPT/domain authorities;
- QM project status/execution coordination -> proposed ADR-0103 after it becomes effective.

## Supersession policy

Old ADR/ESS documents are not deleted merely because they are old. Under ADR-0096:

1. retain historical decisions for traceability;
2. supersede only an actual authority overlap;
3. provide an explicit supersedes edge and impact package;
4. use suspended/historical/legacy-redirect states for non-authorizing remnants;
5. never infer precedence only from a newer date or number.

At this baseline no existing ADR needs to be superseded by ADR-0103. ADR-0103 adds the missing **QM project execution coordination** while remaining subordinate to existing domain authorities.

The concrete old-artifact outcome is therefore:

- **retain** ADR-0016 as historical design rationale;
- **retain** ADR-0047/ADR-0073 as CI authorities;
- **retain** ADR-0096 as Governance Control Plane;
- **retain and amend in place** ESS-0005 rather than replacing it;
- **retain** ESS-0012 as Documentation Governance;
- use already `historical`/`suspended` records such as ADR-0005/ESS-0004 as non-authorizing examples of the correct lifecycle mechanism;
- perform future retirement only when QM-6/QM-9 finds a real semantic authority collision and the required supersession impact package exists.

## Evidence baseline

The Quality Center already has component contracts for mandatory validators, gates, score evidence, coverage, technical debt, documentation consistency, EventMesh publication and value-chain projection. A test file's presence is not execution evidence.

Any CI/runtime result not verified against the exact observed commit is `NOT_AVAILABLE` for this baseline.

## State-of-the-art advisory baseline — 2026-08-31

These external standards are **review lenses only** until an existing CAPITAL-AI authority explicitly adopts a requirement or threshold. They must not form a second governance hierarchy.

| External source | Current status observed | Recommended QM use | Authority boundary |
|---|---|---|---|
| OWASP ASVS | stable `5.0.0` | map web-application security verification evidence and gaps to stable versioned ASVS requirement IDs | Security domain decides remediation/policy; QM only reports evidence |
| NIST SP 800-218 SSDF | final `v1.1`; Rev.1 / `v1.2` is an Initial Public Draft | keep v1.1 as the stable secure-development benchmark already reflected by the Agent Trust Root; monitor v1.2 as research input only | no automatic import of draft requirements |
| SLSA | approved `v1.2` | evaluate existing source/build provenance and attestations against Source/Build tracks before inventing new supply-chain machinery | CI/Release authorities retain topology and release control |
| W3C WCAG | WCAG 2.2 Recommendation | use AA success criteria as an accessibility verification lens for existing frontend work, including accessible authentication and target/focus behavior | Frontend/Compliance authorities decide normative adoption and remediation |
| Core Web Vitals | current set: LCP, INP, CLS | collect reproducible field/lab evidence; advisory “good” references are LCP <= 2.5 s, INP <= 200 ms, CLS <= 0.1 at p75 | values are `NON_NORMATIVE_ADVISORY` until adopted by a CAPITAL-AI contract |
| OpenTelemetry browser semantic conventions | `Development` | prefer existing telemetry; if browser Web Vital semantic conventions are used, pin/version them and treat the schema as experimental | no second telemetry/event bus and no unstable schema as normative contract |

Official references used for this advisory review:

- https://owasp.org/www-project-application-security-verification-standard/
- https://csrc.nist.gov/pubs/sp/800/218/final
- https://csrc.nist.gov/pubs/sp/800/218/r1/ipd
- https://slsa.dev/spec/v1.2/
- https://www.w3.org/TR/WCAG22/
- https://web.dev/articles/vitals
- https://opentelemetry.io/docs/specs/semconv/browser/

### State-of-the-art recommendations for the web application

1. **Evidence before thresholds:** instrument and reproduce route/auth/render bottlenecks first; do not optimize from synthetic assumptions.
2. **Field + lab separation:** use real-user/field evidence for user-experience status and deterministic lab traces for regression/root-cause analysis; record environment and percentile semantics.
3. **Supply-chain provenance reuse:** strengthen the existing attestation pipeline toward SLSA v1.2 evidence instead of creating a second CI/release mechanism.
4. **Security verification mapping:** map existing security test evidence to OWASP ASVS 5.0.0 where useful, but hand all policy/remediation decisions to Security.
5. **Accessible authentication and interaction:** include WCAG 2.2 AA verification in Frontend quality evidence, especially auth/session flows, keyboard/focus, target size and error states.
6. **Telemetry convergence:** correlate browser, auth, backend and build identities through existing observability/EventMesh surfaces; do not introduce an independent QM telemetry bus.
7. **Version unstable external schemas:** any OpenTelemetry browser semantic-convention adoption remains adapter/version-pinned while its upstream status is Development.

These recommendations are intended to modernize verification and evidence quality without changing existing CAPITAL-AI architecture ownership.