# DR-02A — ESS-0019 v1.2.0 Research Evidence Contract Impact

**Project:** `CAPITAL-AI-GOV`  
**Project folder:** `governance`  
**Primary PVC:** `PVC-05 — Platform Director`  
**Baseline:** `main@2b9aebf854939f6eedadfb8e16632ee48833ae36`  
**Branch:** `agent/governance-deep-research-evidence-contract-20260902`  
**Stable authority:** `AUTH-ESS-AI-AGENT-CAPABILITY-PLANE`  
**ESS:** `ESS-0019`  
**Candidate version:** `1.2.0`  
**Status:** OWNER-REVIEW / EFFECTIVE ONLY AFTER HUMAN MERGE

## 1. Why this is an amendment, not a new authority

ESS-0019 already governs every provider-neutral AI application, coding agent and research assistant and already defines the Research & Evidence Plane. The DR-01 Deep Research skill exposed a normative gap in evidence semantics, not a missing authority plane.

Creating a new ESS, `AUTH-*` namespace or parallel research control plane would duplicate the accepted `AUTH-ESS-AI-AGENT-CAPABILITY-PLANE`. DR-02A therefore versions the same stable authority identity from `1.1.0` to `1.2.0`.

No `supersedes` edge is created because the stable authority identity does not change. Under `/AGENTS.md`, semantic version recency within the same `authorityId` is the applicable resolution rule after Human Merge.

## 2. Added normative semantics

The v1.2.0 candidate adds a bounded Research Evidence Contract covering:

1. stable source identity and retrieval/observation provenance;
2. primary/original evidence preference where appropriate;
3. evidence-family independence so syndicated/circular sources do not manufacture triangulation;
4. explicit claim typing: `FACT`, `INFERENCE`, `ESTIMATE`, `OPINION`, `UNKNOWN`;
5. claim-to-source support integrity and prohibition of fabricated citations/source metadata;
6. preservation of material contradictions;
7. counter-evidence/adversarial review for Deep/decision-grade research;
8. evidence saturation rather than fixed source-count quotas;
9. explicit `BUDGET_EXHAUSTED`, `BLOCKED` or `UNKNOWN` states where evidence is insufficient;
10. fail-closed treatment of prompt/tool injection that cannot be isolated;
11. provider-neutral structured evidence projection through the merged DR-01 schema/skill;
12. bounded parallel research only through the existing ESS-0008 orchestration boundaries;
13. external skill/tool/prompt content remains untrusted;
14. remote skill loading remains unauthorized pending a separate architecture/runtime decision.

## 3. Explicit non-changes

DR-02A does **not**:

- create a second repository trust root;
- create a new `AUTH-*` identity;
- allocate a new ESS number;
- create a new `CTRL-*` identity;
- create or accept a new ADR;
- alter Human/Owner PR-create or Human/CODEOWNER merge boundaries;
- grant provider/model authority;
- add provider runtime credentials or adapters;
- enable remote skill loading;
- create a second agent registry, supervisor or direct agent-to-agent execution path;
- modify financial scoring, ranking, trading, portfolio or market-data authority;
- mutate deployment, Render, Supabase, Stripe, IAM, secrets or production resources.

## 4. Registry and current-state correlation

The candidate updates:

- `.ai/skills/ESS-0019-Universal-AI-Agent-Control-Plane.md` → `1.2.0`;
- `.ai/registry/ess-registry.json` → Registry `1.6.0`, ESS-0019 `1.2.0`;
- `docs/governance/authority-registry.json` → Registry `1.47.0`, retaining the Human Owner Device Authorization Stage-D cutover authority and resolving the same stable `AUTH-ESS-AI-AGENT-CAPABILITY-PLANE` to ESS-0019 `1.2.0`;
- `docs/architecture/ROADMAP.md` → current-state index `2.7.0` with explicit candidate/effective-after-merge semantics.

`CTRL-GOV-AGENT-PLANE-001` already references `AUTH-ESS-AI-AGENT-CAPABILITY-PLANE` and the ESS-0019 document without hard-coding a semantic version. No new control identity is necessary at DR-02A. A later machine-enforced runtime control may be justified only when DR-03/DR-04 exposes a deterministic execution gate.

## 5. ADR-0060 drift isolation

DR-02 preparation identified that `ADR-0060 — Software Supply Chain Provenance and Attestation` is still marked `PROPOSED` while historical M6 evidence cites it as authority.

DR-02A does not modify, accept, register or silently rely on ADR-0060. The Research Evidence Contract references current `/AGENTS.md`, ESS-0019, ESS-0008, accepted audit/security boundaries and non-authorizing implementation projections. Remote-skill supply-chain authority remains a separate reconciliation/architecture question.

## 6. Security and data-integrity impact

Expected positive effects:

- fewer unsupported or citation-laundered factual assertions;
- explicit uncertainty instead of fabricated completion;
- stronger resistance to indirect prompt/tool injection from retrieved content;
- source independence visible instead of raw source-count inflation;
- contradictions and partial failures retained in evidence;
- provider/model confidence cannot substitute for evidence;
- remote skill content cannot self-authorize activation.

Residual risks intentionally deferred:

- productive provider/tool adapter enforcement;
- concurrency/runtime budgets and cancellation behavior;
- remote skill manifest/signature/digest distribution architecture;
- runtime egress/SSRF/tool-poisoning controls;
- deployment and production activation.

Those remain DR-03 through DR-06 work items under their mapped Primary Owners.

## 7. State-of-the-art advisory correlation

External guidance is advisory and does not create CAPITAL-AI authority.

The amendment is directionally aligned with:

- NIST AI RMF / NIST AI 600-1 lifecycle risk-management and provenance expectations for generative AI;
- NIST AI RMF work continuing in 2026 toward trustworthy AI profiles across system lifecycles and supply chains;
- OWASP GenAI/Agentic AI 2026 reporting, which treats prompt injection, excessive agency, orchestration and supply-chain compromise as practical system-level risks;
- OWASP MCP Tool Poisoning guidance, which recommends treating tool responses as untrusted and enforcing privilege restrictions outside model context.

The repository remains authoritative; these references support the risk model but do not override `/AGENTS.md` or accepted CAPITAL-AI authorities.

## 8. Validation expectations

Pre-PR validation should confirm at minimum:

- ESS-0019 file, ESS Registry and Authority Registry all resolve `1.2.0` under the same stable authority identity;
- ESS number `0019` remains unique;
- no new DR-02A `AUTH-*`, `CTRL-*` or ADR identity was introduced;
- the already-Human-merged `AUTH-GOV-OWNER-DEVICE-AUTHORIZATION-CUTOVER` remains preserved;
- current-state index uses effective-after-Human-Merge wording for the candidate;
- remote skill loading remains explicitly unauthorized;
- DR-01 structured evidence projection remains subordinate to ESS-0019 and `/AGENTS.md`;
- current main and open PR overlap are refreshed immediately before any PR-creation approval request.

Hosted GitHub governance/technical checks remain independent evidence after PR creation and are not claimed in advance.

## 9. Exit gate

DR-02A is implementation-complete when the exact candidate has:

- consistent ESS/Authority/current-state version correlation;
- no unresolved authority-namespace overlap;
- no stale-main condition;
- available low-cost structural validation recorded;
- an exact main/head/scope package presented to the Human/Owner before PR creation.

PR creation, merge, provider runtime work, remote skill loading and production mutation remain separate gates.
