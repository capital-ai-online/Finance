# ADR-0080 — Marketing Roadmap Executor and Controlled Content Automation Boundary

Status: PROPOSED
Date: 2026-08-12
Decision Owners: Platform Director / Repository Owner
Related ESS: ESS-0014, ESS-0019, ESS-0021, ESS-0022

## Numbering note

Formerly filed as ADR-0068 (number collision with first-bounded-autonomous-work-package). Content unchanged; number reassigned under ADR-0081.

## Decision (summary)

Create separate logical agent `capital-ai-marketing-roadmap-executor` with own identity, mandate, capability ceiling and kill switch. Must not inherit Systemadmin authority.

Initial state: documentation/specification and read-only analysis only. No standing BRANCH/COMMIT/PR/CI/DEPLOY/PRODUCTION_MUTATION or public social-publishing authority from this ADR.

Public social publishing is an external business mutation distinct from repository mutation. MERGE remains Human-only.

## Referenzen

ADR-0081, ESS-0022, docs/governance/AUTONOMOUS_AGENT_CONCEPT_GATE.md
