# ADR-0079 — Systemadmin GitHub Actions Execution Host Binding

- Status: PROPOSED / SA3B IMPLEMENTATION
- Date: 2026-08-12
- Owner: SvenKulessa
- Authority: ESS-0021, ADR-0065, ADR-0059, SA1–SA3A

## Numbering note

Formerly filed as ADR-0067 (number collision with s1-security-hardening-interlock). Content unchanged; number reassigned under ADR-0081.

## Decision (summary)

Use a dedicated GitHub Actions workflow as the first enforceable Systemadmin execution host.

Canonical chain: Owner execution-request issue → trusted workflow from main → GitHub OIDC → CAPITAL-AI audit broker → SA1/SA2/SA3 authorization → durable M5 auditReference → exact GitHub side effect → append-only outcome evidence.

No side effect before ALLOW + valid M5 auditReference. MERGE / DEPLOY_REQUEST / PRODUCTION_MUTATION remain hard-deny on this host.

Full detail preserved from the former ADR-0067 systemadmin host text; this file is the renumbered canonical location.

## Rollback

`git revert` of the introducing PR; disable workflow. No Supabase/Stripe/Render schema mutation by this ADR.

## Referenzen

ADR-0081, ESS-0021, ADR-0065
