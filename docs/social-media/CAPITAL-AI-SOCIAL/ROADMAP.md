# CAPITAL-AI Social Media Roadmap

**Project ID:** `CAPITAL-AI-SOCIAL`  
**Document role:** roadmap / non-authorizing domain projection  
**Status:** `ACTIVE — CANONICAL SOCIAL DOMAIN ROADMAP`  
**Version:** 2.3.0  
**Date:** 2026-09-05  
**Primary Project Value Chain ownership:** `[]`  
**Trust root:** `/AGENTS.md`  
**Current-main correlation snapshot:** `main@691deee485a53ee53dadf4fbdbea89fefb7ccdb3`

## Purpose

Social owns channel-specific content packaging, adaptation, publishing preparation, evidence and performance assessment. It owns no productive PVC stage and does not create publishing, Security, Compliance, Quality, merge or production authority.

This version consolidates the currently available Owner chat work for Social against repository evidence on the current-main correlation snapshot. A chat artifact, generated image/audio/video, historical branch or older report is not treated as implemented repository state unless current `main` contains matching code, contract, test or evidence.

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
| `contracts/SOCIAL_CONTENT_PACKAGE_CONTRACT.md` | canonical Social content-package target contract; current runtime mapping is partial |
| `work-packages/SOCIAL_WORK_PACKAGES.md` | detailed Social work-package disposition |
| `docs/adr/ADR-0098-media-project-v2-timeline-contract.md` | `PROPOSED`; design input only, not implementation authority |
| `docs/architecture/AUTONOMOUS_CONTENT_ENGINE_ARCHITECTURE.md` | `DRAFT — IMPLEMENTATION NOT AUTHORIZED`; advisory architecture input only |
| `docs/governance/MARKETING_AGENT_ROADMAP_EXECUTION_POLICY.md` | `DRAFT / NOT ACTIVE`; does not authorize autonomous repository or publishing mutation |

## Status semantics

- `MAIN_IMPLEMENTED` — current `main` contains direct implementation plus relevant test/evidence.
- `PARTIAL` — useful implementation exists but the requested end-to-end capability or canonical contract is incomplete.
- `OPEN` — no sufficient current-main implementation evidence was found for the requested capability.
- `OWNER_ROUTED` — the request materially belongs to another canonical project owner; Social may specify/consume the dependency but does not implement across that ownership boundary.
- `EVIDENCE_GAP` — an artifact/result may have existed in chat or a historical branch, but current repository evidence is insufficient to claim completion.

## Current-main chat consolidation — 2026-09-05

| ID | Consolidated Owner request | Current-main status | Evidence / finding | Roadmap disposition |
|---|---|---|---|---|
| `SOC-CHAT-01` | Marketing emoji semantics including 🚀 for Aufwind/Hype/bullish patterns, 🏦 Governance/Geschäftsführer, 🔐 MFA/Security, 🥳, 💯, 💥, 🍀🪽🍀 and a CAPITAL-AI brand emoji | `MAIN_IMPLEMENTED` | `server/socialMedia/marketingEmojiLexicon.ts`; consumed by `server/socialMedia/scriptTemplates.ts`; covered by `tests/unit/scriptTemplates.test.ts` | keep under `SOCIAL-02`; no parallel emoji engine |
| `SOC-CHAT-02` | Platform-specific description/character limits for LinkedIn, X, Instagram, TikTok, YouTube and Facebook | `MAIN_IMPLEMENTED` | `server/socialMedia/platformCharacterLimits.ts`; enforced by script templates; `tests/unit/platformCharacterLimits.test.ts` verifies generated defaults | maintain one central limit registry and re-verify provider drift under `SOCIAL-06` |
| `SOC-CHAT-03` | Final platform-ready title/description/hashtags/support/legal package including No-Demo-Data messaging, website and Kraken referral/disclosure | `PARTIAL` | deterministic multi-platform marketing pack, support contact, disclaimer, hashtags and limits exist; Kraken referral copy exists in a package-specific content-creator artifact, but the reusable Social package does not model every requested reusable legal/referral/website field | extend the canonical Social Content Package rather than embedding a second template path; resolve authoritative referral/disclosure source before central reuse |
| `SOC-CHAT-04` | Short marketing video around 20 seconds using repository assets, prompts and voice-over; preserve/restore original images and remove unintended AIF branding where sourced from the repository | `PARTIAL` / `EVIDENCE_GAP` | open-source media evidence records deterministic Pillow + FFmpeg short rendering and an 18 s developer smoke; current Social router still states `No media rendering (N3)`; no current Social mockup/source inventory proves the requested original-image/AIF-logo cleanup end-to-end | integrate only through the existing media/publishing boundary; inventory exact asset/template source before any deletion or branding change |
| `SOC-CHAT-05` | Evaluate and implement high-quality TTS/voice-over with Qwen and Chatterbox, compare against stronger suitable OSS options and a paid reference package, including real listening samples | `OPEN` | no Qwen or Chatterbox adapter/implementation found on current `main`; existing media evidence explicitly leaves TTS/voice-over as a residual gap | new provider-neutral TTS workstream slice; benchmark first, then implement only the selected adapters without granting publish authority |
| `SOC-CHAT-06` | Multilingual podcasts with multiple speakers and flexible voice assignment | `PARTIAL` | podcast/script structures and host/cohost roles exist; current template locale is limited to `de | en`; no synthesized podcast-audio path is current-main proven | extend language/speaker/voice-profile contracts in Social; protected runtime/model execution is owner-routed where operational infrastructure is required |
| `SOC-CHAT-07` | Stable voice personas: creative/frech female marketing voice, realistic male IT-architecture voice, with domain-skill attachment and reproducible samples/weights | `OPEN` | current contracts expose speaker/SSML-style fields but no canonical voice-profile registry, acoustic model binding, skill-to-voice mapping, model weights or reproducible TTS sample evidence | define a voice-profile/sample manifest contract; keep acoustic identity separate from domain expertise/prompt skills; model-weight provisioning remains a protected runtime/artifact concern |
| `SOC-CHAT-08` | Social Media Kit UI/mockups, image replacement and frontend visual presentation | `OWNER_ROUTED` | product UI implementation is explicitly outside Social ownership | `CAPITAL-AI-FE` owns product/UI implementation; Social supplies approved copy/media requirements only |
| `SOC-CHAT-09` | LinkedIn/social PDF/report presentation derived from Social content | `OWNER_ROUTED` / `PARTIAL` | Social can own channel adaptation/copy, but canonical document/PDF implementation belongs to Documentary; chat-generated PDFs alone are not repository completion evidence | route PDF renderer/document implementation to `CAPITAL-AI-DOC / PVC-03`; retain Social distribution package requirements here |

