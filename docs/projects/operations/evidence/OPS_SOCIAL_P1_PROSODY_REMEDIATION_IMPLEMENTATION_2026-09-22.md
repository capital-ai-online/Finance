# OPS-SOCIAL-P1-PROSODY-01 — Implementation Evidence

**Baseline:** `main@4c4a88e7f83150191c81134439e7bc9a1145ad4a`  
**State:** `IMPLEMENTED_IN_BRANCH / HOSTED_RUNTIME_PENDING`

## Before

- Finance Chatterbox synthesis originally inserted forced segmented acronym phrases.
- The first connected-sentence remediation run preserved the natural sentence structure, but Whisper large-v3 observed `ETH` as `S` and `CAPITAL-AI` as `Kapital I`; numbers and BTC passed.
- The inline-letter v5 run recovered `CAPITAL-AI`, but Whisper large-v3 observed `ETH` as `ETA`; accepting `ETA` is intentionally forbidden because it is not a safe semantic equivalent.
- Sample 4 was the only Human-approved voice reference.
- The finance remediation workflow required manual dispatch and did not package sample 4 beside the new candidate.

## Intended after

- Finance Chatterbox keeps one connected German sentence. `CAPITAL-AI` keeps the successful inline `Capital A I` projection; `ETH` is spoken as the canonical asset name `Ethereum` plus its ticker context, while `ETA/ETS/ETI` remain fail-closed.
- Generation defaults are explicit and recorded in runtime evidence rather than being implicit library defaults.
- A same-repository PR on `agent/operations-social-p1-prosody-*` enters the existing budget-gated Modal remediation path automatically.
- The workflow packages the new candidate and immutable sample-4 reference together for direct Human A/B listening.
- ASR remains technical evidence only; subjective acceptance remains Human/Social-owned.

## External API verification

The repository pins Chatterbox source commit `5de7a54aa4e5e2baadb0182dde554908b48b85c2`. Its `ChatterboxMultilingualTTS.generate` signature accepts the explicitly recorded parameters used here: `exaggeration`, `cfg_weight`, `temperature`, `repetition_penalty`, `min_p` and `top_p`.

## Pending evidence

- exact-head PR checks;
- Modal budget preflight;
- one real regenerated German Finance WAV;
- Whisper small/large-v3 correlation;
- Human A/B listening against sample 4.

No runtime PASS is claimed before those observations exist.
