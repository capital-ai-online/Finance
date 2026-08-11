# ADR-0061 — Deployment Identity and Production Mutation

Status: PROPOSED
Date: 2026-08-11

## Context
PR #190 attempted to implement a production Environment before the DevelopmentChain documentation set was complete.

## Decision
No deployment-path code/config change is authorized until M2G Documentation Freeze. Production deploy authority is separated from agent execution authority. GitHub `production` Environment, Render deployment credentials/bridge, rotation, revocation, branch restriction and break-glass are defined before implementation.

Where Render cannot accept GitHub OIDC directly, a narrowly-scoped secret bridge may be used, documented with owner, rotation, exposure scope and revocation procedure. OIDC/short-lived credentials remain preferred wherever the target supports them.

## Security
Only `main` may request production deployment. Agents may request DEPLOY_REQUEST but cannot possess implicit PRODUCTION_MUTATION.

## Migration
M7 implements after M3–M6 controls exist.

## Rollback
Retain last known-good deployment path until protected replacement is proven.

## Verification
Production deployment evidence must bind verified source SHA to Render deployment/runtime identity.