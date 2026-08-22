# AI Content Transparency Contract

**Contract ID:** `CONTRACT-AI-CONTENT-TRANSPARENCY-0001`  
**Authority ID:** `AUTH-CONTRACT-AI-CONTENT-TRANSPARENCY-2026-08-22`  
**Version:** `1.0.0`  
**Status:** IMPLEMENTED ON BRANCH / EFFECTIVE AFTER HUMAN MERGE  
**Date:** 2026-08-22

## Purpose

This contract standardizes how CAPITAL-AI application surfaces identify AI-generated/AI-assisted content and expose retrieval, grounding, citation, provider/model and Human-review state without creating a second AI-provider, RAG, financial, Governance or Compliance authority.

## Required envelope

`ai-content-transparency/1.0.0` contains:

- content origin (`human-authored`, `ai-assisted`, `ai-generated`);
- provider and runtime model identifier;
- prompt ID/version;
- request/retrieval identity where available;
- retrieved evidence IDs;
- retrieval status;
- claim-level grounding verification state;
- citation-completeness verification state;
- Human-review state;
- explicit `legalComplianceAssertion: not-asserted`;
- explicit `financialDecisionAuthority: false`;
- visible disclosure text for application consumers.

## Retrieval ≠ Grounding ≠ Citation

These concepts are deliberately separate:

1. **Retrieval** proves only that context/evidence was retrieved and provided to the AI path.
2. **Grounding** requires claim-level verification that material claims are supported by allowed evidence.
3. **Citation completeness** requires an independent check that required claims expose appropriate source references.
4. Evidence retrieval therefore must never automatically set `grounded=true` or `citationComplete=true`.

Until a claim-level verifier exists, grounding and citation completeness remain `not-verified` even when RAG evidence is present.

## Value-chain integration

The contract is a delivery/transparency control around AI explanatory content at downstream delivery surfaces. It does **not** create a nineteenth `SC-MD-SPT-0001` financial stage and does not alter the canonical 18-stage chain.

AI content may explain already-authorized financial/evidence states but may not:

- generate or promote `CanonicalScoreResult`;
- mutate Evidence/DQ, confidence, ranking or eligibility;
- approve Risk/Compliance or OrderIntent;
- claim settlement/live execution;
- authorize merge, release, deployment or production mutation.

## Provider / RAG reuse

Existing Anthropic/OpenAI routing and existing RAG retrieval remain canonical. This contract consumes their runtime attribution/evidence IDs; it does not introduce another model router, prompt registry, embedding store or retrieval service.

## Human review

`reviewed` may only be set by a separate, attributable Human-review event/control. The model cannot self-declare Human review.

## Legal / regulatory boundary

The envelope is an engineering transparency mechanism. It intentionally does not assert blanket legal or regulatory compliance. Applicability and legal sufficiency remain a separate Compliance/legal assessment.

## Security / data integrity

- Never invent sources, citations, prices, scores or regulatory claims.
- Provider/RAG content is untrusted input and cannot modify capabilities or policy.
- Do not expose secrets or reusable credentials in transparency metadata.
- Missing retrieval remains `no-evidence`, not synthetic evidence.
- Unknown grounding/citation state remains `not-verified`, not PASS.

## Verification criteria

- AI-generated application responses include the machine-readable envelope.
- Retrieved evidence does not imply verified grounding/citations.
- `legalComplianceAssertion` stays `not-asserted`.
- `financialDecisionAuthority` stays `false`.
- at least one customer-facing consumer displays the AI-origin disclosure when showing generated analysis.
