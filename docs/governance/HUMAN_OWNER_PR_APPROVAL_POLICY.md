# HUMAN / OWNER Pull Request Approval Policy

Status: REQUIRED
Effective from: 2026-08-11
Updated: 2026-08-12
Repository Owner: `SvenKulessa`

## Purpose

Every pull request targeting `main` MUST remain human-visible and MUST receive a lightweight but explicit Owner review **before expensive CI/build/test execution begins**.

AI agents, coding assistants and connector clients may prepare branches, commits, pull requests, evidence and proposed fixes. They MUST NOT self-approve or autonomously merge a pull request.

## Verbindlicher PR-Template-Contract

Jeder Pull Request gegen `main` MUSS die kanonische Vorlage `.github/pull_request_template.md` verwenden. Die Vorlage ist ein Governance-Contract und kein optionaler Textbaustein.

Es gelten folgende Invarianten:

1. Kein Agent, Connector, lokaler Client oder Human darf einen verkürzten oder frei formulierten PR-Body anstelle der kanonischen Vorlage verwenden.
2. Alle nummerierten Template-Abschnitte bleiben erhalten; nicht zutreffende Felder werden mit `N/A` begründet statt entfernt.
3. Maschinenlesbare Marker, Baseline-Blöcke und Human-/Owner-Attestations dürfen nicht umbenannt, paraphrasiert oder entfernt werden.
4. Die beiden Owner-Gate-Checkboxen müssen exakt die vom CI-Gate erwarteten normalisierten Aussagen enthalten:
   - `Human/Owner: vollständigen PR-Diff geprüft.`
   - `Human/Owner: alle geänderten Dateien im Tab Files changed als Viewed markiert.`
5. Ein PR-Body-Update durch einen Agenten muss von der aktuell auf dem PR-Branch versionierten Template-Datei ausgehen und darf nur die vorgesehenen Felder mit PR-spezifischen Inhalten befüllen.
6. Ein neuer PR-Head invalidiert die Head-gebundene Review-/Approval-Evidence. Die Template-Checkboxen müssen danach erneut im vorgeschriebenen Ablauf gesetzt werden.
7. Abweichende PR-Bodies sind Governance-Fehler und dürfen nicht als `VERIFIED PASS` klassifiziert werden.

Eine maschinelle Template-Contract-Prüfung MUSS als separater Governance-Hardening-Change eingeführt werden. Diese Policy allein ersetzt bis dahin nicht die bestehende Owner-Gate-Prüfung.

## Human-visible change requirement

Before technical validation starts, the Owner MUST inspect the GitHub pull-request diff under `Files changed`.

The Owner MUST mark every changed file as `Viewed` in the GitHub UI. GitHub does not expose the per-user `Viewed` state as a reliable GitHub Actions API signal. Therefore enforcement is two-part:

1. the Owner performs the per-file `Viewed` actions in the UI;
2. the Owner explicitly attests completion through the mandatory PR-body checkbox.

This limitation MUST NOT be represented as if Actions could independently prove the per-file UI state.

## Pre-CI Owner gate

Expensive CI MUST NOT start until all of the following are true for the current PR head:

1. PR body contains checked task-list attestations with the following normalized statement contents:
   - `Human/Owner: vollständigen PR-Diff geprüft.`
   - `Human/Owner: alle geänderten Dateien im Tab Files changed als Viewed markiert.`
2. repository Owner `SvenKulessa` submitted a GitHub pull-request review for the exact current PR head commit;
3. after trimming surrounding whitespace, the review body is exactly `💪` or, case-insensitively, exactly `okay`.

The task-list parser is intentionally **semantically strict but Markdown-tolerant**. It accepts `[x]`/`[X]`, optional inline-code backticks such as `` `Files changed` ``, CRLF and insignificant whitespace differences. It MUST NOT count unchecked boxes, quoted attestations or attestations placed inside fenced code blocks. The normalized statement contents themselves remain fixed and fail-closed.

The review parser is likewise fail-closed: prose that merely contains `💪` or `okay` is not approval evidence. The complete trimmed review value must match one of the two approved signals.

**Event-Snapshot-Regel:** Die Attestations werden aus dem PR-Body-Snapshot des konkret auslösenden `pull_request: edited`-Events bewertet. Der Workflow darf hierfür nicht den späteren Live-PR-Body erneut laden. Dadurch kann ein früher Checkbox-Event nicht nachträglich durch einen zweiten Checkbox-Klick freigegeben werden und keinen zweiten teuren Build auslösen.

A new commit invalidates the previous review evidence for gating purposes. The Owner must inspect the delta, submit a new current-head review and only then save the two Owner attestations as the final CI trigger. Nach einem neuen Head müssen bereits gesetzte Attestations zurückgesetzt und für den neuen Head erneut gesetzt werden.

