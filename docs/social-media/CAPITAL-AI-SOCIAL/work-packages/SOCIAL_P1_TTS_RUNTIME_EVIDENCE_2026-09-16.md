# SOCIAL-P1 — TTS Runtime Evidence Acceptance Package

**Project:** `CAPITAL-AI-SOCIAL`  
**Roadmap item:** `SOCIAL-P1`  
**Baseline:** `main@cf1d8b84f2455c0859f61407773ad9022dff00fa`  
**Repository implementation scope:** Social-owned benchmark planning and evidence acceptance only  
**Protected runtime execution:** `NOT RUN`  
**Status:** `REMATERIALIZED — REPOSITORY ACCEPTANCE HARNESS READY / RUNTIME AUTHORIZATION REQUIRED`

## Purpose

This package rematerializes only the Social-owned remainder of `SOCIAL-P1` after terminal PR #987 and the subsequent current-main correlation. It does not reconstruct the historical `agent/operations-social-p1-tts-runtime-20260915` branch and does not transfer protected runtime ownership from `CAPITAL-AI-OPS` to Social.

The bounded repository slice consists of:

- `server/socialMedia/p1Benchmark.ts` — deterministic 4-fixture × 2-candidate plan and fail-closed evidence validator;
- `tests/unit/socialP1Benchmark.test.ts` — focused contract coverage for 8/8 completion, immutable fixture hashes, timing/RTF, required-term evidence and listening review;
- the existing canonical fixture manifest `reports/SOCIAL_P1_TTS_SAMPLE_MANIFEST_2026-09-11.json`;
- the existing provider-neutral `SOCIAL_TTS_VOICE_CONTRACT.md` and `server/socialMedia/voiceContract.ts`.

No TTS model, model weight, GPU host, provider account, credential, billing capability, production service or publishing action is provisioned by this package.

## Exact benchmark plan

The canonical fixture manifest currently contains exactly four repository-authored fixtures:

1. `de-finance-numbers-v1`;
2. `en-it-architecture-v1`;
3. `de-dialogue-host-v1`;
4. `en-dialogue-cohost-v1`.

The bounded comparison candidates are exactly:

- `qwen3-tts`;
- `chatterbox-multilingual-v3`.

The validator therefore requires exactly `4 × 2 = 8` benchmark cases. Model choice remains outside the provider-neutral semantic request hash; two model executions of the same fixture intentionally share the same semantic `request_hash`, while each runtime case has a distinct `benchmark_case_id`, provider/model result identity and runtime evidence.

## Required evidence per case

A case is accepted only when all of the following are present and internally correlated:

- exact benchmark case, candidate, fixture and provider-neutral `request_hash`;
- successful `TtsSynthesisResult` validated by the existing Social TTS contract;
- immutable audio SHA-256 and audio metadata;
- exact provider/model identity plus model-artifact SHA-256 and license reference;
- runtime ID/version, hardware identity, dependency identity and dependency SHA-256;
- first-audio latency, total latency and real-time factor (RTF), with RTF mathematically consistent with total latency / audio duration;
- transcript text + transcript SHA-256 + transcript-engine identity;
- one explicit PASS evidence entry for every fixture `required_term`;
- explicit listening-review PASS with timestamp, reviewer/evidence references and notes.

`7/8`, failed synthesis, missing audio hash, missing runtime/dependency identity, inconsistent RTF, missing/failed required-term evidence or failed/missing listening review can never be promoted to P1 PASS.

## Ownership and protected-action boundary

`CAPITAL-AI-SOCIAL` owns the fixture set, provider-neutral request/result semantics, benchmark case construction and acceptance semantics.

The real acoustic benchmark remains protected runtime work. Model artifact acquisition, dependency/runtime provisioning, GPU/host execution, provider credentials or billing, and production/runtime mutation remain under the applicable operational/protected-action owner, commonly `CAPITAL-AI-OPS`, and require a separate explicit Human/Owner authorization before execution.

This package itself performs no protected runtime or external provider mutation.

## Exit gate

Repository-side materialization is complete when the 4×2 plan is deterministic and focused tests prove fail-closed acceptance semantics.

`SOCIAL-P1` itself remains `PARTIAL / RUNTIME NOT RUN` until a separately authorized execution returns real evidence for all eight cases and `validateSocialP1BenchmarkEvidence(...)` can truthfully return `8/8 PASS`. Only then may `SOCIAL-P2` be re-correlated from then-current main.
