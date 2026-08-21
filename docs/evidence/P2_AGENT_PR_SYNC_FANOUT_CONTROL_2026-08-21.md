# P2 Evidence — Agent-PR Main-Sync Fan-out Control

- **Datum:** 2026-08-21
- **Branch:** `agent/ci-cost-control-p0-2026-08-21`
- **Baseline:** `main@5595ec0abe1f1b6755620f3435badbf874d54aba`
- **Governance:** ADR-0036 current-main ancestry; ADR-0073 CI-Konsolidierung / Cost-Control
- **M10:** Passkey-Autorisierung bleibt suspendiert / OFF

## Problem

`sync-agent-pr-branches.yml` lief nach jedem `push` auf `main` und rief die GitHub
Update-Branch-API für jeden offenen Agenten-PR auf. Dabei wurde nicht zwischen Draft- und
review-bereiten PRs unterschieden.

Ein erfolgreicher Update-Branch erzeugt einen neuen PR-Head und damit ein `synchronize`-Event.
Dieses Event startet wiederum die technische CI und die PR-Governance. Bei mehreren langlebigen
Drafts konnte deshalb ein einzelner Main-Merge einen N-fachen sekundären Actions-Fan-out erzeugen,
obwohl diese Drafts noch nicht merge-bereit waren.

## Bestehende Invariante

ADR-0036 / `productionPreflight.mjs` verlangt für merge-bereite PRs weiterhin fail-closed, dass der
aktuelle `main`-Commit im PR-Head enthalten ist. P2 schwächt diese Invariante nicht und ersetzt sie
nicht durch einen synthetischen Status.

## P2 Entscheidung

Die automatische Synchronisierung wird lifecycle-bewusst:

1. **`push` auf `main`:** Nur review-bereite Agenten-PRs werden automatisch synchronisiert.
   Offene Drafts bleiben bewusst unverändert und erzeugen dadurch keine durch Main-Merges
   ausgelösten `synchronize`-CI-Läufe.
2. **`ready_for_review`:** Genau der PR, der den Draft-Status verlässt, wird gezielt mit `main`
   synchronisiert.
3. **`workflow_dispatch`:** Bleibt als expliziter Recovery-/Maintenance-Pfad erhalten und darf
   weiterhin auch Drafts synchronisieren.
4. **Fork-PRs:** Erhalten bei `ready_for_review` keinen write-capable Runner.
5. **Agenten-Allowlist:** Bleibt `agent/*|claude/*|gemini/*|copilot/*|ai/*`.
6. **Base:** Nur PRs gegen `main` sind synchronisierbar.

## Race Control

Vor `update-branch` wird der beobachtete `headRefOid` als 40-stelliger SHA validiert und als
`expected_head_sha` an die GitHub API übergeben.

GitHub dokumentiert für diesen Parameter fail-closed Verhalten: Stimmt der beobachtete SHA nicht
mehr mit dem aktuellen PR-Head überein, antwortet die API mit `422 Unprocessable Entity`. P2
behandelt `422` als „bereits aktuell / Head inzwischen geändert / Update läuft“ und startet keinen
zweiten konkurrierenden Sync.

Dadurch kann ein paralleler Commit nicht durch einen auf veraltetem Zustand basierenden
Update-Branch-Aufruf überholt werden.

## Stack-403-Härtung — 2026-08-22

Beim Übergang von PR #474 in den Review-Zustand antwortete GitHubs Update-Branch-API trotz
korrekter Repository-Schreibrechte mit dem spezifischen Fehler:
`403 Updating a stacked PR's branch via this endpoint is not supported.`

Der Befund entstand aus der temporären Stack-Repräsentation #471 → #474 und ist **kein**
Produktions-Baseline-, Permission- oder Scoring-Fehler. Die PR-Governance von #474 selbst war grün.
Die Produktions-Baseline bildete währenddessen korrekt den damals noch laufenden Render-Rollout ab.
Nach dem Deployment von Merge #474 war `Production = main@7047f1f1993e0b79589e0790bb855000534b0638`.

Die Sync-Policy behandelt deshalb ausschließlich die Kombination aus

