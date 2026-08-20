# ADR-0098 — MediaProject v2 Timeline Contract

- **Authority ID:** `AUTH-ADR-MEDIA-PROJECT-V2-2026-08-20`
- **Version:** `1.0.0`
- **Status:** PROPOSED — implementation candidate; effective only after Human Merge
- **Date:** 2026-08-20
- **Owner:** CAPITAL-AI Owner
- **Scope:** MC-1 canonical media project/timeline contract, compatibility migration and validation boundary
- **Parents:** ADR-0094, SEO-GM-ROADMAP-0002 / WP-N3, ARCH-CONTENT-0001, Owner chat priority 2026-08-20

## Context

The deterministic ADR-0094 renderer already accepts a bounded local `schemaVersion: 1.0.0` manifest and produces branded images, scene frames and optional short video without network or publishing authority. The existing SocialMediaEngine also contains `ScriptScene`, `GeneratedMediaItem` and `SocialMediaSeriesPackage`, but there is no canonical editable timeline representation that a future Media Studio, motion engine, audio layer, asset registry or renderer adapter can share.

Adding each later capability directly to the legacy scene manifest would create incompatible schemas and couple UI, renderer and provider concerns. Replacing existing `SocialMediaSeriesPackage` or the legacy render manifest silently would violate the compatibility direction already documented in `ARCH-CONTENT-0001`.

## Decision

### 1. Native TypeScript `MediaProject v2` is the canonical domain contract

CAPITAL-AI introduces `MediaProjectV2` under `src/platform/SocialMediaEngine/Contracts/` with schema version `2.0.0`.

The contract models:

- rational timebase;
- canvas and target aspect ratio;
- project duration in integer frames;
- typed tracks;
- typed layers;
- asset references;
- transitions;
- render recipe;
- source/provenance reference;
- disclosure requirements;
- JSON-compatible metadata.

The contract remains provider-neutral and contains no OAuth, social token, infrastructure credential or publish operation.

### 2. Integer frame ranges and rational rates are authoritative

Timeline positions and durations use integer frame counts. Frame rate is represented as a rational `{ numerator, denominator }` instead of floating-point seconds.

This avoids cumulative floating-point drift and leaves room for non-integer broadcast rates without changing the domain contract. Legacy manifest-v1 migration is intentionally restricted to explicitly supported integer frame rates until a separate compatibility rule for fractional legacy seconds is required.

### 3. Tracks are sequencing domains; compositing uses separate tracks

`video`, `graphics`, `text`, `chart`, `audio` and `caption` are explicit track kinds. Layers on one track must not overlap. Visual or audio compositing is expressed through multiple tracks rather than ambiguous same-track overlap.

Transitions reference adjacent layers on the same track. Cross-track transitions and dangling transition references fail closed.

### 4. Brand-critical output remains deterministic

Every `MediaRenderRecipe` requires:

- `brandTokenSource: docs/frontend/design-tokens.json`;
- `brandTextMode: deterministic`;
- `publishReady: false`.

Charts require `deterministicLabels: true`. Financial values, scores, labels, disclaimers and other brand-critical text therefore remain outside generative image text rendering.

### 5. MediaProject does not make arbitrary remote media trusted

MC-1 accepts only opaque or repository-relative source/asset references and rejects dangerous/remote schemes (`http`, `https`, `data`, `file`, `ftp`, `gopher`), absolute paths and traversal references.

A future Asset Registry may resolve an opaque `asset-registry` reference through its own authorization and validation plane. MC-1 does not add storage, URL fetching, provider pull, SSRF-sensitive delivery or database mutation.

### 6. Legacy render manifest v1 remains supported through an explicit adapter

`LegacyMediaRenderManifestAdapter` converts the bounded ADR-0094 manifest shape into MediaProject v2 deterministically.

The adapter preserves:

- slug/title/subtitle;
- scene order;
- scene text;
- scene disclaimers;
- duration;
- CAPITAL-AI kicker default;
- offline renderer profile;
- `publishReady=false`.

The adapter introduces no timestamps, random IDs, network access or hidden business-data transformation. The current Graham Fair Value package is the golden compatibility fixture.

### 7. Validation is two-layered

