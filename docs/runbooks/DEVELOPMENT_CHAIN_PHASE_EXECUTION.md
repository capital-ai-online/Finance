# DEVELOPMENT Chain Phase Execution Runbook

Status: PROPOSED
Date: 2026-08-12
Authority: `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`

## Zweck

Dieses Runbook ist die generische Ausführungssequenz für jeden DEVELOPMENT Chain Roadmap-Punkt. Phasenspezifische Runbooks dürfen diese Regeln verschärfen, aber nicht abschwächen.

## 0. Eingangsvoraussetzungen

Vor Beginn müssen bekannt sein:

- Roadmap Phase / Item;
- aktueller `main` SHA;
- Authority Refs (Roadmap/ESS/ADR);
- erwartete Zielpfade;
- Checkklasse D/C/R/M;
- Risk Class;
- Mutation Class;
- erwartete Evidence;
- Rollback-/Stop-Bedingungen.

Fehlen sicherheitsrelevante Eingaben, gilt `STOP`.

## 1. Read-only Preflight

1. aktuellen `main` und relevante Production Baseline auflösen;
2. offene PRs und Changed-File-Overlap prüfen;
3. bestehende ADR/ESS/Runbooks/Evidence lesen;
4. Drift zwischen Roadmap, Code, Runtime und Plattformstatus erfassen;
5. Scope/Risk/Checkklasse bestimmen;
6. erforderliche positive und negative Tests definieren;
7. externe Mutation als `NOT REQUIRED`, `PLANNED` oder bereits separat `HUMAN APPROVED` klassifizieren;
8. Rollback-/Kill-Switch-Verfügbarkeit prüfen.

## 2. Branch-Erstellung

Nur nach bestandenem Preflight:

```text
current main → fresh scoped branch
```

- niemals direkt auf `main` schreiben;
- kein gemergter/supersedeter Branch wird wiederverwendet;
- Clone/Worktree muss vor Edits auf dem neuen Branch stehen.

## 3. Repository Implementation

Implementiere nur den genehmigten Scope.

Pflichten:

- least privilege;
- fail-closed Security Gates;
- keine Fake-/Mock-Daten in produktiven Pfaden;
- keine Secrets in Code/Evidence;
- negative Tests bei Auth/IAM/Mutation/Trust-Boundary-Änderungen;
- keine opportunistische Plattformmutation aus einer Codeaufgabe;
- Dev-Plane dokumentiert erforderliche Stripe/Supabase/Render-Handoffs statt sie direkt auszuführen.

## 4. Pre-PR Verification

Vor PR-Erstellung:

1. Diff gegen `main` prüfen;
2. offene PRs erneut auf Overlap prüfen;
3. Checkklasse ggf. hochstufen;
4. relevante Tests ausführen, ohne redundante teure CI-Läufe zu erzeugen;
5. Scope, Risiken, Rollback und Mutation State dokumentieren.

PR-Erstellung folgt der jeweils geltenden Human-/REM-Policy.

## 5. Human Review / CI

Für den aktuellen Head:

- Human File Review;
- alle erforderlichen Owner-Gates;
- genau die Checks der strengsten Checkklasse;
- keine Interpretation von grünem CI als Merge-Autorität.

Ein neuer Commit invalidiert Head-gebundene Review-/Approval-Evidence.

## 6. Human Merge / Branch Cleanup

Nach separater Human Merge-Anweisung:

1. Merge ausführen;
2. Merge SHA erfassen;
3. erforderliche Post-Merge Repository-/Runtime-Checks durchführen;
4. Remote-Branch im Finance Repository löschen;
5. lokalen Branch / ephemeren Worktree/Clone nach Evidence-Sicherung bereinigen.

Wenn keine externe Mutation erforderlich ist, direkt zu Schritt 10.

## 7. External Pre-Mutation Check

Vor jeder externen Mutation:

- exakten Account/Project/Service/Environment bestätigen;
- aktuellen Zustand und Drift erfassen;
- Last-Known-Good / Backup / Rollback prüfen;
- konkurrierende Writer ausschließen;
- geplante Operationen gegen Roadmap/ADR/Runbook prüfen;
- Handoff Contract vorbereiten;
- Secrets nur über den autorisierten Credential Host referenzieren, niemals in Handoff/Evidence kopieren.

Precheck `FAILED` oder `INCONCLUSIVE` → `STOP`.

## 8. Explicit Human Mutation Approval

Externe Mutation startet erst nach einer separaten, scope-/target-gebundenen Human/Owner-Freigabe, wenn die Policy sie verlangt.

Die Approval Evidence muss an mindestens Roadmap Item, Target, Operation, Risk und Gültigkeitsfenster gebunden sein.

Ein Roadmap-/Dokumentations-Merge allein ist keine Produktionsmutation Approval.

## 9. Authorized Mutation Execution

Bevorzugter autonomer Pfad nach dessen eigener Verifikation:

```text
validated Handoff
→ REM / IAM / reserved-action gate
→ durable authorization audit
→ exact execution-host permit
→ exact side effect
→ durable outcome audit
→ post-verification
```

Direkte Connector-/Tool-Mutation ohne enforcebaren Permit-before-side-effect-Pfad darf nicht als autonom `VERIFIED PASS` klassifiziert werden.

Bei Fehler:

- keine Folgeoperationen;
- terminales ERROR Evidence;
- Rollback nach Runbook;
- Post-Rollback Verification.

## 10. Evidence Closure

Nutze `docs/evidence/templates/DEVELOPMENT_CHAIN_PHASE_EVIDENCE_TEMPLATE.md`.

Mindestens dokumentieren:

- Baseline;
- Authority;
- Branch/PR/Head/Merge;
- Checkklasse;
- Tests;
- Mutation State;
- Approval/Audit References;
- Pre/Post/Negative Checks;
- Rollback State;
- Branch deleted;
- finalen Exit Gate.

## 11. Roadmap Synchronization

Nach erfolgreicher Verifikation synchronisieren:

1. `docs/architecture/ROADMAP.md`;
2. `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md`;
3. `docs/roadmaps/AI_AGENT_M0_M9_IMPLEMENTATION_ROADMAP.md`;
4. `docs/traceability/AI_AGENT_M0_M9_TRACEABILITY_MATRIX.md`;
5. `docs/traceability/DEVELOPMENT_CHAIN_DOCUMENT_TRACEABILITY_MATRIX.md`;
6. betroffene ESS/ADR;
7. Evidence.

## 12. Next Gate

Folgephase nur freigeben, wenn alle `REQUIRED` Tests/Mutationen `VERIFIED PASS` sind.

Bei `FAILED`, `INCONCLUSIVE`, fehlender Evidence oder offenem Rollback bleibt die Folgephase blockiert.