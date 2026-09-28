# GOV Autonomous Draft-PR Project-Lane Triage — 2026-09-26

**Project:** `CAPITAL-AI-GOV`  
**Owner/PVC:** `CAPITAL-AI-GOV / PVC-05`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Execution baseline:** `main@8542844df2f4044fa9fd793e04f034d508d74d46`  
**Branch:** `agent/governance-autonomous-draft-pr-triage-v2-20260928`  
**Priority:** `P1`  
**Status:** `MERGED_MAIN / EVIDENCE_GATE / POST_MERGE_AUTONOMOUS_INTAKE_READBACK_PENDING`

## Owner direction

Draft Pull Requests shall be created by the Development Chain's own repository logic rather than requiring a manual workflow dispatch for every bounded agent branch. When execution capacity is occupied, the existing PR-create path shall expose deterministic triage/prioritization instead of one repository-wide first-PR blocker.

## Authority boundary

This package changes implementation and non-authorizing projections only. It does not create a second DevelopmentChain, backlog, queue, merge authority, project registry or PR writer.

`/AGENTS.md@CURRENT_MAIN` remains the only repository-wide execution authority:

- branch-only mutation and direct-main prohibition remain unchanged;
- PR creation remains correlation-gated and may be automated;
- independent packages may execute in parallel only when mutation/authority/namespace/ownership overlap is absent;
- final Human/CODEOWNER merge remains unchanged;
- Security/Compliance/domain gates remain fail-closed.

## Target architecture

### 1. Autonomous branch intake

An approved agent branch push emits `Agent Branch Signal` with `permissions: {}`, no candidate checkout and no secrets.

A separate `workflow_run` listener runs from the default-branch workflow definition and may request the existing canonical `open-agent-draft-pr.yml` writer only when:

- the signal completed successfully;
- the event originated from a same-repository push;
- the head branch uses `agent/*|claude/*|grok/*|ai/*`.

The privileged listener does not check out or execute candidate branch code. The canonical PR writer still checks out the candidate with persisted credentials disabled and executes only trusted-main PR scripts.

### 2. Project lanes

The existing single global automated PR lane becomes a deterministic project-lane projection:

- lane identity = canonical `Project ID` from `docs/projects/README.md`;
- lane capacity = one active automated main-targeting PR per project;
- another project lane may progress only if the existing global work-claim/file/semantic/namespace/authority/security correlation passes;
- same-project successor creation is deferred while that lane has an active PR;
- a malformed/missing project label on an active automated PR fails closed.

No static second lane registry is introduced. Canonical projects continue to come from the existing project-routing parser.

### 3. Triage

When a candidate cannot create because its project lane is occupied, the same lane engine emits deterministic triage evidence.

Ordering:

1. priority: `P0/P0-HIGHEST -> P1 -> P2 -> P3 -> unknown`;
2. older `startedAt` first;
3. branch name lexical order as the final deterministic tie-break.

`ALL_LANES_OCCUPIED` is an observable scheduling state, not authority to create another lane or displace an active PR.

Branches and work claims remain candidate evidence; the triage output is not a shadow backlog.

### 4. Self-Healing recovery handoff

The canonical PR writer accepts one additional trusted-main reusable-workflow handoff named `self-healing-recovery`.

It is deliberately narrower than a generic Actions/API caller:

- the reusable writer must observe `github.event_name == 'schedule'`;
- it must still be running on `refs/heads/main`;
- the selected branch must remain inside the approved agent namespaces;
- the normal production preflight, exclusive work-claim validation, current-main refresh, project-label classification and project-lane triage run again before `gh pr create`;
- the handoff grants no merge, branch write, deployment, provider, IAM, Security or Compliance authority.

This allows the OPS-owned Self-Healing loop to recover a missed Draft-PR intake without becoming a second PR writer.

### 5. Create-execution identity

The existing create-correlation previously treated only
`actor=SvenKulessa && triggeringActor=SvenKulessa` as resolved execution identity.
That is valid for manual Owner dispatch but would make repository-internal autonomous
handoffs fail at the final correlation gate.

The same create-correlation now resolves execution identity through one bounded helper:

- manual path: exact Owner actor pair with no trusted handoff;
- `documentary-autosync`: exact `push + refs/heads/main`;
- `agent-autocreate`: exact `workflow_run + refs/heads/main`;
- `self-healing-recovery`: exact `schedule + refs/heads/main`;
- every unknown handoff, wrong event or non-main ref: `UNRESOLVED / FAIL CLOSED`.

This changes no merge authority. It only allows an already trusted repository workflow
to reach the same final create-correlation gate without impersonating the Human Owner.
`validateWorkClaim.mjs` still requires namespace, writer, semantic, Security and
Production-preflight correlation PASS.

## Bootstrap boundary

