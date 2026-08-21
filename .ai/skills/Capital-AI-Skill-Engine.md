---
skill:
  id: CAPITAL-AI-SKILL-ENGINE
  name: CAPITAL-AI Component Verification Skill Engine
  version: 1.0.0
  status: Implementation Projection
  owner: Quality Center
  category: Verification Orchestration
  priority: High

classification:
  type: Runtime Prompt Composition Skill
  role: Read-only component verification and vocabulary inventory
  authority: ESS-0005
  collaborates:
    - ESS-0008
    - ESS-0010
    - ESS-0011
    - ESS-0012
    - ESS-0013
    - ESS-0017

boundaries:
  mutatesRepository: false
  mutatesProduction: false
  createsGovernanceAuthority: false
  createsVocabularyAuthority: false
  createsEventAuthority: false
---

# CAPITAL-AI Component Verification Skill Engine

## Purpose

This skill composes evidence-oriented verification prompts for CAPITAL-AI architecture units without creating a second governance, quality, vocabulary, event or orchestration authority.

The executable catalog lives at:

`src/platform/Quality/SkillEngine/`

The Admin UI projection lives at:

`src/components/SkillEnginePanel.tsx`

## Authority model

The engine always resolves `AGENTS.md` and current `main` first. Component-specific ADR/ESS/contracts remain authoritative in their delegated scope. Archive, evidence and historical documents are inputs only and never become current authority by recency alone.

## Prompt architecture

The engine uses one stable system prompt and a separate dynamic component context. This reduces duplicated instructions and improves cacheability. Provider-native Structured Outputs are exported separately as JSON Schema instead of being copied into every natural-language prompt.

The stable prompt defines only:

- role and goal;
- success criteria;
- immutable constraints;
- evidence discipline;
- output behavior;
- stop/fail-closed rules.

The dynamic context adds only:

- component and paths;
- current baseline references;
- applicable authorities;
- component focus;
- priority error classes;
- vocabulary seed terms;
- candidate quick wins;
- candidate follow-on developments.

## Error classes

The canonical Skill Engine error registry contains `EC-01` through `EC-22`, covering registration, authority, dependency, boundaries, contract/event/version/documentation/vocabulary drift, traceability, security, compliance, tests, observability, data integrity, runtime wiring, duplicate architecture, orphans, supersession, cost/performance, failure handling and concurrency/state.

All error classes are always in scope. Component profiles only identify the classes that deserve highest attention.

## Vocabulary behavior

The Skill Engine does not create vocabulary concepts automatically. It resolves declared seed terms against the existing `src/platform/Vocabulary` registry and classifies them as:

- `CANONICAL`
- `ALIAS`
- `FORBIDDEN`
- `NEW_CANDIDATE`

`NEW_CANDIDATE` means review is required under ESS-0017; it does not authorize creation of a Concept ID.

## Verification result

The result contract is exported as `SKILL_VERIFICATION_RESULT_SCHEMA`. Model/provider adapters should use their native JSON-Schema / Structured-Output feature where available.

Expected status values:

- `PASS`
- `PASS_WITH_OBSERVATIONS`
- `REMEDIATION_REQUIRED`
- `BLOCKED`

Missing evidence never implies `PASS`.

## Admin UI

The Admin Portal exposes a dedicated `Skill Engine` tab with sub-tabs for:

1. Skill Registry
2. Fehlerklassen
3. Vocabulary
4. Prioritäten
5. Prompt Preview

The initial implementation is read-only and compiles prompts locally. It performs no autonomous provider call and therefore introduces no new model usage cost or production mutation path.

## Future execution boundary

A later model execution adapter may be added only after:

- provider capability/cost review;
- explicit authentication and authorization boundary;
- structured-output support verification;
- prompt/version/eval evidence;
- observability and rate-limit controls;
- no correlation with existing Request Orchestrator / AI Agent Framework;
- explicit approval for any external or production mutation.
