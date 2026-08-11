# ADR-0062 — Agent Cutover and Provider Profile Contract

Status: PROPOSED
Date: 2026-08-11

## Decision
At M8 cutover, ChatGPT, Claude, Gemini/AI Studio and future AI applications access CAPITAL-AI only through provider profiles mapped to ESS-0019 capabilities. NotebookLM remains read-only Research & Evidence Plane.

No provider-specific direct GitHub/Supabase/Stripe/Render admin path is canonical after cutover. Provider adapters may differ in transport (MCP, connector, function call, SDK) but not in authorization semantics.

## Cutover gates
- M3 CI hardening complete.
- M4 capability IAM enforced.
- M5 audit correlation complete.
- M6 provenance complete.
- M7 deployment identity complete.

## Rollback
Disable provider profile and restore read-only access without changing underlying governance.

## Verification
Same policy test suite must pass for at least ChatGPT and Claude execution profiles; research-only profiles must fail mutation tests.