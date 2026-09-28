# OPS-LIVE-ROADMAP-CURRENT-MAIN-STATE-01 — Application-wide CURRENT_MAIN Roadmap projection

**Project:** `CAPITAL-AI-OPS`  
**Owner:** `CAPITAL-AI-OPS`  
**PVC:** `PVC-02 / PVC-08`  
**Baseline:** `main@a9f1be965ccb31e173019d507f78320f5fdad933`  
**State:** `DONE_MAIN / TERMINAL`

## Outcome

Extend the existing read-only `/api/roadmap` runtime so the public Roadmap can read the latest GitHub `CURRENT_MAIN` project state independently from the intentionally lagging Production deployment cadence.

## Architecture boundary

The endpoint is a non-authorizing projection only:

- execution authority remains `/AGENTS.md@CURRENT_MAIN`;
- project/PVC routing remains `docs/projects/README.md` plus `PROJECT_VALUE_CHAIN.md`;
- current Security/QM state remains in `docs/architecture/ROADMAP.md`;
- other projects keep their current `docs/projects/<project>/ROADMAP.md` source until owner-correct migration;
- no task state is written back to GitHub;
- no second backlog, registry, Roadmap authority or deployment controller is introduced.

## Required projection

The exact same current-main SHA must bind all reads. The projection exposes:

- canonical project owner, folder and label;
- work-item identity/title;
- normalized `ACTIVE / IN_PROGRESS / EVIDENCE_GATE / READY / HELD / QUEUED` presentation state;
- explicit dependencies and execution group where present;
- source path and source SHA;
- fail-closed warnings for current-like state that cannot be resolved to a canonical identity.

Historical, terminal, superseded, retired and not-applicable sections remain evidence only and are excluded.

## Current OPS correlation

The OPS Roadmap also needs to surface two current bounded packages that existed only as detailed work-package files:

- `OPS-AUTH-RENDER-MGMT-TOKEN-RECOVERY-01` — Production runtime recovered; plan-aware Auth control recovery remains open;
- `OPS-RENDER-MCP-AI-DEBUG-01` — repository integration merged; host OAuth/readback assurance remains pending.

## Exit gate

1. `/api/roadmap/state` reads all canonical Roadmap sources at one exact latest `CURRENT_MAIN`.
2. Known missing identities from the application-wide audit are present or truthfully excluded as terminal/historical.
3. Unknown current-state syntax produces a warning instead of silent omission.
4. Cadence and state reads work for the private repository through authenticated Contents/API reads.
5. Unit tests and exact-head required checks pass.
6. Human/CODEOWNER merge remains required before FE consumes the new contract.


## Post-Merge Closure — 2026-09-28

- Human/CODEOWNER merge: PR #1356.
- Merge SHA: `46a3339c3447470cfe2ee741960023643997505e`; implementation head: `e305b60180f7ff85c679cde0b3218972d0b162af`.
- Fresh CURRENT_MAIN readback: `f0b9b9f3368b3c9cc241fadef3100af89dc5256a`; the merge SHA is an ancestor of this generation (`behind=0`).
- Work claim `.ai/work-claims/CAPITAL-AI-OPS-LIVE-ROADMAP-CURRENT-MAIN-STATE-20260924.json` is `released / exclusive=false`.
- The bounded package has no remaining implementation or provider gate. Later Roadmap slices are separate work items.
