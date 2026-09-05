# AI System Inventory & Applicability Classification

**Status:** ACTIVE ENGINEERING / APPLICABILITY EVIDENCE — NO BLANKET LEGAL CLASSIFICATION  
**Date:** 2026-09-05  
**Owner:** Security & Compliance / CAPITAL-AI Owner  
**Parent authorities:** ESS-0019 · ADR-0096 · AI Content Transparency Contract  
**COMP-01 baseline:** `main@04258ce9122dd600707aa25feb431282c715d104`

> Engineering/applicability evidence only; not legal advice and not a blanket AI Act compliance determination.

## Current legal-source baseline for COMP-01

The current external legal source used for applicability correlation is the consolidated Regulation (EU) 2024/1689 as of 27 July 2026, including Regulation (EU) 2026/1744. This source is binding law where applicable, but this repository document does not decide legal role or legal sufficiency by itself.

- Consolidated AI Act: `https://eur-lex.europa.eu/eli/reg/2024/1689/2026-07-27/eng`
- Amending Regulation (EU) 2026/1744: `https://eur-lex.europa.eu/eli/reg/2026/1744/oj`

Current applicability timing relevant to this inventory:

- the Regulation generally applies from 2 August 2026;
- Chapters I and II, including the AI-literacy provision in Article 4, have applied since 2 February 2025, subject to the current consolidated exceptions;
- the amended high-risk timing for Chapter III Sections 1–3 is later and depends on the Article 6 route;
- Article 50 transparency is not treated here as a blanket pass/fail conclusion; system/content-specific facts and any applicable transition must be assessed against the current consolidated text.

## Classification rule

AI Act risk/role classification is **use-case based**, not inferred from the fact that CAPITAL-AI is a FinTech application. Each materially distinct AI use case must record intended purpose, affected persons, provider/deployer role hypotheses, decision authority, data/evidence sources, Human oversight and reclassification triggers.

A technical provider name, model name or application label is factual context only. It is not by itself a legal provider/deployer classification.

## Current inventory

| System/use case | Intended purpose | Runtime authority | Working AI Act risk view | Current controls |
|---|---|---|---|---|
| User-facing AI chat | explanatory/research dialogue over governed application/RAG context | no financial decision authority | direct natural-person interaction and transparency are relevant factual surfaces; high-risk classification is not asserted from current intended purpose | provider-neutral routing, prompt registry, RAG evidence, AI evaluation, transparency envelope |
| Enterprise Screener AI summary | short natural-language explanation of already computed screening/evidence state | presentation only; cannot create/modify score | AI-generated explanation is a transparency-relevant factual surface; high-risk classification is not asserted from current intended purpose | visible AI disclosure, no fabricated market claims, transparency envelope |
| Documentary Maintenance AI | semantic documentation freshness/patch planning | branch-only proposal; Human merge; no financial runtime authority | internal/supporting AI; legal role/use-case classification remains reviewable | Agent IAM, Platform Director decision, protected paths, current-main binding, no autonomous merge |
| Archive Retention Agent | deterministic retention/deletion eligibility planning | deterministic planner; no physical deletion | repository currently describes a deterministic planner and does not assert a positive AI-system legal classification | retention policy, owner approval, kill switch, maintenance branch, `mutationPerformed=false` |
| Social/marketing AI-assisted content | content preparation where explicitly invoked | no financial result authority | synthetic/generated-content duties must be assessed per published content type and surface | Social Media governance, disclosure/brand controls; no market-evidence fabrication |
| Research/evidence acquisition via model tooling | acquisition/summarization of research context | cannot directly create productive MarketData/Score evidence | use-case/role review required when provider/tool or capability boundary changes | Evidence/DQ gates; provider output is untrusted/non-authorizing |

## COMP-01-B factual role-classification execution

The table below records what current repository evidence can establish without inventing a legal role.

