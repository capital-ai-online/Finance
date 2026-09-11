# SOCIAL-P1 — TTS / Multilingual Voice Benchmark

**Project:** `CAPITAL-AI-SOCIAL`  
**Roadmap item:** `SOCIAL-P1`  
**Date checked:** 2026-09-11  
**Evidence class:** provider/model documentation + repository contract validation  
**Acoustic runtime benchmark:** `NOT RUN` — no Social-authorized model host, GPU weights or paid-provider credential is provisioned by this work item.

## Decision

**Primary adapter target:** `Qwen3-TTS-12Hz-1.7B-VoiceDesign`

Reason: it satisfies the Social minimum language floor (German/English), exposes free-form voice design so the requested stable marketing/IT personas can be created without cloning a real person's voice, uses an Apache-2.0 upstream license surface, and supports instruction control/streaming. This decision deliberately avoids making a real-person reference recording a prerequisite.

**Fallback / first lightweight pilot:** `Chatterbox Multilingual V3`

Reason: upstream documents a 0.5B model, 23+ languages including German/English, MIT repository license, cross-language voice cloning, reduced hallucination focus and built-in PerTh watermarking. A cloned/reference voice remains blocked until license + consent + immutable reference-audio evidence exists.

The decision is conditional on later authorized runtime validation. It is not a claim that either model has passed CAPITAL-AI acoustic acceptance.

## Evidence rule

The matrix below separates **documented/provider-reported capabilities** from CAPITAL-AI measurements. Provider claims such as "97 ms" or "150 ms" are not local benchmark results.

| Candidate | Upstream license surface | DE + EN | Persona / cloning capability | Size / latency evidence | P1 disposition |
|---|---|---:|---|---|---|
| Qwen3-TTS | Apache-2.0 model/repo surface | yes | 1.7B VoiceDesign supports free-form designed voices; Base variants support rapid voice clone | 0.6B/1.7B variants; upstream reports streaming latency as low as 97 ms | **SELECTED primary adapter target** |
| Chatterbox Multilingual V3 | MIT repository surface | yes | multilingual cross-language voice cloning; expressive controls | 0.5B; upstream emphasizes improved stability / reduced hallucination; built-in PerTh watermark | **SELECTED fallback / lightweight pilot** |
| Fun-CosyVoice3-0.5B-2512 | Apache-2.0 model card/repo surface | yes | cross-lingual zero-shot voice cloning; instruction support | 0.5B; upstream reports bi-streaming latency as low as 150 ms | retained OSS alternative |
| Kokoro-82M | Apache-2.0 model card/weights | **not sufficiently evidenced for German in current official model card** | preset/open-weight TTS baseline | 82M; lightweight efficiency baseline | English/efficiency comparator only; fails P1 primary DE+EN evidence gate |
| F5-TTS | MIT code; **CC-BY-NC pretrained weights** | community variants exist, but weight license blocks commercial default | zero-shot/reference TTS family | runtime quality/latency not measured here | **not eligible for production default** without separately cleared weights/license |
| Eleven v3 | commercial provider terms | yes | 70+ languages; native multi-speaker Dialogue; expressive audio tags | paid API reference; vendor currently documents 70+ languages | **paid quality reference only** |

## Reproducible benchmark matrix

Every adapter/runtime benchmark MUST use the exact sample IDs and `text_sha256` inputs from `SOCIAL_P1_TTS_SAMPLE_MANIFEST_2026-09-11.json`.

| Measurement | Method | Required output |
|---|---|---|
| German intelligibility | transcribe + human review of `de-finance-numbers-v1` | WER/CER or transcript diff + reviewer evidence |
| English IT pronunciation | required-term check on `en-it-architecture-v1` | pass/fail per required term |
| Multi-speaker assignment | synthesize host + architect dialogue fixtures with distinct profiles | speaker/profile mapping + audio hashes |
| Numbers / percentages / asset names | fixed German fixture | exact pronunciation observations; no invented market-data interpretation |
| Persona stability | repeat each profile ≥3 times with fixed request + seed where supported | request hashes, audio hashes, speaker-similarity evidence if available |
| Hallucination / continuation | compare generated transcript to exact fixture | unexpected-token/continuation findings |
| Latency / throughput | wall-clock on declared runtime hardware | first-audio latency, total latency, real-time factor |
| Reproducibility | repeat identical request | deterministic request hash + audio hashes; distinguish semantic from byte determinism |
| License / consent | verify exact downloaded model artifact and any reference voice | license URI/version + reference-audio consent evidence |
| Failure behavior | unsupported language, missing profile, missing license/consent, provider failure | fail-closed result; no ambiguous successful audio |

## Current measurement state

| Candidate | Local audio generated | Listening review | Measured latency | Output SHA-256 | Status |
|---|---:|---:|---:|---:|---|
| Qwen3-TTS | no | no | no | none | `NOT RUN — protected runtime/model provisioning required` |
| Chatterbox V3 | no | no | no | none | `NOT RUN — protected runtime/model provisioning required` |
| CosyVoice3 | no | no | no | none | `NOT RUN — protected runtime/model provisioning required` |
| Kokoro | no | no | no | none | `NOT RUN` |
| F5-TTS | no | no | no | none | `NOT RUN / license-blocked for production default` |
| Eleven v3 | no | no | no | none | `NOT RUN — paid provider credential not provisioned` |

No listening score, MOS, WER, latency or audio hash is invented by this report.

## Official source set checked on 2026-09-11

- Qwen3-TTS official repository: `https://github.com/QwenLM/Qwen3-TTS`
- Qwen3-TTS 0.6B Base model card: `https://huggingface.co/Qwen/Qwen3-TTS-12Hz-0.6B-Base`
- Chatterbox official repository: `https://github.com/resemble-ai/chatterbox`
- CosyVoice official repository: `https://github.com/QwenAudio/CosyVoice`
- Fun-CosyVoice3 0.5B model card: `https://huggingface.co/FunAudioLLM/Fun-CosyVoice3-0.5B-2512`
- Kokoro-82M model card: `https://huggingface.co/hexgrad/Kokoro-82M`
- F5-TTS official repository: `https://github.com/SWivid/F5-TTS`
- Eleven v3 official model page: `https://elevenlabs.io/v3`
- ElevenLabs model documentation: `https://elevenlabs.io/docs/overview/models`

## License / rights findings

- Qwen3-TTS official GitHub/Hugging Face surfaces identify Apache-2.0; exact downloaded artifacts must be rechecked at provisioning time.
- Chatterbox official repository exposes MIT licensing. Exact model artifacts and all transitive runtime dependencies must still be inventoried before production.
- CosyVoice repository/model card expose Apache-2.0.
- Kokoro model card exposes Apache-2.0 but current primary model-card evidence does not establish German support strongly enough for the P1 DE+EN minimum.
- F5-TTS explicitly states MIT code and CC-BY-NC pretrained weights; therefore it is not a production-commercial default for CAPITAL-AI without separately cleared weights/licensing.
- Eleven v3 is a paid provider reference and does not create provider/billing/credential authority for Social.

## P2 handoff

SOCIAL-P2 may implement an adapter around the selected provider-neutral contract only after:

1. exact model/runtime artifact license is revalidated;
2. the operational owner provisions the runtime/provider boundary;
3. generated outputs produce immutable audio hashes and evidence;
4. any reference/cloned voice has explicit license and consent evidence;
5. the existing deterministic renderer consumes the audio manifest without bypassing `publishReady=false`.

Until those gates are met, the current repository evidence is intentionally contract/benchmark evidence rather than synthesized-audio evidence.
