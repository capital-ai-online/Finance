# CAPITAL-AI Social Media Roadmap

**Project ID:** `CAPITAL-AI-SOCIAL`  
**Document role:** roadmap / non-authorizing domain projection  
**Status:** `ACTIVE — CANONICAL SOCIAL DOMAIN ROADMAP`  
**Version:** 2.4.0  
**Date:** 2026-09-14  
**Primary Project Value Chain ownership:** `[]`  
**Trust root:** `/AGENTS.md`  
**Current-main correlation snapshot:** `main@963628af2804d47b1e9a55072a3d6dc5ef98f239`

## Purpose

Social owns channel-specific content packaging, adaptation, publishing preparation, evidence and performance assessment. It owns no productive PVC stage and does not create publishing, Security, Compliance, Quality, merge or production authority.

This version reconciles the currently available Owner work and the Social execution queue against repository evidence on the current-main correlation snapshot. A chat artifact, generated image/audio/video, historical branch or older report is not treated as implemented repository state unless current `main` contains matching code, contract, test or evidence.

## Human-readable workflow

```text
source content / communication intent
→ Social Roadmap
→ applicable ADR / ESS / content contract
→ Social-owned implementation / tests / evidence
→ protected external publication only through the owning authorized execution path
```

Where productive work belongs to another project, resolve the affected PVC / Primary Owner and use that project's Roadmap instead of a post-PVC handoff-policy overlay.

## Social value chain

```text
Canonical Source Content
→ Campaign / Communication Intent
→ Social Content Package
→ Channel Adaptation
→ Compliance / Policy Check
→ Publishing Approval
→ Publishing Preparation
→ Provider execution by authorized owner
→ Publication Evidence
→ Performance Evidence
→ Finding / Drift
→ Optimization
```

## Core invariants

- content generation is not publishing approval;
- provider adapter is not publishing authority;
- no autonomous external publication;
- no credentials in roadmap/evidence;
- no fabricated engagement metrics;
- financial statements remain evidence-bound;
- changed content requires fresh approval where approval is required;
- no duplicate generator, provider adapter or publishing path;
- generated chat assets are not repository evidence until they are intentionally materialized and validated;
- current Git evidence uses `main SHA`, `branch head SHA`, `PR head SHA` and `merge SHA`.

## Current authority and evidence boundary

| Artifact | Current role in this roadmap |
|---|---|
| `/AGENTS.md` | repository trust root and lifecycle authority |
| `docs/projects/README.md` + `docs/projects/PROJECT_VALUE_CHAIN.md` | canonical project/PVC mapping; Social is cross-cutting with no productive PVC |
| `docs/adr/ADR-0026-social-media-direct-publishing-real-integration.md` | `ACCEPTED`; current publishing/OAuth integration authority and content-generation integration boundary |
| `contracts/SOCIAL_CONTENT_PACKAGE_CONTRACT.md` | canonical Social content-package target contract; its older implementation-status prose is superseded for execution planning by the verified current-main runtime/tests below |
| `server/socialMedia/socialContentPackage.ts` + `tests/unit/socialContentPackage.test.ts` | implemented deterministic canonical package mapping with provenance/disclosure fail-closed behavior |
| `src/routes/socialMediaRoutes.ts` + `tests/unit/socialContentApprovalMetadata.test.ts` | `/generate` runtime integration plus approval-hash binding for canonical package/source/disclosure/link/referral metadata |
| `contracts/SOCIAL_TTS_VOICE_CONTRACT.md` | provider-neutral TTS/voice contract; merged on current `main`, no provider/model-host authority |
| `server/socialMedia/voiceContract.ts` + `tests/unit/socialVoiceContract.test.ts` | implemented request/result validation, multilingual voice-profile semantics and fail-closed tests for SOCIAL-P1 |
| `reports/SOCIAL_P1_TTS_BENCHMARK_2026-09-11.md` | adapter selection + benchmark method; acoustic runtime benchmark explicitly `NOT RUN` |
| `work-packages/SOCIAL_WORK_PACKAGES.md` | detailed Social work-package disposition; older status rows are evidence inputs, not stronger than current-main code/tests |
| `docs/adr/ADR-0098-media-project-v2-timeline-contract.md` | `PROPOSED`; design input only, not implementation authority |
| `docs/architecture/AUTONOMOUS_CONTENT_ENGINE_ARCHITECTURE.md` | `DRAFT — IMPLEMENTATION NOT AUTHORIZED`; advisory architecture input only |
| `docs/governance/MARKETING_AGENT_ROADMAP_EXECUTION_POLICY.md` | `DRAFT / NOT ACTIVE`; does not authorize autonomous repository or publishing mutation |

## Status semantics

