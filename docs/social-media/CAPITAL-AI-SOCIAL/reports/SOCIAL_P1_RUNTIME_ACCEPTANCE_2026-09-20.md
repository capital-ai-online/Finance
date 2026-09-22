# SOCIAL-P1 — Runtime Acceptance Correlation

**Project:** `CAPITAL-AI-SOCIAL`  
**Roadmap item:** `SOCIAL-P1`  
**Date:** 2026-09-20  
**Baseline:** `main@c307ab9a4e0eb5ba415b70da7a84bff1a7dc803b`  
**Evidence status:** `TECHNICAL_RUNTIME_EVIDENCE_PRESENT / HUMAN_LISTENING_FAILED_7_OF_8 / PROSODY_REMEDIATION_REQUIRED`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`

## Purpose

This report reconciles the previously documented `NOT RUN` SOCIAL-P1 acoustic/runtime state with the real runtime and ASR evidence that is now merged on current main.

It does **not** manufacture a human listening score, MOS, subjective quality decision, provider authority or publication approval.

## Runtime evidence

### Real 8-case benchmark

- GitHub Actions run: `35472686350`
- Job: `105976424291` — `real-8-case-modal-runtime`
- Exact source head: `9b43849bb16be69ac93f95ca1ccc14eec8fd7920`
- Runtime/WAV artifact: `10594080366`
- Artifact digest: `sha256:6b67f244ae765bcdb97d3da6ef00e42cf9bc30057eddcd5028e9de350e5bfdab`
- Billing-preflight artifact: `10594205065`
- Runtime result: GitHub job conclusion `success`
- Execution path: Modal L40S through the owner-routed Operations boundary

The job completed the real 4 fixtures × 2 engines benchmark, downloaded the immutable runtime bundle and uploaded the WAV/runtime evidence.

### Finance remediation evidence

- GitHub Actions run: `35485889860`
- Artifact: `10598205180`
- Artifact digest: `sha256:ac235dbc805e51defb3d000e502d1bb944ca8c835b638b5367ccd2a091d7b5c8`
- Scope: one regenerated Chatterbox `de-finance-numbers-v1` sample
- Accepted audio SHA-256 bound by the merged workflow:
  `78b1dac9f55bb7cda41b8c57d6fafa6447fe5b9d852c8dec1ad152b2b3ef5303`

## ASR / intelligibility evidence

The merged SOCIAL-P1 ASR implementation was validated on PR #1084.

Final exact-head evidence:

- PR #1084 head: `8ded6e902ec3579458ba0cc478ecf111ecda30d8`
- Merge commit: `49aa9855d8c58527122b10abd47016fa9990910e`
- Final ASR run: `35486731963` / run #47
- Job: `106014932311` — `rematch-existing-de-finance-evidence`
- Job conclusion: `success`
- Final rematch artifact: `10598396122`
- Artifact digest: `sha256:a51d69b87890bad47a09b3cbe6d44d39d38b6107f6a813feebd201e2c778b612`

The final gate re-used the existing immutable Chatterbox Finance audio and existing Whisper transcripts. It did not regenerate TTS or rerun Whisper. The current matcher accepted the narrow `BTC` segmentation case (`BT, C`) and the final required-term gate passed.

## Contract correlation

The following SOCIAL-P1 evidence classes are now materially present:

| Required evidence | State | Evidence |
|---|---|---|
| real synthesis output | PRESENT | run `35472686350` + artifact `10594080366` |
| immutable audio identity | PRESENT | runtime artifact hashes; Chatterbox Finance SHA explicitly bound in merged workflow |
| exact runtime/model identity | PRESENT IN RUNTIME ARTIFACT | runtime evidence bundle produced by the pinned Modal benchmark harness |
| measured runtime/latency evidence | PRESENT IN RUNTIME ARTIFACT | real benchmark job output/runtime records |
| license/provenance inventory | PRESENT IN RUNTIME ARTIFACT | model-provenance/runtime inventory emitted by the benchmark harness |
| transcript / required-term evidence | PASS | final ASR run `35486731963` |
| human listening review | **RECORDED — 1 PASS / 7 FAIL** | `SOCIAL_P1_HUMAN_LISTENING_2026-09-22.json` binds every verdict to the exact audio SHA-256 |
| Social final subjective acceptance | **FAIL / REMEDIATION REQUIRED** | seven samples are too choppy/staccato; only sample 4 is usable |

## Current acceptance decision

`SOCIAL-P1` is **not terminal yet**.

Human/Owner listening was completed on 2026-09-22 and is now bound to the exact audio identities. Seven of the eight samples are rejected because the speech is too choppy/staccato. Only sample 4 — `chatterbox-multilingual-v3::de-dialogue-host-v1`, SHA-256 `fa0f6a312095f35607bf470325e643ad3f625c01bd3f3a55e98b0b118afd37b0` — is usable and becomes the sole current acoustic reference.

Therefore:

- technical runtime evidence: **PASS / PRESENT**
- ASR Required-Term evidence: **PASS**
- immutable evidence correlation: **PASS**
- human listening evidence: **RECORDED — 1 PASS / 7 FAIL**
- prior 8-sample quality baseline: **OBSOLETE / HISTORICAL EVIDENCE ONLY**
- overall SOCIAL-P1 terminal exit: **BLOCKED_BY_PROSODY_REMEDIATION**
- SOCIAL-P2 repository preparation: **MAY CONTINUE**
- SOCIAL-P2 consumption of rejected P1 audio: **HELD**

## Exact unblock condition

The owner-correct OPS runtime remediation must return new **German-only** audio candidates with exact immutable runtime evidence. Sample 4 remains unchanged as the comparison reference. Social then requires a new Human/Owner listening PASS for natural connected speech; ASR PASS alone cannot close this gate.

The current remediation contract is `SOCIAL_P1_PROSODY_REMEDIATION_2026-09-22.md`, with the runtime handoff in `SOCIAL_P1_PROSODY_REMEDIATION_TO_OPS_2026-09-22.md`.

## Before / after

| Dimension | Before | After |
|---|---|---|
| runtime execution | `NOT RUN` | real Modal L40S benchmark present |
| generated WAV evidence | absent | immutable artifacts present |
| latency/runtime evidence | absent | runtime records present |
| ASR evidence | absent | final small/large-v3 correlation PASS |
| human listening | absent | recorded: 1 PASS / 7 FAIL |
| SOCIAL-P1 | runtime-blocked | prosody-remediation-blocked |
| SOCIAL-P2 | blocked | repository preparation may continue; rejected P1 audio consumption remains held |


## Human listening update — 2026-09-22

The Human/Owner explicitly declared the previous voice list obsolete for quality selection because the speech is too choppy. Seven exact audio identities are rejected. Sample 4 is the sole usable reference.

This update does not rewrite or delete the original runtime/ASR evidence. It adds the previously missing subjective evidence layer and changes the acceptance outcome from `HUMAN_LISTENING_REQUIRED` to `HUMAN_LISTENING_FAILED_7_OF_8 / PROSODY_REMEDIATION_REQUIRED`.
