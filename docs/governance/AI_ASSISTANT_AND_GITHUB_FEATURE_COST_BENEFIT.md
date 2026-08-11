# AI-Assistenz und GitHub-Features — Kosten-Nutzen-Vergleich

Status: DRAFT / Entscheidungsvorlage
Stand: 2026-08-11
Budgetrahmen: `docs/governance/PLATFORM_COST_BUDGET_POLICY.md` — 40 EUR gesamt, davon 20 EUR GitHub
Ausgangslage: GitHub Copilot **Free-Tier aktiv**, kein bezahltes Copilot-Abo

## Teil 1 — Claude ersetzt Copilot

### 1.1 Warum das überhaupt eine Entscheidung ist

Copilot Free ist aktiv, also entsteht heute kein Copilot-Kostenposten. Die Frage ist nicht „was sparen wir", sondern **„welche Assistenzfläche trägt eine Ein-Personen-Entwicklung mit Agenten, ohne den Deckel zu brechen"**. Der Umstieg auf Copilot Pro wäre die naheliegende Alternative — 10 USD/Monat sind vermiedene Kosten, kein realisierter Sparbetrag.

### 1.2 Vergleich der Assistenzflächen

| Option | Kosten | Verbraucht Actions-Minuten? | Fähigkeiten | Bewertung |
| --- | --- | --- | --- | --- |
| **Copilot Free** | 0 USD | nein | 2.000 Completions/Monat, Copilot CLI, eingeschränkte Modellauswahl | **Behalten** als IDE-Fallback |
| **Copilot Pro** | 10 USD/Monat | nein | unbegrenzte Completions, 15 USD AI-Credits, Cloud-Agent, Code Review, Modellauswahl | **Ablehnen** — verdrängt Budget, das der Claude-Fläche fehlt |
| **Copilot Pro+** | 39 USD/Monat | nein | 70 USD Credits, Opus-Zugang, Audit-Logs | **Ablehnen** — allein nahezu der Gesamtdeckel |
| **Claude Code on the web** | im bestehenden Claude-Abo enthalten | **nein** — läuft auf Anthropic-Infrastruktur | vollständige Repo-Sessions, PR-Erstellung, MCP-Anbindung | **Primärfläche** |
| **`anthropics/claude-code-action`** | 0 USD zusätzlich bei Auth über `CLAUDE_CODE_OAUTH_TOKEN` | **ja** | `@claude`-Erwähnungen in Issues/PRs, Automationsläufe, geplante Läufe | **Ergänzung**, minutenbewusst konfigurieren |
| **Claude Managed Code Review** | 15–25 USD **pro Review** | nein | mehrstufige Agenten-Review mit Inline-Kommentaren | **Ablehnen** — siehe 1.3 |

### 1.3 Warum Managed Code Review ausscheidet

Zwei unabhängige Ausschlussgründe:

1. **Verfügbarkeit:** Der Dienst ist auf Claude-Team- und Enterprise-Abonnements beschränkt. Ein Einzelabo qualifiziert nicht.
2. **Kosten:** 15–25 USD pro Review. Ein einziger Review überschreitet das halbe Gesamtbudget; bei „Review bei jedem Push" wäre der Deckel nach dem ersten Arbeitstag erschöpft.

Der funktionale Ersatz ist der Befehl `/code-review` in einer Claude-Code-Sitzung. Er läuft innerhalb des bestehenden Abos, erzeugt keine GitHub-Kosten und deckt denselben Zweck ab — nur eben angestoßen statt automatisch.

### 1.4 Empfohlene Zielkonfiguration

```
Entwicklung        → Claude Code on the web        (0 Actions-Minuten, im Abo)
Review vor Push    → /code-review in der Sitzung   (0 Actions-Minuten, im Abo)
@claude in PR/Issue→ claude-code-action            (nur Actions-Minuten)
IDE-Completions    → Copilot Free                  (0 EUR, Fallback)
```

