# Governance Standards Crosswalk — ISO/IEC 42001

**Document ID:** `DOC-GOV-STANDARDS-CROSSWALK-2026-08-19`  
**Authority ID:** `AUTH-GOV-STANDARDS-CROSSWALK`  
**Version:** `1.3.0`  
**Date:** `2026-09-14`  
**Status:** governance benchmark / non-certification evidence

## Purpose

This crosswalk maps CAPITAL-AI controls to the currently adopted external management-system benchmark. It is deliberately **not a second governance hierarchy**.

The direction of authority is:

```text
Applicable obligations / explicit Owner decisions
        ↓
CAPITAL-AI stable Authorities + Controls
        ↓
Crosswalk: external benchmark ↔ internal control/evidence
        ↓
Gap / coverage evidence
```

The crosswalk answers: **“Which CAPITAL-AI control/evidence addresses this external practice, and where is the gap?”** It does not answer: **“Which external paragraph automatically becomes repository policy?”**

## Why this supports one governance structure

Without a crosswalk, teams often copy external-standard language into separate policies, checklists and provider instructions. That creates parallel control sets with different names, owners and lifecycles.

With the crosswalk:

- one CAPITAL-AI `CTRL-*` remains the operative control;
- external references are mappings/benchmarks attached to that control;
- one implementation can provide evidence for several mapped external outcomes;
- a standards revision changes the mapping/gap analysis first, not repository authority automatically;
- missing coverage becomes a visible gap that can be evaluated through the normal ADR/ESS/Owner process.

This therefore **reduces**, rather than increases, governance duplication when maintained as a mapping layer.

## Current standards baseline

- **ISO/IEC 42001:2023** — published AI management-system standard; used for AIMS structure and continual-improvement/PDCA concepts.

No other external framework is a current CAPITAL-AI standards baseline, control source, mandatory benchmark, required evidence source or gap authority.

## Crosswalk

| CAPITAL-AI capability | ISO/IEC 42001 management-system concept | Repository implementation |
|---|---|---|
| Governance scope and policy | context, leadership, AI policy | `AGENTS.md`, authority registry, control catalog |
| Roles and authority | leadership, roles/responsibilities | Human-only merge, stable authority identities |
| Risk-based planning | planning, AI risk assessment/treatment | pre-check, risk classification, fail-closed protected changes |
| Controlled implementation | operation | scoped branches, TypeScript/tests/build/security invariants |
| Supplier/tool governance | operational planning/control | reuse evaluation, plugin/OSS review, supply-chain attestation |
| Evidence and traceability | documented information, performance evaluation | ADR/ESS registries, evidence records, exact-SHA deployment identity |
| Independent verification | monitoring, measurement, analysis/evaluation | GitHub hosted `build-and-test`, workflow security, attestation |
| Corrective improvement | nonconformity/corrective action, continual improvement | regression fixes, governance findings, supersession packages |

## PDCA mapping

### PLAN

- resolve current authority and applicable obligations;
- identify scope, risks and parallel writers;
- choose existing/native/plugin/OSS capability before custom code;
- establish stable IDs and expected controls.

### DO

- create a fresh scoped branch from current `main`;
- implement without weakening data integrity, security or Human authority;
- retain ADR/ESS/traceability;
- execute cheap/sandbox checks only when the exact branch state is available.

### CHECK

- validate the Governance Control Plane structurally;
- re-synchronize with current `main`;
- run independent hosted GitHub checks after PR creation;
- verify exact deployed SHA and retained evidence when production is affected.

### ACT

- classify findings and regressions;
- correct or supersede rules through explicit versioned decisions;
- retain superseded/historical evidence;
- update controls/risk treatment without rewriting history.

## Governance impact of the crosswalk

### Positive

1. **Single vocabulary:** internal `AUTH-*`/`CTRL-*` remains the only operative repository control vocabulary.
2. **Coverage visibility:** one matrix shows where the adopted ISO-management outcomes are covered or missing.
3. **Evidence reuse:** branch, CI, attestation, audit and risk evidence can support benchmark mappings without duplicated process.
4. **Change isolation:** an external standard update does not silently mutate repository policy; it first creates a mapping delta/gap.
5. **Auditability:** reviewers can distinguish internal authority, implementation evidence and external benchmark references.

### Risks if implemented incorrectly

A crosswalk becomes harmful if copied external clauses are treated as independent blocking rules, if every standard gets its own competing control IDs, or if “mapped” is reported as “certified/compliant”. The Governance Control Plane therefore treats this document as a **benchmark/evidence layer only**.

## Secure-development minimums

The current control plane independently requires least privilege, separation of authority from evidence, source/identity/version traceability, supply-chain evidence, secure defaults/fail-closed ambiguity, independent final-head validation, explicit security-finding treatment, and validation of AI/model/tool outputs as untrusted inputs. These are CAPITAL-AI controls.

## Applicability warning

This crosswalk means CAPITAL-AI uses ISO/IEC 42001 as an engineering/governance benchmark. It does **not** mean ISO/IEC 42001 certification has been awarded, every ISO requirement is fully implemented or independently audited, CAPITAL-AI is necessarily a regulated financial entity, or a particular AI system is legally classified as high-risk. Those conclusions require separate scope, legal and external-assurance evidence.
