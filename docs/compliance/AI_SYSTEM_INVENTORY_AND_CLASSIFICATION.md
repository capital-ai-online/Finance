# AI System Inventory & Applicability Classification

**Status:** ACTIVE ENGINEERING CONTROL AFTER HUMAN MERGE  
**Date:** 2026-08-22  
**Owner:** Security & Compliance / CAPITAL-AI Owner  
**Parent authorities:** ESS-0019 · ADR-0096 · AI Content Transparency Contract

> Engineering/applicability evidence only; not legal advice and not a blanket AI Act compliance determination.

## Classification rule

AI Act risk/role classification is **use-case based**, not inferred from the fact that CAPITAL-AI is a FinTech application. Each materially distinct AI use case must record intended purpose, affected persons, provider/deployer role hypotheses, decision authority, data/evidence sources, Human oversight and reclassification triggers.

## Current inventory

| System/use case | Intended purpose | Runtime authority | Working AI Act risk view | Current controls |
|---|---|---|---|---|
| User-facing AI chat | explanatory/research dialogue over governed application/RAG context | no financial decision authority | Art. 50 interaction transparency relevant; high-risk classification not identified from current intended purpose | provider-neutral routing, prompt registry, RAG evidence, AI evaluation, transparency envelope |
| Enterprise Screener AI summary | short natural-language explanation of already computed screening/evidence state | presentation only; cannot create/modify score | Art. 50 interaction/content transparency relevant; high-risk classification not identified from current intended purpose | visible AI disclosure, no fabricated market claims, transparency envelope |
| Documentary Maintenance AI | semantic documentation freshness/patch planning | branch-only proposal; Human merge; no financial runtime authority | internal/supporting AI; legal role/use-case classification remains reviewable | Agent IAM, Platform Director decision, protected paths, current-main binding, no autonomous merge |
| Archive Retention Agent | deterministic retention/deletion eligibility planning | deterministic planner; no physical deletion | not an AI legal-risk classification dependency; destructive mutation remains human-gated | retention policy, owner approval, kill switch, maintenance branch, `mutationPerformed=false` |
| Social/marketing AI-assisted content | content preparation where explicitly invoked | no financial result authority | synthetic/generated-content duties must be assessed per published content type and surface | Social Media governance, disclosure/brand controls; no market-evidence fabrication |
| Research/evidence acquisition via model tooling | acquisition/summarization of research context | cannot directly create productive MarketData/Score evidence | use-case review required when provider/tool changes | Evidence/DQ gates; provider output is untrusted/non-authorizing |

## Current high-risk assessment boundary

For the currently documented **asset/market research, screening explanation and documentation-support intended purposes**, no Annex III high-risk use case is asserted by this repository control.

This is not a permanent exemption. Reclassification/legal review is mandatory before introducing use cases such as:

- natural-person creditworthiness or credit scoring;
- risk assessment/pricing for life or health insurance where covered by applicable high-risk rules;
- employment, worker management or recruitment decisions;
- biometric categorization/identification or emotion recognition;
- access to essential private/public services or benefits;
- law-enforcement, migration, justice or democratic-process use cases;
- any materially changed intended purpose that meets an applicable high-risk category.

## Prohibited-practice onboarding gate

Before a new AI use case is promoted beyond research, record whether it could involve a prohibited practice and fail closed until Security/Compliance review resolves uncertainty. Repository engineering controls must not be interpreted as legal permission.

## Role record

For each system, record factual evidence for relevant roles (for example provider, deployer, importer/distributor where applicable). Model/API vendors and the CAPITAL-AI application can occupy different roles for different systems; the repository must not infer legal roles solely from technical provider names.

## Transparency gate

User-facing generative/interactive content must expose its AI origin where required by the application transparency contract. Machine-readable metadata must separate:

`retrieval -> grounding verification -> citation completeness -> Human review`.

`retrieved` must never be promoted automatically to `grounded` or `citation complete`.

## Change triggers

Re-run this inventory/classification when any of the following changes materially:

- intended purpose or target user;
- automated decision authority;
- natural-person eligibility/credit/employment/insurance function;
- AI provider/model or external tool with new capability boundary;
- biometric/sensitive-personal-data processing;
- production execution or autonomous financial decision capability;
- public synthetic-content generation/distribution;
- applicable legal guidance or binding law.

## Claim rule

Until factual/legal applicability is established, CAPITAL-AI must not claim blanket `AI Act compliant`. Engineering controls may be described precisely, e.g. “AI-interaction disclosure implemented” or “use-case classification control established,” with scope/evidence stated.