- HTTP `403` **und**
- der exakten GitHub-Meldung `Updating a stacked PR's branch via this endpoint is not supported`

als nicht-fatalen Plattformzustand. Ein generischer `403`, ein anderer API-Fehler oder ein
unbekannter Fehler bleibt weiterhin fail-closed und beendet den Workflow mit Fehler.

Wichtig: Die Änderung führt **keinen** alternativen Merge-, Rebase- oder Stack-Auflösungsmechanismus
ein. Wenn GitHub `update-branch` für den Stack nicht unterstützt, wird kein Auto-Sync ausgeführt.
ADR-0036 / `productionPreflight.mjs` erzwingt vor einer merge-bereiten PR weiterhin, dass der
aktuelle `main` vollständig im PR-Head enthalten ist. Damit bleibt die bestehende Single Authority
für Baseline-/Main-Ancestry unverändert.

## Concurrency

Main-Push-/Manual-Synchronisationen nutzen weiterhin eine gemeinsame `main`-Concurrency-Gruppe.
Ein `ready_for_review`-Event nutzt dagegen eine PR-spezifische Gruppe. Damit kann die gezielte
Synchronisierung eines einzelnen PRs keinen laufenden repository-weiten Main-Sync für andere
review-bereite PRs abbrechen.

## Security

- explizite Workflow-Permissions: `contents: write`, `pull-requests: write`;
- diese Schreibrechte sind für GitHubs Update-Branch-API erforderlich;
- kein `pull_request_target`;
- keine externen Actions / kein unpinned `uses:`;
- keine Secrets, Render-, Stripe- oder Supabase-Mutation;
- keine Änderung der M10-, Merge-, Required-Check- oder Deployment-Authority;
- Stack-403-Ausnahme ist message- und statusgebunden; generische `403` bleiben fail-closed.

## Regressionstest

`tests/unit/agentPrBranchSyncCostControl.test.ts` fixiert statisch:

- `push: main`, `ready_for_review` und manuellen Recovery-Pfad;
- Fork-Runner-Guard;
- Draft-Skip ausschließlich bei automatischem Main-Push;
- Single-PR-Scope beim Übergang aus Draft;
- Agenten-Allowlist und Base=`main`;
- `headRefOid` / `expected_head_sha`-Bindung;
- exakte Stack-403-Erkennung ohne generisches 403-Bypass;
- getrennte Concurrency für Main-Sync und Ready-PR;
- keine externen Actions.

## Erwartete Kostenwirkung

Bei `D` offenen Draft-Agenten-PRs und `R` review-bereiten Agenten-PRs reduziert ein Main-Merge die
automatisch erzeugten Update-Branch-Synchronisationen von ungefähr `D + R` auf `R`.

Der große Nutzen entsteht bei langlebigen Drafts während paralleler Entwicklung: Sie werden nicht
mehr nach jedem Main-Merge künstlich mit einem neuen Head versehen und lösen dadurch nicht erneut
CI + Governance aus.

Die Stack-403-Härtung verhindert zusätzlich einen irreführenden fehlgeschlagenen Workflow-Lauf,
wenn GitHub die Update-Branch-Operation aufgrund der eigenen Stack-Repräsentation ablehnt. Sie
startet keinen Ersatzlauf und erzeugt dadurch keinen zusätzlichen CI-Fan-out.

## Bewusst nicht Bestandteil dieses P2-Schritts

Die Produktionskette in `ci.yml` bleibt unverändert:

`build-and-test -> supply-chain-attestation -> deploy-production -> verify-deployment-identity`.

Eine spätere Konsolidierung dieser Main-Push-Runner ist technisch möglich, darf aber erst nach
separater Evidence erfolgen, dass Provenance-Signatur, Production-Environment-Grenze und
post-deploy Exact-SHA-Verifikation ohne Permission-Ausweitung erhalten bleiben.

## Rollback

Für einen isolierten Rollback der Stack-403-Härtung werden die spezifische 403-Behandlung und der
zugehörige Regressionstest revertiert. Der bestehende Update-Branch-Pfad, ADR-0036,
`productionPreflight.mjs`, `ci.yml`, `pr-governance.yml`, M10 und die Production-Deployment-Kette
bleiben unverändert.
