# CAPITAL-AI Autonomous Content Engine Architecture

Document ID: ARCH-CONTENT-0001
Status: DRAFT — IMPLEMENTATION NOT AUTHORIZED
Date: 2026-08-12
Baseline: `main@3a733f2b6efeffb3013fbb2c558b5ef4c185125e`
Owner: Platform Director / Repository Owner
Related: ESS-0014, ESS-0019, ESS-0024, ADR-0026, ADR-0080

## 1. Executive decision

CAPITAL-AI extends the existing SocialMediaEngine with an Autonomous Content Engine instead of replacing the existing OAuth/publishing stack with a second social-media platform.

Existing distribution remains authoritative for:

- OAuth and account state;
- token storage;
- user/Founder/Owner access checks;
- publish API calls;
- platform-specific publishing;
- publish history/evidence.

The new architecture adds the missing upstream layers:

`Source/Evidence -> Content Planning -> Generation -> Validation -> Provenance/Compliance -> Human Approval -> Media Rendering -> Asset Registry -> Existing Social Publishing -> Analytics Feedback`.

## 2. Verified repository boundary

Current repository contracts already contain:

- `SocialMediaQuestionnaire`;
- `ScriptScene`;
- `PodcastDialogueEntry`;
- `GeneratedMediaItem`;
- `SocialMediaSeriesPackage`;
- `marketingPack`;
- `audioSsml`;
- `thumbnailPrompt`;
- optional `mediaUrl`.

The current client service explicitly documents that `generateSeries`, fallback package generation and `/api/social-media/generate` are not implemented.

The existing platform publishers already perform real external calls. YouTube/TikTok/Instagram require a real reachable media asset; X/Facebook text publishing can work without rendered video.

Therefore the architecture evolves existing contracts instead of creating a duplicate social stack.

## 3. Target planes

### 3.1 Evidence Plane

Sources:

- verified market/scoring data;
- approved news/research sources;
- SEO/Search Console/GA4 evidence;
- approved product/documentation sources;
- Human input.

Output: immutable/referential `ContentSourceReference` records with evidence digest and freshness metadata.

### 3.2 Content Intelligence Plane

Components:

- `ContentPlanner`;
- `SourceEvidenceResolver`;
- `PromptTemplateRegistry`;
- `ContentGenerationOrchestrator`;
- `PlatformVariantPlanner`;
- provider-neutral text-generation interface.

The content plane cannot publish.

### 3.3 Trust & Compliance Plane

Components:

- `FinancialClaimValidator`;
- `ContentPolicyGate`;
- `AIContentProvenance`;
- `DisclosurePolicy`;
- `ContentApprovalService`.

This plane decides whether content is `ALLOW`, `REVIEW_REQUIRED` or `DENY` for the requested use.

### 3.4 Media Plane

Provider-neutral interfaces:

- `ImageGenerationProvider`;
- `ImageEditProvider`;
- `TextToSpeechProvider`;
- `VideoRenderingProvider`;
- `AssetValidator`;
- `AssetRegistryService`.

Candidate workers may include FLUX-compatible image generation, an image-edit model, TTS providers, a MoneyPrinterTurbo-compatible short-video sidecar and deterministic Remotion templates.

Media workers have no publishing or infrastructure authority.

### 3.5 Distribution Plane

Existing CAPITAL-AI components remain authoritative:

- `SocialMediaGeneratorService` publishing methods;
- `socialMediaRoutes.ts`;
- `platformPublishers.ts`;
- `tokenStore.ts`;
- `publishLog.ts`;
- access-control/OAuth components.

A new `ContentPublishingBridge` maps an approved content package/asset into the existing `PublishRequestPayload` rather than bypassing the publisher.

### 3.6 Feedback Plane

Inputs:

- Search Console;
- GA4;
- approved platform metrics;
- publish history;
- content metadata/provenance.

Output:

- content-performance score;
- template/provider recommendations;
- next-plan recommendation.

Feedback cannot self-grant publish authority.

## 4. Proposed repository structure

