# SOCIAL-MEDIA-CREATIVE-AUTOMATION-01 — Detection / Benchmark Baseline

**Project:** `CAPITAL-AI-SOCIAL`  
**Canonical project folder:** `docs/projects/social-media/`  
**Primary productive PVC:** `N/A — cross-cutting Social Media; no productive PVC stage`  
**Primary Owner:** `CAPITAL-AI-SOCIAL`  
**Package:** `SOCIAL-MEDIA-CREATIVE-AUTOMATION-01`  
**Part:** `1 / SOCIAL-CREATIVE-DETECTION-01`  
**Correlation baseline:** `main@bea9373811202aef98f3ad8ffd53dba99d37c453`  
**Evidence date:** `2026-09-16`  
**Status:** `PART 1 MATERIALIZED — EXIT GATE BLOCKED BY REAL ACOUSTIC RUNTIME EVIDENCE`  
**Provider publication / paid distribution:** `NOT RUN`  
**Protected TTS runtime benchmark:** `NOT RUN`

## 1. Scope and truth boundary

This report materializes only the Social-owned detection, architecture correlation, benchmark definition and owner-correct remediation planning requested by `SOCIAL-MEDIA-CREATIVE-AUTOMATION-01`.

It does not:

- treat a synthetic or mocked benchmark as real media evidence;
- provision model weights, GPU/runtime hosts, provider accounts, credentials or paid services;
- publish or distribute content;
- claim that a test or render was executed in this pass when it was not;
- create a second Social Media generator, TTS authority, renderer or publishing path;
- promote draft/proposed media architectures to current authority;
- transfer protected runtime ownership from `CAPITAL-AI-OPS` or productive PVC ownership from canonical owners.

The current project roadmap is newer than the detailed domain-roadmap snapshot and controls execution priority for this pass. It records `SOCIAL-P1` as contract/code/test complete with the acoustic runtime still `NOT RUN`, `SOCIAL-P2` as blocked on valid P1 runtime evidence, and the Social-owned P3 contract slice as already `DONE_MAIN`.

## 2. Current-main architecture map

### 2.1 Audio / voice path

```text
canonical source/content intent
→ Social content/script generation
→ canonical Social content package + approval identity
→ server/socialMedia/voiceContract.ts
→ server/socialMedia/p1Benchmark.ts
→ [PROTECTED RUNTIME BOUNDARY — real model/runtime execution NOT RUN]
→ TtsSynthesisResult with immutable audio identity
→ [AUDIO MASTERING / NORMALIZATION STAGE NOT YET PROVEN]
→ downstream media consumption only after validated P1 evidence
```

**Proven repository surfaces:**

- provider-neutral TTS request/result and voice-profile semantics in `server/socialMedia/voiceContract.ts`;
- deterministic four-fixture × two-candidate benchmark planning and fail-closed evidence acceptance in `server/socialMedia/p1Benchmark.ts`;
- exact runtime-evidence requirements in `work-packages/SOCIAL_P1_TTS_RUNTIME_EVIDENCE_2026-09-16.md`;
- current candidate set: `qwen3-tts` and `chatterbox-multilingual-v3`.

**Open architecture gap:** no canonical current-main Social audio-mastering stage was found for loudness normalization, clipping prevention, unexplained-silence detection or optional noise reduction. The TTS contract must remain the source of audio identity rather than introducing a second voice pipeline.

### 2.2 Video path

```text
bounded local content render manifest
→ scripts/media/render_content_assets.py
→ scripts/media/capital_ai_media.py
→ Pillow deterministic image/frame rendering
→ FFmpeg short-video rendering
→ SHA-256 asset manifest
→ publishReady=false
→ existing SocialMediaEngine validation / approval / publishing boundary
```

**Proven repository surfaces:**

- accepted `ADR-0094` selects the thin Pillow/Poppler/FFmpeg adapter and explicitly rejects a second publishing authority;
- thumbnail `1280×720`, square `1080×1080`, vertical `1080×1920` and 9:16 scene-frame generation are implemented;
- optional vertical MP4 uses FFmpeg, is bounded to 5–60 seconds, validates 1080×1920 output and hashes produced assets;
- remote URLs are rejected by the deterministic renderer;
- generated manifests always keep `publishReady=false`;
- FFmpeg `--enable-nonfree` is denied and GPL builds are denied by default pending an explicit developer-only smoke override; production requires a separately reviewed redistributable profile.

