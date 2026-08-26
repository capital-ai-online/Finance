# CAPITAL-AI Skill Engine — Architecture Implementation

## Status

Implementation note for the read-only component verification projection inside the existing Quality Center. This document does not create a new governance authority, ESS namespace or platform top-level component.

## Baseline

The original Skill Engine implementation branch was created from `main@d04270726c56c89cb2b8cab25570662c5d4480f4` on 2026-08-22. The Vocabulary contract-hardening follow-up on 2026-08-25 starts from `main@6283b3618274d36a026a6ce791d3d291945a7f7f` after correlating the previously prepared work with the current repository state. Before Pull Request creation, `main` must be refreshed again and correlated according to `AGENTS.md`.

## Problem

CAPITAL-AI has component-specific architecture, governance, agent, event, documentation and vocabulary rules, but a reusable verification prompt layer was missing. Repeating the same verification contract in every component prompt would create prompt drift, token cost and a second de-facto policy surface.

## Decision within existing authority

Implement the Skill Engine as a submodule of `src/platform/Quality`:

```text
src/platform/Quality/SkillEngine/
  errorClasses.ts
  index.ts
  inventory.ts
  outputSchema.ts
  promptCompiler.ts
  skillCatalog.ts
  types.ts
  validation.ts
```

The Quality Center remains measurement/evidence-only. The Skill Engine cannot authorize merge, release, deployment, privilege elevation, data mutation or financial scoring changes.

## Prompt design

The prompt contract follows current production-agent guidance:

1. one stable, lean system prefix;
2. explicit goal and success criteria;
3. constraints stated once;
4. dynamic repository/component context appended after the stable prefix;
5. tool/repository evidence preferred over model memory;
6. provider-native Structured Outputs represented separately from prompt prose;
7. stop/fail-closed rules for missing baseline or ambiguous P0/P1 authority;
8. model/provider agnostic wording;
9. no hidden autonomous mutation;
10. representative evals/tests before later provider execution.

This structure is intentionally shorter than repeating full error-class definitions and JSON schemas in every component skill.

## Catalog coverage

The initial catalog covers platform and runtime units including:

- Architecture
- Platform Director
- Supervisor
- Version Manager
- Documentary
- Knowledge
- Discovery
- Registry
- Shared
- Core
- Contracts
- Interfaces
- Models
- Validators
- Generators
- Plugins
- Events
- Event Mesh
- Traceability
- Telemetry
- Quality
- Security
- Compliance
- Release
- Governance
- Vocabulary
- FinTech Core
- Market Data
- Branding
- Orchestrators
- Agents
- API Runtime
- Frontend
- Data Persistence
- Providers
- Deployment

Each catalog entry contributes only component-specific deltas: paths, focus, authority references, priority error classes, vocabulary seed terms, quick wins and follow-on development candidates.

## Error-class registry

`EC-01` through `EC-22` form the shared verification taxonomy. The registry is code, not prompt duplication. All classes remain in scope for every verification; profiles only prioritize likely/high-impact classes.

## Vocabulary integration

ESS-0017 / ADR-0078 remains the only terminology authority. The Skill Engine is a read-only consumer and does not create a second registry.

The current Vocabulary architecture already separates browser-safe `src/platform/Vocabulary/index.ts` from explicit Node-only `src/platform/Vocabulary/node.ts`. The Skill Engine therefore reuses the existing public browser-safe entry point rather than introducing another parallel frontend registry facade.

`buildVocabularyInventory()` accepts an `IVocabularyRegistry` dependency with the canonical registry as its default. This allows deterministic contract tests and future read-only adapters without coupling Quality to a second Vocabulary implementation or granting concept-creation authority.

Canonical Registry and Skill Engine validation use the same `normalizeVocabularyTerm()` contract: trim, Unicode NFKC normalization and deterministic `en-US` lowercasing. Compatibility-equivalent Unicode strings therefore cannot drift into separate candidates merely because they use different Unicode representations.

Vocabulary terms are classified as:

- `CANONICAL`
- `ALIAS`
- `FORBIDDEN`
- `NEW_CANDIDATE`

Unknown terms remain `NEW_CANDIDATE`; no Concept ID is generated automatically. Registry registration also fails closed if an active Canonical/Display/Alias term collides with a Forbidden Term, including cross-concept collisions. A normalized label therefore cannot simultaneously resolve as active vocabulary and prohibited wording.

## Admin UI

`src/components/SkillEnginePanel.tsx` exposes five internal views:

- Skill Registry
- Fehlerklassen
- Vocabulary
- Prioritäten
- Prompt Preview

The panel is reachable through a dedicated local `Skill Engine` tab inside `AdminPortal`. The parent Dashboard tab union is not expanded; this avoids creating another navigation state contract and keeps the integration scoped to the existing Admin Portal.

The Vocabulary view remains read-only. UI filtering and richer Concept-/DE-/EN-/Skill-usage projection are a separate follow-up scope so Registry/contract hardening and presentation changes do not share one review surface.

## Cost boundary

The current UI performs no LLM/API execution. It only compiles deterministic prompts and computes local catalog/vocabulary inventory. Therefore it adds no recurring AI-provider cost.

A later execution adapter requires a separate provider/cost/security preflight and must reuse the existing Request Orchestrator / AI Agent Framework where applicable instead of creating a parallel model router.

## Validation

Unit coverage verifies:

- catalog uniqueness and required metadata;
- all referenced error classes exist;
- stable system prompt across component skills;
- dynamic context isolation;
- Structured Output schema remains outside natural-language prompts;
- Canonical/Alias/Forbidden/NEW_CANDIDATE status projection;
- NFKC normalization is shared between Vocabulary and Skill Engine;
- injected `IVocabularyRegistry` consumers cannot create concepts through inventory resolution;
- unknown terms remain review candidates with `conceptId: null`;
- active/forbidden term collisions fail closed at Registry registration;
- no provider/model lock-in or mutation instruction appears in the stable prompt.

The existing frontend architecture and production build paths remain responsible for proving browser bundle compatibility; this follow-up does not add a parallel build or CI gate.

## Future work

1. Repository-backed runtime discovery instead of static component paths.
2. Provider adapter using native JSON Schema / Structured Outputs.
3. Evaluation fixtures per component and error class.
4. Evidence graph projection into Traceability.
5. Controlled Quality Center reporting without authorizing mutations.
6. Vocabulary Usage Index linkage to UI Message Catalog.
7. Read-only Admin Vocabulary filtering and richer Concept/usage projection.
