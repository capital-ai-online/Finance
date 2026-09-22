# SOCIAL-P1 Prosody Remediation → CAPITAL-AI-OPS

**Correlation ID:** `SOCIAL-P1-PROSODY-REMEDIATION-20260922`  
**Source:** `CAPITAL-AI-SOCIAL`  
**Target:** `CAPITAL-AI-OPS`  
**Relationship:** foreign execution — protected/runtime implementation  
**Current-main baseline:** `a328f9cfdb1dba2845aa0e5c2c78e5a286a0e64d`

## Completed by Social

- Human/Owner listening evidence is bound to all eight exact audio hashes.
- Seven cases are rejected for choppy/staccato prosody.
- The former 8-sample list is historical evidence only and no longer a valid quality baseline.
- Sample 4 is retained as the only usable reference:
  - case: `chatterbox-multilingual-v3::de-dialogue-host-v1`
  - SHA-256: `fa0f6a312095f35607bf470325e643ad3f625c01bd3f3a55e98b0b118afd37b0`

## Remaining OPS scope

Owner-correctly inspect and remediate the existing TTS runtime path. The current repository runtime shows an important contrast:

- the usable sample 4 uses Chatterbox with canonical German dialogue text;
- the German finance Chatterbox path applies explicit segmented letter pronunciation text before `model.generate(...)`;
- Chatterbox currently runs with provider built-in conditioning and no Social designed-persona instruction.

OPS should therefore determine with reproducible runtime evidence whether staccato output comes from text/pronunciation projection, model/runtime parameters, conditioning behavior, or another bounded runtime cause.

## Required next runtime evidence

- German-only remediation samples;
- unchanged sample-4 reference for A/B comparison;
- exact model/runtime/dependency identity and audio SHA-256;
- no forced English regeneration;
- ASR Required-Term evidence;
- return to Social for Human listening; no automated subjective PASS.

## Exit / continuation condition

Return owner-correct evidence when the German remediation candidates can be compared against sample 4. Social then performs the Human listening gate and decides whether P1 can close or another bounded remediation is required.