- `MAIN_IMPLEMENTED` — current `main` contains direct implementation plus relevant test/evidence.
- `PARTIAL` — useful implementation exists but the requested end-to-end capability or canonical contract is incomplete.
- `OPEN` — no sufficient current-main implementation evidence was found for the requested capability.
- `OWNER_ROUTED` — the request materially belongs to another canonical project owner; Social may specify/consume the dependency but does not implement across that ownership boundary.
- `EVIDENCE_GAP` — an artifact/result may have existed in chat or a historical branch, but current repository evidence is insufficient to claim completion.

## Current-main chat consolidation — reconciled 2026-09-14

| ID | Consolidated Owner request | Current-main status | Evidence / finding | Roadmap disposition |
|---|---|---|---|---|
| `SOC-CHAT-01` | Marketing emoji semantics including 🚀 for Aufwind/Hype/bullish patterns, 🏦 Governance/Geschäftsführer, 🔐 MFA/Security, 🥳, 💯, 💥, 🍀🪽🍀 and a CAPITAL-AI brand emoji | `MAIN_IMPLEMENTED` | `server/socialMedia/marketingEmojiLexicon.ts`; consumed by `server/socialMedia/scriptTemplates.ts`; covered by `tests/unit/scriptTemplates.test.ts` | keep under `SOCIAL-02`; no parallel emoji engine |
| `SOC-CHAT-02` | Platform-specific description/character limits for LinkedIn, X, Instagram, TikTok, YouTube and Facebook | `MAIN_IMPLEMENTED` | `server/socialMedia/platformCharacterLimits.ts`; enforced by script templates; `tests/unit/platformCharacterLimits.test.ts` verifies generated defaults | maintain one central limit registry and re-verify provider drift under `SOCIAL-06` |
| `SOC-CHAT-03` | Final platform-ready title/description/hashtags/support/legal package including No-Demo-Data messaging, website and Kraken referral/disclosure | `PARTIAL` | canonical package runtime now models source/provenance, links, disclosures, referral metadata, deterministic package/content identity and approval metadata binding; applicability/content of a concrete referral or legal disclosure still requires its authoritative source and applicable Compliance decision | structural `SOCIAL-P0` runtime is complete; keep concrete referral/disclosure applicability under `SOCIAL-03`/COMP rather than creating a second template path |
| `SOC-CHAT-04` | Short marketing video around 20 seconds using repository assets, prompts and voice-over; preserve/restore original images and remove unintended AIF branding where sourced from the repository | `PARTIAL` / `EVIDENCE_GAP` | deterministic short-renderer evidence exists, but the current Social runtime has no end-to-end TTS/audio adapter integration and no current Social source inventory proves the requested original-image/AIF-logo cleanup | keep under `SOCIAL-P2`; require validated source assets, immutable hashes, brand/logo validation and a real `TtsSynthesisResult` before integration |
| `SOC-CHAT-05` | Evaluate and implement high-quality TTS/voice-over with Qwen and Chatterbox, compare against stronger suitable OSS options and a paid reference package, including real listening samples | `PARTIAL` | provider-neutral TTS contract, `server/socialMedia/voiceContract.ts`, unit tests, sample manifest and benchmark decision are merged; Qwen3-TTS VoiceDesign is selected primary and Chatterbox Multilingual V3 fallback, but acoustic runtime/listening/latency/audio-hash evidence is explicitly `NOT RUN` | Social-owned P1 contract/code/selection work is implemented; protected runtime/model provisioning and acoustic benchmark evidence remain owner-routed before P2 can consume real audio |
| `SOC-CHAT-06` | Multilingual podcasts with multiple speakers and flexible voice assignment | `PARTIAL` | `voiceContract.ts` implements an extensible language registry, required `de-DE`/`en-US`/`en-GB`, multi-speaker assignment and tests; no synthesized podcast-audio path is current-main proven | preserve provider-neutral contract; real synthesis remains dependent on authorized runtime evidence |
| `SOC-CHAT-07` | Stable voice personas: creative/frech female marketing voice, realistic male IT-architecture voice, with domain-skill attachment and reproducible samples/weights | `PARTIAL` | current `VoiceProfile` contract now models stable roles, designed/preset/cloned/reference modes and fail-closed license/consent evidence; tests contain marketing-host and IT-architect designed profiles; no acoustic model binding, generated samples, model weights or listening evidence is present | voice-profile semantics are implemented; model/runtime artifacts and acoustic sample evidence remain protected-runtime dependencies |
| `SOC-CHAT-08` | Social Media Kit UI/mockups, image replacement and frontend visual presentation | `OWNER_ROUTED` | product UI implementation is explicitly outside Social ownership | `CAPITAL-AI-FE` owns product/UI implementation; Social supplies approved copy/media requirements only |
| `SOC-CHAT-09` | LinkedIn/social PDF/report presentation derived from Social content | `OWNER_ROUTED` / `PARTIAL` | Social can own channel adaptation/copy, but canonical document/PDF implementation belongs to Documentary; chat-generated PDFs alone are not repository completion evidence | route PDF renderer/document implementation to `CAPITAL-AI-DOC / PVC-03`; retain Social distribution package requirements here |

