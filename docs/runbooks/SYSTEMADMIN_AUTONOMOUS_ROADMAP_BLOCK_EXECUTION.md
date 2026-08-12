# Systemadmin Runbook — Autonomous Roadmap Block Execution

Status: PROPOSED  
Date: 2026-08-12  
Authority: ADR-0069, ESS-0021, ADR-0065, DEVELOPMENT Chain Execution Policy

## 1. Purpose

Dieses Runbook definiert den wiederholbaren Ablauf, mit dem der `capital-ai-systemadmin-roadmap-executor` einen Owner-approved größeren DEVELOPMENT-Chain-Roadmap-Block autonom in mehreren Repository-Execution-Units bis zu den jeweils festgelegten Pull-Request-Checkpoints bearbeitet.

Es gilt erst als Runtime-Ausführungsweg, nachdem SA4B technisch implementiert und `VERIFIED PASS` ist. Vorher ist es die verbindliche Implementierungs-/Validierungsanforderung für SA4B.

## 2. Core invariant

```text
ONE OWNER-APPROVED BLOCK REM
→ EU-01 fresh branch → implement/test → PR → STOP
→ HUMAN review/CI/merge → branch delete
→ EU-02 fresh branch from new main → implement/test → PR → STOP
→ HUMAN review/CI/merge → branch delete
→ ...
→ optional separate production-mutation gate
→ block closure evidence
```

`MERGE` und externe Production Mutation werden nicht durch diesen Ablauf delegiert.

## 3. Inputs

Vor Start müssen verfügbar sein:

- kanonischer Roadmap-Punkt und Execution State;
- ADR/ESS/Runbook Authority;
- Owner-approved REM, das alle vorgesehenen EU-IDs enthält;
- Roadmap Block Contract nach `.ai/contracts/development-chain-roadmap-block.schema.json`;
- Contract-Digest/Binding im technisch enforcebaren SA4B-Host;
- current `main` SHA;
- aktuelle Open-PR-Inventur;
- M5 Audit-Persistenz;
- CI-Budget Policy.

Ein Issue/Chat-Prompt ist nur Trigger/Transport und darf keinen Scope ergänzen.

## 4. Block preflight

Read-only und fail-closed:

1. Repository = `SvenKulessa/Finance`;
2. baseBranch = `main`;
3. aktuellen `main` SHA auflösen;
4. Roadmap item und predecessor gate prüfen;
5. REM status/owner/agent/repository/expiry/kill switch prüfen;
6. Block Contract gegen Schema validieren;
7. Contract↔REM↔Roadmap IDs/Digest prüfen;
8. prüfen, dass keine EU Self-Authority-/Trust-Root-Pfade verlangt;
9. Open PRs und Changed-File-Overlap lesen;
10. maxOpenPullRequests/CI-Budget prüfen;
11. Audit write-path availability prüfen;
12. nächste unblocked EU deterministisch auswählen.

Bei Mehrdeutigkeit: `STOP_SECURITY_CRITICAL_AMBIGUITY`.

## 5. Execution Unit preflight

Für die ausgewählte EU:

1. `dependsOn` prüfen;
2. previous PR merge + branch delete Evidence prüfen;
3. current main muss vorherigen Merge enthalten;
4. per-EU allowed paths gegen REM global paths schneiden;
5. Capability/Risk/Mutation Class prüfen;
6. PR check class bestimmen und mit Contract vergleichen;
7. required tests/negative tests vorbereiten;
8. rollback executable prüfen;
9. concurrent writer check erneut durchführen;
10. frischen Branch-Namen erzeugen.

Empfohlenes Branch-Schema:

`agent/<block-id>/<unit-id>-<yyyymmdd>`

Der Branch MUSS vom im Preflight aufgelösten aktuellen `main` erstellt werden.

## 6. Permit-before-side-effect

Für jede mutierende Capability bleibt die SA3A/SA3B-Kette Pflicht:

```text
policy ALLOW
→ durable M5 authorization event
→ auditReference
→ exact audit-bound permit
→ side effect
→ durable terminal outcome
```

Mindestens getrennte Permits für:

- BRANCH;
- COMMIT;
- PR;
- CI_REQUEST, wenn verwendet.

Ein Permit für eine Capability autorisiert keine andere Capability.

## 7. Implementation loop

Innerhalb einer EU darf der Systemadmin autonom:

1. erlaubte Dateien lesen;
2. Code/Dokumentation/Tests innerhalb des per-EU Scope ändern;
3. targeted Tests ausführen;
4. Security Self-Check durchführen;
5. negative tests ausführen;
6. bei Fehlern innerhalb des Scope korrigieren;
7. scoped Commit erstellen;
8. bei Bedarf weitere scoped Commits erstellen;
9. finalen Diff gegen per-EU Scope validieren;
10. review-ready PR erstellen/aktualisieren.

### Verbotener Execution-Mechanismus

Kein untrusted Issue-/Chat-/Roadmap-Text darf als beliebiger Shell-Befehl, `eval`, frei zusammengesetztes Script oder unrestricted tool invocation ausgeführt werden.

SA4B muss stattdessen einen technisch begrenzten Code-/Patch-Pfad verwenden, dessen Datei- und Capability-Grenzen vor jedem Side Effect geprüft werden.

## 8. Test discipline

Während Implementierung:

- targeted tests zuerst;
- keine redundanten full CI runs für unveränderten Head;
- bekannte failing precondition nicht ohne Änderung erneut ausführen;
- Security-/negative tests für betroffene Trust Boundary obligatorisch;
- CI-Budget Policy beachten.

Vor review-ready PR muss die EU alle im Contract benannten lokalen/targeted Exit Tests erfüllen.

## 9. Pull Request checkpoint

Sobald der review-ready PR erzeugt wurde:

`AUTONOMOUS STOP = PR_CHECKPOINT_REACHED`

Der Agent darf anschließend nur noch innerhalb derselben EU:

- PR/Governance/CI Evidence lesen;
- vor finalem Human Review scope-konforme CI-/Governance-Fehler beheben;
- PR aktualisieren;
- Evidence synchronisieren.

Er darf nicht:

- mergen;
- nächste EU starten;
- Scope erweitern;
- Human Review imitieren;
- Owner-Attestations selbst setzen;
- externe Production Mutation ausführen.

## 10. Human checkpoint

Der Human/Owner führt die jeweils aktuelle PR-Governance aus.

Die konkrete UI-/Event-Ausgestaltung kann sich durch spätere M10-/PR-Governance-Härtung ändern. Die stabile Architekturgrenze bleibt:

```text
Human inspects current-head diff
→ required Human approval evidence
→ required technical CI/evidence
→ separate Human merge decision
```

Der Systemadmin darf keinen veralteten Human-Gate-Mechanismus hart codieren; er konsumiert die jeweils kanonische `HUMAN_OWNER_PR_APPROVAL_POLICY.md`.

## 11. Post-merge resume

Nach Human Merge liest der Agent den Zustand neu und prüft:

1. PR ist `merged`;
2. Merge SHA ist auf aktuellem main;
3. required CI Evidence ist erfolgreich;
4. Work Branch ist gelöscht;
5. vorherige EU Evidence ist vollständig;
6. REM weiterhin gültig;
7. Roadmap Gate weiterhin unblocked;
8. nächste EU ist im REM/Contract enthalten;
9. kein Open-PR-Overlap;
10. kein Human-only external mutation gate liegt zwischen den Units.

Wenn alle Bedingungen PASS: nächste EU beginnt auf **neuem** Branch aus aktuellem main.

Wenn Branch noch existiert: keine nächste EU; Branch-Lifecycle zuerst schließen.

## 12. External mutation boundary

Wenn nach einem Repository-PR eine Supabase-/Render-/Stripe-/andere Production Mutation erforderlich ist:

```text
repository checkpoint merged
→ STOP_EXTERNAL_MUTATION_APPROVAL_REQUIRED
→ read-only pre-mutation baseline
→ explicit Owner mutation approval
→ DevelopmentChain Mutation Handoff
→ authorized external executor
→ post-verification
→ Evidence
```

Ein blockweites Repository-REM darf diese Freigabe nicht ersetzen.

## 13. Failure and rollback

### Vor PR

Bei Scope-/Test-/Audit-/Drift-Fehler:

- keine weitere Mutation;
- exact branch rollback/delete nur nach dem dafür autorisierten bounded host contract;
- terminal ERROR/DENY Outcome persistieren;
- keine nächste EU.

### Nach PR-Erstellung

Wenn PR invalid/superseded:

- exact PR gemäß zulässigem Host-Contract schließen;
- exact work branch löschen;
- Evidence sichern;
- neuer Versuch nur mit neuer Base/Branch und gültiger Authority.

### Nach Human Merge

Repository rollback nur als separater Human-governed Revert-PR. Der Agent darf einen Revert vorbereiten, aber nicht autonom mergen.

## 14. Stop codes

Canonical minimum set:

- `STOP_REM_INVALID_OR_EXPIRED`
- `STOP_KILL_SWITCH_ACTIVE`
- `STOP_ROADMAP_GATE_BLOCKED`
- `STOP_AUTHORITY_DRIFT`
- `STOP_SCOPE_MISMATCH`
- `STOP_SELF_AUTHORITY_PATH`
- `STOP_RESERVED_OWNER_ACTION`
- `STOP_OPEN_PR_OVERLAP`
- `STOP_STALE_BASE`
- `STOP_AUDIT_UNAVAILABLE`
- `STOP_CI_BUDGET`
- `STOP_TEST_FAILURE`
- `STOP_PR_CHECKPOINT_REACHED`
- `STOP_EXTERNAL_MUTATION_APPROVAL_REQUIRED`
- `STOP_ROLLBACK_INCONCLUSIVE`
- `STOP_SECURITY_CRITICAL_AMBIGUITY`

## 15. Evidence per EU

Required minimum:

- REM + block contract refs;
- blockId/unitId;
- start main SHA;
- branch;
- preflight decision;
- authorization/outcome refs for every mutating capability;
- changed path inventory;
- test results;
- final commit/head;
- PR number;
- Human review/CI result;
- merge SHA;
- branchDeleted=true;
- rollback state;
- resume decision for next EU.

## 16. Block closure

Der Agent darf einen Block erst als closure-ready melden, wenn alle Repository Units ihre Human Merge Checkpoints passiert haben, Branches gelöscht sind und optionale externe Mutation Gates entsprechend der kanonischen Roadmap abgeschlossen wurden.

Die eigentliche Statusänderung auf `COMPLETE / VERIFIED PASS` erfolgt durch Synchronisierung der bestehenden Roadmap/Traceability anhand der Evidence; der Block Contract selbst führt keinen Status.