This introducing change cannot rely on its own unmerged default-branch listener. Its initial PR must use the already-current canonical PR-create path. After Human/CODEOWNER merge, future approved agent-branch pushes can enter autonomous Draft-PR intake without a per-branch manual dispatch.

## Validation contract

1. pure lane-triage tests: free lane, same-project occupied lane, all canonical test lanes occupied;
2. deterministic priority/age/tie ordering;
3. ambiguous project labels fail closed;
4. workflow regression: signal has no permissions/checkout;
5. workflow regression: privileged intake uses `workflow_run`, same-repository boundary and canonical reusable writer;
6. workflow regression: PR writer reruns current-main/work-claim correlation before lane decision and external create;
7. exact-head hosted Governance, workflow-security and ordinary required checks remain required.

## Observed branch validation

Focused evidence on the implementation branch:

- `agentLaneTriage.mjs` syntax: PASS;
- focused Node triage suite: **7/7 PASS**;
- pure create-execution identity suite: **4/4 PASS**;
- free cross-project lane: PASS;
- same-project occupied lane: PASS / deferred;
- all-lanes-occupied prioritization: PASS;
- priority ordering `P0/P0-HIGHEST -> P1 -> P2 -> P3 -> unknown`: PASS;
- duplicate active PRs inside one project lane: fail-closed PASS;
- missing/ambiguous project labels: fail-closed PASS;
- canonical project routing readback: 11 unique current project IDs;
- changed workflow static security readback: explicit permissions, no `write-all`, no `pull_request_target`, no persisted checkout credentials and no unpinned external action references;
- trusted internal create identity: manual Owner + documentary-autosync + agent-autocreate + self-healing-recovery exact event/ref tuples; unknown/wrong tuples fail closed;
- claim coverage: all changed files covered, no uncovered path;
- branch correlation at the observed validation point: `behind=0` against the exact recorded execution baseline.

Not yet proven: hosted exact-head Required Checks, Zizmor execution, GitGuardian/Container/Governance terminal state, and post-merge autonomous provider behavior. Those remain PR/merge evidence, not local PASS.

## Exit

The package exits only after Human/CODEOWNER merge and post-merge readback proves that:

- autonomous intake exists on current main;
- no parallel PR-create authority exists;
- project lanes preserve global overlap fail-closed behavior;
- `ALL_LANES_OCCUPIED` triage tests pass;
- Human merge authority is unchanged.


## 2026-09-28 Self-Healing-Rekonstruktion

Der ursprüngliche Branch war bei Workflow-Run `36392118935` bereits 180 Commits
hinter `CURRENT_MAIN`. Der bestehende Draft-PR-Writer scheiterte deshalb korrekt im
`productionPreflight`, bevor eine PR-Mutation stattfand.

Der V2-Successor wird auf exaktem aktuellem `main` rekonstruiert. Zusätzlich erhält
der **bestehende** Draft-PR-Writer eine bounded Pre-create-Konvergenz:

- nur Branches in `agent/*|claude/*|grok/*|ai/*`;
- kein Force-Push;
- GitHub Merges API: exact `CURRENT_MAIN` → angeforderter Branch;
- kein Branch-Write, sobald bereits ein PR existiert;
- Merge-Konflikt fail-closed;
- Main-Race nach Sync fail-closed;
- exakter Ancestry-Readback vor Candidate-Checkout und `productionPreflight`;
- nach PR-Erstellung bleibt `sync-agent-pr-branches.yml` der einzige Branch-Sync-Writer.

Observed failure evidence:
`c62f19f611cdbeac21c4cdc9ec28154bd1f8a0a2` did not contain
`8542844df2f4044fa9fd793e04f034d508d74d46`.

## V2 Validierungsstand

1. **Authority/Lineage:** PASS — Branch wurde direkt von
   `CURRENT_MAIN 8542844df2f4044fa9fd793e04f034d508d74d46` rekonstruiert und
   steht beim Readback `behind=0`.
2. **Writer/Claim:** PASS — alle geänderten Pfade sind exakt vom einen aktiven
   V2-Claim abgedeckt; die zwei überlappenden Vorgängerclaims wurden auf ihren
   Branches `released/superseded`.
3. **Workflow Security static:** PASS — kein `pull_request_target`, kein
   `write-all`, kein Force-Push, keine persistierten Checkout-Credentials;
   `contents: write` existiert ausschließlich im bounded `precreate-sync` Job.
4. **GitHub parser/signal evidence:** PASS — `Agent Branch Signal` auf dem
   Successor wurde providerseitig erfolgreich ausgeführt, zuletzt Run
   `36394377353` / #45.
5. **Hosted PR gates:** PENDING — Production-/Immutable-Identity-Preflight,
   Workflow-Security, Governance, CI und Required Checks laufen erst auf dem
   Bootstrap-PR-Exact-Head. Kein fehlendes Hosted-Gate wird als PASS dargestellt.