```text
src/platform/SocialMediaEngine/
├── Contracts/
│   ├── ContentPackage.ts
│   ├── ContentSource.ts
│   ├── ContentProvenance.ts
│   ├── GeneratedAsset.ts
│   ├── ContentApproval.ts
│   └── ProviderContracts.ts
├── Planning/
│   ├── ContentPlanner.ts
│   ├── PlatformVariantPlanner.ts
│   └── PromptTemplateRegistry.ts
├── Generation/
│   ├── ContentGenerationOrchestrator.ts
│   ├── TextGenerationProvider.ts
│   └── SourceEvidenceResolver.ts
├── Compliance/
│   ├── ContentPolicyGate.ts
│   ├── FinancialClaimValidator.ts
│   ├── ProvenanceValidator.ts
│   └── DisclosurePolicy.ts
├── Rendering/
│   ├── MediaRenderer.ts
│   ├── AssetValidator.ts
│   └── ProviderRegistry.ts
├── Providers/
│   ├── FluxImageAdapter.ts
│   ├── ImageEditAdapter.ts
│   ├── TtsProviderAdapter.ts
│   ├── MoneyPrinterTurboAdapter.ts
│   └── RemotionAdapter.ts
└── Services/
    ├── ContentPackageService.ts
    ├── ContentApprovalService.ts
    ├── AssetRegistryService.ts
    └── ContentPublishingBridge.ts

server/socialMedia/
├── generationRoutes.ts
├── contentStore.ts
├── contentApproval.ts
├── assetStore.ts
├── contentAudit.ts
├── oauthExchange.ts          # existing
├── platformPublishers.ts     # existing
├── publishLog.ts             # existing
├── tokenStore.ts             # existing
└── accessControl.ts          # existing
```

Exact paths remain subject to implementation review; this document does not authorize file creation outside a future work package.

## 5. Core ContentPackage contract

Target conceptual contract:

```ts
export type ContentAuthorship = 'human' | 'ai_assisted' | 'ai_generated';

export type ContentLifecycleState =
  | 'DRAFT'
  | 'GENERATED'
  | 'VALIDATING'
  | 'REVIEW_REQUIRED'
  | 'APPROVED'
  | 'RENDERING'
  | 'READY'
  | 'PUBLISHING'
  | 'PUBLISHED'
  | 'PARTIAL'
  | 'FAILED'
  | 'STALE';

export interface ContentSourceReference {
  sourceId: string;
  sourceType: 'market_data' | 'scoring' | 'news' | 'seo' | 'document' | 'manual';
  sourceUri?: string;
  sourceTimestamp?: string;
  evidenceHash: string;
  dataBasis?: 'market-data' | 'verified-document' | 'manual';
}

export interface ContentProvenance {
  authorship: ContentAuthorship;
  provider?: string;
  model?: string;
  promptTemplateId?: string;
  promptTemplateVersion?: string;
  generatedAt?: string;
  sourceReferences: ContentSourceReference[];
  generationRunId?: string;
  humanReviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  contentHash: string;
}
```

The existing `SocialMediaSeriesPackage` should be migrated/evolved through explicit compatibility rules rather than silently removed.

## 6. GeneratedAsset contract

Conceptual target:

```ts
export interface GeneratedAsset {
  id: string;
  contentPackageId: string;
  type: 'image' | 'thumbnail' | 'audio' | 'short_video' | 'long_video';
  provider: string;
  model?: string;
  mimeType: string;
  storageKey: string;
  sha256: string;
  width?: number;
  height?: number;
  durationMs?: number;
  status: 'GENERATING' | 'VALIDATING' | 'READY' | 'FAILED' | 'QUARANTINED';
  delivery?: {
    serverFetchUrl?: string;
    providerPullUrl?: string;
    expiresAt?: string;
  };
}
```

`mediaUrl` remains a publishing compatibility field, but internally it must resolve from a validated asset rather than an arbitrary untrusted URL.

## 7. Provider isolation

Domain code only depends on interfaces.

