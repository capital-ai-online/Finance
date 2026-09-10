# HUMAN / OWNER Pull Request Approval Policy

**Authority ID:** `AUTH-GOV-HUMAN-OWNER-PR-APPROVAL`  
**Status:** REQUIRED  
**Version:** `3.4.0`  
**Effective from:** 2026-08-11  
**Updated:** 2026-09-07  
**Repository Owner:** `SvenKulessa`  
**Parent trust root:** `/AGENTS.md`

## Purpose and boundary

This policy defines the Human/Owner boundaries for Pull Requests targeting `main`: bounded approval before PR or Draft-PR creation and the later Human-only merge decision. It is subordinate to `/AGENTS.md` and cannot create a second repository agent-governance authority.

AI agents may prepare branches, commits, PR materials, validation evidence and scoped fixes. They MUST NOT create a PR or Draft PR without the bounded Approval Envelope defined below unless an effective explicitly scoped authority conditionally replaces only that approval surface, and they MUST NOT self-approve or autonomously merge.

For Human-readable work, the controlling development context is read in this order:

`Project Value Chain / PVC -> project Roadmap -> applicable ADR -> applicable ESS -> code/tests/evidence`.

Machine-readable registries and stable IDs support integrity and traceability; they do not replace that Human-readable navigation model.

## Current PR / CI state

```text
FINAL MAIN RE-SYNC + OPEN-PR CORRELATION
→ BOUNDED HUMAN/OWNER PR-CREATION APPROVAL ENVELOPE OR VALID SCOPED DELEGATION
→ IMMEDIATE PRE-CREATE RE-CORRELATION + ENVELOPE EVALUATION
→ PR OPEN / UPDATE
→ governance / workflow-security checks
→ technical build-and-test according to repository check classification
→ FINAL PR-HEAD / CURRENT-MAIN CORRELATION
→ separate Human/Owner merge decision
→ Human Merge
```

The former M10 Passkey/WebAuthn `AUTHORIZE_PR_CI` productive runtime is **RETIRED / OFF** after Human Merge of PR #691. Normal PR technical CI does not require or expect an M10 implementation.

Repository-wide and web-application-wide current-state discovery MUST NOT search for, expect, reconstruct or report missing M10 runtime/router/UI/workflow components as a gap. Historical M10 evidence remains non-authorizing and may be inspected only when an explicit audit/history task requires it.

Any future passkey/PR-CI authorization mechanism is a new separately scoped Human/Owner architecture/security/governance decision. It is not an M10 reactivation backlog.

## Human/Owner PR creation control

1. The gate applies to every Pull Request and Draft Pull Request, regardless of whether creation uses GitHub UI automation, API, MCP, connector, CLI, an agent tool or a trusted workflow.
2. Immediately before approval is requested, current `main` is refreshed, open/new writers are correlated, the branch is synchronized, conflicts are resolved and necessary low-cost validation is repeated.
3. The Owner receives the exact current Project/PVC/Owner mapping, project/source folder, Roadmap and current Roadmap objective, priority, `main` SHA, branch name, branch-head SHA, intended PR title/scope, materially relevant changed-file set, effective-change identity, branch work, available validation evidence, bounded Roadmap progress, Roadmap assessment, current-main/open-writer correlation result and the two highest-priority Roadmap/workaround continuation items.
4. The canonical PR-CREATION APPROVAL block from `/AGENTS.md` is the single PR-creation approval surface. Its embedded `Owner-Freigabe` field replaces every additional `Freigabe-Antwort`, duplicate approval line or second exact-response block for that PR-create gate.
5. The exact affirmative Human/Owner response is `PR Erstellung : Freigegeben`. A rejection may be expressed as `PR Erstellung : Nicht freigegeben`. Approval for the task, branch, commits, checks or general continuation is otherwise insufficient.
6. Immediately before creation, current `main`, branch head and merge base are read again; the changed-file set and effective-change identity are recomputed; new/open writers and changed-file, semantic, namespace, authority and security overlap are re-correlated; validation made stale by synchronization is repeated.
7. The Approval Envelope is then evaluated fail-closed as `APPROVAL_STILL_VALID`, `REAPPROVAL_REQUIRED` or `BLOCKED`. The PR is created only for `APPROVAL_STILL_VALID` under then-effective authority.
8. Agents and connectors stop fail-closed before the external PR-create mutation while required authority is absent, ambiguous, materially stale or blocked.

PR-creation approval or delegated PR-create authority is single-purpose. It never authorizes merge, deployment, production mutation, security weakening or another unrelated Pull Request.

## Approval Envelope

Human approval authorizes the bounded intended change. Repository correlation proves that the approved change remains safe against the repository state that exists immediately before PR creation.

The Approval Envelope binds at minimum:

- project ID and project folder;
- Primary PVC and Primary Owner;
- branch name;
- Roadmap item or explicit Owner scope;
- approved PR scope;
- approved materially relevant changed-file set;
- approved effective-change identity;
- intended PR title;
- approval timestamp or exact chat evidence;
- approval-base `main SHA` and approval branch-head SHA.