Der Bootstrap-PR muss einmal über den bereits auf `CURRENT_MAIN` vorhandenen
manuellen Owner-`workflow_dispatch` erzeugt werden. Dieser V2-Branch enthält
`CURRENT_MAIN` bereits, sodass der beobachtete Fehler aus Run
`36392118935` (staler Head vor Production-Preflight) für diesen Bootstrap
nicht vorliegt. Nach Human/CODEOWNER-Merge aktiviert erst `main` den
autonomen `workflow_run`-Intake; der V2-Branch darf sich nicht selbst als
Default-Branch-Workflow autorisieren.


## Post-Merge Closure — 2026-09-28

- PR #1506 merged from exact head `61bcde7637cdb7b1d7c578e9a7e0dea616f3b166`.
- Merge commit / observed CURRENT_MAIN: `7eaca6eab69857e99bfb54c2afb372c22d93d958`.
- Exact-head Required Checks, Governance, Security and Production / Deploy Cadence: **PASS**.
- Decision state before merge: `READY_FOR_HUMAN_DECISION`.
- The V2 work claim is released and non-exclusive in this closure projection.
- The merged default-branch workflow is now authoritative for the autonomous
  `Agent Branch Signal -> workflow_run -> canonical Draft-PR writer` path.
- This closure branch is intentionally used as the first post-merge provider
  validation of that path. Successful provider-created Draft-PR intake closes
  the final behavioral exit evidence; Human/CODEOWNER merge remains unchanged.


## Post-Merge Provider Failure — autonomous intake startup

Provider validation on closure branch
`agent/governance-draft-pr-v2-postmerge-closure-20260928` exposed:

- Agent Branch Signal reached the provider path;
- Autonomous Draft-PR intake run `36407585596` terminated as
  `startup_failure` before any job was created;
- the reusable writer still declared `issues: write` on its dormant
  project-label convergence job while the autonomous caller intentionally
  delegated only `contents: write + pull-requests: write`;
- GitHub validates reusable-workflow permission ceilings before job-level
  conditions, so the dormant higher permission prevented startup.

Bounded correction:

- project-label convergence uses `pull-requests: write`, which is already
  delegated by the caller and sufficient for repository-label mutation in
  this existing workflow contract;
- no new token, actor, queue, PR writer or merge authority is introduced;
- regression coverage denies reintroduction of `issues: write` in this
  reusable workflow.

## Closure correlation — PR #1508

- PR #1506 merged at `7eaca6eab69857e99bfb54c2afb372c22d93d958`; the original V2 claim is `released / exclusive=false`.
- PR #1508 merged at `20b3d6320bcd3bc545d45ac3245807381469d8c6` and corrected the reusable writer permission ceiling after the observed `startup_failure`.
- The repository implementation and startup correction are merged. Successful provider-created Draft-PR intake after that correction remains an explicit readback gate; this document does not claim that missing provider evidence as PASS.
- Closure disposition: `MERGED_MAIN / EVIDENCE_GATE`. The leading Roadmap carries the same nonterminal state. Issues #1507 and #1509 are one package-level reconciliation, not two independent implementations.


## Post-Merge Provider Failure — App-authored PR GraphQL metadata read

Post-merge Public-Readiness continuation exposed a second provider-level Draft-PR writer gap after the earlier reusable-workflow permission-ceiling correction:

- OPS recovery branch `agent/operations-public-readiness-provider-auth-fallback-20260928` passed CURRENT_MAIN, production preflight, work-claim/overlap correlation, PR-body rendering and project-label classification.
- The canonical repository GitHub App token was created successfully with `Pull requests: write`.
- Final `gh pr create` failed before the PR mutation with:
  `GraphQL: Resource not accessible by integration (repository.defaultBranchRef)`.
- `gh pr create` resolves repository default-branch metadata before creating the PR, so the short-lived App token also requires repository `Contents: read`.

Bounded correction:

- add exactly `permission-contents: read` to the existing short-lived PR-author token;
- retain `permission-pull-requests: write`;
- do not add `contents: write`, `issues: write`, administration, Actions, merge, ruleset or deployment permissions;
- token remains limited to repository `Finance`;
- callers continue to pass only the existing private-key secret explicitly; `secrets: inherit` remains forbidden.

**Recovery branch:** `agent/governance-draft-pr-app-author-contents-read-fix-20260928`  
**Recovery baseline:** `main@c1a10880a96b7406970ab6aaf7ea2637a2f77d71`  
**Exit:** exact-head workflow-security/Governance/CI evidence passes; Human/CODEOWNER merge; then a fresh autonomous same-repository Agent Branch Signal proves the App can create a Draft PR and the resulting PR author is not the Human Owner.
