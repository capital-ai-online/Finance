# CAPITAL-AI Marketing Agent Roadmap

> **Status: SUPERSEDED** (2026-08-15)  
> **Nachfolger (Single Point of Trust):** [`docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md`](./SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md) — **Document ID: SEO-GM-ROADMAP-0002**  
> Marketing-Phasen MA0–MA7 sind dort als **WP-M*** / **WP-N*** konsolidiert. ADR-0068 / ESS-0022 bleiben die Entscheidungs-/Vertrags-Authority; diese Roadmap begründet keine parallele Programmautorität mehr.

Status: **SUPERSEDED** — ehemals DRAFT — IMPLEMENTATION NOT AUTHORIZED  
Date: 2026-08-12 (historisch) / Supersede: 2026-08-15  
Baseline (historisch): `main@3a733f2b6efeffb3013fbb2c558b5ef4c185125e`  
Owner: SvenKulessa  
Logical agent: `capital-ai-marketing-roadmap-executor`  
Authority draft: ESS-0022 / ADR-0068

## Goal (historisch, unverändert als Evidence)

Create a dedicated Marketing Roadmap Executor that can eventually execute bounded Owner-approved SEO, content-generation, media-rendering and marketing-distribution repository work without inheriting Systemadmin authority.

The target operating model remains:

`Owner-approved Marketing Roadmap authority -> domain-limited Marketing Agent -> audited branch/commit/PR work -> Human review/merge -> later separately governed external publication`.

**Fortschreibung und offene Arbeitspakete:** ausschließlich **SEO-GM-ROADMAP-0002**.

## Hinweis zur weiteren Nutzung

- MA0 Governance-Paket, Capability-States und Plane Separation sind in SEO-GM-ROADMAP-0002 §5–§7 abgebildet.
- Die Execution Policy `docs/governance/MARKETING_AGENT_ROADMAP_EXECUTION_POLICY.md` bleibt Draft bis Owner-Acceptance von ADR-0068/ESS-0022 und wird nicht durch diese Datei aktiviert.
- Keine Runtime-Capability wird durch dieses SUPERSEDED-Dokument gewährt.