### Consolidated findings

1. **Emoji mapping and platform character-limit work are complete on current `main`.** They should be maintained and drift-tested, not reimplemented.
2. **SOCIAL-P0 is implemented on current `main` according to its defined exit gate.** The deterministic package schema/runtime mapping, required provenance/disclosure fail-closed behavior, `/generate` integration and approval-metadata hash binding are present with targeted tests. Publication/analytics evidence completeness remains separate `SOCIAL-P3` work.
3. **SOCIAL-P1 is materially further along than the previous roadmap snapshot stated.** Provider-neutral TTS request/result code, voice-profile semantics, tests, sample manifest and adapter-selection benchmark are merged on current `main`.
4. **Acoustic TTS runtime evidence is still open.** Qwen3-TTS and Chatterbox have no repository-proven generated audio, listening review, measured latency or output hashes; the benchmark report correctly marks these `NOT RUN` pending protected runtime/model provisioning.
5. **Multilingual/multi-speaker contract support now exists beyond a simple `de | en` template flag.** The current TTS contract requires `de-DE`, `en-US`, `en-GB` and supports explicit registry extension, but no real synthesized podcast/audio path is proven.
6. **Repository model weights and listening samples must not be inferred from contract code or chat generation.** Operational model weights remain licensed/checksummed artifacts provisioned by the applicable protected runtime owner.
7. **Frontend mockups and product visual changes are not Social-owned implementation work.** Social may define content/media requirements; `CAPITAL-AI-FE` owns the product surface.

## External boundaries

| Domain | Owner | Social relationship |
|---|---|---|
| Canonical content/provenance | `CAPITAL-AI-DOC / PVC-03` | consume traceable source content and route canonical document/PDF implementation |
| Frontend/product UI | `CAPITAL-AI-FE` | consume Social requirements; FE owns Social Media Kit/product presentation changes |
| Security | `CAPITAL-AI-SEC` | independent Security requirements/findings/verification |
| Compliance | `CAPITAL-AI-COMP` | independent applicability/compliance assessment, including advertising/referral disclosure where applicable |
| Quality | `CAPITAL-AI-QM` | independent assessment where applicable |
| Protected model/provider/runtime execution | `CAPITAL-AI-OPS` where operational infrastructure/provider execution is required | Social owns provider-neutral media requirements/contracts; OPS owns protected operational execution/provisioning |
| Protected external publication | owning authorized project, commonly OPS for operational publication | Social prepares evidence/payload; does not self-authorize |

## Workstreams

### SOCIAL-01 — Content package contract
**State:** `MAIN_IMPLEMENTED — P0 EXIT GATE SATISFIED`

One canonical Social content package carries source/provenance, channel, copy/media requirements, disclosures, links/referral metadata, approval/publish status and immutable content identity. `POST /api/social-media/generate` returns this package by reusing the existing text generator; approval hashing binds package/source/disclosure/link/referral metadata and rejects material drift.

Concrete legal/referral wording and applicability still consume the applicable Compliance/source authority; this does not reopen the package runtime implementation.

### SOCIAL-02 — Channel adaptation
**State:** `PARTIAL — TEXT + TTS CONTRACT ADAPTATION IMPLEMENTED / MEDIA RUNTIME EXTENSION OPEN`

Adapt content to provider/channel constraints without altering canonical financial meaning or fabricating platform capabilities.

Current-main completed slices include marketing emoji semantics, central platform character limits, multilingual TTS language/profile semantics and multi-speaker assignment. Remaining Social-owned adaptation includes media-format requirements and disclosure-preserving media integration; actual TTS/provider execution remains outside Social authority.

### SOCIAL-03 — Security / Compliance / Quality consumption
**State:** `ACTIVE — DEPENDENCY-BOUND`

Consume requirements and findings from the independent cross-cutting domains. Social implements only Social-owned remediation and returns evidence.

Advertising/referral language, AI-content disclosure and financial-marketing claims remain subject to the applicable Compliance/Security/Quality gates; Social does not self-certify them.

### SOCIAL-04 — Publishing preparation
**State:** `PARTIAL / NON-AUTHORIZING`

Prepare provider-compatible payloads and immutable content identity. Preparation never grants publication authority.

Current publishing/OAuth capability is real, but media rendering/TTS must join through existing package, approval, asset-validation and publishing boundaries. Third-party renderer/TTS publishing features remain outside Social authority.

