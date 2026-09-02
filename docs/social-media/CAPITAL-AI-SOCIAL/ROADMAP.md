# CAPITAL-AI Social Media Roadmap

**Project ID:** `CAPITAL-AI-SOCIAL`  
**Document role:** roadmap / non-authorizing domain projection  
**Status:** `ACTIVE — CANONICAL SOCIAL DOMAIN ROADMAP`  
**Version:** 2.2.0  
**Date:** 2026-09-02  
**Primary Project Value Chain ownership:** `[]`  
**Trust root:** `/AGENTS.md`

## Purpose

Social owns channel-specific content packaging, adaptation, publishing preparation, evidence and performance assessment. It owns no productive PVC stage and does not create publishing, Security, Compliance, Quality, merge or production authority.

## Human-readable workflow

```text
source content / communication intent
→ Social Roadmap
→ applicable ADR / ESS / content contract
→ Social-owned implementation / tests / evidence
→ protected external publication only through the owning authorized execution path
```

Where productive work belongs to another project, resolve the affected PVC / Primary Owner and use that project's Roadmap instead of a post-PVC handoff-policy overlay.

## Social value chain

```text
Canonical Source Content
→ Campaign / Communication Intent
→ Social Content Package
→ Channel Adaptation
→ Compliance / Policy Check
→ Publishing Approval
→ Publishing Preparation
→ Provider execution by authorized owner
→ Publication Evidence
→ Performance Evidence
→ Finding / Drift
→ Optimization
```

## Core invariants

- content generation is not publishing approval;
- provider adapter is not publishing authority;
- no autonomous external publication;
- no credentials in roadmap/evidence;
- no fabricated engagement metrics;
- financial statements remain evidence-bound;
- changed content requires fresh approval where approval is required;
- no duplicate generator, provider adapter or publishing path;
- current Git evidence uses `main SHA`, `branch head SHA`, `PR head SHA` and `merge SHA`.

## External boundaries

| Domain | Owner | Social relationship |
|---|---|---|
| Canonical content/provenance | `CAPITAL-AI-DOC / PVC-03` | consume traceable source content |
| Security | `CAPITAL-AI-SEC` | independent Security requirements/findings/verification |
| Compliance | `CAPITAL-AI-COMP` | independent applicability/compliance assessment |
| Quality | `CAPITAL-AI-QM` | independent assessment where applicable |
| Protected external execution | owning authorized project, commonly OPS for operational publication | Social prepares evidence/payload; does not self-authorize |

## Workstreams

### SOCIAL-01 — Content package contract
**State:** ACTIVE BASELINE

Maintain one canonical Social content package with source/provenance, channel, copy/media references, required disclosures and approval/evidence identity.

### SOCIAL-02 — Channel adaptation
**State:** ACTIVE

Adapt content to provider/channel constraints without altering canonical financial meaning or fabricating platform capabilities.

### SOCIAL-03 — Security / Compliance / Quality consumption
**State:** ACTIVE

Consume requirements and findings from the independent cross-cutting domains. Social implements only Social-owned remediation and returns evidence.

### SOCIAL-04 — Publishing preparation
**State:** ACTIVE / NON-AUTHORIZING

Prepare provider-compatible payloads and immutable content identity. Preparation never grants publication authority.

### SOCIAL-05 — Publication and performance evidence
**State:** ACTIVE

Retain provider publication identity, timestamp, content identity and observable performance evidence without fabricating metrics or treating provider analytics as repository authority.

### SOCIAL-06 — Drift / optimization
**State:** ACTIVE

Detect stale copy, policy drift, provider-contract drift and evidence gaps. Optimization follows the same Roadmap/ADR/ESS and approval boundaries as initial work.

## Security compatibility artifact

`handoffs/CAPITAL_AI_SEC_CROSS_PROJECT_HANDOFF.yaml` is historical/non-authorizing compatibility metadata. Current Security-related work is represented in the relevant project Roadmap and independently verified by CAPITAL-AI-SEC.

## Definition of Done

A Social work item is complete when:

- Social ownership is explicit and no productive PVC ownership is invented;
- applicable source/content/ADR/ESS contracts are identified;
- required Security/Compliance/Quality findings are addressed where applicable;
- implementation/tests/evidence are bound to the final PR head;
- no autonomous publishing or hidden provider authority is introduced;
- Human/CODEOWNER performs repository merge;
- protected external publication follows its separately authorized execution path.