**Open architecture gaps:**

- the current short-video command uses `-an`; no audio is muxed into the rendered video;
- no canonical 16:9 long-form video render profile is proven; 1280×720 exists as a thumbnail/card output, not as a video profile;
- no caption/WebVTT/SRT generation or burn-in path was found in current-main repository search;
- no audio/video synchronization validator is proven;
- no frame-artifact/readability/mobile-safe-area benchmark is proven beyond deterministic dimensions and bounded source text;
- the media manifest does not yet carry the full cross-format canonical content/campaign/model/runtime/config/license lineage requested by this package.

### 2.3 Podcast path

```text
SocialMediaEngine legacy/type surface
→ podcast dialogue / audio SSML semantics exist as data shapes
→ provider-neutral TTS contract exists
→ [REAL SYNTHESIS NOT RUN]
→ [CANONICAL PODCAST ARTIFACT PIPELINE NOT PROVEN]
→ [RSS / CHAPTER / AUDIO MASTER / ARTWORK / AUDIOGRAM PIPELINE NOT PROVEN]
```

`src/platform/SocialMediaEngine/types.ts` contains podcast-oriented types such as `podcast_dual_host`, `podcast_solo`, `PodcastDialogueEntry` and `audioSsml`, but that file itself documents the inherited generation portion as not audited/implemented. It therefore must not be treated as proof of a productive podcast renderer or as a second implementation authority.

Current-main code search for a canonical podcast RSS/chapter pipeline returned no matching productive path during this pass. No repository path for audiogram generation was found.

### 2.4 Creative generation path

```text
canonical content / campaign intent
→ Social content package / script / marketing pack
→ deterministic local media manifest
→ existing Pillow renderer
→ thumbnail / square social card / vertical cover / vertical scene frames
→ optional vertical short
→ immutable asset hashes
→ existing approval / publish boundary
```

This path is the correct reuse baseline. New creative work should extend the existing deterministic adapter and canonical content identity instead of introducing Remotion, a second Python renderer, a second Social generator or a provider-specific creative authority without a separately accepted architecture decision.

## 3. Provider / tool capability matrix

| Capability | Current canonical / evaluated option | Current status | Decision for this package |
|---|---|---|---|
| TTS primary candidate | Qwen3-TTS / VoiceDesign | `SELECTED IN EXISTING SOCIAL-P1; REAL RUNTIME NOT RUN` | retain; benchmark only through protected runtime owner |
| TTS fallback candidate | Chatterbox Multilingual V3 | `SELECTED IN EXISTING SOCIAL-P1; REAL RUNTIME NOT RUN` | retain; benchmark only through protected runtime owner |
| Image / frame rendering | Pillow 12.3.0 | `CURRENT-MAIN IMPLEMENTED` | reuse; no second image engine |
| Short video composition | FFmpeg via `capital_ai_media.py` | `CURRENT-MAIN IMPLEMENTED, VERTICAL/SILENT` | extend later rather than replace; production license/build profile remains fail-closed |
| PDF companion | Poppler + existing PDF companion script | `CURRENT-MAIN IMPLEMENTED` | reuse only for document-derived social assets; Documentary ownership remains separate |
| Transcript verification candidate | `faster-whisper` / CTranslate2 | `EXTERNAL ADVISORY CANDIDATE — NOT ADDED` | suitable for later transcript/caption verification after security/license/dependency correlation |
| Caption alignment / export | no canonical current-main implementation proven | `OPEN` | implement only after P1 and reuse/precheck; avoid inventing duplicate transcript authority |
| Audio mastering | no canonical current-main implementation proven | `OPEN` | later bounded FFmpeg/audio-processing extension is preferred over a new media engine |
| Podcast artifact / RSS | no canonical current-main implementation proven | `OPEN` | Social may own format semantics; publication/persistence boundaries stay owner-correct |
| Audiogram | no current-main implementation found | `OPEN` | derive later from validated audio + deterministic visual renderer |
| External generative video provider | no provider selected by current authority | `NOT AUTHORIZED / NOT NEEDED FOR CURRENT STEP` | do not provision or invoke; existing deterministic renderer is lower-risk reuse baseline |

