# OPS-SOCIAL-P1-PROSODY-01 — Chatterbox Natural Prosody Remediation

**Project:** `CAPITAL-AI-OPS`  
**PVC:** `PVC-02 — Controlled Implementation`  
**Source handoff:** `SOCIAL-P1-PROSODY-REMEDIATION-20260922`  
**Baseline:** `main@4c4a88e7f83150191c81134439e7bc9a1145ad4a`  
**State:** `ACTIVE / IMPLEMENTATION_IN_BRANCH / RUNTIME_EVIDENCE_PENDING`

## Objective

Return one new German Chatterbox Finance candidate that can be compared directly with the Human-approved sample-4 reference without changing TTS architecture or introducing a second provider.

## Root-cause experiment

The first experiment changes exactly one acoustic input dimension: the Chatterbox Finance synthesis text.

The rejected Finance remediation used forced letter-by-letter phrases such as `E, Tee, Haa` and `Capital, A, I`. The accepted sample 4 used normal connected German dialogue. This slice therefore removes forced segmentation and uses one natural sentence containing `BTC`, `ETH` and `CAPITAL-AI`.

Chatterbox generation parameters remain explicitly pinned to the model API defaults used by the accepted reference path:

- exaggeration `0.5`;
- cfg_weight `0.5`;
- temperature `0.8`;
- repetition_penalty `1.2`;
- min_p `0.05`;
- top_p `1.0`.

This isolates text/prosody projection from parameter tuning.

## Runtime boundary

The existing Modal Starter workflow remains the execution path. It must:

1. pass the existing monthly-budget preflight;
2. generate exactly one `chatterbox-multilingual-v3::de-finance-numbers-v1` WAV;
3. download and hash-verify the immutable accepted sample-4 reference;
4. run Whisper small and large-v3 over only the new German Finance candidate;
5. upload candidate + reference + ASR + billing evidence in one artifact;
6. never synthesize a Human listening PASS.

## Acceptance

Repository implementation is ready when focused unit tests and ordinary PR checks pass.

Runtime evidence is ready when the workflow artifact contains:

- one new Finance WAV with immutable SHA-256;
- sample-4 reference SHA-256 `fa0f6a312095f35607bf470325e643ad3f625c01bd3f3a55e98b0b118afd37b0`;
- exact runtime/model/dependency identity;
- large-v3 Required-Term PASS, with small retained as comparator;
- explicit `HUMAN_LISTENING_REQUIRED`.

Social remains the subjective acceptance owner.
