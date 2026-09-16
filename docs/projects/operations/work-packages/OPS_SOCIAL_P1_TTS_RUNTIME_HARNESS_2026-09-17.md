# OPS — SOCIAL-P1 Protected TTS Runtime Harness

**Project:** `CAPITAL-AI-OPS`  
**Project folder:** `docs/projects/operations/`  
**Primary PVC for this repository slice:** `PVC-02 — Controlled Implementation`  
**Primary Owner:** `CAPITAL-AI-OPS`  
**Consumed target contract:** `CAPITAL-AI-SOCIAL / SOCIAL-P1`  
**Baseline:** `main@4310fa4007278e925272c23149337d0b90c7a061`  
**Date:** `2026-09-17`  
**Protected GPU/model runtime execution:** `NOT RUN`  
**Provider publication / production deployment:** `NOT RUN`  
**Status:** `REPOSITORY HARNESS MATERIALIZED — PROTECTED RUNTIME STILL OWNER-GATED`

## 1. Purpose and ownership boundary

The Social project owns the four canonical fixtures, voice/persona intent, provider-neutral TTS request/result contract, candidate set and the final `8/8` benchmark acceptance semantics.

The Social Roadmap routes the remaining acoustic/model runtime execution to the operational/protected runtime owner, commonly `CAPITAL-AI-OPS`. This work package implements only the portable repository harness needed to execute that protected runtime later on an explicitly authorized host. It does not transfer Social acceptance authority to Operations and does not make `SOCIAL-P1` PASS by itself.

This repository slice is bounded to `PVC-02 — Controlled Implementation`: materialize an execution harness, evidence shaping and fail-closed validation path. A later real GPU/model run is a separate protected runtime operation and remains outside this branch.

## 2. Reuse / architecture result

The package reuses the already merged Social-owned surfaces rather than creating a second TTS contract or benchmark authority:

- `server/socialMedia/voiceContract.ts` — provider-neutral request/result and audio evidence contract;
- `server/socialMedia/p1Benchmark.ts` — exact four-fixture × two-candidate plan and final `8/8` validator;
- `docs/social-media/CAPITAL-AI-SOCIAL/reports/SOCIAL_P1_TTS_SAMPLE_MANIFEST_2026-09-11.json` — canonical repository-authored fixture text, immutable hashes, required terms, persona intents and candidate sources;
- `Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign` — upstream Qwen VoiceDesign runtime target;
- `ResembleAI/chatterbox` Multilingual V3 / `t3_mtl23ls_v3.safetensors` — upstream fallback target.

The connected Render surface was inspected read-only before custom runtime work. Its exposed service plans do not provide a GPU instance class, so no Render resource was created or repurposed for model execution.

No specialized external plugin/provider was connected, installed or permission-expanded. No model host, billing capability, OAuth grant or credential was created.

## 3. Materialized runtime harness

### `scripts/operations/socialP1TtsRuntime.py`

The protected-runtime generator:

1. loads only the canonical `SOCIAL-P1` manifest;
2. fails closed unless the manifest still contains exactly four fixtures, immutable text hashes, `generated_audio=[]` and `generated_audio_status=NOT_RUN`;
3. permits only the two already-selected candidates `qwen3-tts` and `chatterbox-multilingual-v3`;
4. requires locally materialized model directories for real execution rather than silently selecting another model/provider;
5. recursively inventories and SHA-256 hashes exact model artifacts before generation;
6. records dependency identity/hash, hardware/GPU identity and model-artifact aggregate SHA-256;
7. executes Qwen VoiceDesign with the Social persona `style_intent` as the native voice-design instruction;
8. executes Chatterbox Multilingual V3 explicitly through `t3_model="v3"`, without reference-person cloning;
9. records that Chatterbox's built-in conditioning does **not** enforce the Social designed-persona instruction, so this semantic difference remains visible to the later listening review rather than being fabricated away;
10. rejects non-24 kHz or non-mono output rather than silently resampling benchmark evidence;
11. saves real WAV files, immutable audio SHA-256, duration, generation timing and RTF;
12. identifies Chatterbox output as provider-native PerTh-watermarked and Qwen output as no asserted watermark;
13. treats first-audio latency for the chosen non-streaming calls as a truthful completion-time proxy instead of inventing a streaming first-chunk measurement;
14. produces `runtime-evidence.partial.json` only — no transcript or listening PASS is synthesized.

The default execution path requires CUDA. `--allow-non-gpu-smoke` exists only for non-acceptance smoke execution and emits `benchmark_eligible=false`; such output is rejected by final acceptance.

