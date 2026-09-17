# ADR-0080 — Marketing Roadmap Executor and Controlled Content Automation Boundary

**Status:** Accepted architecture decision; AI-execution authority retired 2026-09-16  
**Date:** 2026-08-12; authority interpretation updated by PR #1022 on 2026-09-16  
**Decision Owners:** Platform Director / Repository Owner

## Context

This ADR historically separated Marketing-domain automation from the Systemadmin execution domain to avoid privilege inheritance and to distinguish repository changes from external publishing side effects.

The repository now uses `/AGENTS.md@CURRENT_MAIN` as its single ChatGPT/AI/development instruction surface. ADRs are subject-matter and architecture records only; they do not grant AI capabilities, define agent execution sequences, authorize branches/PRs, or supersede `AGENTS.md`.

## Architectural decision retained

The following architecture facts remain useful and are retained as subject-matter constraints:

- Marketing automation and Systemadmin/infrastructure automation are distinct security domains.
- Sharing technical infrastructure must not imply capability or privilege inheritance.
- Public social publishing is an external business side effect, not merely a repository mutation.
- Financial claims require attributable evidence and applicable content/compliance controls.
- OAuth tokens, privileged infrastructure credentials and Owner authentication material remain outside model-visible content.
- Existing SocialMediaEngine/OAuth/runtime controls remain separate from AI development authority.

These facts constrain implementation when applicable. They are not ChatGPT instructions and do not create an agent profile.

## Superseded execution model

The former Marketing Roadmap Executor capability states, mandate sequence, activation gates, branch lifecycle, CI sequence and agent-specific approval flow are retired as development governance. Their execution semantics are replaced by `/AGENTS.md@CURRENT_MAIN` after Human/CODEOWNER merge of PR #1022.

ESS-0024 is retained only as a historical identity/tombstone. The former `marketing-roadmap-execution-profile.json` and `MARKETING_AGENT_ROADMAP_EXECUTION_POLICY.md` are removed by the same migration.

## Consequences

Future Marketing work resolves Project/PVC/Owner, dependencies, protected external side effects, evidence and Human/CODEOWNER boundaries through `AGENTS.md` and current subject-matter contracts. No ADR or ESS can reactivate a parallel agent execution authority.

## Historical references

- ESS-0024 — retired historical identity
- ADR-0026 / ADR-0027 — Social publishing/OAuth subject-matter decisions
- `docs/architecture/AUTONOMOUS_CONTENT_ENGINE_ARCHITECTURE.md` — architecture context only
- `docs/traceability/MARKETING_AGENT_TRACEABILITY_MATRIX.md` — historical/evidence projection only
