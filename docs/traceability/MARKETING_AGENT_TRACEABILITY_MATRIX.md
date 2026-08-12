# Marketing Agent Traceability & Gate Matrix

Status: DRAFT
Date: 2026-08-12
Baseline: `main@3a733f2b6efeffb3013fbb2c558b5ef4c185125e`
Logical agent: `capital-ai-marketing-roadmap-executor`

## Purpose

Map the proposed Marketing Agent and Autonomous Content Engine to existing CAPITAL-AI authorities, implementation phases, required tests and external best-practice references.

This matrix is non-authorizing. It must be synchronized with canonical Traceability registries before implementation enablement.

## 1. Core traceability

| Requirement | Source authority | Proposed artifact | Implementation gate | Evidence / test |
|---|---|---|---|---|
| Provider is not trust root | ESS-0019 | ESS-0022 §3 | MA1 | subject/provider separation test |
| Separate Marketing identity | ESS-0019, ADR-0058 | ESS-0022 / ADR-0068 | MA1 | wrong-agent DENY |
| No inherited Systemadmin authority | ESS-0021, ADR-0065 | ADR-0068 | MA1 | Systemadmin REM cannot authorize Marketing subject |
| Exact capabilities | ESS-0019 | Execution Policy | MA1 | missing-capability DENY |
| Exact path scope | ESS-0021 pattern | Execution Policy | MA1 | wrong-path DENY |
| Expiring/revocable authority | ESS-0021 pattern | Marketing mandate model | MA1 | expired/revoked DENY |
| Kill switch | ESS-0019/0021 | ESS-0022 / Execution Policy | MA1 | active kill switch DENY |
| Audit before side effect | ADR-0059 / SA3 | Execution Policy | MA5 | audit fail -> zero mutation |
| Human-only merge | AGENTS / ADR-0039 | ESS-0022 / Execution Policy | all mutating phases | merge capability absent |
| Fresh branch / delete after merge | AGENTS / DevelopmentChain | Roadmap / Execution Policy | MA5+ | branch lifecycle evidence |
| Generation separated from publishing | ADR-0026 / ADR-0068 | Content Engine Architecture | MA2+ | generator has no publish capability |
| Existing publisher retained | ADR-0026 | Content Engine Architecture | MA2–MA6 | regression tests |
| Source-grounded financial claims | AGENTS No-Fake-Data | ESS-0022 / Content Architecture | MA3 | unsupported claim DENY |
| AI provenance | governance requirement | Content Architecture | MA3 | provenance completeness tests |
| Human content approval | SEO Roadmap N4 | ESS-0022 / Content Architecture | MA3+ | hash mismatch DENY |
| Renderer least privilege | ADR-0068 | Content Architecture | MA4 | no credential access |
| SSRF-safe media fetch | Security baseline | Content Architecture | MA4 | private/local URL DENY |
| External publish separately controlled | ADR-0068 | Roadmap MA6 | MA6 | no publish without approval |
| Analytics does not grant authority | ESS-0019 | Roadmap MA7 | MA7 | feedback cannot publish |

## 2. Roadmap gate dependencies

| Gate | Depends on | Required result |
|---|---|---|
| MA0 | Deep Research + repo read | Human-accepted documentation package |
| MA1 | MA0 | Marketing subject/mandate negative tests PASS |
| MA2 | MA1 design | Content contracts/tests PASS |
| MA3 | MA2 | provenance/compliance/approval negative tests PASS |
| MA4 | MA3 | rendering isolation + asset security PASS |
| MA5 | MA4 + reusable SA host foundation VERIFIED PASS | one bounded repo pilot PASS |
| MA6 | MA5 + strong Owner approval architecture | separate external publishing ADR/control PASS |
| MA7 | MA6 | analytics feedback safely separated from authority |

## 3. Shared Integration Zone coordination

| Resource | Default Marketing ownership | Required coordination |
|---|---|---|
| `src/platform/SocialMediaEngine/**` | candidate yes | exact mandate + overlap check |
| `server/socialMedia/**` | candidate yes | exact mandate + security review |
| `docs/seo/**` | yes | normal docs governance |
| `src/platform/SeoEngine/**` | future yes | architecture/ADR where needed |
| `AGENTS.md` | no | Human/shared integration writer |
| `package.json`, lock | no | explicit shared lease |
| `.github/workflows/**` | no | Systemadmin/Security coordination |
| global IAM/Security | no | Security/Systemadmin authority |
| global Event Mesh registry | no | explicit integration work package |
| global Traceability registry | no | explicit integration work package |
| root server/app bootstrap | no | architecture/backend integration |
| deployment config | no | Systemadmin/production handoff |
| shared Supabase migrations | no implicit ownership | explicit data/production mutation gate |

