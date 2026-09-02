# AI Agent M0–M10 Traceability Matrix — Historical Index

> Legacy filename retained for stable references.

**Lifecycle:** `HISTORICAL / NON-AUTHORIZING`  
**Current-state authority:** `/AGENTS.md` + current Project Value Chain / project Roadmaps / accepted ADR / active ESS

## Purpose

This file preserves a compact index of the historical M0–M10 AI-Agent/DevelopmentChain program. It is not the current project plan and must not cause retired phases to be reconstructed as missing implementation.

Current Human-readable development navigation is:

```text
Project Value Chain / PVC
→ project Roadmap
→ applicable ADR
→ applicable ESS
→ implementation / tests / evidence
```

Current Git terminology is `main SHA`, `branch head SHA`, `PR head SHA` and `merge SHA`. Historical source/build evidence must match the exact source or PR-head identity it claims to validate.

## Historical phase summary

| Phase | Historical resolution | Primary authority / evidence family |
|---|---|---|
| M0 | COMPLETE | baseline evidence |
| M1 | COMPLETE | Git guardrails / Human Owner policy |
| M2 / M2G | COMPLETE | ESS-0019 + ADR-0057..0063 documentation/control-plane baseline |
| M3 | COMPLETE | CI/supply-chain preparation including ADR-0060 references |
| M4 | VERIFIED historical capability/IAM work | ESS-0018/0019 and IAM/policy evidence |
| M5 | VERIFIED PASS historical | durable privileged audit evidence |
| M5A | VERIFIED PASS historical | Supabase native MFA/AAL2 evidence |
| M6 | VERIFIED PASS historical | source → lockfile → SBOM → artifact/provenance/attestation evidence |
| M7 | VERIFIED PASS historical | deployment identity / rollback / post-deploy evidence |
| M8 | historical provider cutover work | provider profile/cutover evidence |
| M9 | historical assurance/incident work | incident/break-glass evidence |
| M10 | **RETIRED / HISTORICAL ONLY** | former passkey PR-CI authorization material; no current implementation expected |

Detailed immutable evidence remains under `docs/evidence/m0/` … `docs/evidence/m10/`, related runbooks and accepted/historical ADR/ESS records.

## Current M10 rule

The former M10 `AUTHORIZE_PR_CI` productive runtime is retired. Current repository, architecture, inventory and Roadmap scans MUST NOT:

- search for a productive M10 implementation;
- classify its absence as a gap;
- reconstruct its router/UI/workflow runtime from historical evidence;
- infer a reactivation backlog.

Any future PR-CI/passkey mechanism requires a new explicit Human/Owner architecture and authority decision.

## Historical M6 supply-chain trace

The historical M6 evidence established the intended integrity chain:

```text
source / PR-head SHA
→ committed dependency lock
→ SBOM
→ artifact digest
→ provenance / attestation
→ verified deployment identity
```

This history is relevant to current **DR-02B / ADR-0060 authority reconciliation**, but it does not by itself resolve ADR-0060's current lifecycle/registry drift. That Governance correction belongs to the current CAPITAL-AI-GOV Roadmap and a fresh work branch after the Human-readable Governance cleanup reaches a terminal state.

## Current-use rule

For new work, do not use M-phase labels as the primary execution queue. Resolve:

1. affected PVC / Primary Owner;
2. project Roadmap item;
3. applicable ADR;
4. applicable ESS;
5. implementation/tests/evidence.

This file remains traceability history only.
