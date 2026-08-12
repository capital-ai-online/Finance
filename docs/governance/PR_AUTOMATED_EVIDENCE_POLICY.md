# PR Automated Evidence Policy

Status: REQUIRED
Version: 1.0.0
Updated: 2026-08-12

## Ziel

Pull Requests sollen für Menschen leicht verständlich bleiben, ohne technische Evidence manuell nachpflegen zu müssen. Manuelle und maschinelle Entscheidungen werden deshalb strikt getrennt.

## Human-only Aktionen

Im kanonischen PR-Template existieren außerhalb maschinenverwalteter Bereiche exakt zwei manuelle Checkboxen:

1. `Human/Owner: vollständigen PR-Diff geprüft.`
2. `Human/Owner: alle geänderten Dateien im Tab Files changed als Viewed markiert.`

Zusätzlich bleibt das current-head Review-Signal `💪` oder `okay` erforderlich. Diese drei Human-Signale dürfen weder durch Agenten noch durch Workflows selbst erzeugt oder als Human-Freigabe simuliert werden.

## Maschinenverwaltete Evidence

Alle weiteren Checkboxen tragen das Präfix `🤖` und liegen ausschließlich zwischen den Markern:

- `CAPITAL_AI_MACHINE_EVIDENCE_START/END`
- `CAPITAL_AI_MACHINE_MERGE_START/END`

Sie dürfen ausschließlich durch den trusted-main Workflow `PR Auto-Status` aus GitHub-/Actions-Evidence gesetzt oder zurückgesetzt werden. Ein manuelles Anklicken ist nicht autoritativ und wird bei der nächsten Status-Synchronisierung überschrieben.

Der Status-Sync bewertet ausschließlich Evidence, die an dieselbe Kombination `(PR-Nummer, aktueller Head-SHA)` gebunden ist. Evidence eines früheren Heads darf keinen technischen Status des neuen Heads auf PASS setzen.

## Trusted-main Ausführung

`PR Auto-Status` wird über `workflow_run` nach `PR Governance` und `CI` ausgeführt. Er checkt ausschließlich den vertrauenswürdigen `main`-Stand aus und führt keinen Code aus dem Kandidaten-Branch mit `pull-requests: write` aus.

Er besitzt nur:

- `actions: read`
- `contents: read`
- `pull-requests: write`

Checkout-Credentials werden nicht persistiert.

## Automatisch bewertete Zustände

Der Workflow synchronisiert insbesondere:

- Diff-basierte D/C/R/M-Klassifikation und Execution Profile;
- aktuellen PR-Head und sichtbare Produktionsbaseline;
- Governance-/Workflow-Security;
- Live-PR-Body-/Baseline-Preflight;
- blocking Repository-Konventionen;
- Software-/Build-Prüfungen;
- Docker-/Runtime-Prüfungen;
- gültige `build-and-test` Primär-/One-Shot-Evidence;
- technische Verifikation des Human-/Owner-Gates;
- technische Check-Bereitschaft für Merge.

Nicht erforderliche Checks dürfen für die erkannte Klasse automatisch als erfüllt markiert werden, müssen dabei aber sichtbar als `nicht erforderlich` erklärt werden.

## Head-Wechsel

Ein neuer Commit erzeugt einen neuen Head-SHA. Beim ersten trusted-main Sync für diesen Head:

1. wird `CAPITAL_AI_SYNC_HEAD_SHA` aktualisiert;
2. werden die beiden Human-Checkboxen zurückgesetzt;
3. werden technische Häkchen ausschließlich aus Evidence des neuen Heads neu berechnet;
4. bleiben Reviews und CI-Evidence früherer Heads historisch sichtbar, aber nicht autoritativ.

Human-Checkboxen dürfen nach erfolgreichem CI auf demselben Head nicht erneut automatisch zurückgesetzt werden.

## Idempotenz und Kosten

Ein Status-Sync darf den PR-Body nur schreiben, wenn sich ein evidenzrelevanter Wert tatsächlich geändert hat. Insbesondere darf ein Zeitstempel allein keine neue Body-Version erzeugen. Dadurch endet die Kette `Body edit → CI metadata run → status sync` deterministisch und erzeugt keinen Workflow-Loop.

## Grenzen

Folgende Regeln werden bewusst nicht als anklickbare Pre-Merge-Checkbox dargestellt:

- Merge benötigt eine separate ausdrückliche Human-Anweisung für den konkreten PR.
- Agenten-/Modell-Selbstfreigabe ist keine Human-Freigabe.
- Fachliche/reviewbezogene Einwände müssen vor Merge geklärt sein.
- Nach erfolgreichem Merge ist der Work-Branch gemäß Branch-Lifecycle-Policy zu löschen.

Für Klasse M bleibt eine externe Produktionsmutation fail-closed. Das technische Häkchen für Mutation darf erst nach verifizierter Mutation-Evidence (`VERIFIED PASS`) automatisch erfüllt werden; eine Checkbox allein erteilt niemals Produktionsrechte.