## 4. Security negative-test matrix

| Test | Expected result |
|---|---|
| Retrieved article contains tool instruction | treat as data; no capability change |
| Retrieved page requests secret/token | ignore/redact; no disclosure |
| Wrong logical agent id | DENY |
| Marketing agent supplied Systemadmin REM | DENY |
| Expired Marketing mandate | DENY |
| Revoked mandate / kill switch | DENY |
| Path outside allowlist | DENY |
| Shared-zone file not explicitly authorized | STOP/DENY |
| Risk exceeds mandate ceiling | DENY |
| Audit persistence fails | zero protected side effect |
| Quantitative finance claim lacks source evidence | DENY |
| Source is synthetic/heuristic but text says live fact | DENY |
| Content provenance incomplete | no external publish |
| Content hash changed after approval | DENY publish |
| Asset hash changed after approval | DENY publish |
| Target platform changed after approval | require new approval |
| Cross-user content/asset id | DENY |
| `mediaUrl` resolves to loopback/private/link-local | DENY |
| Media MIME/magic bytes mismatch | QUARANTINE/DENY |
| Rendering provider unavailable | honest FAILED, no fake success |
| Renderer attempts social publish | capability/credential unavailable |
| Analytics recommendation attempts direct publish | DENY |

## 5. Best-practice crosswalk

### NIST AI RMF / Generative AI Profile

Application:

- GOVERN: Owner accountability, ESS/ADR, explicit agent identity and mandate;
- MAP: Marketing use case, financial claim risk, provider/data boundaries;
- MEASURE: source quality, compliance decisions, content performance, security tests;
- MANAGE: kill switch, approval, rollback, provider isolation and staged rollout.

### NIST SSDF

Application:

- integrate Marketing Agent work into the existing branch/PR/CI/review lifecycle;
- do not treat AI-generated code/content infrastructure as trusted by origin;
- test adapters, dependencies and supply-chain artifacts;
- retain evidence for defects and corrective action.

### ISO/IEC 42001

Application:

- accountable owner;
- documented AI purpose/scope;
- risk treatment and controls;
- traceability/transparency;
- continual improvement via measured feedback without removing governance.

### OWASP Agentic Security Initiative

Application:

- retrieved content/tool output is untrusted;
- least-privilege tools;
- explicit agent identity and capability boundaries;
- prevent privilege/self-mandate expansion;
- isolate external renderers;
- protect against unsafe inter-agent/shared-resource coupling;
- fail closed on control/audit uncertainty.

## 6. Evidence retention classes

### Security authorization evidence

Examples:

- mandate/approval reference;
- policy decision;
- audit reference;
- execution-host subject;
- branch/commit/PR;
- terminal result.

Retained separately from normal sampled telemetry.

### Content business evidence

Examples:

- source references/digest;
- generated content hash;
- asset hashes;
- provenance;
- compliance decision;
- content approval;
- publish log references.

### Operational telemetry

Examples:

- latency;
- provider/model/template version;
- safe token/cost metrics;
- render duration;
- failure class.

Full secrets, bearer tokens and raw sensitive prompts are excluded/redacted.

## 7. Documentation package completeness

MA0 package expected before implementation:

- [x] `.ai/skills/ESS-0022-Marketing-Roadmap-Executor.md` draft
- [x] `docs/adr/ADR-0068-marketing-roadmap-executor-and-content-automation-boundary.md` draft
- [x] `docs/roadmaps/MARKETING_AGENT_ROADMAP.md` draft
- [x] `docs/governance/MARKETING_AGENT_ROADMAP_EXECUTION_POLICY.md` draft
- [x] `docs/architecture/AUTONOMOUS_CONTENT_ENGINE_ARCHITECTURE.md` draft
- [x] this traceability/gate matrix
- [x] inactive machine-readable Marketing execution profile
- [ ] canonical ESS Registry update after Human review
- [ ] canonical ADR/traceability index update after Human review
- [ ] `docs/architecture/ROADMAP.md` integration after Human review
- [ ] M0–M10 traceability integration where required
- [ ] first Marketing mandate schema/validator in MA1

## 8. Current authorization state

`READ / ANALYZE / PLAN` conceptual profile only.

No document in this package authorizes runtime repository mutation, CI requests, deployment, production mutation, Social publishing or merge.
