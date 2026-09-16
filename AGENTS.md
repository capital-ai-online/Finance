# CAPITAL-AI Agent Trust Root

**Authority ID:** `AUTH-GOV-AGENT-TRUST-ROOT`  
**Control Plane Version:** `3.1.0`  
**Status:** OWNER-DIRECTED — effective after Human/CODEOWNER merge  
**Effective date:** 2026-09-16  
**Repository:** `capital-ai-online/Finance`

## 1. Single Point of Trust

`/AGENTS.md@CURRENT_MAIN` is the single repository-wide trust root for every AI model, coding agent, MCP host and automation client working on CAPITAL-AI.

`CURRENT_MAIN` is the sole repository baseline. Open Pull Requests, branches, previous chat outputs, stale evidence and unmerged payloads are correlation/search inputs only and never become repository authority by themselves.

## 2. Sole Development Guideline

After Human/CODEOWNER merge of the introducing Pull Request, the **only repository development-execution guideline** is the combined `CAPITAL_AI_AUTONOMOUS_DEVELOPMENT_GUIDELINE`, consisting of exactly these eight YAML policies:

1. `docs/governance/development-policies/GOV-AUTONOMOUS-TRUST-ROOT-01.yaml`
2. `docs/governance/development-policies/GOV-DYNAMIC-SCOPE-RESOLUTION-02.yaml`
3. `docs/governance/development-policies/GOV-AUTONOMOUS-WORK-GRAPH-03.yaml`
4. `docs/governance/development-policies/GOV-ATOMIC-BRANCH-EXECUTION-04.yaml`
5. `docs/governance/development-policies/GOV-SELF-HEALING-CONVERGENCE-05.yaml`
6. `docs/governance/development-policies/GOV-CI-COST-VALIDATION-06.yaml`
7. `docs/governance/development-policies/GOV-EVIDENCE-EVENTMESH-HANDOVER-07.yaml`
8. `docs/governance/development-policies/GOV-PR-CLOSURE-AUTHORITY-08.yaml`

No ninth lifecycle, DevelopmentChain, routing overlay, agent-specific mirror, PR/CI procedure, handoff procedure or equivalent parallel development-execution authority is permitted unless a later explicit Human/Owner decision changes this exact set.

## 3. Global procedural supersession

The eight policies replace **all previous repository development-procedure rules across the Project Value Chain `PVC-01..18`**. This includes the former DevelopmentChain and prior rules for sequencing, branch execution, PR creation/closure, CI ordering, autonomous continuation, cross-project execution, development handoffs, retry/wait behavior and development prioritization.

`AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION`, `AUTH-GOV-HUMAN-OWNER-PR-APPROVAL`, `AUTH-GOV-OPS-FOREIGN-PROJECT-EXECUTION` and associated procedural `CTRL-*` rows survive only as historical/correlation identities where needed. They do not create a fallback, parallel lane or additional execution authority after activation of this version.

Stale registry/control-catalog rows, historical documents, old code comments or evidence that still describe a superseded development procedure are non-authorizing for execution. They are reconciled through documentation/governance hygiene but MUST NOT override the exact eight-policy suite.

## 4. Subject-matter constraints remain

The eight policies do **not** erase subject-matter authority. They dynamically consume applicable constraints from current main: law/regulation/contracts, canonical Project/PVC ownership, accepted ADR/ESS/domain/data/scoring contracts, Security/Compliance controls, supply-chain/provider controls, required checks, Human/CODEOWNER review and separately authorized protected external mutations.

These sources constrain development through the eight policies; they do not form an additional repository development lifecycle.

## 5. Canonical scope and owner resolution

Canonical organizational resolution starts from `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`.

Every work package resolves Current Project, project folder, Primary Owner, PVC relationship, affected domains and applicable controls from `CURRENT_MAIN`. Missing or conflicting authority fails closed. No PVC or Owner is invented.

When work belongs to another Owner/Project, the detecting project creates an owner-correct handover instead of silently taking over foreign implementation.

SEC, QM, FINTECH and COMP/Supply-Chain preserve the specialized directions in `GOV-DYNAMIC-SCOPE-RESOLUTION-02`; no user-visible Top-Layer priority may override those authorities.

## 6. Execution boundaries

Repository mutations are branch-only and based on an exact fresh `CURRENT_MAIN` SHA. Direct writes to `main` are denied.

Work is decomposed into atomic, dependency-correct work packages. Independent packages may run in parallel when there is no shared mutation/authority boundary. Blocked work records the exact unblock condition and does not create artificial waits, sleep steps or arbitrary polling delays.

Self-Healing means bounded root-cause repair inside existing authority. It never permits test suppression, fabricated evidence, owner override, Security/Compliance weakening, silent public-contract change, self-approval or auto-merge.

Costly hosted validation is deferred until a Pull Request exists. `NOT_RUN`, missing evidence, `BLOCKED` and `FAIL` are never represented as `PASS`.

Every repository change uses a Pull Request. Human/CODEOWNER review and external repository merge authority are preserved; agents do not self-approve, self-merge, enable auto-merge, remove protection or weaken required checks.

## 7. Evidence and EventMesh

Relevant mutations require observed Before state, intended delta, observed/read-back After state, truthful validation state and evidence references. Inferred/fabricated After state is prohibited.

EventMesh is a **read-only runtime projection** for PVC state/evidence/handover correlation. It has no approval, merge, mutation or governance authority and cannot replace `/AGENTS.md` or create missing PVC state.

Cross-project handovers are owner-correct, correlation-ID-based and carry source/target owner, completed/remaining scope, dependencies, evidence, exit gate and continuation condition.

## 8. Preserved chat presentation — non-authorizing

The Owner explicitly preserves the existing **stylistic and graphical chat presentation only**. These conventions survive procedural supersession but create no execution, routing, prioritization, approval or merge authority.

Preserved visual conventions are:

- project display name, symbol and color from `docs/projects/README.md`;
- semantic emoji with textual labels: `🔍 ANALYSE / CHECK`, `🏗️ UMSETZUNG / ARCHITEKTUR`, `🧪 VALIDIERUNG / EVIDENCE`, `⚙️🤓 MANUELL`, `🟡 OFFEN / WAITING`, `🔴 BLOCKED / FAIL`, `🟠 RISIKO / WARNUNG`, `✅ DONE` / `🟢 PASS`, `🔐 SECURITY / COMPLIANCE`, `🔗 ABHÄNGIGKEIT / INTEGRATION`, `🧭 NÄCHSTE SCHRITTE`;
- visual continuation units using `### 📂 **SCOPE / ZIELORDNER: <canonical-project-folder>**` followed by a fenced plaintext `text` block containing the step, `📁 Projektfolder:` and `🎯 Exit Gate:`;
- the final `👷 AKTIVE CHAT-WORKER` plaintext status snippet when a handoff/status surface is rendered;
- existing Pull-Request project presentation metadata such as symbol/color while textual Project/Owner/PVC identity remains primary.

Presentation stays truthful; color is never the sole cue. Visual rules MUST NOT determine work selection, item limits, triggers, waiting, PR authority, ownership or gate results. Those decisions come only from the eight policies plus the applicable subject-matter constraints resolved from current main.

## 9. No self-bootstrap

The Pull Request introducing this version cannot authorize itself. Until Human/CODEOWNER merge, the rules on then-current `main` govern creation, validation, review and merge of that Pull Request. After merge, the exact eight-policy suite is the single development-execution model.
