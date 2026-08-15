# Snyk Required-Check-Demotion Evidence

Status: **VERIFIED** — Owner-durchgeführt, repository-seitig nachvollzogen
Datum: 2026-08-15
Authority: `docs/adr/ADR-0070-gitguardian-snyk-external-app-integration.md` Abschnitt „Rollback"
Punkt 1, `.github/policies/main-production-protection.expected.json`

## 0. Auslöser

`security/snyk (svenkulessa)` und `code/snyk (svenkulessa)` begannen am 2026-08-15 dauerhaft mit
`state: error` zu antworten:

- `security/snyk`: „You have used your limit of private tests"
- `code/snyk`: „Code test limit reached"

Beide Meldungen sind Snyk-seitige Kontingent-/Billing-Zustände, keine Aussage über den tatsächlichen
Code-Zustand. Da beide Kontexte als Required Checks im `main-production-protection`-Ruleset
standen, konnte **keine** der zu diesem Zeitpunkt offenen Pull Requests mehr gemergt werden,
unabhängig von deren tatsächlichem Inhalt.

## 1. Betroffene Pull Requests (Snapshot zum Zeitpunkt der Meldung)

| PR | Titel | Autor/Provider |
|---|---|---|
| #295 | AES-GCM-Manipulation deterministisch prüfen (Ersatz für #294) | Codex Work / GPT-5 |
| #296 | Buffet Value Check unter TOP Rankings | ChatGPT Work / GPT-5.6 |
| #297 | M8 Policy Equivalence gegen echten Aufrufer (SA3B/SA4) | Claude Code / Sonnet 5 |

Alle drei zeigten identische Snyk-`error`-Stati auf demselben aktuellen `main`-Basisstand
(`6db2661cfc2b99b4ba2ad5890da1f1e6cb95f7e4`), was das Kontingent- statt Code-Problem zusätzlich
bestätigt.

## 2. Owner-Aktion (außerhalb dieser Sitzung)

Der Owner hat direkt im GitHub-Ruleset-Editor `security/snyk` und `code/snyk` aus dem
Required-Status-Checks-Set der `main-production-protection`-Ruleset entfernt. Diese Sitzung hat
diese Mutation **nicht** selbst durchgeführt (keine Berechtigung/kein Zugriff auf Repository-Rulesets
über verfügbare Tools) und auch keinen Snyk-Token/Wert je gelesen oder verändert.

## 3. Repository-seitige Nachvollziehung (diese Sitzung)

- `.github/policies/main-production-protection.expected.json`: `security/snyk (svenkulessa)` und
  `code/snyk (svenkulessa)` aus `required.required_status_checks` entfernt; neuer Eintrag
  `decision_2026-08-15` dokumentiert Grund und Referenzen.
- `docs/adr/ADR-0070-gitguardian-snyk-external-app-integration.md`: Nachtrag 2026-08-15 hinzugefügt
  — referenziert explizit, dass dies der im ADR selbst vorgesehene Rollback-Schritt 1 ist, keine
  Abweichung vom dokumentierten Vorgehen.
- Für #295, #296 und #297: jeweils geschlossen (mit Supersession-Kommentar) und eine neue Pull
  Request vom **identischen Branch/Commit** eröffnet (kein Codeunterschied), um eine saubere
  Status-Check-Auswertung unter dem aktualisierten Ruleset zu erhalten:

  | Alt (geschlossen) | Neu | Branch |
  |---|---|---|
  | #295 | #300 | `hotfix/deterministic-secret-ciphertext-tamper-test-v2` |
  | #296 | #299 | `feat/sidebar-buffet-value-unter-top-rankings` |
  | #297 | #298 | `claude/security-audit-environment-update-i7lvfm` |

  Hinweis: der Head-Branch von #295 wurde vom Repository automatisch beim Schließen gelöscht
  (Automatically-delete-head-branches-Einstellung greift offenbar auch bei einem reinen Close, nicht
  nur bei Merge). Er wurde read-only exakt auf denselben Commit `e044f18b6bc55943c831700f1dc4466a3a42e6f2`
  aus `refs/pull/295/head` wiederhergestellt, bevor #300 eröffnet wurde — keine Inhaltsänderung.

## 4. Was dies NICHT bedeutet

- Snyk als Sicherheitswerkzeug bleibt aktiv (App-Integration, Repository-Scanning); nur die
  Merge-blockierende Required-Check-Bindung wurde entfernt.
- `GitGuardian Security Checks` bleibt unverändert Required Check, unbeeinflusst von dieser Änderung.
- Dies ist keine Schwächung einer bestehenden Sicherheitsinvariante — Snyk wurde nach eigenem
  ADR-0070-Verfahren einst promoviert (2026-08-14) und jetzt nach demselben ADRs eigenem
  Rollback-Verfahren wieder demotet, ausgelöst durch einen reinen Anbieter-Kontingent-Zustand, nicht
  durch einen gefundenen Fehler oder eine Owner-Entscheidung gegen Snyk als Kontrolle.

## 5. Geänderte Dateien

- `.github/policies/main-production-protection.expected.json`
- `docs/adr/ADR-0070-gitguardian-snyk-external-app-integration.md`
- `docs/evidence/security/SNYK_REQUIRED_CHECK_DEMOTION_2026-08-15.md` (diese Datei)
