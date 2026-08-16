# ADR-0080 — Marketing Roadmap Executor and Controlled Content Automation Boundary

**Status:** Accepted (Owner 2026-08-16)  
**Implementation-Status:** 🔴 NOT ENABLED — specification only; `READ / ANALYZE / PLAN`  
**Date:** 2026-08-12 (renumbered 2026-08-16; expanded to repository ADR standard 2026-08-16)  
**Decision Owners:** Platform Director / Repository Owner  
**Roadmap:** SEO-GM-ROADMAP-0002 / WP-M0  
**Related ESS:** ESS-0014, ESS-0019, ESS-0021, ESS-0024  
**Related ADR:** ADR-0026, ADR-0027, ADR-0039, ADR-0058, ADR-0065, ADR-0067, ADR-0081, ADR-0085

## Numbering note

Formerly filed as ADR-0068 (number collision with first-bounded-autonomous-work-package).
Content unchanged; number reassigned under ADR-0081. The governing specification was
likewise renumbered from ESS-0022 to **ESS-0024** under ADR-0085.

## Context

Three developments meet at this decision.

**1. A proven Systemadmin execution foundation exists.** ESS-0021 and the SA Roadmap
established `capital-ai-systemadmin-roadmap-executor` with execution-host identity, GitHub
OIDC, a Policy Gate, durable append-only M5 audit, permit-before-side-effect enforcement
and a kill switch. SA0–SA4 are VERIFIED PASS. That foundation is reusable infrastructure.

**2. Marketing work needs an executor.** SEO-GM-ROADMAP-0002 §4.3 records that content
generation is absent: `generateSeries`, the endpoint `POST /api/social-media/generate` and
the Studio surface were never delivered, and `SocialMediaGeneratorService.ts` documents this
itself. The N-block (WP-N1 … WP-N4) cannot proceed without an agent profile that may plan
and eventually implement this work.

**3. Publishing is already live and Owner-restricted.** ADR-0026 and ADR-0027 established
real Social publishing for X and Facebook, restricted to Owner/Founder, with PKCE OAuth and
an encrypted token store. YouTube, TikTok and Instagram fail closed on `mediaRequiredError`
because no rendering exists.

The risk is the shortest path between them: reusing the Systemadmin execution host for
marketing work would let the Marketing Agent **inherit** Systemadmin authority as a side
effect of sharing infrastructure. That would place content generation, media rendering and
external publishing inside a mandate designed for repository and infrastructure operations.

A further asymmetry drives this ADR: publishing to an external platform is not a repository
mutation. It leaves the trust boundary, is not revertible by a git operation, and carries
regulatory exposure because CAPITAL-AI content makes financial statements.

`AUTONOMOUS_AGENT_CONCEPT_GATE.md` forbids creating or enabling a privileged agent without
an Owner-approved roadmap package. The decision is therefore required *before* any Marketing
capability is wired — which is what WP-M0 gates.

## Decision

1. Create a **separate logical agent** `capital-ai-marketing-roadmap-executor` with its own
   identity, mandate, capability ceiling and kill switch, specified in **ESS-0024**.
2. The Marketing Agent **MUST NOT inherit Systemadmin authority**. Reuse of the execution
   host, IAM, audit and policy foundations is explicitly permitted; reuse of *authority* is
   not. Capabilities never inherit.
3. **Initial state is documentation/specification and read-only analysis only**
   (`READ / ANALYZE / PLAN`). No standing `BRANCH`, `COMMIT`, `PR`, `CI_REQUEST`,
   `DEPLOY_REQUEST` or `PRODUCTION_MUTATION` authority arises from this ADR.
4. **No public social-publishing authority** arises from this ADR. Public social publishing
   is an **external business mutation**, distinct from repository mutation, even where the
   underlying API is technically trivial.
5. **`MERGE` remains Human-only** and is permanently prohibited for this agent.
6. Later capabilities are granted only per work package, through an explicit Owner-approved
   Marketing Roadmap Execution Mandate, after the corresponding gates are VERIFIED PASS.

Capability ceiling, path scope, content trust boundary, financial-content invariants,
non-delegable actions and the required threat-model tests are specified normatively in
ESS-0024 §5–§13. This ADR decides the boundary; ESS-0024 defines its contents.

## Alternatives considered

