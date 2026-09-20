# Supervisor

## Enterprise Component

Status: Implemented (extended 2026-09-20)

Version: 1.4.0

Owner: CAPITAL-AI

---

## Purpose

`supervisor.ts` is the real Supervisor component. The Supervisor observes, evaluates and escalates; it never becomes the deciding authority.

**Implemented:**

- **Task Routing / Tool Selection** — `routeTask()`
- **Execution Control / Retry** — `executeSupervised()` retries only explicitly `READ_ONLY`/`IDEMPOTENT` operations; unclassified and side-effecting work is fail-closed to a single attempt, with bounded exponential backoff + jitter for safe retries
- **Self-Healing Control Contract** — `selfHealingContract.ts` defines finding taxonomy, action registry, budgets, cooldowns, kill switches, verification and the recovery state machine without executing protected remediation
- **Dependency Resilience (SH-02.4)** — `dependencyResilience.ts` normalizes provider health/circuit/LKG evidence and provides a contract-bound generic retry executor that remains blocked while `RETRY_SAFE_OPERATION` is `HELD`; provider-native retry/circuit/LKG owners are never wrapped in a second retry loop
- **Worker/job recovery (SH-02.5)** — the canonical ADR-0054 outbox now heartbeats active leases, reclaims stale work only for explicitly idempotent handlers within budget, quarantines ambiguous/exhausted work into the existing dead-letter state, and persists stale-replay/quarantine evidence in `outbox_recovery_events`; generic `QUARANTINE_WORK_ITEM` remains `HELD`
- **Approved write path** — `executeApprovedSupervisedAction()` (Policy → Approval → Apply → Audit)
- **Agent Provider Chain Observation** — ChatGPT, Claude, Grok via `observeAgentProviderChain()`
- **Findings** — evidence-based findings from failed supervised executions and provider inventory
- **Documentary Maintenance Observation** — `documentaryMaintenanceObservation.ts` converts Documentary freshness/hygiene evidence into deterministic `RECOMMENDED`, `NO_ACTION` or `BLOCKED` recommendation evidence. It never applies patches or approves the task.

## Documentary Maintenance boundary

ADR-0097 preserves the ESS-0002 separation:

`Documentary freshness evidence -> Supervisor recommendation -> Platform Director decision -> Documentary Maintenance Orchestrator`.

The Supervisor evidence identity binds correlation ID, source commit, patchable paths, review-only paths and hygiene finding codes. A Platform Director decision must reference the exact current Supervisor `evidenceId` before the Maintenance Agent may plan a semantic patch.

Protected documents remain review-only; the Supervisor does not downgrade that boundary. Merge, release and production mutation remain outside Supervisor authority.

**Not implemented:**

- Multi-engine Conflict Resolution (one authoritative engine per asset class)
- Full ESS-0002 Digital Twin / complete finding lifecycle persistence
- SH-02.6+ runtime/frontend remediation executors and SH-02.11 production activation; `getSupervisorStatus().capabilities.selfHealing` remains `false`; generic `RETRY_SAFE_OPERATION` and `QUARANTINE_WORK_ITEM` remain `HELD` until staged activation

---

## ESS / ADR

ESS-0001, ESS-0001-CONTRACTS, ESS-0002, ESS-0010, ESS-0019; ADR-0018, ADR-0051, ADR-0062, ADR-0097
