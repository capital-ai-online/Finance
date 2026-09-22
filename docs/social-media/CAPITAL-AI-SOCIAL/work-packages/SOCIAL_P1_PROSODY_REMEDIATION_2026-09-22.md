# SOCIAL-P1 — Natural Prosody Remediation

**Project:** `CAPITAL-AI-SOCIAL`  
**Roadmap item:** `SOCIAL-P1`  
**Baseline:** `main@a328f9cfdb1dba2845aa0e5c2c78e5a286a0e64d`  
**State:** `ACTIVE / HUMAN_LISTENING_FAILED_7_OF_8 / REMEDIATION_REQUIRED`  
**Owner boundary:** Social acceptance semantics; runtime implementation remains `CAPITAL-AI-OPS`.

## Trigger

Human/Owner listening on 2026-09-22 rejected seven of the eight retained benchmark samples because the delivery is too choppy/staccato. Only sample 4 — `chatterbox-multilingual-v3::de-dialogue-host-v1`, audio SHA-256 `fa0f6a312095f35607bf470325e643ad3f625c01bd3f3a55e98b0b118afd37b0` — is usable.

The prior 8-sample list remains immutable historical evidence, but it is **obsolete as a quality baseline**.

## Remediation objective

Converge on connected, natural German speech while preserving the existing provider-neutral TTS architecture. Do not create a second TTS stack and do not expand into publication.

The accepted sample-4 acoustic behavior is the current reference anchor. Future candidate output must be judged against that reference for:

- continuous phrasing rather than syllabic/staccato delivery;
- natural sentence-level prosody and pause placement;
- stable volume/timbre without abrupt phrase resets;
- clear pronunciation of finance and architecture terminology;
- synthetic-persona suitability without real-person imitation.

## Bounded next slice

1. Preserve sample 4 unchanged as the comparison reference.
2. Retire samples 1–3 and 5–8 from active quality acceptance; keep them only as rejected/historical evidence.
3. Generate **German-only** remediation audio; no new English acceptance fixtures.
4. First remediation attempt stays on the existing Chatterbox path and investigates why the canonical German dialogue sample is fluid while other samples become staccato.
5. Avoid forced letter-by-letter segmentation as a prosody fix. Pronunciation projection must not destroy sentence flow.
6. If the existing Chatterbox path cannot reproduce sample-4-level continuity for the required German finance/architecture text, return evidence to Social before adding another runtime candidate.
7. Every new sample must retain immutable audio hash, exact runtime/model identity, ASR required-term evidence and Human/Owner listening evidence.

## Acceptance gate

A remediation sample is not accepted merely because ASR passes. It requires Human/Owner listening PASS for natural continuity.

`SOCIAL-P1` remains non-terminal until the required German production-relevant fixtures meet that gate. P2 may continue repository preparation but must not consume rejected P1 audio.

## Non-goals

No new publishing authority, no new productive PVC, no provider credential/IAM/billing change, no synthetic Human PASS, no English regeneration, and no duplicate TTS/media architecture.
