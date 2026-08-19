# CAPITAL-AI Enterprise DevelopmentChain — Current-State Index

**Authority ID:** `AUTH-GOV-DEVELOPMENT-CHAIN-STATUS`  
**Version:** `2.0.0`  
**Status date:** `2026-08-19`  
**Current repository baseline:** `main@59a2755de53297a934b062b380a313d68cd47492` — PR #445 merge  
**Platform version:** `0.6.0`  
**Repository Agent Trust Root:** `/AGENTS.md`  
**Current governance roadmap:** `docs/roadmaps/GOVERNANCE_CONTROL_PLANE_CONSOLIDATION_2026-08-19.md`

## Canonical role

This file is the **current-state DevelopmentChain status index**. It intentionally does not duplicate detailed historical phase narratives. Historical implementation detail remains in the corresponding ADR, ESS, runbook and `docs/evidence/**` records.

`docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md` is retained as an older implementation-roadmap snapshot and is **historical/non-authorizing for current execution state**. Current execution authority is resolved from `/AGENTS.md`, the Governance Control Plane registries and the effective DevelopmentChain/Human-Owner policies.

## Current governance operating state

```text
READ-ONLY BASELINE
→ AUTHORITY / RISK / REUSE PRE-CHECK
→ FRESH SCOPED BRANCH FROM CURRENT MAIN
→ REPOSITORY IMPLEMENTATION
→ AVAILABLE LOW-COST / EXACT-SNAPSHOT PRE-PR VALIDATION
→ FINAL MAIN RE-SYNC + OPEN-PR CORRELATION
→ PULL REQUEST
→ INDEPENDENT GOVERNANCE / TECHNICAL CI
→ HUMAN/OWNER MERGE DECISION
→ HUMAN MERGE
→ VERIFIED MAIN DEPLOYMENT PATH, WHEN APPLICABLE
```

Current policy authorities:

- `/AGENTS.md` / `AUTH-GOV-AGENT-TRUST-ROOT`;
- `docs/governance/authority-registry.json`;
- `docs/governance/control-catalog.json`;
- `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`;
- `docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md`;
- effective Accepted ADR/ESS authorities for the concrete work scope.

## M10 — historical verification versus current enforcement

### Historical evidence

M10 Passkey/WebAuthn `AUTHORIZE_PR_CI` was implemented, cut over and recorded as `COMPLETE / VERIFIED PASS` in the M10 evidence chain. Those records remain valid historical implementation and assurance evidence, including:

- `docs/adr/ADR-0066-passkey-only-owner-pr-authorization.md`;
- `.ai/skills/ESS-0022-Passkey-Only-Owner-PR-Authorization.md`;
- `docs/architecture/ai-agent/M10_PASSKEY_OWNER_PR_AUTHORIZATION_THREAT_MODEL.md`;
- `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`;
- `docs/evidence/m10/M10_CLOSURE_EVIDENCE_2026-08-19.md`.

### Current enforcement state

**M10 PR-CI passkey enforcement is currently `SUSPENDED / OFF`.**

After the deployment-recovery work merged in PR #445, normal Pull Request technical CI must not require an M10 Passkey. Historical M10 evidence, ADRs, ESS documents or runbooks do not automatically reactivate that gate.

Current PR path:

```text
PR OPEN / UPDATE
→ governance / workflow-security checks
→ normal scope-appropriate build-and-test
→ Human/Owner merge decision
→ Human Merge
```

A future M10 reactivation requires a **new explicit Owner decision**, current-main correlation, architecture/security impact analysis and validated fail-closed implementation. Reactivation is not a documentation-only change.

## Deployment authority — current state

Render native Auto Deploy is off. The current production-promotion authority is:

```text
Human Merge
→ main
→ build-and-test
→ supply-chain attestation
→ exact-SHA Render deploy hook
→ post-deployment identity verification
```

This current path was successfully exercised after PR #445. A second automatic Render deployment authority must not be introduced without an explicit architecture/security decision.

## DevelopmentChain phase status

The table below separates historical phase completion evidence from **current enforcement state**. Earlier phase detail is not re-adjudicated by this governance cleanup.

| Phase / area | Historical evidence state | Current interpretation |
|---|---|---|
| M0–M8 DevelopmentChain foundations | retained in existing ADR/ESS/evidence | preserved; no current-state rewrite in this governance package |
| M9 Assurance | historical closure/evidence retained | not a current PR-CI authorization mechanism |
| M10 Passkey Owner PR Authorization | **historically COMPLETE / VERIFIED PASS** | **enforcement SUSPENDED / OFF** |
| Human Merge | established control | **REQUIRED / current** |
| GitHub hosted build-and-test | established control | **REQUIRED according to check class / current** |
| Supply-chain attestation | established release control | **current for main production promotion** |
| Render native auto-deploy | historical/native option | **OFF** |
| Exact-SHA Render deploy hook | established release control | **current production deploy authority** |
| Governance Control Plane consolidation | new Owner-directed work | **IN PROGRESS on `governance/control-plane-foundation-iso42001-ssdf`** |

## Agent capability architecture

ESS-0019 remains the accepted provider-neutral **agent capability/risk/audit/execution plane**. Its own invariant `AI product != trust root` remains aligned with the current architecture.

It is subordinate to `/AGENTS.md` and does not create a second repository trust root. Provider/model identity never creates Human/Owner authority.

## Protected current invariants

- no direct agent changes on `main`;
- fresh scoped branch per work package;
- final `main` synchronization immediately before PR creation;
- open-PR semantic/file correlation before merge-readiness;
- no fabricated build/test or production evidence;
- technical evidence does not authorize merge;
- Human/Owner-only merge remains separate;
- M10 remains suspended until a new explicit Owner reactivation decision;
- security-critical ambiguity fails closed;
- no raw reusable credentials in model-visible evidence;
- external production mutations remain separately authorized;
- Render native auto-deploy remains off under the current single-deployment-authority architecture;
- exact deployed SHA must be independently verifiable;
- historical evidence is retained and cannot silently regain current authority.

## Current next action

The repository-wide governance priority is the **Governance Control Plane consolidation** defined by `GOV-CP-2026-08-19`.

Until that package is Human-merged:

- PR #439 remains parked as reusable Documentation Hygiene implementation work;
- PR #442 remains parked as feature work requiring post-governance authority/registry reconciliation;
- new feature work must not become merge-ready while a correlated critical governance conflict remains unresolved.

After the Governance Control Plane is merged, re-synchronize #439 and #442 with the new `main`, adapt their governance/registry references, run the applicable independent checks and then resume their normal Human-reviewed lifecycle.

## Historical references

Detailed phase history remains intentionally in existing evidence and runbooks. This current-state index supersedes older roadmap snapshots only for **current execution-state interpretation**; it does not rewrite or invalidate historical evidence.