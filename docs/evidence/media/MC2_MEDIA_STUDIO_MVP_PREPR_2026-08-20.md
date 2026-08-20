# MC-2 Media Studio MVP — Pre-PR Evidence 2026-08-20

## Scope

Branch: `feature/media-creation-mc2-media-studio-mvp`

Initial base:

`main@cb07abdeb871c1c7ba682fecfa91faa4a8de852e`

This base is the Human Merge commit of PR #461 (`MC-1 MediaProject v2 Contract`).

## Traceability

- Owner/Chat priority 2026-08-20: after merging PR #461, open a new branch, implement the next code/document work and create a PR.
- ADR-0098: `MediaProjectV2` is the canonical provider-neutral editable/renderable contract and carries no publish authority.
- `docs/frontend/FRONTEND_ARCH.md`: new domain UI belongs under `src/features/<domain>/ui`; app composition may consume feature slices; Platform must not depend on React UI.
- MC-2 work package: `docs/roadmaps/work-packages/MC-2_MEDIA_STUDIO_MVP.md`.

## Implemented files — code

- `src/platform/SocialMediaEngine/Editing/MediaProjectEditing.ts`
- `src/platform/SocialMediaEngine/Editing/MediaStudioTemplates.ts`
- `src/features/social/ui/MediaStudio/MediaStudio.tsx`
- `src/features/social/ui/MediaStudio/MediaStudioPreview.tsx`
- `src/features/social/ui/MediaStudio/MediaStudioTimeline.tsx`
- `src/features/social/ui/MediaStudio/MediaStudioInspector.tsx`
- `src/features/social/ui/MediaStudio/index.ts`
- `src/features/social/ui/index.ts`
- `src/platform/SocialMediaEngine/index.ts`
- `src/app/routing/AppRoutes.tsx`
- `tests/unit/mediaStudioEditing.test.ts`

No `package.json`, lockfile, workflow, Docker, server route, Supabase, Render, Stripe, OAuth-provider or publishing file is changed by the implementation commit.

## Pre-implementation correlation

At branch creation:

- PR #461: merged and present on `main`.
- current `main`: `cb07abdeb871c1c7ba682fecfa91faa4a8de852e`.
- open PR #463: Frontend Authority / ADR-0096 Governance correlation.
- PR #463 is a parallel writer for frontend-governance/registry documentation, not for the MC-2 runtime files.
- To minimize collision, MC-2 does not create/modify ADR Registry, Authority Registry, Document Registry or normative `FRONTEND_ARCH.md`.

## Make-or-Buy / reuse decision

Reused:

- React 19;
- Tailwind 4;
- existing Motion/frontend stack without adding a new animation/editor library;
- Shared `Button`, `Card`, `Input`, `StatusBadge`;
- `SocialMediaGeneratorService.checkAccess()`;
- `MediaProjectV2` and `validateMediaProjectV2()`;
- existing design-token classes.

Not added:

- OpenTimelineIO runtime dependency;
- React timeline editor dependency;
- Remotion;
- DesignCombo;
- new renderer/codec library.

Rationale: MC-2 requires a thin editor projection of the already-owned MediaProject contract. A second timeline domain model would increase adapters, dependency surface and lock-in without reducing implementation risk.

## Security verification

### Access

The `/media-studio` route requires an authenticated `userSession`. The Studio then consumes the existing SocialMedia access check and fails closed on denied/unverifiable access.

### Import

- local file only;
- max 1.000.000 bytes;
- `JSON.parse` then `validateMediaProjectV2()` before commit;
- invalid input remains outside editor state;
- existing ADR-0098 validator blocks URI schemes, absolute paths, traversal and `publishReady=true`.

### Edit operations

Every editing command clones the source project and validates the complete edited project before returning success. Invalid changes return structured errors and do not mutate the source project.

### Publishing

No publish method is imported or called by Media Studio. Default render recipe has:

- `networkPolicy: offline`;
- `brandTextMode: deterministic`;
- `publishReady: false`.

## Accessibility verification

- no drag gesture is required to move or resize layers;
- start/duration can be entered numerically;
- move buttons provide ±1 frame / ±1 second;
- resize buttons provide ±1 second;
- timeline layers are semantic buttons;
- playhead uses native `input[type=range]`;
- `aria-pressed`, `aria-label`, status roles and shared focus styles are used;
- Space/Ctrl-Z/Ctrl-Y shortcuts ignore focused text inputs/textarea.

## Local / low-cost checks before PR

A targeted TypeScript 5.8.3 compile was executed locally against the new MC-2 files using repository-compatible TypeScript compiler options and local declaration stubs for React/lucide/shared/repository imports.

Result: **PASS** after fixing pre-commit type issues (union narrowing and missing icon import).

Command class:

`tsc --noEmit --target ES2022 --module ESNext --moduleResolution bundler --isolatedModules --jsx react-jsx ...`

Additional targeted AppRoutes compile with component/session stubs: **PASS**.

This is intentionally not claimed as the repository's full authoritative TypeScript/build test; Hosted CI after PR remains authoritative.

## Branch diff after implementation commit

Initial implementation compare:

- `ahead_by=1`
- `behind_by=0`
- merge base = `main@cb07abdeb871c1c7ba682fecfa91faa4a8de852e`
- 11 code/test files
- no dependency/workflow/deployment file

## Negative unit coverage added

`tests/unit/mediaStudioEditing.test.ts` covers:

1. deterministic valid draft factory;
2. immutable canvas preset change;
3. deterministic scene text editing;
4. DENY when resize exceeds project duration;
5. DENY when move would create a negative start frame.

Existing MediaProject unit tests continue to own duplicate IDs, overlap, remote asset references, publishReady DENY and invalid transitions.

## Documentation decision

No new ADR is introduced. MC-2 is an implementation of ADR-0098 plus the canonical Frontend Architecture rather than a new architecture/trust-boundary decision. The work package and runbook describe implementation and operation without creating a competing Authority.

## Mandatory final gate before PR

Before creating the PR the following must be repeated:

- load current `main`;
- inspect new commits since `cb07abde...`;
- re-check PR #463 disposition and file/architecture correlation;
- sync branch with current `main` if required;
- re-check final diff and scope;
- update this evidence if the final sync changes the baseline;
- only then create PR and allow Hosted CI/Governance to run.