| Alternative | Rejected because |
|---|---|
| Extend ESS-0021 to cover the marketing domain | Merges two risk classes into one mandate. Marketing work would run under infrastructure authority, violating least privilege and widening the blast radius of a prompt-injection or renderer compromise to the whole platform. |
| No dedicated agent; keep all marketing work manual | Does not scale to the N-block and leaves the documented content-generation gap unaddressed. Also produces no auditable agent identity, which the Concept Gate requires. |
| Grant repository *and* publishing authority in one mandate | Conflates a revertible repository mutation with a non-revertible external business mutation carrying regulatory exposure. |
| Build a second, independent security stack for marketing | Explicitly rejected by ESS-0024 §11: a parallel stack would duplicate IAM, audit and kill-switch surface and inevitably drift from the verified one. |
| Defer the decision until the N-block is implemented | Inverts the Concept Gate: the roadmap package must exist *before* a privileged agent is implemented, not after. |

## Consequences

**Positive**

- The Marketing domain gets an auditable, separately attributable subject identity, so a
  Systemadmin REM can never authorize a Marketing action and vice versa.
- Verified SA foundations are reused instead of duplicated; no second security stack.
- The external-publishing risk class is named and separated before any code depends on it.
- WP-N1 … WP-N4 gain a governance basis to be planned against.

**Negative / cost**

- Two agent profiles must be maintained, each with its own mandate, tests and evidence.
- Every Marketing capability requires its own gate and Owner approval; there is no blanket
  enablement, which makes the path to publishing deliberately slow.
- Shared integration paths (workflows, global IAM, bootstrap, shared migrations) are not
  owned by this agent and require coordination with the Systemadmin domain.

**Neutral**

- Existing SocialMediaEngine code, OAuth boundaries and the ADR-0027 Owner/Founder
  restriction are unaffected. This ADR adds an agent boundary; it changes no publishing path.

## Security invariants

1. The AI provider/model is never the trust root; provider identity confers no authority.
2. The Marketing Agent inherits no Systemadmin privilege from shared infrastructure.
3. No generative model or media renderer receives Social OAuth tokens, Supabase service
   credentials, Stripe credentials, GitHub credentials, Owner session material, TOTP secrets
   or passkey material (ESS-0024 §8).
4. Public quantitative financial claims require attributable source evidence; unsupported
   claims fail closed (ESS-0024 §9).
5. Human/Owner approval for external publication is bound to the final content and asset
   hashes; material changes invalidate the approval (ESS-0024 §10).
6. The agent may not modify its own authorization policy or expand its own mandate
   (ESS-0024 §12).

## Verifikation / Definition of Done

This ADR may move to `docs/adr/resolved/` only when all of the following hold.

**Documentation gates**

- [x] ESS-0024 exists and is registered in `.ai/registry/ess-registry.json` (ADR-0085)
- [x] Execution Policy, Traceability Matrix and inactive execution profile exist
- [x] Owner acceptance of ESS-0024 and this ADR recorded (WP-M0, 2026-08-16)
- [ ] Canonical ADR/traceability index and `docs/architecture/ROADMAP.md` updated
      (open items in `MARKETING_AGENT_TRACEABILITY_MATRIX.md` §7)

**Enforcement gates** — each proven by a passing negative test, per ESS-0024 §13

- [ ] Wrong agent, wrong mandate, wrong path or wrong capability → DENY
- [ ] Systemadmin REM cannot authorize a Marketing subject
- [ ] Prompt/retrieval injection cannot elevate capability
- [ ] External content cannot issue tool instructions
- [ ] Renderer or provider compromise cannot reach publishing credentials
- [ ] Unsupported financial claim → DENY; stale source evidence → REVIEW_REQUIRED or DENY
- [ ] Approval-hash mismatch → DENY; publication cannot precede approval
- [ ] Kill switch active → DENY
- [ ] Audit persistence failure → zero repository and zero external side effect
- [ ] `MERGE` capability absent from every Marketing mandate

**Runtime gates**

- [ ] Required SA execution-host foundations VERIFIED PASS
- [ ] First bounded Marketing mandate Owner-approved and exercised with evidence

Until then `Implementation-Status` remains `🔴 NOT ENABLED`. Acceptance of this ADR
establishes the boundary; it grants no capability.

## Referenzen

- `.ai/skills/ESS-0024-Marketing-Roadmap-Executor.md` (normative specification)
- `.ai/contracts/marketing-roadmap-execution-profile.json` (inactive profile)
- `docs/governance/MARKETING_AGENT_ROADMAP_EXECUTION_POLICY.md` (§18 activation rule)
- `docs/governance/AUTONOMOUS_AGENT_CONCEPT_GATE.md`
- `docs/governance/WP_M0_OWNER_REVIEW_PACKAGE.md`
- `docs/traceability/MARKETING_AGENT_TRACEABILITY_MATRIX.md`
- `docs/architecture/AUTONOMOUS_CONTENT_ENGINE_ARCHITECTURE.md`
- ADR-0081 (ADR namespace cleanup), ADR-0085 (ESS namespace cleanup)