Approval-base and current `main`/branch-head SHAs are mandatory evidence and correlation anchors. **SHA equality is not semantic safety proof and SHA inequality is not by itself a material scope change.**

### Effective-change identity

The effective-change identity is a deterministic representation of the branch change relative to the relevant merge base. The repository helper `scripts/pr/approvalEnvelope.mjs` may combine the deterministically sorted changed-file set, normalized diff digest, scope binding and title binding.

No fingerprint, patch-id or digest is sufficient by itself. Equality cannot prove semantic safety; inequality cannot by itself prove a material change. Current-main, open-writer, semantic, namespace, authority, ownership, security and required validation checks remain controlling.

### Approval Envelope evaluation

Immediately before PR creation, evaluation resolves to exactly one of these states:

- `APPROVAL_STILL_VALID` — approved project/PVC/Owner, Roadmap or explicit Owner scope, PR purpose/title, materially relevant changed-file set and effective payload remain equivalent; final current-main/open-writer/semantic/namespace/authority/security correlation is `PASS`; and required validation is still valid or has been truthfully repeated.
- `REAPPROVAL_REQUIRED` — any material approved invariant changed, conflict resolution changed the approved payload, a material semantic dependency changed, the effective payload changed, or material equivalence cannot be established with sufficient confidence.
- `BLOCKED` — correlation, authority, ownership, validation, mergeability or security state conflicts, fails or remains unresolved.

A `NOT RUN`, `NOT_AVAILABLE`, missing or stale validation result is never represented as `PASS`.

## Main and branch-head drift

A `main` SHA movement requires re-reading then-current main authority, new merges, open PRs/writers and all relevant overlap. Approval may be preserved without another Human prompt only when the approved bounded change and effective payload remain materially equivalent and final correlation remains `PASS`.

A branch-head movement must distinguish synchronization-only Git identity changes from implementation payload changes. Rebase, permitted merge of current `main`, or another deterministic synchronization may preserve approval when the effective approved patch remains materially equivalent. New implementation content, scope expansion, changed business behavior, materially relevant file-set changes, dependency/configuration changes outside approved scope or conflict resolution that alters the approved payload require renewed approval.

Changed-file overlap is a correlation trigger, not automatic proof of safety or failure. Same-file, same-symbol/API/schema, authority/control, dependency/configuration and namespace overlap require stronger semantic review. Approval survives only with demonstrable material equivalence and `PASS` evidence; uncertainty requires reapproval or blocking.

## Authority drift

If then-current `main` changes `/AGENTS.md`, an applicable ADR, ESS, Control Catalog entry, Owner/PVC mapping or another authority relevant to PR creation, current authority is re-resolved first. Approval is preserved only when the then-effective authority still explicitly permits it. Otherwise renewed approval is required or execution stops fail-closed.

## Approval-block presentation and decision support

The canonical block is rendered as a fenced `yaml` code block so it is visually separated and syntax-highlightable in capable chat clients. Visual treatment is presentation only and never authority.

The block MUST include:

- Current Project and Primary PVC;
- Project Owner / Project Folder and affected source folder (`Quellordner`);
- Roadmap path and current Roadmap objective;
- priority `1/5` through `5/5` with a short relevance rationale;
- branch, approval-base/current `main` SHA, branch-head SHA, materially relevant changed-file set, effective-change identity and intended exact PR title;
- bounded work performed on the branch plus truthful validation/evidence, including `NOT RUN` where applicable;
- Roadmap progress as `before% -> after%` plus delta and an explicit measurement basis; if no defensible percentage can be derived, the block MUST state that limitation rather than fabricate progress;
- Roadmap assessment `/10`, State-of-the-Art assessment, Best-Practice assessment and open deviations;
- current-main/open-PR/parallel-writer and changed-file/semantic/namespace/authority/security correlation result;
- exactly the two highest-priority immediately actionable Roadmap items, or when the Roadmap provides no executable item, the two highest-priority evidence-backed workaround/remediation items, each with an exit gate;
- the single embedded `Owner-Freigabe` decision field, whose affirmative value is exactly `PR Erstellung : Freigegeben`.

Generic process instructions such as `merge the PR`, `run hosted CI`, `run tests` or `approve the PR` are reported, when relevant, as gate/evidence status and MUST NOT be emitted as the two Roadmap/workaround continuation items.

Priority semantics are:

- `1/5` — low relevance / local presentation or hygiene effect;
- `2/5` — limited project effect;
- `3/5` — material project/process effect;
- `4/5` — high cross-component or governance relevance;
- `5/5` — critical or strategic integrity/authority relevance.

## Mandatory reapproval triggers

Renewed explicit Owner approval is required when any of the following occurs:

- Current Project, Primary Owner or materially applicable Primary PVC changes;
- Roadmap item or explicit Owner scope changes;
- approved PR purpose or approval-bound intended title changes materially;
- effective branch payload changes;
- materially relevant changed-file set expands or changes without proven approved equivalence;
- conflict resolution modifies the approved implementation;
- a new semantic dependency changes the meaning of the approved patch;
- a new authority, namespace or security conflict appears;
- a governing ADR/ESS/control changes materially to the work and does not explicitly preserve the approval;
- required validation fails or becomes stale and cannot be repeated;
- final correlation is not `PASS`;
- payload equivalence cannot be established;
- approval evidence is missing, ambiguous or cannot be linked to the Approval Envelope.

The following do **not** require renewed approval by themselves: an unrelated main commit, an unrelated Human-merged PR, a `main` SHA change with no material interaction, a branch-head change caused solely by safe synchronization, merge-base movement with materially equivalent approved payload, or refresh of correlation evidence without approved-scope change.

## Bootstrap / activation boundary

A Pull Request that introduces or materially changes Approval Envelope semantics MUST itself follow the PR-creation approval rules effective on then-current `main` before that change is Human-merged. Candidate branch semantics cannot authorize their own PR creation. Only after Human/CODEOWNER Merge may the new semantics govern later PR-creation flows.

## Retired authorization signals

PR-body checkboxes, Files-Viewed state, `💪`/`okay`, labels, reactions, arbitrary review text and successful CI are non-authorizing as Human identity/merge credentials. Historical evidence may retain them as history.

A separate chat line named `Freigabe-Antwort` is retired for the canonical PR-creation gate. The `Owner-Freigabe` field inside the canonical PR-CREATION APPROVAL block is the sole PR-create response surface.

## Human Merge control

1. Every merge into `main` MUST originate from a Pull Request targeting `main`; direct-to-`main` repository edits and merge paths that bypass the PR boundary remain prohibited.
2. `MERGE` remains Human/Owner-only. Agents, chats, connectors and delegated execution sessions do not perform the merge, enable auto-merge or manufacture merge authority.
3. Immediately before the Human merge decision, the current `main` SHA and current PR-head SHA MUST be re-read and the PR MUST be correlated against then-current `main`. The final correlation covers merge-base/current-main drift plus relevant changed-file, semantic, namespace, authority and concurrent-writer conflicts.
4. If `main` or the PR head changed after the last valid pre-merge correlation, that correlation is stale and MUST be repeated. A PR may not be treated as merge-ready on an obsolete main baseline.
5. Required CI is technical evidence, never sufficient authorization. Required final-head checks and unresolved conflict/review status remain part of merge evidence where applicable.
6. The concrete PR requires a separate explicit Human merge decision after final current-main correlation.
7. Protected external mutations remain separate and use their own approval controls.

## PR template and evidence

PR metadata records scope, authority, risk, baseline and validation but does not create authority. Minimum creation-gate evidence includes the bounded Approval Envelope, approval-base and current main/head SHAs, current merge base/effective-change identity, final correlation result and the applicable explicit Human/Owner creation approval or valid explicitly scoped delegation. Minimum merge evidence separately includes final PR-head SHA, then-current-main SHA, final PR-head/current-main correlation, required final-head checks, unresolved-conflict/review status and the Human/Owner merge decision.

`Candidate Head`, `candidate snapshot`, `candidate SHA` and equivalent lifecycle wording are retired from current PR-governance terminology. Historical records may preserve the old labels where necessary for audit, but current instructions and new evidence use `branch head`, `PR head`, `main SHA` and `merge SHA`.

## Owner authentication assurance

GitHub review text does not prove strong authentication. Where a protected action requires WebAuthn/TOTP/break-glass assurance, the corresponding current effective control must be used. Retired M10 material is not a current authentication mechanism and is never inferred from historical documentation.

## Agent capability restriction

Agents may READ, ANALYZE, PLAN, create scoped branches/commits, prepare PR materials, evidence and scoped fixes according to current Roadmap/authority and `/AGENTS.md`. They may open a concrete PR or Draft PR only after the applicable creation authority is satisfied and the immediate pre-create Approval Envelope evaluation permits it. They stop before Human Merge and may not expand their own authority.

## Canonical references

- `/AGENTS.md` / `AUTH-GOV-AGENT-TRUST-ROOT`;
- `docs/projects/PROJECT_VALUE_CHAIN.md`;
- the affected project's `ROADMAP.md`;
- applicable accepted ADRs and active ESS;
- `docs/governance/control-catalog.json` / `CTRL-SDLC-PR-CREATE-001`, `CTRL-SDLC-CHAT-HANDOFF-001`, `CTRL-CI-M10-001` and `CTRL-MERGE-HUMAN-001`;
- `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`;
- `scripts/pr/approvalEnvelope.mjs` and `scripts/pr/approvalEnvelope.test.mjs`;
- `docs/architecture/ROADMAP.md`.

`docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md` is historical audit/design evidence only. It is not a current implementation prerequisite, discovery target, reactivation plan or authorization mechanism.
