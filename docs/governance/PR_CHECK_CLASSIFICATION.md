# Pull Request Check Classification

Status: **REQUIRED**  
Authority: CAPITAL-AI DevelopmentChain  
Companion: `docs/governance/PR_EXECUTION_RIGHTS_CLASSIFICATION.md`

## Zweck

Die Checkklasse beantwortet nur eine Frage: **Welche technischen Prüfungen braucht der tatsächliche PR-Diff?** Sie wird automatisch aus den Changed Files ermittelt. Menschen und Agenten sollen die Klasse nicht aus dem Bauch heraus auswählen.

Die Ausführungsrechte sind davon getrennt. Eine strengere Checkklasse gibt keinem Agenten zusätzliche Rechte.

## Automatische Klassen

| Klasse | Einfache Bedeutung | Automatische Erkennung | Mindestprüfungen |
|---|---|---|---|
| **D** | Nur Dokumentation/Evidence | ausschließlich `docs/**`, `.ai/**` oder Markdown und kein Runtime-/Workflow-Pfad | Owner-Gate, Governance/Security, Docs-Fast-Path, `build-and-test` |
| **C** | Anwendung/Test/Konfiguration | ausführbare Repository-Dateien, aber kein Runtime-/Deployment-Pfad | D-Governance + npm/audit + TypeScript + Tests + Production Build + CSP/Predeploy |
| **R** | Runtime/CI/Dependencies/Deployment | u. a. `Dockerfile`, `.dockerignore`, `package*.json`, `server.ts`, `server/**`, `render.yaml`, `.github/workflows/**`, Runtime-/Docker-Security | C + Workflow-/Docker-/Runtime-Schutzprüfungen |
| **M** | Externer produktiver Side Effect | nicht allein aus Git ableitbar; muss ausdrücklich als externe Mutation deklariert werden | technisch zutreffende D/C/R-Prüfungen + separate Owner-Mutationsfreigabe + Pre/Post Verification + Evidence |

Mehrere Treffer → strengste Klasse. Unklarheit → fail-closed zur strengeren Prüfung.

## Technische Umsetzung

Die Source of Truth ist `classifyPullRequestScope()` in `scripts/pr/lib.mjs`.

- `scripts/pr/renderPullRequestBody.mjs` rendert die Klasse bereits vor der PR-Erstellung.
- `.github/workflows/pr-auto-classification.yml` läuft ausschließlich aus dem vertrauenswürdigen `main` nach dem bestehenden Governance-Workflow. Er liest Changed Files über die GitHub API, führt keinen Kandidatencode aus und aktualisiert den maschinenverwalteten Lern-/Klassifikationsblock.
- `scripts/pr/updatePrClassification.mjs` setzt bei einem neuen Head die beiden Human-/Owner-Attestations wieder zurück.
- `scripts/pr/validatePrBody.mjs` berechnet die Klasse erneut und erkennt veraltete oder manipulierte Klassifikationen.

Die externe Mutation wird über `CAPITAL_AI_EXTERNAL_MUTATION` bzw. einen Work-Claim deklariert. `NONE` bedeutet: dieser PR selbst plant keinen externen produktiven Side Effect. Ein unbekannter Wert wird fail-closed als `PLANNED` behandelt und führt zu M.

## Kostenregel

Die Klassifikation ist zugleich CI-Kostensteuerung:

- D überspringt npm/Test/Build/Docker;
- C führt den normalen Softwarepfad aus;
- R ergänzt nur die wirklich erforderlichen Runtime-/Workflow-/Docker-Prüfungen;
- pro `(PR, Head-SHA)` gilt die One-Shot-Regel für `build-and-test`.

Normative Kostenquelle: `docs/governance/GITHUB_ACTIONS_BUDGET_POLICY.md` mit **15 EUR/Monat** maximalen GitHub-Actions-Zusatzkosten.

## Merge-Regel

Ein PR ist nur merge-bereit, wenn:

1. die automatische Klassifikation zum aktuellen Diff passt;
2. das Execution Profile innerhalb der dokumentierten Rechte liegt;
3. der Human/Owner den aktuellen Head geprüft hat;
4. die erforderlichen Checks erfolgreich sind;
5. eine externe Mutation, falls geplant, separat autorisiert und verifiziert ist;
6. keine P0-reservierte Aktion an einen Agenten delegiert wurde;
7. eine separate ausdrückliche Human/Owner-Anweisung den Merge autorisiert.
