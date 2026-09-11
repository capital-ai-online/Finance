# CAPITAL-AI-SOCIAL TTS / Voice Contract

**Contract role:** provider-neutral Social voice synthesis contract / non-authorizing  
**Version:** 1.0.0  
**Date:** 2026-09-11  
**Roadmap:** `SOCIAL-P1 — TTS / multilingual voice contract and benchmark`  
**Trust root:** `/AGENTS.md`

## 1. Purpose

This contract defines the Social-owned boundary between approved text/content identity and a future TTS adapter. It does not authorize model hosting, provider credentials, publication, deployment or any other protected external mutation.

The contract extends the existing Social path:

```text
SocialContentPackage
→ immutable candidate_content_hash
→ TtsSynthesisRequest
→ authorized provider/runtime adapter
→ TtsSynthesisResult + audio SHA-256 + evidence
→ existing deterministic media/publishing-preparation path
```

It MUST NOT create a second content generator, media renderer or publishing path.

## 2. Request contract

A `TtsSynthesisRequest` carries:

| Field | Required | Semantics |
|---|---|---|
| `content_package_id` | yes | canonical SOCIAL-P0 package identity |
| `candidate_content_hash` | yes | immutable final candidate identity |
| `language_registry` | yes | explicit language registry; P1 floor is `de-DE`, `en-US`, `en-GB` |
| `voice_profiles` | yes | stable persona/profile definitions; no implicit real-person identity |
| `speakers` | yes | stable speaker → voice-profile assignments |
| `segments` | yes | ordered multilingual text segments |
| `output` | yes | provider-neutral audio format/sample-rate/channel request |
| `deterministic_seed` | optional | reproducibility hint where the provider supports it |
| `request_hash` | derived | SHA-256 over the normalized semantic request |

The request MUST NOT carry API keys, OAuth tokens, passwords, provider secrets or publishing credentials.

## 3. Voice profile contract

A `VoiceProfile` has a stable `voice_profile_id`, semantic role, supported language list and style intent. The mode is one of:

- `preset` — provider-supplied voice;
- `designed` — synthetic persona designed without cloning a real person;
- `cloned` — voice clone requiring immutable reference-audio identity plus license and consent evidence;
- `reference` — externally supplied licensed reference voice, subject to the same evidence requirements.

For `cloned` and `reference`, all of the following are mandatory before synthesis:

- reference identity;
- SHA-256 of the reference audio;
- license/usage-right reference;
- consent reference;
- source kind.

Missing evidence fails closed. A voice profile must never silently imply the identity of a real person.

## 4. Language and multi-speaker contract

The P1 contract requires German and English and uses explicit BCP-47-style codes. The registry is extensible; registration only makes a language eligible for contract validation and does **not** assert that every provider/model supports it.

Each segment references exactly one registered speaker. Each speaker references exactly one voice profile. The selected profile must declare support for the segment language.

Multi-speaker dialogue may be implemented as ordered per-segment synthesis; a provider does not need a proprietary native multi-speaker API to satisfy this contract.

## 5. Result contract

A successful `TtsSynthesisResult` MUST carry:

- exact `request_hash`;
- provider and model identity;
- generation timestamp;
- model/license evidence reference;
- run/evidence reference;
- output asset reference;
- output SHA-256;
- format, sample rate, channels and duration;
- explicit watermark state/evidence.

A failed result carries a bounded error code/message and no audio artifact. A provider success response without immutable audio evidence is not promoted to `SUCCEEDED`.

## 6. Determinism and evidence

The contract separates two reproducibility levels:

1. **Request reproducibility:** deterministic request hash over content identity, language registry, voice profiles, speaker assignment, ordered segments, output spec and optional seed.
2. **Audio reproducibility:** provider/runtime-specific and proven only by actual output hashes and run evidence.

A deterministic request hash MUST NOT be misreported as proof that a stochastic TTS provider will emit byte-identical audio.

## 7. Benchmark fixture contract

The canonical P1 benchmark fixture is:

`reports/SOCIAL_P1_TTS_SAMPLE_MANIFEST_2026-09-11.json`

It contains repository-authored pronunciation/dialogue text, input SHA-256 values, required terms and explicit `generated_audio_status`. No third-party reference voice or generated audio is treated as bundled evidence unless a later manifest entry carries license/consent/source evidence and an immutable audio hash.

## 8. Adapter decision

P1 selects **Qwen3-TTS VoiceDesign (1.7B family)** as the primary persona-design adapter target for a future bounded adapter implementation because the current upstream surface documents:

- Apache-2.0 licensing;
- German and English among ten languages;
- free-form voice design without requiring a real-person reference recording;
- instruction control and streaming support.

**Chatterbox Multilingual V3** remains the first fallback/pilot comparator because it is smaller (0.5B), MIT-licensed at the upstream repository surface, supports German/English within 23+ languages, supports cross-language voice cloning and includes provider-native PerTh watermarking. Any cloning use still requires the evidence fields in this contract.

This is an adapter-selection decision, not production acceptance. Actual acoustic quality, latency, GPU/runtime fit and downloadable artifact licensing MUST be revalidated by the authorized runtime owner before production use.

## 9. Ownership boundary

CAPITAL-AI-SOCIAL owns:

- provider-neutral request/result semantics;
- voice roles and persona intent;
- language/multi-speaker contract;
- benchmark fixtures, matrix and Social-owned tests;
- correlation into the existing Social content/media path.

CAPITAL-AI-SOCIAL does **not** own:

- GPU/model-host provisioning;
- model-weight download into protected runtime;
- provider API keys or billing;
- production service configuration;
- publishing credentials or approval;
- autonomous publication;
- deployment or production mutation.

Protected model/provider/runtime execution remains routed to the applicable owner, commonly `CAPITAL-AI-OPS`.

## 10. P2 handoff invariant

SOCIAL-P2 may consume a validated `TtsSynthesisResult` only when its `request_hash`, audio SHA-256, license evidence and content-package identity are preserved in the existing deterministic media manifest. P2 must keep `publishReady=false` until the already-existing approval/execution gates are satisfied.
