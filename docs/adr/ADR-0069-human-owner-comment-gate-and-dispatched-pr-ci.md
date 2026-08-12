# ADR-0069 — Human/Owner Comment Gate und dispatch-basierte PR-CI

- **Status:** PROPOSED
- **Datum:** 2026-08-12
- **Scope:** Pull-Request-Governance und CI

## Kontext

PR #235 hat gezeigt, dass Task-Checkboxen im Pull-Request-Body zwar gespeichert werden, aber nicht zuverlässig einen `pull_request: edited`-Actions-Run erzeugen. Damit ist der PR-Body kein belastbarer Event-Transport für das Human-Gate.

GitHub stellt für Kommentare auf Pull Requests das Ereignis `issue_comment: edited` bereit. Für die sichere Verkettung von Workflows wird `workflow_dispatch` verwendet. Die bestehende Finance-Policy verbietet `pull_request_target` in geänderten Workflows.

## Entscheidung

1. `PR Governance` bleibt der erste PR-Sicherheitslauf.
2. Ein trusted-main `workflow_run` auf `PR Governance` erzeugt oder resettet einen Human-Gate-Kommentar für den aktuellen PR-Head.
3. Der Kommentar enthält `CAPITAL_AI_HUMAN_GATE_HEAD_SHA` und genau zwei Human/Owner-Attestations.
4. Erst wenn beide Häkchen gesetzt sind, wird `Human-/Owner-Verifikation` ausgeführt.
5. Die Verifikation akzeptiert nur den erwarteten Owner, einen offenen PR gegen `main`, den aktuellen Head und einen current-head Review mit exakt `💪` oder `okay`.
6. Nach PASS wird genau ein trusted-main `workflow_dispatch` von `pr-build-and-test.yml` angefordert.
7. Der Build-Workflow verifiziert Head, Kommentar und Review erneut, bevor er den freigegebenen Head auscheckt.
8. Ein neuer Commit erzeugt einen neuen Head und setzt das Human-Gate nach dem folgenden Governance-Run zurück.
9. `MERGE` bleibt Human/Owner-only.

## Sicherheitsinvarianten

- Kein `pull_request_target`.
- Kein Kandidatencode im schreibenden Human-Gate-Workflow.
- Checkout im Build nur über den exakt freigegebenen Head-SHA.
- Keine persistierten Checkout-Zugangsdaten.
- Ein `(PR, Head-SHA)` erhält höchstens eine Build-Reservation.
- Fehlende oder veraltete Human-Evidence führt zu DENY.

## Kosteninvariante

Der erste Checkbox-Klick startet keinen Build. Erst der Zustand mit beiden gesetzten Häkchen führt über die Human-Verifikation zu genau einem vollständigen `build-and-test`.

## Übergang PR #235

Nach Merge des Bootstrap-PRs wird PR #235 auf den neuen `main`-Stand aktualisiert. Dadurch entsteht ein neuer Head und `PR Governance` läuft erneut. Anschließend wird der neue Human-Gate-Kommentar erzeugt. Nach current-head Review setzt der Owner nur die zwei Kommentar-Häkchen; danach müssen Human-Verifikation und `build-and-test` automatisch folgen.

Der bestehende PR-Body-Checkbox-Trigger in PR #235 wird vor dessen Merge mit dieser Architektur konsolidiert und darf nicht als zweite Autorisierungsquelle bestehen bleiben.

## Rollback

Rollback erfolgt ausschließlich repository-seitig durch einen Human-autorisierten Revert. Ein Rückfall auf nicht verifizierte PR-Body-Checkbox-Trigger ist nicht zulässig.
