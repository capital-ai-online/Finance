# PR Baseline Governance Re-Run Threat Model — 2026-08-27

## Status und Bezug

Dieses Addendum ergänzt und korrigiert für die Re-Run-Orchestrierung das bestehende `PR_BASELINE_INTEGRITY_THREAT_MODEL_2026-08-20.md`. Die Baseline-Authority bleibt unverändert `productionPreflight.mjs`; es wird keine zweite Baseline-Quelle und kein neuer Release-/Merge-Authority-Pfad eingeführt.

## Fehlerbild

Der bisherige Ablauf war sicher fail-closed, aber zyklisch falsch:

`pull_request → PR Governance → stale Baseline FAIL → workflow_run → Baseline-Write → Ende`

Der trusted Auto-Refresh schreibt den PR-Body mit dem von GitHub Actions bereitgestellten `GITHUB_TOKEN`. Solche Mutationen erzeugen absichtlich keine rekursive normale `pull_request: edited`-Workflow-Kette. Deshalb blieb der bereits fehlgeschlagene Governance-Run nach erfolgreicher Baseline-Korrektur fehlgeschlagen.

## Zielzustand

`pull_request → PR Governance → stale Baseline FAIL → workflow_run → Baseline-Write → exakter Governance-Re-Run → PASS/FAIL`

Ein zweiter `workflow_run` nach dem Re-Run darf die Baseline erneut berechnen, aber bei identischer Baseline keinen Body-Write und keinen weiteren Governance-Re-Run auslösen.

## Zusätzliche Trust Boundary

Der trusted Default-Branch-Workflow `.github/workflows/pr-production-baseline-refresh.yml` erhält zusätzlich `actions: write`, ausschließlich um den **exakt auslösenden PR-Governance-Run** nach einem tatsächlich erfolgten Baseline-Write erneut zu starten.

Nicht geändert werden:

- `PR Governance` bleibt `pull-requests: read`;
- Candidate-Code erhält keine Schreibrechte und wird nicht als Policy ausgeführt;
- kein `pull_request_target`;
- kein PAT, GitHub-App-Token oder externes Credential;
- kein Merge-, Branch-, Deployment- oder Produktionsmutationsrecht.

## Threats und Kontrollen

### R1 — Beliebige Workflow-Runs mit `actions: write` neu starten

**Kontrolle:** Der Re-Run verwendet ausschließlich `github.event.workflow_run.id`, also die Run-ID des Workflows, der diesen trusted `workflow_run` ausgelöst hat. Der Trigger ist weiterhin auf `PR Governance` und `completed` begrenzt. Zusätzlich muss das Source-Event `pull_request` sein und die Source-Run-PR-Nummer dem autorisierten PR entsprechen.

### R2 — Governance für einen inzwischen anderen PR-Head neu starten

**Kontrolle:** Vor dem Re-Run müssen drei immutable Identitäten übereinstimmen:

1. `workflow_run.head_sha`,
2. der zu Beginn autorisierte PR-Head,
3. der unmittelbar vor Re-Run live gelesene PR-Head.

Jede Abweichung führt fail-closed zum Abbruch.

### R3 — `main` ändert sich zwischen Baseline-Write und Governance-Re-Run

**Kontrolle:** Der exakte trusted-main SHA des Policy-Checkouts wird gebunden. Unmittelbar vor Re-Run wird `main` erneut über die GitHub API gelesen. Bei Abweichung wird kein Re-Run gestartet; ein neuer synchronisierter Snapshot muss die Kette erneut durchlaufen.

### R4 — PR wird geschlossen, retargeted oder Cross-Repository

**Kontrolle:** Vor Re-Run wird erneut geprüft: PR `open`, Base exakt `main`, Head-Repository exakt dieses Repository. Andernfalls fail-closed.

### R5 — Endlosschleife

**Kontrolle:** `updatePrProductionBaseline.mjs` liefert `changed=true` nur bei tatsächlicher Änderung der atomaren Baseline. Der Governance-Re-Run ist strikt an `steps.refresh.outputs.changed == 'true'` gebunden. Beim Folge-`workflow_run` ist die Baseline bereits identisch, `changed=false`, und die Kette endet ohne weiteren Re-Run.

### R6 — Umgehung des fail-closed Validators

**Kontrolle:** Der Re-Run ersetzt den Validator nicht. Er startet denselben bestehenden `PR Governance`-Run erneut. Der Validator liest den aktuellen PR-Body und erzeugt seinen erwarteten Baseline-Snapshot weiterhin aus trusted `main`.

## Negative Tests

Die PR-Test-Suite prüft statisch mindestens:

- `actions: write` nur zusammen mit den weiterhin minimalen `contents: read` und `pull-requests: write` Berechtigungen;
- kein `pull_request_target` und kein `write-all`;
- Re-Run nur bei `refresh.outputs.changed == 'true'`;
- Bindung an PR-Nummer, Source-Run-ID, Head-SHA und main-SHA;
- Verwendung ausschließlich des exakten Actions-Re-Run-Endpunkts für die gebundene Run-ID;
- expliziten No-Op-Pfad bei unveränderter Baseline.

## Residualrisiko

`actions: write` ist stärker als die bisherige `pull-requests: write`-Berechtigung. Das Risiko wird dadurch begrenzt, dass der Token nur im trusted Default-Branch-`workflow_run` existiert und der Re-Run-Zielwert nicht aus Candidate-Text oder Branchdaten gewählt wird, sondern aus der von GitHub gelieferten auslösenden Run-ID. Eine noch feinere native Berechtigung zum ausschließlich einmaligen Re-Run genau dieses Workflows stellt GitHub Actions nicht bereit.

## Rollback

Rollback per Revert der Änderungen an `.github/workflows/pr-production-baseline-refresh.yml`, des fokussierten Orchestrierungs-Tests und dieses Addendums. Die bestehende Baseline-Authority, `validatePrBody.mjs` und der read-only Governance-Pfad bleiben dabei unverändert.