| System/use case | Current factual role evidence | Legal role status | Decision-authority evidence | Next gate |
|---|---|---|---|---|
| User-facing AI chat | CAPITAL-AI exposes an AI interaction surface; the application contract carries provider/model attribution and visible AI-origin disclosure | `REQUIRES_LEGAL_REVIEW` — provider/deployer/other Article 3 role not conclusively classified in current repository evidence | `financialDecisionAuthority=false`; no score/order/settlement authority | confirm actual system supply/use chain, model/provider contractual relation, market-facing responsibility and competent legal role determination |
| Enterprise Screener AI summary | CAPITAL-AI presents AI-generated explanatory text over already computed screening/evidence state | `REQUIRES_LEGAL_REVIEW` — legal role not conclusively classified | presentation only; cannot create/modify canonical score | confirm model/provider chain and whether CAPITAL-AI is provider, deployer or occupies another role for this concrete system |
| Documentary Maintenance AI | internal documentation maintenance proposal under branch/Human-merge controls | `NOT_ASSESSED / ROLE REVIEW IF MATERIAL` | no financial runtime authority; no autonomous merge | classify only if the factual legal role matters for an applicable obligation; retain internal-use facts |
| Archive Retention Agent | current implementation description is deterministic eligibility planning with `mutationPerformed=false` | `NO POSITIVE AI LEGAL CLASSIFICATION ASSERTED` | no physical deletion authority | re-open only if implementation becomes an AI system or capability changes materially |
| Social/marketing AI-assisted content | AI-assisted content may be prepared for public distribution on configured publication surfaces | `REQUIRES_LEGAL_REVIEW` per content/system role and publication path | no financial result authority | inventory actual generated/synthetic content types and active publication channels; then classify role/content obligations |
| Research/evidence acquisition via model tooling | model tooling may acquire/summarize research context but output is non-authorizing and cannot directly become productive MarketData/Score evidence | `NOT_ASSESSED / REQUIRES_LEGAL_REVIEW IF ROLE-SPECIFIC DUTY IS TRIGGERED` | no productive evidence/score authority | re-assess on provider/tool/capability change or if research output becomes a regulated/user-facing function |

### COMP-01-B result

`PARTIALLY_APPLICABLE / NOT_ASSESSED` remains the correct bounded status for the overall AI role/use-case work item. The repository now contains current factual evidence per use case, but it still lacks a competent legal provider/deployer classification for every material system. No role is guessed to manufacture closure.

## Current high-risk assessment boundary

For the currently documented **asset/market research, screening explanation and documentation-support intended purposes**, no Annex III high-risk use case is asserted by this repository control.

This is not a permanent exemption or legal conclusion. The current consolidated AI Act changed parts of the high-risk application timeline in 2026; reclassification/legal review remains mandatory before a materially different intended purpose is promoted.

Reclassification/legal review is mandatory before introducing use cases such as:

- natural-person creditworthiness or credit scoring;
- risk assessment/pricing for life or health insurance where covered by applicable high-risk rules;
- employment, worker management or recruitment decisions;
- biometric categorization/identification or emotion recognition;
- access to essential private/public services or benefits;
- law-enforcement, migration, justice or democratic-process use cases;
- any materially changed intended purpose that meets an applicable high-risk category.

## Prohibited-practice onboarding gate

Before a new AI use case is promoted beyond research, record whether it could involve a prohibited practice and fail closed until Security/Compliance review resolves uncertainty. Repository engineering controls must not be interpreted as legal permission.

## Role record requirements

For each system, retain factual evidence for relevant legal-role analysis, including where available:

- system/application owner and the entity under whose name the system is supplied or used;
- external model/API provider and contractual supply chain;
- whether CAPITAL-AI develops, integrates, places on the market, puts into service or uses the system under its authority;
- intended purpose and target users/affected persons;
- decision authority and Human oversight;
- public/customer-facing distribution surface;
- material modification or downstream-provider facts where relevant.

Model/API vendors and the CAPITAL-AI application can occupy different roles for different systems. The repository must not infer legal roles solely from technical provider names.

## Transparency gate

User-facing generative/interactive content must expose its AI origin where required by the application transparency contract. Machine-readable metadata must separate:

`retrieval -> grounding verification -> citation completeness -> Human review`.

`retrieved` must never be promoted automatically to `grounded` or `citation complete`.

The existing application contract explicitly keeps `legalComplianceAssertion: not-asserted` and `financialDecisionAuthority: false`.

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
