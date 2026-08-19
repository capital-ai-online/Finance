# Governance Standards Crosswalk — ISO/IEC 42001 + NIST SSDF

**Document ID:** `DOC-GOV-STANDARDS-CROSSWALK-2026-08-19`  
**Authority ID:** `AUTH-GOV-STANDARDS-CROSSWALK`  
**Version:** `1.0.0`  
**Date:** `2026-08-19`  
**Status:** governance benchmark / non-certification evidence

## Purpose

Map the CAPITAL-AI repository governance control plane to the management-system and secure-development concepts used as design baselines. This document is a control-design crosswalk, not an ISO certification statement and not a legal applicability determination.

## Crosswalk

| CAPITAL-AI capability | ISO/IEC 42001 management-system concept | NIST SSDF / AI augmentation concept | Repository implementation |
|---|---|---|---|
| Governance scope and policy | context, leadership, AI policy | PO: Prepare the Organization | `AGENTS.md`, authority registry, control catalog |
| Roles and authority | leadership, roles/responsibilities | PO: define roles and responsibilities | Human-only merge, stable authority identities |
| Risk-based planning | planning, AI risk assessment/treatment | PO + PW: prepare/protect software | pre-check, risk classification, fail-closed protected changes |
| Controlled implementation | operation | PW: Produce Well-Secured Software | scoped branches, TypeScript/tests/build/security invariants |
| Supplier/tool governance | operational planning/control | PO/PS: supplier and provenance protection | reuse evaluation, plugin/OSS review, supply-chain attestation |
| Evidence and traceability | documented information, performance evaluation | RV: Respond to Vulnerabilities / evidence feedback | ADR/ESS registries, evidence records, exact-SHA deployment identity |
| Independent verification | monitoring, measurement, analysis/evaluation | PW/PS verification practices | GitHub hosted `build-and-test`, workflow security, attestation |
| Corrective improvement | nonconformity/corrective action, continual improvement | RV + organizational feedback | regression fixes, governance findings, supersession packages |
| AI-specific secure development | AI lifecycle governance | SP 800-218A augmentation/profile concepts | model/tool boundary controls, untrusted retrieved content, AI evidence rules |

## PDCA mapping

### PLAN

- resolve current authority and applicable obligations;
- identify scope, risks and open parallel work;
- choose existing/native/plugin/OSS capability before custom code;
- establish stable IDs and expected controls.

### DO

- create a fresh scoped branch from current `main`;
- implement without weakening data integrity, security or Human authority;
- retain architecture/ADR/ESS traceability;
- execute cheap or sandbox checks where the exact repository snapshot is actually available.

### CHECK

- validate the governance control plane structurally;
- re-synchronize with current `main`;
- run independent hosted GitHub checks after PR creation;
- verify exact deployed SHA and retained evidence when production is affected.

### ACT

- classify findings and regressions;
- correct or supersede rules through explicit versioned decisions;
- retain superseded/historical evidence;
- update controls and risk treatment without rewriting history.

## Secure-development minimums

The governance control plane requires at least:

1. least privilege and protected credentials;
2. separation of authority from evidence;
3. deterministic source/identity/version traceability;
4. immutable or reviewable supply-chain evidence for release promotion;
5. secure defaults and fail-closed handling of security-critical ambiguity;
6. independent technical validation before Human Merge;
7. explicit vulnerability/security finding treatment rather than bypassing gates;
8. AI/model/tool outputs treated as untrusted until validated.

## Applicability warning

The presence of this crosswalk means CAPITAL-AI uses the standards as engineering/governance benchmarks. It does **not** mean ISO/IEC 42001 certification has been awarded, every ISO control is fully implemented or independently audited, CAPITAL-AI is necessarily a regulated financial entity, or a particular CAPITAL-AI AI system is classified as high-risk under applicable law. Those conclusions require separate scope, legal and external assurance evidence.