# PR Automated Evidence Policy

Status: REQUIRED
Version: 2.0.0
Updated: 2026-08-12

## Ziel

PR-Bodies bleiben verständliche Status- und Lernartefakte. Human-Autorisierung und maschinelle Evidence werden strikt getrennt und jeweils an `(PR-Nummer, aktueller Head-SHA)` gebunden.

## Human-only Aktionen

Der PR-Body enthält keine Human-Checkbox. Die einzige Autorisierungsquelle ist der von `github-actions[bot]` erzeugte, head-gebundene ADR-0069 Kommentar mit genau zwei Attestations. Zusätzlich ist ein current-head Review von `SvenKulessa` mit exakt `💪` oder `okay` erforderlich.

Agenten und Workflows dürfen diese Signale weder setzen noch simulieren. Ein neuer Head wird ausschließlich durch den Kommentar-Gate-Workflow zurückgesetzt; der Body-Sync verändert keine Human-Evidence.

## Maschinenverwaltete Evidence

Alle Body-Checkboxen tragen das Präfix `🤖` und liegen ausschließlich zwischen:

- `CAPITAL_AI_MACHINE_EVIDENCE_START/END`
- `CAPITAL_AI_MACHINE_MERGE_START/END`

Nur `PR Auto-Status` darf sie aus GitHub-/Actions-Evidence setzen. Evidence früherer Heads, anderer PRs oder nicht passender Check-Identitäten bleibt historisch sichtbar, ist aber nicht autoritativ.

Human- und Build-Checks gelten nur, wenn Name, erfolgreicher Abschluss, GitHub-Actions-App, aktueller `head_sha` und die `external_id` mit PR-Nummer, Gate-Kommentar-ID, Zweck und Head übereinstimmen.

## Trusted-main Ausführung

`PR Auto-Status` läuft über `workflow_run` nach `PR Governance` und `PR Build and Test`. Bei `workflow_dispatch` wird die PR-Nummer fail-closed aus dem kanonisch gequoteten Run-Titel extrahiert und anschließend über Live-PR-/Head-Evidence erneut validiert.

Der Workflow checkt ausschließlich `main` aus, persistiert keine Checkout-Credentials und besitzt nur:

- `actions: read`
- `contents: read`
- `pull-requests: write`

Kandidatencode wird nie mit diesen Schreibrechten ausgeführt.

## Automatisch bewertete Zustände

Der Status-Sync bewertet:

- Diff-basierte D/C/R/M-Klassifikation und aktuellen Head;
- Governance-/Workflow-Security;
- trusted-main Live-Body-/Produktionsbaseline-Preflight;
- Repository-, Software-, Build- und gegebenenfalls Docker-/Runtime-Prüfungen;
- PR-/Kommentar-/Head-gebundene `Human-/Owner-Verifikation`;
- PR-/Kommentar-/Head-gebundene `build-and-test` Evidence;
- externe Produktionsmutation nur bei `VERIFIED PASS` oder als nachweislich nicht erforderlich.

Ein erfolgreicher `build-and-test` Check ist aggregierte Evidence: Der Reporter setzt ihn nur auf PASS, wenn erneute Human-/Check-Validierung, trusted-main Preflight und der gesamte scope-gerechte Executor erfolgreich waren.

## Head-Wechsel

Bei einem neuen Commit:

1. aktualisiert `PR Auto-Status` den Sync-Head und berechnet technische Body-Evidence neu;
2. setzt der separate ADR-0069 Workflow den Bot-Kommentar für den neuen Head zurück;
3. bleiben Reviews, Kommentare und Checks des alten Heads nicht autoritativ.

## Idempotenz und Kosten

Der Sync schreibt den Body nur bei evidenzrelevanter Änderung. Zeitstempel allein erzeugen keinen neuen Body-Stand. PR-Body-Edits starten keine technische CI; der eine teure Lauf entsteht ausschließlich aus dem erfolgreich verifizierten Kommentar-Gate.

## Grenzen

- Merge benötigt eine separate ausdrückliche Human-Anweisung.
- CI- oder Agenten-PASS ist keine Human-Freigabe.
- Fachliche Einwände müssen vor Merge geklärt sein.
- Klasse M bleibt ohne separate Mutationsautorität und Post-Mutation-Evidence fail-closed.
- Nach Merge gilt die Branch-Lifecycle-Policy.