## CI sequencing — single expensive trigger

The required sequence is intentionally:

`PR OPEN/UPDATE → FILES CHANGED REVIEW → ALL FILES VIEWED → CURRENT-HEAD REVIEW (💪/okay) → PR-DIFF CHECKBOX → FILES-CHANGED CHECKBOX LAST → ONE build-and-test → MERGE ELIGIBLE`

GitHub kann beim Anklicken gerenderter Markdown-Checkboxen **pro Checkbox einen eigenen `edited`-Event** erzeugen. Deshalb gilt:

- die PR-Diff-Attestation wird nach dem Current-Head-Review zuerst gesetzt;
- die `Files changed`-/`Viewed`-Attestation wird **zuletzt** gesetzt und ist der finale normale CI-Trigger;
- ein vorheriger Event, bei dem noch nicht beide Attestations gesetzt waren, darf wegen der Event-Snapshot-Regel kein `build-and-test` autorisieren;
- `concurrency` mit `cancel-in-progress: true` begrenzt gleichzeitige Läufe desselben PRs zusätzlich; die inhaltliche Autorisierung bleibt trotzdem an den konkreten Event-Snapshot gebunden.

Opening the PR, pushing a commit or submitting the review alone MUST NOT independently start a full build/test run.

Before the final Owner-checkbox edit:

- Git source/integrity work beyond lightweight governance MUST NOT trigger a full software validation run;
- npm dependency installation/audit MUST NOT run;
- TypeScript/unit tests MUST NOT run;
- production build MUST NOT run;
- Docker build MUST NOT run.

After the final Owner-checkbox edit:

- exactly one scope-appropriate `build-and-test` job is expected for the current PR head;
- documentation-only changes use the fast path inside that same job;
- code changes run npm/audit/TypeScript/unit/build checks inside that same job;
- protected post-build tests that require generated `dist/` artifacts run **after** the production build;
- Docker/runtime checks run only when the changed-file scope requires them;
- governance/security workflows may run independently because they are lightweight policy checks.

If a new commit changes the PR head, the previous review is no longer valid for that head. Revalidation requires reset attestations, a new current-head review and then the ordered final checkbox sequence above. Normal operation remains one expensive `build-and-test` run per reviewed PR head.

Successful technical validation is still not merge authorization. Merge requires the existing Human/Owner policy and, when an AI client is used for the merge operation, a separate explicit human instruction for that specific PR.

## Owner authentication assurance

GitHub Actions can verify that the GitHub review author is account `SvenKulessa`, but it cannot determine whether that review session used a specific physical device or passkey. Device-ID claims alone MUST NOT be treated as a strong authentication factor.

For privileged future transitions (especially production mutation, break-glass and autonomous-agent capability elevation), the target architecture SHOULD add a separate CAPITAL-AI WebAuthn/passkey step-up assertion bound to actor + action + target + request/PR head. Until that service exists, no workflow may claim that GitHub review evidence proves passkey/device authentication.

## AI-agent capability restriction

Until a future independently approved merge-controller architecture replaces this rule:

- AI agents MAY: READ, ANALYZE, PLAN, BRANCH, COMMIT, open/update PRs, inspect CI and propose fixes when allowed by the active roadmap profile.
- AI agents MUST STOP before MERGE.
- ChatGPT, Claude and other AI clients MUST NOT interpret CI success as merge authorization.
- Merge is permitted only after the Human/Owner gate is satisfied.
- A merge through an AI client additionally requires an explicit human instruction to merge that specific PR after approval exists.

Read-only daily-task agents are governed separately by `AUTONOMOUS_AGENT_CONCEPT_GATE.md` and MUST NOT receive BRANCH, COMMIT, PR, CI_REQUEST, DEPLOY_REQUEST, PRODUCTION_MUTATION or MERGE capabilities.

## Evidence

The pull request is the evidence bundle:

1. canonical `.github/pull_request_template.md` structure retained in the PR body;
2. visible `Files changed` diff;
3. Owner attestation that all changed files were marked `Viewed`;
4. two checked Human/Owner PR-body boxes in the final triggering event snapshot;
5. current PR head SHA;
6. Owner review attached to that exact SHA with exact trimmed value `💪` or `okay`;
7. final `Files changed`-/`Viewed` checkbox edit after that review;
8. exactly one normal expensive `build-and-test` run for that reviewed head;
9. resulting merge commit.

This policy is part of the CAPITAL-AI DevelopmentChain and must remain synchronized with `docs/architecture/ROADMAP.md`, Agent IAM policy and merge governance.
