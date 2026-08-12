# CAPITAL-AI Marketing Agent Roadmap

Status: DRAFT — IMPLEMENTATION NOT AUTHORIZED
Date: 2026-08-12
Baseline: `main@3a733f2b6efeffb3013fbb2c558b5ef4c185125e`
Owner: SvenKulessa
Logical agent: `capital-ai-marketing-roadmap-executor`
Authority draft: ESS-0022 / ADR-0068

## Goal

Create a dedicated Marketing Roadmap Executor that can eventually execute bounded Owner-approved SEO, content-generation, media-rendering and marketing-distribution repository work without inheriting Systemadmin authority.

The target operating model is:

`Owner-approved Marketing Roadmap authority -> domain-limited Marketing Agent -> audited branch/commit/PR work -> Human review/merge -> later separately governed external publication`.

This roadmap is documentation-first. No mutating Marketing Agent capability is enabled by this file.

## Current repository evidence

- `SocialMediaGeneratorService.ts` already implements access/account/publish/history but explicitly lacks the generation methods and `/api/social-media/generate` implementation.
- `src/platform/SocialMediaEngine/types.ts` already contains questionnaire, storyboard, podcast-dialogue, marketing-pack and `mediaUrl` contracts that can be evolved rather than replaced.
- `server/socialMedia/platformPublishers.ts` already contains real platform publishers; YouTube/TikTok/Instagram depend on a real media asset URL.
- `docs/seo/SEO_MANAGEMENT_ROADMAP.md` already defines N1–N4 content generation, templates, media rendering and mandatory Owner approval as the 90-day mission block.
- ESS-0014 already separates Google Marketing read and controlled write planes.
- ESS-0019 defines provider-neutral Agent Control Plane rules.
- ESS-0021 and the SA Roadmap define the reusable execution-host/audit foundation.

## Dependency on the Systemadmin Agent Roadmap

The Marketing Agent may reuse verified SA infrastructure, but not SA authority.

Required reusable foundations before Marketing repository mutation can become autonomous:

1. attributable execution host;
2. provider-neutral agent subject identity;
3. permit-before-side-effect enforcement;
4. durable append-only audit reference before protected mutation;
5. correlated outcome evidence;
6. exact path/target/capability binding;
7. kill switch;
8. Human final review and Human-only merge;
9. fresh branch per work package and post-merge branch deletion.

If the SA Roadmap later changes these primitives, this roadmap must re-evaluate compatibility before enablement.

## MA0 — Concept / Governance Foundation

Status: IN PROGRESS

Deliverables:

- ESS-0022 Marketing Roadmap Executor;
- ADR-0068 Marketing Roadmap Executor and Controlled Content Automation Boundary;
- this roadmap;
- Marketing Agent execution policy;
- Autonomous Content Engine architecture;
- Marketing Agent traceability matrix;
- inactive machine-readable Marketing execution profile.

Exit criteria:

- all documents cross-reference existing ESS/ADR authorities;
- no conflicting ESS/ADR number exists;
- explicit Human/Owner review of the concept package;
- no runtime capability enabled;
- final documentation PR receives normal ADR-0039 PR creation authorization and Human merge.

## MA1 — Marketing Subject / Mandate Model

Status: BLOCKED BY MA0 HUMAN ACCEPTANCE

Goal: create a Marketing-specific authorization envelope without changing the Systemadmin subject into a generic wildcard.

Required work:

- Marketing mandate schema or a safely generalized REM schema with explicit subject profiles;
- `subjectAgentId = capital-ai-marketing-roadmap-executor`;
- exact Marketing path allowlist;
- exact capability list;
- max risk class;
- expiry and kill switch;
- maximum open Marketing PRs;
- overlap/shared-integration-zone rules;
- negative validator tests.

Initial capability state remains:

`READ, ANALYZE, PLAN`.

Repository mutation is still disabled.

Exit tests:

- wrong agent -> DENY;
- wrong path -> DENY;
- wrong repository -> DENY;
- expired/revoked mandate -> DENY;
- self-expansion -> DENY;
- missing capability -> DENY;
- shared integration resource without explicit scope -> STOP/DENY.

## MA2 — Content Intelligence Contracts

Status: BLOCKED BY MA1

Goal: implement the provider-neutral content domain before any autonomous publication.

Scope:

- `ContentPackage`;
- source/evidence references;
- platform variants;
- template registry;
- content lifecycle states;
- provider interfaces;
- `/api/social-media/generate` contract;
- reuse/evolution of existing `SocialMediaSeriesPackage` types.

Initial output:

- text posts;
- podcast scripts;
- short-video scripts/storyboards;
- thumbnails prompts;
- captions/hashtags/CTA.

No rendered video and no auto-publish required for MA2.

Exit criteria:

- strict TypeScript contracts;
- source-grounding tests;
- no fake quantitative finance data;
- provider swap does not change business contract;
- X/Facebook-compatible approved text package can be produced without publishing it.

## MA3 — Provenance / Compliance / Human Approval

Status: BLOCKED BY MA2

Goal: establish the trust plane before media automation.

Required components:

- AI authorship classification (`human`, `ai_assisted`, `ai_generated`);
- provider/model/template provenance;
- source digest/evidence references;
- financial-claim validator;
- compliance decision (`ALLOW`, `REVIEW_REQUIRED`, `DENY`);
- disclosure policy;
- hash-bound Human approval;
- approval invalidation on content/asset/platform changes;
- domain Event Mesh entries after collision check.

