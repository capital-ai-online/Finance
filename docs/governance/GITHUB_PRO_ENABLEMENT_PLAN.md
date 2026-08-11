# GitHub-Pro-Enablement-Plan — SvenKulessa/Finance

Status: DRAFT / Owner-Entscheidung ausstehend
Stand: 2026-08-11
Repository: `SvenKulessa/Finance` (privat, Default-Branch `main`)
Account: `SvenKulessa` (persönlicher Account, 0 öffentliche Repositories)
Autorität: ergänzt `docs/governance/GITHUB_MAIN_PROTECTION_POLICY.md` und `docs/governance/GITHUB_ACTIONS_BUDGET_POLICY.md`

## 1. Zweck

Dieses Dokument beschreibt, wie die durch das Upgrade auf **GitHub Pro** freigeschalteten Plattformfunktionen sinngetreu auf den bestehenden CAPITAL-AI-Governance-Stack angewendet werden — also nicht als Feature-Sammlung, sondern gezielt auf die bereits dokumentierten, offenen Kontrolllücken.

Der Plan schwächt keine bestehende geschützte Invariante ab. Alle serverseitigen Änderungen sind als **Owner-Handoff** ausgewiesen (siehe Abschnitt 8) und nicht durch einen Agenten ausführbar.

## 2. Verifizierter Ist-Zustand

Direkt am Repository geprüft (2026-08-11):