### Consolidated findings

1. **Emoji mapping and platform character-limit work are complete on current `main`.** They should be maintained and drift-tested, not reimplemented.
2. **Text/script generation exists and is useful, but the canonical Social Content Package remains runtime-partial.** Provenance, reusable legal/referral fields and complete approval/evidence identity still need consolidation through the existing contract.
3. **Short-video rendering exists as an isolated deterministic renderer/evidence slice, but Social runtime wiring is not end-to-end.** The current Social router still explicitly excludes media rendering.
4. **Voice-over is the clearest current media gap.** Qwen and Chatterbox are not implemented on current `main`; TTS remains open in existing media evidence.
5. **Podcast generation is not German-only, but it is currently only bilingual (`de`/`en`) at the template-contract level and has no proven real TTS output path.**
6. **Repository model weights and listening samples must not be inferred from chat generation.** If operational model weights are required, the applicable owner must provision them as licensed/checksummed artifacts; committing large model weights to Git is not the default Social implementation path.
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
**State:** `PARTIAL — CONTRACT DEFINED / RUNTIME PARTIAL`

Maintain one canonical Social content package with source/provenance, channel, copy/media references, required disclosures and approval/evidence identity.

Current priority is compatibility-first completion of the existing package model: do not create a parallel generator. Add reusable channel/legal/referral/website metadata only when its authoritative source and applicability are resolved.

### SOCIAL-02 — Channel adaptation
**State:** `PARTIAL — TEXT ADAPTATION IMPLEMENTED / MEDIA-LANGUAGE EXTENSION OPEN`

Adapt content to provider/channel constraints without altering canonical financial meaning or fabricating platform capabilities.

Current-main completed slices include marketing emoji semantics and central platform character limits. Remaining Social-owned adaptation includes richer multilingual contracts, voice-profile selection metadata, media-format requirements and disclosure-preserving adaptation.

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

**Scope:** complete the existing Social Content Package runtime mapping for provenance, content identity, disclosure/referral metadata, approval reference and evidence correlation without creating a second generator/publisher path.

**Exit gate:** package schema/types + compatibility mapping + targeted tests prove required fields and fail-closed behavior for missing mandatory provenance/disclosure identity.

### `SOCIAL-P1` — TTS / multilingual voice contract and benchmark

**Scope:** define a provider-neutral TTS request/result and voice-profile/sample-manifest contract; benchmark Qwen and Chatterbox against suitable maintained OSS alternatives plus one paid quality reference. Cover at minimum German and English plus an extensible language registry, multi-speaker assignment, finance/IT terminology, numbers/percentages/asset names, latency, reproducibility, licensing and failure behavior.

**Ownership boundary:** Social owns requirements, provider-neutral contracts, voice roles and benchmark evidence. Operational model-weight/service provisioning is routed to the applicable protected runtime owner, commonly `CAPITAL-AI-OPS`.

**Exit gate:** reproducible benchmark matrix + licensed sample manifest + selected adapter decision + Social-owned contract/tests; no autonomous publication and no secret/model-host authority added.

### `SOCIAL-P2` — Short-video + voice-over integration

**Scope:** connect approved script + validated assets + selected TTS output to the existing deterministic short renderer and asset/publishing preparation boundary. Preserve original source assets, brand validation, hashes, duration metadata and explicit `publishReady=false` until existing approval/execution gates are satisfied.

**Exit gate:** deterministic approximately-20-second fixture render with exact input/asset hashes, voice manifest, brand/logo validation, negative tests, and no direct publishing side effect. Productive FFmpeg licensing/build profile must be independently acceptable before production use.

### `SOCIAL-P3` — Publication/analytics evidence completion

**Scope:** complete evidence correlation and canonical analytics consumption without fabricated metrics.

**Exit gate:** provider post identity + content/asset/approval correlation + canonical metric source/window provenance + repeatable drift checks.

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
