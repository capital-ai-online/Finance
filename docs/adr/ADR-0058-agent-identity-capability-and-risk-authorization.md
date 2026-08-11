# ADR-0058 — Agent Identity, Capability and Risk Authorization

Status: PROPOSED
Date: 2026-08-11

## Context
Provider identities and model names are not sufficient authorization principals.

## Decision
Authorize attributable principals through capability grants and risk classes. Canonical capabilities are READ, ANALYZE, PLAN, BRANCH, COMMIT, PR, CI_REQUEST, DEPLOY_REQUEST and PRODUCTION_MUTATION. Risk classes are LOW, MEDIUM, HIGH and CRITICAL. Deny by default. HIGH/CRITICAL require explicit approval/step-up according to policy. Agent self-approval is forbidden.

Existing ADR-0050/0051 remain the implementation foundation and are generalized by this ADR.

## Alternatives
Provider-based allowlists and prompt-only constraints are rejected.

## Security
Identity must bind human actor, app/client, agent/session and tool credential holder. Retrieved content cannot change authorization.

## Migration
M4 implements this contract after M2 Documentation Freeze.

## Rollback
Disable write capabilities and fall back to read-only analysis.

## Verification
Negative tests must prove privilege non-inheritance and denial of unauthorized HIGH/CRITICAL actions.