Serialized MediaProject payloads have a JSON Schema using JSON Schema Draft 2020-12 for structural validation.

Repository/domain code additionally uses `validateMediaProjectV2()` for semantic invariants that are cumbersome or misleading to encode purely in JSON Schema, including:

- unique track/layer/asset/transition identities;
- track/layer compatibility;
- timeline bounds;
- same-track non-overlap;
- asset-reference integrity and kind matching;
- transition graph integrity/adjacency;
- project duration bound;
- remote/dangerous reference denial;
- deterministic brand/output rules;
- `publishReady=false`.

Both layers are deterministic and provider-independent.

### 8. OpenTimelineIO is an interoperability reference, not a runtime dependency

OpenTimelineIO (Academy Software Foundation, Apache-2.0) is a strong fit for editorial interchange because its model covers timelines, tracks, clips, transitions, markers and metadata and is used broadly in media pipelines. It deliberately represents editorial structure rather than embedding media.

MC-1 does **not** add OpenTimelineIO as a runtime dependency because CAPITAL-AI's domain/UI stack is TypeScript and the current OTIO implementation introduces a Python/C++ dependency surface that is unnecessary for the core contract. This avoids supply-chain/runtime complexity and lock-in while preserving conceptual compatibility.

A later interchange adapter may translate MediaProject v2 to/from OTIO after a separate dependency/security/license review. The native MediaProject contract remains authoritative for CAPITAL-AI business and trust invariants.

Primary upstream references reviewed for MC-1:

- OpenTimelineIO documentation: https://opentimelineio.readthedocs.io/
- OpenTimelineIO repository/license: https://github.com/AcademySoftwareFoundation/OpenTimelineIO
- JSON Schema Draft 2020-12: https://json-schema.org/draft/2020-12

## Security and data-integrity impact

- no new network capability;
- no arbitrary remote media URL acceptance;
- no publishing authority;
- no OAuth/token/secret handling;
- no Supabase, Render, Stripe, storage or database mutation;
- bounded collection sizes and project duration;
- bounded canvas dimensions and text fields;
- unique IDs and referential-integrity checks;
- deterministic frame timebase;
- deterministic brand-critical text and chart labels;
- legacy conversion is deterministic and content-preserving;
- invalid graph/timeline/reference states fail closed before renderer integration.

MC-1 adds a domain contract and validation boundary only. Existing `mediaUrl` validation and hash-bound Human Approval remain authoritative for the existing publishing path.

## Consequences

### Positive

- one canonical project model for future Studio, motion, audio, rendering and asset-registry work;
- legacy ADR-0094 content can migrate without a flag day;
- deterministic serialized contract suitable for versioning, hashing and approval binding;
- renderer/provider implementations remain replaceable;
- future OTIO interoperability remains possible without making it a trust root or core dependency.

### Trade-offs

- renderer v1 does not yet consume MediaProject v2 directly;
- MC-1 intentionally does not implement keyframes, effect parameter schemas or a UI;
- same-track overlap is forbidden in v2.0.0; sophisticated compositing uses separate tracks;
- additional layer/effect types require explicit schema/contract version evolution.

## Definition of Done

1. `MediaProjectV2` and its typed tracks/layers/assets/transitions/render recipe exist.
2. Timeline uses rational rate + integer frames.
3. Structural JSON Schema is Draft 2020-12 and fixes `schemaVersion` to `2.0.0`.
4. Semantic validation fails closed on invalid identities, bounds, references, overlap and transitions.
5. Remote/dangerous asset/source references are denied.
6. `publishReady=true` is impossible to validate.
7. Brand token source and deterministic text contract are fixed.
8. Legacy manifest v1 adapts deterministically to a valid MediaProject.
9. Graham Fair Value compatibility is covered by unit tests.
10. Existing SocialMediaEngine publishing/OAuth behavior is unchanged.
11. No new runtime dependency is introduced.
12. Main/parallel-PR correlation is repeated immediately before PR creation.
13. Merge remains Human/Owner-only.

## Rollback

Repository-only rollback: Human-gated revert of the MC-1 PR. No database, asset-storage, provider, deployment or publishing rollback is required because MC-1 introduces no external mutation.