### Advisory upstream check — 2026-09-16

External upstream documentation was checked only as advisory input and creates no repository authority:

- `QwenLM/Qwen3-TTS` currently exposes an Apache-2.0 code surface and remains aligned with the existing Qwen candidate selection;
- `resemble-ai/chatterbox` currently identifies Chatterbox Multilingual V3 as its multilingual general-purpose model and lists German/English among supported languages;
- `SYSTRAN/faster-whisper` is an MIT-licensed CTranslate2 Whisper implementation and is a reasonable later candidate for transcript verification/caption generation, but it is not added by this package.

Exact model artifacts, weights, transitive dependencies and their licenses must still be rechecked and hashed at the time of protected runtime execution.

## 4. Voice quality benchmark baseline

The existing `SOCIAL-P1` acceptance harness already covers the core evidence needed by this package. No competing benchmark harness is introduced.

| Voice dimension / metric | Current evidence | Status |
|---|---|---|
| German / English fixture coverage | four canonical fixtures include DE/EN finance, IT and dialogue cases | `PROVEN AS FIXTURE CONTRACT` |
| financial terms / required terms | explicit per-fixture term list and PASS evidence required | `PROVEN AS ACCEPTANCE CONTRACT` |
| numbers / currencies / tickers / acronyms | contract can carry required-term evidence; real acoustic outcome absent | `RUNTIME NOT RUN` |
| voice / speaker consistency | stable voice-profile semantics exist | `CONTRACT PROVEN / ACOUSTIC NOT RUN` |
| generation latency | required per case | `NOT RUN` |
| first-audio latency | required per case | `NOT RUN` |
| audio duration | required through `TtsSynthesisResult` audio metadata | `NOT RUN` |
| RTF | required and mathematically checked against total latency / audio duration | `NOT RUN` |
| audio SHA-256 | mandatory for successful immutable result | `NOT RUN` |
| runtime identity | mandatory | `NOT RUN` |
| model artifact SHA-256 / license reference | mandatory | `NOT RUN` |
| dependency identity / SHA-256 | mandatory | `NOT RUN` |
| transcript identity / SHA-256 | mandatory | `NOT RUN` |
| listening review | explicit PASS required for every case | `NOT RUN` |

**Voice benchmark verdict:** `NO REAL QUALITY VERDICT POSSIBLE YET`. Contract readiness is strong, but acoustic quality, latency, RTF, pronunciation and listening quality must remain unknown until the separately authorized 8/8 runtime benchmark is executed.

## 5. Video quality benchmark baseline

No video render or hosted test was executed in this detection pass. The table separates current-main implementation evidence from runtime quality evidence.

| Video dimension | Current-main evidence | Current pass status |
|---|---|---|
| vertical dimensions | code validates 1080×1920 | `IMPLEMENTED / NOT EXECUTED HERE` |
| duration bounds | 5–60 seconds; scenes 1–20 seconds | `IMPLEMENTED / NOT EXECUTED HERE` |
| frame cadence | FFmpeg `fps=30` | `IMPLEMENTED / NOT EXECUTED HERE` |
| output hashing | SHA-256 AssetRecord | `IMPLEMENTED / NOT EXECUTED HERE` |
| publishing isolation | `publishReady=false` | `IMPLEMENTED` |
| FFmpeg license guard | nonfree DENY; GPL DENY by default | `IMPLEMENTED / BUILD PROFILE NOT RECHECKED HERE` |
| audio/video sync | no audio track in current short renderer | `OPEN` |
| captions / timing | no canonical path found | `OPEN` |
| visual artifact detection | no canonical detector found | `OPEN` |
| mobile safe area | vertical composition exists; explicit safe-area validator not found | `PARTIAL` |
| landscape video 16:9 | no canonical video profile proven | `OPEN` |
| square video 1:1 | square image exists; video profile not proven | `OPEN` |
| canonical cross-format identity | asset manifest is local renderer-oriented and lacks full requested campaign/model/runtime/config lineage | `PARTIAL` |