| Merkmal | Beobachteter Wert |
| --- | --- |
| Sichtbarkeit | `private` |
| Default-Branch | `main` |
| Collaborators | 1 (`SvenKulessa`, Admin) |
| Aktives Ruleset | `main-production-protection` (ID `20609723`) |
| Ruleset-Regeln | PR-Pflicht, Required Check `build-and-test` (strict), Löschschutz, Non-Fast-Forward-Schutz, keine Bypass Actors |
| Required Approvals | `0` (Single-Owner-Ausnahme) |
| Code-Owner-Review erzwungen | nein (CODEOWNERS vorhanden, aber nicht merge-wirksam) |
| Environments | 15 vorhanden, davon keines mit Protection Rules; kein kanonisches `production` |
| Offene Pull Requests | 3 (#182, #184 Draft, #185 Draft) |
| Issues / Projects / Wiki / Pages / Discussions | Issues an, Projects an, Wiki aus, Pages aus, Discussions aus |
| Workflows | `ci.yml`, `pr-governance.yml`, `google-marketing-protected-change.yml`, `open-agent-draft-pr.yml`, `lockfile-remediation.yml`, 2 deaktivierte Hygiene-Workflows |

### 2.1 Abonnement-Status — was belegbar ist und was nicht

Der in dieser Session angebundene GitHub-Connector besitzt **keinen Billing-Scope**. Der Plan-/Abonnementzustand (`plan.name`, Seats, Abrechnungszyklus) ist damit **nicht evidence-grade auslesbar** und wird hier bewusst nicht behauptet.

Belegbar ist ausschließlich **indirekte Funktionsevidenz**, die mit einem aktiven kostenpflichtigen Plan konsistent ist:

1. auf dem **privaten** Repository ist ein Repository-Ruleset aktiv und wirksam;
2. auf dem **privaten** Repository existieren **Draft Pull Requests** (#184, #185) — auf persönlichen Accounts ein Merkmal des kostenpflichtigen Plans;
3. es besteht eine dokumentierte Actions-Budgetsteuerung mit Zusatzkosten (`GITHUB_ACTIONS_BUDGET_POLICY.md`).

**Owner-Verifikation (2 Minuten, nicht delegierbar):**

- `https://github.com/settings/billing` → aktiver Plan, nächster Abrechnungstermin.
- `https://github.com/settings/billing/summary` → Actions-Freikontingent (Pro: 3.000 Minuten/Monat für private Repos) und Packages-Speicher (Pro: 2 GB).
- `https://github.com/SvenKulessa/Finance/settings/environments` → Button „New environment“ mit Protection Rules verfügbar = Pro-Funktionsumfang aktiv.

Erst nach dieser Bestätigung sind die Phasen P1–P4 freizugeben.

## 3. Was Pro für **dieses** Setup konkret löst

Die Zuordnung erfolgt gegen bereits dokumentierte Gaps, nicht gegen den allgemeinen Funktionskatalog.

| Bestehende Lücke (Quelle) | Pro-Hebel |
| --- | --- |
| `production_environment.status = "owner-admin-handoff-required"` (`.github/policies/main-production-protection.expected.json`) | Geschützte **Environments mit Deployment-Branch-Policy und Environment-Secrets** in privaten Repos |
| `deploy-production`-Job nutzt Repo-weites `secrets.RENDER_DEPLOY_HOOK_URL` ohne `environment:`-Bindung (`.github/workflows/ci.yml:159`) | Deploy-Hook wird **environment-scoped**; Zugriff nur aus `main`-Deployments |
| `require_code_owner_review`, `required_review_thread_resolution`, `require_last_push_approval` fehlen (M1-Gap-Evidence) | Review-basierte Branch-/Ruleset-Regeln auf privaten Repos |
| Actions-Budget 15 EUR/Monat unter Druck | Höheres Freikontingent (3.000 statt 2.000 Min.), 60 statt 20 parallele Jobs, Codespaces-Kontingent für lokale Vorvalidierung |
| Kein systematisches Kosten-/Aktivitäts-Monitoring | Repository-Insights (Pulse, Code Frequency, Actions Usage Metrics) auf privaten Repos |

## 4. Ausdrückliche Abgrenzung — was Pro **nicht** enthält

Diese Punkte gehören nicht in den Plan und dürfen nicht als abgedeckt dokumentiert werden:

1. **GitHub Copilot** (inkl. Copilot Code Review, Copilot Agents) — eigenständiges Abonnement, nicht Bestandteil von Pro.
2. **Secret Scanning / Push Protection für private Repositories** — erfordert das kostenpflichtige Add-on *GitHub Secret Protection*. Das repository-eigene `scripts/security/secretFileManifest.ts` bleibt damit die primäre Kontrolle.
3. **Code Scanning / CodeQL für private Repositories** — erfordert *GitHub Code Security*. Für private Repos nicht in Pro enthalten.
4. **Merge Queue** — auf persönlichen privaten Repositories nicht verfügbar. Konsequenz: Der `merge_group`-Trigger in `.github/workflows/pr-governance.yml` läuft dort dauerhaft ins Leere (siehe P3.3).
5. **Größere GitHub-hosted Runner** — Team-/Enterprise-Ebene; zusätzlich durch `GITHUB_ACTIONS_BUDGET_POLICY.md` §3.7 gesperrt.
6. **Private GitHub Pages** — Pro erlaubt Pages *aus* privaten Repos, die veröffentlichte Seite ist jedoch **öffentlich**. Für dieses Evidence-lastige Repository ist das ein Datenabflussrisiko (siehe P4.2).

Ohne Pro ohnehin kostenfrei und deshalb kein Pro-Argument: Dependabot Alerts, Dependency Graph, Dependabot Security & Version Updates, unbegrenzte Collaborators, Projects, Issues.

## 5. Kernrestriktion: Der Single-Owner-Deadlock bleibt bestehen

**Wichtig, damit der Plan nicht falsch priorisiert wird:** GitHub Pro schaltet die Review-Regeln technisch frei, löst aber das in `GITHUB_MAIN_PROTECTION_POLICY.md` beschriebene Grundproblem **nicht**. Bei genau einem Collaborator gilt weiterhin:

- `required_approving_review_count ≥ 1` → der Owner kann seinen eigenen PR nicht approven → **Deadlock**.
- `require_code_owner_review` → Code Owner ist der Autor → **Deadlock**.
- `require_last_push_approval` → setzt eine fremde Approval voraus → **Deadlock**.

Daraus folgt die Reihenfolge des Plans: **Erst die deadlock-freien Härtungen (P1/P2), dann die zweite Reviewer-Identität (P3.1), erst danach die Review-Regeln (P3.2).** Die im Sollvertrag hinterlegte `promotion_condition` bleibt unverändert gültig.

## 6. Phasenplan

### P0 — Verifikation (Owner, ~15 Min., Voraussetzung für alles Weitere)

1. Plan-/Billing-Status gemäß 2.1 bestätigen.
2. Actions-Spending-Limit auf 15 EUR mit aktivierter Hard-Stop-Regel prüfen (`GITHUB_ACTIONS_BUDGET_POLICY.md` §5).
3. Verfügbarkeit von Environment-Protection-Rules im Settings-UI prüfen.
4. Ergebnis als Evidence unter `docs/evidence/` ablegen (Muster: `GITHUB_ENFORCEMENT_STATE_2026-08-10.md`).

**Abbruchkriterium:** Ist Punkt 3 nicht verfügbar, sind P1 und P3.2 nicht durchführbar; der Plan endet nach P2/P4.

### P1 — Kanonisches `production`-Environment (höchster Nutzen)

Schließt die einzige explizit als `owner-admin-handoff-required` markierte Lücke des Sollvertrags.

1. Environment `production` anlegen (`Settings → Environments`).
2. **Deployment branches and tags:** ausschließlich `main`.
3. **Environment secret** `RENDER_DEPLOY_HOOK_URL` dort hinterlegen; anschließend das gleichnamige **Repository-Secret entfernen**, damit der Hook nicht mehr aus beliebigen Workflow-Kontexten erreichbar ist.
4. Optional, aber empfohlen: **Wait timer** (z. B. 5 Min.) als Break-Glass-Fenster vor dem Produktionsdeploy. *Required reviewers* erzeugen im Single-Owner-Fall keinen echten Vier-Augen-Effekt und sind erst nach P3.1 sinnvoll.
5. Repository-Änderung (separater PR, CODEOWNERS-pflichtig): im Job `deploy-production` in `.github/workflows/ci.yml` `environment: production` ergänzen.
6. Die 15 historischen, ungeschützten PR-/Deployment-Environments inventarisieren und nicht mehr benötigte löschen — sie sind aktuell ein unbewerteter Zugriffspfad (`can_admins_bypass=true`, keine Protection Rules).
7. `.github/policies/main-production-protection.expected.json`: `production_environment.status` von `owner-admin-handoff-required` auf den erreichten Zustand fortschreiben — **erst nach** verifizierter Serverkonfiguration.

**Akzeptanzkriterium:** Ein Deploy ist ausschließlich aus `main` über das Environment `production` möglich; der Deploy-Hook ist repository-weit nicht mehr lesbar.

### P2 — Deadlock-freie Ruleset-Härtung

Sofort umsetzbar, ohne zweite Identität:

1. **Required conversation resolution** aktivieren — erzwingt aufgelöste Review-Threads ohne Approval-Pflicht.
2. **Zusätzliche Required Status Checks** aufnehmen, sofern sie für jeden PR deterministisch laufen (Kandidat: der Governance-Check aus `pr-governance.yml`). Vorher gegen die Budgetrichtlinie prüfen: kein zweiter vollständiger Build/Test-Lauf pro Head-SHA.
3. **Dismiss stale reviews on push** aktivieren (heute wirkungslos, aber korrekt vorbereitet für P3).
4. **Tag-Ruleset** für Release-Tags ergänzen (Löschschutz + Non-Fast-Forward), passend zu `release:version` / `release:manifest`.
5. **Ruleset für Agent-Branches** (`agent/*`, `claude/*`, `gemini/*`, `copilot/*`, `ai/*`): Force-Push-Schutz, damit Agenten CI-Evidence nicht nachträglich umschreiben können.

*Bewusst nicht empfohlen:* „Require linear history“ und „Require signed commits“ — beides bricht die aktuelle Merge-Commit-Praxis bzw. die Agenten-Commit-Kette und benötigte eine eigene ADR-Entscheidung.

### P3 — Vier-Augen-Prinzip real herstellen

1. **Zweite unabhängige Reviewer-Identität** einrichten (zweiter menschlicher Account oder dedizierte, nicht agentengesteuerte Identität) und als Collaborator hinzufügen. Auf privaten Repos sind Collaborators unbegrenzt und kostenfrei.
2. Erst danach im Ruleset aktivieren: `required_approving_review_count = 1`, `require_code_owner_review = true`, `require_last_push_approval = true`. Damit wird die bestehende, sehr detaillierte `CODEOWNERS` erstmals **merge-wirksam** — das ist der eigentliche Sicherheitsgewinn.
3. `merge_group`-Trigger in `.github/workflows/pr-governance.yml` bewerten: Da Merge Queue hier nicht verfügbar ist, entweder entfernen (Klarheit) oder mit einem Kommentar als bewusste Vorbereitung für einen späteren Organisations-Umzug kennzeichnen.
4. **Auto-Merge** aktivieren (`Settings → General → Allow auto-merge`): PRs mergen automatisch, sobald alle Required Checks grün sind. Das reduziert unnötige Re-Runs und Statuskosmetik im Sinne von `GITHUB_ACTIONS_BUDGET_POLICY.md` §3.3.

### P4 — Kontingente und Sichtbarkeit nutzen

1. **Actions-Kostenreduktion** (unabhängig vom Plan, aber budgetentscheidend): `ci.yml` kompiliert Git 2.55.0 bei jedem Lauf aus der Quelle, weil der Runner-Standard abweicht. Das kostet in jedem einzelnen PR-Lauf Minuten aus einem 30-Minuten-Budget. Zu prüfende Optionen: `actions/cache` auf `/opt/git-2.55.0`, Vorabprüfung ob die geforderte Version bereits verfügbar ist, oder ADR-gestützte Absenkung der Versionsanforderung. **Änderung an `.github/workflows/**` ist CODEOWNERS-pflichtig und braucht einen eigenen PR.**
2. **GitHub Pages: bewusst NICHT aktivieren.** Pro erlaubt Pages aus privaten Repos, veröffentlicht die Seite jedoch öffentlich. Bei `docs/evidence/`, `docs/governance/` und Render-/Supabase-Konfigurationsdetails wäre das eine Offenlegung. Falls später eine öffentliche Präsenz gewünscht ist: separates öffentliches Repository, kein Pages-Build aus diesem Repo.
3. **Wiki: bewusst ausgeschaltet lassen.** Ein Wiki wäre eine zweite, nicht registrierte Dokumentationsfläche und widerspräche `DOCUMENTATION_HYGIENE_POLICY.md` (Registry-Pflicht, kanonische Ordner).
4. **Insights nutzen:** `Insights → Actions Usage Metrics` als monatliche Datenquelle für die Budget-Review nach `GITHUB_ACTIONS_BUDGET_POLICY.md` §9.
5. **Codespaces** (Pro-Kontingent) als Vorvalidierungsumgebung: `npm run lint`, `npm test`, `npm run repository:validate` vor dem Push ausführen. Jeder dort gefundene Fehler spart einen kostenpflichtigen Remote-CI-Lauf.
6. **Dependabot** (kostenfrei) aktivieren: Alerts und Security Updates sofort; Version Updates ausschließlich **gruppiert und monatlich**, da jeder Dependabot-PR CI-Minuten verbraucht.

## 7. Bewusst nicht im Plan

- Kein Wechsel der Repository-Sichtbarkeit auf `public`, um kostenfreie Public-Features (CodeQL, Secret Scanning, Merge Queue) zu erhalten. Das Repository enthält Governance-, Deployment- und Evidence-Artefakte; die Kostenersparnis rechtfertigt die Offenlegung nicht.
- Keine Erweiterung der GitHub-App-Berechtigungen allein zu Dokumentationszwecken (konsistent zur M0-Entscheidung `M0-B04`).
- Keine automatisierte Änderung von Billing, Spending Limit oder Plan durch einen Agenten (`GITHUB_ACTIONS_BUDGET_POLICY.md` §5).

## 8. Handoff-Matrix

| Schritt | Ausführbar durch Agent | Owner-Handoff erforderlich |
| --- | --- | --- |
| P0 Verifikation | nein | ja (Billing/Settings) |
| P1.1–P1.4, P1.6 Environments/Secrets | nein | ja |
| P1.5 `environment:` in `ci.yml` | ja, per PR | Review/Merge |
| P1.7 Sollvertrag fortschreiben | ja, per PR | Review/Merge nach Serververifikation |
| P2 Ruleset-Regeln | nein | ja |
| P3.1 Reviewer-Identität | nein | ja |
| P3.2 Review-Regeln | nein | ja |
| P3.3 `merge_group`-Bereinigung | ja, per PR | Review/Merge |
| P3.4 Auto-Merge | nein | ja |
| P4.1 CI-Optimierung | ja, per PR | Review/Merge |
| P4.2–P4.4 Pages/Wiki/Insights | nein | ja |
| P4.5 Codespaces | ja | — |
| P4.6 Dependabot | teilweise (`dependabot.yml` per PR) | Alerts-Aktivierung: ja |

## 9. Empfohlene Reihenfolge

1. **P0** (Voraussetzung)
2. **P1** — größter Sicherheitsgewinn, schließt die einzige offen markierte Sollvertragslücke
3. **P4.1 + P4.6** — Budgetentlastung, bevor zusätzliche Required Checks Kosten erzeugen
4. **P2** — Ruleset-Härtung ohne Deadlock-Risiko
5. **P3** — echtes Vier-Augen-Prinzip, sobald eine zweite Identität existiert
6. **P4 Rest** — Monitoring und Arbeitsumgebung

## 10. Offene Owner-Entscheidungen

1. Wird eine zweite Reviewer-Identität geschaffen? Ohne sie bleiben `CODEOWNERS` und Approval-Regeln dauerhaft wirkungslos.
2. Wird *GitHub Secret Protection* als kostenpflichtiges Add-on beschafft, oder bleibt der Schutz beim repository-eigenen Secret-Manifest?
3. Soll der Produktionsdeploy einen Wait Timer erhalten (Break-Glass-Fenster) oder ohne Verzögerung durchlaufen?
4. Wird die Git-2.55.0-Anforderung in der CI beibehalten (dann Caching) oder per ADR abgesenkt?