Diese Kombination deckt jede Fähigkeit ab, für die Copilot Pro in Frage käme, und belastet das GitHub-Teilbudget ausschließlich über Actions-Minuten.

### 1.5 Kostenwirkung von `claude-code-action`

Jeder `@claude`-Aufruf startet einen GitHub-hosted Runner. Bei 0,006 USD/Minute und typischen 3–8 Minuten je Lauf kostet ein Aufruf rund **0,02–0,05 USD** — sofern er nicht ohnehin im Freikontingent liegt.

Verbindliche Konfiguration im Sinne der Actions-Budgetrichtlinie:

- `if: contains(github.event.comment.body, '@claude')` — verhindert Runner-Starts für jeden anderen Kommentar;
- `timeout-minutes` auf Job-Ebene setzen;
- `--max-turns` in `claude_args` begrenzen;
- `concurrency` je Issue/PR, damit parallele Aufrufe sich abbrechen;
- **kein** automatischer Review-Lauf bei jedem Push — das ist genau das in der Budgetrichtlinie §3 verbotene Muster.

### 1.6 Owner-Runbook zur Aktivierung

Diese Schritte kann kein Agent ausführen; sie erfordern Repository-Admin und ein Claude-Konto.

1. **GitHub-App installieren:** `github.com/apps/claude` für `SvenKulessa/Finance` installieren. Die App fordert einen gemeinsamen Berechtigungssatz für alle Claude-GitHub-Funktionen an, darunter Contents, Issues, Pull requests, Actions, Checks und Workflows jeweils mit Schreibrecht. Ein Teilsatz ist nicht wählbar. Wer den Umfang enger halten will, kann stattdessen eine eigene GitHub-App mit nur Contents/Issues/Pull requests anlegen — dann entfallen allerdings die verwalteten Claude-Funktionen.
2. **Abo-Token erzeugen:** lokal `claude setup-token` ausführen.
3. **Secret hinterlegen:** als `CLAUDE_CODE_OAUTH_TOKEN` in den Repository-Secrets. **Kein API-Key**, sonst entstehen Token-Kosten außerhalb des Abos.
4. **Workflow ergänzen** (Folge-PR, CODEOWNERS-pflichtig, siehe 1.7).
5. **Test:** `@claude` in einem Issue-Kommentar.

### 1.7 Fertiger Workflow für den Folge-PR

Bewusst **nicht** Teil dieses PRs: Ohne das Secret aus Schritt 3 schlägt jeder `@claude`-Aufruf fehl. Die Datei gehört erst ins Repository, wenn Schritt 1–3 erledigt sind.

```yaml
name: Claude Code
run-name: Claude-Antwort auf @claude-Erwähnung

on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]

permissions:
  contents: read

concurrency:
  group: claude-${{ github.event.issue.number || github.event.pull_request.number }}
  cancel-in-progress: false

jobs:
  claude:
    if: contains(github.event.comment.body, '@claude')
    runs-on: ubuntu-latest
    timeout-minutes: 15
    permissions:
      contents: write
      pull-requests: write
      issues: write
      id-token: write
      actions: read
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 1
          persist-credentials: false

      - uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          claude_args: |
            --max-turns 12
```

Hinweise für den Folge-PR: Die Action-Referenz ist gemäß `scripts/security/verifyChangedWorkflowSecurity.mjs` zu prüfen — im übrigen Repository werden Actions auf einen Commit-SHA gepinnt, und diese Konvention gilt auch hier. Die erweiterten `permissions` auf Job-Ebene sind bewusst breiter als der repo-weite Default und in der PR-Beschreibung zu begründen.

### 1.8 Sicherheitshinweis

`claude-code-action` prüft vor jedem Lauf, ob der auslösende Account Schreibzugriff hat und kein Bot ist. In einem Ein-Personen-Repository bedeutet das: nur der Owner kann Läufe auslösen. Diese Prüfung ist die eigentliche Schutzschicht — die Workflow-`permissions` allein wären es nicht.