```ts
export interface ImageGenerationProvider {
  generate(request: ImageGenerationRequest): Promise<GeneratedAsset>;
}

export interface TextToSpeechProvider {
  synthesize(request: SpeechRequest): Promise<GeneratedAsset>;
}

export interface VideoRenderingProvider {
  render(request: VideoRenderRequest): Promise<GeneratedAsset>;
}
```

Provider adapters receive minimal task input and cannot access:

- Social OAuth tokens;
- GitHub credentials;
- Supabase privileged credentials;
- Stripe credentials;
- Owner session/TOTP/passkey material;
- Render/IONOS unrestricted credentials.

## 8. Media-generation strategy

### Images

Use a provider adapter for generative background/illustration assets.

Financial values, scores, disclaimers and brand-critical text should be rendered deterministically using HTML/SVG/Canvas/Remotion rather than trusted to generative image text rendering.

### Audio/TTS

Use a provider registry with explicit language/quality benchmark. German finance terms, numbers, percentages, abbreviations, company names, crypto assets and commodity names must be tested before production selection.

### Short video

A MoneyPrinterTurbo-compatible worker may be used as an isolated renderer. Its own social publishing features are not part of CAPITAL-AI authority and should not be used.

### Deterministic premium/learning video

A Remotion-compatible renderer can produce branded videos from structured data, charts, disclosure text, approved script and voiceover. License review is a required provider gate.

## 9. Financial content policy

Conceptual decision:

```ts
export interface ContentComplianceDecision {
  decision: 'ALLOW' | 'REVIEW_REQUIRED' | 'DENY';
  financialClaimRisk: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  investmentRecommendationRisk: boolean;
  disclosureRequired: boolean;
  provenanceComplete: boolean;
  unsupportedClaims: string[];
  reasons: string[];
}
```

DENY examples:

- invented market data;
- no evidence for a concrete quantitative claim;
- synthetic/heuristic value presented as live fact;
- manipulated score;
- unsupported performance promise;
- incomplete provenance;
- approval hash mismatch;
- prompt/retrieval injection attempting policy/tool control.

REVIEW_REQUIRED examples:

- forecast;
- ranking;
- asset recommendation-like statement;
- scoring conclusion used for persuasion;
- regulatory/compliance-sensitive comparison.

## 10. AI content transparency

Each content package records at least:

- content id/version;
- authorship classification;
- provider/model;
- generation timestamp;
- source references/digest;
- prompt template id/version or safe hash;
- human review state;
- content hash;
- final asset hashes;
- target platforms;
- approval reference.

Suggested visible disclosure policy:

- human: no AI disclosure by default;
- ai_assisted: `KI-unterstützt erstellt, redaktionell geprüft`;
- ai_generated: `KI-generierter Inhalt, vor Veröffentlichung geprüft`.

Exact legal/platform disclosure language requires separate compliance review before production.

## 11. Approval contract

Conceptual target:

```ts
export interface ContentApproval {
  approvalId: string;
  contentPackageId: string;
  approvedContentHash: string;
  approvedAssetHashes: string[];
  approvedPlatforms: string[];
  approverUserId: string;
  decision: 'APPROVED' | 'REJECTED';
  issuedAt: string;
  expiresAt?: string;
  usedAt?: string;
}
```

Material content/asset/platform changes invalidate the approval.

## 12. Storage model

Proposed additive logical data domains:

- `social_content_packages`;
- `social_content_assets`;
- `social_content_approvals`.

Existing domains remain authoritative:

- `social_media_accounts`;
- `social_media_oauth_states`;
- `social_media_publish_log`.

No production database mutation is authorized by this architecture draft. Migrations, storage buckets and secrets require the normal DevelopmentChain mutation handoff and Owner-controlled production gate.

## 13. Asset delivery / SSRF protection

Before any server-side fetch or provider-pull URL is accepted:

- require HTTP(S);
- validate host and resolved IP;
- deny localhost/loopback/private/link-local/cloud-metadata destinations;
- validate redirects again;
- enforce Content-Length/timeout limits;
- validate MIME and magic bytes;
- hash the asset;
- register it before publishing.

`file:`, `data:`, `ftp:` and equivalent unsupported schemes are denied.