### `scripts/operations/socialP1TtsEvidence.ts`

The evidence finalizer:

1. rebuilds the plan using the existing Social-owned `buildSocialP1BenchmarkPlan(...)`;
2. binds the runtime bundle to the exact canonical manifest bytes through SHA-256;
3. requires the complete `8/8` matrix and `benchmark_eligible=true`;
4. correlates candidate ID, sample ID, candidate source and declared license surface with the Social plan;
5. does not accept a manually supplied TTS request hash — it injects the request hash from the canonical Social plan;
6. can emit a review template where transcript, term verdicts and listening verdict all start empty/`FAIL`;
7. combines real runtime evidence with separately supplied transcript/required-term/listening evidence;
8. computes the transcript SHA-256 itself;
9. calls the existing Social-owned `validateSocialP1BenchmarkEvidence(...)` as the final acceptance authority;
10. emits final evidence only when that validator returns the exact `8/8 PASS` summary.

## 4. Candidate-specific truth boundary

### Qwen3-TTS VoiceDesign

The upstream model provides native natural-language voice design. The harness therefore maps the Social `style_intent` directly to the upstream `instruct` input and maps `de-DE` to German and English variants to English.

### Chatterbox Multilingual V3

The upstream V3 runtime supports German and English and uses `t3_mtl23ls_v3.safetensors`. The canonical upstream class supports local model loading and uses built-in conditionals when available. The harness deliberately does not supply real-person reference audio because the canonical Social manifest states that real-person cloning is not authorized and no bundled reference audio exists.

Chatterbox does not consume the Social free-text designed-persona instruction in the same way Qwen VoiceDesign does. The runtime record therefore persists `style_intent_enforced=false` and requires the later listening review to judge the fallback's suitability. That limitation must not be rewritten as feature parity.

## 5. Evidence contract for the later protected run

A real Package-A execution is accepted only after all eight cases contain:

- exact canonical fixture/sample identity;
- exact candidate/model identity;
- local artifact inventory and aggregate model SHA-256;
- attributable license evidence/reference;
- runtime and hardware identity;
- dependency identity + SHA-256;
- real WAV asset + SHA-256;
- sample rate, channels and duration;
- first-available-audio measurement semantics, total latency and RTF;
- transcript identity + transcript SHA-256;
- explicit PASS evidence for every required term;
- explicit PASS human listening review.

The final Social validator remains the only repository acceptance decision for this benchmark.

## 6. Protected runtime gate

The following are **not authorized or performed by this repository package**:

- creating or changing a GPU/provider account;
- provisioning a paid GPU host;
- downloading model artifacts onto an external paid runtime;
- creating/changing OAuth or plugin connections;
- widening connector/provider permissions;
- modifying secrets or IAM;
- publishing content;
- deploying application changes to production;
- treating test/mock evidence as a real acoustic benchmark.

The later runtime execution requires a separately explicit Human/Owner authorization that identifies the concrete host/provider and intended external mutation/cost boundary.

## 7. Validation classification

### Repository checks represented by tests

`tests/unit/socialP1TtsRuntimeHarness.test.ts` verifies that:

- a complete shaped 8/8 GPU runtime + review bundle is passed through the existing Social validator;
- the generated review template starts fail-closed and does not fabricate transcript/listening PASS evidence;
- non-GPU smoke evidence cannot enter the acceptance path;
- runtime evidence bound to different manifest bytes is rejected.

### Execution status in this package

- Python model execution: `NOT RUN`;
- Qwen model load/generation: `NOT RUN`;
- Chatterbox model load/generation: `NOT RUN`;
- real audio generation: `NOT RUN`;
- listening review: `NOT RUN`;
- transcript engine run: `NOT RUN`;
- GPU/provider provisioning: `NOT RUN`;
- production mutation: `NOT RUN`.

Repository-hosted TypeScript/Python syntax/unit/build checks are deferred to the normal post-PR hosted validation path where available. `NOT RUN` is never `PASS`.

## 8. Exit gate

This repository work package exits successfully when the portable harness and fail-closed finalizer are merged after required checks and Human/CODEOWNER review.

That repository exit does **not** close `SOCIAL-P1`.

`SOCIAL-P1` exits only when a separately authorized real runtime returns all eight cases and `validateSocialP1BenchmarkEvidence(...)` produces `status=PASS`. Only then may `SOCIAL-P2` be re-correlated from then-current `main`.
