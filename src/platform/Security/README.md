# Security

## Enterprise Component

Status: Implemented  
Version: 1.2.0  
Owner: CAPITAL-AI

## Purpose

`src/platform/Security` is the existing reusable technical Security component under ESS-0006. It provides Security implementation primitives and Security-specific adapters. It is **not** the owner of productive Project Value Chain behavior and is not a destination for foreign domain code merely because a finding is security-related.

CAPITAL-AI-SEC uses this component as the preferred reusable Security implementation boundary while operating repository-wide as a cross-cutting requirements/testing/findings/bounded-remediation/verification domain under `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION` and `CTRL-SEC-BOUNDED-REMEDIATION-001`.

The component path is not an exclusive authorization boundary. An eligible Security-primary remediation may change the vulnerable implementation where it actually resides, including `server/**`, Security automation/workflows, manifests/lockfiles, Docker/runtime Security configuration and Security-relevant tests. Such a change does not move that file or its long-term Domain/PVC ownership into `src/platform/Security` or CAPITAL-AI-SEC.

Canonical non-authorizing roadmap:

`docs/architecture/ROADMAP.md` (Live Roadmap current-state source)

Primary Productive PVC ownership of Security:

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

## Cross-cutting implementation rule

Security owns:

- Threat Modeling;
- Security Architecture Requirements;
- IAM Security requirements/verification;
- Application/API Security requirements/verification;
- Data/Secrets Security requirements/verification;
- Infrastructure and Supply Chain Security requirements/verification;
- AI/Agent Security requirements/verification;
- Security testing and findings lifecycle;
- bounded Security-primary repository remediation under `CTRL-SEC-BOUNDED-REMEDIATION-001`;
- separated Security verification/evidence.

Security does **not** own the target project's productive Domain/PVC authority. Execution authority and ownership are separate.

For a confirmed finding, Security may implement the smallest sufficient fix itself when the primary purpose is Security, current owner/authority/writer correlation is clear, accepted Domain contracts remain intact and the change does not introduce business/product semantics, foreign Architecture Authority, protected external mutation, Security-gate weakening or a parallel control plane.

If those conditions fail or a non-Security remainder cannot be cleanly separated, CAPITAL-AI-SEC uses its compatibility handoff marker for that remainder:

`[SECURITY_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]`

For current project routing, that marker additionally carries `project_namespace: PVC` and `project_stage: PVC-<NN>` according to `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`. Where a technical financial stage is relevant, `technical_namespace` and `technical_stage` are recorded separately. Security remains the Security requirement and verification owner; the target remains the Domain owner.

## Verification separation

Implementation evidence alone does not establish finding closure. `EVIDENCE_READY != VERIFIED`.

An eligible Security fix requires a distinct Security re-test/review step against the original invariant, including reproducible positive and negative tests and applicable hosted/runtime evidence. Human/CODEOWNER or affected Primary Owner verification remains additional where required by risk or an existing contract. CAPITAL-AI-SEC cannot self-accept residual risk or derive `VERIFIED/CLOSED` merely from having authored the patch.

## Authority boundaries

This component or the bounded remediation delegation does not create:

- a Governance Control Plane;
- an IAM/Policy authority separate from current repository authorities;
- an Audit/Risk control plane;
- a Secrets authority/store;
- a Production mutation authority;
- an EventMesh;
- a data/scoring/business architecture;
- a release/deployment authority;
- productive PVC ownership for CAPITAL-AI-SEC.

Protected Production, IAM-admin, Billing/money, Entitlement, DNS, Secret, destructive-data/resource mutations require their separate effective authority. Security may harden repository code around such surfaces but does not inherit the external mutation permission.

Ambiguous protected identity, authorization, project ownership, Domain semantics or required Security evidence fails closed.

## ESS references

- ESS-0001
- ESS-0001-CONTRACTS
- ESS-0006 v1.2.0 — Security & Compliance
- ESS-0019 — Universal AI Agent Control Plane where agent execution/capability boundaries apply

Current MFA/AAL work also references the applicable current lifecycle state of ESS-0020; this README does not promote or alter that status.

## ADR references

- ADR-0003.5 — Identity / Step-Up Authentication
- ADR-0058 — agent identity/capability/risk authorization where applicable
- ADR-0059 — agent audit/evidence where applicable
- ADR-0060 — supply-chain provenance/attestation where applicable
- applicable current Security ADRs, including the current lifecycle state of ADR-0064

## Dependencies

Security code consumes existing application/runtime dependencies such as `server/db.ts`, `server/env.ts`, `server/logger.ts`, Supabase Auth and repository Governance contracts. Consumption or bounded remediation does not transfer ownership of those domains to Security.

## Events

No second Security event bus exists. Security events use existing system/EventMesh/trace mechanisms where currently implemented. Event publication or Security evidence creates no execution or approval authority.

## Historical note

ARCH-AUDIT-0002 moved the real IAM/Security implementation from the former `server/iam/` location into this existing component path. CAPITAL-AI-SEC V2 preserves that reusable component and prevents consolidation from turning it into a monolithic owner of foreign value-chain implementation. The 2026-09-10 governance update relaxes only the former file-location/foreign-implementation prohibition for **bounded Security-primary remediation**; all long-term Domain/PVC ownership and protected Human/Production gates remain intact.