## 6. Podcast readiness matrix

| Requirement | Current status | Evidence / gap |
|---|---|---|
| multi-speaker semantic contract | `PARTIAL` | TTS voice profiles and speaker assignment exist; real synthesis not run |
| multilingual DE/EN semantics | `PARTIAL` | TTS registry exists; real acoustic output absent |
| episode title / description | `PARTIAL` | Social generated-media types contain title/marketing structures; no canonical end-to-end podcast artifact contract proven |
| full-length audio | `BLOCKED` | real P1 synthesis not available |
| full-length video variant | `OPEN` | no canonical landscape audio/video pipeline proven |
| chapters | `OPEN` | no canonical current-main chapter pipeline found |
| show notes | `OPEN` | no canonical podcast-specific output contract proven |
| transcript artifact | `OPEN` | P1 requires transcript evidence but no reusable episode transcript pipeline is proven |
| RSS compatibility | `OPEN` | no canonical current-main RSS path found |
| podcast artwork | `PARTIAL` | square deterministic image capability exists; podcast-specific identity binding not proven |
| audiogram | `OPEN` | no current-main path found |
| cross-format canonical episode identity | `OPEN` | requested identity propagation is not yet materialized across all podcast outputs |

## 7. Duplicate / parallel architecture findings

### 7.1 No second productive renderer should be created

`ADR-0094` already selects the deterministic Pillow/FFmpeg adapter. A new parallel renderer would duplicate current authority unless an accepted architecture decision explicitly supersedes or extends it.

### 7.2 Legacy SocialMediaEngine type surface is not implementation proof

`src/platform/SocialMediaEngine/types.ts` includes broad podcast/video/generator types, but its own header states that the inherited content-generation portion was not audited or implemented because the service/export pieces were missing. It is a compatibility/type surface, not evidence that a second productive media pipeline exists.

### 7.3 Draft autonomous content architecture is non-authorizing

The draft autonomous content architecture and proposed media-v2 ADR remain design inputs only. They must not be used to bypass current Roadmap, accepted ADRs, protected provider/runtime boundaries or the existing deterministic media adapter.

**Duplicate-architecture result:** `NO CONFIRMED SECOND PRODUCTIVE MEDIA PIPELINE FOUND`; the main risk is accidentally promoting legacy/draft surfaces into a parallel authority during future implementation.

## 8. Top quality bottlenecks

1. **P1 acoustic runtime evidence is the primary blocking gate.** Without real 8/8 TTS evidence, no voice-quality delta can be asserted and P2 cannot consume validated audio.
2. **Current short video is silent.** The existing FFmpeg path explicitly disables audio and therefore cannot satisfy voice-over, podcast-video or A/V-sync requirements.
3. **No canonical caption/timestamp pipeline is proven.** Accessibility and subtitle quality cannot yet be verified end to end.
4. **No canonical podcast artifact pipeline is proven.** RSS, chapters, episode transcript, show notes and audiogram remain open.
5. **Asset lineage is not yet end-to-end.** Current renderer manifests hash outputs but do not preserve all requested campaign/content/model/runtime/prompt-config/license identities across derivatives.
6. **Video QA is structural rather than perceptual.** Dimensions, bounds and license guards exist, but artifact detection, readability, safe-area and A/V-sync benchmarks remain open.
7. **Brand tokens are live repository dependencies.** Future media implementation must resolve then-current `docs/frontend/design-tokens.json` rather than hardcoding a historical palette; an open Frontend PR currently touches the visual system and must be re-correlated before implementation.

## 9. Owner-correct remediation packages

### Package A — protected real SOCIAL-P1 runtime benchmark

**Owner boundary:** operational/protected runtime owner, commonly `CAPITAL-AI-OPS`; Social retains fixture and acceptance semantics.  
**Protected action:** yes; requires separate explicit Human/Owner authorization for the exact runtime/model/provider mutation.  
**Required result:** all eight benchmark cases return real immutable evidence accepted by `validateSocialP1BenchmarkEvidence(...)`.

**Exit gate:** `8/8 PASS` with real audio SHA-256, exact model artifact/license, runtime/dependency identity, latency/RTF, transcript/required-term evidence and listening review. Anything less remains `NOT PASS`.

