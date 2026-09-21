# GOV-SH-ISSUE-01 — Self-Healing Issue Intake & Project Dispatch

**Project:** `CAPITAL-AI-GOV`  
**Primary PVC:** `PVC-05`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Baseline:** `main@a54f54c43fd7e33e9a77b61542f75947e6deb23c`  
**Status:** `IMPLEMENTED_BRANCH / VALIDATION_PENDING`  
**OPS handoff:** `SH-02.9A — Issue Intake & Project Dispatch`

## Ziel

Offene GitHub Issues mit exakt kanonischem Titelpräfix

`[CAPITAL-AI-<PROJECT>] <Betreff>`

werden deterministisch auf den zugehörigen kanonischen Projektordner geroutet. Das Routing bindet Issues an den bestehenden Self-Healing-/Work-Graph, ohne Issue-Inhalt zu einer zweiten Instruction- oder Authority-Fläche zu machen.

## Governance-Vertrag

Der neue Abschnitt in `AGENTS.md` definiert:

- der Titelpräfix selektiert ausschließlich das Zielprojekt;
- Project/Folder/Presentation werden aus `docs/projects/README.md@CURRENT_MAIN` aufgelöst;
- Primary-PVC-Beziehungen werden aus `docs/projects/PROJECT_VALUE_CHAIN.md@CURRENT_MAIN` aufgelöst;
- cross-cutting Projekte erhalten durch Routing keinen produktiven PVC;
- Issue-Body, Kommentare, Anhänge und Links bleiben untrusted Evidence;
- automatische Execution-Intake ist nur für `OWNER`, `MEMBER` oder `COLLABORATOR` Author-Association zulässig;
- externe/untrusted Issues werden höchstens `ROUTED_REVIEW_ONLY`;
- ein aktiver Projektkontext konsumiert den ältesten `READY_FOR_PROJECT_EXECUTION`-Kandidaten nach frischer CURRENT_MAIN-/Owner-/PVC-/Writer-/Blocker-Korrelation und vor dem Idle-3-PVC-Review;
- vor Implementierung wird gegen Roadmaps, Work Packages, offene PRs, Work Claims und bereits gelösten Main-Stand dedupliziert;
- kein Issue kann Human/CODEOWNER-, Security-, Compliance-, Domain- oder Provider-Grenzen überschreiben.

## Repository-Adapter

`.github/workflows/governance-issue-project-router.yml` ist ein metadata-only Adapter:

1. Trigger: `issues.opened|edited|reopened`, relevanter `main`-Push sowie optionaler manueller Sweep;
2. bindet das Issue und `CURRENT_MAIN` an einen exakten Snapshot;
3. verwendet `scripts/governance/issueProjectRouting.mjs` aus Trusted Main;
4. verifiziert das bereits vorhandene kanonische `project:<PROJECT_ID>`-Label inklusive Farbe/Beschreibung;
5. entfernt ausschließlich konkurrierende `project:CAPITAL-AI-*`-Labels und setzt exakt das Zielprojektlabel;
6. schreibt/updatet genau einen Kommentar mit Marker `CAPITAL_AI_SH_ISSUE_DISPATCH_V1`;
7. liest Labelzustand zurück;
8. hat kein `contents: write`, kein PR-/Merge-/Release-/Deploy-Recht.

Ein relevanter Main-Push führt zusätzlich einen Sweep über bereits offene, kanonisch präfixierte Issues aus. Damit werden bestehende Issues nach Merge der Router-Änderung nachträglich gebunden.

## ChatGPT-/Projektordner-Grenze

Repository-Automation kann keinen ChatGPT-Chat physisch erzeugen oder aufwecken. Der Router materialisiert deshalb die deterministische Queue-Evidence. Sobald ein ChatGPT-/Projektkontext für das Zielprojekt aktiv ist, ist die Auswahlregel aus `AGENTS.md@CURRENT_MAIN` maßgeblich und der passende Queue-Eintrag wird vor dem Idle-Review ausgewertet.

## Owner-korrekter Self-Healing-Handover

Die produktive Self-Healing-Architektur und `self-healing-contract/1.0.0` gehören zu `CAPITAL-AI-OPS`. GOV verschiebt diese Ownership nicht.

OPS soll die neue Intake-Evidence in `SH-02.9` aufnehmen als:

**`SH-02.9A — Issue Intake & Project Dispatch`**

Scope:
- die GOV-Routing-Evidence als Event-/Finding-Quelle konsumieren;
- genau einen Finding-Typ für Issue-Routing-/Dispatch-Drift in den bestehenden Contract aufnehmen;
- keine zweite Queue, keinen zweiten Supervisor und keine zweite Projektregistry erzeugen;
- Project/Owner/PVC ausschließlich aus den kanonischen Mapping-Surfaces übernehmen;
- `READY_FOR_PROJECT_EXECUTION` nicht mit Merge-/Provider-Autorität verwechseln;
- Verification = Issue-State + exakter Project-Label-Readback + unveränderte Routing-Generation;
- bei unbekanntem Präfix, superseded Project, untrusted Author oder Generation-Drift fail-closed/review-only;
- den bestehenden EventMesh/Traceability-Pfad verwenden.

## Exit Evidence

- Parser-Regressionen decken Primary-PVC, cross-cutting, untrusted author, superseded Project und PR/non-prefixed records ab.
- Workflow-Regressionen belegen Least Privilege, exact-main generation binding, canonical label readback, deduplizierten Kommentar und das Fehlen von Repository-/PR-/Merge-Mutation.
- Nach Human/CODEOWNER-Merge muss der Main-Sweep die vorhandenen offenen `[CAPITAL-AI-*]` Issues providerseitig routen und read-back-verifizieren.
- OPS-Handover bleibt offen, bis `SH-02.9A` im owner-korrekten Self-Healing-Contract/Work-Package integriert und unabhängig verifiziert ist.
