# Security

## Enterprise Component

Status: Implemented  
Version: 1.1.1  
Owner: CAPITAL-AI

## Purpose

`src/platform/Security` is the existing technical Security component under ESS-0006. It provides inherently reusable Security implementation and Security-specific adapters. It is **not** the owner of productive Project Value Chain behavior and is not a destination for foreign domain code merely because a finding is security-related.

CAPITAL-AI-SEC uses this component as the reusable Security implementation boundary while operating repository-wide as a cross-cutting requirements/testing/findings/verification domain.

Canonical non-authorizing roadmap:

`docs/roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md`

Primary Project Value Chain ownership of Security:

`[]`

Current project-routing namespace is `PVC-01..PVC-18` per `docs/projects/PROJECT_VALUE_CHAIN.md`. Existing technical `VC-*` identifiers under `SC-MD-SPT-0001` remain a separate namespace and are not project-ownership labels.

## Current reusable Security implementation

- `authMiddleware.ts` — verified identity, IAM authorization and protected access helpers;
- `nativeMfa.ts` — supported native MFA/AAL handling used by current authentication flows;
- `rateLimiter.ts` — Security rate-limit/client-IP boundary;
- `secretCrypto.ts` — cryptographic handling for protected local secret material where retained;
- `totp.ts` — legacy/application TOTP implementation retained only where current contracts still reference it;
- other Security-specific helpers/adapters physically located in this component.

The exact current code is authoritative over this descriptive list.

## Cross-cutting ownership rule

Security owns:

- Threat Modeling;
- Security Architecture Requirements;
- IAM Security requirements/verification;
- Application/API Security requirements/verification;
- Data/Secrets Security requirements/verification;
- Infrastructure and Supply Chain Security requirements/verification;
- AI/Agent Security requirements/verification;
- Security testing, findings and verification.

Security does **not** own the target project's productive implementation.

When a finding requires changes outside inherently Security-owned code, CAPITAL-AI-SEC emits its compatibility marker:

`[SECURITY_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]`

For current project routing, that marker must additionally carry `project_namespace: PVC` and `project_stage: PVC-<NN>` according to `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`. Where a technical financial stage is relevant, `technical_namespace` and `technical_stage` are recorded separately. Security remains the requirement and verification owner.

## Authority boundaries

This component does not create:

- a Governance Control Plane;
- an IAM authority separate from current repository IAM authorities;
- a Secrets authority/store;
- a Production mutation authority;
- an EventMesh;
- a data/scoring architecture;
- a release/deployment authority.

Ambiguous protected identity, authorization, project ownership or required Security evidence fails closed.

## ESS references

- ESS-0001
- ESS-0001-CONTRACTS
- ESS-0006 — Security & Compliance

Current MFA/AAL work also references the applicable current lifecycle state of ESS-0020; this README does not promote or alter that status.

## ADR references

- ADR-0003.5 — Identity / Step-Up Authentication
- applicable current Security ADRs, including the current lifecycle state of ADR-0064

## Dependencies

Security code consumes existing application/runtime dependencies such as `server/db.ts`, `server/env.ts`, `server/logger.ts`, Supabase Auth and repository Governance contracts. Consumption does not transfer ownership of those domains to Security.

## Events

No second Security event bus exists. Security events use existing system/EventMesh/trace mechanisms where currently implemented. Event publication or Security evidence creates no execution or approval authority.

## Historical note

ARCH-AUDIT-0002 moved the real IAM/Security implementation from the former `server/iam/` location into this existing component path. CAPITAL-AI-SEC V2 preserves that reusable component and explicitly prevents the consolidation from turning it into a monolithic owner of foreign value-chain implementation.
