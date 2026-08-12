# HUMAN / OWNER Pull Request Approval Policy

Status: REQUIRED
Effective from: 2026-08-11
Updated: 2026-08-12
Repository Owner: `SvenKulessa`

## Purpose

Every pull request targeting `main` MUST remain human-visible and MUST receive an explicit current-head Owner review before expensive build/test execution. Agents and workflows may prepare and verify evidence, but they MUST NOT self-approve or merge.

## Kanonischer PR-Body

Jeder Pull Request gegen `main` verwendet `.github/pull_request_template.md`. Der Body erklärt Scope, Risiko, Baseline und maschinelle Evidence, ist aber **keine Human-Autorisierungsquelle**.

Verbindliche Invarianten:

1. Alle nummerierten Abschnitte und maschinenlesbaren Marker bleiben erhalten.
2. Außerhalb der maschinenverwalteten Blöcke enthält der Body keine Checkbox.
3. `CAPITAL_AI_HUMAN_GATE_AUTHORITY: BOT_COMMENT_ONLY` kennzeichnet ADR-0069 als einzige Human-Gate-Autorität.
4. Nur `PR Auto-Status` darf die mit `🤖` markierten Body-Checkboxen aus current-head Evidence setzen.
5. Ein Body-Edit, ein Agentenhinweis oder eine alte Body-Checkbox kann keinen Build autorisieren.

## Human-visible change requirement

Der Owner prüft den vollständigen Diff unter `Files changed` und markiert jede Datei als `Viewed`. GitHub Actions stellt den persönlichen Viewed-Zustand nicht zuverlässig als API-Evidence bereit. Deshalb attestiert der Owner diesen Schritt im head-gebundenen Bot-Kommentar; der Workflow behauptet nicht, den UI-Zustand unabhängig gemessen zu haben.

## Autoritativer Pre-CI Gate

Nach erfolgreichem `PR Governance` erzeugt oder resettet der trusted-main Workflow genau einen Kommentar mit:

- Marker `CAPITAL_AI_HUMAN_GATE`;
- Marker `CAPITAL_AI_HUMAN_GATE_HEAD_SHA` für den exakten aktuellen Head;
- genau den zwei normalisierten Human/Owner-Attestations.

Teure PR-CI darf erst starten, wenn für denselben offenen PR gegen `main` alle Bedingungen erfüllt sind:

1. Kommentar stammt von `github-actions[bot]` und sein Live-Inhalt entspricht dem auslösenden Event.
2. Beide Attestations sind als echte, nicht zitierte und nicht eingezäunte Task-List-Einträge gesetzt.
3. Der Bearbeiter ist `SvenKulessa`.
4. Ein Review von `SvenKulessa` ist an denselben Head gebunden und enthält nach Trim exakt `💪` oder case-insensitiv `okay`.
5. Eine vorhandene `build-and-test`-Reservation für dieselbe `(PR, Head-SHA)`-Identität verhindert einen zweiten Lauf.

Die zwei Attestations bleiben exakt:

1. `Human/Owner: vollständigen PR-Diff geprüft.`
2. `Human/Owner: alle geänderten Dateien im Tab Files changed als Viewed markiert.`

Markdown-Toleranz gilt nur für `[x]`/`[X]`, Zeilenenden und unwesentliche Leerzeichen. Unchecked, zitierte, fenced oder zusätzliche Attestations führen fail-closed zu DENY.

## Check- und Dispatch-Bindung

Nach PASS reserviert das Gate die Checks `Human-/Owner-Verifikation` und `build-and-test` auf dem exakten PR-Head. Jeder eigene Check trägt zusätzlich eine `external_id`, die PR-Nummer, Gate-Kommentar-ID, Zweck und Head-SHA bindet. Name oder SHA allein reichen nicht als Evidence.

`pr-build-and-test.yml` läuft ausschließlich über `workflow_dispatch --ref main` und erhält PR-Nummer, Head-SHA, Kommentar-ID und reservierte Check-ID. Vor Kandidatencode werden PR, Head, Base, Bot-Kommentar, Owner-Review, Check-ID, `external_id`, GitHub-Actions-App und Live-Body/Baseline erneut fail-closed geprüft.

Der Kandidaten-Executor besitzt nur `contents: read`, persistiert keine Checkout-Credentials und kann weder Checks noch PRs, Issues oder Actions schreiben. Ein separater trusted Reporter darf ausschließlich die zuvor verifizierte Check-ID abschließen.

## Reihenfolge und One-Shot

`PR OPEN/UPDATE → Governance → Bot-Kommentar → Files changed/Viewed → current-head Review → zwei Kommentar-Häkchen → genau ein trusted-main build-and-test → separate Human-Merge-Entscheidung`

Ein neuer Commit erzeugt einen neuen Head und invalidiert Review, Kommentar-Attestations und technische Evidence des alten Heads. Ein Retry nach echtem technischen Fehler benötigt grundsätzlich einen korrigierenden Commit; ein manueller Same-Head-Re-run ist nur bei dokumentierter GitHub-/Runner-Infrastrukturstörung zulässig.

## Merge- und Produktionsgrenzen

Grüne Checks autorisieren weder Merge noch Produktionsmutation. Merge bleibt Human/Owner-only und benötigt bei Ausführung über einen AI-Client eine separate ausdrückliche Anweisung für genau diesen PR. Externe Produktionsmutationen benötigen eine eigene scope-bound Autorisierung und verifizierte Rollback-/Post-Mutation-Evidence.

## Owner authentication assurance

GitHub Actions kann Account, Review und Head prüfen, aber kein bestimmtes physisches Gerät oder Passkey-Verfahren beweisen. Eine spätere WebAuthn-/Passkey-Stufe muss Actor, Aktion, Ziel und PR-Head kryptografisch binden; bis dahin darf kein Workflow stärkere Authentisierung behaupten.

## Evidence

Das Evidence-Bündel umfasst:

1. kanonischen PR-Body ohne Human-Checkboxen;
2. sichtbaren Diff und Owner-Attestation zum Viewed-Zustand;
3. bot-authentisierten current-head Gate-Kommentar;
4. current-head Review `💪`/`okay`;
5. PR-/Kommentar-/Head-gebundene Check-`external_id`;
6. genau einen scope-gerechten `build-and-test`-Lauf;
7. separate Human-Merge-Anweisung und resultierenden Merge-Commit.

Diese Policy bleibt mit ADR-0069, PR-Check-Klassifikation, Actions-Budget und Merge-Governance synchron.