### SOCIAL-05 — Publication and performance evidence
**State:** `PARTIAL — PUBLISH EVIDENCE EXISTS / ANALYTICS GAP`

Retain provider publication identity, timestamp, content identity and observable performance evidence without fabricating metrics or treating provider analytics as repository authority.

Publication logging exists; canonical analytics consumption with source, metric definition and measurement-window provenance remains open.

### SOCIAL-06 — Drift / optimization
**State:** `DOCUMENTED / IMPLEMENTATION OPEN`

Detect stale copy, policy drift, provider-contract drift, platform-limit drift, referral/disclosure drift, model/provider drift and evidence gaps. Optimization follows the same Roadmap/ADR/ESS and approval boundaries as initial work.

## Prioritized execution queue

### `SOCIAL-P0` — Canonical content-package completion
**State:** `MAIN_IMPLEMENTED — EXIT GATE SATISFIED`

**Verified current-main evidence:** `server/socialMedia/socialContentPackage.ts`; `tests/unit/socialContentPackage.test.ts`; `/api/social-media/generate` integration in `src/routes/socialMediaRoutes.ts`; approval metadata/hash binding in `server/socialMedia/contentApproval.ts`; negative coverage in `tests/unit/socialContentApprovalMetadata.test.ts`.

**Exit gate result:** package schema/types + compatibility mapping + targeted tests prove required identity/provenance fields and fail-closed behavior for missing mandatory provenance/disclosure identity. No second generator/publisher path was introduced.

### `SOCIAL-P1` — TTS / multilingual voice contract and benchmark
**State:** `PARTIAL — CONTRACT/CODE/TESTS/ADAPTER DECISION COMPLETE; ACOUSTIC RUNTIME NOT RUN`

**Completed on current main:** provider-neutral request/result contract; voice-profile semantics; multilingual registry; multi-speaker assignment; immutable request/result evidence validation; fail-closed unit tests; sample manifest; benchmark method; primary Qwen3-TTS VoiceDesign and fallback Chatterbox Multilingual V3 selection.

**Remaining scope:** authorized acoustic/runtime benchmark using exact licensed model/provider artifacts, real output hashes, listening/transcript evidence, measured latency/throughput and failure behavior.

**Ownership boundary:** Social owns requirements, provider-neutral contracts, voice roles, fixtures and benchmark acceptance semantics. Operational model-weight/service provisioning and protected runtime execution remain routed to the applicable owner, commonly `CAPITAL-AI-OPS`.

**Exit gate:** reproducible real-audio benchmark evidence + exact artifact-license inventory + output hashes + Social acceptance decision; no autonomous publication and no secret/model-host authority added.

### `SOCIAL-P2` — Short-video + voice-over integration
**State:** `BLOCKED — REQUIRES VALIDATED SOCIAL-P1 RUNTIME RESULT`

**Scope:** connect approved script + validated assets + selected TTS output to the existing deterministic short renderer and asset/publishing preparation boundary. Preserve original source assets, brand validation, hashes, duration metadata and explicit `publishReady=false` until existing approval/execution gates are satisfied.

**Exit gate:** deterministic approximately-20-second fixture render with exact input/asset hashes, voice manifest, brand/logo validation, negative tests, and no direct publishing side effect. Productive FFmpeg licensing/build profile must be independently acceptable before production use.

### `SOCIAL-P3` — Publication/analytics evidence completion
**State:** `NOW — HIGHEST-PRIORITY SOCIAL-OWNED UNBLOCKED FOLLOW-UP`

**Scope:** complete publication evidence correlation and canonical analytics consumption without fabricated metrics. Preserve content/package/approval/provider-post correlation and source/metric/window provenance; do not treat provider analytics as repository authority.

**Exit gate:** provider post identity + content/package/asset/approval correlation + canonical metric source/window provenance + repeatable drift checks.

## Security compatibility artifact

`handoffs/CAPITAL_AI_SEC_CROSS_PROJECT_HANDOFF.yaml` is historical/non-authorizing compatibility metadata. Current Security-related work is represented in the relevant project Roadmap and independently verified by CAPITAL-AI-SEC.

## Definition of Done

A Social work item is complete when:

- Social ownership is explicit and no productive PVC ownership is invented;
- applicable source/content/ADR/ESS contracts are identified;
- current-main implementation evidence is present; chat-only or historical artifacts are not promoted to implemented state;
- required Security/Compliance/Quality findings are addressed where applicable;
- implementation/tests/evidence are bound to the final PR head;
- no autonomous publishing or hidden provider authority is introduced;
- provider/model artifacts are licensed, checksummed and provisioned through the applicable owner boundary rather than assumed from local/chat state;
- Human/CODEOWNER performs repository merge;
- protected external publication follows its separately authorized execution path.