This is particularly important because the existing YouTube path fetches `mediaUrl` server-side.

## 14. API evolution

Proposed new endpoints:

- `POST /api/social-media/generate`;
- `GET /api/social-media/content/:id`;
- `POST /api/social-media/content/:id/validate`;
- `POST /api/social-media/content/:id/approve`;
- `POST /api/social-media/content/:id/reject`;
- `POST /api/social-media/content/:id/render`;
- `GET /api/social-media/content/:id/assets`.

Existing publishing remains:

- `POST /api/social-media/publish`.

`ContentPublishingBridge` performs the controlled translation to the existing publish contract.

## 15. Event and audit model

Before adding any event, check the canonical Event Mesh catalog for semantic duplicates.

Candidate domain events:

- `ContentGenerationRequestedEvent`;
- `ContentGeneratedEvent`;
- `ContentValidationFailedEvent`;
- `ContentReviewRequiredEvent`;
- `ContentApprovedEvent`;
- `ContentRejectedEvent`;
- `AssetRenderingRequestedEvent`;
- `AssetRenderedEvent`;
- `AssetValidationFailedEvent`;
- `ContentPublishRequestedEvent`;
- `ContentPublishedEvent`;
- `ContentPublishFailedEvent`.

Keep three evidence domains separate:

1. content business state;
2. publishing evidence (`social_media_publish_log`);
3. agent/authorization audit (`agent_audit_events`).

## 16. Observability

Correlate:

- request/trace/generation run;
- content package id;
- source count/digest;
- provider/model/template version;
- generation/validation/render latency;
- provider token/compute/cost metadata where safe;
- content hash and asset hashes;
- approval id;
- publish log ids.

Do not persist full prompts/diffs/raw sensitive requests as generic telemetry. Prefer template ids/versions and safe hashes consistent with existing redaction policy.

## 17. Threat model

Required threats/tests include:

- prompt/retrieval injection;
- hallucinated financial claims;
- approval replay/stale approval;
- malicious media worker;
- cross-tenant asset access;
- SSRF through media URLs;
- poisoned analytics feedback;
- provider/supply-chain compromise;
- unauthorized platform publishing;
- audit outage causing side effects;
- content/asset mutation after review.

## 18. Feature flags

Recommended default rollout flags:

```text
CONTENT_GENERATION_ENABLED=false
CONTENT_IMAGE_GENERATION_ENABLED=false
CONTENT_TTS_ENABLED=false
CONTENT_VIDEO_RENDERING_ENABLED=false
CONTENT_PROVIDER_FLUX_ENABLED=false
CONTENT_PROVIDER_MPT_ENABLED=false
CONTENT_PROVIDER_REMOTION_ENABLED=false
CONTENT_AUTO_PUBLISH_ENABLED=false
```

Each capability is enabled independently after its roadmap gate.

`CONTENT_AUTO_PUBLISH_ENABLED=false` remains mandatory through the initial implementation/pilot phases.

## 19. Acceptance criteria

The architecture is not production-ready until at least:

1. existing OAuth/account/publishing behavior has no regression;
2. X/Facebook text publishing remains functional;
3. no model/renderer receives prohibited credentials;
4. quantitative claims without evidence are blocked;
5. incomplete provenance prevents publish;
6. content/asset mutation invalidates approval;
7. cross-user access is denied;
8. media URL path is SSRF-hardened;
9. provider outage produces honest failure, no fake success;
10. YouTube/TikTok/Instagram remain fail-closed without valid assets;
11. provider replacement does not change domain contracts;
12. content and asset hashes are reproducible;
13. audit/event/publish evidence can be correlated;
14. production configuration/database/provider mutations remain separately Owner-gated;
15. auto-publish remains disabled until separately approved.

## 20. Recommended implementation order

`Contracts -> text generation -> provenance/compliance/approval -> asset infrastructure -> image/TTS -> short-video rendering -> publishing bridge -> UI -> analytics feedback`.

This order gives useful X/Facebook content generation before expensive media infrastructure and keeps public publishing behind the trust plane.
