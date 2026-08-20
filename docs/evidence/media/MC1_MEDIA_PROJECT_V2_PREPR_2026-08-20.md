# MC-1 MediaProject v2 — Pre-PR Evidence 2026-08-20

- **Status:** PRE-PR TARGETED VALIDATION PASS
- **Authority:** Owner chat priority 2026-08-20 + ADR-0098 + ADR-0094
- **Branch:** `feature/media-creation-mc1-media-project-v2`
- **Initial / current main:** `6b61c63a8d66b933c824b698d81ea242e202cb47`

## Scope verification

Current branch diff against `main` contains only MC-1 files:

- `src/platform/SocialMediaEngine/Contracts/MediaProject.ts`;
- `src/platform/SocialMediaEngine/Contracts/MediaProjectValidation.ts`;
- `src/platform/SocialMediaEngine/Contracts/media-project-v2.schema.json`;
- `src/platform/SocialMediaEngine/Rendering/LegacyMediaRenderManifestAdapter.ts`;
- `src/platform/SocialMediaEngine/index.ts`;
- `tests/unit/mediaProjectV2.test.ts`;
- ADR-0098;
- ADR/Authority registry metadata;
- MC-1 Work Package;
- this evidence file.

No `package.json`, lockfile, GitHub workflow, deployment, database, Supabase, Render, Stripe, OAuth, publisher or media-renderer implementation file is changed.

## Targeted TypeScript compile

A local isolated no-emit compile was executed with the repository TypeScript major/minor (`tsc 5.8.3`) against the exact MC-1 contract shapes and module relationships:

- target: ES2022;
- module: ESNext;
- module resolution: bundler;
- no emit;
- result after fixes: **PASS**.

The first compile correctly exposed two implementation defects before PR creation:

1. `maxChars` default inferred as literal `4000` due `as const`;
2. `input.durationFrames` property narrowing was not preserved for arithmetic.

Both were fixed by explicitly typing `maxChars: number` and binding `projectDurationFrames` before the type guard.

## Targeted runtime/semantic smoke

The legacy Graham Fair Value manifest shape was passed through the MC-1 adapter and semantic validator in an isolated compiled smoke.

Result:

```json
{
  "ok": true,
  "durationFrames": 1380,
  "layers": 6,
  "negativeChecks": [
    "publish_ready_forbidden",
    "asset_reference_invalid",
    "track_layer_overlap"
  ]
}
```

Verified properties:

- six legacy scenes preserved in order;
- 46 seconds at 30 fps -> 1380 integer frames;
- MediaProject validation PASS;
- `publishReady=true` -> DENY;
- URI-scheme asset reference (`ssh://...`) -> DENY;
- same-track overlap -> DENY.

The repository unit test additionally covers the checked-in Graham manifest, deterministic repeat conversion, edge disclaimers, dangling transition denial and JSON Schema contract markers.

## Security hardening during pre-PR review

Reference validation was generalized from a protocol blocklist to denial of **any URI scheme**. The MediaProject input boundary therefore refuses values such as HTTP(S), file/data/FTP/gopher/SSH-style URI references as well as absolute and traversal paths.

Opaque Asset Registry identifiers remain possible when represented as non-URI identifiers/keys. Any future resolver remains responsible for its own authorization, integrity and delivery controls.

## OSS / standards review

- OpenTimelineIO was reviewed as an editorial interchange/reference architecture. It models timelines, tracks, clips, transitions, timing and metadata while referencing media externally.
- Apache-2.0 licensing and project maturity are suitable for future interoperability.
- MC-1 deliberately does **not** add OTIO as a runtime dependency because the CAPITAL-AI domain/UI stack is TypeScript and direct OTIO use would add unnecessary Python/C++ dependency/toolchain surface.
- JSON Schema Draft 2020-12 is used for the serialized structural contract; semantic graph/business invariants remain in the TypeScript validator.

Primary references:

- https://github.com/AcademySoftwareFoundation/OpenTimelineIO
- https://opentimelineio.readthedocs.io/
- https://json-schema.org/draft/2020-12

## Main / parallel-work correlation

Pre-PR observation at the time of this evidence:

- current `main`: `6b61c63a8d66b933c824b698d81ea242e202cb47`;
- branch merge-base: exact current main;
- branch behind: `0`;
- open pull requests: none;
- ADR-0098 namespace: no competing repository/open-PR result found before allocation.

A final current-main/open-PR correlation must still be repeated immediately before PR creation. If main advances, the branch must be synchronized and relevant targeted checks repeated before the PR is opened.

## Deferred to post-PR repository CI

The connector execution environment does not contain a full authenticated repository checkout, so the authoritative repository-wide checks remain the normal post-PR GitHub checks after the mandatory final main-sync:

- repository TypeScript/lint;
- targeted/full unit suite per classifier;
- Governance Control Plane validation;
- Documentation/Quality validators;
- production build only if required by the repository classifier;
- final `build-and-test`.

No costly GitHub CI was triggered before PR creation.