### Package B — Social media pipeline extension after Package A

**Owner:** `CAPITAL-AI-SOCIAL` for Social format/identity/acceptance semantics.  
**Prerequisite:** valid P1 exit evidence and fresh then-current-main correlation.  
**Implementation direction:** extend the existing deterministic media adapter rather than create a second engine.

Bounded target capabilities:

- add canonical asset identity that preserves source content ID, campaign/episode ID, generation config identity, input/output SHA-256 and license/source status;
- add validated audio input from `TtsSynthesisResult` only;
- add audio normalization/clipping protection using the existing FFmpeg boundary where license/security checks remain satisfied;
- add deterministic audio mux with A/V-sync validation;
- add render profiles for `LANDSCAPE 16:9`, `VERTICAL 9:16` and appropriate square derivative generation without moving publishing authority;
- add reusable transcript/caption artifact with timestamp, terminology, number/currency validation and human-readable line breaking;
- derive thumbnail, quote card and audiogram from the same canonical identity;
- keep `publishReady=false` until the existing approval/publishing gates are satisfied.

### Package C — podcast artifact contract after validated audio exists

**Owner:** Social for channel/package semantics; Documentary/Data/OPS/Compliance boundaries remain owner-correct where persistence, document exports, provider publication or regulated/disclosure decisions are required.  
**Prerequisite:** Package A; reuse Package B media/caption primitives.

Target outputs:

- episode title/description;
- chapter structure;
- show notes;
- transcript/caption artifact;
- full audio;
- landscape video derivative;
- square artwork;
- audiogram and teaser derivatives;
- immutable cross-format episode identity.

RSS/provider publication remains a separate external-action boundary and is not authorized by this package.

## 10. Part-1 exit-gate evaluation

The requested Part-1 exit gate is **not satisfied** on current evidence.

| Exit requirement | Result |
|---|---|
| relevant audio stage has traceable request/result identity | `PARTIAL — contract exists; real runtime result absent` |
| runtime/model/provider identity for real TTS | `BLOCKED / NOT RUN` |
| video renderer identity | `PROVEN AS REPOSITORY IMPLEMENTATION` |
| real video quality benchmark | `NOT RUN IN THIS PASS` |
| podcast artifact identity | `OPEN` |
| creative asset identity | `PARTIAL — output hashes exist; requested cross-format lineage incomplete` |
| reproducible root cause / owner for detected gaps | `PASS FOR DETECTION` |

**Part-1 state:** `BLOCKED AT REAL-RUNTIME EVIDENCE GATE`.

Because the user package explicitly requires `Part 1 exit gate PASS` before Part 2, `SOCIAL-CREATIVE-EXECUTION-02` must not start from this baseline. The next executable repository implementation remains dependency-held until the protected P1 runtime evidence is returned and current main is re-correlated.

## 11. Validation performed in this pass

### Executed read/correlation checks

- current `main` resolved to `bea9373811202aef98f3ad8ffd53dba99d37c453`;
- `/AGENTS.md@current-main` read and applied;
- `docs/projects/README.md`, `PROJECT_VALUE_CHAIN.md`, Social README and Social Roadmaps read;
- open Pull Requests rechecked: no open Social PR; currently visible open PRs are Frontend and FinTech scoped;
- Social branch search returned no active Social branch name;
- the located historical Social work claim is `released / archived / activeWriter=false`;
- current TTS benchmark harness, runtime evidence package, accepted media-rendering ADR, renderer code and renderer contract tests inspected;
- repository searches performed for captions/WebVTT/SRT, podcast RSS/chapters, audiogram and audio-mastering paths; no canonical productive implementation was found for those gaps.

### Not executed

- unit tests: `NOT RUN`;
- TypeScript/lint/build: `NOT RUN`;
- FFmpeg render smoke: `NOT RUN`;
- image render smoke: `NOT RUN`;
- real TTS model execution: `NOT RUN`;
- listening review: `NOT RUN`;
- provider publication: `NOT RUN`;
- paid distribution: `NOT RUN`;
- external credentials/model-host provisioning: `NOT RUN`.

`NOT RUN` is not classified as `PASS`.
