# ADR-0069 — Human/Owner Comment Gate und dispatch-basierte PR-CI

- **Status:** ACCEPTED — korrigiert nach Bootstrap-Evidence
- **Datum:** 2026-08-12
- **Scope:** Pull-Request-Governance und CI

## Kontext

PR #235 hat gezeigt, dass Task-Checkboxen im Pull-Request-Body zwar gespeichert werden, aber nicht zuverlässig einen `pull_request: edited`-Actions-Run erzeugen. Damit ist der PR-Body kein belastbarer Event-Transport für das Human-Gate.

PR #236 hat den ersten trusted-main Bootstrap eingeführt. Die reale Ausführung danach lieferte zwei zusätzliche Befunde:

1. Der `workflow_run`-Seed scheiterte bei einer zusätzlichen Pull-Request-API-Abfrage mit `HTTP 403 Resource not accessible by integration`, obwohl der für das Seeding notwendige PR-/Head-Kontext bereits im `workflow_run`-Payload vorhanden war.
2. Ein `workflow_dispatch --ref main` führt den vertrauenswürdigen Workflow auf `main` aus. Sein normaler Actions-Job-Check ist deshalb nicht automatisch der Required Check des PR-Head-SHA. Der Build muss seine Evidence explizit an den freigegebenen PR-Head binden.

GitHub stellt für Kommentare auf Pull Requests das Ereignis `issue_comment: edited` bereit. `workflow_run` erlaubt eine privilegierte trusted-main Folgestufe, ohne Kandidatencode mit Schreibrechten auszuführen. Die Checks API kann Check-Runs an einen konkreten `head_sha` binden. Die bestehende Finance-Policy verbietet `pull_request_target` in geänderten Workflows.

## Entscheidung

1. `PR Governance` bleibt der erste PR-Sicherheitslauf.
2. Ein trusted-main `workflow_run` auf `PR Governance` erzeugt oder resettet einen Human-Gate-Kommentar anhand der bereits im Event-Payload enthaltenen PR-Nummer, Base und Head-SHA. Das Seeding hat keine zusätzliche PR-API-Bootstrap-Abhängigkeit.
3. Der Seed-Job erhält nur die für Kommentar-Synchronisierung erforderlichen Schreibrechte. Kandidatencode wird dort nie ausgeführt.
4. Der Kommentar enthält `CAPITAL_AI_HUMAN_GATE_HEAD_SHA` und genau zwei Human/Owner-Attestations.
5. Erst wenn beide Häkchen gesetzt sind, wird `Human-/Owner-Verifikation` ausgeführt.
6. Die Verifikation akzeptiert nur den erwarteten Owner, einen offenen PR gegen `main`, den aktuellen Head, den unveränderten Live-Kommentar und einen current-head Review mit exakt `💪` oder `okay`.
7. Nach PASS erzeugt der trusted-main Gate-Job zwei explizit an den aktuellen PR-Head gebundene Checks: `Human-/Owner-Verifikation = success` und `build-and-test = in_progress`.
8. Pro `(PR, Head-SHA)` darf höchstens eine `build-and-test`-Reservation existieren. Eine vorhandene Reservation oder Evidence verhindert einen zweiten teuren Build.
9. Danach wird genau ein `workflow_dispatch` von `pr-build-and-test.yml` auf `main` angefordert. Der Dispatch transportiert PR-Nummer, Head-SHA, Approval-Kommentar-ID und die reservierte `build-and-test`-Check-ID.
10. Der Build-Workflow verifiziert Head, Kommentar, Review und Check-Reservation erneut, bevor er Kandidatencode auscheckt.
11. Kandidatencode läuft ausschließlich in einem Job mit `contents: read`. Dieser Job besitzt keine Check-, PR-, Issue- oder Actions-Schreibrechte.
12. Ein separater trusted Reporter mit `checks: write` aktualisiert ausschließlich die zuvor verifizierte `build-and-test`-Check-ID auf dem erwarteten PR-Head auf `success` oder `failure`.
13. Ein neuer Commit erzeugt einen neuen Head und setzt das Human-Gate nach dem folgenden Governance-Run zurück.
14. `MERGE` bleibt Human/Owner-only.

## Sicherheitsinvarianten

- Kein `pull_request_target`.
- Kein Kandidatencode im schreibenden Human-Gate- oder Reporter-Job.
- Checkout im Build nur über den exakt freigegebenen Head-SHA.
- Keine persistierten Checkout-Zugangsdaten.
- Check-Reporting nur für die reservierte Check-ID mit Name `build-and-test`, exakt erwartetem `head_sha` und GitHub-Actions-App-Bindung.
- Ein `(PR, Head-SHA)` erhält höchstens eine Build-Reservation.
- Fehlende, veraltete oder widersprüchliche Human-Evidence führt zu DENY.
- Ein fehlgeschlagener Dispatch oder Build wird als `build-and-test = failure` auf dem PR-Head sichtbar; er darf nicht als PASS maskiert werden.

## Kosteninvariante

Der erste Checkbox-Klick startet keinen Build. Erst der Zustand mit beiden gesetzten Häkchen führt nach erfolgreicher Human-Verifikation zu genau einer Build-Reservation. Duplicate-Edits desselben Heads dürfen keinen zweiten Volltest auslösen.

## Übergang PR #235

Nach Merge der korrigierenden Bootstrap-Stufe wird PR #235 auf den neuen `main`-Stand aktualisiert. Dadurch entsteht ein neuer Head und `PR Governance` läuft erneut. Anschließend muss der Human-Gate-Kommentar mit offenen Häkchen erzeugt werden.

Für diesen neuen Head gilt dann ausschließlich:

1. Files changed prüfen / Viewed setzen.
2. Current-head Review `💪` oder `okay` absenden.
3. Die zwei Human-Gate-Kommentar-Häkchen setzen.
4. `Human-/Owner-Verifikation` muss auf exakt diesem PR-Head PASS werden.
5. `build-and-test` muss auf exakt demselben PR-Head PASS oder FAIL berichten.

Alte Body-Häkchen und alte Check-Evidence dürfen nicht auf einen neuen Head übertragen werden. Der bestehende PR-Body-Checkbox-Trigger in PR #235 wird vor dessen Merge mit dieser Architektur konsolidiert und darf nicht als zweite Autorisierungsquelle bestehen bleiben.

## Rollback

Rollback erfolgt ausschließlich repository-seitig durch einen Human-autorisierten Revert. Ein Rückfall auf nicht verifizierte PR-Body-Checkbox-Trigger oder auf einen Build-PASS am falschen Commit-SHA ist nicht zulässig.
