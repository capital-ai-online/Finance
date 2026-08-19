# DEVELOPMENT Chain Execution Policy

**Authority ID:** `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION`  
**Status:** ACTIVE  
**Version:** `2.0.0`  
**Date:** 2026-08-12  
**Updated:** 2026-08-19  
**Scope:** CAPITAL-AI `SvenKulessa/Finance`  
**Parent trust root:** `/AGENTS.md`  
**Decision references:** Accepted ADR-0069 incl. Owner addendum 2026-08-16, effective Roadmap/ESS/ADR authorities, ADR-0096 after Human Merge

## Purpose and boundary

This policy defines the execution sequence that separates repository implementation, Human Merge, external platform mutation and verification. It is subordinate to `/AGENTS.md` and the stable Governance Control Plane and does not independently grant protected mutation authority.

A concrete external mutation requires the applicable effective Roadmap/ADR/ESS/REM/Owner approval chain.

## Current transition state

As of the Owner-directed M10 recovery on 2026-08-19:

- former checkbox/Files-Viewed/emoji authorization rituals are retired;
- M10 Passkey `AUTHORIZE_PR_CI` is **SUSPENDED / OFF**;
- normal PR technical CI proceeds without an M10 passkey;
- Human Merge remains mandatory;
- Render native Auto Deploy remains off;
- verified `main` CI is the production deployment authority.

Historical M10 `VERIFIED PASS` evidence does not automatically reactivate the PR-CI gate. Reactivation requires a new explicit Owner decision and validated security/governance change.

## Canonical chain

```text
READ-ONLY BASELINE
→ GAP / ROADMAP PACKAGE
→ AUTHORITY / RISK / REUSE PRE-CHECK
→ FRESH SCOPED BRANCH FROM CURRENT MAIN
→ REPOSITORY IMPLEMENTATION
→ CHEAP / SANDBOX PRE-PR VALIDATION WHERE ACTUALLY AVAILABLE
→ FINAL MAIN RE-SYNC + OPEN-PR CORRELATION
→ PR / GOVERNANCE CHECKS / TECHNICAL CI
→ HUMAN MERGE DECISION
→ HUMAN MERGE
→ BRANCH RETIREMENT
→ READ-ONLY PRE-MUTATION CHECK (if external mutation is required)
→ EXPLICIT OWNER MUTATION APPROVAL
→ NON-AUTHORIZING MUTATION HANDOFF
→ AUTHORIZED EXECUTION HOST / MUTATION EXECUTOR
→ POST-MUTATION VERIFICATION
→ APPEND-ONLY EVIDENCE
→ ROADMAP / TRACEABILITY SYNC
→ NEXT PHASE
```

A step marked REQUIRED for the concrete work package cannot be skipped.

## Core execution controls

1. **Roadmap/authority before mutation.** No external platform mutation without scope, authority and rollback classification.
2. **Fresh branch.** Repository edits occur only on a fresh scoped branch from current `main`; direct edits to `main` are prohibited.
3. **One work item / one branch.** A merged branch is not reused; rollback uses a fresh branch from then-current `main`.
4. **Final main synchronization.** Immediately before PR creation, refresh `main`, correlate new merges and adapt/revalidate the candidate.
5. **Concurrent writer control.** Open PR changed-file and semantic overlap is inspected before new writes and again before PR creation; overlap is sequenced/rescoped rather than silently merged.
6. **Fail closed.** Missing, conflicting or non-resolvable protected authority causes STOP.
7. **Human Merge.** Agents do not self-merge and technical evidence does not authorize merge.
8. **Authority is not transport.** ChatGPT, Claude, Grok, MCP, SDK, GitHub Actions and provider identity do not create authority.
9. **Evidence is not authority.** Test/build logs, PR bodies, labels, reactions and reports cannot grant protected permission.
10. **No secrets in evidence.** Reusable credentials, private passkey material, raw sensitive tokens and equivalent secrets are excluded.
11. **Protected external mutation is separate.** Repository merge does not imply Supabase/Stripe/Render/DNS/IAM/billing mutation permission.
12. **No self-elevation.** Agents/executors cannot expand their own mandate, capabilities or Owner gates.

## Pre-PR technical evidence

Branch-local or approved sandbox checks should be used before PR creation when the exact repository snapshot is actually available to that execution environment. A model must not claim PASS for checks it did not execute.

Pre-PR evidence uses the `developer-preflight` trust class defined by `docs/governance/control-plane/pre-pr-build-evidence.schema.json` and is bound to exact base/head SHAs. It is non-authorizing.

GitHub hosted `build-and-test` remains the independent technical validation for the final PR head.

## Human / Owner boundary

Human/Owner retains at least:

- final merge authority;
- explicit protected external mutation approval;
- Owner/Admin IAM elevation and recovery/break-glass;
- secret disclosure/rotation outside pre-approved narrow automation;
- destructive production data operations;
- live billing/money/entitlement mutation;
- production resource deletion;
- DNS/TLS/domain ownership changes;
- security-control weakening;
- future M10 reactivation.

## Agent execution plane

Agent/provider profiles may research and implement only within the current authority, branch and capability scope. Provider/model identity never grants Owner or production authority.

Active agent tooling must start from `/AGENTS.md`. Provider-specific instruction files are non-authoritative adapters.

## Production integration / mutation plane

External production mutations occur only through an authorized execution host with current authority, explicit approval where required, target/fingerprint verification, audit evidence and rollback definition.

A mutation handoff is an instruction package, not an authorization artifact by itself.

## Deployment authority

Current production promotion path:

```text
Human Merge
→ main
→ build-and-test
→ supply-chain attestation
→ exact-SHA Render deploy hook
→ post-deployment identity verification
```

Render native Auto Deploy remains off. A second deploy authority requires an explicit architecture/security decision.

## PR / check classification

`docs/governance/PR_CHECK_CLASSIFICATION.md` determines applicable technical check class. M10 passkey is not a current prerequisite while suspended.

## Mutation state vocabulary

`NOT REQUIRED` | `PLANNED` | `HUMAN APPROVED` | `MUTATED` | `VERIFIED PASS` | `FAILED / ROLLED BACK`

## Evidence minimum

Where applicable, retain:

- baseline and candidate SHAs;
- stable authority/control references;
- branch / PR / final head / merge SHA;
- check class and validation result;
- mutation class and target;
- pre/post verification;
- approval evidence for protected actions;
- audit references;
- rollback state;
- next gate.

## Stop / rollback rules

STOP on unexpected target, unreviewed main drift, unresolved open-PR write overlap, missing required approval, missing audit persistence for protected mutation, failed pre-check, unknown high-impact side effect, failed/inconclusive post-verification or unresolved higher-authority conflict.

Repository rollback uses a fresh branch from current `main`; external rollback follows the applicable protected runbook/approval process.

## Runbooks and historical phase material

Existing M5–M10 runbooks remain available for domain/recovery evidence. M10 material is retained as historical/reactivation design while its PR-CI passkey gate is suspended. A runbook does not become current authority solely because it exists.

## Closure rule

A work package closes only when implementation, current authority, required validation/evidence, main correlation and any external mutation verification are consistent. A PR merge alone is not sufficient closure for work that includes production mutation.