## Teil 2 — GitHub-Features im Kosten-Nutzen-Vergleich

Bewertet gegen dieses Projekt, nicht allgemein. Spalte „Budget" bezieht sich auf das GitHub-Teilbudget von 20 EUR.

| Feature | Kosten | Nutzen hier | Budget | Empfehlung |
| --- | --- | --- | --- | --- |
| Bezahlter Personal-Plan | ~3,70 EUR/Monat | Voraussetzung für Rulesets, Environments, Code Owners auf privaten Repos | −3,70 EUR | **Behalten** |
| Actions (3.000 Min. inkl.) | 0,006 USD/Min darüber | Trägt das gesamte CI- und Deploy-Gate | erwartet 0 | **Behalten**, Limits einhalten |
| Environments + Protection Rules | im Plan | Schließt die Lücke `production_environment.status = owner-admin-handoff-required` | 0 | **Höchste Priorität** |
| Rulesets | im Plan | `main` bereits geschützt; Tag- und Agent-Branch-Rulesets offen | 0 | **Ausbauen** |
| Packages / GHCR (2 GB) | im Plan | Render hält bereits eine GHCR-Registry-Credential vor | 0 | **Prüfen**, ob der Image-Pfad darüber laufen soll |
| Codespaces | Kontingent im Plan, danach 0,18 USD/h | Vorvalidierung vor dem Push spart teurere CI-Läufe | 0 bei Kontingenttreue | **Optional nutzen** |
| Projects | kostenlos | Ersetzt lose Roadmap-Listen, keine CI-Kosten | 0 | **Nutzen** |
| Issues + Templates | kostenlos | OPS-001 und offene Owner-Entscheidungen nachverfolgbar machen | 0 | **Nutzen** |
| Releases + Tags | kostenlos | Passt zu `release:version` / `release:manifest` | 0 | **Nutzen** |
| Dependabot Alerts | kostenlos, auch privat | Schwachstellenmeldungen ohne Plattform-Add-on | 0 | **Aktivieren** |
| Dependabot Security Updates | kostenlos | Automatische Sicherheits-PRs | gering (CI je PR) | **Aktivieren** |
| Dependabot Version Updates | kostenlos, aber CI-wirksam | Jeder PR löst `build-and-test` aus | **Risiko** | **Nur gruppiert und monatlich** |
| Discussions | kostenlos | Kein Nutzen ohne Community | 0 | **Aus lassen** |
| Pages | im Plan | Seite wäre **öffentlich** — Evidence-Offenlegung | 0 | **Ablehnen** |
| Wiki | im Plan | Zweite, nicht registrierte Doku-Fläche | 0 | **Ablehnen** (Hygiene-Policy) |
| Secret Protection | ~19 USD/Committer/Monat | Push Protection für private Repos | **sprengt Teilbudget** | **Ablehnen**, kompensieren |
| Code Security / CodeQL | kostenpflichtig für privat | Statische Sicherheitsanalyse | **sprengt Teilbudget** | **Ablehnen** |
| Merge Queue | n/a | Auf privatem Personal-Repo nicht verfügbar | 0 | **Nicht verfügbar** |
| Größere Runner | kostenpflichtig | — | — | **Gesperrt** (Budgetrichtlinie §3.7) |

### 2.1 Kompensation für Secret Protection

Der Verzicht auf das Add-on ist vertretbar, weil bereits eine engere Kontrolle existiert: `scripts/security/secretFileManifest.ts` führt die 22 erwarteten Secret-Namen und trennt sie sauber vom Repository. Ergänzend sinnvoll — kostenlos und ohne zusätzlichen Workflow:

- ein Gitleaks-Schritt **innerhalb** des bestehenden `build-and-test`-Jobs (kein zweiter Workflow, damit die Budgetrichtlinie §3.1 unverletzt bleibt);
- Prüfung auf versehentlich eingecheckte `.env`-Dateien im selben Schritt.