Production database/storage mutations remain a separate mutation gate.

Exit criteria:

- unsupported financial claim -> DENY;
- synthetic/unverified numerical claim -> DENY;
- incomplete provenance -> no publish;
- approval hash mismatch -> DENY;
- cross-tenant access -> DENY.

## MA4 — Media Rendering Plane

Status: BLOCKED BY MA3

Goal: add replaceable media workers without expanding trust.

Candidate adapters:

- FLUX-compatible image provider;
- optional image-edit provider;
- TTS provider registry;
- MoneyPrinterTurbo-compatible short-video sidecar;
- optional deterministic Remotion renderer for branded financial/learning videos.

Rules:

- external renderer receives only approved render inputs;
- no Social OAuth, GitHub, Stripe, Owner or Supabase privileged credentials in media workers;
- third-party publishing features in media workers are disabled/not used;
- assets are validated, hashed and stored through CAPITAL-AI-controlled storage/registry;
- arbitrary `mediaUrl` is not trusted.

Security tests:

- SSRF/private-network URL rejection;
- MIME/magic-byte/size validation;
- renderer outage -> honest failure;
- asset mutation after approval -> approval invalid;
- dependency/container provenance and vulnerability checks.

## MA5 — First Bounded Marketing Repository Execution Pilot

Status: BLOCKED BY MA4 + REQUIRED SA EXECUTION-HOST FOUNDATION VERIFIED PASS

Goal: prove that the Marketing logical subject can execute one non-production repository work package under its own mandate.

Pilot constraints:

- `SvenKulessa/Finance` / `main`;
- one Owner-approved Marketing mandate;
- one roadmap item;
- one fresh Marketing branch;
- max one open Marketing Agent PR;
- no external production mutation;
- no social publishing;
- explicit path allowlist;
- max HIGH risk only when specifically approved; prefer LOW/MEDIUM pilot;
- audit reference before BRANCH/COMMIT/PR side effects;
- Human final PR review;
- Human-only merge;
- branch deletion after merge.

Suggested first pilot:

`documentation or isolated ContentPackage contract/test work`, not OAuth, credentials, CI, deployment or production data.

Exit criteria:

- authorization event persisted before side effect;
- exact branch from current main;
- scoped commit/PR only;
- negative invalid-mandate probe causes zero side effect;
- terminal outcome evidence;
- Human merge and branch deletion evidence.

## MA6 — Controlled External Publishing Architecture

Status: BLOCKED BY MA5 + STRONG OWNER APPROVAL ARCHITECTURE

Goal: design, not automatically enable, bounded social-platform publication.

Required separate decision package:

- exact publication capability vocabulary;
- per-platform target binding;
- content/asset hash-bound approval;
- identity/credential holder model;
- idempotency and replay protection;
- provider rate-limit handling;
- scheduled publishing queue semantics;
- platform review/pending handling;
- post-publish verification;
- takedown/rollback procedure;
- audit/evidence retention;
- legal/compliance review for financial promotional content.

Default state remains:

`CONTENT_AUTO_PUBLISH_ENABLED=false`.

Human/Owner-approved publish remains the expected production model until a later ADR explicitly proves a safe autonomous class.

## MA7 — Analytics Feedback Loop

Status: BLOCKED BY MA6

Goal: close the marketing learning loop without giving analytics the right to self-publish.

Flow:

`publish evidence -> Search Console / GA4 / approved social metrics -> ContentPerformanceScore -> recommendation -> next content plan`.

The agent may automatically analyze and recommend. Publishing remains subject to the MA6 authority model.

Controls:

- avoid optimizing solely for engagement when it conflicts with factuality/compliance;
- preserve source/provenance lineage;
- detect metric manipulation/data-quality failures;
- separate experimentation from regulated/financial claims;
- retain Human override and kill switch.

## Shared Integration Zone

The following are high-conflict/shared resources and require explicit coordination rather than default Marketing ownership:

- `AGENTS.md`;
- root `package.json` and lock file;
- `.github/workflows/**`;
- global IAM/Security/Compliance controls;
- global Event Mesh registries;
- global Traceability registries;
- app/server bootstrap;
- deployment files;
- shared Supabase migrations;
- global version/release metadata.

For five-agent parallel development, shared-zone changes should use a single-writer lease/integration queue.

## Branch lifecycle

Every Marketing work package:

`current main -> fresh agent/marketing-* branch -> scoped work -> PR -> Human review/CI -> Human merge -> branch delete`.

No merged branch is reused.

## CI budget model

Marketing PRs follow the repository cost policy:

- docs-only fast path where applicable;
- targeted unit tests before expensive CI;
- provider adapters use mocked/contract tests by default;
- no full GPU/video render on every PR;
- one final expensive CI for the reviewed head;
- release/preproduction performs the real rendering integration evidence where required.

## Stop conditions

STOP immediately on:

- scope/mandate drift;
- unresolved shared-file conflict;
- audit persistence failure;
- request for self-elevation;
- missing financial source evidence;
- security/consent control regression;
- external production write without explicit authority;
- content approval mismatch;
- secret exposure;
- inability to verify rollback/postcondition.

## Next action after this draft

Complete MA0 documentation on a dedicated branch. Before opening its PR, perform the normal ADR-0039 current-main, open-PR overlap and scope/risk summary and obtain explicit Human authorization for that specific documentation PR.
