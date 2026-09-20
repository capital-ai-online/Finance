# SOCIAL-P2 — Short-Video + Voice-over Integration

**Project:** `CAPITAL-AI-SOCIAL`  
**Roadmap item:** `SOCIAL-P2`  
**Started by Human/Owner:** 2026-09-20  
**Baseline:** `main@4f2c746a20a8683d784a1cbe54c763a64ddd1da3`  
**State:** `IN_PROGRESS / PREPARATORY_INTEGRATION / P1_LISTENING_GATE_ENFORCED`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`

## Goal

Extend the existing deterministic Pillow/FFmpeg media path so an already validated
`TtsSynthesisResult` can be bound into a vertical short without creating a second
renderer, second publishing path, provider mutation, or implicit publication authority.

## First implementation slice

The existing `scripts/media/capital_ai_media.py` renderer now supports an optional
voice-over binding. The binding is accepted only when all of the following are present:

- local relative audio path;
- exact audio SHA-256;
- exact TTS request SHA-256;
- canonical content package identity;
- immutable candidate-content SHA-256;
- runtime evidence reference;
- license evidence reference;
- Human/Owner listening-review reference;
- explicit `acceptanceStatus=PASS`.

Any missing or non-PASS listening state fails closed before FFmpeg consumes the audio.

## Security and authority boundaries

- remote audio URLs are rejected;
- absolute paths and manifest-directory traversal are rejected;
- audio bytes must match the declared SHA-256;
- output remains `publishReady=false`;
- the renderer has no OAuth, provider credentials, database, billing or publication authority;
- FFmpeg nonfree/GPL guardrails remain unchanged;
- no existing P1 audio is promoted to accepted voice-over merely because ASR passed.

## Mux behavior

For an accepted voice-over binding, the existing short-video path:

1. renders the existing deterministic 1080×1920 frame sequence;
2. maps exactly one local audio stream;
3. pads/trims audio to the bounded video duration;
4. encodes audio as AAC while retaining the existing MPEG-4 video path;
5. verifies that the output contains exactly one video stream and exactly one audio stream;
6. preserves the immutable voice evidence in the emitted asset manifest.

The silent path remains supported and is verified to contain no unexpected audio stream.

## Current gate

The implementation path is now under construction, but the known SOCIAL-P1 Human
Listening requirement is intentionally preserved. Until a Human/Owner listening review
is materialized against an exact audio identity, a real P1 audio artifact cannot pass the
new P2 voice-over validator.

This means P2 can advance structurally without converting ASR evidence into a fabricated
subjective-quality decision.

## Remaining P2 work

- bind one accepted real P1 `TtsSynthesisResult` after Human Listening evidence exists;
- add the approximately-20-second canonical P2 fixture;
- validate exact input/source/brand hashes;
- validate A/V duration/synchronization against the fixture;
- materialize render evidence and output SHA-256;
- independently confirm an acceptable production FFmpeg build/license profile;
- keep publication outside this work package.

## Exit gate

P2 reaches terminal exit only when a deterministic approximately-20-second fixture render
contains a validated voice-over binding, exact source/input/output hashes, voice manifest,
brand/logo validation, negative tests, A/V evidence and `publishReady=false`, with no
direct publication side effect.
