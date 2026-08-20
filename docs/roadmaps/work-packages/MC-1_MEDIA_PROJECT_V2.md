# MC-1 — MediaProject v2

- **Status:** IMPLEMENTATION COMPLETE / PRE-PR VALIDATION PENDING
- **Date:** 2026-08-20
- **Owner:** CAPITAL-AI Owner
- **Authority:** Owner chat priority 2026-08-20 + ADR-0098 + ADR-0094 + ARCH-CONTENT-0001
- **Branch:** `feature/media-creation-mc1-media-project-v2`
- **Base:** `main@6b61c63a8d66b933c824b698d81ea242e202cb47`

## Goal

Introduce one canonical, versioned, provider-neutral media project/timeline contract before adding Media Studio UI, motion features, TTS, generative providers, asset storage or render workers.

The slice must preserve the existing SocialMediaEngine publishing/OAuth authority and the ADR-0094 deterministic rendering/security boundary.

## P1 — Canonical project model

- [x] `MediaProjectV2` schema version `2.0.0`;
- [x] rational frame-rate timebase;
- [x] integer frame ranges/durations;
- [x] bounded canvas dimensions and aspect-ratio contract;
- [x] typed video/graphics/text/chart/audio/caption tracks;
- [x] typed scene/text/shape/image/chart/audio/caption layers;
- [x] asset references, transitions, source, disclosure and JSON metadata;
- [x] deterministic RenderRecipe with canonical design-token source;
- [x] `publishReady=false` as a contract invariant.

## P2 — Semantic validation

- [x] project/schema/ID/slug/rate/canvas bounds;
- [x] bounded project duration and collection sizes;
- [x] unique track/layer/asset/transition identities;
- [x] track/layer compatibility;
- [x] project-range checks;
- [x] same-track overlap DENY;
- [x] asset-reference integrity and media-kind matching;
- [x] transition existence/same-track/adjacency validation;
- [x] deterministic chart-label requirement;
- [x] dangerous/remote source/asset reference DENY;
- [x] traversal/absolute-path DENY;
- [x] `publishReady=true` DENY.

## P3 — Legacy manifest compatibility

- [x] explicit adapter for ADR-0094 render manifest v1 (`schemaVersion: 1.0.0`);
- [x] existing 8-scene / 5–60 second / 1–20 second-per-scene constraints retained;
- [x] scene text/order/disclaimer preserved;
- [x] deterministic IDs and frame offsets;
- [x] no timestamps/random IDs/network access;
- [x] Graham Fair Value manifest as golden migration fixture;
- [x] resulting project validates through the MediaProject v2 validator.

## P4 — Serialized schema and tests

- [x] JSON Schema Draft 2020-12 structural schema;
- [x] schema fixes `schemaVersion` to `2.0.0`;
- [x] schema fixes canonical brand-token source and `publishReady=false`;
- [x] positive deterministic Graham migration test;
- [x] duplicate-ID/overlap negative test;
- [x] remote-asset-reference negative test;
- [x] publish-authority negative test;
- [x] dangling-transition negative test;
- [x] schema contract test.

## Open-source / make-or-buy review

| Candidate | Functional fit | Maintainer/activity | Security / dependency surface | License | Enterprise / lock-in | Decision |
|---|---|---|---|---|---|---|
| Existing repository TypeScript contracts | Very high for domain authority and UI/server sharing | Repository-native | Minimal; no new dependency | repository | Best architecture compatibility | **Use as canonical contract** |
| OpenTimelineIO | Very high for editorial interchange: timeline, tracks, clips, transitions, markers, metadata | Academy Software Foundation; mature and actively maintained | Adds Python/C++ runtime/toolchain if used directly | Apache-2.0 | Low format lock-in, but unnecessary runtime complexity for current TS stack | **Use as reference / future interchange adapter, not runtime dependency in MC-1** |
| Custom codec/media container | Poor fit; duplicates mature media tooling | Internal burden | High security/maintenance risk | N/A | High maintenance lock-in | **Reject** |
| New timeline SaaS/vendor SDK | Not required for domain contract | Vendor-dependent | External data/dependency boundary | varies | Higher lock-in | **Reject for MC-1** |

Reviewed primary sources:

- OpenTimelineIO docs/repository/license;
- JSON Schema Draft 2020-12;
- current CAPITAL-AI SocialMediaEngine contracts and ADR-0094 renderer.

## Security / data integrity

MC-1 introduces no external mutation and no new trust root.

Invariants:

1. MediaProject cannot publish or grant approval.
2. No OAuth/social tokens or infrastructure credentials enter the contract.
3. Arbitrary remote URLs are not trusted asset/source references.
4. Existing publishing `mediaUrl` validation remains separate and authoritative.
5. Existing hash-bound Human Approval remains separate and authoritative.
6. Financial/brand-critical text stays deterministic.
7. Timeline graph, IDs and asset references are validated before renderer integration.
8. Legacy migration is deterministic/content-preserving.
9. No database/storage/provider/deployment mutation occurs in this slice.

## Out of scope

- Media Studio UI / timeline editor;
- keyframes/effect parameter engine;
- renderer-v2 execution path;
- direct OTIO read/write integration;
- TTS/voice provider;
- generative image/video provider;
- Asset Registry/storage/delivery;
- background render workers;
- Social publishing changes;
- Supabase/Render/Stripe mutation.

## Pre-PR validation gate

Before PR creation:

- [ ] inspect complete branch diff and changed-file scope;
- [ ] TypeScript no-emit check or equivalent targeted compile;
- [ ] targeted MediaProject v2 unit/contract checks;
- [ ] parse JSON Schema and registry JSON;
- [ ] Governance Control Plane structural validation where locally available;
- [ ] verify no dependency/workflow/deployment files changed;
- [ ] re-fetch current `main` immediately before PR;
- [ ] correlate new Main changes across contracts, architecture, dependencies, APIs, security/governance and documentation;
- [ ] synchronize branch to exact current `main` if needed;
- [ ] repeat necessary targeted checks after synchronization.

## Definition of Done

MC-1 is complete only when P1–P4 pass targeted validation, the branch is current with `main`, ADR-0098/registries are consistent, PR checks pass and Human/Owner performs a separate merge decision.
