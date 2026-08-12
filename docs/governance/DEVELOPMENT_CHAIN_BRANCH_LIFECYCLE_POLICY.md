# DEVELOPMENT Chain Branch Lifecycle Policy

Status: PROPOSED
Date: 2026-08-12
Repository: `SvenKulessa/Finance`
Authority: DevelopmentChain, ADR-0039, ESS-0021/ADR-0065

## Ziel

Diese Policy verhindert langlebige Agent-Branches, versehentliche Wiederverwendung gemergter Arbeitsstände, Direktarbeit auf `main` und unklare Zuständigkeit zwischen parallelen AI-/Human-Workstreams.

## Verbindlicher Lifecycle

Jedes eigenständige Arbeitspaket verwendet:

```text
current main
→ new scoped branch
→ bounded changes
→ Pull Request
→ Human review / required CI
→ explicit Human merge
→ remote branch deletion
→ local ephemeral workspace cleanup
```

## 1. Baseline

Vor Branch-Erstellung:

1. aktuellen `main` SHA auflösen;
2. offene PRs und Changed-File-Overlap prüfen;
3. Roadmap-/ESS-/ADR-Gate prüfen;
4. Checkklasse bestimmen;
5. Scope und erwartete Zielpfade festlegen.

Ein Branch darf nicht bewusst von einem veralteten Baseline-SHA erzeugt werden, wenn aktuelles `main` ohne Konflikt verfügbar ist.

## 2. Neuer Branch pro Workitem

Für jedes neue Roadmap-/Fix-/Dokumentations-Workitem ist ein **neuer Branch** erforderlich.

Erlaubte Beispiele:

- `agent/<scope>`
- `docs/<scope>`
- `fix/<scope>`

Ein bereits gemergter, geschlossener oder supersedeter Branch darf nicht für ein neues Workitem wiederverwendet werden.

## 3. Geklonte Repositories / Worktrees

Ein lokaler Clone, Agent-Workspace oder Worktree ist nur eine Arbeitskopie und niemals die Autorität.

Verbindlich:

- keine Commits direkt auf lokalem `main`;
- nach Clone/Checkout für jedes Workitem einen neuen Finance-Branch erzeugen;
- Remote-Ziel muss das autorisierte Finance Repository sein;
- kein Wechsel auf einen alten gemergten Agent-Branch für neue Arbeit;
- lokale temporäre Branch-/Worktree-/Clone-Zustände dürfen keine nicht gepushten Evidence-/Rollback-Informationen enthalten, bevor sie entfernt werden.

## 4. Parallel Work Gate

Vor dem ersten mutierenden Commit sowie erneut vor PR-Erstellung:

- offene PRs abrufen;
- Changed Files vergleichen;
- identische oder semantisch gekoppelte Zielpfade erkennen.

Bei Konflikt:

- `RESCOPE`,
- `SEQUENCE`,
- älteren Branch/PR zuerst abschließen,
- oder Human/Owner entscheidet ausdrücklich über die Konfliktbehandlung.

Ein Agent darf einen Konflikt nicht durch Force-Push, ungeprüftes Rebase oder Überschreiben fremder Arbeit „lösen“.

## 5. PR-Grenze

Der Branch bleibt bis zum Merge der einzige Schreibkontext für das Workitem.

Neue Commits nach Human Current-Head Review invalidieren die Review-/Approval-Evidence für den alten Head nach der jeweils geltenden Owner-Gate-Policy.

`MERGE` bleibt Human/Owner-only.

## 6. Nach erfolgreichem Merge

Nach erfolgreichem Human-Merge in `Finance/main` ist verpflichtend:

1. Merge SHA und finalen PR-Status in Evidence erfassen;
2. sicherstellen, dass keine erforderliche Post-Merge-Verifikation mehr vom Branch abhängt;
3. **Remote-Arbeitsbranch im Finance Repository löschen**;
4. lokalen Branch entfernen, sofern er nicht für Evidence-Untersuchung temporär benötigt wird;
5. kurzlebige, nur für das Workitem erzeugte Clone-/Worktree-Kopie nach Sicherung der Evidence löschen;
6. für das nächste Arbeitspaket erneut von aktuellem `main` starten.

## 7. Closed / Superseded / Abandoned

Nicht gemergte, geschlossene oder supersedete Branches werden nach Sicherung notwendiger Evidence ebenfalls gelöscht. Ein supersedeter Branch darf nicht als versteckte Fortsetzung eines neuen Roadmap-Punkts dienen.

## 8. Rollback

Repository-Rollback erfolgt grundsätzlich über einen **neuen** scoped Rollback-/Revert-Branch aus aktuellem `main`, nicht durch Wiederbelebung des ursprünglichen gemergten Arbeitsbranchs.

Bei externer Plattformmutation gelten zusätzlich die plattformspezifischen Rollback-Schritte der DevelopmentChain.

## 9. Agentenregel

Alle AI-/Agent-Clients, einschließlich ChatGPT, Claude, Google AI Studio und des Systemadmin Roadmap Executors, müssen diese Branch-Regel befolgen.

Eine Execution Host Capability `BRANCH` autorisiert nur die Erzeugung des für den gebundenen Auftrag vorgesehenen neuen Branchs. Sie autorisiert keine Wiederverwendung oder Erweiterung eines alten Branchs.

## Exit Evidence

Ein Roadmap-Schritt mit Repository-Mutation ist erst vollständig geschlossen, wenn folgende Zustände dokumentiert sind:

- PR merged by Human;
- final merge SHA bekannt;
- Branch deleted;
- ggf. Post-Merge/Production Verification abgeschlossen;
- Roadmap/Traceability synchronisiert.