Wichtig zur Erwartungshaltung: Das ersetzt **kein** Push-Protection. Ein Secret, das committet wurde, ist nach dem Push in der Historie — der Gitleaks-Schritt findet es, verhindert es aber nicht.

### 2.2 GitHub Marketplace

Auswahlkriterium im 40-EUR-Rahmen: **kostenloser Tier, der private Repositories einschließt.** Alles andere ist ohne Umsatz nicht finanzierbar.

| Kandidat | Zweck | Prüfstatus |
| --- | --- | --- |
| Renovate | Abhängigkeits-Updates, feiner steuerbar als Dependabot | Preis für private Repos **zu verifizieren** |
| Dependabot (nativ) | Alerts + Security Updates | kostenlos, **bestätigt** |
| Gitleaks | Secret-Scan im bestehenden CI-Job | quelloffen, als Schritt statt App nutzen |
| Sentry | Laufzeitfehler in Produktion | Free-Tier-Grenzen **zu verifizieren** |
| UptimeRobot o. ä. | Erreichbarkeit von `capital-ai.online` | Free-Tier **zu verifizieren** |

**Belegstatus, ausdrücklich:** Die aktuellen Marketplace-Preise konnten für dieses Dokument **nicht verifiziert** werden — `docs.github.com` ist durch den Egress-Proxy dieser Umgebung gesperrt und die Websuche war zeitweise nicht verfügbar. Die Tabelle ist eine Prüfliste, keine Preisaussage. Vor jeder Beschaffung ist der Preis am Marketplace-Listing zu bestätigen.

Generelle Warnung für dieses Repository: Jede Marketplace-App erhält Repository-Berechtigungen. Bei einem Repository, dessen Evidence-Dokumente Produktions-Identifier enthalten, ist jede zusätzliche App eine Erweiterung der Angriffsfläche. Im Zweifel Action statt App — eine Action läuft im eigenen Workflow ohne dauerhafte Berechtigung.

### 2.3 Was tatsächlich Geld kostet

Bei Einhaltung aller Empfehlungen bleibt im GitHub-Teilbudget genau **ein** Posten: der Planpreis von ~3,70 EUR. Alles Übrige liegt im Freikontingent oder ist abgelehnt. Das ist der Grund, warum Modell B aus `REPOSITORY_VISIBILITY_AND_COLLABORATION_MODELS.md` seinen Kostenvorteil nicht ausspielen kann — es gibt kaum Kosten einzusparen.

## Teil 3 — Verifikationsliste für den Owner

| Prüfpunkt | Wo |
| --- | --- |
| Aktiver Plan und Abrechnungstermin | `github.com/settings/billing` |
| Actions-Freikontingent und Verbrauch | `github.com/settings/billing/summary` |
| Spending Limit mit Stop-Regel | Billing → Spending limits |
| Claude-Abo-Preis | claude.com/pricing (in dieser Umgebung nicht abrufbar) |
| Render-Plan-Kosten | Render-Dashboard |
| Marketplace-Preise der Kandidaten | jeweiliges Listing |

## Verwandte Dokumente

- `docs/governance/GITHUB_PRO_ENABLEMENT_DECISION.md` — M2-Festlegung; dieses Dokument liefert die dort geforderte Kosten-/Nutzen-Bewertung
- `docs/governance/PLATFORM_COST_BUDGET_POLICY.md` — Deckel und Eskalationsregel
- `docs/governance/GITHUB_ACTIONS_BUDGET_POLICY.md` — Run-Limits, verbotene Kostenmuster
- `docs/governance/GITHUB_PRO_ENABLEMENT_PLAN.md` — Umsetzung der Plattformfunktionen
- `docs/governance/REPOSITORY_VISIBILITY_AND_COLLABORATION_MODELS.md` — Modellvergleich
